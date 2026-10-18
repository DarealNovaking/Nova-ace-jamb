-- Resolve staged UTME rules to programmes by the stable external key recorded during programme publication.
-- Source is the current live ace.publish_catalog_batch(uuid) definition, with only the programme lookup extended.
CREATE OR REPLACE FUNCTION ace.publish_catalog_batch(p_batch_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'ace', 'auth'
AS $function$
declare
  v_user uuid := auth.uid();
  v_batch ace.catalog_import_batches%rowtype;
  v_source ace.catalog_sources%rowtype;
  r record;
  v_institution_id uuid;
  v_program_id uuid;
  v_topic_id uuid;
  v_syllabus_version_id uuid;
  v_subject_ids uuid[];
  v_published integer := 0;
begin
  if v_user is null or not ace.is_admin_or_editor() then
    raise exception 'Admin/editor access required';
  end if;

  select * into v_batch from ace.catalog_import_batches where id = p_batch_id for update;
  if not found then raise exception 'Import batch not found'; end if;
  if v_batch.status <> 'approved' then raise exception 'Import batch must be approved before publication'; end if;

  select * into v_source from ace.catalog_sources where id = v_batch.source_id;
  if not found or v_source.status <> 'approved' then raise exception 'Catalog source must be approved before publication'; end if;

  if exists (select 1 from ace.catalog_import_rows where batch_id=p_batch_id and validation_status <> 'approved') then
    raise exception 'All import rows must be approved before publication';
  end if;

  if v_batch.dataset_type='institutions' then
    for r in select * from ace.catalog_import_rows where batch_id=p_batch_id order by row_number loop
      insert into ace.institutions (jamb_code,name,institution_type,ownership,state,status,source_url,provenance)
      values (nullif(r.payload->>'jamb_code',''), trim(r.payload->>'name'), r.payload->>'institution_type', nullif(r.payload->>'ownership',''), nullif(r.payload->>'state',''), 'draft', v_source.source_url,
        jsonb_build_object('catalog_source_id',v_source.id,'external_key',r.external_key,'import_batch_id',p_batch_id,'retrieved_at',v_source.retrieved_at))
      on conflict (jamb_code) where jamb_code is not null do update set name=excluded.name,institution_type=excluded.institution_type,ownership=excluded.ownership,state=excluded.state,source_url=excluded.source_url,provenance=excluded.provenance,updated_at=now()
      returning id into v_institution_id;
      if v_institution_id is null then
        select id into v_institution_id from ace.institutions where name=trim(r.payload->>'name') and institution_type=r.payload->>'institution_type' limit 1;
      end if;
      update ace.catalog_import_rows set published_id=v_institution_id where id=r.id;
      v_published := v_published + 1;
    end loop;

  elsif v_batch.dataset_type='programs' then
    for r in select * from ace.catalog_import_rows where batch_id=p_batch_id order by row_number loop
      select id into v_institution_id from ace.institutions where jamb_code=nullif(r.payload->>'institution_external_key','') or id::text=r.payload->>'institution_external_key' limit 1;
      if v_institution_id is null then raise exception 'Institution not found for program row %', r.row_number; end if;
      select id into v_program_id from ace.programs where institution_id=v_institution_id and name=trim(r.payload->>'name') limit 1;
      if v_program_id is null then
        insert into ace.programs (institution_id,jamb_code,name,award_level,duration_years,status,source_url,provenance)
        values (v_institution_id,nullif(r.payload->>'jamb_code',''),trim(r.payload->>'name'),coalesce(nullif(r.payload->>'award_level',''),'degree'),nullif(r.payload->>'duration_years','')::smallint,'draft',v_source.source_url,
          jsonb_build_object('catalog_source_id',v_source.id,'external_key',r.external_key,'import_batch_id',p_batch_id,'retrieved_at',v_source.retrieved_at))
        returning id into v_program_id;
      else
        update ace.programs set jamb_code=coalesce(nullif(r.payload->>'jamb_code',''),jamb_code),award_level=coalesce(nullif(r.payload->>'award_level',''),award_level),duration_years=coalesce(nullif(r.payload->>'duration_years','')::smallint,duration_years),status='draft',source_url=v_source.source_url,provenance=jsonb_build_object('catalog_source_id',v_source.id,'external_key',r.external_key,'import_batch_id',p_batch_id,'retrieved_at',v_source.retrieved_at),updated_at=now() where id=v_program_id;
      end if;
      update ace.catalog_import_rows set published_id=v_program_id where id=r.id;
      v_published := v_published + 1;
    end loop;

  elsif v_batch.dataset_type='utme_rules' then
    for r in select * from ace.catalog_import_rows where batch_id=p_batch_id order by row_number loop
      select id into v_program_id from ace.programs where jamb_code=nullif(r.payload->>'program_external_key','') or id::text=r.payload->>'program_external_key' or provenance->>'external_key'=r.payload->>'program_external_key' limit 1;
      if v_program_id is null then raise exception 'Program not found for UTME rule row %', r.row_number; end if;
      select array_agg(s.id order by s.sort_order) into v_subject_ids
      from ace.subjects s where s.code = any(select jsonb_array_elements_text(r.payload->'required_subject_codes')) and s.active=true;
      if coalesce(array_length(v_subject_ids,1),0) <> jsonb_array_length(r.payload->'required_subject_codes') then raise exception 'One or more UTME subject codes are invalid for rule row %', r.row_number; end if;
      insert into ace.program_utme_rules (season_id,program_id,required_subject_ids,alternative_groups,minimum_optional_subjects,notes,source_url,provenance,status,version)
      values (v_batch.season_id,v_program_id,v_subject_ids,coalesce(r.payload->'alternative_groups','[]'::jsonb),coalesce((r.payload->>'minimum_optional_subjects')::smallint,0),nullif(r.payload->>'notes',''),v_source.source_url,jsonb_build_object('catalog_source_id',v_source.id,'external_key',r.external_key,'import_batch_id',p_batch_id,'retrieved_at',v_source.retrieved_at),'draft',1)
      returning id into v_program_id;
      update ace.catalog_import_rows set published_id=v_program_id where id=r.id;
      v_published := v_published + 1;
    end loop;

  elsif v_batch.dataset_type='syllabus' then
    for r in select * from ace.catalog_import_rows where batch_id=p_batch_id order by row_number loop
      v_syllabus_version_id := nullif(r.payload->>'syllabus_version_id','')::uuid;
      if v_syllabus_version_id is null or not exists (select 1 from ace.syllabus_versions where id=v_syllabus_version_id) then raise exception 'Syllabus version not found for row %', r.row_number; end if;
      if r.entity_type='syllabus_topic' then
        insert into ace.topics (subject_id,name,description,sort_order,active,syllabus_version_id)
        select sv.subject_id,trim(r.payload->>'name'),nullif(r.payload->>'description',''),coalesce((r.payload->>'sort_order')::integer,0),false,v_syllabus_version_id
        from ace.syllabus_versions sv where sv.id=v_syllabus_version_id
        returning id into v_topic_id;
        update ace.catalog_import_rows set published_id=v_topic_id where id=r.id;
      else
        select id into v_topic_id from ace.topics where syllabus_version_id=v_syllabus_version_id and (id::text=r.payload->>'topic_id' or name=trim(r.payload->>'topic_external_key')) limit 1;
        if v_topic_id is null then raise exception 'Topic not found for syllabus subtopic row %', r.row_number; end if;
        insert into ace.subtopics (topic_id,name,description,sort_order,active,syllabus_version_id)
        values (v_topic_id,trim(r.payload->>'name'),nullif(r.payload->>'description',''),coalesce((r.payload->>'sort_order')::integer,0),false,v_syllabus_version_id)
        returning id into v_topic_id;
        update ace.catalog_import_rows set published_id=v_topic_id where id=r.id;
      end if;
      v_published := v_published + 1;
    end loop;
  else
    raise exception 'Unsupported catalog dataset type';
  end if;

  update ace.catalog_import_batches set status='published',updated_at=now(),metadata=metadata || jsonb_build_object('published_by',v_user,'published_at',now(),'published_rows',v_published) where id=p_batch_id;
  return jsonb_build_object('batch_id',p_batch_id,'status','published','published_rows',v_published);
end;
$function$
;

create or replace function ace.validate_catalog_batch(p_batch_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, ace, auth
as $$
declare
  v_user uuid := auth.uid();
  v_batch ace.catalog_import_batches%rowtype;
  v_errors jsonb := '[]'::jsonb;
  r record;
  v_count integer := 0;
  v_seen jsonb := '{}'::jsonb;
  v_source_status text;
  v_season_status text;
  v_key text;
begin
  if v_user is null or not ace.is_admin_or_editor() then
    raise exception 'Admin/editor access required';
  end if;

  select * into v_batch from ace.catalog_import_batches where id = p_batch_id;
  if not found then raise exception 'Import batch not found'; end if;

  select status into v_source_status from ace.catalog_sources where id = v_batch.source_id;
  if v_source_status is null then
    raise exception 'Catalog source not found';
  end if;
  if v_source_status not in ('reviewed','approved') then
    v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',0,'error','Catalog source must be reviewed or approved'));
  end if;

  if v_batch.season_id is not null then
    select status into v_season_status from ace.exam_seasons where id=v_batch.season_id;
    if v_season_status is null then
      v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',0,'error','Season not found'));
    elsif v_season_status in ('archived','closed') then
      v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',0,'error','Imports cannot target a closed or archived season'));
    end if;
  end if;

  for r in select * from ace.catalog_import_rows where batch_id=p_batch_id order by row_number loop
    v_count := v_count + 1;
    if r.entity_type='institution' then
      if v_batch.dataset_type <> 'institutions' then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Entity type does not match batch dataset')); end if;
      if coalesce(length(trim(r.payload->>'name')),0)=0 then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Institution name is required')); end if;
      if r.payload->>'institution_type' not in ('university','polytechnic','college_of_education','other') then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Invalid institution type')); end if;
      if coalesce(length(trim(r.external_key)),0)=0 then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Institution external_key is required')); end if;
    elsif r.entity_type='program' then
      if v_batch.dataset_type <> 'programs' then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Entity type does not match batch dataset')); end if;
      if coalesce(length(trim(r.payload->>'name')),0)=0 then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Program name is required')); end if;
      if coalesce(length(trim(r.payload->>'institution_external_key')),0)=0 then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Program institution_external_key is required')); end if;
      if coalesce(length(trim(r.external_key)),0)=0 then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Program external_key is required')); end if;
      if coalesce(r.payload->>'award_level','degree') not in ('degree','nd','hnd','nce','other') then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Invalid program award_level')); end if;
    elsif r.entity_type='program_utme_rule' then
      if v_batch.dataset_type <> 'utme_rules' then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Entity type does not match batch dataset')); end if;
      if coalesce(length(trim(r.payload->>'program_external_key')),0)=0 then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Program external key is required')); end if;
      if jsonb_typeof(r.payload->'required_subject_codes') <> 'array' then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','required_subject_codes must be an array')); end if;
      if coalesce(jsonb_array_length(r.payload->'required_subject_codes'),0) < 1 then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','At least one required subject code is required')); end if;
      if coalesce(length(trim(r.external_key)),0)=0 then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','UTME rule external_key is required')); end if;
    elsif r.entity_type in ('syllabus_topic','syllabus_subtopic') then
      if v_batch.dataset_type <> 'syllabus' then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Entity type does not match batch dataset')); end if;
      if coalesce(length(trim(r.payload->>'name')),0)=0 then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Syllabus name is required')); end if;
      if r.entity_type='syllabus_subtopic' and coalesce(length(trim(r.payload->>'topic_external_key')),0)=0 then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Syllabus subtopic topic_external_key is required')); end if;
      if coalesce(length(trim(r.external_key)),0)=0 then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Syllabus external_key is required')); end if;
    end if;

    v_key := coalesce(r.entity_type,'') || ':' || coalesce(r.external_key,'#row-'||r.row_number::text);
    if v_seen ? v_key then
      v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Duplicate entity external key in batch'));
    else
      v_seen := v_seen || jsonb_build_object(v_key,true);
    end if;
  end loop;

  update ace.catalog_import_rows cr
  set validation_status = case when exists (select 1 from jsonb_array_elements(v_errors) e where coalesce((e->>'row')::int,0)=cr.row_number) then 'invalid' else 'valid' end,
      validation_errors = coalesce((select jsonb_agg(e) from jsonb_array_elements(v_errors) e where coalesce((e->>'row')::int,0)=cr.row_number),'[]'::jsonb)
  where cr.batch_id=p_batch_id;

  update ace.catalog_import_batches
  set row_count=v_count,
      validation_errors=v_errors,
      status='reviewing',
      updated_at=now()
  where id=p_batch_id;

  return jsonb_build_object('batch_id',p_batch_id,'row_count',v_count,'error_count',jsonb_array_length(v_errors),'errors',v_errors);
end;
$$;

revoke all on function ace.validate_catalog_batch(uuid) from public, anon;
grant execute on function ace.validate_catalog_batch(uuid) to authenticated;

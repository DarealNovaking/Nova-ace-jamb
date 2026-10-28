-- UNAPPLIED installer: creates one fixed-package administrator RPC; stages no content.
begin;
set local lock_timeout='3s';
set local statement_timeout='30s';
create function ace.manage_fcb02_draft(p_action text, p_review_digest text, p_package text)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, pg_temp
set lock_timeout = '3s'
as $executor$
declare
 p jsonb; actual jsonb; new_count integer; changed boolean := false; referenced boolean := false;
 reviewed_digest constant text := 'aa9340d4f81bdf5253c322b14a9a091f8b0cd638a6593fd3805b207ee1453ef3';
begin
 if auth.uid() is null or not ace.is_admin() then raise exception 'Authenticated administrator context required' using errcode='42501'; end if;
 if not exists(select 1 from pg_catalog.pg_roles where rolname=current_user and (rolsuper or rolbypassrls)) then raise exception 'Trusted executor owner required' using errcode='42501'; end if;
 -- Hold authorization until this transaction ends, including concurrent demotion.
 perform 1 from ace.roles where user_id=auth.uid() and role='admin' for share;
 if not found then raise exception 'Authenticated administrator context required' using errcode='42501'; end if;
 if p_action is null or p_action not in ('preview','stage','undo') then raise exception 'Invalid package action' using errcode='22023'; end if;
 if p_review_digest is distinct from reviewed_digest or octet_length(p_package) is distinct from 623737
 or encode(sha256(convert_to(p_package,'UTF8')),'hex') is distinct from reviewed_digest then raise exception 'Reviewed package mismatch' using errcode='22023'; end if;
 p := p_package::jsonb;
 lock table ace.syllabus_versions, ace.topics, ace.subtopics in share row exclusive mode;
 -- Season/subject values are read-only preflight checks, not an approval or mutation.
 -- The authenticated role deliberately has no direct season UPDATE privilege.
 select jsonb_build_object('id',id,'exam_year',exam_year,'name',name,'status',status) into actual
 from ace.exam_seasons where id=(p->'target_season'->>'id')::uuid;
 if actual is distinct from p->'target_season' then raise exception 'Target season drift'; end if;
 select jsonb_agg(jsonb_build_object('id',id,'code',code,'name',name,'active',active) order by id) into actual
 from ace.subjects where id in (select (s->>'id')::uuid from jsonb_array_elements(p->'subjects') s);
 if actual is distinct from p->'subjects' then raise exception 'Subject binding drift'; end if;
 select jsonb_agg(jsonb_build_object('id',v."id",'rights_status',v."rights_status",'season_id',v."season_id",'source_title',v."source_title",'source_url',v."source_url",'status',v."status",'subject_id',v."subject_id",'title',v."title",'version',v."version") order by v.id) into actual
 from ace.syllabus_versions v where season_id=(p->'target_season'->>'id')::uuid and id not in (select (x->>'id')::uuid from jsonb_array_elements(p->'versions') x);
 if actual is distinct from p->'existing_versions' then raise exception 'Preserved version drift'; end if;
 select (select coalesce(jsonb_agg(jsonb_build_object('schema',ns.nspname,'table',rel.relname,'constraint',c.conname,'target',target.relname,'columns',(select jsonb_agg(a.attname order by k.ord) from unnest(c.conkey) with ordinality k(attnum,ord) join pg_catalog.pg_attribute a on a.attrelid=c.conrelid and a.attnum=k.attnum),'target_columns',(select jsonb_agg(a.attname order by k.ord) from unnest(c.confkey) with ordinality k(attnum,ord) join pg_catalog.pg_attribute a on a.attrelid=c.confrelid and a.attnum=k.attnum),'definition',pg_get_constraintdef(c.oid)) order by ns.nspname,rel.relname,c.conname),'[]'::jsonb) from pg_catalog.pg_constraint c join pg_catalog.pg_class rel on rel.oid=c.conrelid join pg_catalog.pg_namespace ns on ns.oid=rel.relnamespace join pg_catalog.pg_class target on target.oid=c.confrelid where c.contype='f' and c.confrelid in ('ace.syllabus_versions'::regclass,'ace.topics'::regclass,'ace.subtopics'::regclass)) into actual;
 if actual is distinct from p->'incoming_foreign_keys' then raise exception 'Foreign-key contract drift; inspect rollback safety'; end if;
 select count(*) into new_count from ace.syllabus_versions where id in (select (x->>'id')::uuid from jsonb_array_elements(p->'versions') x);

 if new_count=0 and p_action='stage' then
 insert into ace.syllabus_versions(id,season_id,subject_id,version,title,source_url,source_title,rights_status,provenance,status,activated_at) select id,season_id,subject_id,version,title,source_url,source_title,rights_status,provenance,status,activated_at from jsonb_populate_recordset(null::ace.syllabus_versions,p->'versions');
 insert into ace.topics(id,subject_id,name,description,sort_order,active,syllabus_version_id) select id,subject_id,name,description,sort_order,active,syllabus_version_id from jsonb_populate_recordset(null::ace.topics,p->'topics');
 insert into ace.subtopics(id,topic_id,name,description,sort_order,active,syllabus_version_id) select id,topic_id,name,description,sort_order,active,syllabus_version_id from jsonb_populate_recordset(null::ace.subtopics,p->'subtopics');
 changed := true; new_count := 25;
 end if;
 if new_count>0 then
 perform 1 from ace.syllabus_versions where id in (select (x->>'id')::uuid from jsonb_array_elements(p->'versions') x) for update;
 select coalesce(jsonb_agg(to_jsonb(t) - 'created_at' - 'updated_at' order by t.id),'[]'::jsonb) into actual from ace.syllabus_versions t where id in (select (x->>'id')::uuid from jsonb_array_elements(p->'versions') x);
 if actual is distinct from p->'versions' then raise exception 'Package row drift in syllabus_versions; no overwrite or deletion permitted'; end if;
 perform 1 from ace.topics where syllabus_version_id in (select (x->>'id')::uuid from jsonb_array_elements(p->'versions') x) for update;
 select coalesce(jsonb_agg(to_jsonb(t) - 'created_at' order by t.id),'[]'::jsonb) into actual from ace.topics t where syllabus_version_id in (select (x->>'id')::uuid from jsonb_array_elements(p->'versions') x);
 if actual is distinct from p->'topics' then raise exception 'Package row drift in topics; no overwrite or deletion permitted'; end if;
 perform 1 from ace.subtopics where syllabus_version_id in (select (x->>'id')::uuid from jsonb_array_elements(p->'versions') x) for update;
 select coalesce(jsonb_agg(to_jsonb(t) - 'created_at' order by t.id),'[]'::jsonb) into actual from ace.subtopics t where syllabus_version_id in (select (x->>'id')::uuid from jsonb_array_elements(p->'versions') x);
 if actual is distinct from p->'subtopics' then raise exception 'Package row drift in subtopics; no overwrite or deletion permitted'; end if;
 referenced := referenced or exists(select 1 from "ace"."flashcards" where "subtopic_id" in (select (x->>'id')::uuid from jsonb_array_elements(p->'subtopics') x));
 referenced := referenced or exists(select 1 from "ace"."flashcards" where "topic_id" in (select (x->>'id')::uuid from jsonb_array_elements(p->'topics') x));
 referenced := referenced or exists(select 1 from "ace"."learning_progress" where "subtopic_id" in (select (x->>'id')::uuid from jsonb_array_elements(p->'subtopics') x));
 referenced := referenced or exists(select 1 from "ace"."learning_progress" where "topic_id" in (select (x->>'id')::uuid from jsonb_array_elements(p->'topics') x));
 referenced := referenced or exists(select 1 from "ace"."questions" where "subtopic_id" in (select (x->>'id')::uuid from jsonb_array_elements(p->'subtopics') x));
 referenced := referenced or exists(select 1 from "ace"."questions" where "topic_id" in (select (x->>'id')::uuid from jsonb_array_elements(p->'topics') x));
 referenced := referenced or exists(select 1 from "ace"."study_plan_items" where "subtopic_id" in (select (x->>'id')::uuid from jsonb_array_elements(p->'subtopics') x));
 referenced := referenced or exists(select 1 from "ace"."study_plan_items" where "topic_id" in (select (x->>'id')::uuid from jsonb_array_elements(p->'topics') x));
 if p_action='undo' then
 if referenced then raise exception 'Referenced draft content; removal refused'; end if;
 delete from ace.subtopics where syllabus_version_id in (select (x->>'id')::uuid from jsonb_array_elements(p->'versions') x);
 delete from ace.topics where syllabus_version_id in (select (x->>'id')::uuid from jsonb_array_elements(p->'versions') x);
 delete from ace.syllabus_versions where id in (select (x->>'id')::uuid from jsonb_array_elements(p->'versions') x);
 changed := true; new_count := 0;
 end if;
 end if;
 if changed then
 insert into ace.audit_events(actor_user_id,event_type,entity_type,metadata)
 values(auth.uid(),case when p_action='stage' then 'syllabus_review_package_staged' else 'syllabus_review_package_removed' end,'syllabus_review_package',jsonb_build_object('review_digest',reviewed_digest,'publication_allowed',false));
 end if;
 return jsonb_build_object('state',case when new_count=0 then 'not_staged' else 'staged' end,
 'can_stage',new_count=0,'can_undo',new_count=25 and not referenced,'changed',changed,
 'versions',case when new_count=0 then 0 else 25 end,'topics',case when new_count=0 then 0 else 214 end,
 'subtopics',case when new_count=0 then 0 else 954 end,'target_year',2027,'publication_allowed',false,'rights_status','pending');
end
$executor$;
alter function ace.manage_fcb02_draft(text,text,text) owner to postgres;
revoke all on function ace.manage_fcb02_draft(text,text,text) from public, anon;
grant execute on function ace.manage_fcb02_draft(text,text,text) to authenticated;
notify pgrst, 'reload schema';
commit;

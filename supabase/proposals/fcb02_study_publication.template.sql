-- UNAPPLIED. Fixed genuine-admin publication/withdrawal; no writes on installation.
begin;
create function ace.manage_fcb02_study_index(p_action text,p_digest text,p_package text)
returns jsonb language plpgsql security definer
set search_path=pg_catalog,pg_temp set lock_timeout='3s'
as $study$
declare
 p jsonb; idx jsonb; actual jsonb; expected jsonb; state text; wanted text; n integer;
 candidate_id uuid := '396d1910-d458-5d5f-8484-380bc8c71919';
 target_season_id uuid := '23fc8eb7-2d2e-474f-b4db-c0a69f22cd62';
 v record; source_hash text; changed boolean:=false;
begin
 if auth.uid() is null or not ace.is_admin() then raise exception 'Authenticated administrator context required' using errcode='42501';end if;
 if current_setting('transaction_isolation')<>'read committed' then raise exception 'Read committed transaction required' using errcode='25001';end if;
 if not exists(select 1 from pg_roles where rolname=current_user and (rolsuper or rolbypassrls))then raise exception 'Trusted executor owner required'using errcode='42501';end if;
 perform 1 from ace.roles where user_id=auth.uid() and role='admin'for share;
 if not found then raise exception 'Authenticated administrator context required'using errcode='42501';end if;
 if p_action is null or p_action not in('check','publish','withdraw')then raise exception 'Invalid study-index action'using errcode='22023';end if;
 if p_digest is distinct from '__DIGEST__' or octet_length(p_package) is distinct from __BYTES__
 or encode(sha256(convert_to(p_package,'UTF8')),'hex')is distinct from p_digest then raise exception 'Reviewed study package mismatch'using errcode='22023';end if;
 p:=p_package::jsonb;idx:=p->'index';
 -- Rare launch operation: serialize every authoring/configuration path before readback.
 lock table ace.exam_seasons,ace.exam_configs,ace.exam_config_subjects,ace.subjects,
 ace.syllabus_versions,ace.topics,ace.subtopics in share row exclusive mode;
 -- Confirm takedown independently of source/lesson drift; republishing still
 -- runs every exact-content check below.
 if p_action='check'
 and(select count(*)from ace.syllabus_versions sv where sv.id in(select(x->>'id')::uuid from jsonb_array_elements(idx->'versions')x)and sv.status='draft'and sv.rights_status='restricted'and sv.activated_at is null)=25
 and not exists(select 1 from ace.topics t where t.syllabus_version_id in(select(x->>'id')::uuid from jsonb_array_elements(idx->'versions')x)and t.active)
 and not exists(select 1 from ace.subtopics st where st.syllabus_version_id in(select(x->>'id')::uuid from jsonb_array_elements(idx->'versions')x)and st.active)
 and exists(select 1 from ace.exam_configs c where c.id=candidate_id and not c.active)then
  return jsonb_build_object('state','withdrawn','changed',false,'digest',p_digest,'versions',25,'topics',(select count(*)from ace.topics t where t.syllabus_version_id in(select(x->>'id')::uuid from jsonb_array_elements(idx->'versions')x)),'concepts',(select count(*)from ace.subtopics st where st.syllabus_version_id in(select(x->>'id')::uuid from jsonb_array_elements(idx->'versions')x)),'source_year',2026);
 end if;
 -- Safety withdrawal remains available after source/content drift. It cannot restore
 -- or delete data, and touches only this fixed candidate's identifiers.
 if p_action='withdraw'then
  if not exists(select 1 from ace.syllabus_versions sv where sv.id in(select(x->>'id')::uuid from jsonb_array_elements(idx->'versions')x))then raise exception 'Study index is not published';end if;
  changed:=exists(select 1 from ace.syllabus_versions sv where sv.id in(select(x->>'id')::uuid from jsonb_array_elements(idx->'versions')x)and(sv.status<>'draft'or sv.rights_status<>'restricted'or sv.activated_at is not null));
  changed:=changed or exists(select 1 from ace.topics t where t.syllabus_version_id in(select(x->>'id')::uuid from jsonb_array_elements(idx->'versions')x)and t.active)
   or exists(select 1 from ace.subtopics st where st.syllabus_version_id in(select(x->>'id')::uuid from jsonb_array_elements(idx->'versions')x)and st.active)
   or exists(select 1 from ace.exam_configs c where c.id=candidate_id and c.active);
  update ace.topics t set active=false where t.active and t.syllabus_version_id in(select(x->>'id')::uuid from jsonb_array_elements(idx->'versions')x);
  update ace.subtopics st set active=false where st.active and st.syllabus_version_id in(select(x->>'id')::uuid from jsonb_array_elements(idx->'versions')x);
  update ace.syllabus_versions sv set status='draft',rights_status='restricted',activated_at=null,
   provenance=sv.provenance||jsonb_build_object('publication_approved',false),updated_at=clock_timestamp()
   where sv.id in(select(x->>'id')::uuid from jsonb_array_elements(idx->'versions')x)and(sv.status<>'draft'or sv.rights_status<>'restricted'or sv.activated_at is not null);
  update ace.exam_configs c set active=false where c.id=candidate_id and c.active;
  if not exists(select 1 from ace.exam_configs c where c.season_id=target_season_id and c.active)
   and not exists(select 1 from ace.syllabus_versions sv where sv.season_id=target_season_id and sv.status='active')then
   update ace.exam_seasons s set status='draft',updated_at=clock_timestamp()where s.id=target_season_id and s.status='active';
  end if;
  if changed then insert into ace.audit_events(actor_user_id,event_type,entity_type,entity_id,metadata)values(auth.uid(),'ace_study_index_withdrawn','study_index',target_season_id,jsonb_build_object('package_digest',p_digest,'candidate_sha256',idx->>'candidate_sha256','scope','Fixed index identifiers; restoration requires complete drift validation'));end if;
  return jsonb_build_object('state','withdrawn','changed',changed,'digest',p_digest,'versions',(select count(*)from ace.syllabus_versions sv where sv.id in(select(x->>'id')::uuid from jsonb_array_elements(idx->'versions')x)),'topics',(select count(*)from ace.topics t where t.syllabus_version_id in(select(x->>'id')::uuid from jsonb_array_elements(idx->'versions')x)),'concepts',(select count(*)from ace.subtopics st where st.syllabus_version_id in(select(x->>'id')::uuid from jsonb_array_elements(idx->'versions')x)),'source_year',2026);
 end if;
 if exists(select 1 from ace.exam_seasons where status='active'and id<>target_season_id)then raise exception 'Another season is active';end if;
 if not exists(select 1 from ace.exam_seasons where id=target_season_id and code='jamb-2027'and exam_year=2027 and status in('draft','active')and starts_at is null and ends_at is null)then raise exception 'Preparation season drift';end if;
 select jsonb_agg(jsonb_build_object('id',s.id,'code',s.code,'name',s.name,'active',s.active)order by s.id)into actual from ace.subjects s where s.id in(select(x->>'id')::uuid from jsonb_array_elements(p->'subjects')x);
 select jsonb_agg(x order by x->>'id')into expected from jsonb_array_elements(p->'subjects')x;
 if actual is distinct from expected then raise exception 'Subject binding drift';end if;
 select to_jsonb(c)-'created_at'-'active'into actual from ace.exam_configs c where c.id=candidate_id;
 if actual is distinct from((p->'config')-'active')or exists(select 1 from ace.exam_configs c where c.season_id=target_season_id and c.id<>candidate_id)then raise exception 'Practice configuration drift';end if;
 select jsonb_agg(to_jsonb(cs)order by cs.subject_id)into actual from ace.exam_config_subjects cs where cs.exam_config_id=candidate_id;
 select jsonb_agg(x order by x->>'subject_id')into expected from jsonb_array_elements(p->'composition')x;
 if actual is distinct from expected then raise exception 'Practice composition drift';end if;
 -- Reconcile the private reviewed source; no rights/status change is made to it.
 select md5(string_agg(t.id::text||':'||md5(jsonb_build_array(t.id,t.subject_id,t.name,t.description,t.sort_order,t.active,t.syllabus_version_id)::text),','order by t.id))into source_hash
 from ace.topics t where t.syllabus_version_id in(select(x->'provenance'->>'source_review_version_id')::uuid from jsonb_array_elements(idx->'versions')x);
 if source_hash is distinct from idx->'source_fingerprints'->>'topics'then raise exception 'Source topic drift';end if;
 select md5(string_agg(s.id::text||':'||md5(jsonb_build_array(s.id,s.topic_id,s.name,s.description,s.sort_order,s.active,s.syllabus_version_id)::text),','order by s.id))into source_hash
 from ace.subtopics s where s.syllabus_version_id in(select(x->'provenance'->>'source_review_version_id')::uuid from jsonb_array_elements(idx->'versions')x);
 if source_hash is distinct from idx->'source_fingerprints'->>'subtopics'then raise exception 'Source concept drift';end if;
 if(select count(*)from ace.syllabus_versions sv where sv.id in(select(x->'provenance'->>'source_review_version_id')::uuid from jsonb_array_elements(idx->'versions')x)and sv.status='draft'and sv.rights_status='pending')<>25 then raise exception 'Private review version drift';end if;
 select md5(string_agg(sv.id::text||':'||md5(jsonb_build_array(sv.id,sv.season_id,sv.subject_id,sv.version,sv.title,sv.source_url,sv.source_title,sv.rights_status,sv.status,sv.activated_at)::text),','order by sv.id))into source_hash from ace.syllabus_versions sv where sv.id in(select(x->'provenance'->>'source_review_version_id')::uuid from jsonb_array_elements(idx->'versions')x);
 if source_hash is distinct from '5082c7d856c33bcfe7dd16edb30eb1ad'then raise exception 'Private review version drift';end if;
 if exists(select 1 from ace.syllabus_versions sv where sv.season_id=target_season_id and sv.status='active'and sv.id not in(select(x->>'id')::uuid from jsonb_array_elements(idx->'versions')x))then raise exception 'Another syllabus is active';end if;
 select count(*)into n from ace.syllabus_versions sv where sv.id in(select(x->>'id')::uuid from jsonb_array_elements(idx->'versions')x);
 state:='absent';
 if n>0 then
  if n<>25 then raise exception 'Partial study index';end if;
  if(select count(*)from ace.syllabus_versions sv where sv.id in(select(x->>'id')::uuid from jsonb_array_elements(idx->'versions')x)and sv.status='active'and sv.rights_status='approved'and sv.activated_at is not null)=25 then state:='published';
  elsif(select count(*)from ace.syllabus_versions sv where sv.id in(select(x->>'id')::uuid from jsonb_array_elements(idx->'versions')x)and sv.status='draft'and sv.rights_status='restricted'and sv.activated_at is null)=25 then state:='withdrawn';
  else raise exception 'Study authorization drift';end if;
  select jsonb_agg(to_jsonb(sv)-'created_at'-'updated_at'-'activated_at'order by sv.id)into actual from ace.syllabus_versions sv where sv.id in(select(x->>'id')::uuid from jsonb_array_elements(idx->'versions')x);
  select jsonb_agg((x-'activated_at')||jsonb_build_object('status',case when state='published'then'active'else'draft'end,'rights_status',case when state='published'then'approved'else'restricted'end,'provenance',(x->'provenance')||jsonb_build_object('publication_approved',state='published','candidate_sha256',idx->>'candidate_sha256','use_basis',p->'use_basis'))order by x->>'id')into expected from jsonb_array_elements(idx->'versions')x;
  if actual is distinct from expected then raise exception 'Study version drift';end if;
  select jsonb_agg(to_jsonb(t)-'created_at'order by t.id)into actual from ace.topics t where t.syllabus_version_id in(select(x->>'id')::uuid from jsonb_array_elements(idx->'versions')x);
  select jsonb_agg(x||jsonb_build_object('active',state='published')order by x->>'id')into expected from jsonb_array_elements(idx->'topics')x;
  if actual is distinct from expected then raise exception 'Study topic drift';end if;
  select jsonb_agg(to_jsonb(s)-'created_at'order by s.id)into actual from ace.subtopics s where s.syllabus_version_id in(select(x->>'id')::uuid from jsonb_array_elements(idx->'versions')x);
  select jsonb_agg(x||jsonb_build_object('active',state='published')order by x->>'id')into expected from jsonb_array_elements(idx->'subtopics')x;
  if actual is distinct from expected then raise exception 'Study concept drift';end if;
 end if;
 if exists(select 1 from ace.exam_configs c where c.id=candidate_id and c.active is distinct from(state='published'))
 or exists(select 1 from ace.exam_seasons s where s.id=target_season_id and(s.status='active')is distinct from(state='published'))then raise exception 'Study activation drift';end if;
 wanted:=case when p_action='publish'then'published'when p_action='withdraw'then'withdrawn'else state end;
 if p_action='withdraw'and state='absent'then raise exception 'Study index is not published';end if;
 if wanted<>state then
  if state='absent'then
   insert into ace.syllabus_versions(id,season_id,subject_id,version,title,source_url,source_title,rights_status,provenance,status,activated_at)select id,season_id,subject_id,version,title,source_url,source_title,rights_status,provenance,status,activated_at from jsonb_populate_recordset(null::ace.syllabus_versions,idx->'versions');
   insert into ace.topics(id,subject_id,syllabus_version_id,name,description,sort_order,active)select id,subject_id,syllabus_version_id,name,description,sort_order,active from jsonb_populate_recordset(null::ace.topics,idx->'topics');
   insert into ace.subtopics(id,topic_id,syllabus_version_id,name,description,sort_order,active)select id,topic_id,syllabus_version_id,name,description,sort_order,active from jsonb_populate_recordset(null::ace.subtopics,idx->'subtopics');
  end if;
  update ace.topics t set active=(wanted='published')where t.syllabus_version_id in(select(x->>'id')::uuid from jsonb_array_elements(idx->'versions')x);
  update ace.subtopics s set active=(wanted='published')where s.syllabus_version_id in(select(x->>'id')::uuid from jsonb_array_elements(idx->'versions')x);
  update ace.syllabus_versions sv set status=case when wanted='published'then'active'else'draft'end,
   rights_status=case when wanted='published'then'approved'else'restricted'end,activated_at=case when wanted='published'then clock_timestamp()else null end,
   provenance=sv.provenance||jsonb_build_object('publication_approved',wanted='published','candidate_sha256',idx->>'candidate_sha256','use_basis',p->'use_basis'),updated_at=clock_timestamp()
   where sv.id in(select(x->>'id')::uuid from jsonb_array_elements(idx->'versions')x);
  if wanted='published'then
   perform ace.activate_exam_config(candidate_id);
   perform ace.activate_exam_season(target_season_id);
  else
   update ace.exam_seasons s set status='draft',updated_at=clock_timestamp()where s.id=target_season_id;
   update ace.exam_configs c set active=false where c.id=candidate_id;
  end if;
  insert into ace.audit_events(actor_user_id,event_type,entity_type,entity_id,metadata)values(auth.uid(),case when wanted='published'then'ace_study_index_published'else'ace_study_index_withdrawn'end,'study_index',target_season_id,jsonb_build_object('package_digest',p_digest,'candidate_sha256',idx->>'candidate_sha256','use_basis',p->'use_basis','previous_state',state));
  state:=wanted;changed:=true;
 end if;
 return jsonb_build_object('state',state,'changed',changed,'digest',p_digest,'versions',case when state='absent'then 0 else 25 end,'topics',case when state='absent'then 0 else 108 end,'concepts',case when state='absent'then 0 else 1167 end,'source_year',2026);
end;
$study$;
alter function ace.manage_fcb02_study_index(text,text,text)owner to postgres;
revoke all on function ace.manage_fcb02_study_index(text,text,text)from public,anon,authenticated;
grant execute on function ace.manage_fcb02_study_index(text,text,text)to authenticated;
notify pgrst,'reload schema';
commit;

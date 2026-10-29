-- Keep required-field and duplicate normalization consistent with String.trim/\s.
create function ace.question_trim(value text)returns text language sql immutable
set search_path=pg_catalog,pg_temp as $$select btrim(value,chr(9)||chr(10)||chr(11)||chr(12)||chr(13)||chr(32)||chr(160)||chr(5760)||chr(8192)||chr(8193)||chr(8194)||chr(8195)||chr(8196)||chr(8197)||chr(8198)||chr(8199)||chr(8200)||chr(8201)||chr(8202)||chr(8232)||chr(8233)||chr(8239)||chr(8287)||chr(12288)||chr(65279))$$;
create function ace.question_normalize(value text)returns text language sql immutable
set search_path=pg_catalog,pg_temp as $$select regexp_replace(lower(ace.question_trim(value)),'['||chr(9)||chr(10)||chr(11)||chr(12)||chr(13)||chr(32)||chr(160)||chr(5760)||chr(8192)||chr(8193)||chr(8194)||chr(8195)||chr(8196)||chr(8197)||chr(8198)||chr(8199)||chr(8200)||chr(8201)||chr(8202)||chr(8232)||chr(8233)||chr(8239)||chr(8287)||chr(12288)||chr(65279)||']+',' ','g')$$;

create function ace.validate_question_draft(p jsonb) returns jsonb
language plpgsql set search_path=pg_catalog,pg_temp as $$
declare item jsonb; proof jsonb; keys text[]; v_year integer; source_kind text;
begin
 if p is null or jsonb_typeof(p)<>'object' or octet_length(p::text)>131072
 or exists(select 1 from jsonb_object_keys(p)k where k not in('subject_id','topic_id','subtopic_id','stem','options','correct_option_key','explanation','difficulty','exam','exam_year','provenance'))then
  raise exception 'Invalid question payload' using errcode='22023';
 end if;
 if jsonb_typeof(p->'stem')is distinct from'string' or length(ace.question_trim(p->>'stem'))not between 1 and 20000
 or jsonb_typeof(p->'explanation')is distinct from'string' or length(ace.question_trim(p->>'explanation'))not between 1 and 20000
 or p->>'difficulty'is null or p->>'difficulty'not in('easy','medium','hard')
 or p->>'exam'is null or p->>'exam'not in('JAMB','ACE practice')
 or jsonb_typeof(p->'options')is distinct from'array' then
  raise exception 'Invalid question content'using errcode='22023';
 end if;
 if jsonb_array_length(p->'options')<>4 then raise exception 'Invalid question options'using errcode='22023';end if;
 for item in select value from jsonb_array_elements(p->'options')loop
  if jsonb_typeof(item)<>'object' or jsonb_typeof(item->'key')is distinct from'string'
  or jsonb_typeof(item->'text')is distinct from'string' or length(ace.question_trim(item->>'text'))not between 1 and 4000
  or exists(select 1 from jsonb_object_keys(item)k where k not in('key','text'))then
   raise exception 'Invalid question option'using errcode='22023';
  end if;
 end loop;
 select array_agg(x->>'key'order by x->>'key')into keys from jsonb_array_elements(p->'options')x;
 if keys is distinct from array['A','B','C','D'] or p->>'correct_option_key'is null or not(p->>'correct_option_key'=any(keys))
 or(select count(distinct ace.question_normalize(x->>'text'))from jsonb_array_elements(p->'options')x)<>4 then
  raise exception 'Invalid question options or answer'using errcode='22023';
 end if;
 proof:=p->'provenance';
 if jsonb_typeof(proof)is distinct from'object' then raise exception 'Invalid question source evidence'using errcode='22023';end if;
 source_kind:=proof->>'source_kind';
 if source_kind is null or source_kind not in('original','licensed','permitted')
 or jsonb_typeof(proof->'source_title')is distinct from'string' or length(ace.question_trim(proof->>'source_title'))not between 1 and 500
 or jsonb_typeof(proof->'author_label')is distinct from'string' or length(ace.question_trim(proof->>'author_label'))not between 1 and 200
 or jsonb_typeof(proof->'rights_evidence')is distinct from'string' or length(ace.question_trim(proof->>'rights_evidence'))not between 1 and 4000
 or exists(select 1 from jsonb_object_keys(proof)k where k not in('source_kind','source_title','author_label','source_url','rights_evidence'))then
  raise exception 'Invalid question source evidence'using errcode='22023';
 end if;
 if proof->>'source_url'is not null and(jsonb_typeof(proof->'source_url')<>'string' or length(proof->>'source_url')>2000 or proof->>'source_url'!~'^https://[a-zA-Z0-9.-]+(:[0-9]+)?(/[^[:space:]]*)?$' or proof->>'source_url'~'[[:cntrl:]]')then
  raise exception 'Invalid question source URL'using errcode='22023';
 end if;
 if source_kind<>'original'and proof->>'source_url'is null then raise exception 'Invalid question source URL'using errcode='22023';end if;
 if p->>'exam_year'is not null then
  if jsonb_typeof(p->'exam_year')<>'number' or p->>'exam_year'!~'^[0-9]{4}$'then raise exception 'Invalid question year'using errcode='22023';end if;
  v_year:=(p->>'exam_year')::integer;
  if v_year<1978 or v_year>extract(year from current_date)then raise exception 'Invalid question year'using errcode='22023';end if;
 end if;
 if source_kind='original'and(p->>'exam'<>'ACE practice'or v_year is not null)then raise exception 'Invalid question original attribution'using errcode='22023';end if;
 if p->>'exam'='JAMB'and v_year is null then raise exception 'Invalid question year'using errcode='22023';end if;
 if p->>'subject_id'is null or p->>'topic_id'is null then raise exception 'Invalid question taxonomy'using errcode='22023';end if;
 perform(p->>'subject_id')::uuid,(p->>'topic_id')::uuid,(p->>'subtopic_id')::uuid;
 return p||jsonb_build_object('stem',ace.question_trim(p->>'stem'),'explanation',ace.question_trim(p->>'explanation'),
  'options',(select jsonb_agg(jsonb_build_object('key',x->>'key','text',ace.question_trim(x->>'text'))order by x->>'key')from jsonb_array_elements(p->'options')x),
  'exam_year',v_year,'subtopic_id',(p->>'subtopic_id')::uuid,
  'provenance',jsonb_build_object('source_kind',source_kind,'source_title',ace.question_trim(proof->>'source_title'),'author_label',ace.question_trim(proof->>'author_label'),
  'source_url',proof->>'source_url','rights_evidence',ace.question_trim(proof->>'rights_evidence')));
exception when invalid_text_representation then raise exception 'Invalid question identifier'using errcode='22023';
end;$$;

create function ace.guard_question_workflow()returns trigger language plpgsql
set search_path=pg_catalog,pg_temp as $$begin
 if tg_op='DELETE'then raise exception 'Question deletion is not supported'using errcode='42501';end if;
 if auth.uid()is null or not exists(select 1 from pg_catalog.pg_roles where rolname=current_user and(rolsuper or rolbypassrls))then
  raise exception 'Use the authorized question workflow'using errcode='42501';
 end if;
 return new;
end;$$;
create trigger question_workflow_guard before insert or update or delete on ace.questions
for each row execute function ace.guard_question_workflow();

create function ace.guard_question_history()returns trigger language plpgsql
set search_path=pg_catalog,pg_temp as $$begin
 raise exception 'Question history is immutable'using errcode='42501';
end;$$;
create trigger question_history_immutable before update or delete on ace.question_versions
for each row execute function ace.guard_question_history();

create function ace.manage_question(p_action text,p_id uuid,p_expected_version integer,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer
set search_path=pg_catalog,pg_temp set lock_timeout='3s' as $$
declare actor uuid:=auth.uid(); actor_role text; q ace.questions%rowtype; data jsonb;
 old_version integer; was_new boolean; reason text; prior jsonb;
begin
 if actor is null then raise exception 'Question authoring permission required'using errcode='42501';end if;
 if current_setting('transaction_isolation')<>'read committed'then raise exception 'Read committed transaction required'using errcode='25001';end if;
 if not exists(select 1 from pg_catalog.pg_roles where rolname=current_user and(rolsuper or rolbypassrls))then raise exception 'Trusted executor owner required'using errcode='42501';end if;
 select role into actor_role from ace.roles where user_id=actor and role in('admin','editor')for share;
 if not found then raise exception 'Question authoring permission required'using errcode='42501';end if;
 if p_action is null or p_action not in('save','submit','approve','reject','publish','withdraw')or p_id is null
 or p_expected_version is null or p_expected_version<0 or p_expected_version>=2147483647 then raise exception 'Invalid question action'using errcode='22023';end if;
 if p_action in('approve','reject','publish','withdraw')and actor_role<>'admin'then raise exception 'Administrator review required'using errcode='42501';end if;
 -- Serializes authoring/duplicate checks. Existing students continue read-only deliveries.
 perform pg_advisory_xact_lock(hashtextextended('ace.question.workflow',0));
 select *into q from ace.questions where id=p_id for update;
 was_new:=not found;old_version:=coalesce(q.content_version,0);
 if old_version<>p_expected_version then raise exception 'Question revision changed; reload before retrying'using errcode='40001';end if;
 if was_new and p_action<>'save'then raise exception 'Question not found'using errcode='P0002';end if;
 prior:=case when was_new then null else to_jsonb(q)end;
 if p_action='save'then
  if not was_new and q.active then raise exception 'Withdraw published question before editing'using errcode='23514';end if;
  if not was_new and q.created_by<>actor and actor_role<>'admin'then raise exception 'Only the author or administrator may edit this question'using errcode='42501';end if;
  data:=ace.validate_question_draft(p_payload);
  q.subject_id:=(data->>'subject_id')::uuid;q.topic_id:=(data->>'topic_id')::uuid;q.subtopic_id:=(data->>'subtopic_id')::uuid;
  q.stem:=data->>'stem';q.options:=data->'options';q.correct_option_key:=data->>'correct_option_key';q.explanation:=data->>'explanation';
  q.difficulty:=data->>'difficulty';q.exam:=data->>'exam';q.exam_year:=(data->>'exam_year')::smallint;
  q.provenance:=(data->'provenance')||jsonb_build_object('last_content_editor',actor);
  q.rights_status:='unknown';q.review_status:='draft';q.reviewed_by:=null;q.active:=false;q.media:='[]';
  if was_new then q.id:=p_id;q.created_by:=actor;q.created_at:=clock_timestamp();end if;
 else
  if p_payload is null or jsonb_typeof(p_payload)<>'object'or exists(select 1 from jsonb_object_keys(p_payload)k where k<>'reason')then raise exception 'Invalid question action payload'using errcode='22023';end if;
  if p_action in('reject','withdraw')then
   reason:=ace.question_trim(p_payload->>'reason');
   if jsonb_typeof(p_payload->'reason')is distinct from'string'or reason is null or length(reason)not between 1 and 2000 then raise exception 'Review reason required'using errcode='22023';end if;
  elsif p_payload<>'{}'::jsonb then raise exception 'Invalid question action payload'using errcode='22023';end if;
  if p_action='submit'then
   if q.review_status not in('draft','rejected')or q.active then raise exception 'Invalid question transition'using errcode='23514';end if;
   if q.created_by<>actor and actor_role<>'admin'then raise exception 'Only the author or administrator may submit this question'using errcode='42501';end if;
   q.review_status:='in_review';q.reviewed_by:=null;
  elsif p_action in('approve','reject')then
   if q.review_status<>'in_review'or q.active then raise exception 'Invalid question transition'using errcode='23514';end if;
   if actor=q.created_by or actor::text=q.provenance->>'last_content_editor'then raise exception 'Independent reviewer required'using errcode='42501';end if;
   q.review_status:=case when p_action='approve'then'approved'else'rejected'end;
   q.rights_status:=case when p_action='reject'then'unknown'when q.provenance->>'source_kind'='original'then'owned'else q.provenance->>'source_kind'end;
   q.reviewed_by:=actor;
  elsif p_action='publish'then
   if q.review_status<>'approved'or q.active or q.reviewed_by is null or q.reviewed_by=q.created_by
   or q.reviewed_by::text=q.provenance->>'last_content_editor'or q.rights_status not in('owned','licensed','permitted')then raise exception 'Invalid question transition'using errcode='23514';end if;
   q.review_status:='published';q.active:=true;
  elsif p_action='withdraw'then
   if not q.active or q.review_status<>'published'then raise exception 'Invalid question transition'using errcode='23514';end if;
   q.review_status:='approved';q.active:=false;
  end if;
 end if;
 if p_action<>'withdraw'then
  -- Lock taxonomy against syllabus/season withdrawal until this transaction commits.
  lock table ace.exam_seasons,ace.syllabus_versions,ace.topics,ace.subtopics,ace.subjects in share mode;
  if not exists(select 1 from ace.topics t join ace.subjects s on s.id=t.subject_id
   join ace.syllabus_versions v on v.id=t.syllabus_version_id join ace.exam_seasons es on es.id=v.season_id
   where t.id=q.topic_id and t.subject_id=q.subject_id and t.active and s.active and v.subject_id=q.subject_id
   and v.status='active'and v.rights_status='approved'and v.activated_at is not null and es.status='active'
   and(q.subtopic_id is null or exists(select 1 from ace.subtopics st where st.id=q.subtopic_id and st.topic_id=t.id and st.syllabus_version_id=v.id and st.active)))then
   raise exception 'Invalid question taxonomy; select an active approved syllabus'using errcode='23514';
  end if;
  if exists(select 1 from ace.questions x where x.id<>p_id and x.subject_id=q.subject_id
   and ace.question_normalize(x.stem)=ace.question_normalize(q.stem))then raise exception 'Duplicate question; edit the existing record'using errcode='23505';end if;
 end if;
 if p_action in('submit','approve','publish')then
  -- Every approval/publication revalidates the complete stored text, not client flags.
  perform ace.validate_question_draft(jsonb_build_object('subject_id',q.subject_id,'topic_id',q.topic_id,'subtopic_id',q.subtopic_id,
   'stem',q.stem,'options',q.options,'correct_option_key',q.correct_option_key,'explanation',q.explanation,'difficulty',q.difficulty,
   'exam',q.exam,'exam_year',q.exam_year,'provenance',q.provenance-'last_content_editor'));
  if q.media<>'[]'::jsonb or exists(select 1 from ace.question_media where question_id=p_id)then raise exception 'Question media requires a reviewed media workflow'using errcode='23514';end if;
 end if;
 q.content_version:=old_version+1;q.updated_at:=clock_timestamp();
 if was_new then
  insert into ace.questions(id,subject_id,topic_id,subtopic_id,stem,options,correct_option_key,explanation,difficulty,exam,exam_year,media,provenance,rights_status,content_version,review_status,active,created_by,reviewed_by,created_at,updated_at)
  values(q.id,q.subject_id,q.topic_id,q.subtopic_id,q.stem,q.options,q.correct_option_key,q.explanation,q.difficulty,q.exam,q.exam_year,q.media,q.provenance,q.rights_status,q.content_version,q.review_status,q.active,q.created_by,q.reviewed_by,q.created_at,q.updated_at);
 else
  update ace.questions set subject_id=q.subject_id,topic_id=q.topic_id,subtopic_id=q.subtopic_id,stem=q.stem,options=q.options,
   correct_option_key=q.correct_option_key,explanation=q.explanation,difficulty=q.difficulty,exam=q.exam,exam_year=q.exam_year,media=q.media,
   provenance=q.provenance,rights_status=q.rights_status,content_version=q.content_version,review_status=q.review_status,active=q.active,reviewed_by=q.reviewed_by,updated_at=q.updated_at where id=p_id;
 end if;
 insert into ace.question_versions(question_id,version,snapshot,created_by)values(p_id,q.content_version,to_jsonb(q),actor);
 insert into ace.audit_events(actor_user_id,event_type,entity_type,entity_id,metadata)
 values(actor,case when p_action='save'then'question_saved'else'question_'||p_action end,'question',p_id,
  jsonb_build_object('revision',q.content_version,'previous_revision',old_version,'previous_status',prior->>'review_status','status',q.review_status,'reason',reason));
 return to_jsonb(q);
end;$$;

create function ace.review_questions(p_status text default null,p_page integer default 0)
returns jsonb language plpgsql security definer
set search_path=pg_catalog,pg_temp set lock_timeout='3s' as $$
declare rows jsonb; actor_role text;
begin
 if auth.uid()is null then raise exception 'Question authoring permission required'using errcode='42501';end if;
 select role into actor_role from ace.roles where user_id=auth.uid()and role in('admin','editor')for share;
 if not found then raise exception 'Question authoring permission required'using errcode='42501';end if;
 if not exists(select 1 from pg_catalog.pg_roles where rolname=current_user and(rolsuper or rolbypassrls))then raise exception 'Trusted executor owner required'using errcode='42501';end if;
 if p_page is null or p_page<0 or p_page>100000 or(p_status is not null and p_status not in('draft','in_review','approved','published','rejected'))then raise exception 'Invalid question page or status'using errcode='22023';end if;
 select coalesce(jsonb_agg(to_jsonb(x)order by x.id desc),'[]')into rows from(
  select *from ace.questions where p_status is null or review_status=p_status order by id desc limit 31 offset p_page*30)x;
 return jsonb_build_object('questions',coalesce((select jsonb_agg(value order by ord)from jsonb_array_elements(rows)with ordinality x(value,ord)where ord<=30),'[]'),
  'has_next',jsonb_array_length(rows)>30,'page',p_page,'actor_role',actor_role);
end;$$;

-- Keep question answers/history private. Only privileged RPCs return full records.
revoke all on ace.questions,ace.question_versions,ace.question_media from public,anon,authenticated;
revoke all on function ace.question_trim(text),ace.question_normalize(text),ace.validate_question_draft(jsonb),ace.guard_question_workflow(),ace.guard_question_history(),
 ace.manage_question(text,uuid,integer,jsonb),ace.review_questions(text,integer)from public,anon,authenticated;
grant execute on function ace.manage_question(text,uuid,integer,jsonb),ace.review_questions(text,integer)to authenticated;

-- Source-only rich-content workflow overlay. Dependencies: question workflow,
-- rich-content validator, private media intents, media metadata, and rights review
-- proposals. This is NOT a migration and must not be applied to production.
begin;

create or replace function ace.validate_question_rich_assets(
 p_question uuid,p_document jsonb,p_max_intent_version integer,
 p_publish_version integer,p_reviewer uuid
) returns void language plpgsql security definer
set search_path=pg_catalog,pg_temp set lock_timeout='3s' as $$
declare
 block jsonb;
 asset uuid;
 intent ace.question_media_intents%rowtype;
 rights_review ace.question_media_reviews%rowtype;
 media ace.question_media%rowtype;
begin
 if p_document is null then return; end if;
 perform ace.validate_rich_question_content(p_document);
 if p_max_intent_version is null or p_max_intent_version<0 then
  raise exception 'Invalid rich question revision' using errcode='22023';
 end if;
 for block in
  select value from jsonb_array_elements(p_document->'blocks')
  where value->>'type'='image'
 loop
  asset:=(block->>'asset_id')::uuid;
  select * into intent from ace.question_media_intents
   where id=asset for share;
  if not found or intent.question_id<>p_question
   or intent.status<>'verified' or intent.verified_at is null
   or intent.question_version>p_max_intent_version
   or intent.storage_path<>'staging/v1/'||p_question::text||'/'||asset::text
   or intent.alt_text<>block->>'alt'
   or intent.requested_by is null then
   raise exception 'Rich question image is not verified for this revision' using errcode='23514';
  end if;

  if p_publish_version is not null then
   if p_reviewer is null then
    raise exception 'Independent media rights approval required' using errcode='23514';
   end if;
   select * into rights_review from ace.question_media_reviews
    where intent_id=asset and question_version=p_max_intent_version
    order by reviewed_at desc,id desc limit 1 for share;
   if not found or rights_review.decision<>'approved'
    or rights_review.rights_status not in('owned','licensed','permitted')
    or rights_review.reviewed_by<>p_reviewer
    or rights_review.reviewed_by=intent.requested_by then
    raise exception 'Independent media rights approval required' using errcode='23514';
   end if;
   select * into media from ace.question_media
    where id=asset and question_id=p_question and intent_id=asset
     and question_version=p_publish_version
     and kind in('image','diagram')
     and storage_path='published/v1/'||p_question::text||'/'||p_publish_version::text||'/'||asset::text
     and mime_type=intent.claimed_mime and size_bytes=intent.claimed_size_bytes
     and sha256=intent.claimed_sha256 and alt_text=block->>'alt'
     and rights_status=rights_review.rights_status
     and reviewed_by=p_reviewer and reviewed_at is not null
     and rights_evidence=rights_review.rights_evidence
     and rights_reviewed_by=rights_review.reviewed_by
     and rights_reviewed_at=rights_review.reviewed_at
     and verified_at is not null
    for share;
   if not found then
    raise exception 'Published media promotion required' using errcode='23514';
   end if;
  end if;
 end loop;
end;$$;
revoke all on function ace.validate_question_rich_assets(uuid,jsonb,integer,integer,uuid)
 from public,anon,authenticated;

create or replace function ace.manage_question(p_action text,p_id uuid,p_expected_version integer,p_payload jsonb default '{}'::jsonb)
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
  data:=ace.validate_question_draft(p_payload-'rich_content');
  if coalesce(p_payload ? 'rich_content',false) then
   if jsonb_typeof(p_payload->'rich_content')='null' then q.rich_content:=null;
   else
    q.rich_content:=ace.validate_rich_question_content(p_payload->'rich_content');
    perform ace.validate_question_rich_assets(p_id,q.rich_content,old_version,null,null);
   end if;
  elsif not was_new and q.rich_content is not null then
   raise exception 'Rich content must be preserved or explicitly removed when editing' using errcode='23514';
  else q.rich_content:=null;
  end if;
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
  if q.media<>'[]'::jsonb then
   raise exception 'Legacy question media requires migration to the reviewed media workflow' using errcode='23514';
  end if;
  perform ace.validate_question_rich_assets(
   p_id,q.rich_content,old_version,
   case when p_action='publish' and q.rich_content is not null
     and exists(select 1 from jsonb_array_elements(q.rich_content->'blocks') b(value) where b.value->>'type'='image')
     then old_version+1 else null end,
   case when p_action='publish' then q.reviewed_by else null end
  );
 end if;
 q.content_version:=old_version+1;q.updated_at:=clock_timestamp();
 if was_new then
  insert into ace.questions(id,subject_id,topic_id,subtopic_id,stem,options,correct_option_key,explanation,difficulty,exam,exam_year,media,rich_content,provenance,rights_status,content_version,review_status,active,created_by,reviewed_by,created_at,updated_at)
  values(q.id,q.subject_id,q.topic_id,q.subtopic_id,q.stem,q.options,q.correct_option_key,q.explanation,q.difficulty,q.exam,q.exam_year,q.media,q.rich_content,q.provenance,q.rights_status,q.content_version,q.review_status,q.active,q.created_by,q.reviewed_by,q.created_at,q.updated_at);
 else
  update ace.questions set subject_id=q.subject_id,topic_id=q.topic_id,subtopic_id=q.subtopic_id,stem=q.stem,options=q.options,
   correct_option_key=q.correct_option_key,explanation=q.explanation,difficulty=q.difficulty,exam=q.exam,exam_year=q.exam_year,media=q.media,rich_content=q.rich_content,
   provenance=q.provenance,rights_status=q.rights_status,content_version=q.content_version,review_status=q.review_status,active=q.active,reviewed_by=q.reviewed_by,updated_at=q.updated_at where id=p_id;
 end if;
 insert into ace.question_versions(question_id,version,snapshot,created_by)values(p_id,q.content_version,to_jsonb(q),actor);
 insert into ace.audit_events(actor_user_id,event_type,entity_type,entity_id,metadata)
 values(actor,case when p_action='save'then'question_saved'else'question_'||p_action end,'question',p_id,
  jsonb_build_object('revision',q.content_version,'previous_revision',old_version,'previous_status',prior->>'review_status','status',q.review_status,'reason',reason));
 return to_jsonb(q);
end;$$;


revoke all on function ace.manage_question(text,uuid,integer,jsonb)
 from public,anon,authenticated;
grant execute on function ace.manage_question(text,uuid,integer,jsonb) to authenticated;
commit;

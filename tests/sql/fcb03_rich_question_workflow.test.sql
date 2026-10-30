\set ON_ERROR_STOP on
-- Disposable PostgreSQL only. Prerequisite rich validator, media intents,
-- private media metadata and independent rights-review proposals are installed
-- by the preceding FCB-03 CI steps. This fixture never accesses Storage.
\ir ../../supabase/proposals/fcb03_rich_question_workflow.sql
\ir ../../supabase/proposals/fcb03_media_preview.sql
\ir ../../supabase/proposals/fcb03_media_publication.sql

begin;
insert into auth.users(id,email,raw_user_meta_data) values
 ('06000000-0000-4000-8000-000000000001','rich-author@example.invalid','{}'),
 ('06000000-0000-4000-8000-000000000002','rich-reviewer@example.invalid','{}'),
 ('06000000-0000-4000-8000-000000000003','rich-student@example.invalid','{}');
update ace.roles set role='editor' where user_id='06000000-0000-4000-8000-000000000001';
update ace.roles set role='admin' where user_id='06000000-0000-4000-8000-000000000002';
select set_config('request.jwt.claim.sub','06000000-0000-4000-8000-000000000002',true);
insert into ace.subjects(id,code,name,active)
 values('06000000-0000-4000-8000-000000000005','RCH','Rich Content',true);
insert into ace.syllabus_versions(id,season_id,subject_id,version,title,rights_status,status,activated_at)
 values('06000000-0000-4000-8000-000000000008',
  '03000000-0000-4000-8000-000000000009',
  '06000000-0000-4000-8000-000000000005',3,'Rich content test syllabus','approved','active',now());
insert into ace.topics(id,subject_id,syllabus_version_id,name,active)
 values('06000000-0000-4000-8000-000000000006',
  '06000000-0000-4000-8000-000000000005',
  '06000000-0000-4000-8000-000000000008','Geometry',true);

select set_config('request.jwt.claim.sub','06000000-0000-4000-8000-000000000001',true);
select ace.manage_question('save','06000000-0000-4000-8000-000000000004',0,
 jsonb_build_object(
  'subject_id','06000000-0000-4000-8000-000000000005',
  'topic_id','06000000-0000-4000-8000-000000000006','subtopic_id',null,
  'stem','Find the area of the rectangle.',
  'options',jsonb_build_array(
   jsonb_build_object('key','A','text','5 square units'),
   jsonb_build_object('key','B','text','6 square units'),
   jsonb_build_object('key','C','text','7 square units'),
   jsonb_build_object('key','D','text','8 square units')),
  'correct_option_key','B','explanation','Multiply length by width.',
  'difficulty','easy','exam','ACE practice','exam_year',null,
  'provenance',jsonb_build_object('source_kind','original','source_title','ACE geometry',
   'author_label','ACE team','source_url',null,'rights_evidence','Original question written for ACE.')));

select (ace.reserve_question_media_intent(
 '06000000-0000-4000-8000-000000000004',1,
 '06000000-0000-4000-8000-00000000000b',
 'A rectangle with labelled length and width','Original diagram created for ACE.',
 'image/png',12,repeat('a',64))->>'id' as asset_id \gset
select set_config('fcb03.test.asset_id', :'asset_id', true);
select ace.confirm_question_media_intent(:'asset_id'::uuid,'image/png',12,repeat('a',64));

do $bad_asset$
declare d jsonb;
begin
 d:=jsonb_build_object('version',1,'blocks',jsonb_build_array(
   jsonb_build_object('type','image','asset_id','06000000-0000-4000-8000-00000000000d',
    'alt','A rectangle with labelled length and width','caption','Diagram 1')),
   'fallback_text','Diagram: A rectangle with labelled length and width'||E'\n'||'Diagram 1');
 begin
  perform ace.manage_question('save','06000000-0000-4000-8000-000000000004',1,
   jsonb_build_object(
    'subject_id','06000000-0000-4000-8000-000000000005',
    'topic_id','06000000-0000-4000-8000-000000000006','subtopic_id',null,
    'stem','Find the area of the rectangle.',
    'options',jsonb_build_array(jsonb_build_object('key','A','text','5 square units'),
     jsonb_build_object('key','B','text','6 square units'),jsonb_build_object('key','C','text','7 square units'),
     jsonb_build_object('key','D','text','8 square units')),
    'correct_option_key','B','explanation','Multiply length by width.','difficulty','easy',
    'exam','ACE practice','exam_year',null,
    'provenance',jsonb_build_object('source_kind','original','source_title','ACE geometry',
     'author_label','ACE team','source_url',null,'rights_evidence','Original question written for ACE.'),
    'rich_content',d));
  raise exception 'Unverified media reference was accepted';
 exception when check_violation then
  if position('Rich question image is not verified' in sqlerrm)=0 then raise; end if;
 end;
end
$bad_asset$;

select ace.manage_question('save','06000000-0000-4000-8000-000000000004',1,
 jsonb_build_object(
  'subject_id','06000000-0000-4000-8000-000000000005',
  'topic_id','06000000-0000-4000-8000-000000000006','subtopic_id',null,
  'stem','Find the area of the rectangle.',
  'options',jsonb_build_array(jsonb_build_object('key','A','text','5 square units'),
   jsonb_build_object('key','B','text','6 square units'),jsonb_build_object('key','C','text','7 square units'),
   jsonb_build_object('key','D','text','8 square units')),
  'correct_option_key','B','explanation','Multiply length by width.','difficulty','easy',
  'exam','ACE practice','exam_year',null,
  'provenance',jsonb_build_object('source_kind','original','source_title','ACE geometry',
   'author_label','ACE team','source_url',null,'rights_evidence','Original question written for ACE.'),
  'rich_content',jsonb_build_object('version',1,'blocks',jsonb_build_array(
   jsonb_build_object('type','paragraph','text','Use the labelled dimensions.'),
   jsonb_build_object('type','image','asset_id',:'asset_id'::text,
    'alt','A rectangle with labelled length and width','caption','Diagram 1')),
   'fallback_text','Use the labelled dimensions.'||E'\n\n'||
    'Diagram: A rectangle with labelled length and width'||E'\n'||'Diagram 1')));

do $checks$
declare q jsonb;
begin
 select to_jsonb(x) into q from ace.questions x where id='06000000-0000-4000-8000-000000000004';
 if q->>'content_version'<>'2' or q->'rich_content'->'blocks'->1->>'asset_id'<>current_setting('fcb03.test.asset_id') then
  -- The psql variable is not automatically a GUC; compare against the intent table instead.
  if not exists(select 1 from ace.question_media_intents i where i.id=(q->'rich_content'->'blocks'->1->>'asset_id')::uuid
   and i.question_id=q->>'id' and i.status='verified') then
   raise exception 'Rich document was not saved with verified asset binding';
  end if;
 end if;
 if not exists(select 1 from ace.question_versions where question_id=q->>'id' and version=2
  and snapshot->'rich_content'=q->'rich_content') then
  raise exception 'Immutable history omitted rich content';
 end if;
end
$checks$;

select ace.manage_question('submit','06000000-0000-4000-8000-000000000004',2,'{}');
select set_config('request.jwt.claim.sub','06000000-0000-4000-8000-000000000002',true);
select ace.manage_question('approve','06000000-0000-4000-8000-000000000004',3,'{}');

do $blocked_publish$
begin
 begin
  perform ace.manage_question('publish','06000000-0000-4000-8000-000000000004',4,'{}');
  raise exception 'Publication succeeded without independent media-rights approval and promoted bytes';
 exception when check_violation then
  if position('Independent media rights approval required' in sqlerrm)=0 then
   raise exception 'Wrong publication refusal before media rights review: %',sqlerrm;
  end if;
 end;
end
$blocked_publish$;

select ace.review_question_media_intent(
 '06000000-0000-4000-8000-000000000004',4,:'asset_id'::uuid,
 'approved','owned','Independent reviewer confirmed the original diagram and rights evidence.');

do $blocked_promotion$
begin
 begin
  perform ace.manage_question('publish','06000000-0000-4000-8000-000000000004',4,'{}');
  raise exception 'Publication succeeded without immutable media promotion metadata';
 exception when check_violation then
  if position('Published media promotion required' in sqlerrm)=0 then
   raise exception 'Wrong publication refusal before media promotion: %',sqlerrm;
  end if;
 end;
end
$blocked_promotion$;

do $promotion_plan$
declare plan jsonb;
begin
 plan:=ace.prepare_question_media_publication(
  '06000000-0000-4000-8000-000000000004',4);
 if plan is null or plan->>'question_id'<>'06000000-0000-4000-8000-000000000004'
  or (plan->>'approved_version')::integer<>4 or (plan->>'publish_version')::integer<>5
  or jsonb_array_length(plan->'assets')<>1
  or plan->'assets'->0->>'target_path'<>'published/v1/06000000-0000-4000-8000-000000000004/5/'||current_setting('fcb03.test.asset_id') then
  raise exception 'Trusted promotion plan did not bind exact approved version and immutable path';
 end if;
end
$promotion_plan$;
select ace.confirm_question_media_promotion(
 '06000000-0000-4000-8000-000000000004',4,current_setting('fcb03.test.asset_id')::uuid);

select ace.manage_question('publish','06000000-0000-4000-8000-000000000004',4,'{}');

do $published$
begin
 if not exists(select 1 from ace.questions where id='06000000-0000-4000-8000-000000000004'
  and active and review_status='published' and content_version=5
  and rich_content->'blocks'->1->>'asset_id'=current_setting('fcb03.test.asset_id')) then
  raise exception 'Rich question publication did not preserve the reviewed document';
 end if;
 if not exists(select 1 from ace.question_versions where question_id='06000000-0000-4000-8000-000000000004'
  and version=5 and snapshot->'rich_content'->'blocks'->1->>'asset_id'=current_setting('fcb03.test.asset_id')) then
  raise exception 'Published immutable version lost rich content';
 end if;
end
$published$;

rollback;

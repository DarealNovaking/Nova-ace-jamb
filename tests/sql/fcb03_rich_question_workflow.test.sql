\set ON_ERROR_STOP on
-- Disposable PostgreSQL only. Prerequisite rich validator, media intents,
-- private media metadata and independent rights-review proposals are installed
-- by the preceding FCB-03 CI steps. This fixture never accesses Storage.
\ir ../../supabase/proposals/fcb03_rich_question_workflow.sql
\ir ../../supabase/proposals/fcb03_media_preview.sql
\ir ../../supabase/proposals/fcb03_media_publication.sql
\ir ../../supabase/proposals/fcb03_media_takedown.sql
select 'create role ace_media_executor nologin' where not exists(select 1 from pg_catalog.pg_roles where rolname='ace_media_executor') \gexec
grant usage on schema ace to ace_media_executor;
grant execute on function ace.publish_question_after_media_promotion(uuid,integer) to ace_media_executor;
grant execute on function ace.authorize_attempt_question_media(uuid,uuid,uuid) to ace_media_executor;
grant execute on function ace.takedown_question_media(uuid,uuid,text) to ace_media_executor;

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
do $capability$
begin
 if ace.rich_question_authoring_enabled() is not true then raise exception 'Editor rich authoring capability was not enabled';end if;
 if has_function_privilege('anon','ace.rich_question_authoring_enabled()','execute') or not has_function_privilege('authenticated','ace.rich_question_authoring_enabled()','execute') then raise exception 'Rich authoring capability grants are incorrect';end if;
end
$capability$;
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

-- Rich text history restoration creates a new private revision and preserves
-- accessible paragraphs, spoken equations and tables without reusing media.
select ace.manage_question('save','06000000-0000-4000-8000-00000000000e',0,
 jsonb_build_object(
  'subject_id','06000000-0000-4000-8000-000000000005',
  'topic_id','06000000-0000-4000-8000-000000000006','subtopic_id',null,
  'stem','Restore this sample geometry question.',
  'options',jsonb_build_array(jsonb_build_object('key','A','text','5 units'),
   jsonb_build_object('key','B','text','6 units'),jsonb_build_object('key','C','text','7 units'),
   jsonb_build_object('key','D','text','8 units')),
  'correct_option_key','B','explanation','Use the original dimensions.',
  'difficulty','easy','exam','ACE practice','exam_year',null,
  'provenance',jsonb_build_object('source_kind','original','source_title','ACE restore test',
   'author_label','ACE team','source_url',null,'rights_evidence','Original ACE restoration fixture.'),
  'rich_content',jsonb_build_object('version',1,'blocks',jsonb_build_array(
   jsonb_build_object('type','paragraph','text','A rectangle has a length and width.'),
   jsonb_build_object('type','equation','expression','Area = length × width','spoken','Area equals length multiplied by width'),
   jsonb_build_object('type','table','caption','Example dimensions',
    'headers',jsonb_build_array('Length','Width'),
    'rows',jsonb_build_array(jsonb_build_array('3 units','2 units')))),
   'fallback_text','A rectangle has a length and width.'||E'\n\\n'||
    'Area = length × width — Area equals length multiplied by width'||E'\n\\n'||
    'Example dimensions'||E'\n'||'Length | Width'||E'\n'||'3 units | 2 units')));
select ace.manage_question('save','06000000-0000-4000-8000-00000000000e',1,
 jsonb_build_object(
  'subject_id','06000000-0000-4000-8000-000000000005',
  'topic_id','06000000-0000-4000-8000-000000000006','subtopic_id',null,
  'stem','Restore this sample geometry question.',
  'options',jsonb_build_array(jsonb_build_object('key','A','text','5 units'),
   jsonb_build_object('key','B','text','6 units'),jsonb_build_object('key','C','text','7 units'),
   jsonb_build_object('key','D','text','8 units')),
  'correct_option_key','B','explanation','Use the updated dimensions.',
  'difficulty','easy','exam','ACE practice','exam_year',null,
  'provenance',jsonb_build_object('source_kind','original','source_title','ACE restore test',
   'author_label','ACE team','source_url',null,'rights_evidence','Original ACE restoration fixture.'),
  'rich_content',jsonb_build_object('version',1,'blocks',jsonb_build_array(
   jsonb_build_object('type','paragraph','text','Use the dimensions shown in the table.'),
   jsonb_build_object('type','equation','expression','A = l × w','spoken','Area equals length times width'),
   jsonb_build_object('type','table','caption','Updated dimensions',
    'headers',jsonb_build_array('Length','Width'),
    'rows',jsonb_build_array(jsonb_build_array('4 units','2 units')))),
   'fallback_text','Use the dimensions shown in the table.'||E'\n\\n'||
    'A = l × w — Area equals length times width'||E'\n\\n'||
    'Updated dimensions'||E'\n'||'Length | Width'||E'\n'||'4 units | 2 units')));
select ace.restore_question('06000000-0000-4000-8000-00000000000e',2,1,
 'Restore the original accessible geometry layout.');

do $rich_restore$
declare current_row ace.questions%rowtype; original jsonb;
begin
 select * into current_row from ace.questions
  where id='06000000-0000-4000-8000-00000000000e';
 select snapshot->'rich_content' into original from ace.question_versions
  where question_id=current_row.id and version=1;
 if current_row.content_version<>3 or current_row.rich_content is distinct from original
  or current_row.review_status<>'draft' or current_row.active
  or current_row.rights_status<>'unknown' or current_row.reviewed_by is not null
  or current_row.created_by<>'06000000-0000-4000-8000-000000000001' then
  raise exception 'Rich history restore did not preserve content and reset approval safely';
 end if;
 if not exists(select 1 from ace.audit_events where actor_user_id='06000000-0000-4000-8000-000000000001'
  and event_type='question_restored' and entity_id=current_row.id
  and metadata->>'source_revision'='1' and metadata->>'revision'='3') then
  raise exception 'Rich history restoration audit record missing';
 end if;
end
$rich_restore$;

select ace.reserve_question_media_intent(
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
   and i.question_id=(q->>'id')::uuid and i.status='verified') then
   raise exception 'Rich document was not saved with verified asset binding';
  end if;
 end if;
 if not exists(select 1 from ace.question_versions where question_id=(q->>'id')::uuid and version=2
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

set session authorization ace_media_executor;
select ace.publish_question_after_media_promotion('06000000-0000-4000-8000-000000000004',4);
reset session authorization;

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

-- A student's own active attempt can read the exact published image before takedown.
insert into ace.attempts(
 id,user_id,mode,subject_id,started_at,duration_seconds,random_seed,
 question_order,option_order,status,question_snapshot
) select
 '06000000-0000-4000-8000-00000000000c',
 '06000000-0000-4000-8000-000000000003','practice',q.subject_id,
 clock_timestamp(),600,61,
 jsonb_build_array(q.id::text),
 jsonb_build_object(q.id::text,jsonb_build_array('A','B','C','D')),
 'active',
 jsonb_build_array(jsonb_build_object(
  'id',q.id,'content_version',q.content_version,'stem',q.stem,
  'options',q.options,'subject_id',q.subject_id,'topic_id',q.topic_id,
  'difficulty',q.difficulty,'rich_content',q.rich_content
 ))
 from ace.questions q where q.id='06000000-0000-4000-8000-000000000004';

set session authorization ace_media_executor;
select set_config('request.jwt.claim.sub','06000000-0000-4000-8000-000000000003',true);
do $before_takedown$
begin
 if ace.authorize_attempt_question_media(
  '06000000-0000-4000-8000-00000000000c',
  '06000000-0000-4000-8000-000000000004',
  current_setting('fcb03.test.asset_id')::uuid) is null then
  raise exception 'Published image was not authorized for this student-owned active attempt';
 end if;
end
$before_takedown$;

select set_config('request.jwt.claim.sub','06000000-0000-4000-8000-000000000002',true);
select ace.takedown_question_media(
 '06000000-0000-4000-8000-000000000004',
 current_setting('fcb03.test.asset_id')::uuid,
 'Rights evidence was withdrawn; remove this image from student delivery.');

select set_config('request.jwt.claim.sub','06000000-0000-4000-8000-000000000003',true);
reset session authorization;
do $after_takedown$
begin
 if ace.authorize_attempt_question_media(
  '06000000-0000-4000-8000-00000000000c',
  '06000000-0000-4000-8000-000000000004',
  current_setting('fcb03.test.asset_id')::uuid) is not null then
  raise exception 'Withdrawn image remained available to an active attempt';
 end if;
 if not exists(select 1 from ace.audit_events where event_type='question_media_takedown'
  and entity_id=current_setting('fcb03.test.asset_id')::uuid
  and actor_user_id='06000000-0000-4000-8000-000000000002') then
  raise exception 'Question media takedown audit event missing';
 end if;
 if has_function_privilege('authenticated',
  'ace.takedown_question_media(uuid,uuid,text)','execute')
  or has_function_privilege('anon','ace.takedown_question_media(uuid,uuid,text)','execute') then
  raise exception 'Media takedown RPC exposed to client roles';
 end if;
 raise notice 'FCB-03 media takedown PASS: immediate delivery revocation, immutable rights rejection, admin audit, executor-only grants';
end
$after_takedown$;

rollback;

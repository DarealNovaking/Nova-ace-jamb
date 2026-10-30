\set ON_ERROR_STOP on
-- Disposable PostgreSQL only. The preceding media-intent test installs the
-- prerequisite proposal; this test never connects to live Supabase/Storage.
\ir ../../supabase/proposals/fcb03_media_student_delivery.sql
\ir ../../supabase/proposals/fcb03_student_rich_content_delivery.sql

begin;
insert into auth.users(id,email,raw_user_meta_data) values
 ('05000000-0000-4000-8000-000000000001','delivery-author@example.invalid','{}'),
 ('05000000-0000-4000-8000-000000000002','delivery-reviewer@example.invalid','{}'),
 ('05000000-0000-4000-8000-000000000003','delivery-student@example.invalid','{}'),
 ('05000000-0000-4000-8000-00000000000a','delivery-other-student@example.invalid','{}');
update ace.roles set role='editor' where user_id='05000000-0000-4000-8000-000000000001';
update ace.roles set role='admin' where user_id='05000000-0000-4000-8000-000000000002';

select set_config('request.jwt.claim.sub','05000000-0000-4000-8000-000000000002',true);
insert into ace.subjects(id,code,name,active)
 values('05000000-0000-4000-8000-000000000005','MDL','Media Delivery Contract',true);
insert into ace.syllabus_versions(id,season_id,subject_id,version,title,rights_status,status,activated_at)
 values('05000000-0000-4000-8000-000000000008',
  '03000000-0000-4000-8000-000000000009',
  '05000000-0000-4000-8000-000000000005',1,'Media delivery syllabus','approved','active',now());
insert into ace.topics(id,subject_id,syllabus_version_id,name,active)
 values('05000000-0000-4000-8000-000000000006',
  '05000000-0000-4000-8000-000000000005',
  '05000000-0000-4000-8000-000000000008','Geometry',true);

select set_config('request.jwt.claim.sub','05000000-0000-4000-8000-000000000001',true);
select ace.manage_question('save','05000000-0000-4000-8000-000000000004',0,
 jsonb_build_object(
  'subject_id','05000000-0000-4000-8000-000000000005',
  'topic_id','05000000-0000-4000-8000-000000000006',
  'subtopic_id',null,'stem','Find the area of the rectangle.',
  'options',jsonb_build_array(
   jsonb_build_object('key','A','text','5 square units'),
   jsonb_build_object('key','B','text','6 square units'),
   jsonb_build_object('key','C','text','7 square units'),
   jsonb_build_object('key','D','text','8 square units')),
  'correct_option_key','B','explanation','Multiply length by width.',
  'difficulty','easy','exam','ACE practice','exam_year',null,
  'provenance',jsonb_build_object('source_kind','original','source_title','ACE geometry',
   'author_label','ACE Team','source_url',null,'rights_evidence','Original problem and diagram.')));

-- Reserve and verify the staging asset against draft revision 1. A separate,
-- guarded publication process later promotes the same immutable bytes to the
-- exact published question version; no production promotion is exercised.
select (ace.reserve_question_media_intent(
 '05000000-0000-4000-8000-000000000004',1,
 '05000000-0000-4000-8000-00000000000b',
 'A labelled geometry diagram','Original diagram created by ACE.',
 'image/png',12,repeat('a',64))->>'id') as asset_id \gset
select set_config('fcb03.test.asset_id', :'asset_id', true);
select ace.confirm_question_media_intent(:'asset_id'::uuid,'image/png',12,repeat('a',64));

-- Synthetic published revision fixture: this test intentionally seeds a valid
-- immutable version directly so it can exercise the delivery guard without
-- enabling rich content in the current text-only authoring workflow.
update ace.questions set content_version=2,rich_content=jsonb_build_object(
 'version',1,
 'blocks',jsonb_build_array(
  jsonb_build_object('type','paragraph','text','Find the area of the rectangle.'),
  jsonb_build_object('type','image','asset_id', :'asset_id'::uuid,
   'alt','A labelled geometry diagram','caption','Diagram 1')),
 'fallback_text','Find the area of the rectangle.'||E'\n\n'||
  'Diagram: A labelled geometry diagram'||E'\n'||'Diagram 1'),
 active=true,review_status='published',rights_status='owned',
 reviewed_by='05000000-0000-4000-8000-000000000002',updated_at=clock_timestamp()
 where id='05000000-0000-4000-8000-000000000004';
insert into ace.question_versions(question_id,version,snapshot,created_by)
 select id,content_version,to_jsonb(q),'05000000-0000-4000-8000-000000000002'
 from ace.questions q where id='05000000-0000-4000-8000-000000000004';

insert into ace.question_media(
 id,question_id,kind,storage_provider,storage_path,mime_type,size_bytes,
 alt_text,rights_status,source_url,metadata,intent_id,question_version,sha256,verified_at,reviewed_by,reviewed_at
) values(
 :'asset_id'::uuid,
 '05000000-0000-4000-8000-000000000004','diagram','supabase',
 'published/v1/05000000-0000-4000-8000-000000000004/2/'||:'asset_id',
 'image/png',12,'A labelled geometry diagram','owned',null,'{}'::jsonb,
 :'asset_id'::uuid,2,repeat('a',64),clock_timestamp(),
 '05000000-0000-4000-8000-000000000002',clock_timestamp());

-- A valid, verified asset can exist for this revision yet remain undeliverable
-- when the immutable rich document does not reference it.
insert into ace.question_media_intents(
 id,question_id,question_version,requested_by,request_id,storage_path,
 claimed_mime,claimed_size_bytes,claimed_sha256,alt_text,rights_evidence,status,verified_at
) values(
 '05000000-0000-4000-8000-00000000000c',
 '05000000-0000-4000-8000-000000000004',1,
 '05000000-0000-4000-8000-000000000001',
 '05000000-0000-4000-8000-00000000000e',
 'staging/v1/05000000-0000-4000-8000-000000000004/05000000-0000-4000-8000-00000000000c',
 'image/png',12,repeat('b',64),'A second unrelated diagram',
 'Original second diagram created by ACE.','verified',clock_timestamp()
);
insert into ace.question_media(
 id,question_id,kind,storage_provider,storage_path,mime_type,size_bytes,
 alt_text,rights_status,source_url,metadata,intent_id,question_version,sha256,verified_at,reviewed_by,reviewed_at
) values(
 '05000000-0000-4000-8000-00000000000c',
 '05000000-0000-4000-8000-000000000004','diagram','supabase',
 'published/v1/05000000-0000-4000-8000-000000000004/2/05000000-0000-4000-8000-00000000000c',
 'image/png',12,'A second unrelated diagram','owned',null,'{}'::jsonb,
 '05000000-0000-4000-8000-00000000000c',2,repeat('b',64),clock_timestamp(),
 '05000000-0000-4000-8000-000000000002',clock_timestamp()
);

insert into ace.attempts(
 id,user_id,mode,subject_id,started_at,duration_seconds,random_seed,
 question_order,option_order,status,question_snapshot
) values(
 '05000000-0000-4000-8000-000000000009',
 '05000000-0000-4000-8000-000000000003','practice',
 '05000000-0000-4000-8000-000000000005',clock_timestamp(),600,17,
 '["05000000-0000-4000-8000-000000000004"]'::jsonb,
 '{"05000000-0000-4000-8000-000000000004":["A","B","C","D"]}'::jsonb,
 'active',
 '[{"id":"05000000-0000-4000-8000-000000000004","content_version":2,"stem":"Find the area of the rectangle.","options":[{"key":"A","text":"5 square units"},{"key":"B","text":"6 square units"},{"key":"C","text":"7 square units"},{"key":"D","text":"8 square units"}],"correct_option_key":"B","subject_id":"05000000-0000-4000-8000-000000000005","topic_id":"05000000-0000-4000-8000-000000000006","difficulty":"easy"}]'::jsonb
);

do $tests$
declare
 student uuid:='05000000-0000-4000-8000-000000000003';
 other_student uuid:='05000000-0000-4000-8000-00000000000a';
 attempt uuid:='05000000-0000-4000-8000-000000000009';
 question uuid:='05000000-0000-4000-8000-000000000004';
 asset uuid:=current_setting('fcb03.test.asset_id')::uuid;
 result jsonb;
 delivered jsonb;
begin
 if has_function_privilege('anon','ace.authorize_attempt_question_media(uuid,uuid,uuid)','execute')
 or has_function_privilege('authenticated','ace.authorize_attempt_question_media(uuid,uuid,uuid)','execute') then
  raise exception 'Student media authorization function leaked to client roles';
 end if;

 perform set_config('request.jwt.claim.sub',student::text,true);
 result:=ace.authorize_attempt_question_media(attempt,question,asset);
 if result is null or result->>'id'<>asset::text or result->>'question_id'<>question::text
 or result->>'question_version'<>'2'
 or result->>'storage_path'<>'published/v1/'||question::text||'/2/'||asset::text
 or result->>'mime_type'<>'image/png' or result->>'size_bytes'<>'12'
 or result->>'sha256'<>repeat('a',64) or (select count(*) from jsonb_object_keys(result))<>7
 or result?'correct_option_key' or result?'explanation' or result?'rights_evidence' then
  raise exception 'Valid owned attempt did not receive only bounded media metadata: %',result;
 end if;
 delivered:=ace.get_attempt_questions(attempt);
 if jsonb_array_length(delivered)<>1
  or delivered->0->>'id'<>question::text
  or not exists(select 1 from jsonb_array_elements(delivered->0->'rich_content'->'blocks') b(value)
   where b.value->>'type'='image' and b.value->>'asset_id'=asset::text)
  or delivered->0?'correct_option_key' or delivered->0?'explanation'
  or delivered->0?'rights_evidence' or delivered->0->'rich_content'?'storage_path' then
  raise exception 'Student question delivery did not return only the validated frozen rich document';
 end if;

 -- Ownership, attempt membership, asset identity and publication are checked
 -- before the binary proxy reads any object.
 perform set_config('request.jwt.claim.sub',other_student::text,true);
 if ace.authorize_attempt_question_media(attempt,question,asset) is not null then
  raise exception 'Another student received the media grant';
 end if;
 perform set_config('request.jwt.claim.sub',student::text,true);
 if ace.authorize_attempt_question_media(attempt,question,'05000000-0000-4000-8000-00000000000c') is not null
 or ace.authorize_attempt_question_media(attempt,'05000000-0000-4000-8000-00000000000c',asset) is not null then
  raise exception 'Unknown question/asset reference was authorized';
 end if;

 update ace.attempts set status='completed' where id=attempt;
 if ace.authorize_attempt_question_media(attempt,question,asset) is not null then
  raise exception 'Completed attempt still received image access';
 end if;
 update ace.attempts set status='active',started_at=clock_timestamp()-interval '20 minutes',
  duration_seconds=600 where id=attempt;
 if ace.authorize_attempt_question_media(attempt,question,asset) is not null then
  raise exception 'Expired attempt still received image access';
 end if;
 update ace.attempts set status='active',started_at=clock_timestamp(),duration_seconds=600 where id=attempt;

 update ace.questions set active=false,review_status='approved' where id=question;
 if ace.authorize_attempt_question_media(attempt,question,asset) is not null then
  raise exception 'Withdrawn question still received image access';
 end if;
 update ace.questions set active=true,review_status='published' where id=question;

 -- A newer published version does not rewrite the older version frozen in an
 -- active attempt. The older version's own immutable snapshot still governs.
 update ace.questions set content_version=3,rich_content=jsonb_build_object(
  'version',1,'blocks',jsonb_build_array(jsonb_build_object('type','paragraph','text','Find the area of the rectangle.')),
  'fallback_text','Find the area of the rectangle.'),updated_at=clock_timestamp() where id=question;
 insert into ace.question_versions(question_id,version,snapshot,created_by)
  select id,content_version,to_jsonb(q),'05000000-0000-4000-8000-000000000002'
  from ace.questions q where id=question;
 if ace.authorize_attempt_question_media(attempt,question,asset) is null then
  raise exception 'Newer published revision incorrectly invalidated frozen attempt media';
 end if;
 delivered:=ace.get_attempt_questions(attempt);
 if not exists(select 1 from jsonb_array_elements(delivered->0->'rich_content'->'blocks') b(value)
  where b.value->>'type'='image' and b.value->>'asset_id'=asset::text) then
  raise exception 'Newer publication rewrote the rich content frozen into an older attempt';
 end if;
 update ace.questions set rights_status='restricted' where id=question;
 if ace.authorize_attempt_question_media(attempt,question,asset) is not null then
  raise exception 'Current question rights withdrawal did not revoke historical media';
 end if;
 update ace.questions set rights_status='owned' where id=question;

 update ace.question_media set question_version=3 where id=asset;
 if ace.authorize_attempt_question_media(attempt,question,asset) is not null then
  raise exception 'Media metadata from a different revision was delivered';
 end if;
 update ace.question_media set question_version=2 where id=asset;

 update ace.question_media set rights_status='restricted' where id=asset;
 if ace.authorize_attempt_question_media(attempt,question,asset) is not null then
  raise exception 'Restricted image rights still allowed delivery';
 end if;
 update ace.question_media set rights_status='owned' where id=asset;

 update ace.question_media set reviewed_by='05000000-0000-4000-8000-000000000001' where id=asset;
 if ace.authorize_attempt_question_media(attempt,question,asset) is not null then
  raise exception 'Question author was accepted as independent media reviewer';
 end if;
 update ace.question_media set reviewed_by=null,reviewed_at=null where id=asset;
 if ace.authorize_attempt_question_media(attempt,question,asset) is not null then
  raise exception 'Unreviewed media was delivered';
 end if;
 update ace.question_media set reviewed_by='05000000-0000-4000-8000-000000000002',reviewed_at=clock_timestamp() where id=asset;

 update ace.question_media set storage_path='staging/v1/'||question::text||'/'||asset::text where id=asset;
 if ace.authorize_attempt_question_media(attempt,question,asset) is not null then
  raise exception 'Staging object path was exposed for student delivery';
 end if;
 update ace.question_media set storage_path='published/v1/'||question::text||'/2/'||asset::text where id=asset;

 update ace.question_media set sha256=repeat('b',64) where id=asset;
 if ace.authorize_attempt_question_media(attempt,question,asset) is not null then
  raise exception 'Metadata/object digest mismatch still allowed delivery';
 end if;
 update ace.question_media set sha256=repeat('a',64) where id=asset;

 update ace.question_media_intents set status='pending',verified_at=null where id=asset;
 if ace.authorize_attempt_question_media(attempt,question,asset) is not null then
  raise exception 'Unverified staging intent still allowed delivery';
 end if;
 update ace.question_media_intents set status='verified',verified_at=clock_timestamp() where id=asset;

 perform set_config('request.jwt.claim.sub','',true);
 begin
  perform ace.authorize_attempt_question_media(attempt,question,asset);
  raise exception 'Unauthenticated media authorization unexpectedly succeeded';
 exception when sqlstate '28000' then null;
 end;
 raise notice 'FCB-03 student media delivery PASS: exact revision/reference, owner/attempt, publication/rights, verified immutable metadata, private grants';
end
$tests$;
rollback;

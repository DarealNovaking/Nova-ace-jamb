\set ON_ERROR_STOP on
-- Disposable PostgreSQL only; separate fixture IDs avoid existing race-test rows. Workflow already installed by
-- fcb03_question_workflow.py. No object storage or live database is accessed.
\ir ../../supabase/proposals/fcb03_media_intents.sql

begin;
insert into auth.users(id,email,raw_user_meta_data)values
 ('04000000-0000-4000-8000-000000000001','media-author@example.invalid','{}'),
 ('04000000-0000-4000-8000-000000000002','media-reviewer@example.invalid','{}'),
 ('04000000-0000-4000-8000-000000000003','media-student@example.invalid','{}'),
 ('04000000-0000-4000-8000-00000000000a','unrelated-editor@example.invalid','{}');
update ace.roles set role='editor' where user_id in(
 '04000000-0000-4000-8000-000000000001','04000000-0000-4000-8000-00000000000a');
update ace.roles set role='admin' where user_id='04000000-0000-4000-8000-000000000002';
select set_config('request.jwt.claim.sub','04000000-0000-4000-8000-000000000001',true);
insert into ace.subjects(id,code,name,active)values
 ('04000000-0000-4000-8000-000000000005','MDR','Media Diagram Reasoning',true);
-- Reuse the isolated question-workflow test season: only one active season
-- is allowed by the real production schema. These changes roll back below.
do $fixture$
begin
 if not exists(select 1 from ace.exam_seasons
   where id='03000000-0000-4000-8000-000000000009' and status='active')then
  raise exception 'Expected disposable workflow fixture not present';
 end if;
end
$fixture$;
-- Published syllabus fixtures require a genuine administrative role in the fixture.
select set_config('request.jwt.claim.sub','04000000-0000-4000-8000-000000000002',true);
insert into ace.syllabus_versions(id,season_id,subject_id,version,title,rights_status,status,activated_at)values
 ('04000000-0000-4000-8000-000000000008',
  '03000000-0000-4000-8000-000000000009',
  '04000000-0000-4000-8000-000000000005',3,'Original index','approved','active',now());
insert into ace.topics(id,subject_id,syllabus_version_id,name,active)values
 ('04000000-0000-4000-8000-000000000006',
  '04000000-0000-4000-8000-000000000005',
  '04000000-0000-4000-8000-000000000008','Numbers',true);

select set_config('request.jwt.claim.sub','04000000-0000-4000-8000-000000000001',true);
select ace.manage_question('save','04000000-0000-4000-8000-000000000004',0,
 jsonb_build_object(
  'subject_id','04000000-0000-4000-8000-000000000005',
  'topic_id','04000000-0000-4000-8000-000000000006',
  'subtopic_id',null,'stem','What is 3 + 4?',
  'options',jsonb_build_array(
   jsonb_build_object('key','A','text','5'),
   jsonb_build_object('key','B','text','6'),
   jsonb_build_object('key','C','text','7'),
   jsonb_build_object('key','D','text','8')),
  'correct_option_key','C','explanation','Adding four to three gives seven.',
  'difficulty','easy','exam','ACE practice','exam_year',null,
  'provenance',jsonb_build_object('source_kind','original','source_title','ACE arithmetic',
   'author_label','ACE Team','source_url',null,'rights_evidence','Original diagram and problem.'))
);

create function pg_temp.expect_denied(p_sql text,p_match text)
returns void language plpgsql as $$
declare error_text text; denied boolean := false;
begin
 begin
  execute p_sql;
 exception when others then
  error_text:=sqlerrm;
  if position(p_match in error_text)=0 then
   raise exception 'Wrong refusal: expected %, got %',p_match,error_text;
  end if;
  denied:=true;
 end;
 if not denied then raise exception 'Untrusted operation unexpectedly succeeded: %',p_sql;end if;
end;$$;

do $tests$
declare
 author uuid := '04000000-0000-4000-8000-000000000001';
 reviewer uuid := '04000000-0000-4000-8000-000000000002';
 student uuid := '04000000-0000-4000-8000-000000000003';
 unrelated uuid := '04000000-0000-4000-8000-00000000000a';
 question uuid := '04000000-0000-4000-8000-000000000004';
 request uuid := '04000000-0000-4000-8000-00000000000b';
 asset uuid;
 item jsonb;
 replay jsonb;
 reservation text;
 confirm_sql text;
 sha text := repeat('a',64);
 n integer;
begin
 -- Server-only functions, private table and generated paths (no client path).
 if has_function_privilege('anon','ace.reserve_question_media_intent(uuid,integer,uuid,text,text,text,integer,text)','execute')
 or has_function_privilege('authenticated','ace.reserve_question_media_intent(uuid,integer,uuid,text,text,text,integer,text)','execute')
 or has_function_privilege('anon','ace.confirm_question_media_intent(uuid,text,integer,text)','execute')
 or has_function_privilege('authenticated','ace.confirm_question_media_intent(uuid,text,integer,text)','execute')
 or has_table_privilege('authenticated','ace.question_media_intents','select')
 or has_table_privilege('authenticated','ace.question_media_intents','insert') then
  raise exception 'Private media intent API grants leaked';
 end if;
 reservation:=format(
  'select ace.reserve_question_media_intent(%L,1,%L,%L,%L,%L,1024,%L)',
  question,request,'A rectangle with labelled dimensions',
  'Original diagram authored by ACE.','image/png',sha);
 execute reservation into item;
 asset:=(item->>'id')::uuid;
 if item->>'status'<>'pending' or item->>'question_version'<>'1'
 or item->>'question_id'<>question::text or
 item->>'storage_path'<>'staging/v1/'||question::text||'/'||asset::text then
  raise exception 'Reserved intent used an unsafe or mismatched path';
 end if;
 execute reservation into replay;
 if replay<>item or (select count(*) from ace.question_media_intents)<>1 then
  raise exception 'Replay duplicated a media asset';
 end if;

 perform pg_temp.expect_denied(replace(reservation,'1024','2048'),'Media request ID already used');
 perform pg_temp.expect_denied(replace(reservation,'image/png','image/svg+xml'),'Invalid media intent');
 perform pg_temp.expect_denied(replace(reservation,'1024','2097153'),'Invalid media intent');
 perform pg_temp.expect_denied(replace(reservation,sha,'bad-hash'),'Invalid media intent');
 perform pg_temp.expect_denied(replace(reservation,'A rectangle with labelled dimensions','tiny'),'Invalid media intent');
 perform pg_temp.expect_denied(replace(reservation,'Original diagram authored by ACE.',' '),'Invalid media intent');
 perform pg_temp.expect_denied(replace(reservation,',1,',',0,'),'Invalid media intent');

 confirm_sql:=format('select ace.confirm_question_media_intent(%L,%L,1024,%L)',asset,'image/png',sha);
 perform pg_temp.expect_denied(replace(confirm_sql,'1024','2048'),'Verified media does not match reservation');
 perform pg_temp.expect_denied(replace(confirm_sql,'image/png','image/jpeg'),'Verified media does not match reservation');
 perform pg_temp.expect_denied(replace(confirm_sql,sha,repeat('b',64)),'Verified media does not match reservation');

 -- Do not let an unrelated editor, student or absent identity access existing intent.
 perform set_config('request.jwt.claim.sub',unrelated::text,true);
 perform pg_temp.expect_denied(reservation,'Question owner permission required');
 perform pg_temp.expect_denied(confirm_sql,'Media intent unavailable');
 perform set_config('request.jwt.claim.sub',student::text,true);
 perform pg_temp.expect_denied(reservation,'Editorial authentication required');
 perform pg_temp.expect_denied(confirm_sql,'Editorial authentication required');
 perform set_config('request.jwt.claim.sub','',true);
 perform pg_temp.expect_denied(reservation,'Editorial authentication required');
 perform set_config('request.jwt.claim.sub',author::text,true);

 -- Explicitly no table access, question_media reference or publication from intent.
 execute confirm_sql into item;
 execute confirm_sql into replay;
 if item<>replay or item->>'status'<>'verified' or
 (select count(*) from ace.question_media_intents where status='verified')<>1 or
 (select count(*) from ace.question_media)<>0 or
 (select count(*) from ace.questions where active)<>0 then
  raise exception 'Confirmation published media or was not idempotent';
 end if;

 -- Race-bound four-intent cap; every new path must differ.
 for n in 1..3 loop
  perform ace.reserve_question_media_intent(question,1,
   ('04000000-0000-4000-8000-'||lpad((100+n)::text,12,'0'))::uuid,
   'A second independently drawn rectangle','Original rights confirmed.',
   'image/jpeg',100,repeat('c',64));
 end loop;
 perform pg_temp.expect_denied(format(
  'select ace.reserve_question_media_intent(%L,1,%L,%L,%L,%L,100,%L)',
  question,'04000000-0000-4000-8000-0000000000e0',
  'Additional rectangle description','Original rights confirmed.',
  'image/jpeg',repeat('c',64)), 'Media intent limit reached');
 if (select count(distinct storage_path) from ace.question_media_intents)<>4 then
  raise exception 'Media intent path collision';
 end if;

 -- A question edit changes its version and invalidates old intent confirmations.
 perform ace.manage_question('save',question,1,jsonb_build_object(
  'subject_id','04000000-0000-4000-8000-000000000005',
  'topic_id','04000000-0000-4000-8000-000000000006',
  'subtopic_id',null,'stem','What is four plus three?',
  'options','[{"key":"A","text":"5"},{"key":"B","text":"6"},{"key":"C","text":"7"},{"key":"D","text":"8"}]'::jsonb,
  'correct_option_key','C','explanation','Adding four to three gives seven.',
  'difficulty','easy','exam','ACE practice','exam_year',null,
  'provenance','{"source_kind":"original","source_title":"ACE arithmetic","author_label":"ACE Team","source_url":null,"rights_evidence":"Original diagram and problem."}'::jsonb));
 perform pg_temp.expect_denied(confirm_sql,'Private current question required');
 perform pg_temp.expect_denied(reservation,'Private current question required');

 -- Even an administrator may not confirm another actor's intent.
 perform set_config('request.jwt.claim.sub',reviewer::text,true);
 perform pg_temp.expect_denied(confirm_sql,'Media intent unavailable');
 perform set_config('request.jwt.claim.sub',author::text,true);

 raise notice 'FCB03 media intent PASS: private grants, idempotency, bounds, actor/owner, no publication, cap, stale version';
end
$tests$;
rollback;

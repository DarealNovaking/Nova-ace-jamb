\set ON_ERROR_STOP on
-- Disposable PostgreSQL only. Exercises report ownership, frozen revision,
-- abuse limits, admin triage/resolution and direct-table privacy.
\ir ../../supabase/proposals/fcb03_rich_question_workflow.sql
\ir ../../supabase/proposals/fcb03_question_reporting.sql

begin;
insert into auth.users(id,email,raw_user_meta_data) values
 ('08000000-0000-4000-8000-000000000001','report-editor@example.invalid','{}'),
 ('08000000-0000-4000-8000-000000000002','report-admin@example.invalid','{}'),
 ('08000000-0000-4000-8000-000000000003','report-student@example.invalid','{}'),
 ('08000000-0000-4000-8000-000000000004','report-other@example.invalid','{}');
update ace.roles set role='editor' where user_id='08000000-0000-4000-8000-000000000001';
update ace.roles set role='admin' where user_id='08000000-0000-4000-8000-000000000002';
select set_config('request.jwt.claim.sub','08000000-0000-4000-8000-000000000002',true);
insert into ace.subjects(id,code,name,active)
 values('08000000-0000-4000-8000-000000000005','RPT','Question Reports',true);
insert into ace.syllabus_versions(id,season_id,subject_id,version,title,rights_status,status,activated_at)
 values('08000000-0000-4000-8000-000000000008',
  '03000000-0000-4000-8000-000000000009',
  '08000000-0000-4000-8000-000000000005',1,'Question report syllabus','approved','active',now());
insert into ace.topics(id,subject_id,syllabus_version_id,name,active)
 values('08000000-0000-4000-8000-000000000006',
  '08000000-0000-4000-8000-000000000005',
  '08000000-0000-4000-8000-000000000008','Algebra',true);

select set_config('request.jwt.claim.sub','08000000-0000-4000-8000-000000000001',true);
select ace.manage_question('save','08000000-0000-4000-8000-000000000007',0,
 jsonb_build_object(
  'subject_id','08000000-0000-4000-8000-000000000005',
  'topic_id','08000000-0000-4000-8000-000000000006','subtopic_id',null,
  'stem','What is 2 + 2?',
  'options',jsonb_build_array(jsonb_build_object('key','A','text','3'),
   jsonb_build_object('key','B','text','4'),jsonb_build_object('key','C','text','5'),
   jsonb_build_object('key','D','text','6')),
  'correct_option_key','B','explanation','Two plus two equals four.',
  'difficulty','easy','exam','ACE practice','exam_year',null,
  'provenance',jsonb_build_object('source_kind','original','source_title','ACE arithmetic',
   'author_label','ACE team','source_url',null,'rights_evidence','Original ACE question.')));
select ace.manage_question('submit','08000000-0000-4000-8000-000000000007',1,'{}');
select set_config('request.jwt.claim.sub','08000000-0000-4000-8000-000000000002',true);
select ace.manage_question('approve','08000000-0000-4000-8000-000000000007',2,'{}');
select ace.manage_question('publish','08000000-0000-4000-8000-000000000007',3,'{}');

insert into ace.attempts(
 id,user_id,mode,subject_id,started_at,duration_seconds,random_seed,
 question_order,option_order,status,question_snapshot
) values(
 '08000000-0000-4000-8000-000000000009',
 '08000000-0000-4000-8000-000000000003','practice',
 '08000000-0000-4000-8000-000000000005',clock_timestamp(),600,29,
 '["08000000-0000-4000-8000-000000000007"]'::jsonb,
 '{"08000000-0000-4000-8000-000000000007":["A","B","C","D"]}'::jsonb,
 'active',
 '[{"id":"08000000-0000-4000-8000-000000000007","content_version":4,"stem":"What is 2 + 2?","options":[{"key":"A","text":"3"},{"key":"B","text":"4"},{"key":"C","text":"5"},{"key":"D","text":"6"}],"correct_option_key":"B","subject_id":"08000000-0000-4000-8000-000000000005","topic_id":"08000000-0000-4000-8000-000000000006","difficulty":"easy"}]'::jsonb
);

select set_config('request.jwt.claim.sub','08000000-0000-4000-8000-000000000003',true);
select ace.submit_question_report(
 '08000000-0000-4000-8000-000000000009','08000000-0000-4000-8000-000000000007',
 'ambiguous','The wording is unclear and could have two interpretations.',
 '08000000-0000-4000-8000-00000000000a') as report \gset
select (:'report'::jsonb->>'id') as report_id \gset
select set_config('fcb03.report.id', :'report_id', true);
select ace.submit_question_report(
 '08000000-0000-4000-8000-000000000009','08000000-0000-4000-8000-000000000007',
 'ambiguous','The wording is unclear and could have two interpretations.',
 '08000000-0000-4000-8000-00000000000a') as duplicate \gset
select set_config('fcb03.report.duplicate_id', (:'duplicate'::jsonb->>'id'), true);

do $ownership$
begin
 if current_setting('fcb03.report.id')<>current_setting('fcb03.report.duplicate_id') then
  raise exception 'Idempotent report retry created a second report';
 end if;
end
$ownership$;

select set_config('request.jwt.claim.sub','08000000-0000-4000-8000-000000000004',true);
do $other_student$
begin
 begin
  perform ace.submit_question_report(
   '08000000-0000-4000-8000-000000000009','08000000-0000-4000-8000-000000000007',
   'incorrect_answer','I believe the answer key is incorrect.',
   '08000000-0000-4000-8000-00000000000b');
  raise exception 'Another student reported an attempt they did not own';
 exception when insufficient_privilege then null;
 end;
end
$other_student$;

select set_config('request.jwt.claim.sub','08000000-0000-4000-8000-000000000003',true);
do $student_admin_list$
begin
 begin
  perform ace.list_question_reports('open',50);
  raise exception 'Student listed administrator reports';
 exception when insufficient_privilege then null;
 end;
end
$student_admin_list$;

-- The reporter may submit at most five reports in a rolling 24-hour window.
select ace.submit_question_report(
 '08000000-0000-4000-8000-000000000009','08000000-0000-4000-8000-000000000007',
 'formatting','The mathematical formatting is difficult to read.',
 '08000000-0000-4000-8000-00000000000c');
select ace.submit_question_report(
 '08000000-0000-4000-8000-000000000009','08000000-0000-4000-8000-000000000007',
 'diagram','The diagram appears to be missing from this question.',
 '08000000-0000-4000-8000-00000000000d');
select ace.submit_question_report(
 '08000000-0000-4000-8000-000000000009','08000000-0000-4000-8000-000000000007',
 'other','Please check the explanation for clarity.',
 '08000000-0000-4000-8000-00000000000e');
select ace.submit_question_report(
 '08000000-0000-4000-8000-000000000009','08000000-0000-4000-8000-000000000007',
 'incorrect_answer','The correct answer may not match the question.',
 '08000000-0000-4000-8000-00000000000f');
do $rate_limit$
begin
 begin
  perform ace.submit_question_report(
   '08000000-0000-4000-8000-000000000009','08000000-0000-4000-8000-000000000007',
   'ambiguous','This is another report beyond the allowed daily limit.',
   '08000000-0000-4000-8000-000000000010');
  raise exception 'Question report rate limit was bypassed';
 exception when sqlstate 'P0001' then null;
 end;
end
$rate_limit$;

select set_config('request.jwt.claim.sub','08000000-0000-4000-8000-000000000002',true);
select ace.list_question_reports('open',50) as reports \gset
select set_config('fcb03.report.list', :'reports', true);
do $admin_list$
begin
 if jsonb_array_length(current_setting('fcb03.report.list')::jsonb)<>5 then
  raise exception 'Administrator report list omitted or leaked report rows';
 end if;
 if not exists(select 1 from ace.question_reports where id=current_setting('fcb03.report.id')::uuid
  and reporter_id='08000000-0000-4000-8000-000000000003'
  and question_version=4 and status='open') then
  raise exception 'Report was not bound to the authenticated student and frozen revision';
 end if;
end
$admin_list$;

select ace.manage_question_report(current_setting('fcb03.report.id')::uuid,'triage',
 'The editorial team is checking this question.');
select ace.manage_question_report(current_setting('fcb03.report.id')::uuid,'resolve',
 'The wording was reviewed and the report has been addressed.');
select ace.manage_question_report(current_setting('fcb03.report.id')::uuid,'resolve',
 'The wording was reviewed and the report has been addressed.');

do $final$
begin
 if not exists(select 1 from ace.question_reports where id=current_setting('fcb03.report.id')::uuid
  and status='resolved' and handled_by='08000000-0000-4000-8000-000000000002') then
  raise exception 'Administrator report resolution was not recorded';
 end if;
 if not exists(select 1 from ace.questions where id='08000000-0000-4000-8000-000000000007'
  and active and review_status='published') then
  raise exception 'A student report automatically changed question publication state';
 end if;
 if (select count(*) from ace.audit_events where entity_type='question_report'
  and entity_id=current_setting('fcb03.report.id')::uuid)<3 then
  raise exception 'Report submission, triage and resolution audit trail is incomplete';
 end if;
 if has_table_privilege('anon','ace.question_reports','select')
  or has_table_privilege('authenticated','ace.question_reports','select')
  or has_table_privilege('authenticated','ace.question_reports','insert')
  or has_table_privilege('authenticated','ace.question_reports','update') then
  raise exception 'Question report table is directly exposed to client roles';
 end if;
 raise notice 'FCB-03 question reporting PASS: attempt ownership, frozen revision, idempotency, rate limit, admin triage/resolution, audit and private table grants';
end
$final$;
rollback;

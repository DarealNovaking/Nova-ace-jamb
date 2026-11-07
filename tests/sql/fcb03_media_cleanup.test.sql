\set ON_ERROR_STOP on
-- Disposable PostgreSQL only. Verifies the claim/delete/complete boundary;
-- the HTTP worker and Storage adapter are tested separately with mocks.
\ir ../../supabase/proposals/fcb03_media_cleanup.sql
select 'create role ace_media_executor nologin' where not exists(
 select 1 from pg_catalog.pg_roles where rolname='ace_media_executor') \gexec
grant usage on schema ace to ace_media_executor;
grant execute on function ace.claim_expired_question_media_cleanup(integer) to ace_media_executor;
grant execute on function ace.complete_question_media_cleanup(uuid,uuid) to ace_media_executor;

begin;
insert into auth.users(id,email,raw_user_meta_data) values
 ('07000000-0000-4000-8000-000000000001','cleanup-editor@example.invalid','{}');
update ace.roles set role='editor' where user_id='07000000-0000-4000-8000-000000000001';
select set_config('request.jwt.claim.sub','07000000-0000-4000-8000-000000000001',true);
insert into ace.subjects(id,code,name,active)
 values('07000000-0000-4000-8000-000000000005','MCL','Media Cleanup',true);
insert into ace.syllabus_versions(id,season_id,subject_id,version,title,rights_status,status,activated_at)
 values('07000000-0000-4000-8000-000000000008',
  '03000000-0000-4000-8000-000000000009',
  '07000000-0000-4000-8000-000000000005',1,'Media cleanup syllabus','approved','active',now());
insert into ace.topics(id,subject_id,syllabus_version_id,name,active)
 values('07000000-0000-4000-8000-000000000006',
  '07000000-0000-4000-8000-000000000008','Geometry',true);

select ace.manage_question('save','07000000-0000-4000-8000-000000000004',0,
 jsonb_build_object(
  'subject_id','07000000-0000-4000-8000-000000000005',
  'topic_id','07000000-0000-4000-8000-000000000006','subtopic_id',null,
  'stem','Find the area of a square.',
  'options',jsonb_build_array(jsonb_build_object('key','A','text','4 square units'),
   jsonb_build_object('key','B','text','8 square units'),jsonb_build_object('key','C','text','12 square units'),
   jsonb_build_object('key','D','text','16 square units')),
  'correct_option_key','A','explanation','Multiply the side by itself.',
  'difficulty','easy','exam','ACE practice','exam_year',null,
  'provenance',jsonb_build_object('source_kind','original','source_title','ACE square',
   'author_label','ACE team','source_url',null,'rights_evidence','Original practice question.')));

select (ace.reserve_question_media_intent(
 '07000000-0000-4000-8000-000000000004',1,'07000000-0000-4000-8000-00000000000b',
 'An original square diagram','Original diagram created by ACE.','image/png',12,repeat('a',64))->>'id'
) as eligible_id \gset
select (ace.reserve_question_media_intent(
 '07000000-0000-4000-8000-000000000004',1,'07000000-0000-4000-8000-00000000000c',
 'A history-referenced diagram','Original diagram created by ACE.','image/png',12,repeat('b',64))->>'id'
) as referenced_id \gset
select (ace.reserve_question_media_intent(
 '07000000-0000-4000-8000-000000000004',1,'07000000-0000-4000-8000-00000000000d',
 'A recently expired diagram','Original diagram created by ACE.','image/png',12,repeat('c',64))->>'id'
) as recent_id \gset
select (ace.reserve_question_media_intent(
 '07000000-0000-4000-8000-000000000004',1,'07000000-0000-4000-8000-00000000000e',
 'A verified diagram','Original diagram created by ACE.','image/png',12,repeat('d',64))->>'id'
) as verified_id \gset
select ace.confirm_question_media_intent(:'verified_id'::uuid,'image/png',12,repeat('d',64));

update ace.question_media_intents set expires_at=clock_timestamp()-interval '2 hours'
 where id=:'eligible_id'::uuid or id=:'referenced_id'::uuid;
update ace.question_media_intents set expires_at=clock_timestamp()-interval '10 minutes'
 where id=:'recent_id'::uuid;

-- Even an unusual/stale historical reference prevents cleanup.
insert into ace.question_versions(question_id,version,snapshot,created_by)
 values('07000000-0000-4000-8000-000000000004',99,
  jsonb_build_object('id','07000000-0000-4000-8000-000000000004',
   'content_version','99','rich_content',jsonb_build_object('version',1,
    'blocks',jsonb_build_array(jsonb_build_object('type','image',
     'asset_id',:'referenced_id'::text,'alt','A history-referenced diagram')))),
  '07000000-0000-4000-8000-000000000001');

do $acl$
begin
 if has_function_privilege('anon','ace.claim_expired_question_media_cleanup(integer)','execute')
  or has_function_privilege('authenticated','ace.claim_expired_question_media_cleanup(integer)','execute')
  or has_function_privilege('anon','ace.complete_question_media_cleanup(uuid,uuid)','execute')
  or has_function_privilege('authenticated','ace.complete_question_media_cleanup(uuid,uuid)','execute')
  or not has_function_privilege('ace_media_executor','ace.claim_expired_question_media_cleanup(integer)','execute')
  or not has_function_privilege('ace_media_executor','ace.complete_question_media_cleanup(uuid,uuid)','execute')
  or has_table_privilege('ace_media_executor','ace.question_media_intents','select') then
  raise exception 'Media cleanup executor privilege boundary failed';
 end if;
end
$acl$;

reset role;
set session authorization ace_media_executor;
select * from ace.claim_expired_question_media_cleanup(20) \gset first_
select count(*) as duplicate_claims from ace.claim_expired_question_media_cleanup(20) \gset
do $claim$
begin
 if :'duplicate_claims'::integer<>0 then
  raise exception 'A live cleanup lease was claimed twice';
 end if;
end
$claim$;
select ace.complete_question_media_cleanup(:'first_intent_id'::uuid,gen_random_uuid()) as wrong_token \gset
do $wrong_token$
begin
 if :'wrong_token'::boolean then raise exception 'Wrong cleanup token completed a claim'; end if;
end
$wrong_token$;
update ace.question_media_intents set cleanup_claimed_at=clock_timestamp()-interval '20 minutes'
 where id=:'first_intent_id'::uuid;
select * from ace.claim_expired_question_media_cleanup(20) \gset retry_
select ace.complete_question_media_cleanup(:'first_intent_id'::uuid,:'first_claim_token'::uuid) as stale_token \gset
do $stale_token$
begin
 if :'stale_token'::boolean then raise exception 'Stale cleanup token completed a reclaimed claim'; end if;
end
$stale_token$;
select ace.complete_question_media_cleanup(:'retry_intent_id'::uuid,:'retry_claim_token'::uuid) as completed \gset
reset session authorization;

do $result$
begin
 if not :'completed'::boolean then raise exception 'Valid cleanup claim did not complete'; end if;
 if exists(select 1 from ace.question_media_intents where id=:'eligible_id'::uuid) then
  raise exception 'Eligible expired unreferenced intent was not removed';
 end if;
 if not exists(select 1 from ace.question_media_intents where id=:'referenced_id'::uuid)
  or not exists(select 1 from ace.question_media_intents where id=:'recent_id'::uuid)
  or not exists(select 1 from ace.question_media_intents where id=:'verified_id'::uuid) then
  raise exception 'Referenced, recently expired or verified media was removed';
 end if;
 raise notice 'FCB-03 media cleanup PASS: grace period, immutable-reference protection, executor-only claims, leases, stale-token denial';
end
$result$;
rollback;

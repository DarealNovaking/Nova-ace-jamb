-- Synthetic disposable recovered database only; no production content.
\i supabase/proposals/fcb_01_syllabus_version_identity.sql
begin;
insert into auth.users(id,email,raw_user_meta_data) values ('97000000-0000-4000-8000-000000000001','version-admin@example.invalid','{}');
update ace.roles set role='admin' where user_id='97000000-0000-4000-8000-000000000001';
select set_config('request.jwt.claim.sub','97000000-0000-4000-8000-000000000001',true);
insert into ace.subjects(id,code,name) values ('97100000-0000-4000-8000-000000000001','ENG','Synthetic English'),('97100000-0000-4000-8000-000000000002','ALT','Synthetic other subject');
insert into ace.exam_seasons(id,code,name,exam_year) values ('97200000-0000-4000-8000-000000000001','version-a','Synthetic season A',2027),('97200000-0000-4000-8000-000000000002','version-b','Synthetic season B',2028);
insert into ace.syllabus_versions(id,season_id,subject_id,title) values
 ('97300000-0000-4000-8000-000000000001','97200000-0000-4000-8000-000000000001','97100000-0000-4000-8000-000000000001','Synthetic version A'),
 ('97300000-0000-4000-8000-000000000002','97200000-0000-4000-8000-000000000002','97100000-0000-4000-8000-000000000001','Synthetic version B');
insert into ace.topics(id,subject_id,syllabus_version_id,name) values
 ('97400000-0000-4000-8000-000000000001','97100000-0000-4000-8000-000000000001','97300000-0000-4000-8000-000000000001','Synthetic shared topic'),
 ('97400000-0000-4000-8000-000000000002','97100000-0000-4000-8000-000000000001','97300000-0000-4000-8000-000000000002','Synthetic shared topic');
insert into ace.subtopics(topic_id,syllabus_version_id,name) values
 ('97400000-0000-4000-8000-000000000001','97300000-0000-4000-8000-000000000001','Synthetic child'),
 ('97400000-0000-4000-8000-000000000002','97300000-0000-4000-8000-000000000002','Synthetic child');
do $$ begin
 begin insert into ace.topics(subject_id,syllabus_version_id,name) values ('97100000-0000-4000-8000-000000000001','97300000-0000-4000-8000-000000000001','Synthetic shared topic'); raise exception 'duplicate within version accepted'; exception when unique_violation then null; end;
 begin insert into ace.topics(subject_id,syllabus_version_id,name) values ('97100000-0000-4000-8000-000000000002','97300000-0000-4000-8000-000000000001','Synthetic wrong subject'); raise exception 'version/subject mismatch accepted'; exception when foreign_key_violation then null; end;
 begin insert into ace.subtopics(topic_id,syllabus_version_id,name) values ('97400000-0000-4000-8000-000000000001','97300000-0000-4000-8000-000000000002','Synthetic wrong version'); raise exception 'parent/child version mismatch accepted'; exception when foreign_key_violation then null; end;
 insert into ace.topics(subject_id,name) values ('97100000-0000-4000-8000-000000000001','Synthetic legacy topic');
 begin insert into ace.topics(subject_id,name) values ('97100000-0000-4000-8000-000000000001','Synthetic legacy topic'); raise exception 'legacy duplicate accepted'; exception when unique_violation then null; end;
 delete from ace.topics where id='97400000-0000-4000-8000-000000000002';
 if exists(select 1 from ace.subtopics where topic_id='97400000-0000-4000-8000-000000000002') then raise exception 'topic delete no longer cascades to its children'; end if;
end $$;
rollback;
select 'FCB-01 syllabus version identity tests passed' result;

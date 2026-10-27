-- Synthetic content/auth fixture, disposable recovered database only; leaves transaction open.
begin;
insert into auth.users(id,email,raw_user_meta_data) values
 ('31000000-0000-4000-8000-000000000001','cbt-one@example.invalid','{}'),
 ('32000000-0000-4000-8000-000000000002','cbt-two@example.invalid','{}');
insert into ace.subjects(id,code,name) values ('41000000-0000-4000-8000-000000000001','ENG','Synthetic English');
update ace.roles set role='admin' where user_id='31000000-0000-4000-8000-000000000001';
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000001',true);
insert into ace.exam_seasons(id,code,name,exam_year) values ('51000000-0000-4000-8000-000000000001','synthetic-cbt','Synthetic CBT season',2027);
insert into ace.syllabus_versions(id,season_id,subject_id,title,status,rights_status) values
 ('61000000-0000-4000-8000-000000000001','51000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000001','Synthetic syllabus','active','approved');
insert into ace.topics(id,subject_id,syllabus_version_id,name) values
 ('71000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000001','61000000-0000-4000-8000-000000000001','Synthetic topic');
update ace.roles set role='student' where user_id='31000000-0000-4000-8000-000000000001';
insert into ace.questions(topic_id,subject_id,id,stem,options,correct_option_key,active,review_status,rights_status) values
 ('71000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000001','Synthetic scoring question','[{"key":"A","text":"Choice A"},{"key":"B","text":"Choice B"}]','A',true,'published','owned');

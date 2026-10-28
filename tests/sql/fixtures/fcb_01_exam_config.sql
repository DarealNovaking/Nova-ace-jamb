-- Synthetic exam metadata only; disposable recovered database; transaction left open.
begin;
insert into auth.users(id,email,raw_user_meta_data) values
 ('81000000-0000-4000-8000-000000000001','config-admin@example.invalid','{}'),
 ('82000000-0000-4000-8000-000000000002','config-editor@example.invalid','{}'),
 ('86000000-0000-4000-8000-000000000003','config-student@example.invalid','{}');
update ace.roles set role=case when user_id='81000000-0000-4000-8000-000000000001' then 'admin' else 'editor' end
where user_id in ('81000000-0000-4000-8000-000000000001','82000000-0000-4000-8000-000000000002');
select set_config('request.jwt.claim.sub','81000000-0000-4000-8000-000000000001',true);
insert into ace.exam_seasons(id,code,name,exam_year) values ('83000000-0000-4000-8000-000000000001','config-fixture','Synthetic configuration season',2027);
insert into ace.subjects(id,code,name) values
 ('84000000-0000-4000-8000-000000000001','ENG','Synthetic English'),
 ('84000000-0000-4000-8000-000000000002','SYN2','Synthetic 2'),
 ('84000000-0000-4000-8000-000000000003','SYN3','Synthetic 3'),
 ('84000000-0000-4000-8000-000000000004','SYN4','Synthetic 4');
insert into ace.exam_configs(id,season_id,name,duration_seconds,total_questions,option_count,version) values
 ('85000000-0000-4000-8000-000000000001','83000000-0000-4000-8000-000000000001','Synthetic config one',600,4,4,1),
 ('85000000-0000-4000-8000-000000000002','83000000-0000-4000-8000-000000000001','Synthetic config two',600,4,4,3);
insert into ace.exam_config_subjects(exam_config_id,subject_id,required,question_count)
select c.id,s.id,s.code='ENG',1 from ace.exam_configs c cross join ace.subjects s
where c.season_id='83000000-0000-4000-8000-000000000001';

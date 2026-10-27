-- Disposable recovered schema only. No real exam configuration is represented.
\i supabase/proposals/fcb_01_exam_config_security.sql
\i tests/sql/fixtures/fcb_01_exam_config.sql
set local role authenticated;
select set_config('request.jwt.claim.sub','82000000-0000-4000-8000-000000000002',true);
do $$ begin
 begin perform ace.activate_exam_config('85000000-0000-4000-8000-000000000001'); raise exception 'editor activated exam configuration'; exception when sqlstate '42501' then null; end;
end $$;

-- Draft authoring remains available to editors.
update ace.exam_config_subjects set metadata='{"note":"synthetic draft"}'
where exam_config_id='85000000-0000-4000-8000-000000000002';
reset role;
-- A later draft may already occupy the next version; activation must not change identity.
update ace.exam_configs set version=2 where id='85000000-0000-4000-8000-000000000002';
set local role authenticated;
select set_config('request.jwt.claim.sub','81000000-0000-4000-8000-000000000001',true);
select ace.activate_exam_config('85000000-0000-4000-8000-000000000001');
select ace.activate_exam_config('85000000-0000-4000-8000-000000000001');
reset role;
do $$ begin
 if (select version from ace.exam_configs where id='85000000-0000-4000-8000-000000000001')<>1 then raise exception 'activation changed configuration identity'; end if;
 if (select count(*) from ace.audit_events where event_type='exam_config_activated' and entity_id='85000000-0000-4000-8000-000000000001')<>1 then raise exception 'activation replay audit duplicate'; end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','82000000-0000-4000-8000-000000000002',true);
do $$ begin
 begin update ace.exam_config_subjects set question_count=2 where exam_config_id='85000000-0000-4000-8000-000000000001'; raise exception 'editor rewrote active composition'; exception when sqlstate '42501' then null; end;
 begin delete from ace.exam_config_subjects where exam_config_id='85000000-0000-4000-8000-000000000001'; raise exception 'editor deleted active composition'; exception when sqlstate '42501' then null; end;
 begin update ace.exam_config_subjects set exam_config_id='85000000-0000-4000-8000-000000000002' where exam_config_id='85000000-0000-4000-8000-000000000001'; raise exception 'editor moved active composition'; exception when sqlstate '42501' then null; end;
end $$;
reset role;
-- Require English + any three configured active optional subjects, with consistent totals.
update ace.exam_config_subjects set required=(subject_id='84000000-0000-4000-8000-000000000002') where exam_config_id='85000000-0000-4000-8000-000000000002';
set local role authenticated;
select set_config('request.jwt.claim.sub','81000000-0000-4000-8000-000000000001',true);
do $$ begin
 if (ace.validate_exam_config('85000000-0000-4000-8000-000000000002')->>'valid')::boolean then raise exception 'non-English required configuration accepted'; end if;
 begin perform ace.activate_exam_config('85000000-0000-4000-8000-000000000002'); raise exception 'invalid configuration activated'; exception when sqlstate '22023' then null; end;
end $$;
reset role;
update ace.exam_config_subjects set required=(subject_id='84000000-0000-4000-8000-000000000001') where exam_config_id='85000000-0000-4000-8000-000000000002';
insert into ace.subjects(id,code,name) values ('84000000-0000-4000-8000-000000000005','SYN5','Synthetic 5');
insert into ace.exam_config_subjects(exam_config_id,subject_id,required,question_count) values ('85000000-0000-4000-8000-000000000002','84000000-0000-4000-8000-000000000005',false,2);
set local role authenticated;
do $$ begin
 if (ace.validate_exam_config('85000000-0000-4000-8000-000000000002')->>'valid')::boolean then raise exception 'inconsistent optional combination totals accepted'; end if;
end $$;
reset role;
update ace.exam_config_subjects set question_count=1 where exam_config_id='85000000-0000-4000-8000-000000000002';
set local role authenticated;
select ace.activate_exam_config('85000000-0000-4000-8000-000000000002');
reset role;
do $$ begin
 if (select count(*) from ace.exam_configs where season_id='83000000-0000-4000-8000-000000000001' and active)<>1 then raise exception 'multiple active configurations'; end if;
 if has_function_privilege('authenticated','ace.guard_exam_composition()','EXECUTE') or has_function_privilege('anon','ace.activate_exam_config(uuid)','EXECUTE') then raise exception 'configuration guard/activation exposed'; end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub','86000000-0000-4000-8000-000000000003',true);
do $$ begin
 if exists(select 1 from ace.exam_seasons where id='83000000-0000-4000-8000-000000000001') or exists(select 1 from ace.exam_configs where season_id='83000000-0000-4000-8000-000000000001') then raise exception 'student saw unpublished season/configuration'; end if;
end $$;
select set_config('request.jwt.claim.sub','82000000-0000-4000-8000-000000000002',true);
do $$ begin
 begin perform ace.activate_exam_season('83000000-0000-4000-8000-000000000001'); raise exception 'editor activated season'; exception when sqlstate '42501' then null; end;
end $$;
select set_config('request.jwt.claim.sub','81000000-0000-4000-8000-000000000001',true);
do $$ begin
 begin perform ace.activate_exam_season('83000000-0000-4000-8000-000000000001'); raise exception 'season without approved trees activated'; exception when sqlstate '22023' then null; end;
end $$;
reset role;
-- Purely synthetic reviewed trees establish the test's publication precondition.
insert into ace.syllabus_versions(season_id,subject_id,title,status,rights_status)
select '83000000-0000-4000-8000-000000000001',id,'Synthetic approved tree','active','approved' from ace.subjects;
insert into ace.topics(subject_id,syllabus_version_id,name) select subject_id,id,'Synthetic topic' from ace.syllabus_versions;
insert into ace.subtopics(topic_id,syllabus_version_id,name) select id,syllabus_version_id,'Synthetic subtopic' from ace.topics;
do $$ declare kind text; begin
 foreach kind in array array['topic','subtopic'] loop
  begin
   if kind='topic' then update ace.topics set active=false where subject_id='84000000-0000-4000-8000-000000000001';
   else update ace.subtopics set active=false where topic_id in(select id from ace.topics where subject_id='84000000-0000-4000-8000-000000000001'); end if;
   set local role authenticated;
   begin perform ace.activate_exam_season('83000000-0000-4000-8000-000000000001'); raise exception 'season accepted unpublished %',kind; exception when sqlstate '22023' then null; end;
   reset role;
   raise exception using errcode='Z0001',message='restore synthetic publication flags';
  exception when sqlstate 'Z0001' then null;
  end;
 end loop;
end $$;
set local role authenticated;
select ace.activate_exam_season('83000000-0000-4000-8000-000000000001');
select ace.activate_exam_season('83000000-0000-4000-8000-000000000001');
select set_config('request.jwt.claim.sub','86000000-0000-4000-8000-000000000003',true);
do $$ begin
 if (select count(*) from ace.exam_configs where season_id='83000000-0000-4000-8000-000000000001')<>1 then raise exception 'student active metadata visibility incorrect'; end if;
 if exists(select 1 from ace.exam_config_subjects where exam_config_id='85000000-0000-4000-8000-000000000001') then raise exception 'inactive configuration subjects leaked'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub','81000000-0000-4000-8000-000000000001',true);

update ace.exam_seasons set status='closed' where id='83000000-0000-4000-8000-000000000001';
set local role authenticated;
do $$ begin
 begin perform ace.activate_exam_config('85000000-0000-4000-8000-000000000001'); raise exception 'closed season configuration activated'; exception when sqlstate '22023' then null; end;
end $$;
reset role;

rollback;
select 'FCB-01 exam configuration authorization tests passed' result;

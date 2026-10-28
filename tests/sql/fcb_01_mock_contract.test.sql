-- Disposable recovered schema only; all composition/content below is synthetic.
\i tests/sql/fixtures/fcb_01_cbt_contract.sql
\i supabase/migrations/20261028043630_fcb_01_attempt_question_delivery.sql
\i tests/sql/fixtures/fcb_01_cbt_content.sql
set local role authenticated;
do $$ begin
 begin
  perform ace.start_attempt('mock',null,1,600,null);
  raise exception 'mock accepted caller-controlled composition and duration';
 exception when sqlstate '22023' then null;
 end;
end $$;
reset role;
rollback;
\i supabase/migrations/20261028032933_fcb_01_exam_config_security.sql
\i supabase/migrations/20261028043747_fcb_01_mock_contract.sql
\i tests/sql/fixtures/fcb_01_mock_content.sql
set local role authenticated;
select set_config('request.jwt.claim.sub','86000000-0000-4000-8000-000000000003',true);
do $$ declare a jsonb; subjects uuid[]:=array[
 '84000000-0000-4000-8000-000000000001'::uuid,'84000000-0000-4000-8000-000000000002'::uuid,
 '84000000-0000-4000-8000-000000000003'::uuid,'84000000-0000-4000-8000-000000000004'::uuid]; begin
 a:=ace.start_mock_attempt('85000000-0000-4000-8000-000000000001',subjects);
 if (a->>'duration_seconds')::integer<>600 or (a->>'question_count')::integer<>4 then raise exception 'mock did not use approved bounds'; end if;
 perform set_config('ace.test_mock',a->>'attempt_id',true);
 if a::text ~ 'correct_option_key|question_snapshot' then raise exception 'mock start leaked answer material'; end if;
 begin perform ace.start_mock_attempt('85000000-0000-4000-8000-000000000002',subjects); raise exception 'draft mock accepted'; exception when sqlstate 'P0002' then null; end;
 begin perform ace.start_mock_attempt(null,subjects); raise exception 'null config'; exception when sqlstate '22023' then null; end;
 begin perform ace.start_mock_attempt('85000000-0000-4000-8000-000000000001',null); raise exception 'null subjects'; exception when sqlstate '22023' then null; end;
 begin perform ace.start_mock_attempt('85000000-0000-4000-8000-000000000001',subjects[2:4]); raise exception 'English omitted'; exception when sqlstate '22023' then null; end;
 begin perform ace.start_mock_attempt('85000000-0000-4000-8000-000000000001',array[subjects[1],subjects[2],subjects[3],subjects[3]]); raise exception 'duplicate subject'; exception when sqlstate '22023' then null; end;
 begin perform ace.start_mock_attempt('85000000-0000-4000-8000-000000000001',array[subjects[1],subjects[2],subjects[3],null]); raise exception 'null subject'; exception when sqlstate '22023' then null; end;
 begin perform ace.start_mock_attempt('85000000-0000-4000-8000-000000000001',array[subjects[1],subjects[2],subjects[3],'84000000-0000-4000-8000-000000000099'::uuid]); raise exception 'unconfigured subject'; exception when sqlstate '22023' then null; end;
 perform set_config('request.jwt.claim.sub','',true);
 begin perform ace.start_mock_attempt('85000000-0000-4000-8000-000000000001',subjects); raise exception 'anonymous mock'; exception when sqlstate '28000' then null; end;
end $$;
reset role;
do $$ declare v_attempt_id uuid:=current_setting('ace.test_mock')::uuid; n integer; begin
 if not exists(select 1 from ace.attempts where attempts.id=v_attempt_id and mode='mock'
   and exam_config_id='85000000-0000-4000-8000-000000000001'
   and exam_config_snapshot->>'version'='1') then raise exception 'mock config not frozen'; end if;
 begin update ace.attempts set exam_config_snapshot='{}' where attempts.id=v_attempt_id; raise exception 'mock provenance editable'; exception when sqlstate '23514' then null; end;
 select count(*) into n from ace.attempts;
 -- Each withdrawal must fail atomically, never deliver a partial or cross-season paper.
 perform set_config('request.jwt.claim.sub','81000000-0000-4000-8000-000000000001',true);
 for kind in 1..7 loop
  begin
   if kind=1 then update ace.questions set rights_status='unknown';
   elsif kind=2 then update ace.syllabus_versions set status='archived';
   elsif kind=3 then update ace.topics set active=false;
   elsif kind=4 then update ace.questions set options='[{"key":"A","text":"A"},{"key":"A","text":"duplicate"},{"key":"C","text":"C"},{"key":"D","text":"D"}]';
   elsif kind=5 then update ace.exam_seasons set status='closed';
   elsif kind=6 then update ace.subtopics set active=false;
   else update ace.questions set options='{}'; end if;
   set local role authenticated;
   perform set_config('request.jwt.claim.sub','86000000-0000-4000-8000-000000000003',true);
   begin
    perform ace.start_mock_attempt('85000000-0000-4000-8000-000000000001',array(select subject_id from ace.exam_config_subjects where exam_config_id='85000000-0000-4000-8000-000000000001'));
    raise exception 'mock accepted unavailable content/season %',kind;
   exception when sqlstate 'P0002' then null; end;
   reset role;
   if (select count(*) from ace.attempts)<>n then raise exception 'failed mock left attempt row'; end if;
   raise exception using errcode='Z0001',message='restore synthetic source';
  exception when sqlstate 'Z0001' then null; end;
 end loop;
 if has_function_privilege('anon','ace.start_mock_attempt(uuid,uuid[])','EXECUTE')
    or has_function_privilege('authenticated','ace.guard_mock_provenance()','EXECUTE')
    or has_table_privilege('authenticated','ace.attempts','UPDATE') then raise exception 'mock grants widened'; end if;
end $$;
-- Later approved metadata changes cannot rewrite an existing attempt's provenance.
update ace.exam_configs set duration_seconds=900,version=4 where id='85000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub','86000000-0000-4000-8000-000000000003',true);
do $$ declare v_id uuid:=current_setting('ace.test_mock')::uuid; paper jsonb; q jsonb; result jsonb; begin
 if (ace.resume_attempt(v_id)->>'duration_seconds')::integer<>600 then raise exception 'existing mock timing changed'; end if;
 paper:=ace.get_attempt_questions(v_id);
 if jsonb_array_length(paper)<>4 or paper::text ~ 'correct_option_key|exam_config_snapshot' then raise exception 'mock delivery unsafe'; end if;
 for q in select * from jsonb_array_elements(paper) loop
  perform ace.save_attempt_answer(v_id,(q->>'id')::uuid,'A',1);
 end loop;
 result:=ace.submit_attempt(v_id);
 if (result->>'score')::numeric<>100 or (result->>'total_questions')::integer<>4 then raise exception 'mock grading broke'; end if;
 if ace.submit_attempt(v_id)<>result then raise exception 'mock submit not idempotent'; end if;
end $$;
reset role;
do $$ begin
 if not exists(select 1 from ace.attempts where id=current_setting('ace.test_mock')::uuid
  and exam_config_snapshot->>'version'='1' and exam_config_snapshot->>'duration_seconds'='600') then
  raise exception 'old mock provenance changed'; end if;
end $$;
do $$ begin
 if (select starts from ace.cbt_start_usage where user_id='86000000-0000-4000-8000-000000000003')<>1 then
  raise exception 'mock consumed multiple starts'; end if;
end $$;
update ace.cbt_mode_access set enabled=false where mode='mock';
set local role authenticated;
do $$ begin
 begin
  perform ace.start_mock_attempt('85000000-0000-4000-8000-000000000001',array(select subject_id from ace.exam_config_subjects where exam_config_id='85000000-0000-4000-8000-000000000001'));
  raise exception 'mock used free practice policy' using errcode='Z0001';
 exception when sqlstate '42501' then null; end;
end $$;
reset role;
update ace.cbt_mode_access set enabled=(mode<>'practice');
set local role authenticated;
-- A mock must not depend on practice being enabled, nor charge it a second time.
select ace.start_mock_attempt('85000000-0000-4000-8000-000000000001',array(select subject_id from ace.exam_config_subjects where exam_config_id='85000000-0000-4000-8000-000000000001'));
reset role;
rollback;
select 'FCB-01 approved mock contract tests passed' result;

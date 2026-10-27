-- Run only AFTER the recovered baseline in a disposable database. No live fixtures.
\i supabase/proposals/fcb_01_cbt_mutation_contract.sql
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
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000001',true);
do $$ declare a jsonb; saved jsonb; resumed jsonb; result jsonb; begin
 -- RED: invoker RPC currently cannot create an attempt without unsafe table grants.
 a:=ace.start_attempt('practice',null,1,600,array['11000000-0000-4000-8000-000000000001'::uuid]);
 perform set_config('ace.test_attempt',a->>'attempt_id',true);
 saved:=ace.save_attempt_answer((a->>'attempt_id')::uuid,'11000000-0000-4000-8000-000000000001','A',1000);
 if saved ? 'is_correct' or saved ? 'correct_count' or saved ? 'score' then raise exception 'answer save leaked correctness'; end if;
 resumed:=ace.resume_attempt((a->>'attempt_id')::uuid);
 if resumed->>'score' is not null or (resumed->>'correct_count')::integer<>0 then raise exception 'active resume leaked correctness'; end if;
 if resumed::text ~ 'is_correct|correct_option_key|explanation' then raise exception 'resume leaked answer key'; end if;
 -- Change selection before submission: score must reflect last stored selection only.
 perform ace.save_attempt_answer((a->>'attempt_id')::uuid,'11000000-0000-4000-8000-000000000001','B',2000);
 result:=ace.submit_attempt((a->>'attempt_id')::uuid);
 if (result->>'score')::numeric<>0 or (result->>'correct_count')::integer<>0 or (result->>'answered_count')::integer<>1 then raise exception 'server scoring incorrect'; end if;
 if ace.submit_attempt((a->>'attempt_id')::uuid)<>result then raise exception 'submit replay changed result'; end if;
 begin
  perform ace.save_attempt_answer((a->>'attempt_id')::uuid,'11000000-0000-4000-8000-000000000001','A',3000);
  raise exception 'completed answer mutation accepted';
 exception when sqlstate '22023' then null;
 end;
end $$;
reset role;
do $$ begin
 if (select attempts from ace.student_question_stats where user_id='31000000-0000-4000-8000-000000000001')<>1 then raise exception 'replay duplicated statistics'; end if;
 if has_table_privilege('authenticated','ace.attempts','UPDATE') or has_table_privilege('authenticated','ace.attempt_answers','UPDATE') then raise exception 'client score/answer grant'; end if;
end $$;

-- Owner isolation applies to both reads and writes, even with a guessed valid ID.
set local role authenticated;
select set_config('request.jwt.claim.sub','32000000-0000-4000-8000-000000000002',true);
do $$ declare id uuid:=current_setting('ace.test_attempt')::uuid; begin
 begin perform ace.resume_attempt(id); raise exception 'cross-owner resume'; exception when sqlstate 'P0002' then null; end;
 begin perform ace.save_attempt_answer(id,'11000000-0000-4000-8000-000000000001','A',1); raise exception 'cross-owner save'; exception when sqlstate 'P0002' then null; end;
 begin perform ace.submit_attempt(id); raise exception 'cross-owner submit'; exception when sqlstate 'P0002' then null; end;
end $$;
select set_config('request.jwt.claim.sub','',true);
do $$ begin
 begin perform ace.start_attempt('practice',null,1,600,null); raise exception 'identity-free start'; exception when sqlstate '28000' then null; end;
 begin perform ace.resume_attempt(current_setting('ace.test_attempt')::uuid); raise exception 'identity-free resume'; exception when sqlstate '28000' then null; end;
 begin perform ace.save_attempt_answer(current_setting('ace.test_attempt')::uuid,'11000000-0000-4000-8000-000000000001','A',1); raise exception 'identity-free save'; exception when sqlstate '28000' then null; end;
 begin perform ace.submit_attempt(current_setting('ace.test_attempt')::uuid); raise exception 'identity-free submit'; exception when sqlstate '28000' then null; end;
end $$;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000001',true);
do $$ declare a jsonb; id uuid; saved jsonb; begin
 a:=ace.start_attempt('practice',null,1,600,null);id:=(a->>'attempt_id')::uuid;
 perform set_config('ace.test_active',id::text,true);
 begin perform ace.start_attempt(null,null,1,600,null); raise exception 'NULL mode'; exception when sqlstate '22023' then null; end;
 begin perform ace.start_attempt('practice',null,null,600,null); raise exception 'NULL count'; exception when sqlstate '22023' then null; end;
 begin perform ace.start_attempt('practice',null,1,null,null); raise exception 'NULL duration'; exception when sqlstate '22023' then null; end;
 begin perform ace.save_attempt_answer(id,'11000000-0000-4000-8000-000000000001','Z',0); raise exception 'invalid option'; exception when sqlstate '22023' then null; end;
 begin perform ace.save_attempt_answer(id,'11000000-0000-4000-8000-000000000001','A',-1); raise exception 'negative response'; exception when sqlstate '22023' then null; end;
 begin perform ace.save_attempt_answer(id,'11000000-0000-4000-8000-000000000001','A',600001); raise exception 'oversized response'; exception when sqlstate '22023' then null; end;
 begin perform ace.save_attempt_answer(id,'11000000-0000-4000-8000-000000000099','A',1); raise exception 'non-assigned question'; exception when sqlstate 'P0002' then null; end;
 perform ace.save_attempt_answer(id,'11000000-0000-4000-8000-000000000001','A',1);
 saved:=ace.save_attempt_answer(id,'11000000-0000-4000-8000-000000000001',null,null);
 if (saved->>'answered_count')::integer<>0 or saved->>'selected_option_key' is not null then raise exception 'clear answer failed'; end if;
 perform ace.save_attempt_answer(id,'11000000-0000-4000-8000-000000000001','B',1);
end $$;
reset role;
-- Force bogus internal aggregates to prove scoring recomputes from answer selections.
update ace.attempts set correct_count=99,score=99 where id=current_setting('ace.test_active')::uuid;
update ace.attempt_answers set is_correct=true where attempt_id=current_setting('ace.test_active')::uuid;
set local role authenticated;
do $$ declare state jsonb; result jsonb; begin
 state:=ace.resume_attempt(current_setting('ace.test_active')::uuid);
 if state->>'score' is not null or (state->>'correct_count')::integer<>0 then raise exception 'forged aggregates leaked'; end if;
 result:=ace.submit_attempt(current_setting('ace.test_active')::uuid);
 if (result->>'score')::numeric<>0 then raise exception 'trusted forged correctness'; end if;
 perform set_config('ace.test_expired',ace.start_attempt('practice',null,1,600,null)->>'attempt_id',true);
 perform ace.save_attempt_answer(current_setting('ace.test_expired')::uuid,'11000000-0000-4000-8000-000000000001','A',1);
end $$;
reset role;
update ace.attempts set started_at=now()-interval '1 hour' where id=current_setting('ace.test_expired')::uuid;
set local role authenticated;
do $$ declare result jsonb; begin
 begin perform ace.save_attempt_answer(current_setting('ace.test_expired')::uuid,'11000000-0000-4000-8000-000000000001','B',1); raise exception 'expired answer accepted'; exception when sqlstate '22023' then null; end;
 result:=ace.submit_attempt(current_setting('ace.test_expired')::uuid);
 if (result->>'score')::numeric<>100 then raise exception 'expired attempt not finalized from saved answers'; end if;
 perform set_config('ace.test_withdrawn',ace.start_attempt('practice',null,1,600,null)->>'attempt_id',true);
end $$;
reset role;
update ace.questions set rights_status='unknown' where id='11000000-0000-4000-8000-000000000001';
set local role authenticated;
do $$ begin
 begin perform ace.save_attempt_answer(current_setting('ace.test_withdrawn')::uuid,'11000000-0000-4000-8000-000000000001','A',1); raise exception 'withdrawn answer accepted'; exception when sqlstate 'P0002' then null; end;
 begin perform ace.submit_attempt(current_setting('ace.test_withdrawn')::uuid); raise exception 'withdrawn content scored'; exception when sqlstate 'P0002' then null; end;
end $$;
reset role;
do $$ declare signature text; begin
 foreach signature in array array['ace.start_attempt(text,uuid,integer,integer,uuid[])','ace.resume_attempt(uuid)','ace.save_attempt_answer(uuid,uuid,text,integer)','ace.submit_attempt(uuid)'] loop
  if has_function_privilege('anon',signature,'EXECUTE') then raise exception 'anon execution: %',signature; end if;
 end loop;
end $$;

rollback;
select 'FCB-01 secure CBT mutations tests passed' result;

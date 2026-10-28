-- Disposable recovered schema ONLY. Proposals are not applied to production.
\i tests/sql/fixtures/fcb_01_cbt_contract.sql
\i supabase/migrations/20261028043630_fcb_01_attempt_question_delivery.sql
\i tests/sql/fixtures/fcb_01_cbt_content.sql
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000001',true);
select set_config('ace.snapshot_attempt',ace.start_attempt('practice',null,1,600,null)->>'attempt_id',true);
reset role;
-- An authorized content edit must not silently change a student's active paper or key.
update ace.questions set stem='Revised question',options='[{"key":"C","text":"New C"},{"key":"D","text":"New D"}]',correct_option_key='C',content_version=2
where id='11000000-0000-4000-8000-000000000001';
set local role authenticated;
do $$ declare questions jsonb; result jsonb; begin
 questions:=ace.get_attempt_questions(current_setting('ace.snapshot_attempt')::uuid);
 if questions->0->>'question_text'<>'Synthetic scoring question' then raise exception 'question changed under active attempt'; end if;
 if questions->0->'options'<>'[{"key":"A","text":"Choice A"},{"key":"B","text":"Choice B"}]'::jsonb then raise exception 'active options changed'; end if;
 if questions::text ~ 'correct_option_key|is_correct|explanation|question_snapshot' then raise exception 'private answer snapshot leaked'; end if;
 perform ace.save_attempt_answer(current_setting('ace.snapshot_attempt')::uuid,'11000000-0000-4000-8000-000000000001','A',1);
 begin perform ace.save_attempt_answer(current_setting('ace.snapshot_attempt')::uuid,'11000000-0000-4000-8000-000000000001','C',1); raise exception 'new-version option accepted by old paper'; exception when sqlstate '22023' then null; end;
 result:=ace.submit_attempt(current_setting('ace.snapshot_attempt')::uuid);
 if (result->>'score')::numeric<>100 then raise exception 'active answer key changed'; end if;
 perform set_config('ace.new_snapshot_attempt',ace.start_attempt('practice',null,1,600,null)->>'attempt_id',true);
 questions:=ace.get_attempt_questions(current_setting('ace.new_snapshot_attempt')::uuid);
 if questions->0->>'question_text'<>'Revised question' then raise exception 'new attempt did not receive latest version'; end if;
 perform ace.save_attempt_answer(current_setting('ace.new_snapshot_attempt')::uuid,'11000000-0000-4000-8000-000000000001','C',1);
end $$;
reset role;
do $$ begin
 if has_function_privilege('authenticated','ace.guard_attempt_snapshot()','EXECUTE') or has_function_privilege('anon','ace.guard_attempt_snapshot()','EXECUTE') then raise exception 'snapshot trigger exposed as API'; end if;
 if (select question_snapshot->0->>'content_version' from ace.attempts where id=current_setting('ace.snapshot_attempt')::uuid)<>'1' then raise exception 'old version provenance lost'; end if;
 if (select question_snapshot->0->>'content_version' from ace.attempts where id=current_setting('ace.new_snapshot_attempt')::uuid)<>'2' then raise exception 'new version provenance lost'; end if;
 begin update ace.attempts set question_snapshot='[]' where id=current_setting('ace.snapshot_attempt')::uuid; raise exception 'private snapshot editable'; exception when sqlstate '23514' then null; end;
 begin update ace.attempts set question_order='[]' where id=current_setting('ace.snapshot_attempt')::uuid; raise exception 'paper membership editable'; exception when sqlstate '23514' then null; end;
end $$;
-- Rights withdrawal takes precedence over retained private grading snapshots.
update ace.questions set rights_status='unknown' where id='11000000-0000-4000-8000-000000000001';
set local role authenticated;
do $$ declare v_attempt uuid:=current_setting('ace.new_snapshot_attempt')::uuid; begin
 begin perform ace.get_attempt_questions(v_attempt); raise exception 'withdrawn snapshot delivered'; exception when sqlstate 'P0002' then null; end;
 begin perform ace.save_attempt_answer(v_attempt,'11000000-0000-4000-8000-000000000001','C',1); raise exception 'withdrawn snapshot writable'; exception when sqlstate 'P0002' then null; end;
 begin perform ace.submit_attempt(v_attempt); raise exception 'withdrawn snapshot scored'; exception when sqlstate 'P0002' then null; end;
 begin perform a.question_snapshot from ace.attempts a where a.id=v_attempt; raise exception 'private answer column readable'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'FCB-01 immutable CBT paper snapshot tests passed' result;

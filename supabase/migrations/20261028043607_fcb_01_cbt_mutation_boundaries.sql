-- Applied with explicit owner authorization on 28 October 2026.
-- Exact reviewed coordinated CBT bundle, applied in safe stages.
begin;
create or replace function ace.resume_attempt(p_attempt_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,ace
as $$
declare a ace.attempts%rowtype; v_answers jsonb; v_remaining integer;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='28000'; end if;
 if p_attempt_id is null then raise exception 'Attempt required' using errcode='22023'; end if;
 select * into a from ace.attempts where id=p_attempt_id and user_id=auth.uid();
 if not found then raise exception 'Attempt unavailable' using errcode='P0002'; end if;
 v_remaining:=case when a.status='active' then greatest(0,a.duration_seconds-floor(extract(epoch from(clock_timestamp()-a.started_at)))::integer) else 0 end;
 select coalesce(jsonb_agg(jsonb_build_object('question_id',question_id,
   'selected_option_key',selected_option_key,'response_ms',response_ms,'answered_at',answered_at)
   order by answered_at,question_id),'[]'::jsonb) into v_answers
 from ace.attempt_answers where attempt_id=a.id;
 return jsonb_build_object('attempt_id',a.id,'status',a.status,'mode',a.mode,
   'subject_id',a.subject_id,'started_at',a.started_at,'completed_at',a.completed_at,
   'duration_seconds',a.duration_seconds,'remaining_seconds',v_remaining,
   'random_seed',a.random_seed,'question_order',a.question_order,'option_order',a.option_order,
   'answers',v_answers,'score',case when a.status='completed' then a.score else null end,
   'correct_count',case when a.status='completed' then a.correct_count else 0 end,
   'answered_count',a.answered_count);
end;
$$;

create or replace function ace.save_attempt_answer(p_attempt_id uuid,p_question_id uuid,p_selected_option_key text,p_response_ms integer default null)
returns jsonb language plpgsql security definer set search_path=pg_catalog,ace
as $$
declare a ace.attempts%rowtype; q ace.questions%rowtype;
 v_selected text:=nullif(trim(p_selected_option_key),''); v_frozen jsonb; v_answered integer; v_when timestamptz;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='28000'; end if;
 if p_attempt_id is null or p_question_id is null then raise exception 'Attempt and question required' using errcode='22023'; end if;
 select * into a from ace.attempts where id=p_attempt_id and user_id=auth.uid() for update;
 if not found then raise exception 'Attempt unavailable' using errcode='P0002'; end if;
 if a.status<>'active' or a.duration_seconds is null or a.duration_seconds<=0
    or a.started_at>clock_timestamp()
    or a.started_at+a.duration_seconds*interval '1 second'<=clock_timestamp() then
  raise exception 'Attempt is not writable' using errcode='22023';
 end if;
 if p_response_ms is not null and (p_response_ms<0 or p_response_ms::bigint>a.duration_seconds::bigint*1000) then
  raise exception 'Invalid response time' using errcode='22023';
 end if;
 if not exists(select 1 from jsonb_array_elements_text(a.question_order) x(id) where x.id=p_question_id::text) then
  raise exception 'Question unavailable' using errcode='P0002';
 end if;
 select * into q from ace.questions where id=p_question_id and active=true
  and review_status='published' and rights_status in ('owned','licensed','permitted') for share;
 if not found then raise exception 'Question unavailable' using errcode='P0002'; end if;
 select item into v_frozen from jsonb_array_elements(a.question_snapshot) item where item->>'id'=p_question_id::text;
 if not found then raise exception 'Attempt paper unavailable' using errcode='P0002'; end if;
 if v_selected is not null and not exists(select 1 from jsonb_array_elements(v_frozen->'options') o where o->>'key'=v_selected) then
  raise exception 'Invalid option' using errcode='22023';
 end if;
 v_when:=clock_timestamp();
 -- Correctness is computed only at submission, never in the save response.
 insert into ace.attempt_answers(attempt_id,question_id,selected_option_key,is_correct,response_ms,answered_at)
 values(a.id,q.id,v_selected,null,p_response_ms,v_when)
 on conflict(attempt_id,question_id) do update set selected_option_key=excluded.selected_option_key,
  is_correct=null,response_ms=excluded.response_ms,answered_at=excluded.answered_at;
 select count(*) filter(where selected_option_key is not null) into v_answered
  from ace.attempt_answers where attempt_id=a.id;
 update ace.attempts set answered_count=v_answered,correct_count=0,score=null where id=a.id;
 return jsonb_build_object('attempt_id',a.id,'question_id',q.id,'selected_option_key',v_selected,
  'answered_at',v_when,'answered_count',v_answered);
end;
$$;

create or replace function ace.submit_attempt(p_attempt_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,ace
as $$
declare a ace.attempts%rowtype; v_total integer; v_available integer;
 v_answered integer; v_correct integer; v_score numeric; v_completed timestamptz; r record;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='28000'; end if;
 if p_attempt_id is null then raise exception 'Attempt required' using errcode='22023'; end if;
 select * into a from ace.attempts where id=p_attempt_id and user_id=auth.uid() for update;
 if not found then raise exception 'Attempt unavailable' using errcode='P0002'; end if;
 v_total:=jsonb_array_length(a.question_order);
 if a.status='completed' then
  return jsonb_build_object('attempt_id',a.id,'status','completed','score',a.score,
   'correct_count',a.correct_count,'answered_count',a.answered_count,
   'total_questions',v_total,'completed_at',a.completed_at);
 end if;
 if a.status<>'active' or v_total not between 1 and 500 then
  raise exception 'Attempt cannot be submitted' using errcode='22023';
 end if;
 if jsonb_typeof(a.question_snapshot) is distinct from 'array'
    or jsonb_array_length(a.question_snapshot)<>v_total
    or (select count(distinct value) from jsonb_array_elements_text(a.question_order))<>v_total
    or (select count(distinct item->>'id') from jsonb_array_elements(a.question_snapshot) item)<>v_total
    or exists(select 1 from jsonb_array_elements_text(a.question_order) wanted(id)
       where not exists(select 1 from jsonb_array_elements(a.question_snapshot) item where item->>'id'=wanted.id)) then
  raise exception 'Attempt paper unavailable' using errcode='P0002';
 end if;
 -- Lock assigned content while scoring, excluding unrelated or withdrawn questions.
 perform q.id from ace.questions q
  where exists(select 1 from jsonb_array_elements_text(a.question_order) wanted(id) where wanted.id=q.id::text)
   and q.active=true and q.review_status='published' and q.rights_status in ('owned','licensed','permitted')
  order by q.id for share;
 get diagnostics v_available=row_count;
 if v_available<>v_total then raise exception 'Attempt questions unavailable' using errcode='P0002'; end if;
 update ace.attempt_answers ans set is_correct=(ans.selected_option_key is not null and ans.selected_option_key=frozen->>'correct_option_key')
 from jsonb_array_elements(a.question_snapshot) frozen where ans.attempt_id=a.id and ans.question_id::text=frozen->>'id';
 select count(*) filter(where ans.selected_option_key is not null),count(*) filter(where ans.is_correct=true)
 into v_answered,v_correct from ace.attempt_answers ans
 where ans.attempt_id=a.id
  and exists(select 1 from jsonb_array_elements_text(a.question_order) wanted(id) where wanted.id=ans.question_id::text);
 v_score:=round(v_correct::numeric*100/v_total,2); v_completed:=clock_timestamp();
 update ace.attempts set status='completed',completed_at=v_completed,score=v_score,
  correct_count=v_correct,answered_count=v_answered where id=a.id;
 for r in select question_id,is_correct,coalesce(response_ms,0) response_ms from ace.attempt_answers ans
  where attempt_id=a.id and selected_option_key is not null
   and exists(select 1 from jsonb_array_elements_text(a.question_order) wanted(id) where wanted.id=ans.question_id::text)
 loop
  insert into ace.student_question_stats(user_id,question_id,attempts,correct_count,incorrect_count,total_response_ms,last_answered_at)
  values(a.user_id,r.question_id,1,case when r.is_correct then 1 else 0 end,case when r.is_correct then 0 else 1 end,r.response_ms,v_completed)
  on conflict(user_id,question_id) do update set attempts=ace.student_question_stats.attempts+1,
   correct_count=ace.student_question_stats.correct_count+excluded.correct_count,
   incorrect_count=ace.student_question_stats.incorrect_count+excluded.incorrect_count,
   total_response_ms=ace.student_question_stats.total_response_ms+excluded.total_response_ms,
   last_answered_at=excluded.last_answered_at;
 end loop;
 return jsonb_build_object('attempt_id',a.id,'status','completed','score',v_score,
  'correct_count',v_correct,'answered_count',v_answered,'total_questions',v_total,'completed_at',v_completed);
end;
$$;

revoke all on function ace.start_attempt(text,uuid,integer,integer,uuid[]),ace.resume_attempt(uuid),
 ace.save_attempt_answer(uuid,uuid,text,integer),ace.submit_attempt(uuid) from public,anon,authenticated;
grant execute on function ace.start_attempt(text,uuid,integer,integer,uuid[]),ace.resume_attempt(uuid),
 ace.save_attempt_answer(uuid,uuid,text,integer),ace.submit_attempt(uuid) to authenticated;
-- No direct API data privileges added; all writes are scoped inside the RPCs.

commit;

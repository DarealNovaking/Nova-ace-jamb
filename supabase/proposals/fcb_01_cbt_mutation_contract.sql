-- Source review proposal only; NOT applied to production.
-- Authenticated owner operations replace unsafe direct API table mutation.
-- Private immutable question versions are captured at start.
-- Official mock configuration, quotas and entitlement remain separate release gates.
begin;

alter table ace.attempts add column if not exists question_snapshot jsonb not null default '[]'::jsonb;
create or replace function ace.guard_attempt_snapshot() returns trigger
language plpgsql set search_path=pg_catalog,ace as $$
begin
 if new.question_snapshot is distinct from old.question_snapshot
    or new.question_order is distinct from old.question_order
    or new.option_order is distinct from old.option_order then
  raise exception 'Attempt paper is immutable' using errcode='23514';
 end if;
 return new;
end;
$$;
revoke all on function ace.guard_attempt_snapshot() from public,anon,authenticated;
drop trigger if exists guard_attempt_snapshot on ace.attempts;
create trigger guard_attempt_snapshot before update of question_snapshot,question_order,option_order
on ace.attempts for each row execute function ace.guard_attempt_snapshot();

CREATE OR REPLACE FUNCTION ace.start_attempt(p_mode text, p_subject_id uuid DEFAULT NULL::uuid, p_question_count integer DEFAULT 20, p_duration_seconds integer DEFAULT 1800, p_question_ids uuid[] DEFAULT NULL::uuid[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'ace'
AS $function$
declare
  v_user uuid := auth.uid();
  v_attempt uuid;
  v_seed bigint;
  v_ids uuid[];
  v_order jsonb;
  v_options jsonb := '{}'::jsonb;
  v_q uuid;
  v_opts jsonb;
  v_opt_keys jsonb;
  v_snapshot jsonb;
begin
  if v_user is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if p_mode is null or p_mode not in ('practice','cbt','mock','learning','revision','ai_practice') then raise exception 'Unsupported attempt mode' using errcode='22023'; end if;
  if p_mode='mock' then raise exception 'Mocks require an approved exam configuration' using errcode='22023'; end if;
  if p_question_count is null or p_question_count < 1 or p_question_count > 500 then raise exception 'Invalid question count' using errcode='22023'; end if;
  if p_duration_seconds is null or p_duration_seconds < 60 or p_duration_seconds > 86400 then raise exception 'Invalid duration' using errcode='22023'; end if;

  if cardinality(p_question_ids)>500 then raise exception 'Too many explicit questions' using errcode='22023'; end if;
  v_seed := floor(random()*9223372036854775807)::bigint;

  if p_question_ids is not null and cardinality(p_question_ids) > 0 then
    select array_agg(q.id order by array_position(p_question_ids,q.id)) into v_ids
    from ace.questions q
    where q.id = any(p_question_ids)
      and q.active = true
      and q.review_status = 'published'
      and q.rights_status in ('owned','licensed','permitted')
      and (p_subject_id is null or q.subject_id = p_subject_id);
  else
    select array_agg(x.id order by x.rank) into v_ids
    from (
      select q.id, row_number() over(order by md5(v_seed::text || ':' || q.id::text)) as rank
      from ace.questions q
      where q.active = true
        and q.review_status = 'published'
        and q.rights_status in ('owned','licensed','permitted')
        and (p_subject_id is null or q.subject_id = p_subject_id)
      limit p_question_count
    ) x;
  end if;

  if v_ids is null or cardinality(v_ids) = 0 then
    raise exception 'No published questions available for this attempt';
  end if;
  if cardinality(v_ids) > p_question_count then v_ids := v_ids[1:p_question_count]; end if;

  select jsonb_agg(to_jsonb(qid) order by ord) into v_order
  from unnest(v_ids) with ordinality u(qid,ord);

  -- Lock before copying so concurrent authoring cannot mix paper versions/options.
  perform q.id from ace.questions q where q.id=any(v_ids)
    and q.active=true and q.review_status='published'
    and q.rights_status in ('owned','licensed','permitted') order by q.id for share;
  select jsonb_agg(jsonb_build_object('id',q.id,'content_version',q.content_version,
    'stem',q.stem,'options',q.options,'correct_option_key',q.correct_option_key,
    'subject_id',q.subject_id,'topic_id',q.topic_id,'difficulty',q.difficulty)
    order by array_position(v_ids,q.id)) into v_snapshot
  from ace.questions q where q.id=any(v_ids)
    and q.active=true and q.review_status='published'
    and q.rights_status in ('owned','licensed','permitted');
  if v_snapshot is null or jsonb_array_length(v_snapshot)<>cardinality(v_ids) then
    raise exception 'Attempt questions unavailable' using errcode='P0002';
  end if;

  foreach v_q in array v_ids loop
    select item->'options' into v_opts from jsonb_array_elements(v_snapshot) item where item->>'id'=v_q::text;
    select jsonb_agg(e.value->>'key' order by md5(v_seed::text || ':' || v_q::text || ':' || (e.value->>'key')))
      into v_opt_keys
    from jsonb_array_elements(v_opts) e(value)
    where e.value ? 'key';
    v_options := v_options || jsonb_build_object(v_q::text, coalesce(v_opt_keys,'[]'::jsonb));
  end loop;

  insert into ace.attempts(user_id,mode,subject_id,started_at,duration_seconds,random_seed,question_order,option_order,status,question_snapshot)
  values(v_user,p_mode,p_subject_id,now(),p_duration_seconds,v_seed,v_order,v_options,'active',v_snapshot)
  returning id into v_attempt;

  return jsonb_build_object('attempt_id',v_attempt,'status','active','started_at',now(),
    'duration_seconds',p_duration_seconds,'random_seed',v_seed,'question_order',v_order,
    'option_order',v_options,'question_count',cardinality(v_ids));
end;
$function$;

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

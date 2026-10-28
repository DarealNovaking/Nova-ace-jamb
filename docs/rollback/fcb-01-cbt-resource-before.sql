-- Incident-only rollback for the coordinated CBT proposal. Restores legacy fail-closed RPCs.

-- Refuses any captured papers; never deletes attempts, answers or usage automatically.

begin;

do $$ begin if exists(select 1 from ace.attempts where question_snapshot<>'[]'::jsonb or exam_config_id is not null) then raise exception 'Rollback requires reviewed preservation of captured papers; no automatic data deletion' using errcode='23514'; end if; end $$;

CREATE OR REPLACE FUNCTION ace.resume_attempt(p_attempt_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'ace', 'public'
AS $function$
declare a ace.attempts%rowtype; v_remaining integer; v_answers jsonb;
begin
  select * into a from ace.attempts where id=p_attempt_id and user_id=auth.uid();
  if not found then raise exception 'Attempt not found' using errcode='P0002'; end if;
  v_remaining:=case when a.status='active' then greatest(0,a.duration_seconds-floor(extract(epoch from(now()-a.started_at)))::integer) else 0 end;
  select coalesce(jsonb_agg(jsonb_build_object('question_id',question_id,'selected_option_key',selected_option_key,'response_ms',response_ms,'answered_at',answered_at) order by answered_at),'[]'::jsonb) into v_answers from ace.attempt_answers where attempt_id=a.id;
  return jsonb_build_object('attempt_id',a.id,'status',a.status,'mode',a.mode,'subject_id',a.subject_id,'started_at',a.started_at,'completed_at',a.completed_at,'duration_seconds',a.duration_seconds,'remaining_seconds',v_remaining,'question_order',a.question_order,'option_order',a.option_order,'answers',v_answers,'score',a.score,'correct_count',a.correct_count,'answered_count',a.answered_count);
end;
$function$
;

revoke all on function ace.resume_attempt(p_attempt_id uuid) from public,anon,authenticated;

grant execute on function ace.resume_attempt(p_attempt_id uuid) to authenticated;

CREATE OR REPLACE FUNCTION ace.save_attempt_answer(p_attempt_id uuid, p_question_id uuid, p_selected_option_key text, p_response_ms integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'ace', 'public'
AS $function$
declare
  a ace.attempts%rowtype;
  q ace.questions%rowtype;
  v_correct boolean;
  v_elapsed integer;
  v_selected text := nullif(trim(p_selected_option_key),'');
begin
  select * into a from ace.attempts
  where id=p_attempt_id and user_id=auth.uid()
  for update;
  if not found then raise exception 'Attempt not found' using errcode='P0002'; end if;
  if a.status <> 'active' then raise exception 'Attempt is not active'; end if;

  v_elapsed := floor(extract(epoch from (now()-a.started_at)))::integer;
  if v_elapsed >= a.duration_seconds then raise exception 'Attempt time has expired'; end if;
  if p_response_ms is not null and p_response_ms < 0 then raise exception 'Invalid response time'; end if;
  if not exists(select 1 from jsonb_array_elements_text(a.question_order) x(value) where x.value=p_question_id::text) then
    raise exception 'Question is not part of this attempt';
  end if;

  select * into q from ace.questions
  where id=p_question_id
    and active=true
    and review_status='published'
    and rights_status in ('owned','licensed','permitted');
  if not found then raise exception 'Question unavailable'; end if;
  if v_selected is not null and not exists(
    select 1 from jsonb_array_elements(q.options) e
    where e.value ? 'key' and e.value->>'key'=v_selected
  ) then raise exception 'Invalid option'; end if;

  v_correct := v_selected is not null and v_selected=q.correct_option_key;
  insert into ace.attempt_answers(attempt_id,question_id,selected_option_key,is_correct,response_ms,answered_at)
  values(a.id,q.id,v_selected,v_correct,p_response_ms,now())
  on conflict(attempt_id,question_id) do update
    set selected_option_key=excluded.selected_option_key,
        is_correct=excluded.is_correct,
        response_ms=excluded.response_ms,
        answered_at=excluded.answered_at;

  select count(*) filter(where selected_option_key is not null),
         count(*) filter(where is_correct=true)
    into a.answered_count,a.correct_count
  from ace.attempt_answers where attempt_id=a.id;
  update ace.attempts set answered_count=a.answered_count,correct_count=a.correct_count where id=a.id;

  return jsonb_build_object('attempt_id',a.id,'question_id',q.id,
    'selected_option_key',v_selected,'is_correct',v_correct,
    'answered_at',now(),'answered_count',a.answered_count);
end;
$function$
;

revoke all on function ace.save_attempt_answer(p_attempt_id uuid, p_question_id uuid, p_selected_option_key text, p_response_ms integer) from public,anon,authenticated;

grant execute on function ace.save_attempt_answer(p_attempt_id uuid, p_question_id uuid, p_selected_option_key text, p_response_ms integer) to authenticated;

CREATE OR REPLACE FUNCTION ace.start_attempt(p_mode text, p_subject_id uuid DEFAULT NULL::uuid, p_question_count integer DEFAULT 20, p_duration_seconds integer DEFAULT 1800, p_question_ids uuid[] DEFAULT NULL::uuid[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'ace', 'public'
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
begin
  if v_user is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if p_mode is null or p_mode not in ('practice','cbt','mock','learning','revision','ai_practice') then raise exception 'Unsupported attempt mode' using errcode='22023'; end if;
  if p_question_count is null or p_question_count < 1 or p_question_count > 500 then raise exception 'Invalid question count' using errcode='22023'; end if;
  if p_duration_seconds is null or p_duration_seconds < 60 or p_duration_seconds > 86400 then raise exception 'Invalid duration' using errcode='22023'; end if;

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

  foreach v_q in array v_ids loop
    select options into v_opts from ace.questions where id = v_q;
    select jsonb_agg(e.value->>'key' order by md5(v_seed::text || ':' || v_q::text || ':' || (e.value->>'key')))
      into v_opt_keys
    from jsonb_array_elements(v_opts) e(value)
    where e.value ? 'key';
    v_options := v_options || jsonb_build_object(v_q::text, coalesce(v_opt_keys,'[]'::jsonb));
  end loop;

  insert into ace.attempts(user_id,mode,subject_id,started_at,duration_seconds,random_seed,question_order,option_order,status)
  values(v_user,p_mode,p_subject_id,now(),p_duration_seconds,v_seed,v_order,v_options,'active')
  returning id into v_attempt;

  return jsonb_build_object('attempt_id',v_attempt,'status','active','started_at',now(),
    'duration_seconds',p_duration_seconds,'random_seed',v_seed,'question_order',v_order,
    'option_order',v_options,'question_count',cardinality(v_ids));
end;
$function$
;

revoke all on function ace.start_attempt(p_mode text, p_subject_id uuid, p_question_count integer, p_duration_seconds integer, p_question_ids uuid[]) from public,anon,authenticated;

grant execute on function ace.start_attempt(p_mode text, p_subject_id uuid, p_question_count integer, p_duration_seconds integer, p_question_ids uuid[]) to authenticated;

CREATE OR REPLACE FUNCTION ace.submit_attempt(p_attempt_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'ace', 'public'
AS $function$
declare a ace.attempts%rowtype; v_total integer; v_answered integer; v_correct integer; v_score numeric; r record;
begin
  select * into a from ace.attempts where id=p_attempt_id and user_id=auth.uid() for update;
  if not found then raise exception 'Attempt not found' using errcode='P0002'; end if;
  if a.status='completed' then return jsonb_build_object('attempt_id',a.id,'status','completed','score',a.score,'correct_count',a.correct_count,'answered_count',a.answered_count,'completed_at',a.completed_at); end if;
  if a.status<>'active' then raise exception 'Attempt cannot be submitted'; end if;
  select jsonb_array_length(a.question_order) into v_total;
  select count(*) filter(where selected_option_key is not null),count(*) filter(where is_correct=true) into v_answered,v_correct from ace.attempt_answers where attempt_id=a.id;
  v_score:=round((v_correct::numeric*100)/nullif(v_total,0),2);
  update ace.attempts set status='completed',completed_at=now(),score=v_score,correct_count=v_correct,answered_count=v_answered where id=a.id;
  for r in select question_id,is_correct,coalesce(response_ms,0) response_ms from ace.attempt_answers where attempt_id=a.id loop
    insert into ace.student_question_stats(user_id,question_id,attempts,correct_count,incorrect_count,total_response_ms,last_answered_at) values(a.user_id,r.question_id,1,case when r.is_correct then 1 else 0 end,case when r.is_correct then 0 else 1 end,r.response_ms,now()) on conflict(user_id,question_id) do update set attempts=ace.student_question_stats.attempts+1,correct_count=ace.student_question_stats.correct_count+excluded.correct_count,incorrect_count=ace.student_question_stats.incorrect_count+excluded.incorrect_count,total_response_ms=ace.student_question_stats.total_response_ms+excluded.total_response_ms,last_answered_at=excluded.last_answered_at;
  end loop;
  return jsonb_build_object('attempt_id',a.id,'status','completed','score',v_score,'correct_count',v_correct,'answered_count',v_answered,'total_questions',v_total,'completed_at',now());
end;
$function$
;

revoke all on function ace.submit_attempt(p_attempt_id uuid) from public,anon,authenticated;

grant execute on function ace.submit_attempt(p_attempt_id uuid) to authenticated;

drop function if exists ace.start_mock_attempt(uuid,uuid[]);

drop function if exists ace.get_attempt_questions(uuid);

drop function if exists ace.create_attempt_internal(text,uuid,integer,integer,uuid[],boolean);

drop function if exists ace.reserve_cbt_start(text,integer,integer);

drop table if exists ace.cbt_start_usage,ace.cbt_mode_access,ace.cbt_runtime_policy;

drop function if exists ace.audit_cbt_policy();

drop trigger if exists guard_attempt_snapshot on ace.attempts;

drop trigger if exists guard_mock_provenance on ace.attempts;

drop function if exists ace.guard_attempt_snapshot();

drop function if exists ace.guard_mock_provenance();

drop index if exists ace.idx_attempts_active_user;

alter table ace.attempts drop column if exists question_snapshot,drop column if exists exam_config_id,drop column if exists exam_config_snapshot;

commit;

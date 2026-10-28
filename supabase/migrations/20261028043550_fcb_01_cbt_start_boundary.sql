-- Applied with explicit owner authorization on 28 October 2026.
-- Exact reviewed coordinated CBT bundle, applied in safe stages.
begin;
-- Remove the earlier five-argument private overload to prevent stale resolution.
drop function if exists ace.create_attempt_internal(text,uuid,integer,integer,uuid[]);
CREATE OR REPLACE FUNCTION ace.create_attempt_internal(p_mode text, p_subject_id uuid DEFAULT NULL::uuid, p_question_count integer DEFAULT 20, p_duration_seconds integer DEFAULT 1800, p_question_ids uuid[] DEFAULT NULL::uuid[], p_reserved boolean default false)
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
  if p_question_count is null or p_question_count < 1 or p_question_count > 500 then raise exception 'Invalid question count' using errcode='22023'; end if;
  if p_duration_seconds is null or p_duration_seconds < 60 or p_duration_seconds > 86400 then raise exception 'Invalid duration' using errcode='22023'; end if;

  if cardinality(p_question_ids)>500 then raise exception 'Too many explicit questions' using errcode='22023'; end if;
  -- Reserve before question selection; failed creation rolls back its reservation.
  if p_reserved is distinct from true then perform ace.reserve_cbt_start(p_mode,p_question_count,p_duration_seconds); end if;
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

revoke all on function ace.create_attempt_internal(text,uuid,integer,integer,uuid[],boolean) from public,anon,authenticated;
create or replace function ace.start_attempt(p_mode text,p_subject_id uuid default null,
 p_question_count integer default 20,p_duration_seconds integer default 1800,p_question_ids uuid[] default null)
returns jsonb language plpgsql security definer set search_path=pg_catalog,ace as $$
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='28000'; end if;
 if p_mode='mock' then raise exception 'Mocks require an approved exam configuration' using errcode='22023'; end if;
 return ace.create_attempt_internal(p_mode,p_subject_id,p_question_count,p_duration_seconds,p_question_ids);
end;
$$;


commit;

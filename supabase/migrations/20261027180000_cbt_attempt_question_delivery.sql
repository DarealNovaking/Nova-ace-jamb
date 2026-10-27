-- Deliver attempt-scoped question content without exposing answer keys.
-- SECURITY DEFINER is intentional: students do not receive direct SELECT on ace.questions.
create or replace function ace.get_attempt_questions(p_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, ace
as $function$
declare
  v_user_id uuid := auth.uid();
  v_status text;
  v_questions jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select a.status
    into v_status
    from ace.attempts a
   where a.id = p_attempt_id
     and a.user_id = v_user_id;

  if not found then
    raise exception 'Attempt not found' using errcode = 'P0002';
  end if;
  if v_status = 'abandoned' then
    raise exception 'Attempt is unavailable';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', q.id,
        'question_text', q.stem,
        'options', coalesce((
          select jsonb_agg(jsonb_build_object(
            'key', option_item.value ->> 'key',
            'text', coalesce(option_item.value ->> 'text', option_item.value ->> 'label', '')
          ) order by option_item.ordinality)
          from jsonb_array_elements(q.options) with ordinality as option_item(value, ordinality)
          where option_item.value ? 'key'
        ), '[]'::jsonb),
        'subject_id', q.subject_id,
        'topic_id', q.topic_id,
        'difficulty', q.difficulty
      )
      order by requested.ordinality
    ),
    '[]'::jsonb
  )
  into v_questions
  from ace.attempts a
  cross join lateral jsonb_array_elements_text(a.question_order) with ordinality as requested(question_id, ordinality)
  join ace.questions q on q.id = requested.question_id::uuid
  where a.id = p_attempt_id
    and a.user_id = v_user_id
    and q.active = true
    and q.review_status = 'published'
    and q.rights_status = any (array['owned', 'licensed', 'permitted']);

  return v_questions;
end;
$function$;

revoke all on function ace.get_attempt_questions(uuid) from public;
revoke all on function ace.get_attempt_questions(uuid) from anon;
grant execute on function ace.get_attempt_questions(uuid) to authenticated;

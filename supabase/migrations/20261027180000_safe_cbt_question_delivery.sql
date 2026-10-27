-- Serve CBT questions only through an attempt-owner-checked, answer-key-free API.
-- Students must never receive correct_option_key or explanation before submission.
create or replace function ace.get_attempt_questions(p_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, ace
as $$
declare
  v_attempt ace.attempts%rowtype;
  v_questions jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select * into v_attempt
  from ace.attempts
  where id = p_attempt_id
    and user_id = auth.uid();

  if not found then
    raise exception 'Attempt not found' using errcode = 'P0002';
  end if;

  if v_attempt.status not in ('active', 'paused') then
    raise exception 'Questions are unavailable for this attempt state';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', q.id,
        'text', q.stem,
        'options', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'key', e.value ->> 'key',
              'text', coalesce(e.value ->> 'text', e.value ->> 'label', '')
            ) order by e.ordinality
          )
          from jsonb_array_elements(q.options) with ordinality as e(value, ordinality)
          where e.value ? 'key'
        ), '[]'::jsonb),
        'subject_id', q.subject_id,
        'topic_id', q.topic_id,
        'difficulty', q.difficulty
      ) order by attempt_question.ordinality
    ),
    '[]'::jsonb
  )
  into v_questions
  from jsonb_array_elements_text(v_attempt.question_order)
       with ordinality as attempt_question(question_id, ordinality)
  join ace.questions q on q.id = attempt_question.question_id::uuid;

  return v_questions;
end;
$$;

revoke all on function ace.get_attempt_questions(uuid) from public;
revoke all on function ace.get_attempt_questions(uuid) from anon;
grant execute on function ace.get_attempt_questions(uuid) to authenticated;

comment on function ace.get_attempt_questions(uuid) is
  'Returns only question prompts and option labels for the authenticated owner of an active or paused attempt; never returns answer keys or explanations.';

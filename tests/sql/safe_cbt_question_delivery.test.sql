-- Regression checks for the safe CBT question-delivery contract.
-- Run after applying 20261027180000_safe_cbt_question_delivery.sql.
do $$
declare
  v_proc oid := to_regprocedure('ace.get_attempt_questions(uuid)');
  v_definition text;
begin
  if v_proc is null then
    raise exception 'Missing ace.get_attempt_questions(uuid)';
  end if;

  select pg_get_functiondef(v_proc) into v_definition;

  if position('auth.uid()' in v_definition) = 0 then
    raise exception 'Question delivery must require an authenticated owner';
  end if;
  if position('user_id = auth.uid()' in v_definition) = 0 then
    raise exception 'Question delivery must scope lookup to the attempt owner';
  end if;
  if position('q.stem' in v_definition) = 0 then
    raise exception 'Question delivery must use the live ace.questions.stem column';
  end if;
  if position('correct_option_key' in v_definition) > 0
     or position('explanation' in v_definition) > 0 then
    raise exception 'Question delivery function must not reference answer keys or explanations';
  end if;

  if not has_function_privilege('authenticated', v_proc, 'EXECUTE') then
    raise exception 'authenticated must be able to call question delivery';
  end if;
  if has_function_privilege('anon', v_proc, 'EXECUTE') then
    raise exception 'anon must not be able to call question delivery';
  end if;
end;
$$;

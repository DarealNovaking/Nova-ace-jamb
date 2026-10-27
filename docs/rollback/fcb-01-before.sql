-- INCIDENT ROLLBACK SNAPSHOT, NOT A FORWARD MIGRATION.
-- Captured read-only from production 2026-10-27 before PR #10.
-- Restores KNOWN authorization weaknesses. Explicit incident authorization required.
-- No content/user rows or migration ledger entries are changed by this script.
-- Verify current definitions/backup first; do not execute as routine setup.
begin;
drop trigger if exists guard_syllabus_authoring on ace.syllabus_versions;
drop trigger if exists guard_syllabus_authoring on ace.topics;
drop trigger if exists guard_syllabus_authoring on ace.subtopics;
drop function if exists ace.guard_syllabus_authoring();

-- Baseline SHA256 3732353b58709e15216809bb756670a1ad258476cd746e4594ed0fb789e0cd26
CREATE OR REPLACE FUNCTION ace.check_catalog_import_idempotency(p_snapshot_hash text)
 RETURNS TABLE(id uuid, status text, row_count integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'ace', 'public'
AS $function$
  select b.id, b.status, b.row_count
  from ace.catalog_import_batches b
  where b.snapshot_hash = p_snapshot_hash
  limit 1;
$function$
;

-- Baseline SHA256 e654e1f90775378327e9fdb328a7515c528b75a1f0b2e280a6843ebbfe1ffdf2
CREATE OR REPLACE FUNCTION ace.get_catalog_institutions()
 RETURNS TABLE(id uuid, name text, state text, institution_type text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'ace', 'auth'
AS $function$
  select i.id, i.name, i.state, i.institution_type
  from ace.institutions i
  where i.status = 'draft'
  order by i.name;
$function$
;

-- Baseline SHA256 763634f365175d38a92fabac235cce9d862bf6c85550e89f9b545159b834f93e
CREATE OR REPLACE FUNCTION ace.get_catalog_source(p_source_id uuid)
 RETURNS TABLE(id uuid, title text, status text, source_type text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'ace', 'public'
AS $function$
  select s.id, s.title, s.status, s.source_type
  from ace.catalog_sources s
  where s.id = p_source_id;
$function$
;

-- Baseline SHA256 a710f143623fe79dbd237f6e044d2700d3bd3869fbba2f127ebb7a588d35cc51
CREATE OR REPLACE FUNCTION ace.has_active_entitlement(p_user_id uuid, p_product_code text DEFAULT 'ace_pass'::text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'ace', 'public'
AS $function$ select exists(select 1 from ace.entitlements e join ace.products p on p.id=e.product_id where e.user_id=p_user_id and p.code=p_product_code and e.status='active' and now() between e.starts_at and e.ends_at); $function$
;

-- Baseline SHA256 5e6b8c57d155581d8e06358adafd144088e94dd7229cae11a678c48d06515fc1
CREATE OR REPLACE FUNCTION ace.save_attempt_answer(p_attempt_id uuid, p_question_id uuid, p_selected_option_key text, p_response_ms integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'ace', 'public'
AS $function$
declare a ace.attempts%rowtype; q ace.questions%rowtype; v_correct boolean; v_elapsed integer; v_selected text:=nullif(trim(p_selected_option_key),'');
begin
  select * into a from ace.attempts where id=p_attempt_id and user_id=auth.uid() for update;
  if not found then raise exception 'Attempt not found' using errcode='P0002'; end if;
  if a.status<>'active' then raise exception 'Attempt is not active'; end if;
  v_elapsed:=floor(extract(epoch from(now()-a.started_at)))::integer;
  if v_elapsed>=a.duration_seconds then raise exception 'Attempt time has expired'; end if;
  if p_response_ms is not null and p_response_ms<0 then raise exception 'Invalid response time'; end if;
  if not exists(select 1 from jsonb_array_elements_text(a.question_order) x(value) where x.value=p_question_id::text) then raise exception 'Question is not part of this attempt'; end if;
  select * into q from ace.questions where id=p_question_id and active=true and review_status='published';
  if not found then raise exception 'Question unavailable'; end if;
  if v_selected is not null and not exists(select 1 from jsonb_array_elements(q.options) e where e.value ? 'key' and e.value->>'key'=v_selected) then raise exception 'Invalid option'; end if;
  v_correct:=v_selected is not null and v_selected=q.correct_option_key;
  insert into ace.attempt_answers(attempt_id,question_id,selected_option_key,is_correct,response_ms,answered_at) values(a.id,q.id,v_selected,v_correct,p_response_ms,now()) on conflict(attempt_id,question_id) do update set selected_option_key=excluded.selected_option_key,is_correct=excluded.is_correct,response_ms=excluded.response_ms,answered_at=excluded.answered_at;
  select count(*) filter(where selected_option_key is not null),count(*) filter(where is_correct=true) into a.answered_count,a.correct_count from ace.attempt_answers where attempt_id=a.id;
  update ace.attempts set answered_count=a.answered_count,correct_count=a.correct_count where id=a.id;
  return jsonb_build_object('attempt_id',a.id,'question_id',q.id,'selected_option_key',v_selected,'is_correct',v_correct,'answered_at',now(),'answered_count',a.answered_count);
end;
$function$
;

-- Baseline SHA256 87ccfda0f5e7c82b8086d19f493dfed27d04b64bed345fe45bdcb43e80b9f64c
CREATE OR REPLACE FUNCTION ace.save_student_foundation(p_display_name text, p_target_score smallint, p_institution text, p_course text, p_daily_minutes integer, p_subject_ids uuid[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'ace', 'auth'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_subject_count integer;
  v_active_subject_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_display_name is null or length(btrim(p_display_name)) = 0 or length(btrim(p_display_name)) > 80 then
    raise exception 'Display name must be 1–80 characters.' using errcode = '22023';
  end if;
  if p_target_score is null or p_target_score < 0 or p_target_score > 400 then
    raise exception 'Target score must be between 0 and 400.' using errcode = '22023';
  end if;
  if p_institution is null or length(btrim(p_institution)) = 0 or length(btrim(p_institution)) > 160 then
    raise exception 'Intended institution must be 1–160 characters.' using errcode = '22023';
  end if;
  if p_course is null or length(btrim(p_course)) = 0 or length(btrim(p_course)) > 160 then
    raise exception 'Intended course must be 1–160 characters.' using errcode = '22023';
  end if;
  if p_daily_minutes is null or p_daily_minutes < 1 or p_daily_minutes > 1440 then
    raise exception 'Study time must be between 1 and 1440 minutes.' using errcode = '22023';
  end if;
  if p_subject_ids is null then
    raise exception 'Select between 1 and 4 subjects.' using errcode = '22023';
  end if;

  select count(distinct subject_id), count(*)
    into v_subject_count, v_active_subject_count
  from unnest(p_subject_ids) as requested(subject_id)
  join ace.subjects s on s.id = requested.subject_id and s.active = true;

  if cardinality(p_subject_ids) < 1 or cardinality(p_subject_ids) > 4 or v_subject_count <> cardinality(p_subject_ids) or v_active_subject_count <> cardinality(p_subject_ids) then
    raise exception 'Select between 1 and 4 active subjects.' using errcode = '22023';
  end if;

  update ace.profiles
     set display_name = btrim(p_display_name),
         target_score = p_target_score,
         institution = btrim(p_institution),
         course = btrim(p_course)
   where id = v_user_id;

  if not found then
    raise exception 'Student profile not found.' using errcode = 'P0002';
  end if;

  insert into ace.student_preferences (user_id, daily_minutes)
  values (v_user_id, p_daily_minutes)
  on conflict (user_id) do update
    set daily_minutes = excluded.daily_minutes,
        updated_at = pg_catalog.now();

  delete from ace.student_subjects where user_id = v_user_id;
  insert into ace.student_subjects (user_id, subject_id, is_primary, sort_order)
  select v_user_id, subject_id, ordinality = 1, (ordinality - 1)::integer
  from unnest(p_subject_ids) with ordinality as selected(subject_id, ordinality);
end;
$function$
;

-- Baseline SHA256 b93a7f27e140a461aaf8bdba82fcfc4251eeba8c87f1c20b33afa956d5d63ecf
CREATE OR REPLACE FUNCTION ace.set_student_subjects(p_subject_ids uuid[])
 RETURNS SETOF ace.student_subjects
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'ace', 'auth'
AS $function$
declare
  uid uuid := auth.uid();
  unique_ids uuid[];
  subject_count integer;
begin
  if uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select coalesce(array_agg(x order by x), '{}'::uuid[]) into unique_ids
  from (select distinct unnest(coalesce(p_subject_ids, '{}'::uuid[])) x) s;

  subject_count := coalesce(array_length(unique_ids, 1), 0);
  if subject_count < 1 or subject_count > 4 then
    raise exception 'Select between 1 and 4 subjects.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from unnest(unique_ids) x
    left join ace.subjects s on s.id = x
    where s.id is null or not s.active
  ) then
    raise exception 'One or more selected subjects are invalid.' using errcode = '22023';
  end if;

  delete from ace.student_subjects where user_id = uid;

  return query
    insert into ace.student_subjects(user_id, subject_id, is_primary, sort_order)
    select uid, x, ord = 1, ord - 1
    from unnest(unique_ids) with ordinality u(x, ord)
    returning *;
end;
$function$
;

-- Baseline SHA256 cc87b7e90f302d5366c0a83b267647322081fef434efede954b1db048d65544c
CREATE OR REPLACE FUNCTION ace.set_user_role(target_user_id uuid, target_role text)
 RETURNS ace.roles
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'ace', 'public'
AS $function$
declare
  current_role text;
  target_exists boolean;
  updated_role ace.roles;
  admin_count bigint;
begin
  if auth.uid() is null or not ace.is_admin() then
    raise exception 'admin role required';
  end if;
  if target_role not in ('student','editor','admin') then
    raise exception 'invalid role';
  end if;
  select exists(select 1 from auth.users where id = target_user_id) into target_exists;
  if not target_exists then
    raise exception 'target user does not exist';
  end if;
  select role into current_role from ace.roles where user_id = target_user_id;
  if current_role = 'admin' and target_role <> 'admin' then
    select count(*) into admin_count from ace.roles where role = 'admin';
    if admin_count <= 1 then
      raise exception 'cannot remove the last admin';
    end if;
  end if;
  insert into ace.roles(user_id, role)
  values (target_user_id, target_role)
  on conflict (user_id) do update set role = excluded.role
  returning * into updated_role;
  insert into ace.audit_events(actor_user_id,event_type,entity_type,entity_id,metadata)
  values (auth.uid(),'role_changed','user_role',target_user_id,
          jsonb_build_object('previous_role',current_role,'new_role',target_role));
  return updated_role;
end;
$function$
;

-- Baseline SHA256 44b64124667aaefccfe47b0e2f43e408ac0589096f8b7fab9cfcdd1e9e1a7f4e
CREATE OR REPLACE FUNCTION ace.start_attempt(p_mode text, p_subject_id uuid DEFAULT NULL::uuid, p_question_count integer DEFAULT 20, p_duration_seconds integer DEFAULT 1800, p_question_ids uuid[] DEFAULT NULL::uuid[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'ace', 'public'
AS $function$
declare
  v_user uuid := auth.uid(); v_attempt uuid; v_seed bigint; v_ids uuid[]; v_order jsonb; v_options jsonb := '{}'::jsonb; v_q uuid; v_opts jsonb; v_opt_keys jsonb;
begin
  if v_user is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if p_mode not in ('practice','cbt','mock','learning','revision','ai_practice') then raise exception 'Unsupported attempt mode'; end if;
  if p_question_count < 1 or p_question_count > 500 then raise exception 'Invalid question count'; end if;
  if p_duration_seconds < 60 or p_duration_seconds > 86400 then raise exception 'Invalid duration'; end if;
  v_seed := floor(random()*9223372036854775807)::bigint;

  if p_question_ids is not null and cardinality(p_question_ids) > 0 then
    select array_agg(q.id order by array_position(p_question_ids,q.id)) into v_ids
    from ace.questions q
    where q.id = any(p_question_ids) and q.active=true and q.review_status='published' and (p_subject_id is null or q.subject_id=p_subject_id);
  else
    select array_agg(x.id order by x.rank) into v_ids from (
      select q.id,row_number() over(order by md5(v_seed::text || ':' || q.id::text)) as rank
      from ace.questions q
      where q.active=true and q.review_status='published' and (p_subject_id is null or q.subject_id=p_subject_id)
      limit p_question_count
    ) x;
  end if;

  if v_ids is null or cardinality(v_ids)=0 then raise exception 'No published questions available for this attempt'; end if;
  if cardinality(v_ids)>p_question_count then v_ids:=v_ids[1:p_question_count]; end if;
  select jsonb_agg(to_jsonb(qid) order by ord) into v_order from unnest(v_ids) with ordinality u(qid,ord);

  foreach v_q in array v_ids loop
    select options into v_opts from ace.questions where id=v_q;
    select jsonb_agg(e.value->>'key' order by md5(v_seed::text || ':' || v_q::text || ':' || (e.value->>'key'))) into v_opt_keys
    from jsonb_array_elements(v_opts) e(value)
    where e.value ? 'key';
    v_options:=v_options || jsonb_build_object(v_q::text,coalesce(v_opt_keys,'[]'::jsonb));
  end loop;

  insert into ace.attempts(user_id,mode,subject_id,started_at,duration_seconds,random_seed,question_order,option_order,status)
  values(v_user,p_mode,p_subject_id,now(),p_duration_seconds,v_seed,v_order,v_options,'active') returning id into v_attempt;
  return jsonb_build_object('attempt_id',v_attempt,'status','active','started_at',now(),'duration_seconds',p_duration_seconds,'random_seed',v_seed,'question_order',v_order,'option_order',v_options,'question_count',cardinality(v_ids));
end;
$function$
;

-- Baseline SHA256 bbf725ece139133d59e0c8f40f37e30169183d7d3017b21bc43467e75639f231
CREATE OR REPLACE FUNCTION ace.validate_exam_config(p_exam_config_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'ace'
AS $function$
declare
  c ace.exam_configs%rowtype;
  required_count integer;
  optional_count integer;
  required_questions integer;
  optional_question_counts jsonb;
  result jsonb;
begin
  select * into c from ace.exam_configs where id=p_exam_config_id;
  if not found then return jsonb_build_object('valid',false,'errors',jsonb_build_array('Exam configuration not found')); end if;
  select count(*) filter (where required), count(*) filter (where not required), coalesce(sum(question_count) filter (where required),0)
    into required_count, optional_count, required_questions
  from ace.exam_config_subjects where exam_config_id=p_exam_config_id;

  optional_question_counts := coalesce((select jsonb_agg(distinct question_count order by question_count) from ace.exam_config_subjects where exam_config_id=p_exam_config_id and not required),'[]'::jsonb);
  result := jsonb_build_object(
    'valid', true,
    'errors', '[]'::jsonb,
    'required_subjects', required_count,
    'optional_subjects', optional_count,
    'required_questions', required_questions,
    'optional_question_counts', optional_question_counts,
    'total_questions', c.total_questions,
    'duration_seconds', c.duration_seconds,
    'option_count', c.option_count
  );

  if c.duration_seconds <= 0 then result := jsonb_set(result,'{valid}','false'::jsonb); result := jsonb_set(result,'{errors}', (result->'errors') || jsonb_build_array('Duration must be positive')); end if;
  if c.total_questions <= 0 then result := jsonb_set(result,'{valid}','false'::jsonb); result := jsonb_set(result,'{errors}', (result->'errors') || jsonb_build_array('Total question count must be positive')); end if;
  if c.option_count < 2 or c.option_count > 8 then result := jsonb_set(result,'{valid}','false'::jsonb); result := jsonb_set(result,'{errors}', (result->'errors') || jsonb_build_array('Option count must be between 2 and 8')); end if;
  if required_count < 1 then result := jsonb_set(result,'{valid}','false'::jsonb); result := jsonb_set(result,'{errors}', (result->'errors') || jsonb_build_array('At least one required subject is required')); end if;
  if optional_count < 1 then result := jsonb_set(result,'{valid}','false'::jsonb); result := jsonb_set(result,'{errors}', (result->'errors') || jsonb_build_array('At least one optional subject is required')); end if;
  if exists (select 1 from ace.exam_config_subjects where exam_config_id=p_exam_config_id and question_count <= 0) then result := jsonb_set(result,'{valid}','false'::jsonb); result := jsonb_set(result,'{errors}', (result->'errors') || jsonb_build_array('All configured subject question counts must be positive')); end if;
  return result;
end;
$function$
;

drop policy if exists catalog_sources_manage_admin on ace.catalog_sources;

drop policy if exists catalog_batches_manage_admin on ace.catalog_import_batches;

drop policy if exists catalog_rows_manage_admin on ace.catalog_import_rows;

drop policy if exists catalog_rows_manage_editor on ace.catalog_import_rows;
create policy catalog_rows_manage_editor on ace.catalog_import_rows for ALL to authenticated
using (ace.is_admin_or_editor())
with check (ace.is_admin_or_editor());

drop policy if exists catalog_batches_manage_editor on ace.catalog_import_batches;
create policy catalog_batches_manage_editor on ace.catalog_import_batches for ALL to authenticated
using (ace.is_admin_or_editor())
with check (ace.is_admin_or_editor());

drop policy if exists catalog_sources_manage_editor on ace.catalog_sources;
create policy catalog_sources_manage_editor on ace.catalog_sources for ALL to authenticated
using (ace.is_admin_or_editor())
with check (ace.is_admin_or_editor());

drop policy if exists questions_public_read on ace.questions;
create policy questions_public_read on ace.questions for SELECT to public
using (((active AND (review_status = 'published'::text)) OR ace.is_admin_or_editor()));

commit;

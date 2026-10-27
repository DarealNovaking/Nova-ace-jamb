-- Exact function definitions from read-only production audit 2026-10-27. No data.
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
CREATE OR REPLACE FUNCTION ace.has_active_entitlement(p_user_id uuid, p_product_code text DEFAULT 'ace_pass'::text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'ace', 'public'
AS $function$ select exists(select 1 from ace.entitlements e join ace.products p on p.id=e.product_id where e.user_id=p_user_id and p.code=p_product_code and e.status='active' and now() between e.starts_at and e.ends_at); $function$
;
CREATE OR REPLACE FUNCTION ace.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'ace', 'public'
AS $function$
  select exists (select 1 from ace.roles where user_id = auth.uid() and role = 'admin');
$function$
;
CREATE OR REPLACE FUNCTION ace.is_admin_or_editor()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'ace', 'public'
AS $function$
  select exists (select 1 from ace.roles where user_id = auth.uid() and role in ('admin','editor'));
$function$
;
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

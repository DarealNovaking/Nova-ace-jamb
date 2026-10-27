-- FCB-01: preserve RPC contracts while limiting privileged reads to their audience.
-- Reviewed source only; production application requires separate authorization.
begin;

create or replace function ace.has_active_entitlement(p_user_id uuid, p_product_code text default 'ace_pass')
returns boolean language sql stable security definer set search_path = pg_catalog, ace
as $$
 select auth.uid() is not null
   and (p_user_id = auth.uid() or ace.is_admin())
   and exists (
     select 1 from ace.entitlements e join ace.products p on p.id=e.product_id
     where e.user_id=p_user_id and p.code=p_product_code and e.status='active'
       and now() >= e.starts_at and now() < e.ends_at
   );
$$;

create or replace function ace.get_catalog_institutions()
returns table(id uuid,name text,state text,institution_type text)
language sql stable security definer set search_path = pg_catalog, ace
as $$
 select i.id,i.name,i.state,i.institution_type from ace.institutions i
 where auth.uid() is not null and ace.is_admin_or_editor() and i.status='draft'
 order by i.name;
$$;

create or replace function ace.get_catalog_source(p_source_id uuid)
returns table(id uuid,title text,status text,source_type text)
language sql stable security definer set search_path = pg_catalog, ace
as $$
 select s.id,s.title,s.status,s.source_type from ace.catalog_sources s
 where auth.uid() is not null and ace.is_admin_or_editor() and s.id=p_source_id;
$$;

create or replace function ace.check_catalog_import_idempotency(p_snapshot_hash text)
returns table(id uuid,status text,row_count integer)
language sql stable security definer set search_path = pg_catalog, ace
as $$
 select b.id,b.status,b.row_count from ace.catalog_import_batches b
 where auth.uid() is not null and ace.is_admin_or_editor() and b.snapshot_hash=p_snapshot_hash
 limit 1;
$$;

create or replace function ace.set_student_subjects(p_subject_ids uuid[])
returns setof ace.student_subjects language plpgsql security definer
set search_path = pg_catalog, ace, auth
as $$
declare v_user uuid := auth.uid();
begin
 if v_user is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if p_subject_ids is null or cardinality(p_subject_ids)<>4
    or (select count(distinct x) from unnest(p_subject_ids) x)<>4
    or (select count(*) from ace.subjects where id=any(p_subject_ids) and active)<>4
    or not exists(select 1 from ace.subjects where id=any(p_subject_ids) and code='ENG' and active) then
   raise exception 'Select English and three distinct active additional subjects' using errcode='22023';
 end if;
 -- Serialize concurrent calls to this subject-selection RPC.
 perform pg_advisory_xact_lock(hashtextextended(v_user::text,0));
 delete from ace.student_subjects where user_id=v_user;
 return query
 insert into ace.student_subjects(user_id,subject_id,is_primary,sort_order)
 select v_user,s.id,s.code='ENG',
   (row_number() over(order by case when s.code='ENG' then 0 else 1 end,u.ord)-1)::integer
 from unnest(p_subject_ids) with ordinality u(id,ord)
 join ace.subjects s on s.id=u.id
 returning *;
end;
$$;

create or replace function ace.set_user_role(target_user_id uuid,target_role text)
returns ace.roles language plpgsql security definer set search_path = pg_catalog, ace, auth
as $$
declare v_previous text; v_result ace.roles;
begin
 if auth.uid() is null then raise exception 'Administrator access required' using errcode='42501'; end if;
 -- Serialize role mutations BEFORE checking caller privileges/last-admin count.
 -- This prevents concurrent demotions from each observing a different last admin.
 lock table ace.roles in share row exclusive mode;
 -- Stale repeatable-read snapshots must serialize instead of counting old admins.
 perform 1 from ace.roles where role='admin' order by user_id for update;
 if not ace.is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
 if target_role is null or target_role not in ('student','editor','admin') or target_user_id is null then
   raise exception 'Invalid target role or user' using errcode='22023';
 end if;
 if not exists(select 1 from auth.users where id=target_user_id) then
   raise exception 'Target user does not exist' using errcode='22023';
 end if;
 select role into v_previous from ace.roles where user_id=target_user_id;
 if v_previous='admin' and target_role<>'admin'
    and (select count(*) from ace.roles where role='admin')<=1 then
   raise exception 'Cannot remove the last administrator' using errcode='23514';
 end if;
 insert into ace.roles(user_id,role) values(target_user_id,target_role)
 on conflict(user_id) do update set role=excluded.role returning * into v_result;
 insert into ace.audit_events(actor_user_id,event_type,entity_type,entity_id,metadata)
 values(auth.uid(),'role_changed','user_role',target_user_id,
   jsonb_build_object('previous_role',v_previous,'new_role',target_role));
 return v_result;
end;
$$;

-- Direct editor writes must not bypass the admin-only approval RPC.
-- Existing editor SELECT and guarded transactional staging/validation RPCs remain.
drop policy if exists catalog_sources_manage_editor on ace.catalog_sources;
create policy catalog_sources_manage_admin on ace.catalog_sources for all to authenticated
 using ((select ace.is_admin())) with check ((select ace.is_admin()));
drop policy if exists catalog_batches_manage_editor on ace.catalog_import_batches;
create policy catalog_batches_manage_admin on ace.catalog_import_batches for all to authenticated
 using ((select ace.is_admin())) with check ((select ace.is_admin()));
drop policy if exists catalog_rows_manage_editor on ace.catalog_import_rows;
create policy catalog_rows_manage_admin on ace.catalog_import_rows for all to authenticated
 using ((select ace.is_admin())) with check ((select ace.is_admin()));

-- Legacy profile-save API must obey the same compulsory subject rule.
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
    raise exception 'Select exactly four subjects.' using errcode = '22023';
  end if;

  select count(distinct subject_id), count(*)
    into v_subject_count, v_active_subject_count
  from unnest(p_subject_ids) as requested(subject_id)
  join ace.subjects s on s.id = requested.subject_id and s.active = true;

  if cardinality(p_subject_ids) <> 4 or v_subject_count <> cardinality(p_subject_ids) or v_active_subject_count <> cardinality(p_subject_ids) then
    raise exception 'Select exactly four active subjects.' using errcode = '22023';
  end if;

  if not exists(select 1 from ace.subjects where id=any(p_subject_ids) and code='ENG' and active) then
    raise exception 'English must be included with three additional subjects' using errcode='22023';
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
  select v_user_id, s.id, s.code='ENG',
         (row_number() over(order by case when s.code='ENG' then 0 else 1 end,selected.ordinality)-1)::integer
  from unnest(p_subject_ids) with ordinality as selected(subject_id, ordinality)
  join ace.subjects s on s.id=selected.subject_id;
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
  if auth.uid() is null or not ace.is_admin_or_editor() then
    raise exception 'Administrator/editor access required' using errcode='42501';
  end if;
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

revoke all on function ace.has_active_entitlement(uuid,text),ace.get_catalog_institutions(),
 ace.get_catalog_source(uuid),ace.check_catalog_import_idempotency(text),
 ace.set_student_subjects(uuid[]),ace.set_user_role(uuid,text),
 ace.save_student_foundation(text,smallint,text,text,integer,uuid[]),ace.validate_exam_config(uuid) from public,anon;
grant execute on function ace.has_active_entitlement(uuid,text),ace.get_catalog_institutions(),
 ace.get_catalog_source(uuid),ace.check_catalog_import_idempotency(text),
 ace.set_student_subjects(uuid[]),ace.set_user_role(uuid,text),
 ace.save_student_foundation(text,smallint,text,text,integer,uuid[]),ace.validate_exam_config(uuid) to authenticated;
commit;

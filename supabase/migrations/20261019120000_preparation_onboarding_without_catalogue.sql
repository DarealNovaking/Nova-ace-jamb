-- Allow preparation onboarding to complete without a published institution/programme catalogue.
-- Manual institution/course goals are explicitly unresolved; only source-backed catalogue IDs
-- may be treated as verified admission context.
create or replace function ace.save_student_preparation_foundation(
  p_display_name text,
  p_target_score smallint,
  p_institution_goal text,
  p_course_goal text,
  p_daily_minutes integer,
  p_subject_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, ace, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_subject_count integer;
  v_existing ace.profiles%rowtype;
  v_institution text := nullif(left(btrim(coalesce(p_institution_goal, '')), 160), '');
  v_course text := nullif(left(btrim(coalesce(p_course_goal, '')), 160), '');
  v_keep_catalog_link boolean := false;
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
  if p_daily_minutes is null or p_daily_minutes < 1 or p_daily_minutes > 1440 then
    raise exception 'Study time must be between 1 and 1440 minutes.' using errcode = '22023';
  end if;
  if p_subject_ids is null or cardinality(p_subject_ids) <> 4
     or (select count(distinct subject_id) from unnest(p_subject_ids) as selected(subject_id)) <> 4 then
    raise exception 'Select exactly four distinct preparation subjects.' using errcode = '22023';
  end if;

  select count(*) into v_subject_count
  from ace.subjects s
  where s.id = any(p_subject_ids) and s.active = true;
  if v_subject_count <> 4 then
    raise exception 'One or more selected preparation subjects are unavailable.' using errcode = '22023';
  end if;

  select * into v_existing from ace.profiles where id = v_user_id for update;
  if not found then
    raise exception 'Student profile not found.' using errcode = 'P0002';
  end if;

  -- Keep structured catalogue IDs only if the user-provided goals still match the linked records.
  if v_existing.institution_id is not null and v_existing.program_id is not null then
    select (i.name = v_institution and p.name = v_course)
      into v_keep_catalog_link
    from ace.institutions i
    join ace.programs p on p.id = v_existing.program_id and p.institution_id = i.id
    where i.id = v_existing.institution_id;
    v_keep_catalog_link := coalesce(v_keep_catalog_link, false);
  end if;

  update ace.profiles
  set display_name = btrim(p_display_name),
      target_score = p_target_score,
      institution = v_institution,
      course = v_course,
      institution_id = case when v_keep_catalog_link then v_existing.institution_id else null end,
      program_id = case when v_keep_catalog_link then v_existing.program_id else null end
  where id = v_user_id;

  insert into ace.student_preferences (user_id, daily_minutes)
  values (v_user_id, p_daily_minutes)
  on conflict (user_id) do update
    set daily_minutes = excluded.daily_minutes,
        updated_at = pg_catalog.now();

  delete from ace.student_subjects where user_id = v_user_id;
  insert into ace.student_subjects (user_id, subject_id, is_primary, sort_order)
  select v_user_id, subject_id, (subject.code = 'ENG'), (ordinality - 1)::integer
  from unnest(p_subject_ids) with ordinality as selected(subject_id, ordinality)
  join ace.subjects subject on subject.id = selected.subject_id and subject.active = true
  order by case when subject.code = 'ENG' then 0 else 1 end, ordinality;
end;
$$;

revoke all on function ace.save_student_preparation_foundation(text, smallint, text, text, integer, uuid[]) from public, anon;
grant execute on function ace.save_student_preparation_foundation(text, smallint, text, text, integer, uuid[]) to authenticated;

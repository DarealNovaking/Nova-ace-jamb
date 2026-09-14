create or replace function ace.save_student_foundation(
  p_display_name text,
  p_target_score smallint,
  p_institution text,
  p_course text,
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
$$;

revoke all on function ace.save_student_foundation(text, smallint, text, text, integer, uuid[]) from public, anon;
grant execute on function ace.save_student_foundation(text, smallint, text, text, integer, uuid[]) to authenticated;

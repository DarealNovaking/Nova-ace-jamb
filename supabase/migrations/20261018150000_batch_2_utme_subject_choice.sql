-- Validate and save a student's explicitly selected UTME subjects against the active programme rule.
-- This is additive: the older fixed-combination RPC remains available but cannot accept arbitrary choices.
create or replace function ace.save_student_foundation_catalog_with_subjects(
  p_display_name text,
  p_target_score smallint,
  p_institution_id uuid,
  p_program_id uuid,
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
  v_season_id uuid;
  v_institution ace.institutions%rowtype;
  v_program ace.programs%rowtype;
  v_rule ace.program_utme_rules%rowtype;
  v_subject_ids uuid[];
  v_subject_count integer;
  v_group jsonb;
  v_group_minimum integer;
  v_group_selected integer;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_display_name is null or length(btrim(p_display_name)) = 0 or length(btrim(p_display_name)) > 80 then raise exception 'Display name must be 1–80 characters.' using errcode = '22023'; end if;
  if p_target_score is null or p_target_score < 0 or p_target_score > 400 then raise exception 'Target score must be between 0 and 400.' using errcode = '22023'; end if;
  if p_daily_minutes is null or p_daily_minutes < 1 or p_daily_minutes > 1440 then raise exception 'Study time must be between 1 and 1440 minutes.' using errcode = '22023'; end if;
  if p_subject_ids is null or cardinality(p_subject_ids) <> 4 or (select count(distinct input_subject_id) from unnest(p_subject_ids) as input_subjects(input_subject_id)) <> 4 then
    raise exception 'Select exactly four distinct UTME subjects.' using errcode = '22023';
  end if;

  select * into v_institution from ace.institutions where id = p_institution_id and status = 'active';
  if not found then raise exception 'Selected institution is not available.' using errcode = '22023'; end if;
  select * into v_program from ace.programs where id = p_program_id and institution_id = p_institution_id and status = 'active';
  if not found then raise exception 'Selected course is not available for this institution.' using errcode = '22023'; end if;
  select id into v_season_id from ace.exam_seasons where status = 'active' order by exam_year desc limit 1;
  if v_season_id is null then raise exception 'No active JAMB season is available.' using errcode = '22023'; end if;
  select * into v_rule from ace.program_utme_rules where season_id = v_season_id and program_id = p_program_id and status = 'active' order by version desc limit 1;
  if not found then raise exception 'No verified UTME subject combination is available for this course.' using errcode = '22023'; end if;

  select array_agg(s.id order by case when s.code = 'ENG' then 0 else 1 end, s.sort_order) into v_subject_ids
  from ace.subjects s
  where s.id = any(p_subject_ids) and s.active = true;
  if coalesce(cardinality(v_subject_ids), 0) <> 4 then raise exception 'One or more selected UTME subjects are invalid.' using errcode = '22023'; end if;

  v_subject_count := cardinality(coalesce(v_rule.required_subject_ids, '{}'::uuid[]));
  if v_subject_count < 1 or v_subject_count + coalesce(v_rule.minimum_optional_subjects, 0) <> 4 then
    raise exception 'The active programme rule needs administrator review before student enrollment.' using errcode = '22023';
  end if;
  if not (coalesce(v_rule.required_subject_ids, '{}'::uuid[]) <@ v_subject_ids) then
    raise exception 'Your selection is missing one or more required UTME subjects.' using errcode = '22023';
  end if;

  for v_group in select value from jsonb_array_elements(coalesce(v_rule.alternative_groups, '[]'::jsonb)) as groups(value)
  loop
    v_group_minimum := coalesce((v_group->>'minimum_required')::integer, 0);
    if coalesce(jsonb_typeof(v_group->'subject_codes'), 'null') <> 'array' or v_group_minimum < 1 then
      raise exception 'The active programme rule has an invalid alternative-subject group.' using errcode = '22023';
    end if;
    select count(*) into v_group_selected
    from ace.subjects s
    where s.id = any(v_subject_ids)
      and s.code in (select jsonb_array_elements_text(v_group->'subject_codes'));
    if v_group_selected < v_group_minimum then
      raise exception 'Your selection does not satisfy every required alternative-subject group.' using errcode = '22023';
    end if;
  end loop;

  if exists (
    select 1
    from unnest(v_subject_ids) as chosen(subject_id)
    join ace.subjects s on s.id = chosen.subject_id
    where not (s.id = any(coalesce(v_rule.required_subject_ids, '{}'::uuid[])))
      and not exists (
        select 1
        from jsonb_array_elements(coalesce(v_rule.alternative_groups, '[]'::jsonb)) as groups(value)
        where exists (
          select 1 from jsonb_array_elements_text(groups.value->'subject_codes') as codes(code)
          where codes.code = s.code
        )
      )
  ) then
    raise exception 'Your selection includes a subject not allowed by the active programme rule.' using errcode = '22023';
  end if;

  if not exists (select 1 from ace.exam_configs c where c.season_id = v_season_id and c.active = true) then
    raise exception 'The active JAMB exam configuration is unavailable.' using errcode = '22023';
  end if;

  update ace.profiles
  set display_name = btrim(p_display_name),
      target_score = p_target_score,
      institution = v_institution.name,
      course = v_program.name,
      institution_id = v_institution.id,
      program_id = v_program.id
  where id = v_user_id;
  if not found then raise exception 'Student profile not found.' using errcode = 'P0002'; end if;

  insert into ace.student_preferences (user_id, daily_minutes)
  values (v_user_id, p_daily_minutes)
  on conflict (user_id) do update set daily_minutes = excluded.daily_minutes, updated_at = pg_catalog.now();

  delete from ace.student_subjects where user_id = v_user_id;
  insert into ace.student_subjects (user_id, subject_id, is_primary, sort_order)
  select v_user_id, subject_id, ordinality = 1, (ordinality - 1)::integer
  from unnest(v_subject_ids) with ordinality as selected(subject_id, ordinality);
end;
$$;

revoke all on function ace.save_student_foundation_catalog_with_subjects(text, smallint, uuid, uuid, integer, uuid[]) from public, anon;
grant execute on function ace.save_student_foundation_catalog_with_subjects(text, smallint, uuid, uuid, integer, uuid[]) to authenticated;

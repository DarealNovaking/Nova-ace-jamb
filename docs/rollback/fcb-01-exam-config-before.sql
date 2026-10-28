-- Incident-only metadata rollback: restores known editor-approval/composition weaknesses.

-- No existing configuration rows changed. No other FCB-01 migrations reverted.

begin;

drop trigger if exists guard_exam_composition on ace.exam_config_subjects;

drop function if exists ace.guard_exam_composition();

-- Original SHA256 f0f70e3eaee59bbb12b6fd9734fe280bb2ca0d23d99af4543d8708efcb3c1eb1

CREATE OR REPLACE FUNCTION ace.activate_exam_config(p_exam_config_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'ace'
AS $function$
declare
  v_user uuid := auth.uid();
  validation jsonb;
  v_season_id uuid;
begin
  if v_user is null or not ace.is_admin_or_editor() then raise exception 'Admin/editor access required'; end if;
  select season_id into v_season_id from ace.exam_configs where id=p_exam_config_id;
  if v_season_id is null then raise exception 'Exam configuration not found'; end if;
  validation := ace.validate_exam_config(p_exam_config_id);
  if coalesce((validation->>'valid')::boolean,false) is not true then raise exception 'Exam configuration invalid: %', validation->'errors'; end if;
  update ace.exam_configs set active=false where season_id=v_season_id and id<>p_exam_config_id;
  update ace.exam_configs set active=true, version=version+1 where id=p_exam_config_id;
end;
$function$;

-- Original SHA256 6711e3d3a2cb1aeeebdb23a5b10ec8b7e75abfc38dd6d3a61cd235343ac6bd61

CREATE OR REPLACE FUNCTION ace.activate_exam_season(p_season_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'ace'
AS $function$
declare
  v_user uuid := auth.uid();
  v_season ace.exam_seasons%rowtype;
begin
  if v_user is null or not ace.is_admin_or_editor() then raise exception 'Admin/editor access required'; end if;
  select * into v_season from ace.exam_seasons where id=p_season_id for update;
  if not found then raise exception 'Season not found'; end if;
  if not exists (select 1 from ace.exam_configs where season_id=p_season_id and active=true) then raise exception 'Season must have an active exam configuration'; end if;
  if not exists (select 1 from ace.syllabus_versions where season_id=p_season_id and status='active') then raise exception 'Season must have at least one active syllabus version'; end if;
  update ace.exam_seasons set status='archived', updated_at=now() where status='active' and id<>p_season_id;
  update ace.exam_seasons set status='active', updated_at=now() where id=p_season_id;
end;
$function$;

-- Original SHA256 b267e655686d200081c3df27cf9e7c769ccb9a167182bdb587c39565b35973e4

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
$function$;

drop policy if exists exam_config_subjects_read_authenticated on ace.exam_config_subjects;

create policy exam_config_subjects_read_authenticated on ace.exam_config_subjects for select to authenticated using (((EXISTS ( SELECT 1
   FROM (ace.exam_configs c
     JOIN ace.exam_seasons s ON ((s.id = c.season_id)))
  WHERE ((c.id = exam_config_subjects.exam_config_id) AND (s.status = ANY (ARRAY['active'::text, 'closed'::text]))))) OR ace.is_admin_or_editor()));

drop policy if exists exam_configs_public_read on ace.exam_configs;

create policy exam_configs_public_read on ace.exam_configs for select to anon,authenticated using ((active = true));

drop policy if exists exam_configs_read_authenticated_v2 on ace.exam_configs;

create policy exam_configs_read_authenticated_v2 on ace.exam_configs for select to authenticated using ((active OR ace.is_admin_or_editor()));

drop policy if exists exam_seasons_read_authenticated_v2 on ace.exam_seasons;

create policy exam_seasons_read_authenticated_v2 on ace.exam_seasons for select to authenticated using (((status = ANY (ARRAY['draft'::text, 'active'::text, 'closed'::text])) OR ace.is_admin_or_editor()));

revoke select on ace.exam_seasons from authenticated;

revoke select on ace.exam_configs from authenticated;

revoke all on function ace.activate_exam_config(p_exam_config_id uuid) from public,anon,authenticated;

grant execute on function ace.activate_exam_config(p_exam_config_id uuid) to authenticated;

revoke all on function ace.activate_exam_season(p_season_id uuid) from public,anon,authenticated;

grant execute on function ace.activate_exam_season(p_season_id uuid) to authenticated;

revoke all on function ace.validate_exam_config(p_exam_config_id uuid) from public,anon,authenticated;

grant execute on function ace.validate_exam_config(p_exam_config_id uuid) to authenticated;

commit;

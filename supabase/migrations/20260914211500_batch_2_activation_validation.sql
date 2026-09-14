create or replace function ace.validate_exam_config(p_exam_config_id uuid)
returns jsonb language plpgsql stable security definer set search_path = pg_catalog, ace
as $$
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
  result := jsonb_build_object('valid',true,'errors','[]'::jsonb,'required_subjects',required_count,'optional_subjects',optional_count,'required_questions',required_questions,'optional_question_counts',optional_question_counts,'total_questions',c.total_questions,'duration_seconds',c.duration_seconds,'option_count',c.option_count);
  if c.duration_seconds <= 0 then result := jsonb_set(result,'{valid}','false'::jsonb); result := jsonb_set(result,'{errors}',(result->'errors') || jsonb_build_array('Duration must be positive')); end if;
  if c.total_questions <= 0 then result := jsonb_set(result,'{valid}','false'::jsonb); result := jsonb_set(result,'{errors}',(result->'errors') || jsonb_build_array('Total question count must be positive')); end if;
  if c.option_count < 2 or c.option_count > 8 then result := jsonb_set(result,'{valid}','false'::jsonb); result := jsonb_set(result,'{errors}',(result->'errors') || jsonb_build_array('Option count must be between 2 and 8')); end if;
  if required_count < 1 then result := jsonb_set(result,'{valid}','false'::jsonb); result := jsonb_set(result,'{errors}',(result->'errors') || jsonb_build_array('At least one required subject is required')); end if;
  if optional_count < 1 then result := jsonb_set(result,'{valid}','false'::jsonb); result := jsonb_set(result,'{errors}',(result->'errors') || jsonb_build_array('At least one optional subject is required')); end if;
  if exists (select 1 from ace.exam_config_subjects where exam_config_id=p_exam_config_id and question_count <= 0) then result := jsonb_set(result,'{valid}','false'::jsonb); result := jsonb_set(result,'{errors}',(result->'errors') || jsonb_build_array('All configured subject question counts must be positive')); end if;
  return result;
end;
$$;
revoke all on function ace.validate_exam_config(uuid) from public, anon;
grant execute on function ace.validate_exam_config(uuid) to authenticated;

create or replace function ace.activate_exam_config(p_exam_config_id uuid)
returns void language plpgsql security definer set search_path = pg_catalog, ace
as $$
declare v_user uuid := auth.uid(); validation jsonb; v_season_id uuid;
begin
  if v_user is null or not ace.is_admin_or_editor() then raise exception 'Admin/editor access required'; end if;
  select season_id into v_season_id from ace.exam_configs where id=p_exam_config_id;
  if v_season_id is null then raise exception 'Exam configuration not found'; end if;
  validation := ace.validate_exam_config(p_exam_config_id);
  if coalesce((validation->>'valid')::boolean,false) is not true then raise exception 'Exam configuration invalid: %', validation->'errors'; end if;
  update ace.exam_configs set active=false where season_id=v_season_id and id<>p_exam_config_id;
  update ace.exam_configs set active=true, version=version+1 where id=p_exam_config_id;
end;
$$;
revoke all on function ace.activate_exam_config(uuid) from public, anon;
grant execute on function ace.activate_exam_config(uuid) to authenticated;

create or replace function ace.activate_syllabus_version(p_syllabus_version_id uuid)
returns void language plpgsql security definer set search_path = pg_catalog, ace
as $$
declare v_user uuid := auth.uid(); v_season_id uuid; v_subject_id uuid; v_rights text; v_topics integer;
begin
  if v_user is null or not ace.is_admin_or_editor() then raise exception 'Admin/editor access required'; end if;
  select season_id,subject_id,rights_status into v_season_id,v_subject_id,v_rights from ace.syllabus_versions where id=p_syllabus_version_id;
  if v_season_id is null then raise exception 'Syllabus version not found'; end if;
  if v_rights <> 'approved' then raise exception 'Syllabus version requires approved rights status'; end if;
  select count(*) into v_topics from ace.topics where syllabus_version_id=p_syllabus_version_id and active=true;
  if v_topics < 1 then raise exception 'Syllabus version must contain at least one active topic'; end if;
  update ace.syllabus_versions set status='archived', updated_at=now() where season_id=v_season_id and subject_id=v_subject_id and id<>p_syllabus_version_id;
  update ace.syllabus_versions set status='active', activated_at=now(), updated_at=now() where id=p_syllabus_version_id;
end;
$$;
revoke all on function ace.activate_syllabus_version(uuid) from public, anon;
grant execute on function ace.activate_syllabus_version(uuid) to authenticated;

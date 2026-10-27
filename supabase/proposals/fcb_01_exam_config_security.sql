-- Source review proposal only. NOT applied to production.
-- No official season dates, duration or question counts are asserted by these tests.
begin;

-- Metadata-only reads; drafts remain restricted to managers. No data mutation grants.
grant select on ace.exam_seasons,ace.exam_configs to authenticated;
drop policy if exists exam_seasons_read_authenticated_v2 on ace.exam_seasons;
create policy exam_seasons_read_authenticated_v2 on ace.exam_seasons for select to authenticated
using(status in ('active','closed') or ace.is_admin_or_editor());
drop policy if exists exam_configs_public_read on ace.exam_configs;
create policy exam_configs_public_read on ace.exam_configs for select to anon,authenticated
using(active and exists(select 1 from ace.exam_seasons s where s.id=season_id and s.status in ('active','closed')));
drop policy if exists exam_configs_read_authenticated_v2 on ace.exam_configs;
create policy exam_configs_read_authenticated_v2 on ace.exam_configs for select to authenticated
using((active and exists(select 1 from ace.exam_seasons s where s.id=season_id and s.status in ('active','closed'))) or ace.is_admin_or_editor());
drop policy if exists exam_config_subjects_read_authenticated on ace.exam_config_subjects;
create policy exam_config_subjects_read_authenticated on ace.exam_config_subjects for select to authenticated
using(exists(select 1 from ace.exam_configs c join ace.exam_seasons s on s.id=c.season_id
 where c.id=exam_config_id and c.active and s.status in ('active','closed')) or ace.is_admin_or_editor());
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
  v_min integer;
  v_max integer;
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
  if required_count<>1 or not exists(select 1 from ace.exam_config_subjects cs join ace.subjects sub on sub.id=cs.subject_id
      where cs.exam_config_id=p_exam_config_id and cs.required and sub.code='ENG' and sub.active) then
    result:=jsonb_set(result,'{valid}','false'::jsonb);
    result:=jsonb_set(result,'{errors}',(result->'errors')||jsonb_build_array('Exactly one compulsory active English subject is required'));
  end if;
  if optional_count<3 then
    result:=jsonb_set(result,'{valid}','false'::jsonb);
    result:=jsonb_set(result,'{errors}',(result->'errors')||jsonb_build_array('At least three optional subjects are required'));
  end if;
  if exists(select 1 from ace.exam_config_subjects cs join ace.subjects sub on sub.id=cs.subject_id
      where cs.exam_config_id=p_exam_config_id and not sub.active) then
    result:=jsonb_set(result,'{valid}','false'::jsonb);
    result:=jsonb_set(result,'{errors}',(result->'errors')||jsonb_build_array('Configured subjects must be active'));
  end if;
  select sum(question_count) into v_min from (select question_count from ace.exam_config_subjects
    where exam_config_id=p_exam_config_id and not required order by question_count limit 3) x;
  select sum(question_count) into v_max from (select question_count from ace.exam_config_subjects
    where exam_config_id=p_exam_config_id and not required order by question_count desc limit 3) x;
  if optional_count>=3 and (required_questions+v_min<>c.total_questions or required_questions+v_max<>c.total_questions) then
    result:=jsonb_set(result,'{valid}','false'::jsonb);
    result:=jsonb_set(result,'{errors}',(result->'errors')||jsonb_build_array('Every choice of three optional subjects must match the configured total'));
  end if;
  return result;
end;
$function$;

create or replace function ace.guard_exam_composition() returns trigger
language plpgsql security definer set search_path=pg_catalog,ace as $$
declare v_old uuid; v_new uuid; c record;
begin
 if auth.uid() is null or not ace.is_admin_or_editor() then raise exception 'Configuration authoring permission required' using errcode='42501'; end if;
 if tg_op<>'INSERT' then v_old:=old.exam_config_id; end if;
 if tg_op<>'DELETE' then v_new:=new.exam_config_id; end if;
 -- Shared parent locks serialize draft writes against activation's exclusive lock.
 for c in select id,active from ace.exam_configs where id=any(array[v_old,v_new]) order by id for share loop
  if c.active then raise exception 'Active exam composition is immutable; create a draft version' using errcode='42501'; end if;
 end loop;
 insert into ace.audit_events(actor_user_id,event_type,entity_type,entity_id,metadata)
 values(auth.uid(),'exam_composition_changed','exam_config',coalesce(v_new,v_old),jsonb_build_object('operation',tg_op));
 if tg_op='DELETE' then return old; end if;
 return new;
end;
$$;
revoke all on function ace.guard_exam_composition() from public,anon,authenticated;
drop trigger if exists guard_exam_composition on ace.exam_config_subjects;
create trigger guard_exam_composition before insert or update or delete on ace.exam_config_subjects
for each row execute function ace.guard_exam_composition();

create or replace function ace.activate_exam_config(p_exam_config_id uuid) returns void
language plpgsql security definer set search_path=pg_catalog,ace as $$
declare v_season uuid; v_status text; validation jsonb; v_prior jsonb;
begin
 if auth.uid() is null or not ace.is_admin() then raise exception 'Administrator approval required' using errcode='42501'; end if;
 if p_exam_config_id is null then raise exception 'Configuration required' using errcode='22023'; end if;
 select season_id into v_season from ace.exam_configs where id=p_exam_config_id;
 if not found then raise exception 'Configuration unavailable' using errcode='P0002'; end if;
 -- Serialize different target configurations too, keeping one active per season.
 select status into v_status from ace.exam_seasons where id=v_season for update;
 if not found then raise exception 'Season unavailable' using errcode='P0002'; end if;
 if v_status in ('closed','archived') then raise exception 'Closed season cannot be activated' using errcode='22023'; end if;
 perform id from ace.exam_configs where season_id=v_season order by id for update;
 if not exists(select 1 from ace.exam_configs where id=p_exam_config_id and season_id=v_season) then
  raise exception 'Configuration unavailable' using errcode='P0002';
 end if;
 validation:=ace.validate_exam_config(p_exam_config_id);
 if coalesce((validation->>'valid')::boolean,false) is not true then raise exception 'Invalid exam configuration' using errcode='22023'; end if;
 select coalesce(jsonb_agg(id order by id),'[]'::jsonb) into v_prior from ace.exam_configs where season_id=v_season and active;
 if v_prior=jsonb_build_array(p_exam_config_id) then return; end if;
 update ace.exam_configs set active=false where season_id=v_season and id<>p_exam_config_id and active;
 -- Version identifies the configuration; activating it must not collide with a later draft.
 update ace.exam_configs set active=true where id=p_exam_config_id;
 insert into ace.audit_events(actor_user_id,event_type,entity_type,entity_id,metadata)
 values(auth.uid(),'exam_config_activated','exam_config',p_exam_config_id,jsonb_build_object('season_id',v_season,'previous_active',v_prior));
end;
$$;
revoke all on function ace.activate_exam_config(uuid) from public,anon,authenticated;
grant execute on function ace.activate_exam_config(uuid) to authenticated;

create or replace function ace.activate_exam_season(p_season_id uuid) returns void
language plpgsql security definer set search_path=pg_catalog,ace as $$
declare v_status text; v_config uuid; v_prior jsonb;
begin
 if auth.uid() is null or not ace.is_admin() then raise exception 'Administrator approval required' using errcode='42501'; end if;
 if p_season_id is null then raise exception 'Season required' using errcode='22023'; end if;
 -- Rare approval operation: serialize all targets before choosing the new active season.
 lock table ace.exam_seasons in share row exclusive mode;
 -- Lock every season row too: a stale REPEATABLE READ snapshot must fail safely.
 perform id from ace.exam_seasons order by id for update;
 select status into v_status from ace.exam_seasons where id=p_season_id for update;
 if not found then raise exception 'Season unavailable' using errcode='P0002'; end if;
 if v_status in ('closed','archived') then raise exception 'Closed season cannot be activated' using errcode='22023'; end if;
 if (select count(*) from ace.exam_configs where season_id=p_season_id and active)<>1 then
  raise exception 'Season requires one approved configuration' using errcode='22023';
 end if;
 select id into v_config from ace.exam_configs where season_id=p_season_id and active for share;
 if coalesce((ace.validate_exam_config(v_config)->>'valid')::boolean,false) is not true then
  raise exception 'Season configuration invalid' using errcode='22023';
 end if;
 if exists(select 1 from ace.exam_config_subjects cs where cs.exam_config_id=v_config
   and not exists(select 1 from ace.syllabus_versions v where v.season_id=p_season_id
     and v.subject_id=cs.subject_id and v.status='active' and v.rights_status='approved'
     and exists(select 1 from ace.topics t join ace.subtopics st on st.topic_id=t.id
       where t.syllabus_version_id=v.id and st.syllabus_version_id=v.id and t.active and st.active))) then
  raise exception 'Configured subjects require approved published syllabus trees' using errcode='22023';
 end if;
 select coalesce(jsonb_agg(id order by id),'[]'::jsonb) into v_prior from ace.exam_seasons where status='active';
 if v_prior=jsonb_build_array(p_season_id) then return; end if;
 update ace.exam_seasons set status='archived',updated_at=clock_timestamp() where status='active' and id<>p_season_id;
 update ace.exam_seasons set status='active',updated_at=clock_timestamp() where id=p_season_id;
 insert into ace.audit_events(actor_user_id,event_type,entity_type,entity_id,metadata)
 values(auth.uid(),'exam_season_activated','exam_season',p_season_id,jsonb_build_object('previous_active',v_prior,'exam_config_id',v_config));
end;
$$;
revoke all on function ace.activate_exam_season(uuid) from public,anon,authenticated;
grant execute on function ace.activate_exam_season(uuid) to authenticated;

commit;

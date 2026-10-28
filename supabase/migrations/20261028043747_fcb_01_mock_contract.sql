-- Applied with explicit owner authorization as 20261028043747 on 28 October 2026.
-- No real examination rules, commercial limits or publication rights are asserted.
begin;
alter table ace.attempts add column if not exists exam_config_id uuid references ace.exam_configs(id);
alter table ace.attempts add column if not exists exam_config_snapshot jsonb;

create or replace function ace.guard_mock_provenance() returns trigger
language plpgsql set search_path=pg_catalog,ace as $$
begin
 if old.exam_config_id is not null and
    (new.exam_config_id is distinct from old.exam_config_id
     or new.exam_config_snapshot is distinct from old.exam_config_snapshot
     or new.duration_seconds is distinct from old.duration_seconds
     or new.mode is distinct from old.mode) then
  raise exception 'Mock configuration is immutable' using errcode='23514';
 end if;
 return new;
end;
$$;
revoke all on function ace.guard_mock_provenance() from public,anon,authenticated;
drop trigger if exists guard_mock_provenance on ace.attempts;
create trigger guard_mock_provenance before update on ace.attempts
for each row execute function ace.guard_mock_provenance();

create or replace function ace.start_mock_attempt(p_exam_config_id uuid,p_subject_ids uuid[])
returns jsonb language plpgsql security definer set search_path=pg_catalog,ace as $$
declare c ace.exam_configs%rowtype; v_season uuid; v_status text; r record;
 v_ids uuid[]:='{}'::uuid[]; v_selected uuid[]; v_config jsonb; v_subjects jsonb;
 v_result jsonb; v_required integer; v_optional integer; v_total integer;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='28000'; end if;
 if p_exam_config_id is null or p_subject_ids is null or cardinality(p_subject_ids)<>4
    or (select count(distinct x) from unnest(p_subject_ids) x)<>4 then
  raise exception 'Choose English and three different subjects' using errcode='22023';
 end if;
 select season_id into v_season from ace.exam_configs where id=p_exam_config_id;
 if not found then raise exception 'Approved configuration unavailable' using errcode='P0002'; end if;
 -- Same parent-first lock order as approval. A concurrent approval cannot mix versions.
 select status into v_status from ace.exam_seasons where id=v_season for share;
 select * into c from ace.exam_configs where id=p_exam_config_id and season_id=v_season for share;
 if not found or v_status is distinct from 'active' or not c.active
    or not exists(select 1 from ace.audit_events where event_type='exam_config_activated' and entity_id=c.id)
    or not exists(select 1 from ace.audit_events where event_type='exam_season_activated' and entity_id=v_season) then
  raise exception 'Approved configuration unavailable' using errcode='P0002';
 end if;
 if c.total_questions not between 1 and 500 or c.duration_seconds not between 60 and 86400
    or c.option_count not between 2 and 8 then
  raise exception 'Configuration exceeds supported attempt bounds' using errcode='22023';
 end if;
 perform cs.subject_id from ace.exam_config_subjects cs where cs.exam_config_id=c.id order by cs.subject_id for share;
 perform s.id from ace.subjects s where s.id=any(p_subject_ids) order by s.id for share;
 select count(*) filter(where cs.required and s.code='ENG'),count(*) filter(where not cs.required),sum(cs.question_count),
   jsonb_agg(jsonb_build_object('subject_id',s.id,'required',cs.required,'question_count',cs.question_count)
    order by cs.sort_order,s.id)
 into v_required,v_optional,v_total,v_subjects
 from ace.exam_config_subjects cs join ace.subjects s on s.id=cs.subject_id
 where cs.exam_config_id=c.id and s.id=any(p_subject_ids) and s.active and cs.question_count>0;
 if v_required<>1 or v_optional<>3 or v_total is distinct from c.total_questions
    or exists(select 1 from ace.exam_config_subjects where exam_config_id=c.id and required and not(subject_id=any(p_subject_ids))) then
  raise exception 'Choose configured English and three optional subjects' using errcode='22023';
 end if;
 -- Deny disabled/unentitled/exhausted calls before scanning the question bank.
 perform ace.reserve_cbt_start('mock',c.total_questions,c.duration_seconds);
 for r in select cs.* from ace.exam_config_subjects cs where cs.exam_config_id=c.id
   and cs.subject_id=any(p_subject_ids) order by cs.subject_id loop
  -- Freeze publication predicates through question capture. Future withdrawals still
  -- use the existing per-operation current-rights gates; frozen keys stay private.
  perform v.id from ace.syllabus_versions v where v.season_id=v_season and v.subject_id=r.subject_id order by v.id for share;
  perform t.id from ace.topics t join ace.syllabus_versions v on v.id=t.syllabus_version_id
   where v.season_id=v_season and v.subject_id=r.subject_id order by t.id for share of t;
  perform st.id from ace.subtopics st join ace.syllabus_versions v on v.id=st.syllabus_version_id
   where v.season_id=v_season and v.subject_id=r.subject_id order by st.id for share of st;
  select array_agg(id order by rank) into v_selected from (
   select q.id,md5(random()::text||q.id::text) rank from ace.questions q
   join ace.topics t on t.id=q.topic_id and t.subject_id=q.subject_id and t.active
   join ace.syllabus_versions v on v.id=t.syllabus_version_id and v.subject_id=q.subject_id
   where q.subject_id=r.subject_id and v.season_id=v_season and v.status='active' and v.rights_status='approved'
    and q.active and q.review_status='published' and q.rights_status in ('owned','licensed','permitted')
    and (q.subtopic_id is null or exists(select 1 from ace.subtopics st where st.id=q.subtopic_id
      and st.topic_id=t.id and st.syllabus_version_id=v.id and st.active))
    and case when jsonb_typeof(q.options)='array' then
      jsonb_array_length(q.options)=c.option_count
      and (select count(distinct o->>'key') from jsonb_array_elements(q.options) o
           where nullif(o->>'key','') is not null and jsonb_typeof(o->'text')='string')=c.option_count
      and exists(select 1 from jsonb_array_elements(q.options) o where o->>'key'=q.correct_option_key)
      else false end
   order by rank limit r.question_count for share of q
  ) chosen;
  if coalesce(cardinality(v_selected),0)<>r.question_count then
   raise exception 'Insufficient approved questions for configured paper' using errcode='P0002';
  end if;
  v_ids:=v_ids||v_selected;
 end loop;
 -- Reuse owner, current-rights, paper snapshot and option shuffle code. The public
 -- generic endpoint rejects mode=mock, and clients have no attempt table writes.
 v_result:=ace.create_attempt_internal('mock',null,c.total_questions,c.duration_seconds,v_ids,true);
 if (v_result->>'question_count')::integer<>c.total_questions then
  raise exception 'Incomplete approved paper' using errcode='P0002';
 end if;
 v_config:=jsonb_build_object('exam_config_id',c.id,'season_id',c.season_id,'version',c.version,
  'duration_seconds',c.duration_seconds,'total_questions',c.total_questions,'option_count',c.option_count,'subjects',v_subjects);
 update ace.attempts set mode='mock',exam_config_id=c.id,exam_config_snapshot=v_config
 where id=(v_result->>'attempt_id')::uuid and user_id=auth.uid();
 return v_result||jsonb_build_object('mode','mock','exam_config',v_config);
end;
$$;
revoke all on function ace.start_mock_attempt(uuid,uuid[]) from public,anon,authenticated;
grant execute on function ace.start_mock_attempt(uuid,uuid[]) to authenticated;
-- No whole-row attempts/questions or answer/score mutation grants.
commit;

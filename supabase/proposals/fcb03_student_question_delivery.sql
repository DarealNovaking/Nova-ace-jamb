-- UNAPPLIED: two metadata-only RPCs. Existing attempt delivery stays unchanged.
begin;
create function ace.published_topic_questions(p_subject_id uuid,p_topic_id uuid,p_subtopic_id uuid default null,p_limit integer default 20)
returns jsonb language plpgsql security definer
set search_path=pg_catalog,pg_temp set lock_timeout='3s' as $$
declare actor uuid:=auth.uid();rows jsonb;
begin
 if actor is null then raise exception 'Authentication required'using errcode='28000';end if;
 if current_setting('transaction_isolation')<>'read committed'then raise exception 'Read committed transaction required'using errcode='25001';end if;
 if not exists(select 1 from pg_catalog.pg_roles where rolname=current_user and(rolsuper or rolbypassrls))then raise exception 'Trusted executor owner required'using errcode='42501';end if;
 if p_subject_id is null or p_topic_id is null or p_limit is null or p_limit not between 1 and 20 then raise exception 'Invalid metadata request'using errcode='22023';end if;
 select coalesce(jsonb_agg(to_jsonb(x.id)order by x.id),'[]'::jsonb)into rows from(
  select q.id from ace.questions q
  join ace.subjects s on s.id=q.subject_id and s.active
  join ace.topics t on t.id=q.topic_id and t.subject_id=q.subject_id and t.active
  join ace.syllabus_versions v on v.id=t.syllabus_version_id and v.subject_id=q.subject_id and v.status='active'and v.rights_status='approved'and v.activated_at is not null
  join ace.exam_seasons es on es.id=v.season_id and es.status='active'
  where q.subject_id=p_subject_id and q.topic_id=p_topic_id and q.active and q.review_status='published'and q.rights_status in('owned','licensed','permitted')
  and(q.subtopic_id is null or exists(select 1 from ace.subtopics st where st.id=q.subtopic_id and st.topic_id=t.id and st.syllabus_version_id=v.id and st.active))
  and(p_subtopic_id is null or q.subtopic_id=p_subtopic_id)
  order by q.id limit p_limit)x;
 return rows;
end;$$;
create function ace.student_question_topics(p_question_ids uuid[])
returns jsonb language plpgsql security definer
set search_path=pg_catalog,pg_temp set lock_timeout='3s' as $$
declare actor uuid:=auth.uid();rows jsonb;
begin
 if actor is null then raise exception 'Authentication required'using errcode='28000';end if;
 if current_setting('transaction_isolation')<>'read committed'then raise exception 'Read committed transaction required'using errcode='25001';end if;
 if not exists(select 1 from pg_catalog.pg_roles where rolname=current_user and(rolsuper or rolbypassrls))then raise exception 'Trusted executor owner required'using errcode='42501';end if;
 if p_question_ids is null or array_ndims(p_question_ids)is distinct from 1 or cardinality(p_question_ids)not between 1 and 80 or array_position(p_question_ids,null)is not null
 or(select count(distinct x)from unnest(p_question_ids)x)<>cardinality(p_question_ids)then raise exception 'Invalid metadata request'using errcode='22023';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',q.id,'subject_id',q.subject_id,'topic_id',q.topic_id,'subtopic_id',q.subtopic_id)order by q.id),'[]'::jsonb)into rows
 from ace.questions q
 join ace.student_question_stats stats on stats.question_id=q.id and stats.user_id=actor
 join ace.subjects s on s.id=q.subject_id and s.active
 join ace.topics t on t.id=q.topic_id and t.subject_id=q.subject_id and t.active
 join ace.syllabus_versions v on v.id=t.syllabus_version_id and v.subject_id=q.subject_id and v.status='active'and v.rights_status='approved'and v.activated_at is not null
 join ace.exam_seasons es on es.id=v.season_id and es.status='active'
 where q.id=any(p_question_ids)and q.active and q.review_status='published'and q.rights_status in('owned','licensed','permitted')
 and(q.subtopic_id is null or exists(select 1 from ace.subtopics st where st.id=q.subtopic_id and st.topic_id=t.id and st.syllabus_version_id=v.id and st.active));
 return rows;
end;$$;
revoke all on function ace.published_topic_questions(uuid,uuid,uuid,integer),ace.student_question_topics(uuid[])from public,anon,authenticated;
grant execute on function ace.published_topic_questions(uuid,uuid,uuid,integer),ace.student_question_topics(uuid[])to authenticated;
commit;

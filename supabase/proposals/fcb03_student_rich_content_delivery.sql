-- SOURCE-ONLY proposal: return the exact rich document captured for this
-- attempt's immutable question version. No Storage URL or answer key is exposed.
-- Requires rich_content column and ace.validate_rich_question_content().
begin;
create or replace function ace.get_attempt_questions(p_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=pg_catalog,ace,pg_temp
set lock_timeout='3s'
as $$
declare
 v_user uuid:=auth.uid();
 v_order jsonb;
 v_snapshot jsonb;
 v_questions jsonb;
 v_count integer;
begin
 if v_user is null then raise exception 'Authentication required' using errcode='28000';end if;
 if p_attempt_id is null then raise exception 'Attempt required' using errcode='22023';end if;
 select a.question_order,a.question_snapshot into v_order,v_snapshot from ace.attempts a
 where a.id=p_attempt_id and a.user_id=v_user and a.status='active'
  and a.duration_seconds>0 and a.started_at<=clock_timestamp()
  and a.started_at+a.duration_seconds*interval '1 second'>clock_timestamp();
 if not found then raise exception 'Attempt unavailable' using errcode='P0002';end if;
 if jsonb_typeof(v_order) is distinct from 'array' then
  raise exception 'Attempt unavailable' using errcode='P0002';
 end if;
 if jsonb_typeof(v_snapshot) is distinct from 'array' then
  raise exception 'Attempt unavailable' using errcode='P0002';
 end if;
 if jsonb_array_length(v_order) not between 1 and 500
  or jsonb_array_length(v_snapshot)<>jsonb_array_length(v_order) then
  raise exception 'Attempt unavailable' using errcode='P0002';
 end if;

 select jsonb_agg(jsonb_build_object(
  'id',q.id,'question_text',frozen->>'stem',
  -- Nested choices are explicitly allowlisted; the answer key and explanation
  -- remain server-only even though the immutable history snapshot contains them.
  'options',(select coalesce(jsonb_agg(jsonb_build_object(
   'key',o.value->>'key','text',coalesce(o.value->>'text',o.value->>'label','')
  )order by o.ord),'[]'::jsonb)
   from jsonb_array_elements(frozen->'options') with ordinality o(value,ord)),
  'subject_id',frozen->'subject_id','topic_id',frozen->'topic_id',
  'difficulty',frozen->'difficulty','rich_content',validated.document
 )order by wanted.ord),count(distinct q.id)
 into v_questions,v_count
 from jsonb_array_elements_text(v_order) with ordinality wanted(id,ord)
 join jsonb_array_elements(v_snapshot) frozen on frozen->>'id'=wanted.id
 join ace.questions q on q.id=wanted.id::uuid
 left join ace.question_versions version_row
  on version_row.question_id=q.id
  and version_row.version=case
   when coalesce(frozen->>'content_version','')~'^[1-9][0-9]{0,8}$'
   then(frozen->>'content_version')::integer else null end
  and version_row.snapshot->>'id'=q.id::text
  and version_row.snapshot->>'content_version'=frozen->>'content_version'
  and version_row.snapshot->>'stem'=frozen->>'stem'
  and version_row.snapshot->'options'=frozen->'options'
  and version_row.snapshot->>'review_status'='published'
  and version_row.snapshot->>'active'='true'
  and coalesce(version_row.snapshot->>'rights_status','') in('owned','licensed','permitted')
 left join lateral(
  select ace.validate_rich_question_content(version_row.snapshot->'rich_content') as document
  where jsonb_typeof(version_row.snapshot->'rich_content')='object'
 ) validated on true
 where q.active=true and q.review_status='published'
  and q.rights_status in('owned','licensed','permitted')
  -- Malformed historical content is not silently downgraded to text-only delivery.
  and coalesce(jsonb_typeof(version_row.snapshot->'rich_content'),'null') in('null','object')
  -- If the current question is rich but the frozen version cannot be recovered,
  -- fail the entire paper closed instead of silently dropping its diagram.
  and(q.rich_content is null or version_row.id is not null);

 if coalesce(v_count,0)<>jsonb_array_length(v_order) then
  raise exception 'Attempt questions unavailable' using errcode='P0002';
 end if;
 return v_questions;
end;
$$;
revoke all on function ace.get_attempt_questions(uuid) from public,anon,authenticated;
grant execute on function ace.get_attempt_questions(uuid) to authenticated;
commit;

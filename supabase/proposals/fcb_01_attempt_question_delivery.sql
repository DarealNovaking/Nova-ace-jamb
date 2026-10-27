-- Review proposal only. NOT applied; not part of an automatic migration push.
-- Requires the private snapshot column in fcb_01_cbt_mutation_contract.sql.
-- Current rights/publication still govern access to captured paper versions.
begin;
create or replace function ace.get_attempt_questions(p_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, ace
as $$
declare
 v_user uuid := auth.uid();
 v_order jsonb;
 v_snapshot jsonb;
 v_questions jsonb;
 v_count integer;
begin
 if v_user is null then raise exception 'Authentication required' using errcode='28000'; end if;
 if p_attempt_id is null then raise exception 'Attempt required' using errcode='22023'; end if;
 -- No administrator/editor override: this endpoint is always an owner operation.
 select a.question_order,a.question_snapshot into v_order,v_snapshot from ace.attempts a
 where a.id=p_attempt_id and a.user_id=v_user
   and a.status='active'
   and a.duration_seconds>0
   and a.started_at<=clock_timestamp()
   and a.started_at + a.duration_seconds * interval '1 second'>clock_timestamp();
 if not found or jsonb_typeof(v_order) is distinct from 'array' then
  raise exception 'Attempt unavailable' using errcode='P0002';
 end if;
 if jsonb_array_length(v_order) not between 1 and 500
    or jsonb_typeof(v_snapshot) is distinct from 'array'
    or jsonb_array_length(v_snapshot)<>jsonb_array_length(v_order) then
  raise exception 'Attempt unavailable' using errcode='P0002';
 end if;
 select jsonb_agg(jsonb_build_object(
   'id',q.id,'question_text',frozen->>'stem',
   -- Whitelist nested option fields too: stored options may carry review metadata.
   'options',(select coalesce(jsonb_agg(jsonb_build_object(
     'key',o.value->>'key','text',coalesce(o.value->>'text',o.value->>'label','')
   ) order by o.ord),'[]'::jsonb)
     from jsonb_array_elements(frozen->'options') with ordinality o(value,ord)),
   'subject_id',frozen->'subject_id','topic_id',frozen->'topic_id','difficulty',frozen->'difficulty'
 ) order by wanted.ord),count(distinct q.id)
 into v_questions,v_count
 from jsonb_array_elements_text(v_order) with ordinality wanted(id,ord)
 join jsonb_array_elements(v_snapshot) frozen on frozen->>'id'=wanted.id
 join ace.questions q on q.id=wanted.id::uuid
 where q.active=true and q.review_status='published'
   and q.rights_status in ('owned','licensed','permitted');
 -- Withdrawal, missing rows or duplicate IDs invalidate the whole delivery.
 if v_count<>jsonb_array_length(v_order) then
  raise exception 'Attempt questions unavailable' using errcode='P0002';
 end if;
 return v_questions;
end;
$$;
revoke all on function ace.get_attempt_questions(uuid) from public,anon,authenticated;
grant execute on function ace.get_attempt_questions(uuid) to authenticated;
commit;

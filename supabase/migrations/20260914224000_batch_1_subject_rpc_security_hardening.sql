create or replace function ace.set_student_subjects(p_subject_ids uuid[])
returns setof ace.student_subjects
language plpgsql
security definer
set search_path = pg_catalog, ace, auth
as $$
declare
  uid uuid := auth.uid();
  unique_ids uuid[];
  subject_count integer;
begin
  if uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select coalesce(array_agg(x order by x), '{}'::uuid[]) into unique_ids
  from (select distinct unnest(coalesce(p_subject_ids, '{}'::uuid[])) x) s;

  subject_count := coalesce(array_length(unique_ids, 1), 0);
  if subject_count < 1 or subject_count > 4 then
    raise exception 'Select between 1 and 4 subjects.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from unnest(unique_ids) x
    left join ace.subjects s on s.id = x
    where s.id is null or not s.active
  ) then
    raise exception 'One or more selected subjects are invalid.' using errcode = '22023';
  end if;

  delete from ace.student_subjects where user_id = uid;

  return query
    insert into ace.student_subjects(user_id, subject_id, is_primary, sort_order)
    select uid, x, ord = 1, ord - 1
    from unnest(unique_ids) with ordinality u(x, ord)
    returning *;
end;
$$;

revoke all on function ace.set_student_subjects(uuid[]) from public, anon;
grant execute on function ace.set_student_subjects(uuid[]) to authenticated;

begin;

drop policy if exists profiles_self_insert on ace.profiles;
drop policy if exists profiles_self_select on ace.profiles;
drop policy if exists profiles_self_update on ace.profiles;
create policy profiles_self_select on ace.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_self_update on ace.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists roles_admin_manage on ace.roles;
drop policy if exists roles_admin_select on ace.roles;
create policy roles_self_select on ace.roles for select to authenticated using (user_id = (select auth.uid()));

revoke execute on function ace.is_admin() from anon, public;
revoke execute on function ace.is_admin_or_editor() from anon, public;
grant execute on function ace.is_admin() to authenticated;
grant execute on function ace.is_admin_or_editor() to authenticated;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_target_score_range') then
    alter table ace.profiles add constraint profiles_target_score_range check (target_score is null or (target_score between 0 and 400));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_prep_time_positive') then
    alter table ace.profiles add constraint profiles_prep_time_positive check (prep_time_minutes is null or prep_time_minutes > 0);
  end if;
end $$;

create or replace function ace.set_student_subjects(p_subject_ids uuid[])
returns setof ace.student_subjects
language plpgsql
security invoker
set search_path = ace, public
as $$
declare
  uid uuid := auth.uid();
  unique_ids uuid[];
  subject_count integer;
begin
  if uid is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  select coalesce(array_agg(x order by x), '{}'::uuid[]) into unique_ids
  from (select distinct unnest(coalesce(p_subject_ids, '{}'::uuid[])) x) s;
  subject_count := coalesce(array_length(unique_ids, 1), 0);
  if subject_count < 1 or subject_count > 4 then raise exception 'Select between 1 and 4 subjects.' using errcode = '22023'; end if;
  if exists (select 1 from unnest(unique_ids) x left join ace.subjects s on s.id=x where s.id is null or not s.active) then
    raise exception 'One or more selected subjects are invalid.' using errcode = '22023';
  end if;
  delete from ace.student_subjects where user_id = uid;
  return query
    insert into ace.student_subjects(user_id, subject_id, is_primary, sort_order)
    select uid, x, ord = 1, ord - 1 from unnest(unique_ids) with ordinality u(x, ord)
    returning *;
end;
$$;
revoke all on function ace.set_student_subjects(uuid[]) from public, anon;
grant execute on function ace.set_student_subjects(uuid[]) to authenticated;

commit;

create or replace function ace.can_manage_catalog()
returns boolean
language sql
stable
security definer
set search_path = ace, public
as $$
  select exists (
    select 1
    from ace.roles
    where user_id = auth.uid()
      and role in ('admin', 'editor')
  );
$$;

revoke all on function ace.can_manage_catalog() from public;
grant execute on function ace.can_manage_catalog() to authenticated;

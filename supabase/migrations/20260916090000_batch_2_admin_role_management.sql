create or replace function ace.set_user_role(target_user_id uuid, target_role text)
returns ace.roles
language plpgsql
security definer
set search_path = ace, public
as $$
declare
  current_role text;
  target_exists boolean;
  updated_role ace.roles;
  admin_count bigint;
begin
  if auth.uid() is null or not ace.is_admin() then
    raise exception 'admin role required';
  end if;

  if target_role not in ('student','editor','admin') then
    raise exception 'invalid role';
  end if;

  select exists(select 1 from auth.users where id = target_user_id) into target_exists;
  if not target_exists then
    raise exception 'target user does not exist';
  end if;

  select role into current_role from ace.roles where user_id = target_user_id;

  if current_role = 'admin' and target_role <> 'admin' then
    select count(*) into admin_count from ace.roles where role = 'admin';
    if admin_count <= 1 then
      raise exception 'cannot remove the last admin';
    end if;
  end if;

  insert into ace.roles(user_id, role)
  values (target_user_id, target_role)
  on conflict (user_id) do update set role = excluded.role
  returning * into updated_role;

  insert into ace.audit_events(actor_user_id,event_type,entity_type,entity_id,metadata,user_id)
  values (auth.uid(),'role_changed','user_role',target_user_id,
          jsonb_build_object('previous_role',current_role,'new_role',target_role),target_user_id);

  return updated_role;
end;
$$;

revoke all on function ace.set_user_role(uuid,text) from public, anon;
grant execute on function ace.set_user_role(uuid,text) to authenticated;

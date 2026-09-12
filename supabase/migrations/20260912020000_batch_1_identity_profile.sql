create or replace function ace.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, ace
as $$
begin
  insert into ace.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'))
  on conflict (id) do update set email = excluded.email, updated_at = now();

  insert into ace.roles (user_id, role) values (new.id, 'student') on conflict (user_id) do nothing;
  insert into ace.student_preferences (user_id, timezone)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'timezone', 'Africa/Lagos'))
  on conflict (user_id) do nothing;
  insert into ace.notification_preferences (user_id) values (new.id) on conflict (user_id) do nothing;
  insert into ace.referral_codes (user_id, code)
  values (new.id, 'ACE-' || upper(substr(replace(new.id::text, '-', ''), 1, 8)))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function ace.handle_new_user() from public;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function ace.handle_new_user();

create or replace function ace.touch_profile_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists profiles_touch_updated_at on ace.profiles;
create trigger profiles_touch_updated_at before update on ace.profiles for each row execute function ace.touch_profile_updated_at();

create or replace function ace.touch_preferences_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists student_preferences_touch_updated_at on ace.student_preferences;
create trigger student_preferences_touch_updated_at before update on ace.student_preferences for each row execute function ace.touch_preferences_updated_at();

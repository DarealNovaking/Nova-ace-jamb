-- Metadata rollback only, incident review required. Restores the known short-code collision defect.
-- Original function SHA256: 7ca9fd70304ee8f1fb6496c68ec0279fbb92a28b5d28a3591f0afc91562b7be9
-- Does not revert the three previously applied security migrations or change existing rows.
begin;
CREATE OR REPLACE FUNCTION ace.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'ace'
AS $function$
begin
  insert into ace.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  insert into ace.roles (user_id, role)
  values (new.id, 'student')
  on conflict (user_id) do nothing;

  insert into ace.student_preferences (user_id, timezone)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'timezone', 'Africa/Lagos'))
  on conflict (user_id) do nothing;

  insert into ace.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into ace.referral_codes (user_id, code)
  values (new.id, 'ACE-' || upper(substr(replace(new.id::text, '-', ''), 1, 8)))
  on conflict (user_id) do nothing;

  return new;
end;
$function$;
revoke all on function ace.handle_new_user() from public,anon,authenticated;
commit;

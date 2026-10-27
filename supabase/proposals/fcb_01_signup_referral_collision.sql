-- Source review proposal only; NOT applied to production.
begin;
CREATE OR REPLACE FUNCTION ace.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'ace'
AS $function$
declare v_try integer; v_code text;
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

  -- Keep existing short codes when available; handle prefix and legacy collisions.
  for v_try in 0..5 loop
    v_code := case v_try
      when 0 then 'ACE-' || upper(substr(replace(new.id::text, '-', ''), 1, 8))
      when 1 then 'ACE-' || upper(replace(new.id::text, '-', ''))
      else 'ACE-' || upper(replace(gen_random_uuid()::text, '-', ''))
    end;
    insert into ace.referral_codes(user_id,code) values(new.id,v_code)
    on conflict do nothing;
    if exists(select 1 from ace.referral_codes where user_id=new.id) then
      return new;
    end if;
  end loop;
  raise exception 'Referral code allocation unavailable' using errcode='40001';

end;
$function$;
revoke all on function ace.handle_new_user() from public,anon,authenticated;
commit;

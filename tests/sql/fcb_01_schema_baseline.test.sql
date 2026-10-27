-- Empty disposable database ONLY. Existing ace schema must cause a failure.
-- This fixture deliberately does not DROP any schema or replace Supabase auth.
create schema auth;
create schema extensions;
create extension vector with schema extensions;
create role anon;
create role authenticated;
create role service_role;
create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb);
create function auth.uid() returns uuid language sql stable as $$
 select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
create function auth.jwt() returns jsonb language sql stable as $$
 select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb
$$;
grant usage on schema auth to anon,authenticated;
\i supabase/schema/ace-2026-10-27.sql

-- Ensure the replay is empty, preserving fail-closed API grants and deployed guards.
do $$ declare t record; n bigint; begin
 if (select count(*) from pg_tables where schemaname='ace') <> 48 then
  raise exception 'expected 48 tables';
 end if;
 for t in select tablename from pg_tables where schemaname='ace' loop
  execute format('select count(*) from ace.%I',t.tablename) into n;
  if n <> 0 then raise exception 'unexpected baseline rows in %',t.tablename; end if;
 end loop;
 if exists(select 1 from pg_class where relnamespace='ace'::regnamespace and relkind='r' and not relrowsecurity) then
  raise exception 'RLS missing';
 end if;
 if has_table_privilege('authenticated','ace.attempts','UPDATE') or
    has_table_privilege('authenticated','ace.attempt_answers','UPDATE') or
    has_function_privilege('anon','ace.has_active_entitlement(uuid,text)','EXECUTE') or
    has_function_privilege('authenticated','ace.guard_syllabus_authoring()','EXECUTE') then
  raise exception 'fail-closed privileges changed';
 end if;
 if (select count(*) from pg_policies where schemaname='ace') <> 82 then
  raise exception 'policy count differs';
 end if;
end $$;

begin;
-- Exercise actual auth trigger; the supplied metadata must not confer an admin role.
insert into auth.users values ('01000000-0000-4000-8000-000000000001','synthetic@example.invalid','{"display_name":"Synthetic baseline","role":"admin"}');
do $$ begin
 if not exists(select 1 from ace.profiles where id='01000000-0000-4000-8000-000000000001') then
  raise exception 'profile trigger missing';
 end if;
 if not exists(select 1 from ace.roles where user_id='01000000-0000-4000-8000-000000000001' and role='student') then
  raise exception 'metadata incorrectly conferred role';
 end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','01000000-0000-4000-8000-000000000001',true);
do $$ begin
 if ace.is_admin() or ace.is_admin_or_editor() then raise exception 'synthetic student elevated'; end if;
 if ace.has_active_entitlement('01000000-0000-4000-8000-000000000002') then raise exception 'cross-owner probe'; end if;
end $$;
rollback;
select 'FCB-01 full schema baseline and auth-trigger tests passed' result;

-- Disposable schema only. Never run this fixture against a live Supabase project.
drop schema if exists ace cascade;
drop schema if exists auth cascade;
create schema ace;
create schema auth;
do $$ begin create role anon; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated; exception when duplicate_object then null; end $$;
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
grant usage on schema auth,ace to anon,authenticated;
create table ace.roles (user_id uuid primary key, role text not null);
insert into ace.roles values
 ('10000000-0000-4000-8000-000000000001','student'),
 ('10000000-0000-4000-8000-000000000002','editor'),
 ('10000000-0000-4000-8000-000000000003','admin');
create function ace.is_admin() returns boolean language sql stable security definer
set search_path=pg_catalog,ace as $$ select exists(select 1 from ace.roles where user_id=auth.uid() and role='admin') $$;
create function ace.is_admin_or_editor() returns boolean language sql stable security definer
set search_path=pg_catalog,ace as $$ select exists(select 1 from ace.roles where user_id=auth.uid() and role in ('admin','editor')) $$;
create table ace.syllabus_versions (
 id uuid primary key, season_id uuid not null, subject_id uuid not null,
 version integer not null default 1, title text not null,
 source_url text, source_title text, rights_status text not null default 'pending',
 provenance jsonb not null default '{}', status text not null default 'draft',
 activated_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table ace.topics (id uuid primary key,subject_id uuid not null,syllabus_version_id uuid references ace.syllabus_versions(id),name text not null,active boolean not null default false);
create table ace.subtopics (id uuid primary key,topic_id uuid references ace.topics(id),syllabus_version_id uuid references ace.syllabus_versions(id),name text not null,active boolean not null default false);
create table ace.audit_events (actor_user_id uuid,event_type text,entity_type text,entity_id uuid,metadata jsonb);
alter table ace.syllabus_versions enable row level security;
alter table ace.topics enable row level security;
alter table ace.subtopics enable row level security;
create policy syllabus_versions_read_authenticated on ace.syllabus_versions for select to authenticated using (status='active' or ace.is_admin_or_editor());
create policy syllabus_versions_manage_editor on ace.syllabus_versions for all to authenticated using (ace.is_admin_or_editor()) with check (ace.is_admin_or_editor());
create policy topics_editor_manage on ace.topics for all to authenticated using (ace.is_admin_or_editor()) with check (ace.is_admin_or_editor());
create policy subtopics_editor_manage on ace.subtopics for all to authenticated using (ace.is_admin_or_editor()) with check (ace.is_admin_or_editor());
grant select,insert,update,delete on ace.syllabus_versions,ace.topics,ace.subtopics to authenticated;

-- Existing state is inserted before the remediation triggers are installed.
insert into ace.syllabus_versions(id,season_id,subject_id,title,status,rights_status) values
 ('20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','Pending draft','draft','pending'),
 ('20000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','Approved active','active','approved'),
 ('20000000-0000-4000-8000-000000000006','30000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','Reviewed draft','draft','approved');
insert into ace.topics values
 ('50000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Draft topic',false),
 ('50000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','Active topic',true);
insert into ace.subtopics values
 ('60000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Draft subtopic',false),
 ('60000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','Active subtopic',true);

\i supabase/migrations/20261027164455_fcb_01_syllabus_authorization.sql

-- Executes arbitrary fixture actions as the current non-owner role. A missing
-- permission must raise 42501; a zero-row RLS no-op is asserted separately below.
create function public.fcb_expect_forbidden(statement text) returns void language plpgsql as $$
begin
 begin execute statement;
 exception when insufficient_privilege then return;
 end;
 raise exception 'Expected forbidden action: %',statement;
end $$;
grant execute on function public.fcb_expect_forbidden(text) to authenticated;

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',false);
set role authenticated;
select public.fcb_expect_forbidden($q$update ace.syllabus_versions set rights_status='approved' where id='20000000-0000-4000-8000-000000000001'$q$);
select public.fcb_expect_forbidden($q$update ace.syllabus_versions set status='active' where id='20000000-0000-4000-8000-000000000001'$q$);
select public.fcb_expect_forbidden($q$update ace.syllabus_versions set activated_at=now() where id='20000000-0000-4000-8000-000000000001'$q$);
select public.fcb_expect_forbidden($q$update ace.syllabus_versions set source_url='https://unreviewed.invalid' where id='20000000-0000-4000-8000-000000000002'$q$);
select public.fcb_expect_forbidden($q$delete from ace.syllabus_versions where id='20000000-0000-4000-8000-000000000002'$q$);
select public.fcb_expect_forbidden($q$update ace.syllabus_versions set source_title='Changed after review' where id='20000000-0000-4000-8000-000000000006'$q$);
select public.fcb_expect_forbidden($q$update ace.syllabus_versions set subject_id='40000000-0000-4000-8000-000000000002' where id='20000000-0000-4000-8000-000000000001'$q$);
select public.fcb_expect_forbidden($q$insert into ace.syllabus_versions(id,season_id,subject_id,title,status,rights_status) values ('20000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','Forged approval','active','approved')$q$);
select public.fcb_expect_forbidden($q$update ace.topics set name='Unreviewed live topic' where id='50000000-0000-4000-8000-000000000002'$q$);
select public.fcb_expect_forbidden($q$update ace.subtopics set name='Unreviewed live subtopic' where id='60000000-0000-4000-8000-000000000002'$q$);
select public.fcb_expect_forbidden($q$update ace.topics set syllabus_version_id='20000000-0000-4000-8000-000000000002' where id='50000000-0000-4000-8000-000000000001'$q$);
select public.fcb_expect_forbidden($q$update ace.subtopics set topic_id='50000000-0000-4000-8000-000000000002' where id='60000000-0000-4000-8000-000000000001'$q$);
select public.fcb_expect_forbidden($q$insert into ace.topics(id,subject_id,syllabus_version_id,name) values ('50000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','Unreviewed active content')$q$);
select public.fcb_expect_forbidden($q$insert into ace.topics(id,subject_id,syllabus_version_id,name) values ('50000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','Wrong subject content')$q$);

-- Legitimate editor draft authoring remains possible, including review flags.
insert into ace.syllabus_versions(id,season_id,subject_id,title) values ('20000000-0000-4000-8000-000000000004','30000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','New pending draft');
update ace.syllabus_versions set title='Updated draft', source_title='Owner supplied source',source_url='https://example.com/source' where id='20000000-0000-4000-8000-000000000001';
update ace.topics set active=true where id='50000000-0000-4000-8000-000000000001';
update ace.subtopics set active=true where id='60000000-0000-4000-8000-000000000001';
reset role;

-- Also protect mutations inside an existing SECURITY DEFINER publication RPC.
create function ace.fcb_simulate_privileged_activation(id_to_activate uuid) returns void language sql security definer
set search_path=pg_catalog,ace as $$ update ace.syllabus_versions set status='active' where id=id_to_activate $$;
grant execute on function ace.fcb_simulate_privileged_activation(uuid) to authenticated;
set role authenticated;
select public.fcb_expect_forbidden($q$select ace.fcb_simulate_privileged_activation('20000000-0000-4000-8000-000000000001')$q$);
reset role;

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',false);
set role authenticated;
update ace.syllabus_versions set rights_status='approved',status='active',activated_at=now() where id='20000000-0000-4000-8000-000000000001';
insert into ace.syllabus_versions(id,season_id,subject_id,title,status,rights_status)
values('20000000-0000-4000-8000-000000000007','30000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','Admin approved insert','active','approved');
reset role;
do $$ begin
 if not exists(select 1 from ace.audit_events where actor_user_id='10000000-0000-4000-8000-000000000003' and entity_id='20000000-0000-4000-8000-000000000001' and event_type='syllabus_authorization_changed') then raise exception 'Admin publication/rights change must be audited'; end if;
 if not exists(select 1 from ace.audit_events where actor_user_id='10000000-0000-4000-8000-000000000003' and entity_id='20000000-0000-4000-8000-000000000007' and event_type='syllabus_version_created') then raise exception 'Admin approved insert must be audited'; end if;
end $$;

-- An editor cannot alter a draft once its rights have been approved.
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',false);
set role authenticated;
select public.fcb_expect_forbidden($q$update ace.syllabus_versions set title='Unreviewed revision' where id='20000000-0000-4000-8000-000000000001'$q$);
reset role;

-- Student and anonymous roles cannot author through this migration.
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',false);
set role authenticated;
do $$ declare changed integer; begin
 update ace.syllabus_versions set rights_status='approved' where id='20000000-0000-4000-8000-000000000004';
 get diagnostics changed=row_count;
 if changed<>0 then raise exception 'Student modified syllabus'; end if;
end $$;
select public.fcb_expect_forbidden($q$insert into ace.syllabus_versions(id,season_id,subject_id,title) values ('20000000-0000-4000-8000-000000000005','30000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','Forbidden student draft')$q$);
reset role;
set role anon;
do $$ begin
 begin perform 1 from ace.syllabus_versions;
 exception when insufficient_privilege then return;
 end;
 raise exception 'Anonymous syllabus table access should remain denied';
end $$;
reset role;
drop function public.fcb_expect_forbidden(text);
select 'FCB-01 syllabus authorization tests passed' as result;

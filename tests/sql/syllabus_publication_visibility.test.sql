-- Disposable PostgreSQL regression tests for syllabus publication visibility.
-- This script owns only its disposable CI schemas.
drop schema if exists ace cascade;
drop schema if exists auth cascade;
create schema ace;
create schema auth;

do $roles$
begin
  create role anon;
exception when duplicate_object then null;
end
$roles$;
do $roles$
begin
  create role authenticated;
exception when duplicate_object then null;
end
$roles$;

create function ace.is_admin_or_editor()
returns boolean language sql stable
as $fn$ select coalesce(current_setting('test.is_editor', true), 'false') = 'true' $fn$;

create table ace.syllabus_versions (
  id uuid primary key,
  status text not null,
  rights_status text not null
);
create or replace function ace.is_syllabus_version_public(p_syllabus_version_id uuid)
returns boolean language sql stable security definer set search_path = pg_catalog, ace
as $fn$ select exists (select 1 from ace.syllabus_versions sv where sv.id = p_syllabus_version_id and sv.status = 'active' and sv.rights_status = 'approved') $fn$;

create table ace.topics (
  id uuid primary key,
  syllabus_version_id uuid references ace.syllabus_versions(id),
  active boolean not null
);
create table ace.subtopics (
  id uuid primary key,
  topic_id uuid not null references ace.topics(id),
  syllabus_version_id uuid references ace.syllabus_versions(id),
  active boolean not null
);

alter table ace.syllabus_versions enable row level security;
create policy syllabus_versions_read_authenticated
on ace.syllabus_versions for select to public
using (status = 'active' or ace.is_admin_or_editor());
alter table ace.topics enable row level security;
alter table ace.subtopics enable row level security;

grant usage on schema ace to anon, authenticated;
grant select on ace.syllabus_versions, ace.topics, ace.subtopics to anon, authenticated;
grant execute on function ace.is_admin_or_editor() to anon, authenticated;
grant execute on function ace.is_syllabus_version_public(uuid) to anon, authenticated;

insert into ace.syllabus_versions(id,status,rights_status) values
 ('10000000-0000-4000-8000-000000000001','active','approved'),
 ('10000000-0000-4000-8000-000000000002','draft','approved'),
 ('10000000-0000-4000-8000-000000000003','active','pending');

insert into ace.topics(id,syllabus_version_id,active) values
 ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',true),
 ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002',true),
 ('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000003',true),
 ('20000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000001',false);

insert into ace.subtopics(id,topic_id,syllabus_version_id,active) values
 ('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',true),
 ('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002',true),
 ('30000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002',true),
 ('30000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000001',true);

\i supabase/migrations/20261020120000_syllabus_publication_visibility.sql
\i supabase/migrations/20261020230000_academic_topic_editor_api_privileges.sql

set role anon;
do $assert$
declare v_topics integer; v_subtopics integer;
begin
  select count(*) into v_topics from ace.topics;
  if v_topics <> 1 then raise exception 'anon should see only one active topic under an active rights-approved version; got %',v_topics; end if;
  select count(*) into v_subtopics from ace.subtopics;
  if v_subtopics <> 1 then raise exception 'anon should see only one subtopic whose parent topic and version are published; got %',v_subtopics; end if;
end
$assert$;
reset role;

select set_config('test.is_editor','true',false);
set role authenticated;
do $assert$
declare v_topics integer; v_subtopics integer;
begin
  select count(*) into v_topics from ace.topics;
  if v_topics <> 4 then raise exception 'editor should be able to review all draft and active topics; got %',v_topics; end if;
  select count(*) into v_subtopics from ace.subtopics;
  if v_subtopics <> 4 then raise exception 'editor should be able to review all subtopics; got %',v_subtopics; end if;
end
$assert$;
reset role;

select 'syllabus publication visibility tests passed' as result;

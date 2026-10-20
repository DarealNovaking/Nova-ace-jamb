-- Keep public syllabus reads behind the version-level publication and rights boundary.
-- Editors/admins retain access to drafts for review and authoring.
-- SECURITY DEFINER is intentionally limited to a boolean visibility check; the fixed
-- search_path and qualified objects prevent caller-controlled name resolution.
create or replace function ace.is_syllabus_version_public(p_syllabus_version_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, ace
as $$
  select exists (
    select 1
    from ace.syllabus_versions sv
    where sv.id = p_syllabus_version_id
      and sv.status = 'active'
      and sv.rights_status = 'approved'
  );
$$;

revoke all on function ace.is_syllabus_version_public(uuid) from public;
grant execute on function ace.is_syllabus_version_public(uuid) to anon, authenticated;

alter table ace.topics enable row level security;
alter table ace.subtopics enable row level security;

drop policy if exists topics_public_read on ace.topics;
create policy topics_public_read
on ace.topics
for select
to public
using (
  (
    active = true
    and ace.is_syllabus_version_public(syllabus_version_id)
  )
  or ace.is_admin_or_editor()
);

drop policy if exists subtopics_public_read on ace.subtopics;
create policy subtopics_public_read
on ace.subtopics
for select
to public
using (
  (
    active = true
    and ace.is_syllabus_version_public(syllabus_version_id)
    and exists (
      select 1
      from ace.topics t
      where t.id = subtopics.topic_id
        and t.syllabus_version_id = subtopics.syllabus_version_id
        and t.active = true
    )
  )
  or ace.is_admin_or_editor()
);

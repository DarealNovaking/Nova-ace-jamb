-- Keep public syllabus reads behind the version-level publication and rights boundary.
-- Editors/admins retain access to drafts for review and authoring.
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
    and exists (
      select 1
      from ace.syllabus_versions sv
      where sv.id = topics.syllabus_version_id
        and sv.status = 'active'
        and sv.rights_status = 'approved'
    )
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
    and exists (
      select 1
      from ace.syllabus_versions sv
      join ace.topics t
        on t.id = subtopics.topic_id
       and t.syllabus_version_id = sv.id
      where sv.id = subtopics.syllabus_version_id
        and sv.status = 'active'
        and sv.rights_status = 'approved'
        and t.active = true
    )
  )
  or ace.is_admin_or_editor()
);

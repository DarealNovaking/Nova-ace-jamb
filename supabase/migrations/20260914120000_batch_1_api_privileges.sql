-- Batch 1: expose only the student-facing ACE tables/functions needed by the web client.
-- RLS remains the row-level security boundary; these grants only permit the
-- authenticated role to reach its own protected rows through the Data API.

grant usage on schema ace to authenticated;

grant select, update on table ace.profiles to authenticated;
grant select, update on table ace.student_preferences to authenticated;
grant select on table ace.student_subjects to authenticated;
grant select, insert, update on table ace.devices to authenticated;

grant execute on function ace.set_student_subjects(uuid[]) to authenticated;

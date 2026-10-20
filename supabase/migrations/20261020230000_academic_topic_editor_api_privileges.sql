-- The academic workspace uses the authenticated Supabase Data API.
-- These object privileges only make the tables reachable; RLS remains the
-- authorization boundary: editor/admin policies permit writes, while regular
-- authenticated students can only read rows allowed by publication policies.
grant select, insert, update on table ace.topics to authenticated;
grant select, insert, update on table ace.subtopics to authenticated;

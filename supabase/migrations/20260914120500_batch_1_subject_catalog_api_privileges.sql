-- Batch 1: authenticated students must be able to read the active subject catalog
-- used by onboarding. RLS on ace.subjects remains the row-level boundary.
grant select on table ace.subjects to authenticated;

-- Incident-only schema rollback. NEVER delete valid versioned topics to force it.
-- This deliberately restores the old cross-version name restriction.
begin;
do $$ begin
 if exists(select 1 from ace.topics group by subject_id,name having count(*)>1) then
  raise exception 'Rollback blocked by versioned topic names; no rows may be deleted automatically' using errcode='23514';
 end if;
end $$;
alter table ace.subtopics drop constraint if exists subtopics_parent_version_fkey;
alter table ace.topics drop constraint if exists topics_version_subject_fkey;
alter table ace.topics drop constraint if exists topics_version_name_key;
alter table ace.topics drop constraint if exists topics_id_version_key;
alter table ace.syllabus_versions drop constraint if exists syllabus_versions_id_subject_key;
drop index if exists ace.topics_legacy_subject_name_idx;
do $$ begin
 if not exists(select 1 from pg_constraint where conrelid='ace.topics'::regclass and conname='topics_subject_id_name_key') then
  alter table ace.topics add constraint topics_subject_id_name_key unique(subject_id,name);
 end if;
end $$;
commit;

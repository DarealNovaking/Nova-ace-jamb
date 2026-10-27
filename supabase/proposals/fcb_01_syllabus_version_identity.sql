-- Source review proposal only; NOT applied to production.
-- Preserve legacy null-version uniqueness while allowing distinct seasonal versions.
-- Existing rows are retained; mismatched taxonomy data must fail validation before release.
begin;
alter table ace.topics drop constraint if exists topics_subject_id_name_key;
do $$ begin
 if not exists(select 1 from pg_constraint where conrelid='ace.syllabus_versions'::regclass and conname='syllabus_versions_id_subject_key') then
  alter table ace.syllabus_versions add constraint syllabus_versions_id_subject_key unique(id,subject_id);
 end if;
 if not exists(select 1 from pg_constraint where conrelid='ace.topics'::regclass and conname='topics_version_name_key') then
  alter table ace.topics add constraint topics_version_name_key unique(syllabus_version_id,name);
 end if;
 if not exists(select 1 from pg_constraint where conrelid='ace.topics'::regclass and conname='topics_id_version_key') then
  alter table ace.topics add constraint topics_id_version_key unique(id,syllabus_version_id);
 end if;
 if not exists(select 1 from pg_constraint where conrelid='ace.topics'::regclass and conname='topics_version_subject_fkey') then
  alter table ace.topics add constraint topics_version_subject_fkey foreign key(syllabus_version_id,subject_id) references ace.syllabus_versions(id,subject_id) on delete restrict;
 end if;
 if not exists(select 1 from pg_constraint where conrelid='ace.subtopics'::regclass and conname='subtopics_parent_version_fkey') then
  alter table ace.subtopics add constraint subtopics_parent_version_fkey foreign key(topic_id,syllabus_version_id) references ace.topics(id,syllabus_version_id) on delete cascade;
 end if;
end $$;
create unique index if not exists topics_legacy_subject_name_idx on ace.topics(subject_id,name) where syllabus_version_id is null;
commit;

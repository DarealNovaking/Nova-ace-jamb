create index if not exists idx_catalog_import_batches_source_id
  on ace.catalog_import_batches(source_id);

create index if not exists idx_program_utme_rules_program_id
  on ace.program_utme_rules(program_id);

create index if not exists idx_syllabus_versions_subject_id
  on ace.syllabus_versions(subject_id);

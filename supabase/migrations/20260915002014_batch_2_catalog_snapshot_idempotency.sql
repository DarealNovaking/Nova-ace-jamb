alter table ace.catalog_import_batches
  add column if not exists snapshot_hash text;

create unique index if not exists uq_catalog_import_batches_snapshot_hash
  on ace.catalog_import_batches(snapshot_hash)
  where snapshot_hash is not null;

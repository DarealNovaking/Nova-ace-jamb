create or replace function ace.check_catalog_import_idempotency(p_snapshot_hash text)
returns table(id uuid, status text, row_count integer)
language sql
stable
security definer
set search_path = ace, public
as $$
  select b.id, b.status, b.row_count
  from ace.catalog_import_batches b
  where b.snapshot_hash = p_snapshot_hash
  limit 1;
$$;

revoke all on function ace.check_catalog_import_idempotency(text) from public;
grant execute on function ace.check_catalog_import_idempotency(text) to authenticated;

create or replace function ace.approve_catalog_batch(p_batch_id uuid)
returns ace.catalog_import_batches
language plpgsql
security definer
set search_path = ace, public
as $$
declare
  batch_row ace.catalog_import_batches;
  invalid_count bigint;
  approved_batch ace.catalog_import_batches;
begin
  if auth.uid() is null or not ace.is_admin() then
    raise exception 'admin role required';
  end if;

  select * into batch_row
  from ace.catalog_import_batches
  where id = p_batch_id
  for update;

  if not found then
    raise exception 'catalog import batch not found';
  end if;

  if batch_row.status <> 'reviewing' then
    raise exception 'batch must be reviewing before approval (current: %)', batch_row.status;
  end if;

  select count(*) into invalid_count
  from ace.catalog_import_rows
  where batch_id = p_batch_id
    and validation_status <> 'valid';

  if invalid_count > 0 then
    raise exception 'cannot approve batch with % unvalidated or invalid rows', invalid_count;
  end if;

  update ace.catalog_import_rows
  set validation_status = 'approved', validation_errors = '[]'::jsonb
  where batch_id = p_batch_id;

  update ace.catalog_import_batches
  set status = 'approved', updated_at = now()
  where id = p_batch_id
  returning * into approved_batch;

  insert into ace.audit_events(actor_user_id,event_type,entity_type,entity_id,metadata)
  values (auth.uid(),'catalog_batch_approved','catalog_import_batch',p_batch_id,
          jsonb_build_object('row_count',approved_batch.row_count,'dataset_type',approved_batch.dataset_type,'source_id',approved_batch.source_id));

  return approved_batch;
end;
$$;
revoke all on function ace.approve_catalog_batch(uuid) from public, anon;
grant execute on function ace.approve_catalog_batch(uuid) to authenticated;

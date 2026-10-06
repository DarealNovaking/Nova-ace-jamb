create or replace function ace.stage_catalog_import(
  p_source_id uuid,
  p_season_id uuid,
  p_dataset_type text,
  p_snapshot_hash text,
  p_metadata jsonb,
  p_rows jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, ace, auth
as $$
declare
  v_user uuid := auth.uid();
  v_source ace.catalog_sources%rowtype;
  v_season_status text;
  v_existing ace.catalog_import_batches%rowtype;
  v_batch ace.catalog_import_batches%rowtype;
  v_row_count integer;
begin
  if v_user is null or not ace.can_manage_catalog() then
    raise exception 'Admin/editor access required';
  end if;

  if p_source_id is null or p_dataset_type is null or p_snapshot_hash is null then
    raise exception 'source_id, dataset_type and snapshot_hash are required';
  end if;

  if p_dataset_type not in ('institutions','programs','utme_rules','syllabus') then
    raise exception 'Invalid dataset_type';
  end if;

  if jsonb_typeof(p_rows) <> 'array' then
    raise exception 'rows must be a JSON array';
  end if;

  v_row_count := jsonb_array_length(p_rows);
  if v_row_count < 1 or v_row_count > 5000 then
    raise exception 'rows must contain 1-5000 items';
  end if;

  select * into v_source
  from ace.catalog_sources
  where id = p_source_id;

  if not found then
    raise exception 'Catalog source not found';
  end if;

  if v_source.status not in ('reviewed','approved') then
    raise exception 'Catalog source must be reviewed or approved before import';
  end if;

  if p_season_id is not null then
    select status into v_season_status
    from ace.exam_seasons
    where id = p_season_id;

    if v_season_status is null then
      raise exception 'Season not found';
    end if;

    if v_season_status = 'archived' then
      raise exception 'Cannot import into an archived season';
    end if;
  end if;

  select * into v_existing
  from ace.catalog_import_batches
  where snapshot_hash = p_snapshot_hash
  limit 1;

  if found then
    return jsonb_build_object(
      'batch_id', v_existing.id,
      'status', v_existing.status,
      'row_count', v_existing.row_count,
      'idempotent', true,
      'message', 'This exact catalog snapshot was already staged.'
    );
  end if;

  insert into ace.catalog_import_batches (
    source_id, season_id, dataset_type, status, row_count,
    snapshot_hash, metadata
  )
  values (
    p_source_id, p_season_id, p_dataset_type, 'staged', v_row_count,
    p_snapshot_hash,
    coalesce(p_metadata, '{}'::jsonb) ||
      jsonb_build_object(
        'source_title', v_source.title,
        'imported_by', v_user
      )
  )
  returning * into v_batch;

  insert into ace.catalog_import_rows (
    batch_id, row_number, entity_type, external_key, payload,
    validation_status, validation_errors
  )
  select
    v_batch.id,
    x.row_number,
    x.entity_type,
    x.external_key,
    x.payload,
    'pending',
    '[]'::jsonb
  from jsonb_to_recordset(p_rows) as x(
    row_number integer,
    entity_type text,
    external_key text,
    payload jsonb
  );

  return jsonb_build_object(
    'batch_id', v_batch.id,
    'status', 'staged',
    'row_count', v_row_count,
    'source', v_source.title,
    'imported_by', v_user,
    'snapshot_hash', p_snapshot_hash
  );
end;
$$;

revoke all on function ace.stage_catalog_import(uuid, uuid, text, text, jsonb, jsonb) from public, anon;
grant execute on function ace.stage_catalog_import(uuid, uuid, text, text, jsonb, jsonb) to authenticated;

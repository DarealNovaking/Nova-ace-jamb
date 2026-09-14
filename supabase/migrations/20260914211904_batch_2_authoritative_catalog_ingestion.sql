create table if not exists ace.catalog_sources (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('jamb','ibass','institution','other')),
  title text not null,
  source_url text not null,
  retrieved_at timestamptz not null default now(),
  content_hash text,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'discovered' check (status in ('discovered','reviewed','approved','superseded','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ace.catalog_import_batches (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references ace.catalog_sources(id) on delete restrict,
  season_id uuid references ace.exam_seasons(id) on delete restrict,
  dataset_type text not null check (dataset_type in ('institutions','programs','utme_rules','syllabus')),
  status text not null default 'staged' check (status in ('staged','reviewing','approved','published','rejected')),
  row_count integer not null default 0 check (row_count >= 0),
  validation_errors jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ace.catalog_import_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references ace.catalog_import_batches(id) on delete cascade,
  row_number integer not null check (row_number > 0),
  entity_type text not null check (entity_type in ('institution','program','program_utme_rule','syllabus_topic','syllabus_subtopic')),
  external_key text,
  payload jsonb not null,
  validation_status text not null default 'pending' check (validation_status in ('pending','valid','invalid','approved','rejected')),
  validation_errors jsonb not null default '[]'::jsonb,
  published_id uuid,
  created_at timestamptz not null default now(),
  unique (batch_id, row_number)
);

create index if not exists idx_catalog_batches_source_status on ace.catalog_import_batches(source_id,status);
create index if not exists idx_catalog_batches_season_type on ace.catalog_import_batches(season_id,dataset_type);
create index if not exists idx_catalog_rows_batch_status on ace.catalog_import_rows(batch_id,validation_status);
create index if not exists idx_catalog_rows_external_key on ace.catalog_import_rows(entity_type,external_key);

alter table ace.catalog_sources enable row level security;
alter table ace.catalog_import_batches enable row level security;
alter table ace.catalog_import_rows enable row level security;

create policy catalog_sources_read_editor on ace.catalog_sources for select to authenticated using (ace.is_admin_or_editor());
create policy catalog_sources_manage_editor on ace.catalog_sources for all to authenticated using (ace.is_admin_or_editor()) with check (ace.is_admin_or_editor());
create policy catalog_batches_read_editor on ace.catalog_import_batches for select to authenticated using (ace.is_admin_or_editor());
create policy catalog_batches_manage_editor on ace.catalog_import_batches for all to authenticated using (ace.is_admin_or_editor()) with check (ace.is_admin_or_editor());
create policy catalog_rows_read_editor on ace.catalog_import_rows for select to authenticated using (ace.is_admin_or_editor());
create policy catalog_rows_manage_editor on ace.catalog_import_rows for all to authenticated using (ace.is_admin_or_editor()) with check (ace.is_admin_or_editor());

revoke all on ace.catalog_sources, ace.catalog_import_batches, ace.catalog_import_rows from anon, public;
grant select, insert, update, delete on ace.catalog_sources, ace.catalog_import_batches, ace.catalog_import_rows to authenticated;

create or replace function ace.validate_catalog_batch(p_batch_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, ace, auth
as $$
declare
  v_user uuid := auth.uid();
  v_batch ace.catalog_import_batches%rowtype;
  v_errors jsonb := '[]'::jsonb;
  r record;
  v_count integer := 0;
begin
  if v_user is null or not ace.is_admin_or_editor() then raise exception 'Admin/editor access required'; end if;
  select * into v_batch from ace.catalog_import_batches where id=p_batch_id;
  if not found then raise exception 'Import batch not found'; end if;

  for r in select * from ace.catalog_import_rows where batch_id=p_batch_id order by row_number loop
    v_count := v_count + 1;
    if r.entity_type='institution' then
      if coalesce(length(trim(r.payload->>'name')),0)=0 then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Institution name is required')); end if;
      if r.payload->>'institution_type' not in ('university','polytechnic','college_of_education','other') then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Invalid institution type')); end if;
    elsif r.entity_type='program' then
      if coalesce(length(trim(r.payload->>'name')),0)=0 then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Program name is required')); end if;
      if coalesce(length(trim(r.payload->>'institution_external_key')),0)=0 then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Program institution_external_key is required')); end if;
    elsif r.entity_type='program_utme_rule' then
      if coalesce(length(trim(r.payload->>'program_external_key')),0)=0 then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Program external key is required')); end if;
      if jsonb_typeof(r.payload->'required_subject_codes') <> 'array' then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','required_subject_codes must be an array')); end if;
    elsif r.entity_type in ('syllabus_topic','syllabus_subtopic') then
      if coalesce(length(trim(r.payload->>'name')),0)=0 then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Syllabus name is required')); end if;
    end if;
  end loop;

  update ace.catalog_import_rows cr
  set validation_status = case when exists (select 1 from jsonb_array_elements(v_errors) e where (e->>'row')::int=cr.row_number) then 'invalid' else 'valid' end,
      validation_errors = coalesce((select jsonb_agg(e) from jsonb_array_elements(v_errors) e where (e->>'row')::int=cr.row_number),'[]'::jsonb)
  where cr.batch_id=p_batch_id;

  update ace.catalog_import_batches
  set row_count=v_count,
      validation_errors=v_errors,
      status='reviewing',
      updated_at=now()
  where id=p_batch_id;

  return jsonb_build_object('batch_id',p_batch_id,'row_count',v_count,'error_count',jsonb_array_length(v_errors),'errors',v_errors);
end;
$$;

revoke all on function ace.validate_catalog_batch(uuid) from public, anon;
grant execute on function ace.validate_catalog_batch(uuid) to authenticated;

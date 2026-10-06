create or replace function ace.get_catalog_source(p_source_id uuid)
returns table(id uuid, title text, status text, source_type text)
language sql
stable
security definer
set search_path = ace, public
as $$
  select s.id, s.title, s.status, s.source_type
  from ace.catalog_sources s
  where s.id = p_source_id;
$$;

revoke all on function ace.get_catalog_source(uuid) from public;
grant execute on function ace.get_catalog_source(uuid) to authenticated;

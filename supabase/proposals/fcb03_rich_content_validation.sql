-- SOURCE-ONLY FCB-03 v1 rich question document validator.
-- NOT a migration. Do not apply to production until paired, reviewed workflow,
-- immutable asset binding, rights, storage and student delivery are approved.
--
-- This private server-side function deliberately does not grant EXECUTE to
-- authenticated/anon. It is exercised only by disposable PostgreSQL CI tests.
begin;

create function ace.rich_content_text(p_value jsonb, p_max integer, p_min integer default 1)
returns text language plpgsql immutable
set search_path=pg_catalog,pg_temp as $$
declare result text; c integer;
begin
 if p_value is null or jsonb_typeof(p_value) <> 'string'
 or p_min < 0 or p_max < p_min then
  raise exception 'Invalid rich question text' using errcode='22023';
 end if;
 result := btrim(p_value #>> '{}',
   chr(9)||chr(10)||chr(11)||chr(12)||chr(13)||chr(32)||chr(160)||
   chr(5760)||chr(8192)||chr(8193)||chr(8194)||chr(8195)||
   chr(8196)||chr(8197)||chr(8198)||chr(8199)||chr(8200)||
   chr(8201)||chr(8202)||chr(8232)||chr(8233)||chr(8239)||
   chr(8287)||chr(12288)||chr(65279));
 if length(result) not between p_min and p_max
 or result is distinct from p_value #>> '{}' then
  raise exception 'Invalid rich question text' using errcode='22023';
 end if;
 for c in 1..31 loop
  if c not in(9,10,13) and strpos(result,chr(c)) > 0 then
   raise exception 'Invalid rich question control character' using errcode='22023';
  end if;
 end loop;
 if strpos(result,chr(127)) > 0 then
  raise exception 'Invalid rich question control character' using errcode='22023';
 end if;
 for c in 8234..8238 loop
  if strpos(result,chr(c)) > 0 then
   raise exception 'Invalid rich question direction control' using errcode='22023';
  end if;
 end loop;
 for c in 8294..8297 loop
  if strpos(result,chr(c)) > 0 then
   raise exception 'Invalid rich question direction control' using errcode='22023';
  end if;
 end loop;
 return result;
end;$$;

create function ace.validate_rich_question_content(p_document jsonb)
returns jsonb language plpgsql
set search_path=pg_catalog,pg_temp as $$
declare
 block jsonb; entry jsonb; row_item jsonb; value_item jsonb;
 fallback text := ''; projection text; header_line text; row_line text;
 kind text; item_count integer := 0; image_count integer := 0;
 table_count integer := 0; column_count integer;
 item_text text; caption_text text; alt_text text;
begin
 if p_document is null or jsonb_typeof(p_document) <> 'object'
 or octet_length(p_document::text) > 32768
 or (select count(*) from jsonb_object_keys(p_document)) <> 3
 or not (p_document ?& array['version','blocks','fallback_text'])
 or jsonb_typeof(p_document->'version') is distinct from 'number'
 or p_document->>'version' <> '1'
 or jsonb_typeof(p_document->'blocks') is distinct from 'array'
 or jsonb_typeof(p_document->'fallback_text') is distinct from 'string' then
  raise exception 'Invalid rich question document' using errcode='22023';
 end if;
 if jsonb_array_length(p_document->'blocks') not between 1 and 24 then
  raise exception 'Invalid rich question blocks' using errcode='22023';
 end if;
 for block in select value from jsonb_array_elements(p_document->'blocks') loop
  if jsonb_typeof(block) is distinct from 'object' or jsonb_typeof(block->'type') is distinct from 'string' then
   raise exception 'Invalid rich question block' using errcode='22023';
  end if;
  kind := block->>'type';
  projection := '';
  if kind = 'paragraph' then
   if (select count(*) from jsonb_object_keys(block)) <> 2
   or not(block ?& array['type','text']) then
    raise exception 'Invalid rich question paragraph' using errcode='22023';
   end if;
   projection := ace.rich_content_text(block->'text',6000);
  elsif kind = 'equation' then
   if (select count(*) from jsonb_object_keys(block)) <> 3
   or not(block ?& array['type','expression','spoken']) then
    raise exception 'Invalid rich question equation' using errcode='22023';
   end if;
   projection := ace.rich_content_text(block->'expression',1000)
      || ' — ' || ace.rich_content_text(block->'spoken',400);
  elsif kind = 'image' then
   image_count := image_count+1;
   if image_count > 4
   or (select count(*) from jsonb_object_keys(block)) <> 4
   or not(block ?& array['type','asset_id','alt','caption'])
   or jsonb_typeof(block->'asset_id') is distinct from 'string'
   or (block->>'asset_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
   or (block->>'asset_id') <> lower(block->>'asset_id') then
    raise exception 'Invalid rich question image reference' using errcode='22023';
   end if;
   alt_text := ace.rich_content_text(block->'alt',500,8);
   caption_text := ace.rich_content_text(block->'caption',240,0);
   projection := 'Diagram: '||alt_text||
     case when caption_text <> '' then E'\n'||caption_text else '' end;
  elsif kind = 'table' then
   table_count := table_count+1;
   if table_count > 3
   or (select count(*) from jsonb_object_keys(block)) <> 4
   or not(block ?& array['type','caption','headers','rows'])
   or jsonb_typeof(block->'headers') is distinct from 'array'
   or jsonb_typeof(block->'rows') is distinct from 'array' then
    raise exception 'Invalid rich question table' using errcode='22023';
   end if;
   column_count := jsonb_array_length(block->'headers');
   if column_count not between 2 and 6
   or jsonb_array_length(block->'rows') not between 1 and 20
   or column_count * jsonb_array_length(block->'rows') > 120 then
    raise exception 'Invalid rich question table dimensions' using errcode='22023';
   end if;
   caption_text := ace.rich_content_text(block->'caption',240);
   header_line := '';
   for value_item in select value from jsonb_array_elements(block->'headers') loop
    if header_line <> '' then header_line := header_line||' | '; end if;
    header_line := header_line||ace.rich_content_text(value_item,160);
   end loop;
   projection := caption_text||E'\n'||header_line;
   for row_item in select value from jsonb_array_elements(block->'rows') loop
    if jsonb_typeof(row_item) is distinct from 'array'
    or jsonb_array_length(row_item) <> column_count then
     raise exception 'Invalid rich question table row' using errcode='22023';
    end if;
    row_line := '';
    item_count := 0;
    for value_item in select value from jsonb_array_elements(row_item) loop
     if item_count > 0 then row_line := row_line||' | '; end if;
     row_line := row_line||ace.rich_content_text(value_item,240,0);
     item_count := item_count+1;
    end loop;
    projection := projection||E'\n'||row_line;
   end loop;
  else
   raise exception 'Unsupported rich question block' using errcode='22023';
  end if;
  if fallback <> '' then fallback := fallback||E'\n\n'; end if;
  fallback := fallback||projection;
 end loop;
 if length(fallback) > 20000 or fallback <> p_document->>'fallback_text' then
  raise exception 'Invalid rich question fallback' using errcode='22023';
 end if;
 return p_document;
end;$$;

-- Revocation matters: PostgreSQL grants PUBLIC EXECUTE on new functions by default.
revoke all on function ace.rich_content_text(jsonb,integer,integer) from public,anon,authenticated;
revoke all on function ace.validate_rich_question_content(jsonb) from public,anon,authenticated;
commit;

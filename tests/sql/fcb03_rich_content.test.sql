\set ON_ERROR_STOP on
-- This script runs only inside the existing isolated fcb03_question_test database.
-- Exercise the source-only private validator; do NOT apply a production migration.
\ir ../../supabase/proposals/fcb03_rich_content_validation.sql

do $tests$
declare
 d jsonb;
 b jsonb;
 invalid_case record;
 fallback text;
 n integer := 0;
begin
 fallback := 'Find the area.'||E'\n\n'||'A = l × w — Area is length times width'||
   E'\n\n'||'Measurements'||E'\n'||'Length | Width'||E'\n'||'3 m | 2 m'||
   E'\n\n'||'Diagram: A rectangle with labelled dimensions'||E'\n'||'Diagram 1';
 d := jsonb_build_object(
   'version',1,
   'blocks',jsonb_build_array(
     jsonb_build_object('type','paragraph','text','Find the area.'),
     jsonb_build_object('type','equation','expression','A = l × w','spoken','Area is length times width'),
     jsonb_build_object('type','table','caption','Measurements',
       'headers',jsonb_build_array('Length','Width'),
       'rows',jsonb_build_array(jsonb_build_array('3 m','2 m'))),
     jsonb_build_object('type','image','asset_id','03000000-0000-4000-8000-000000000001',
       'alt','A rectangle with labelled dimensions','caption','Diagram 1')
   ),
   'fallback_text',fallback
 );
 if ace.validate_rich_question_content(d) <> d then
  raise exception 'Server changed verified document';
 end if;
 if has_function_privilege('anon','ace.validate_rich_question_content(jsonb)','execute')
 or has_function_privilege('authenticated','ace.validate_rich_question_content(jsonb)','execute')
 or has_function_privilege('authenticated','ace.rich_content_text(jsonb,integer,integer)','execute')
 or has_function_privilege('anon','ace.rich_content_text(jsonb,integer,integer)','execute') then
  raise exception 'Private validator leaked EXECUTE grants';
 end if;
 for invalid_case in
  select name,candidate from (values
   ('unknown version',jsonb_set(d,'{version}','2'::jsonb)),
   ('spoofed fallback',jsonb_set(d,'{fallback_text}',to_jsonb('Other question'::text))),
   ('missing fallback',d - 'fallback_text'),
   ('unknown document field',d || '{"html":"<script>alert(1)</script>"}'::jsonb),
   ('root array','[]'::jsonb),
   ('empty document',jsonb_set(d,'{blocks}','[]'::jsonb)),
   ('too many blocks',jsonb_set(d,'{blocks}',(select jsonb_agg(jsonb_build_object('type','paragraph','text','x')) from generate_series(1,25)))),
   ('unexpected paragraph markup',jsonb_set(d,'{blocks,0}',(d->'blocks'->0)||'{"html":"unsafe"}'::jsonb)),
   ('paragraph control',jsonb_set(d,'{blocks,0,text}',to_jsonb('x'||chr(7)||'y'))),
   ('bidi direction',jsonb_set(d,'{blocks,0,text}',to_jsonb('x'||chr(8238)||'y'))),
   ('unsafe equation property',jsonb_set(d,'{blocks,1}',(d->'blocks'->1)||'{"latex":"<script/>"}'::jsonb)),
   ('blank spoken math',jsonb_set(d,'{blocks,1,spoken}',to_jsonb(''::text))),
   ('bad image id',jsonb_set(d,'{blocks,3,asset_id}',to_jsonb('https://example.invalid/private.png'::text))),
   ('external image URL',jsonb_set(d,'{blocks,3}',(d->'blocks'->3)||'{"src":"https://example.invalid/a.png"}'::jsonb)),
   ('alt too short',jsonb_set(d,'{blocks,3,alt}',to_jsonb('image'::text))),
   ('invalid table header',jsonb_set(d,'{blocks,2,headers}','["A"]'::jsonb)),
   ('mismatched table row',jsonb_set(d,'{blocks,2,rows}','[["only one"]] '::jsonb)),
   ('table oversized',jsonb_set(d,'{blocks,2,rows}',(select jsonb_agg('["3","4"]'::jsonb) from generate_series(1,21)))),
   ('table unknown attribute',jsonb_set(d,'{blocks,2}',(d->'blocks'->2)||'{"style":"bad"}'::jsonb)),
   ('too many images',jsonb_set(d,'{blocks}',(select jsonb_agg(d->'blocks'->3) from generate_series(1,5)))),
   ('too many tables',jsonb_set(d,'{blocks}',(select jsonb_agg(d->'blocks'->2) from generate_series(1,4)))),
   ('massive document',jsonb_set(d,'{blocks,0,text}',to_jsonb(repeat('a',40000)))),
   ('massive fallback',jsonb_set(d,'{fallback_text}',to_jsonb(repeat('a',20001))))
  ) as v(name,candidate)
 loop
  begin
   perform ace.validate_rich_question_content(invalid_case.candidate);
   raise exception 'Unsafe document accepted: %',invalid_case.name;
  exception
   when sqlstate '22023' then null;
  end;
  n := n+1;
 end loop;
 if n<>23 then raise exception 'Expected 23 refusal cases, got %',n;end if;
 raise notice 'FCB-03 rich content PostgreSQL PASS: 1 full example, 23 refusals, 4 private EXECUTE denials';
end
$tests$;

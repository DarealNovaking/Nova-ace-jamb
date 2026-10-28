-- Read-only catalog query shared by native CI parity verification.
-- Compare visible column order; dropped internal attribute slots are not schema semantics.
set search_path = public, extensions;
select json_build_object(
'columns',(select json_agg(x order by table_name,ordinal) from (select c.relname table_name,row_number() over(partition by c.oid order by a.attnum) ordinal,a.attname name,format_type(a.atttypid,a.atttypmod) type,a.attnotnull not_null,pg_get_expr(d.adbin,d.adrelid) default_expr,a.attidentity identity,a.attgenerated generated from pg_class c join pg_namespace n on n.oid=c.relnamespace join pg_attribute a on a.attrelid=c.oid left join pg_attrdef d on d.adrelid=c.oid and d.adnum=a.attnum where n.nspname='ace' and c.relkind='r' and a.attnum>0 and not a.attisdropped)x),
'constraints',(select json_agg(x order by table_name,name) from(select c.relname table_name,k.conname name,k.contype type,pg_get_constraintdef(k.oid,true) definition from pg_constraint k join pg_class c on c.oid=k.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='ace' and k.contype <> 'n')x),
'indexes',(select json_agg(x order by tablename,indexname) from(select tablename,indexname,indexdef from pg_indexes where schemaname='ace' and indexname not in(select conname from pg_constraint where connamespace='ace'::regnamespace))x),
'functions',(select json_agg(x order by name,identity) from(select p.proname name,pg_get_function_identity_arguments(p.oid) identity,pg_get_functiondef(p.oid) definition,pg_get_userbyid(p.proowner) owner,p.proacl::text acl from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='ace')x),
'policies',(select json_agg(x order by tablename,policyname) from(select * from pg_policies where schemaname='ace')x),
 'triggers',(select json_agg(x order by schema_name,table_name,name) from(select n.nspname schema_name,c.relname table_name,t.tgname name,pg_get_triggerdef(t.oid,true) definition,t.tgenabled enabled from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace join pg_proc p on p.oid=t.tgfoid where not t.tgisinternal and (n.nspname='ace' or p.pronamespace='ace'::regnamespace))x),
 'tables',(select json_agg(x order by name) from(select c.relname name,c.relrowsecurity rls,c.relforcerowsecurity force_rls,pg_get_userbyid(c.relowner) owner,c.relacl::text acl from pg_class c where c.relnamespace='ace'::regnamespace and c.relkind='r')x),
 'schema_acl',(select nspacl::text from pg_namespace where nspname='ace')
) snapshot;

-- SOURCE-ONLY grant proposal. Never run on production without owner approval.
-- A trusted operator must separately provision a dedicated ace_media_executor
-- LOGIN with a strong rotated credential and NO superuser/BYPASSRLS/createdb.
-- This script intentionally does not create roles, logins, secrets or storage.
begin;
do $guards$
declare role_row pg_catalog.pg_roles%rowtype;
begin
 select * into role_row from pg_catalog.pg_roles where rolname='ace_media_executor';
 if not found then
  raise exception 'Provision dedicated ace_media_executor role before grants';
 end if;
 if role_row.rolsuper or role_row.rolbypassrls or
    role_row.rolcreatedb or role_row.rolcreaterole or role_row.rolreplication then
  raise exception 'Media executor is overprivileged';
 end if;
end
$guards$;
grant usage on schema ace to ace_media_executor;
grant execute on function ace.reserve_question_media_intent(
 uuid,integer,uuid,text,text,text,integer,text
) to ace_media_executor;
grant execute on function ace.confirm_question_media_intent(
 uuid,text,integer,text
) to ace_media_executor;
-- No table grants, storage policies, UPDATE, publication or PUBLIC EXECUTE.
commit;

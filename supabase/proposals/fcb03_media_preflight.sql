-- SOURCE-ONLY preflight authorization for costly private image decoding.
-- Not a production migration. This is an advisory rejection only: the
-- reservation/confirmation functions MUST still recheck under row locks.
begin;
create function ace.can_stage_question_media(
 p_question uuid,p_version integer
) returns boolean language plpgsql security definer stable
set search_path=pg_catalog,pg_temp set lock_timeout='3s' as $$
declare actor uuid := auth.uid(); actor_role text;
begin
 if actor is null or p_question is null or p_version is null or p_version < 1 then
  return false;
 end if;
 if current_setting('transaction_isolation') <> 'read committed' then
  return false;
 end if;
 if not exists(select 1 from pg_catalog.pg_roles
   where rolname=current_user and (rolsuper or rolbypassrls)) then
  return false;
 end if;
 select role into actor_role from ace.roles
  where user_id=actor and role in ('editor','admin');
 if not found then return false;end if;
 return exists(select 1 from ace.questions q
  where q.id=p_question and q.content_version=p_version
  and not q.active and q.review_status in ('draft','rejected')
  and (q.created_by=actor or actor_role='admin'));
end;$$;
revoke all on function ace.can_stage_question_media(uuid,integer)
 from public,anon,authenticated;
commit;

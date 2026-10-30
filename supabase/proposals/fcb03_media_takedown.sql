-- SOURCE ONLY. No production schema or storage changes.
begin;
create function ace.takedown_question_media(p_question uuid,p_asset uuid,p_reason text)
returns jsonb language plpgsql security definer
set search_path=pg_catalog,pg_temp set lock_timeout='3s' as $$
declare actor uuid:=auth.uid(); q ace.questions%rowtype; m ace.question_media%rowtype;
 latest ace.question_media_reviews%rowtype; saved ace.question_media_reviews%rowtype;
 reason text:=ace.question_trim(p_reason);
begin
 if actor is null then raise exception 'Authentication required' using errcode='28000';end if;
 if current_setting('transaction_isolation')<>'read committed'
  or not exists(select 1 from pg_catalog.pg_roles where rolname=current_user and(rolsuper or rolbypassrls)) then
  raise exception 'Trusted media executor required' using errcode='42501';end if;
 select role into actor_role from ace.roles where user_id=actor and role='admin' for share;
 if not found then raise exception 'Administrator takedown required' using errcode='42501';end if;
 if p_question is null or p_asset is null or reason is null or length(reason) not between 8 and 2000 then
  raise exception 'A reason is required' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('ace.question.workflow',0));
 select * into q from ace.questions where id=p_question for update;
 select * into m from ace.question_media where id=p_asset and question_id=p_question for update;
 if not found or not q.active or q.review_status<>'published' or q.content_version<>m.question_version
  or m.intent_id is distinct from m.id or m.storage_path<>'published/v1/'||p_question::text||'/'||m.question_version::text||'/'||p_asset::text
  or not exists(select 1 from ace.question_versions v where v.question_id=p_question and v.version=m.question_version
   and v.snapshot->>'review_status'='published' and v.snapshot->'rich_content'=q.rich_content)
  or not exists(select 1 from jsonb_array_elements(q.rich_content->'blocks') b(value)
   where b.value->>'type'='image' and b.value->>'asset_id'=p_asset::text and b.value->>'alt'=m.alt_text) then
  raise exception 'Current published media unavailable' using errcode='23514';end if;
 select * into latest from ace.question_media_reviews where intent_id=m.intent_id and question_version=m.question_version-1
 order by reviewed_at desc,id desc limit 1 for update;
 if not found then raise exception 'Prior rights decision required' using errcode='23514';end if;
 if latest.decision='rejected' then
  return jsonb_build_object('id',latest.id,'decision','rejected','status','revoked');
 end if;
 if latest.decision<>'approved' then raise exception 'Media is not approved' using errcode='23514';end if;
 insert into ace.question_media_reviews(intent_id,question_version,reviewed_by,decision,rights_status,rights_evidence)
 values(m.intent_id,m.question_version-1,actor,'rejected','restricted',reason) returning * into saved;
 return jsonb_build_object('id',saved.id,'decision','rejected','status','revoked');
end;$$;
revoke all on function ace.takedown_question_media(uuid,uuid,text) from public,anon,authenticated;
grant execute on function ace.takedown_question_media(uuid,uuid,text) to authenticated;
commit;

-- Source-only private reviewer preview authorization. This proposal grants no
-- direct table access and never returns a storage path to a browser.
begin;
create function ace.authorize_question_media_preview(
 p_question uuid,p_version integer,p_asset uuid
) returns jsonb language plpgsql security definer
set search_path=pg_catalog,pg_temp set lock_timeout='3s' as $$
declare
 actor uuid:=auth.uid();
 actor_role text;
 q ace.questions%rowtype;
 intent ace.question_media_intents%rowtype;
 alt text;
begin
 if actor is null or p_question is null or p_asset is null
  or p_version is null or p_version<1
  or current_setting('transaction_isolation')<>'read committed'
  or not exists(select 1 from pg_catalog.pg_roles
    where rolname=current_user and (rolsuper or rolbypassrls)) then
  return null;
 end if;
 select role into actor_role from ace.roles
  where user_id=actor and role in('editor','admin') for share;
 if not found then return null;end if;
 select * into q from ace.questions where id=p_question for share;
 if not found or q.active or q.content_version<>p_version
  or q.review_status not in('draft','rejected','in_review','approved')
  or q.rich_content is null then return null;end if;
 perform ace.validate_rich_question_content(q.rich_content);
 select value->>'alt' into alt
 from jsonb_array_elements(q.rich_content->'blocks') value
 where value->>'type'='image' and value->>'asset_id'=p_asset::text;
 if not found or alt is null then return null;end if;
 select * into intent from ace.question_media_intents where id=p_asset for share;
 if not found or intent.question_id<>p_question
  or intent.status<>'verified' or intent.verified_at is null
  or intent.question_version>p_version
  or intent.storage_path<>'staging/v1/'||p_question::text||'/'||p_asset::text
  or intent.alt_text<>alt
  or intent.claimed_mime not in('image/png','image/jpeg','image/webp')
  or intent.claimed_size_bytes not between 1 and 2097152
  or intent.claimed_sha256 !~ '^[0-9a-f]{64}$' then return null;end if;
 if q.review_status in('draft','rejected') then
  if actor<>q.created_by and actor_role<>'admin' then return null;end if;
 elsif q.review_status='in_review' then
  if actor_role<>'admin' or actor=q.created_by
   or actor::text is not distinct from (q.provenance->>'last_content_editor')
   or actor=intent.requested_by then return null;end if;
 elsif q.review_status='approved' then
  if actor_role<>'admin' or actor is distinct from q.reviewed_by
   or actor=q.created_by
   or actor::text is not distinct from (q.provenance->>'last_content_editor')
   or actor=intent.requested_by then return null;end if;
 end if;
 return jsonb_build_object(
  'id',intent.id,'question_id',intent.question_id,
  'question_version',p_version,'storage_path',intent.storage_path,
  'mime_type',intent.claimed_mime,'size_bytes',intent.claimed_size_bytes,
  'sha256',intent.claimed_sha256
 );
end;$$;
revoke all on function ace.authorize_question_media_preview(uuid,integer,uuid)
 from public,anon,authenticated;
commit;

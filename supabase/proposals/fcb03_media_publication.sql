-- SOURCE-ONLY immutable media promotion contract. It authorizes only the exact
-- approved revision and creates metadata only after the trusted Edge adapter has
-- copied, re-read and SHA-256-verified the private object. Never apply to prod
-- without a separate reviewed release authorization.
begin;
create function ace.prepare_question_media_publication(
 p_question uuid,p_approved_version integer
) returns jsonb language plpgsql security definer
set search_path=pg_catalog,pg_temp set lock_timeout='3s' as $$
declare
 actor uuid:=auth.uid(); actor_role text; q ace.questions%rowtype;
 block jsonb; asset uuid; intent ace.question_media_intents%rowtype;
 rights_review ace.question_media_reviews%rowtype; assets jsonb:='[]'::jsonb;
begin
 if actor is null or p_question is null or p_approved_version is null or p_approved_version<1
  or current_setting('transaction_isolation')<>'read committed'
  or not exists(select 1 from pg_catalog.pg_roles where rolname=current_user and (rolsuper or rolbypassrls)) then
  raise exception 'Private media publication unavailable' using errcode='42501';
 end if;
 select role into actor_role from ace.roles where user_id=actor and role='admin' for share;
 if not found then raise exception 'Administrator publication required' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended('ace.question.workflow',0));
 select * into q from ace.questions where id=p_question for share;
 if not found or q.active or q.review_status<>'approved' or q.content_version<>p_approved_version
  or q.reviewed_by is distinct from actor or q.created_by is null or q.created_by=actor
  or actor::text is not distinct from (q.provenance->>'last_content_editor')
  or q.rights_status not in('owned','licensed','permitted') or q.rich_content is null then
  raise exception 'Approved question revision unavailable for media publication' using errcode='23514';
 end if;
 if not exists(select 1 from ace.question_versions v where v.question_id=p_question
  and v.version=p_approved_version and v.snapshot->>'content_version'=p_approved_version::text
  and v.snapshot->>'review_status'='approved' and v.snapshot->>'active'='false'
  and v.snapshot->>'reviewed_by'=actor::text and v.snapshot->'rich_content'=q.rich_content) then
  raise exception 'Approved immutable question revision unavailable' using errcode='23514';
 end if;
 perform ace.validate_rich_question_content(q.rich_content);
 for block in select value from jsonb_array_elements(q.rich_content->'blocks') where value->>'type'='image'
 loop
  asset:=(block->>'asset_id')::uuid;
  select * into intent from ace.question_media_intents where id=asset for share;
  if not found or intent.question_id<>p_question or intent.status<>'verified'
   or intent.verified_at is null or intent.question_version>p_approved_version
   or intent.storage_path<>'staging/v1/'||p_question::text||'/'||asset::text
   or intent.alt_text<>block->>'alt' or intent.requested_by=actor
   or intent.claimed_mime not in('image/png','image/jpeg','image/webp')
   or intent.claimed_size_bytes not between 1 and 2097152
   or intent.claimed_sha256 !~ '^[0-9a-f]{64}$' then
   raise exception 'Verified private media intent unavailable' using errcode='23514';
  end if;
  select * into rights_review from ace.question_media_reviews
   where intent_id=asset and question_version=p_approved_version
   order by reviewed_at desc,id desc limit 1 for share;
  if not found or rights_review.decision<>'approved'
   or rights_review.rights_status not in('owned','licensed','permitted')
   or rights_review.reviewed_by is distinct from actor
   or rights_review.reviewed_by=intent.requested_by
   or length(rights_review.rights_evidence) not between 8 and 4000 then
   raise exception 'Independent media rights approval required' using errcode='23514';
  end if;
  if not exists(select 1 from jsonb_array_elements(assets) existing
   where existing->>'id'=asset::text) then
   assets:=assets||jsonb_build_array(jsonb_build_object(
    'id',asset,'source_path',intent.storage_path,
    'target_path','published/v1/'||p_question::text||'/'||(p_approved_version+1)::text||'/'||asset::text,
    'mime_type',intent.claimed_mime,'size_bytes',intent.claimed_size_bytes,
    'sha256',intent.claimed_sha256,'alt_text',intent.alt_text
   ));
  end if;
 end loop;
 if jsonb_array_length(assets)<1 or jsonb_array_length(assets)>4 then
  raise exception 'No publishable diagram assets' using errcode='23514';
 end if;
 return jsonb_build_object('question_id',p_question,'approved_version',p_approved_version,
  'publish_version',p_approved_version+1,'assets',assets);
end;$$;

create function ace.confirm_question_media_promotion(
 p_question uuid,p_approved_version integer,p_asset uuid
) returns jsonb language plpgsql security definer
set search_path=pg_catalog,pg_temp set lock_timeout='3s' as $$
declare
 actor uuid:=auth.uid(); actor_role text; q ace.questions%rowtype;
 intent ace.question_media_intents%rowtype; rights_review ace.question_media_reviews%rowtype;
 media ace.question_media%rowtype; approved_snapshot ace.question_versions%rowtype;
 alt text; publish_version integer;
begin
 if actor is null or p_question is null or p_approved_version is null or p_approved_version<1 or p_asset is null
  or current_setting('transaction_isolation')<>'read committed'
  or not exists(select 1 from pg_catalog.pg_roles where rolname=current_user and (rolsuper or rolbypassrls)) then
  raise exception 'Private media publication unavailable' using errcode='42501';
 end if;
 select role into actor_role from ace.roles where user_id=actor and role='admin' for share;
 if not found then raise exception 'Administrator publication required' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended('ace.question.workflow',0));
 select * into q from ace.questions where id=p_question for update;
 if not found or q.active or q.review_status<>'approved' or q.content_version<>p_approved_version
  or q.reviewed_by is distinct from actor or q.created_by is null or q.created_by=actor
  or actor::text is not distinct from (q.provenance->>'last_content_editor')
  or q.rights_status not in('owned','licensed','permitted') or q.rich_content is null then
  raise exception 'Approved question revision unavailable for media publication' using errcode='23514';
 end if;
 select * into approved_snapshot from ace.question_versions
  where question_id=p_question and version=p_approved_version for share;
 if not found or approved_snapshot.snapshot->>'content_version'<>p_approved_version::text
  or approved_snapshot.snapshot->>'review_status'<>'approved'
  or approved_snapshot.snapshot->>'active'<>'false'
  or approved_snapshot.snapshot->>'reviewed_by'<>actor::text
  or approved_snapshot.snapshot->'rich_content'<>q.rich_content then
  raise exception 'Approved immutable question revision unavailable' using errcode='23514';
 end if;
 select value->>'alt' into alt from jsonb_array_elements(q.rich_content->'blocks') value
  where value->>'type'='image' and value->>'asset_id'=p_asset::text;
 if not found or alt is null then raise exception 'Media is not referenced by the approved question' using errcode='23514';end if;
 select * into intent from ace.question_media_intents where id=p_asset for share;
 if not found or intent.question_id<>p_question or intent.status<>'verified'
  or intent.verified_at is null or intent.question_version>p_approved_version
  or intent.storage_path<>'staging/v1/'||p_question::text||'/'||p_asset::text
  or intent.alt_text<>alt or intent.requested_by=actor then
  raise exception 'Verified private media intent unavailable' using errcode='23514';end if;
 select * into rights_review from ace.question_media_reviews
  where intent_id=p_asset and question_version=p_approved_version
  order by reviewed_at desc,id desc limit 1 for share;
 if not found or rights_review.decision<>'approved'
  or rights_review.rights_status not in('owned','licensed','permitted')
  or rights_review.reviewed_by is distinct from actor
  or rights_review.reviewed_by=intent.requested_by then
  raise exception 'Independent media rights approval required' using errcode='23514';end if;
 publish_version:=p_approved_version+1;
 select * into media from ace.question_media
  where id=p_asset and question_id=p_question and question_version=publish_version for update;
 if found then
  if media.intent_id<>p_asset or media.storage_path<>'published/v1/'||p_question::text||'/'||publish_version::text||'/'||p_asset::text
   or media.mime_type<>intent.claimed_mime or media.size_bytes<>intent.claimed_size_bytes
   or media.sha256<>intent.claimed_sha256 or media.alt_text<>alt
   or media.rights_status<>rights_review.rights_status
   or media.reviewed_by<>actor or media.rights_reviewed_by<>actor
   or media.rights_reviewed_at<>rights_review.reviewed_at
   or media.rights_evidence<>rights_review.rights_evidence then
   raise exception 'Conflicting immutable media publication metadata' using errcode='23514';
  end if;
  return jsonb_build_object('id',media.id,'question_id',media.question_id,
   'question_version',media.question_version,'storage_path',media.storage_path,
   'mime_type',media.mime_type,'size_bytes',media.size_bytes,'sha256',media.sha256);
 end if;
 insert into ace.question_media(
  id,question_id,kind,storage_provider,storage_path,mime_type,size_bytes,alt_text,
  rights_status,source_url,metadata,intent_id,question_version,sha256,verified_at,
  reviewed_by,reviewed_at,rights_evidence,rights_reviewed_by,rights_reviewed_at
 ) values(
  p_asset,p_question,'diagram','supabase',
  'published/v1/'||p_question::text||'/'||publish_version::text||'/'||p_asset::text,
  intent.claimed_mime,intent.claimed_size_bytes,alt,rights_review.rights_status,null,'{}'::jsonb,
  p_asset,publish_version,intent.claimed_sha256,clock_timestamp(),
  actor,approved_snapshot.created_at,rights_review.rights_evidence,actor,rights_review.reviewed_at
 ) returning * into media;
 return jsonb_build_object('id',media.id,'question_id',media.question_id,
  'question_version',media.question_version,'storage_path',media.storage_path,
  'mime_type',media.mime_type,'size_bytes',media.size_bytes,'sha256',media.sha256);
end;$$;
create function ace.publish_question_after_media_promotion(
 p_question uuid,p_approved_version integer
) returns jsonb language plpgsql security definer
set search_path=pg_catalog,pg_temp set lock_timeout='3s' as $
declare actor uuid:=auth.uid(); actor_role text;
begin
 if session_user<>'ace_media_executor' or actor is null or p_question is null
  or p_approved_version is null or p_approved_version<1
  or current_setting('transaction_isolation')<>'read committed' then
  raise exception 'Private media publication unavailable' using errcode='42501';
 end if;
 select role into actor_role from ace.roles
  where user_id=actor and role='admin' for share;
 if not found then raise exception 'Administrator publication required' using errcode='42501';end if;
 -- The existing question workflow locks the revision and revalidates the
 -- independent rights audit and promoted immutable bytes before publication.
 return ace.manage_question('publish',p_question,p_approved_version,'{}'::jsonb);
end;$;
revoke all on function ace.prepare_question_media_publication(uuid,integer) from public,anon,authenticated;
revoke all on function ace.confirm_question_media_promotion(uuid,integer,uuid) from public,anon,authenticated;
revoke all on function ace.publish_question_after_media_promotion(uuid,integer) from public,anon,authenticated;
commit;

-- SOURCE-ONLY proposal: explicit independent media-rights review.
-- The reviewer must already have approved the exact question revision and must
-- differ from the question author, last content editor, and asset uploader.
begin;
create function ace.review_question_media_intent(
 p_question uuid,p_version integer,p_asset uuid,p_decision text,
 p_rights_status text,p_rights_evidence text
) returns jsonb language plpgsql security definer
set search_path=pg_catalog,ace,pg_temp set lock_timeout='3s' as $$
declare
 actor uuid:=auth.uid();
 actor_role text;
 q ace.questions%rowtype;
 intent ace.question_media_intents%rowtype;
 existing ace.question_media_reviews%rowtype;
 v_decision text:=lower(ace.question_trim(p_decision));
 v_rights text:=lower(ace.question_trim(p_rights_status));
 v_evidence text:=ace.question_trim(p_rights_evidence);
 result ace.question_media_reviews%rowtype;
begin
 if actor is null then raise exception 'Authentication required' using errcode='28000';end if;
 if current_setting('transaction_isolation')<>'read committed' then
  raise exception 'Read committed transaction required' using errcode='25001';end if;
 select role into actor_role from ace.roles where user_id=actor and role in('editor','admin') for share;
 if not found then raise exception 'Media review permission required' using errcode='42501';end if;
 if p_question is null or p_version is null or p_version<1 or p_asset is null
  or v_decision is null or v_decision not in('approved','rejected')
  or v_rights is null or v_rights not in('owned','licensed','permitted','restricted','rejected')
  or v_evidence is null or length(v_evidence) not between 8 and 4000 then
  raise exception 'Invalid media review decision' using errcode='22023';end if;
 if (v_decision='approved' and v_rights not in('owned','licensed','permitted'))
  or (v_decision='rejected' and v_rights not in('restricted','rejected')) then
  raise exception 'Media rights decision inconsistent' using errcode='22023';end if;

 perform pg_advisory_xact_lock(hashtextextended('ace.question.workflow',0));
 select * into q from ace.questions where id=p_question for update;
 if not found then
  raise exception 'Independent media reviewer required' using errcode='42501';end if;
 if q.active or q.review_status<>'approved'
  or q.content_version<>p_version or q.reviewed_by is distinct from actor
  or q.created_by is null or q.created_by=actor
  or q.rights_status not in('owned','licensed','permitted')
  or actor::text is not distinct from (q.provenance->>'last_content_editor') then
  raise exception 'Independent media reviewer required' using errcode='42501';end if;
 if q.rich_content is null then
  raise exception 'Rich question content required for media review' using errcode='23514';end if;
 if not exists(select 1 from ace.question_versions v
  where v.question_id=p_question and v.version=p_version
   and v.snapshot->>'content_version'=p_version::text
   and v.snapshot->>'review_status'='approved'
   and v.snapshot->>'active'='false'
   and v.snapshot->>'reviewed_by'=actor::text
   and v.snapshot->'rich_content'=q.rich_content) then
  raise exception 'Approved immutable question revision unavailable for media review' using errcode='23514';end if;
 perform ace.validate_rich_question_content(q.rich_content);

 select * into intent from ace.question_media_intents where id=p_asset for share;
 if not found then
  raise exception 'Verified media intent unavailable for independent review' using errcode='23514';end if;
 if intent.question_id<>p_question or intent.status<>'verified'
  or intent.verified_at is null or intent.question_version>p_version
  or intent.requested_by is null or intent.requested_by=actor
  or length(intent.rights_evidence) not between 1 and 4000 then
  raise exception 'Verified media intent unavailable for independent review' using errcode='23514';end if;
 if not exists(
  select 1 from jsonb_array_elements(q.rich_content->'blocks') b(value)
  where b.value->>'type'='image' and b.value->>'asset_id'=intent.id::text
   and b.value->>'alt'=intent.alt_text
 ) then
  raise exception 'Media must be referenced by the exact rich document and alt text' using errcode='23514';end if;

 select * into existing from ace.question_media_reviews
 where intent_id=intent.id and question_version=p_version and reviewed_by=actor
  and decision=v_decision and rights_status=v_rights and rights_evidence=v_evidence
 order by reviewed_at desc limit 1;
 if found then
  return jsonb_build_object('id',existing.id,'intent_id',existing.intent_id,
   'question_version',existing.question_version,'decision',existing.decision,
   'rights_status',existing.rights_status,'reviewed_at',existing.reviewed_at);
 end if;

 insert into ace.question_media_reviews(
  intent_id,question_version,reviewed_by,decision,rights_status,rights_evidence
 ) values(intent.id,p_version,actor,v_decision,v_rights,v_evidence) returning * into result;
 return jsonb_build_object('id',result.id,'intent_id',result.intent_id,
  'question_version',result.question_version,'decision',result.decision,
  'rights_status',result.rights_status,'reviewed_at',result.reviewed_at);
end;$$;

-- A reviewer may preview only the verified staging object referenced by the
-- exact private in-review/approved revision. No bucket/path comes from the client.
create function ace.authorize_question_media_preview(
 p_question_id uuid,p_version integer,p_asset_id uuid
) returns jsonb language plpgsql security definer
set search_path=pg_catalog,ace,pg_temp set lock_timeout='3s' as $
declare
 actor uuid:=auth.uid();
 actor_role text;
 q ace.questions%rowtype;
 version_row ace.question_versions%rowtype;
 intent ace.question_media_intents%rowtype;
begin
 if actor is null or p_question_id is null or p_version is null or p_version<1
  or p_asset_id is null then return null;end if;
 select role into actor_role from ace.roles
 where user_id=actor and role in('admin','editor') for share;
 if not found then return null;end if;

 select * into q from ace.questions where id=p_question_id for share;
 if not found or q.active or q.content_version<>p_version
  or q.review_status not in('in_review','approved')
  or q.created_by is null or q.created_by=actor
  or actor::text is not distinct from (q.provenance->>'last_content_editor')
  or q.rich_content is null then return null;end if;
 if q.review_status='approved' and
  (q.reviewed_by is distinct from actor or q.rights_status not in('owned','licensed','permitted')) then
  return null;end if;
 if q.review_status='in_review' and q.reviewed_by is not null then return null;end if;

 select * into version_row from ace.question_versions
 where question_id=p_question_id and version=p_version for share;
 if not found or version_row.snapshot->>'content_version'<>p_version::text
  or version_row.snapshot->>'review_status'<>q.review_status
  or version_row.snapshot->>'active'<>'false'
  or version_row.snapshot->'rich_content' is distinct from q.rich_content then return null;end if;
 if q.review_status='approved' and version_row.snapshot->>'reviewed_by'<>actor::text then
  return null;end if;
 if q.review_status='in_review' and version_row.snapshot->>'reviewed_by' is not null then
  return null;end if;
 begin perform ace.validate_rich_question_content(q.rich_content);
 exception when others then return null;end;

 select * into intent from ace.question_media_intents
 where id=p_asset_id and question_id=p_question_id for share;
 if not found or intent.status<>'verified' or intent.verified_at is null
  or intent.question_version>p_version or intent.requested_by is null
  or intent.requested_by=actor
  or intent.storage_path<>'staging/v1/'||p_question_id::text||'/'||p_asset_id::text
  or intent.claimed_mime not in('image/png','image/jpeg','image/webp')
  or intent.claimed_size_bytes not between 1 and 2097152
  or intent.claimed_sha256 !~ '^[0-9a-f]{64}
grant execute on function ace.review_question_media_intent(uuid,integer,uuid,text,text,text) to authenticated;
commit;

  or length(intent.rights_evidence) not between 1 and 4000 then return null;end if;
 if not exists(select 1 from jsonb_array_elements(q.rich_content->'blocks') b(value)
  where b.value->>'type'='image' and b.value->>'asset_id'=p_asset_id::text
   and b.value->>'alt'=intent.alt_text) then return null;end if;

 return jsonb_build_object(
  'id',intent.id,'question_id',intent.question_id,'question_version',p_version,
  'storage_path',intent.storage_path,'mime_type',intent.claimed_mime,
  'size_bytes',intent.claimed_size_bytes,'sha256',intent.claimed_sha256
 );
end;$;
revoke all on function ace.authorize_question_media_preview(uuid,integer,uuid) from public,anon,authenticated;

revoke all on function ace.review_question_media_intent(uuid,integer,uuid,text,text,text) from public,anon,authenticated;
grant execute on function ace.review_question_media_intent(uuid,integer,uuid,text,text,text) to authenticated;
commit;

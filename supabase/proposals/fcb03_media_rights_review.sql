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
  or v_decision not in('approved','rejected')
  or v_rights not in('owned','licensed','permitted','restricted','rejected')
  or v_evidence is null or length(v_evidence) not between 8 and 4000 then
  raise exception 'Invalid media review decision' using errcode='22023';end if;
 if (v_decision='approved' and v_rights not in('owned','licensed','permitted'))
  or (v_decision='rejected' and v_rights not in('restricted','rejected')) then
  raise exception 'Media rights decision inconsistent' using errcode='22023';end if;

 perform pg_advisory_xact_lock(hashtextextended('ace.question.workflow',0));
 select * into q from ace.questions where id=p_question for update;
 if not found or q.active or q.review_status<>'approved'
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
 if not found or intent.question_id<>p_question or intent.status<>'verified'
  or intent.verified_at is null or intent.question_version>p_version
  or intent.requested_by=actor
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
revoke all on function ace.review_question_media_intent(uuid,integer,uuid,text,text,text) from public,anon,authenticated;
grant execute on function ace.review_question_media_intent(uuid,integer,uuid,text,text,text) to authenticated;
commit;

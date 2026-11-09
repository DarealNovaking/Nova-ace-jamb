-- SOURCE-ONLY cleanup contract for abandoned private staging uploads.
-- Never deletes verified assets, published media, or anything referenced by a
-- current question or immutable question history. Storage deletion is performed
-- by a separately gated server worker between claim and completion.
begin;

alter table ace.question_media_intents
 add column if not exists cleanup_claimed_at timestamptz,
 add column if not exists cleanup_claim_token uuid;
do $cleanup_constraint$
begin
 if not exists(select 1 from pg_catalog.pg_constraint
  where conname='question_media_intents_cleanup_claim_consistency'
   and conrelid='ace.question_media_intents'::regclass) then
  alter table ace.question_media_intents
   add constraint question_media_intents_cleanup_claim_consistency check(
    (cleanup_claimed_at is null and cleanup_claim_token is null) or
    (status='pending' and verified_at is null
     and cleanup_claimed_at is not null and cleanup_claim_token is not null)
   );
 end if;
end
$cleanup_constraint$;

create function ace.claim_expired_question_media_cleanup(p_limit integer default 20)
returns table(intent_id uuid,question_id uuid,storage_path text,claim_token uuid)
language plpgsql security definer
set search_path=pg_catalog,ace,pg_temp
set lock_timeout='3s'
as $$
begin
 if session_user<>'ace_media_executor'
  or current_setting('transaction_isolation')<>'read committed'
  or p_limit is null or p_limit not between 1 and 50 then
  raise exception 'Private media cleanup unavailable' using errcode='42501';
 end if;
 -- Serialize against authoring, confirmation, publication and restoration.
 perform pg_advisory_xact_lock(hashtextextended('ace.question.workflow',0));
 return query
 with candidates as (
  select i.id
  from ace.question_media_intents i
  where i.status='pending'
   and i.verified_at is null
   and i.expires_at<=clock_timestamp()-interval '1 hour'
   and i.created_at<=clock_timestamp()-interval '1 hour'
   and (i.cleanup_claimed_at is null
     or i.cleanup_claimed_at<=clock_timestamp()-interval '15 minutes')
   and not exists(select 1 from ace.question_media m
    where m.id=i.id or m.intent_id=i.id)
   and not exists(
    select 1 from ace.questions q
    cross join lateral jsonb_array_elements(
     case when jsonb_typeof(q.rich_content->'blocks')='array'
      then q.rich_content->'blocks' else '[]'::jsonb end
    ) b(value)
    where b.value->>'type'='image' and b.value->>'asset_id'=i.id::text
   )
   and not exists(
    select 1 from ace.question_versions v
    cross join lateral jsonb_array_elements(
     case when jsonb_typeof(v.snapshot->'rich_content'->'blocks')='array'
      then v.snapshot->'rich_content'->'blocks' else '[]'::jsonb end
    ) b(value)
    where b.value->>'type'='image' and b.value->>'asset_id'=i.id::text
   )
  order by i.expires_at,i.id
  limit p_limit
  for update of i skip locked
 )
 update ace.question_media_intents i
 set cleanup_claimed_at=clock_timestamp(),cleanup_claim_token=gen_random_uuid()
 from candidates c
 where i.id=c.id
 returning i.id,i.question_id,i.storage_path,i.cleanup_claim_token;
end;
$$;

create function ace.complete_question_media_cleanup(p_intent uuid,p_claim_token uuid)
returns boolean
language plpgsql security definer
set search_path=pg_catalog,ace,pg_temp
set lock_timeout='3s'
as $$
declare item ace.question_media_intents%rowtype;
begin
 if session_user<>'ace_media_executor'
  or current_setting('transaction_isolation')<>'read committed'
  or p_intent is null or p_claim_token is null then
  raise exception 'Private media cleanup unavailable' using errcode='42501';
 end if;
 perform pg_advisory_xact_lock(hashtextextended('ace.question.workflow',0));
 select * into item from ace.question_media_intents
  where id=p_intent for update;
 if not found then return true; end if;
 if item.status<>'pending' or item.verified_at is not null
  or item.cleanup_claim_token is distinct from p_claim_token
  or item.cleanup_claimed_at is null
  or item.cleanup_claimed_at<clock_timestamp()-interval '15 minutes'
  or item.expires_at>clock_timestamp()-interval '1 hour' then
  return false;
 end if;
 if exists(select 1 from ace.question_media m
   where m.id=item.id or m.intent_id=item.id)
  or exists(
   select 1 from ace.questions q
   cross join lateral jsonb_array_elements(
    case when jsonb_typeof(q.rich_content->'blocks')='array'
     then q.rich_content->'blocks' else '[]'::jsonb end
   ) b(value)
   where b.value->>'type'='image' and b.value->>'asset_id'=item.id::text
  )
  or exists(
   select 1 from ace.question_versions v
   cross join lateral jsonb_array_elements(
    case when jsonb_typeof(v.snapshot->'rich_content'->'blocks')='array'
     then v.snapshot->'rich_content'->'blocks' else '[]'::jsonb end
   ) b(value)
   where b.value->>'type'='image' and b.value->>'asset_id'=item.id::text
  ) then
  update ace.question_media_intents set cleanup_claimed_at=null,cleanup_claim_token=null
   where id=item.id;
  return false;
 end if;
 delete from ace.question_media_intents
  where id=item.id and status='pending' and cleanup_claim_token=p_claim_token;
 return found;
end;
$$;

revoke all on function ace.claim_expired_question_media_cleanup(integer)
 from public,anon,authenticated;
revoke all on function ace.complete_question_media_cleanup(uuid,uuid)
 from public,anon,authenticated;
grant execute on function ace.claim_expired_question_media_cleanup(integer) to ace_media_executor;
grant execute on function ace.complete_question_media_cleanup(uuid,uuid) to ace_media_executor;
commit;

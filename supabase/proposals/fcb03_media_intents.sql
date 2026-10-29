-- PROPOSAL ONLY: private staging metadata, NOT a production migration.
-- No Storage bucket, binary processor, upload route or public read is created.
-- Neither function is callable through the anon/authenticated PostgREST API.
-- Trusted backend MUST authenticate actor and verify/normalize image bytes
-- before invoking confirm; claimed MIME/SHA/length alone prove nothing.
begin;

create table ace.question_media_intents (
 id uuid primary key default gen_random_uuid(),
 question_id uuid not null references ace.questions(id),
 question_version integer not null check (question_version > 0),
 requested_by uuid not null references auth.users(id),
 request_id uuid not null,
 storage_path text not null unique,
 claimed_mime text not null check (claimed_mime in ('image/png','image/jpeg','image/webp')),
 claimed_size_bytes integer not null check (claimed_size_bytes between 1 and 2097152),
 claimed_sha256 text not null check (claimed_sha256 ~ '^[0-9a-f]{64}$'),
 alt_text text not null check (length(alt_text) between 8 and 500),
 rights_evidence text not null check (length(rights_evidence) between 1 and 4000),
 status text not null default 'pending' check (status in ('pending','verified')),
 verified_at timestamptz,
 expires_at timestamptz not null default (now() + interval '15 minutes'),
 created_at timestamptz not null default now(),
 constraint question_media_intents_one_request unique (requested_by,request_id),
 constraint question_media_intents_status_check check (
  (status='pending' and verified_at is null) or
  (status='verified' and verified_at is not null)
 )
);
create index question_media_intents_question_revision on ace.question_media_intents(question_id,question_version);
create index question_media_intents_expiry on ace.question_media_intents(expires_at) where status='pending';
alter table ace.question_media_intents enable row level security;
revoke all on ace.question_media_intents from public,anon,authenticated;

-- Internal callable trust boundary for authenticated editorial actors.
-- Authorization is rechecked under the same global authoring lock as
-- manage_question and restore_question; no client selects a storage path.
create function ace.reserve_question_media_intent(
 p_question uuid,p_version integer,p_request uuid,p_alt text,
 p_rights text,p_mime text,p_size integer,p_sha256 text
) returns jsonb language plpgsql security definer
set search_path=pg_catalog,pg_temp set lock_timeout='3s' as $$
declare
 actor uuid := auth.uid();
 actor_role text;
 q ace.questions%rowtype;
 existing ace.question_media_intents%rowtype;
 new_row ace.question_media_intents%rowtype;
 alt text := ace.question_trim(p_alt);
 rights text := ace.question_trim(p_rights);
 asset uuid;
begin
 if actor is null then raise exception 'Editorial authentication required' using errcode='42501';end if;
 if current_setting('transaction_isolation') <> 'read committed' then
  raise exception 'Read committed transaction required' using errcode='25001';end if;
 if not exists(select 1 from pg_catalog.pg_roles where rolname=current_user and(rolsuper or rolbypassrls))then
  raise exception 'Trusted media executor required' using errcode='42501';end if;
 select role into actor_role from ace.roles where user_id=actor and role in ('editor','admin') for share;
 if not found then raise exception 'Editorial authentication required' using errcode='42501';end if;
 if p_question is null or p_version is null or p_version<1 or p_request is null
 or alt is null or length(alt) not between 8 and 500
 or rights is null or length(rights) not between 1 and 4000
 or p_mime is null or p_mime not in ('image/png','image/jpeg','image/webp')
 or p_size is null or p_size not between 1 and 2097152
 or p_sha256 is null or p_sha256 !~ '^[0-9a-f]{64}$' then
  raise exception 'Invalid media intent' using errcode='22023';end if;

 perform pg_advisory_xact_lock(hashtextextended('ace.question.workflow',0));
 select * into q from ace.questions where id=p_question for update;
 if not found or q.active or q.review_status not in ('draft','rejected')
 or q.content_version<>p_version then
  raise exception 'Private current question required' using errcode='23514';end if;
 if q.created_by<>actor and actor_role<>'admin' then
  raise exception 'Question owner permission required' using errcode='42501';end if;

 select * into existing from ace.question_media_intents
 where requested_by=actor and request_id=p_request for update;
 if found then
  if existing.question_id<>p_question or existing.question_version<>p_version
  or existing.alt_text<>alt or existing.rights_evidence<>rights
  or existing.claimed_mime<>p_mime or existing.claimed_size_bytes<>p_size
  or existing.claimed_sha256<>p_sha256 then
   raise exception 'Media request ID already used' using errcode='23505';end if;
  if existing.status='pending' and existing.expires_at<=now() then
   raise exception 'Media intent expired' using errcode='23514';end if;
  return jsonb_build_object('id',existing.id,'question_id',existing.question_id,
    'question_version',existing.question_version,'storage_path',existing.storage_path,
    'status',existing.status,'expires_at',existing.expires_at);
 end if;
 if (select count(*) from ace.question_media_intents where question_id=p_question
  and question_version=p_version and (status='verified' or expires_at>now()))>=4 then
  raise exception 'Media intent limit reached' using errcode='23514';end if;

 asset:=gen_random_uuid();
 insert into ace.question_media_intents (
   id,question_id,question_version,requested_by,request_id,storage_path,
   claimed_mime,claimed_size_bytes,claimed_sha256,alt_text,rights_evidence
 ) values (
   asset,p_question,p_version,actor,p_request,
   'staging/v1/'||p_question::text||'/'||asset::text,
   p_mime,p_size,p_sha256,alt,rights
 ) returning * into new_row;
 return jsonb_build_object('id',new_row.id,'question_id',new_row.question_id,
   'question_version',new_row.question_version,'storage_path',new_row.storage_path,
   'status',new_row.status,'expires_at',new_row.expires_at);
end;$$;

-- Trusted processor attestation only. Does not authorize publication or
-- insert ace.question_media; the later reviewed storage lifecycle must do so.
create function ace.confirm_question_media_intent(
 p_intent uuid,p_actual_mime text,p_actual_bytes integer,p_actual_sha256 text
) returns jsonb language plpgsql security definer
set search_path=pg_catalog,pg_temp set lock_timeout='3s' as $$
declare
 actor uuid:=auth.uid();
 actor_role text;
 q ace.questions%rowtype;
 intent ace.question_media_intents%rowtype;
begin
 if actor is null then raise exception 'Editorial authentication required' using errcode='42501';end if;
 if current_setting('transaction_isolation')<>'read committed' then
  raise exception 'Read committed transaction required' using errcode='25001';end if;
 if not exists(select 1 from pg_catalog.pg_roles where rolname=current_user and(rolsuper or rolbypassrls))then
  raise exception 'Trusted media executor required' using errcode='42501';end if;
 select role into actor_role from ace.roles where user_id=actor and role in('editor','admin') for share;
 if not found then raise exception 'Editorial authentication required' using errcode='42501';end if;
 if p_intent is null or p_actual_mime is null or p_actual_bytes is null
 or p_actual_sha256 is null then raise exception 'Invalid verified media metadata' using errcode='22023';end if;

 perform pg_advisory_xact_lock(hashtextextended('ace.question.workflow',0));
 select * into intent from ace.question_media_intents where id=p_intent for update;
 if not found or intent.requested_by<>actor then
  raise exception 'Media intent unavailable' using errcode='42501';end if;
 select * into q from ace.questions where id=intent.question_id for update;
 if not found or q.active or q.review_status not in ('draft','rejected')
 or q.content_version<>intent.question_version or
 (q.created_by<>actor and actor_role<>'admin') then
  raise exception 'Private current question required' using errcode='23514';end if;
 if intent.claimed_mime<>p_actual_mime or intent.claimed_size_bytes<>p_actual_bytes
 or intent.claimed_sha256<>p_actual_sha256 then
  raise exception 'Verified media does not match reservation' using errcode='23514';end if;
 if intent.status='pending' then
  if intent.expires_at<=now() then
   raise exception 'Media intent expired' using errcode='23514';end if;
  update ace.question_media_intents set status='verified',verified_at=clock_timestamp()
   where id=intent.id returning * into intent;
 end if;
 return jsonb_build_object('id',intent.id,'question_id',intent.question_id,
  'question_version',intent.question_version,'status',intent.status);
end;$$;

revoke all on function ace.reserve_question_media_intent(uuid,integer,uuid,text,text,text,integer,text)
 from public,anon,authenticated;
revoke all on function ace.confirm_question_media_intent(uuid,text,integer,text)
 from public,anon,authenticated;
commit;

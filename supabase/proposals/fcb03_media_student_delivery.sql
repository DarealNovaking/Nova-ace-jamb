-- SOURCE-ONLY proposal. Depends on fcb03_media_intents.sql and the
-- private rich-content validator. Do not apply to production without explicit
-- approval of the complete schema + function + private Storage release package.
begin;

-- Rich documents are stored in the immutable question-version snapshot. The
-- current authoring workflow deliberately remains text-only until its paired
-- review/publication contract is implemented.
alter table ace.questions add column if not exists rich_content jsonb;
comment on column ace.questions.rich_content is
 'FCB-03 versioned structured content; must be validated and independently reviewed before publication.';

-- Publication promotion copies a verified staging object to a new immutable
-- published path, then inserts the metadata row for the exact published version.
alter table ace.question_media add column if not exists intent_id uuid;
alter table ace.question_media add column if not exists question_version integer;
alter table ace.question_media add column if not exists sha256 text;
alter table ace.question_media add column if not exists verified_at timestamptz;
alter table ace.question_media add column if not exists reviewed_by uuid references auth.users(id);
alter table ace.question_media add column if not exists reviewed_at timestamptz;
alter table ace.question_media add column if not exists rights_evidence text;
alter table ace.question_media add column if not exists rights_reviewed_by uuid references auth.users(id);
alter table ace.question_media add column if not exists rights_reviewed_at timestamptz;

do $constraints$
begin
 if not exists(select 1 from pg_catalog.pg_constraint where conname='question_media_intent_id_fkey'
   and conrelid='ace.question_media'::regclass) then
  alter table ace.question_media add constraint question_media_intent_id_fkey
   foreign key(intent_id) references ace.question_media_intents(id);
 end if;
 if not exists(select 1 from pg_catalog.pg_constraint where conname='question_media_version_positive'
   and conrelid='ace.question_media'::regclass) then
  alter table ace.question_media add constraint question_media_version_positive
   check(question_version is null or question_version>0);
 end if;
 if not exists(select 1 from pg_catalog.pg_constraint where conname='question_media_sha256_valid'
   and conrelid='ace.question_media'::regclass) then
  alter table ace.question_media add constraint question_media_sha256_valid
   check(sha256 is null or sha256 ~ '^[0-9a-f]{64}$');
 end if;
 if not exists(select 1 from pg_catalog.pg_constraint where conname='question_media_intent_identity'
   and conrelid='ace.question_media'::regclass) then
  alter table ace.question_media add constraint question_media_intent_identity
   check(intent_id is null or id=intent_id);
 end if;
 if not exists(select 1 from pg_catalog.pg_constraint where conname='question_media_review_state_consistency'
   and conrelid='ace.question_media'::regclass) then
  alter table ace.question_media add constraint question_media_review_state_consistency
   check((reviewed_by is null and reviewed_at is null) or
         (reviewed_by is not null and reviewed_at is not null));
 end if;
  if not exists(select 1 from pg_catalog.pg_constraint where conname='question_media_rights_review_state_consistency'
    and conrelid='ace.question_media'::regclass) then
   alter table ace.question_media add constraint question_media_rights_review_state_consistency
    check((rights_reviewed_by is null and rights_reviewed_at is null and rights_evidence is null) or
          (rights_reviewed_by is not null and rights_reviewed_at is not null and
           rights_evidence is not null and length(rights_evidence) between 8 and 4000));
  end if;
end
$constraints$;
create unique index if not exists question_media_intent_unique
 on ace.question_media(intent_id) where intent_id is not null;

-- Immutable-by-privilege audit of independent media-rights decisions.
create table if not exists ace.question_media_reviews (
 id uuid primary key default gen_random_uuid(),
 intent_id uuid not null references ace.question_media_intents(id),
 question_version integer not null check(question_version>0),
 reviewed_by uuid not null references auth.users(id),
 decision text not null check(decision in('approved','rejected')),
 rights_status text not null check(rights_status in('owned','licensed','permitted','restricted','rejected')),
 rights_evidence text not null check(length(rights_evidence) between 8 and 4000),
 reviewed_at timestamptz not null default clock_timestamp(),
 constraint question_media_review_decision_rights check(
  (decision='approved' and rights_status in('owned','licensed','permitted')) or
  (decision='rejected' and rights_status in('restricted','rejected'))
 )
);
create index if not exists question_media_reviews_intent_revision
 on ace.question_media_reviews(intent_id,question_version,reviewed_at desc);
alter table ace.question_media_reviews enable row level security;
revoke all on ace.question_media_reviews from public,anon,authenticated;

create function ace.authorize_attempt_question_media(
 p_attempt_id uuid,p_question_id uuid,p_asset_id uuid
) returns jsonb
language plpgsql security definer
set search_path=pg_catalog,ace,pg_temp
set lock_timeout='3s'
as $$
declare
 actor uuid:=auth.uid();
 a ace.attempts%rowtype;
 q ace.questions%rowtype;
 version_row ace.question_versions%rowtype;
 media ace.question_media%rowtype;
 intent ace.question_media_intents%rowtype;
 frozen jsonb;
 match_count integer;
 version_number integer;
begin
 if actor is null then raise exception 'Authentication required' using errcode='28000';end if;
 if p_attempt_id is null or p_question_id is null or p_asset_id is null then
  raise exception 'Invalid media request' using errcode='22023';end if;
 if current_setting('transaction_isolation')<>'read committed' then
  raise exception 'Read committed transaction required' using errcode='25001';end if;
 if not exists(select 1 from pg_catalog.pg_roles
  where rolname=current_user and(rolsuper or rolbypassrls))then
  raise exception 'Trusted media executor required' using errcode='42501';end if;

 -- Only the student's own live attempt qualifies. Completed, paused,
 -- abandoned, expired, future-dated and another user's attempts never qualify.
 select * into a from ace.attempts
 where id=p_attempt_id and user_id=actor and status='active'
  and duration_seconds between 60 and 86400
  and started_at<=clock_timestamp()
  and started_at+duration_seconds*interval '1 second'>clock_timestamp()
 for share;
 if not found then return null;end if;

 if jsonb_typeof(a.question_order) is distinct from 'array'
 or jsonb_typeof(a.question_snapshot) is distinct from 'array' then
  return null;
 end if;
 if jsonb_array_length(a.question_order) not between 1 and 500
 or jsonb_array_length(a.question_snapshot)<>jsonb_array_length(a.question_order) then
  return null;
 end if;
 if not exists(select 1 from jsonb_array_elements_text(a.question_order) wanted(id)
  where wanted.id=p_question_id::text) then return null;end if;
 select count(*) into match_count from jsonb_array_elements(a.question_snapshot) item
  where item->>'id'=p_question_id::text;
 if match_count<>1 then return null;end if;
 select item into frozen from jsonb_array_elements(a.question_snapshot) item
  where item->>'id'=p_question_id::text;
 if coalesce(frozen->>'content_version','') !~ '^[1-9][0-9]{0,8}$' then return null;end if;
 version_number:=(frozen->>'content_version')::integer;

 -- Withdrawal, changed publication revision or rights restrictions revoke
 -- future delivery even for an attempt that originally included the asset.
 select * into q from ace.questions
 where id=p_question_id and active=true and review_status='published'
  and rights_status in('owned','licensed','permitted')
 for share;
 if not found then return null;end if;
 if q.reviewed_by is null or q.reviewed_by=q.created_by
  or q.reviewed_by::text is not distinct from (q.provenance->>'last_content_editor') then
  return null;
 end if;

 -- A student's attempt is frozen to the historical revision captured at start.
 -- A newer currently-published revision must not silently replace that paper;
 -- old media stays available only while the question remains published and its
 -- own revision/asset rights are still approved.
 select * into version_row from ace.question_versions
 where question_id=p_question_id and version=version_number
 for share;
 if not found or version_row.snapshot->>'id' is distinct from p_question_id::text
  or version_row.snapshot->>'content_version' is distinct from version_number::text
  or version_row.snapshot->>'review_status' is distinct from 'published'
  or version_row.snapshot->>'active' is distinct from 'true'
  or coalesce(version_row.snapshot->>'rights_status','') not in('owned','licensed','permitted')
  or version_row.snapshot->>'reviewed_by' is null
  or version_row.snapshot->>'reviewed_by' is not distinct from version_row.snapshot->>'created_by'
  or version_row.snapshot->>'reviewed_by' is not distinct from (version_row.snapshot->'provenance'->>'last_content_editor')
  or jsonb_typeof(version_row.snapshot->'rich_content') is distinct from 'object'
  or jsonb_typeof(version_row.snapshot->'rich_content'->'blocks') is distinct from 'array' then
  return null;
 end if;
 -- Revalidate the exact immutable document at the delivery boundary too.
 perform ace.validate_rich_question_content(version_row.snapshot->'rich_content');

 -- The exact immutable version must reference this asset and the same
 -- descriptive alt text. A guessed UUID or asset from another revision fails.
 select m.* into media from ace.question_media m
 where m.id=p_asset_id and m.question_id=p_question_id
  and m.intent_id=m.id and m.question_version=version_number
  and m.kind in('image','diagram')
  and m.rights_status in('owned','licensed','permitted')
  and m.reviewed_by::text=version_row.snapshot->>'reviewed_by'
  and m.reviewed_by is not null
  and m.reviewed_by::text is distinct from version_row.snapshot->>'created_by'
  and m.reviewed_by::text is distinct from (version_row.snapshot->'provenance'->>'last_content_editor')
  and m.reviewed_at is not null
  and m.rights_reviewed_by::text=version_row.snapshot->>'reviewed_by'
  and m.rights_reviewed_at is not null
  and length(m.rights_evidence) between 8 and 4000
  and m.reviewed_by=m.rights_reviewed_by
  -- The newest immutable decision is authoritative. An earlier approval must
  -- never override a later rejection/restriction (rights takedown).
  and (select rights_review.decision='approved'
    and rights_review.rights_status=m.rights_status
    and rights_review.reviewed_by=m.rights_reviewed_by
    and rights_review.rights_evidence=m.rights_evidence
    and rights_review.reviewed_at=m.rights_reviewed_at
    and rights_review.reviewed_by::text=version_row.snapshot->>'reviewed_by'
   from ace.question_media_reviews rights_review
   where rights_review.intent_id=m.intent_id
    and rights_review.question_version=m.question_version-1
   order by rights_review.reviewed_at desc,rights_review.id desc limit 1) is true
  and m.mime_type in('image/png','image/jpeg','image/webp')
  and m.size_bytes between 1 and 2097152
  and m.sha256 ~ '^[0-9a-f]{64}$'
  and m.verified_at is not null
  and m.storage_path='published/v1/'||p_question_id::text||'/'||version_number::text||'/'||p_asset_id::text
 for share;
 if not found then return null;end if;
 if not exists(
  select 1 from jsonb_array_elements(version_row.snapshot->'rich_content'->'blocks') b(value)
  where b.value->>'type'='image'
   and b.value->>'asset_id'=p_asset_id::text
   and b.value->>'alt'=media.alt_text
 ) then return null;end if;

 -- A verified staging intent is provenance, not a public URL. It must match
 -- the immutable promoted object byte-for-byte; intent version can be older
 -- because guarded publication promotion binds it to this published revision.
 select * into intent from ace.question_media_intents
 where id=media.intent_id and question_id=media.question_id
  and status='verified' and verified_at is not null
  and question_version<=version_number
  and storage_path='staging/v1/'||media.question_id::text||'/'||media.intent_id::text
  and claimed_mime=media.mime_type
  and claimed_size_bytes=media.size_bytes
  and claimed_sha256=media.sha256
  and requested_by<>media.reviewed_by
  and length(rights_evidence) between 1 and 4000
 for share;
 if not found then return null;end if;

 -- Return only the exact server-owned private path and integrity metadata.
 -- Never return source/rights evidence, correct answers, explanations, or a URL.
 return jsonb_build_object(
  'id',media.id,'question_id',media.question_id,
  'question_version',media.question_version,'storage_path',media.storage_path,
  'mime_type',media.mime_type,'size_bytes',media.size_bytes,'sha256',media.sha256
 );
end;
$$;

revoke all on function ace.authorize_attempt_question_media(uuid,uuid,uuid)
 from public,anon,authenticated;
commit;

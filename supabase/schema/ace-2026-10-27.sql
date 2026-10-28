-- Catalog-derived recovery baseline, 2026-10-27. NOT a migration or production script.

-- Empty disposable database only; requires postgres owner, Supabase auth/roles and vector.

-- Contains no data, secrets or migration-ledger SQL. See README.md in this directory.

BEGIN;

CREATE SCHEMA ace AUTHORIZATION postgres;

SET LOCAL search_path = pg_catalog, public, extensions;

SET LOCAL check_function_bodies = false;

CREATE TABLE ace."ai_providers" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "enabled" boolean DEFAULT false NOT NULL,
  "priority" integer DEFAULT 100 NOT NULL,
  "capabilities" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE ace."ai_requests" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid,
  "provider_id" uuid,
  "feature" text NOT NULL,
  "prompt_version" text,
  "grounding_source_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
  "input_hash" text,
  "response_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "status" text DEFAULT 'started'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "completed_at" timestamp with time zone
);

CREATE TABLE ace."ai_usage" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid,
  "provider_id" uuid,
  "feature" text NOT NULL,
  "model" text,
  "input_tokens" integer,
  "output_tokens" integer,
  "status" text DEFAULT 'success'::text NOT NULL,
  "latency_ms" integer,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE ace."attempt_answers" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "attempt_id" uuid NOT NULL,
  "question_id" uuid NOT NULL,
  "selected_option_key" text,
  "is_correct" boolean,
  "response_ms" integer,
  "answered_at" timestamp with time zone
);

CREATE TABLE ace."attempts" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "mode" text NOT NULL,
  "subject_id" uuid,
  "started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "completed_at" timestamp with time zone,
  "duration_seconds" integer,
  "random_seed" bigint,
  "question_order" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "option_order" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "status" text DEFAULT 'active'::text NOT NULL,
  "score" numeric,
  "correct_count" integer DEFAULT 0 NOT NULL,
  "answered_count" integer DEFAULT 0 NOT NULL
);

CREATE TABLE ace."audit_events" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "actor_user_id" uuid,
  "event_type" text NOT NULL,
  "entity_type" text,
  "entity_id" uuid,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE ace."catalog_import_batches" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "source_id" uuid NOT NULL,
  "season_id" uuid,
  "dataset_type" text NOT NULL,
  "status" text DEFAULT 'staged'::text NOT NULL,
  "row_count" integer DEFAULT 0 NOT NULL,
  "validation_errors" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "snapshot_hash" text
);

CREATE TABLE ace."catalog_import_rows" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "batch_id" uuid NOT NULL,
  "row_number" integer NOT NULL,
  "entity_type" text NOT NULL,
  "external_key" text,
  "payload" jsonb NOT NULL,
  "validation_status" text DEFAULT 'pending'::text NOT NULL,
  "validation_errors" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "published_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE ace."catalog_sources" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "source_type" text NOT NULL,
  "title" text NOT NULL,
  "source_url" text NOT NULL,
  "retrieved_at" timestamp with time zone DEFAULT now() NOT NULL,
  "content_hash" text,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "status" text DEFAULT 'discovered'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE ace."devices" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "device_hash" text NOT NULL,
  "platform" text,
  "app_version" text,
  "push_token" text,
  "last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);

CREATE TABLE ace."entitlements" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "product_id" uuid,
  "source" text NOT NULL,
  "payment_id" uuid,
  "starts_at" timestamp with time zone NOT NULL,
  "ends_at" timestamp with time zone NOT NULL,
  "status" text DEFAULT 'active'::text NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE ace."exam_config_subjects" (
  "exam_config_id" uuid NOT NULL,
  "subject_id" uuid NOT NULL,
  "required" boolean DEFAULT false NOT NULL,
  "question_count" smallint NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);

CREATE TABLE ace."exam_configs" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "season_id" uuid NOT NULL,
  "name" text NOT NULL,
  "duration_seconds" integer NOT NULL,
  "total_questions" integer NOT NULL,
  "option_count" smallint DEFAULT 4 NOT NULL,
  "composition" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "rules" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "version" integer DEFAULT 1 NOT NULL,
  "active" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE ace."exam_seasons" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "starts_at" timestamp with time zone,
  "ends_at" timestamp with time zone,
  "exam_year" smallint NOT NULL,
  "status" text DEFAULT 'draft'::text NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE ace."feature_flags" (
  "key" text NOT NULL,
  "enabled" boolean DEFAULT false NOT NULL,
  "rollout" numeric(5,2) DEFAULT 100 NOT NULL,
  "config" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE ace."flashcard_reviews" (
  "user_id" uuid NOT NULL,
  "flashcard_id" uuid NOT NULL,
  "review_count" integer DEFAULT 0 NOT NULL,
  "correct_count" integer DEFAULT 0 NOT NULL,
  "last_reviewed_at" timestamp with time zone,
  "next_review_at" timestamp with time zone,
  "ease" numeric(5,2) DEFAULT 2.5 NOT NULL,
  "interval_days" numeric(8,2) DEFAULT 0 NOT NULL
);

CREATE TABLE ace."flashcards" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "subject_id" uuid,
  "topic_id" uuid,
  "subtopic_id" uuid,
  "front" text NOT NULL,
  "back" text NOT NULL,
  "source_type" text DEFAULT 'platform'::text NOT NULL,
  "source_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "content_version" integer DEFAULT 1 NOT NULL,
  "created_by" uuid,
  "reviewed_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE ace."institutions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "jamb_code" text,
  "name" text NOT NULL,
  "institution_type" text NOT NULL,
  "ownership" text,
  "state" text,
  "status" text DEFAULT 'active'::text NOT NULL,
  "source_url" text,
  "provenance" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE ace."knowledge_chunks" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "source_id" uuid NOT NULL,
  "chunk_text" text NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "embedding" vector(768),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE ace."knowledge_sources" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "source_type" text NOT NULL,
  "source_url" text,
  "rights_status" text DEFAULT 'pending'::text NOT NULL,
  "provenance" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "version" integer DEFAULT 1 NOT NULL,
  "active" boolean DEFAULT false NOT NULL,
  "created_by" uuid,
  "reviewed_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE ace."learning_progress" (
  "user_id" uuid NOT NULL,
  "subject_id" uuid NOT NULL,
  "topic_id" uuid NOT NULL,
  "subtopic_id" uuid NOT NULL,
  "status" text DEFAULT 'not_started'::text NOT NULL,
  "mastery" numeric(6,3) DEFAULT 0 NOT NULL,
  "exposure_count" integer DEFAULT 0 NOT NULL,
  "completed_count" integer DEFAULT 0 NOT NULL,
  "last_activity_at" timestamp with time zone,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE ace."notification_preferences" (
  "user_id" uuid NOT NULL,
  "in_app" boolean DEFAULT true NOT NULL,
  "push" boolean DEFAULT true NOT NULL,
  "email" boolean DEFAULT true NOT NULL,
  "marketing" boolean DEFAULT false NOT NULL,
  "categories" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE ace."notifications" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid,
  "type" text NOT NULL,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "scheduled_at" timestamp with time zone,
  "sent_at" timestamp with time zone,
  "read_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE ace."payment_events" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "provider_id" uuid,
  "event_id" text,
  "event_type" text NOT NULL,
  "provider_reference" text,
  "payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "processed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE ace."payment_providers" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "enabled" boolean DEFAULT false NOT NULL,
  "config" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE ace."payments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "provider_id" uuid,
  "product_id" uuid,
  "provider_reference" text NOT NULL,
  "amount_minor" integer NOT NULL,
  "currency" text DEFAULT 'NGN'::text NOT NULL,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "provider_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "verified_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE ace."product_events" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid,
  "event_type" text NOT NULL,
  "entity_type" text,
  "entity_id" uuid,
  "session_id" text,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE ace."products" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "price_minor" integer NOT NULL,
  "currency" text DEFAULT 'NGN'::text NOT NULL,
  "season_id" uuid,
  "duration_days" integer,
  "active" boolean DEFAULT true NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE ace."profiles" (
  "id" uuid NOT NULL,
  "email" text,
  "display_name" text,
  "target_score" smallint,
  "institution" text,
  "course" text,
  "prep_time_minutes" integer,
  "exam_season" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "institution_id" uuid,
  "program_id" uuid
);

CREATE TABLE ace."program_utme_rules" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "season_id" uuid NOT NULL,
  "program_id" uuid NOT NULL,
  "required_subject_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
  "alternative_groups" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "minimum_optional_subjects" smallint DEFAULT 0 NOT NULL,
  "notes" text,
  "source_url" text,
  "provenance" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "status" text DEFAULT 'draft'::text NOT NULL,
  "version" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE ace."programs" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "institution_id" uuid NOT NULL,
  "jamb_code" text,
  "name" text NOT NULL,
  "award_level" text DEFAULT 'degree'::text NOT NULL,
  "duration_years" smallint,
  "status" text DEFAULT 'active'::text NOT NULL,
  "source_url" text,
  "provenance" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE ace."question_media" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "question_id" uuid NOT NULL,
  "kind" text NOT NULL,
  "storage_provider" text DEFAULT 'supabase'::text NOT NULL,
  "storage_path" text NOT NULL,
  "mime_type" text NOT NULL,
  "size_bytes" bigint,
  "alt_text" text,
  "rights_status" text DEFAULT 'pending'::text NOT NULL,
  "source_url" text,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE ace."question_versions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "question_id" uuid NOT NULL,
  "version" integer NOT NULL,
  "snapshot" jsonb NOT NULL,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE ace."questions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "subject_id" uuid NOT NULL,
  "topic_id" uuid NOT NULL,
  "subtopic_id" uuid,
  "stem" text NOT NULL,
  "options" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "correct_option_key" text NOT NULL,
  "explanation" text,
  "difficulty" text DEFAULT 'medium'::text NOT NULL,
  "exam" text DEFAULT 'JAMB'::text NOT NULL,
  "exam_year" smallint,
  "syllabus_ref" text,
  "media" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "provenance" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "rights_status" text DEFAULT 'unknown'::text NOT NULL,
  "content_version" integer DEFAULT 1 NOT NULL,
  "review_status" text DEFAULT 'draft'::text NOT NULL,
  "active" boolean DEFAULT false NOT NULL,
  "created_by" uuid,
  "reviewed_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE ace."referral_campaigns" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "season_id" uuid,
  "required_qualified_referrals" integer DEFAULT 5 NOT NULL,
  "reward_product_id" uuid,
  "qualification_rules" jsonb DEFAULT '{"registration": true, "meaningful_usage": true}'::jsonb NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE ace."referral_codes" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "code" text NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE ace."referral_rewards" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "campaign_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "qualified_count" integer DEFAULT 0 NOT NULL,
  "rewarded_at" timestamp with time zone,
  "entitlement_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE ace."referrals" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "referrer_user_id" uuid NOT NULL,
  "referred_user_id" uuid NOT NULL,
  "referral_code_id" uuid,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "qualified_at" timestamp with time zone,
  "qualification" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "abuse_flags" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE ace."roles" (
  "user_id" uuid NOT NULL,
  "role" text DEFAULT 'student'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE ace."student_preferences" (
  "user_id" uuid NOT NULL,
  "learning_style" text,
  "daily_minutes" integer,
  "preferred_study_days" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "timezone" text,
  "preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE ace."student_question_stats" (
  "user_id" uuid NOT NULL,
  "question_id" uuid NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "correct_count" integer DEFAULT 0 NOT NULL,
  "incorrect_count" integer DEFAULT 0 NOT NULL,
  "total_response_ms" bigint DEFAULT 0 NOT NULL,
  "last_answered_at" timestamp with time zone
);

CREATE TABLE ace."student_subjects" (
  "user_id" uuid NOT NULL,
  "subject_id" uuid NOT NULL,
  "is_primary" boolean DEFAULT false NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE ace."study_plan_items" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "plan_id" uuid NOT NULL,
  "position" integer NOT NULL,
  "scheduled_for" date,
  "activity_type" text NOT NULL,
  "subject_id" uuid,
  "topic_id" uuid,
  "subtopic_id" uuid,
  "target_count" integer,
  "target_minutes" integer,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "completed_at" timestamp with time zone
);

CREATE TABLE ace."study_plans" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "season_id" uuid,
  "title" text NOT NULL,
  "goal_score" smallint,
  "starts_on" date,
  "ends_on" date,
  "status" text DEFAULT 'active'::text NOT NULL,
  "generated_by" text DEFAULT 'system'::text NOT NULL,
  "plan" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE ace."subjects" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE ace."subtopics" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "topic_id" uuid NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "syllabus_version_id" uuid
);

CREATE TABLE ace."syllabus_versions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "season_id" uuid NOT NULL,
  "subject_id" uuid NOT NULL,
  "version" integer DEFAULT 1 NOT NULL,
  "title" text NOT NULL,
  "source_url" text,
  "source_title" text,
  "rights_status" text DEFAULT 'pending'::text NOT NULL,
  "provenance" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "status" text DEFAULT 'draft'::text NOT NULL,
  "activated_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE ace."topics" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "subject_id" uuid NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "syllabus_version_id" uuid
);

CREATE OR REPLACE FUNCTION ace.activate_exam_config(p_exam_config_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'ace'
AS $function$
declare v_season uuid; v_status text; validation jsonb; v_prior jsonb;
begin
 if auth.uid() is null or not ace.is_admin() then raise exception 'Administrator approval required' using errcode='42501'; end if;
 if p_exam_config_id is null then raise exception 'Configuration required' using errcode='22023'; end if;
 select season_id into v_season from ace.exam_configs where id=p_exam_config_id;
 if not found then raise exception 'Configuration unavailable' using errcode='P0002'; end if;
 -- Serialize different target configurations too, keeping one active per season.
 select status into v_status from ace.exam_seasons where id=v_season for update;
 if not found then raise exception 'Season unavailable' using errcode='P0002'; end if;
 if v_status in ('closed','archived') then raise exception 'Closed season cannot be activated' using errcode='22023'; end if;
 perform id from ace.exam_configs where season_id=v_season order by id for update;
 if not exists(select 1 from ace.exam_configs where id=p_exam_config_id and season_id=v_season) then
  raise exception 'Configuration unavailable' using errcode='P0002';
 end if;
 validation:=ace.validate_exam_config(p_exam_config_id);
 if coalesce((validation->>'valid')::boolean,false) is not true then raise exception 'Invalid exam configuration' using errcode='22023'; end if;
 select coalesce(jsonb_agg(id order by id),'[]'::jsonb) into v_prior from ace.exam_configs where season_id=v_season and active;
 if v_prior=jsonb_build_array(p_exam_config_id) then return; end if;
 update ace.exam_configs set active=false where season_id=v_season and id<>p_exam_config_id and active;
 -- Version identifies the configuration; activating it must not collide with a later draft.
 update ace.exam_configs set active=true where id=p_exam_config_id;
 insert into ace.audit_events(actor_user_id,event_type,entity_type,entity_id,metadata)
 values(auth.uid(),'exam_config_activated','exam_config',p_exam_config_id,jsonb_build_object('season_id',v_season,'previous_active',v_prior));
end;
$function$;

CREATE OR REPLACE FUNCTION ace.activate_exam_season(p_season_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'ace'
AS $function$
declare v_status text; v_config uuid; v_prior jsonb;
begin
 if auth.uid() is null or not ace.is_admin() then raise exception 'Administrator approval required' using errcode='42501'; end if;
 if p_season_id is null then raise exception 'Season required' using errcode='22023'; end if;
 -- Rare approval operation: serialize all targets before choosing the new active season.
 lock table ace.exam_seasons in share row exclusive mode;
 -- Lock every season row too: a stale REPEATABLE READ snapshot must fail safely.
 perform id from ace.exam_seasons order by id for update;
 select status into v_status from ace.exam_seasons where id=p_season_id for update;
 if not found then raise exception 'Season unavailable' using errcode='P0002'; end if;
 if v_status in ('closed','archived') then raise exception 'Closed season cannot be activated' using errcode='22023'; end if;
 if (select count(*) from ace.exam_configs where season_id=p_season_id and active)<>1 then
  raise exception 'Season requires one approved configuration' using errcode='22023';
 end if;
 select id into v_config from ace.exam_configs where season_id=p_season_id and active for share;
 if coalesce((ace.validate_exam_config(v_config)->>'valid')::boolean,false) is not true then
  raise exception 'Season configuration invalid' using errcode='22023';
 end if;
 if exists(select 1 from ace.exam_config_subjects cs where cs.exam_config_id=v_config
   and not exists(select 1 from ace.syllabus_versions v where v.season_id=p_season_id
     and v.subject_id=cs.subject_id and v.status='active' and v.rights_status='approved'
     and exists(select 1 from ace.topics t join ace.subtopics st on st.topic_id=t.id
       where t.syllabus_version_id=v.id and st.syllabus_version_id=v.id and t.active and st.active))) then
  raise exception 'Configured subjects require approved published syllabus trees' using errcode='22023';
 end if;
 select coalesce(jsonb_agg(id order by id),'[]'::jsonb) into v_prior from ace.exam_seasons where status='active';
 if v_prior=jsonb_build_array(p_season_id) then return; end if;
 update ace.exam_seasons set status='archived',updated_at=clock_timestamp() where status='active' and id<>p_season_id;
 update ace.exam_seasons set status='active',updated_at=clock_timestamp() where id=p_season_id;
 insert into ace.audit_events(actor_user_id,event_type,entity_type,entity_id,metadata)
 values(auth.uid(),'exam_season_activated','exam_season',p_season_id,jsonb_build_object('previous_active',v_prior,'exam_config_id',v_config));
end;
$function$;

CREATE OR REPLACE FUNCTION ace.activate_syllabus_version(p_syllabus_version_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'ace'
AS $function$
declare
  v_user uuid := auth.uid();
  v_season_id uuid;
  v_subject_id uuid;
  v_rights text;
  v_topics integer;
begin
  if v_user is null or not ace.is_admin_or_editor() then raise exception 'Admin/editor access required'; end if;
  select season_id,subject_id,rights_status into v_season_id,v_subject_id,v_rights from ace.syllabus_versions where id=p_syllabus_version_id;
  if v_season_id is null then raise exception 'Syllabus version not found'; end if;
  if v_rights <> 'approved' then raise exception 'Syllabus version requires approved rights status'; end if;
  select count(*) into v_topics from ace.topics where syllabus_version_id=p_syllabus_version_id and active=true;
  if v_topics < 1 then raise exception 'Syllabus version must contain at least one active topic'; end if;
  update ace.syllabus_versions set status='archived', updated_at=now() where season_id=v_season_id and subject_id=v_subject_id and id<>p_syllabus_version_id;
  update ace.syllabus_versions set status='active', activated_at=now(), updated_at=now() where id=p_syllabus_version_id;
end;
$function$;

CREATE OR REPLACE FUNCTION ace.approve_catalog_batch(p_batch_id uuid)
 RETURNS ace.catalog_import_batches
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'ace', 'public'
AS $function$
declare
  batch_row ace.catalog_import_batches;
  invalid_count bigint;
  approved_batch ace.catalog_import_batches;
begin
  if auth.uid() is null or not ace.is_admin() then
    raise exception 'admin role required';
  end if;

  select * into batch_row
  from ace.catalog_import_batches
  where id = p_batch_id
  for update;

  if not found then
    raise exception 'catalog import batch not found';
  end if;

  if batch_row.status <> 'reviewing' then
    raise exception 'batch must be reviewing before approval (current: %)', batch_row.status;
  end if;

  select count(*) into invalid_count
  from ace.catalog_import_rows
  where batch_id = p_batch_id
    and validation_status <> 'valid';

  if invalid_count > 0 then
    raise exception 'cannot approve batch with % unvalidated or invalid rows', invalid_count;
  end if;

  update ace.catalog_import_rows
  set validation_status = 'approved', validation_errors = '[]'::jsonb
  where batch_id = p_batch_id;

  update ace.catalog_import_batches
  set status = 'approved', updated_at = now()
  where id = p_batch_id
  returning * into approved_batch;

  insert into ace.audit_events(actor_user_id,event_type,entity_type,entity_id,metadata)
  values (auth.uid(),'catalog_batch_approved','catalog_import_batch',p_batch_id,
          jsonb_build_object('row_count',approved_batch.row_count,'dataset_type',approved_batch.dataset_type,'source_id',approved_batch.source_id));

  return approved_batch;
end;
$function$;

CREATE OR REPLACE FUNCTION ace.can_manage_catalog()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'ace', 'public'
AS $function$
  select exists (
    select 1
    from ace.roles
    where user_id = auth.uid()
      and role in ('admin', 'editor')
  );
$function$;

CREATE OR REPLACE FUNCTION ace.check_catalog_import_idempotency(p_snapshot_hash text)
 RETURNS TABLE(id uuid, status text, row_count integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'ace'
AS $function$
 select b.id,b.status,b.row_count from ace.catalog_import_batches b
 where auth.uid() is not null and ace.is_admin_or_editor() and b.snapshot_hash=p_snapshot_hash
 limit 1;
$function$;

CREATE OR REPLACE FUNCTION ace.get_active_exam_blueprint()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'pg_catalog', 'ace'
AS $function$
select coalesce((
  select jsonb_build_object(
    'season', to_jsonb(s),
    'config', to_jsonb(c),
    'subjects', coalesce((select jsonb_agg(to_jsonb(cs) order by cs.sort_order, cs.subject_id) from ace.exam_config_subjects cs where cs.exam_config_id=c.id),'[]'::jsonb)
  )
  from ace.exam_seasons s
  join ace.exam_configs c on c.season_id=s.id and c.active=true
  where s.status='active'
  order by s.exam_year desc, c.version desc
  limit 1
),'{}'::jsonb);
$function$;

CREATE OR REPLACE FUNCTION ace.get_catalog_institutions()
 RETURNS TABLE(id uuid, name text, state text, institution_type text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'ace'
AS $function$
 select i.id,i.name,i.state,i.institution_type from ace.institutions i
 where auth.uid() is not null and ace.is_admin_or_editor() and i.status='draft'
 order by i.name;
$function$;

CREATE OR REPLACE FUNCTION ace.get_catalog_source(p_source_id uuid)
 RETURNS TABLE(id uuid, title text, status text, source_type text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'ace'
AS $function$
 select s.id,s.title,s.status,s.source_type from ace.catalog_sources s
 where auth.uid() is not null and ace.is_admin_or_editor() and s.id=p_source_id;
$function$;

CREATE OR REPLACE FUNCTION ace.guard_exam_composition()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'ace'
AS $function$
declare v_old uuid; v_new uuid; c record;
begin
 if auth.uid() is null or not ace.is_admin_or_editor() then raise exception 'Configuration authoring permission required' using errcode='42501'; end if;
 if tg_op<>'INSERT' then v_old:=old.exam_config_id; end if;
 if tg_op<>'DELETE' then v_new:=new.exam_config_id; end if;
 -- Shared parent locks serialize draft writes against activation's exclusive lock.
 for c in select id,active from ace.exam_configs where id=any(array[v_old,v_new]) order by id for share loop
  if c.active then raise exception 'Active exam composition is immutable; create a draft version' using errcode='42501'; end if;
 end loop;
 insert into ace.audit_events(actor_user_id,event_type,entity_type,entity_id,metadata)
 values(auth.uid(),'exam_composition_changed','exam_config',coalesce(v_new,v_old),jsonb_build_object('operation',tg_op));
 if tg_op='DELETE' then return old; end if;
 return new;
end;
$function$;

CREATE OR REPLACE FUNCTION ace.guard_syllabus_authoring()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'ace'
AS $function$
declare
  v_user uuid := auth.uid();
  v_admin boolean := v_user is not null and ace.is_admin();
  v_version_id uuid;
  v_old_version_id uuid;
  v_version ace.syllabus_versions%rowtype;
  v_topic ace.topics%rowtype;
begin
  if v_user is null or not ace.is_admin_or_editor() then
    raise exception 'Academic authoring permission required' using errcode='42501';
  end if;

  if tg_table_name='syllabus_versions' then
    if not v_admin then
      if tg_op<>'INSERT' then
        if old.status<>'draft' or old.rights_status<>'pending' then
          raise exception 'Only administrators may change reviewed syllabus versions' using errcode='42501';
        end if;
      end if;
      if tg_op<>'DELETE' then
        if new.status<>'draft' or new.rights_status<>'pending' or new.activated_at is not null then
          raise exception 'Syllabus rights and publication require administrator review' using errcode='42501';
        end if;
        if tg_op='UPDATE' and (
          new.id is distinct from old.id
          or new.season_id is distinct from old.season_id
          or new.subject_id is distinct from old.subject_id
          or new.version is distinct from old.version
          or new.created_at is distinct from old.created_at
        ) then
          raise exception 'Syllabus version identity cannot be changed by editors' using errcode='42501';
        end if;
      end if;
    end if;

    if tg_op='INSERT' then
      insert into ace.audit_events(actor_user_id,event_type,entity_type,entity_id,metadata)
      values(v_user,'syllabus_version_created','syllabus_version',new.id,
        jsonb_build_object('status',new.status,'rights_status',new.rights_status));
    end if;

    if tg_op='UPDATE' and (
      new.status is distinct from old.status
      or new.rights_status is distinct from old.rights_status
      or new.activated_at is distinct from old.activated_at
    ) then
      insert into ace.audit_events(actor_user_id,event_type,entity_type,entity_id,metadata)
      values(v_user,'syllabus_authorization_changed','syllabus_version',new.id,
        jsonb_build_object('previous_status',old.status,'status',new.status,
          'previous_rights_status',old.rights_status,'rights_status',new.rights_status));
    elsif tg_op='DELETE' then
      insert into ace.audit_events(actor_user_id,event_type,entity_type,entity_id,metadata)
      values(v_user,'syllabus_version_deleted','syllabus_version',old.id,
        jsonb_build_object('status',old.status,'rights_status',old.rights_status));
    end if;
  elsif tg_table_name in ('topics','subtopics') and not v_admin then
    if tg_op<>'INSERT' then v_old_version_id:=old.syllabus_version_id; end if;
    if tg_op<>'DELETE' then v_version_id:=new.syllabus_version_id; else v_version_id:=v_old_version_id; end if;

    if tg_op='UPDATE' and v_version_id is distinct from v_old_version_id then
      raise exception 'Editors cannot move content between syllabus versions' using errcode='42501';
    end if;

    -- Lock the publication boundary so an editor write cannot race activation.
    select * into v_version from ace.syllabus_versions where id=v_version_id for share;
    if not found or v_version.status<>'draft' or v_version.rights_status<>'pending' then
      raise exception 'Editors may author only pending draft syllabus content' using errcode='42501';
    end if;

    if tg_op<>'DELETE' then
      if tg_table_name='topics' then
        if new.subject_id is distinct from v_version.subject_id then
          raise exception 'Topic subject must match its syllabus version' using errcode='42501';
        end if;
      elsif tg_table_name='subtopics' then
        select * into v_topic from ace.topics where id=new.topic_id for share;
        if not found or v_topic.syllabus_version_id is distinct from v_version_id then
          raise exception 'Subtopic parent must belong to its syllabus version' using errcode='42501';
        end if;
      end if;
    end if;
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION ace.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'ace'
AS $function$
declare v_try integer; v_code text;
begin
  insert into ace.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  insert into ace.roles (user_id, role)
  values (new.id, 'student')
  on conflict (user_id) do nothing;

  insert into ace.student_preferences (user_id, timezone)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'timezone', 'Africa/Lagos'))
  on conflict (user_id) do nothing;

  insert into ace.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  -- Keep existing short codes when available; handle prefix and legacy collisions.
  for v_try in 0..5 loop
    v_code := case v_try
      when 0 then 'ACE-' || upper(substr(replace(new.id::text, '-', ''), 1, 8))
      else 'ACE-' || upper(replace(gen_random_uuid()::text, '-', ''))
    end;
    insert into ace.referral_codes(user_id,code) values(new.id,v_code)
    on conflict do nothing;
    if exists(select 1 from ace.referral_codes where user_id=new.id) then
      return new;
    end if;
  end loop;
  raise exception 'Referral code allocation unavailable' using errcode='40001';

end;
$function$;

CREATE OR REPLACE FUNCTION ace.has_active_entitlement(p_user_id uuid, p_product_code text DEFAULT 'ace_pass'::text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'ace'
AS $function$
 select auth.uid() is not null
   and (p_user_id = auth.uid() or ace.is_admin())
   and exists (
     select 1 from ace.entitlements e join ace.products p on p.id=e.product_id
     where e.user_id=p_user_id and p.code=p_product_code and e.status='active'
       and now() >= e.starts_at and now() < e.ends_at
   );
$function$;

CREATE OR REPLACE FUNCTION ace.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'ace', 'public'
AS $function$
  select exists (select 1 from ace.roles where user_id = auth.uid() and role = 'admin');
$function$;

CREATE OR REPLACE FUNCTION ace.is_admin_or_editor()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'ace', 'public'
AS $function$
  select exists (select 1 from ace.roles where user_id = auth.uid() and role in ('admin','editor'));
$function$;

CREATE OR REPLACE FUNCTION ace.is_syllabus_version_public(p_syllabus_version_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'ace'
AS $function$
  select exists (
    select 1
    from ace.syllabus_versions sv
    where sv.id = p_syllabus_version_id
      and sv.status = 'active'
      and sv.rights_status = 'approved'
  );
$function$;

CREATE OR REPLACE FUNCTION ace.publish_catalog_batch(p_batch_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'ace', 'auth'
AS $function$
declare
  v_user uuid := auth.uid();
  v_batch ace.catalog_import_batches%rowtype;
  v_source ace.catalog_sources%rowtype;
  r record;
  v_institution_id uuid;
  v_program_id uuid;
  v_topic_id uuid;
  v_syllabus_version_id uuid;
  v_subject_ids uuid[];
  v_published integer := 0;
begin
  if v_user is null or not ace.is_admin_or_editor() then
    raise exception 'Admin/editor access required';
  end if;

  select * into v_batch from ace.catalog_import_batches where id = p_batch_id for update;
  if not found then raise exception 'Import batch not found'; end if;
  if v_batch.status <> 'approved' then raise exception 'Import batch must be approved before publication'; end if;

  select * into v_source from ace.catalog_sources where id = v_batch.source_id;
  if not found or v_source.status <> 'approved' then raise exception 'Catalog source must be approved before publication'; end if;

  if exists (select 1 from ace.catalog_import_rows where batch_id=p_batch_id and validation_status <> 'approved') then
    raise exception 'All import rows must be approved before publication';
  end if;

  if v_batch.dataset_type='institutions' then
    for r in select * from ace.catalog_import_rows where batch_id=p_batch_id order by row_number loop
      insert into ace.institutions (jamb_code,name,institution_type,ownership,state,status,source_url,provenance)
      values (nullif(r.payload->>'jamb_code',''), trim(r.payload->>'name'), r.payload->>'institution_type', nullif(r.payload->>'ownership',''), nullif(r.payload->>'state',''), 'draft', v_source.source_url,
        jsonb_build_object('catalog_source_id',v_source.id,'external_key',r.external_key,'import_batch_id',p_batch_id,'retrieved_at',v_source.retrieved_at))
      on conflict (jamb_code) where jamb_code is not null do update set name=excluded.name,institution_type=excluded.institution_type,ownership=excluded.ownership,state=excluded.state,source_url=excluded.source_url,provenance=excluded.provenance,updated_at=now()
      returning id into v_institution_id;
      if v_institution_id is null then
        select id into v_institution_id from ace.institutions where name=trim(r.payload->>'name') and institution_type=r.payload->>'institution_type' limit 1;
      end if;
      update ace.catalog_import_rows set published_id=v_institution_id where id=r.id;
      v_published := v_published + 1;
    end loop;

  elsif v_batch.dataset_type='programs' then
    for r in select * from ace.catalog_import_rows where batch_id=p_batch_id order by row_number loop
      select id into v_institution_id from ace.institutions where jamb_code=nullif(r.payload->>'institution_external_key','') or id::text=r.payload->>'institution_external_key' limit 1;
      if v_institution_id is null then raise exception 'Institution not found for program row %', r.row_number; end if;
      select id into v_program_id from ace.programs where institution_id=v_institution_id and name=trim(r.payload->>'name') limit 1;
      if v_program_id is null then
        insert into ace.programs (institution_id,jamb_code,name,award_level,duration_years,status,source_url,provenance)
        values (v_institution_id,nullif(r.payload->>'jamb_code',''),trim(r.payload->>'name'),coalesce(nullif(r.payload->>'award_level',''),'degree'),nullif(r.payload->>'duration_years','')::smallint,'draft',v_source.source_url,
          jsonb_build_object('catalog_source_id',v_source.id,'external_key',r.external_key,'import_batch_id',p_batch_id,'retrieved_at',v_source.retrieved_at))
        returning id into v_program_id;
      else
        update ace.programs set jamb_code=coalesce(nullif(r.payload->>'jamb_code',''),jamb_code),award_level=coalesce(nullif(r.payload->>'award_level',''),award_level),duration_years=coalesce(nullif(r.payload->>'duration_years','')::smallint,duration_years),status='draft',source_url=v_source.source_url,provenance=jsonb_build_object('catalog_source_id',v_source.id,'external_key',r.external_key,'import_batch_id',p_batch_id,'retrieved_at',v_source.retrieved_at),updated_at=now() where id=v_program_id;
      end if;
      update ace.catalog_import_rows set published_id=v_program_id where id=r.id;
      v_published := v_published + 1;
    end loop;

  elsif v_batch.dataset_type='utme_rules' then
    for r in select * from ace.catalog_import_rows where batch_id=p_batch_id order by row_number loop
      select id into v_program_id from ace.programs where jamb_code=nullif(r.payload->>'program_external_key','') or id::text=r.payload->>'program_external_key' or provenance->>'external_key'=r.payload->>'program_external_key' limit 1;
      if v_program_id is null then raise exception 'Program not found for UTME rule row %', r.row_number; end if;
      select array_agg(s.id order by s.sort_order) into v_subject_ids
      from ace.subjects s where s.code = any(select jsonb_array_elements_text(r.payload->'required_subject_codes')) and s.active=true;
      if coalesce(array_length(v_subject_ids,1),0) <> jsonb_array_length(r.payload->'required_subject_codes') then raise exception 'One or more UTME subject codes are invalid for rule row %', r.row_number; end if;
      insert into ace.program_utme_rules (season_id,program_id,required_subject_ids,alternative_groups,minimum_optional_subjects,notes,source_url,provenance,status,version)
      values (v_batch.season_id,v_program_id,v_subject_ids,coalesce(r.payload->'alternative_groups','[]'::jsonb),coalesce((r.payload->>'minimum_optional_subjects')::smallint,0),nullif(r.payload->>'notes',''),v_source.source_url,jsonb_build_object('catalog_source_id',v_source.id,'external_key',r.external_key,'import_batch_id',p_batch_id,'retrieved_at',v_source.retrieved_at),'draft',1)
      returning id into v_program_id;
      update ace.catalog_import_rows set published_id=v_program_id where id=r.id;
      v_published := v_published + 1;
    end loop;

  elsif v_batch.dataset_type='syllabus' then
    for r in select * from ace.catalog_import_rows where batch_id=p_batch_id order by row_number loop
      v_syllabus_version_id := nullif(r.payload->>'syllabus_version_id','')::uuid;
      if v_syllabus_version_id is null or not exists (select 1 from ace.syllabus_versions where id=v_syllabus_version_id) then raise exception 'Syllabus version not found for row %', r.row_number; end if;
      if r.entity_type='syllabus_topic' then
        insert into ace.topics (subject_id,name,description,sort_order,active,syllabus_version_id)
        select sv.subject_id,trim(r.payload->>'name'),nullif(r.payload->>'description',''),coalesce((r.payload->>'sort_order')::integer,0),false,v_syllabus_version_id
        from ace.syllabus_versions sv where sv.id=v_syllabus_version_id
        returning id into v_topic_id;
        update ace.catalog_import_rows set published_id=v_topic_id where id=r.id;
      else
        select id into v_topic_id from ace.topics where syllabus_version_id=v_syllabus_version_id and (id::text=r.payload->>'topic_id' or name=trim(r.payload->>'topic_external_key')) limit 1;
        if v_topic_id is null then raise exception 'Topic not found for syllabus subtopic row %', r.row_number; end if;
        insert into ace.subtopics (topic_id,name,description,sort_order,active,syllabus_version_id)
        values (v_topic_id,trim(r.payload->>'name'),nullif(r.payload->>'description',''),coalesce((r.payload->>'sort_order')::integer,0),false,v_syllabus_version_id)
        returning id into v_topic_id;
        update ace.catalog_import_rows set published_id=v_topic_id where id=r.id;
      end if;
      v_published := v_published + 1;
    end loop;
  else
    raise exception 'Unsupported catalog dataset type';
  end if;

  update ace.catalog_import_batches set status='published',updated_at=now(),metadata=metadata || jsonb_build_object('published_by',v_user,'published_at',now(),'published_rows',v_published) where id=p_batch_id;
  return jsonb_build_object('batch_id',p_batch_id,'status','published','published_rows',v_published);
end;
$function$;

CREATE OR REPLACE FUNCTION ace.resume_attempt(p_attempt_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'ace', 'public'
AS $function$
declare a ace.attempts%rowtype; v_remaining integer; v_answers jsonb;
begin
  select * into a from ace.attempts where id=p_attempt_id and user_id=auth.uid();
  if not found then raise exception 'Attempt not found' using errcode='P0002'; end if;
  v_remaining:=case when a.status='active' then greatest(0,a.duration_seconds-floor(extract(epoch from(now()-a.started_at)))::integer) else 0 end;
  select coalesce(jsonb_agg(jsonb_build_object('question_id',question_id,'selected_option_key',selected_option_key,'response_ms',response_ms,'answered_at',answered_at) order by answered_at),'[]'::jsonb) into v_answers from ace.attempt_answers where attempt_id=a.id;
  return jsonb_build_object('attempt_id',a.id,'status',a.status,'mode',a.mode,'subject_id',a.subject_id,'started_at',a.started_at,'completed_at',a.completed_at,'duration_seconds',a.duration_seconds,'remaining_seconds',v_remaining,'question_order',a.question_order,'option_order',a.option_order,'answers',v_answers,'score',a.score,'correct_count',a.correct_count,'answered_count',a.answered_count);
end;
$function$;

CREATE OR REPLACE FUNCTION ace.save_attempt_answer(p_attempt_id uuid, p_question_id uuid, p_selected_option_key text, p_response_ms integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'ace', 'public'
AS $function$
declare
  a ace.attempts%rowtype;
  q ace.questions%rowtype;
  v_correct boolean;
  v_elapsed integer;
  v_selected text := nullif(trim(p_selected_option_key),'');
begin
  select * into a from ace.attempts
  where id=p_attempt_id and user_id=auth.uid()
  for update;
  if not found then raise exception 'Attempt not found' using errcode='P0002'; end if;
  if a.status <> 'active' then raise exception 'Attempt is not active'; end if;

  v_elapsed := floor(extract(epoch from (now()-a.started_at)))::integer;
  if v_elapsed >= a.duration_seconds then raise exception 'Attempt time has expired'; end if;
  if p_response_ms is not null and p_response_ms < 0 then raise exception 'Invalid response time'; end if;
  if not exists(select 1 from jsonb_array_elements_text(a.question_order) x(value) where x.value=p_question_id::text) then
    raise exception 'Question is not part of this attempt';
  end if;

  select * into q from ace.questions
  where id=p_question_id
    and active=true
    and review_status='published'
    and rights_status in ('owned','licensed','permitted');
  if not found then raise exception 'Question unavailable'; end if;
  if v_selected is not null and not exists(
    select 1 from jsonb_array_elements(q.options) e
    where e.value ? 'key' and e.value->>'key'=v_selected
  ) then raise exception 'Invalid option'; end if;

  v_correct := v_selected is not null and v_selected=q.correct_option_key;
  insert into ace.attempt_answers(attempt_id,question_id,selected_option_key,is_correct,response_ms,answered_at)
  values(a.id,q.id,v_selected,v_correct,p_response_ms,now())
  on conflict(attempt_id,question_id) do update
    set selected_option_key=excluded.selected_option_key,
        is_correct=excluded.is_correct,
        response_ms=excluded.response_ms,
        answered_at=excluded.answered_at;

  select count(*) filter(where selected_option_key is not null),
         count(*) filter(where is_correct=true)
    into a.answered_count,a.correct_count
  from ace.attempt_answers where attempt_id=a.id;
  update ace.attempts set answered_count=a.answered_count,correct_count=a.correct_count where id=a.id;

  return jsonb_build_object('attempt_id',a.id,'question_id',q.id,
    'selected_option_key',v_selected,'is_correct',v_correct,
    'answered_at',now(),'answered_count',a.answered_count);
end;
$function$;

CREATE OR REPLACE FUNCTION ace.save_student_foundation(p_display_name text, p_target_score smallint, p_institution text, p_course text, p_daily_minutes integer, p_subject_ids uuid[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'ace', 'auth'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_subject_count integer;
  v_active_subject_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_display_name is null or length(btrim(p_display_name)) = 0 or length(btrim(p_display_name)) > 80 then
    raise exception 'Display name must be 1–80 characters.' using errcode = '22023';
  end if;
  if p_target_score is null or p_target_score < 0 or p_target_score > 400 then
    raise exception 'Target score must be between 0 and 400.' using errcode = '22023';
  end if;
  if p_institution is null or length(btrim(p_institution)) = 0 or length(btrim(p_institution)) > 160 then
    raise exception 'Intended institution must be 1–160 characters.' using errcode = '22023';
  end if;
  if p_course is null or length(btrim(p_course)) = 0 or length(btrim(p_course)) > 160 then
    raise exception 'Intended course must be 1–160 characters.' using errcode = '22023';
  end if;
  if p_daily_minutes is null or p_daily_minutes < 1 or p_daily_minutes > 1440 then
    raise exception 'Study time must be between 1 and 1440 minutes.' using errcode = '22023';
  end if;
  if p_subject_ids is null then
    raise exception 'Select exactly four subjects.' using errcode = '22023';
  end if;

  select count(distinct subject_id), count(*)
    into v_subject_count, v_active_subject_count
  from unnest(p_subject_ids) as requested(subject_id)
  join ace.subjects s on s.id = requested.subject_id and s.active = true;

  if cardinality(p_subject_ids) <> 4 or v_subject_count <> cardinality(p_subject_ids) or v_active_subject_count <> cardinality(p_subject_ids) then
    raise exception 'Select exactly four active subjects.' using errcode = '22023';
  end if;

  if not exists(select 1 from ace.subjects where id=any(p_subject_ids) and code='ENG' and active) then
    raise exception 'English must be included with three additional subjects' using errcode='22023';
  end if;

  update ace.profiles
     set display_name = btrim(p_display_name),
         target_score = p_target_score,
         institution = btrim(p_institution),
         course = btrim(p_course)
   where id = v_user_id;

  if not found then
    raise exception 'Student profile not found.' using errcode = 'P0002';
  end if;

  insert into ace.student_preferences (user_id, daily_minutes)
  values (v_user_id, p_daily_minutes)
  on conflict (user_id) do update
    set daily_minutes = excluded.daily_minutes,
        updated_at = pg_catalog.now();

  delete from ace.student_subjects where user_id = v_user_id;
  insert into ace.student_subjects (user_id, subject_id, is_primary, sort_order)
  select v_user_id, s.id, s.code='ENG',
         (row_number() over(order by case when s.code='ENG' then 0 else 1 end,selected.ordinality)-1)::integer
  from unnest(p_subject_ids) with ordinality as selected(subject_id, ordinality)
  join ace.subjects s on s.id=selected.subject_id;
end;
$function$;

CREATE OR REPLACE FUNCTION ace.save_student_foundation_catalog(p_display_name text, p_target_score smallint, p_institution_id uuid, p_program_id uuid, p_daily_minutes integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'ace', 'auth'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_season_id uuid;
  v_institution ace.institutions%rowtype;
  v_program ace.programs%rowtype;
  v_rule ace.program_utme_rules%rowtype;
  v_subject_ids uuid[];
  v_subject_count integer;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_display_name is null or length(btrim(p_display_name)) = 0 or length(btrim(p_display_name)) > 80 then raise exception 'Display name must be 1–80 characters.' using errcode = '22023'; end if;
  if p_target_score is null or p_target_score < 0 or p_target_score > 400 then raise exception 'Target score must be between 0 and 400.' using errcode = '22023'; end if;
  if p_daily_minutes is null or p_daily_minutes < 1 or p_daily_minutes > 1440 then raise exception 'Study time must be between 1 and 1440 minutes.' using errcode = '22023'; end if;

  select * into v_institution from ace.institutions where id = p_institution_id and status = 'active';
  if not found then raise exception 'Selected institution is not available.' using errcode = '22023'; end if;
  select * into v_program from ace.programs where id = p_program_id and institution_id = p_institution_id and status = 'active';
  if not found then raise exception 'Selected course is not available for this institution.' using errcode = '22023'; end if;
  select id into v_season_id from ace.exam_seasons where status = 'active' order by exam_year desc limit 1;
  if v_season_id is null then raise exception 'No active JAMB season is available.' using errcode = '22023'; end if;
  select * into v_rule from ace.program_utme_rules where season_id = v_season_id and program_id = p_program_id and status = 'active' order by version desc limit 1;
  if not found then raise exception 'No verified UTME subject combination is available for this course.' using errcode = '22023'; end if;
  v_subject_ids := v_rule.required_subject_ids;
  if v_subject_ids is null or cardinality(v_subject_ids) <> 4 then raise exception 'This programme has a non-fixed UTME subject combination and needs subject-choice handling before enrollment.' using errcode = '22023'; end if;
  select count(*) into v_subject_count from ace.subjects where id = any(v_subject_ids) and active = true;
  if v_subject_count <> 4 then raise exception 'The verified UTME subject combination contains an invalid subject.' using errcode = '22023'; end if;
  if not exists (select 1 from ace.exam_configs c where c.season_id = v_season_id and c.active = true) then raise exception 'The active JAMB exam configuration is unavailable.' using errcode = '22023'; end if;

  update ace.profiles set display_name=btrim(p_display_name), target_score=p_target_score, institution=v_institution.name, course=v_program.name, institution_id=v_institution.id, program_id=v_program.id where id=v_user_id;
  if not found then raise exception 'Student profile not found.' using errcode = 'P0002'; end if;
  insert into ace.student_preferences (user_id,daily_minutes) values(v_user_id,p_daily_minutes) on conflict(user_id) do update set daily_minutes=excluded.daily_minutes,updated_at=pg_catalog.now();
  delete from ace.student_subjects where user_id=v_user_id;
  insert into ace.student_subjects(user_id,subject_id,is_primary,sort_order) select v_user_id,subject_id,ordinality=1,(ordinality-1)::integer from unnest(v_subject_ids) with ordinality as selected(subject_id,ordinality);
end;
$function$;

CREATE OR REPLACE FUNCTION ace.save_student_foundation_catalog_with_subjects(p_display_name text, p_target_score smallint, p_institution_id uuid, p_program_id uuid, p_daily_minutes integer, p_subject_ids uuid[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'ace', 'auth'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_season_id uuid;
  v_institution ace.institutions%rowtype;
  v_program ace.programs%rowtype;
  v_rule ace.program_utme_rules%rowtype;
  v_subject_ids uuid[];
  v_subject_count integer;
  v_group jsonb;
  v_group_minimum integer;
  v_group_selected integer;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_display_name is null or length(btrim(p_display_name)) = 0 or length(btrim(p_display_name)) > 80 then raise exception 'Display name must be 1–80 characters.' using errcode = '22023'; end if;
  if p_target_score is null or p_target_score < 0 or p_target_score > 400 then raise exception 'Target score must be between 0 and 400.' using errcode = '22023'; end if;
  if p_daily_minutes is null or p_daily_minutes < 1 or p_daily_minutes > 1440 then raise exception 'Study time must be between 1 and 1440 minutes.' using errcode = '22023'; end if;
  if p_subject_ids is null or cardinality(p_subject_ids) <> 4 or (select count(distinct input_subject_id) from unnest(p_subject_ids) as input_subjects(input_subject_id)) <> 4 then
    raise exception 'Select exactly four distinct UTME subjects.' using errcode = '22023';
  end if;

  select * into v_institution from ace.institutions where id = p_institution_id and status = 'active';
  if not found then raise exception 'Selected institution is not available.' using errcode = '22023'; end if;
  select * into v_program from ace.programs where id = p_program_id and institution_id = p_institution_id and status = 'active';
  if not found then raise exception 'Selected course is not available for this institution.' using errcode = '22023'; end if;
  select id into v_season_id from ace.exam_seasons where status = 'active' order by exam_year desc limit 1;
  if v_season_id is null then raise exception 'No active JAMB season is available.' using errcode = '22023'; end if;
  select * into v_rule from ace.program_utme_rules where season_id = v_season_id and program_id = p_program_id and status = 'active' order by version desc limit 1;
  if not found then raise exception 'No verified UTME subject combination is available for this course.' using errcode = '22023'; end if;

  select array_agg(s.id order by case when s.code = 'ENG' then 0 else 1 end, s.sort_order) into v_subject_ids
  from ace.subjects s
  where s.id = any(p_subject_ids) and s.active = true;
  if coalesce(cardinality(v_subject_ids), 0) <> 4 then raise exception 'One or more selected UTME subjects are invalid.' using errcode = '22023'; end if;

  v_subject_count := cardinality(coalesce(v_rule.required_subject_ids, '{}'::uuid[]));
  if v_subject_count < 1 or v_subject_count + coalesce(v_rule.minimum_optional_subjects, 0) <> 4 then
    raise exception 'The active programme rule needs administrator review before student enrollment.' using errcode = '22023';
  end if;
  if not (coalesce(v_rule.required_subject_ids, '{}'::uuid[]) <@ v_subject_ids) then
    raise exception 'Your selection is missing one or more required UTME subjects.' using errcode = '22023';
  end if;

  for v_group in select value from jsonb_array_elements(coalesce(v_rule.alternative_groups, '[]'::jsonb)) as groups(value)
  loop
    v_group_minimum := coalesce((v_group->>'minimum_required')::integer, 0);
    if coalesce(jsonb_typeof(v_group->'subject_codes'), 'null') <> 'array' or v_group_minimum < 1 then
      raise exception 'The active programme rule has an invalid alternative-subject group.' using errcode = '22023';
    end if;
    select count(*) into v_group_selected
    from ace.subjects s
    where s.id = any(v_subject_ids)
      and s.code in (select jsonb_array_elements_text(v_group->'subject_codes'));
    if v_group_selected < v_group_minimum then
      raise exception 'Your selection does not satisfy every required alternative-subject group.' using errcode = '22023';
    end if;
  end loop;

  if exists (
    select 1
    from unnest(v_subject_ids) as chosen(subject_id)
    join ace.subjects s on s.id = chosen.subject_id
    where not (s.id = any(coalesce(v_rule.required_subject_ids, '{}'::uuid[])))
      and not exists (
        select 1
        from jsonb_array_elements(coalesce(v_rule.alternative_groups, '[]'::jsonb)) as groups(value)
        where exists (
          select 1 from jsonb_array_elements_text(groups.value->'subject_codes') as codes(code)
          where codes.code = s.code
        )
      )
  ) then
    raise exception 'Your selection includes a subject not allowed by the active programme rule.' using errcode = '22023';
  end if;

  if not exists (select 1 from ace.exam_configs c where c.season_id = v_season_id and c.active = true) then
    raise exception 'The active JAMB exam configuration is unavailable.' using errcode = '22023';
  end if;

  update ace.profiles
  set display_name = btrim(p_display_name),
      target_score = p_target_score,
      institution = v_institution.name,
      course = v_program.name,
      institution_id = v_institution.id,
      program_id = v_program.id
  where id = v_user_id;
  if not found then raise exception 'Student profile not found.' using errcode = 'P0002'; end if;

  insert into ace.student_preferences (user_id, daily_minutes)
  values (v_user_id, p_daily_minutes)
  on conflict (user_id) do update set daily_minutes = excluded.daily_minutes, updated_at = pg_catalog.now();

  delete from ace.student_subjects where user_id = v_user_id;
  insert into ace.student_subjects (user_id, subject_id, is_primary, sort_order)
  select v_user_id, subject_id, ordinality = 1, (ordinality - 1)::integer
  from unnest(v_subject_ids) with ordinality as selected(subject_id, ordinality);
end;
$function$;

CREATE OR REPLACE FUNCTION ace.save_student_preparation_foundation(p_display_name text, p_target_score smallint, p_institution_goal text, p_course_goal text, p_daily_minutes integer, p_subject_ids uuid[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'ace', 'auth'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_subject_count integer;
  v_existing ace.profiles%rowtype;
  v_institution text := nullif(left(btrim(coalesce(p_institution_goal, '')), 160), '');
  v_course text := nullif(left(btrim(coalesce(p_course_goal, '')), 160), '');
  v_keep_catalog_link boolean := false;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_display_name is null or length(btrim(p_display_name)) = 0 or length(btrim(p_display_name)) > 80 then
    raise exception 'Display name must be 1–80 characters.' using errcode = '22023';
  end if;
  if p_target_score is null or p_target_score < 0 or p_target_score > 400 then
    raise exception 'Target score must be between 0 and 400.' using errcode = '22023';
  end if;
  if p_daily_minutes is null or p_daily_minutes < 1 or p_daily_minutes > 1440 then
    raise exception 'Study time must be between 1 and 1440 minutes.' using errcode = '22023';
  end if;
  if p_subject_ids is null or cardinality(p_subject_ids) <> 4
     or (select count(distinct subject_id) from unnest(p_subject_ids) as selected(subject_id)) <> 4 then
    raise exception 'Select exactly four distinct preparation subjects.' using errcode = '22023';
  end if;

  select count(*) into v_subject_count
  from ace.subjects s
  where s.id = any(p_subject_ids) and s.active = true;
  if v_subject_count <> 4 then
    raise exception 'One or more selected preparation subjects are unavailable.' using errcode = '22023';
  end if;

  if not exists (
    select 1 from ace.subjects s
    where s.id = any(p_subject_ids) and s.code = 'ENG' and s.active = true
  ) then
    raise exception 'English must be included with your three additional preparation subjects.' using errcode = '22023';
  end if;

  -- First-time users can reach onboarding before a profile row exists.
  -- Create only the authenticated user's own row; preserve existing profile data.
  insert into ace.profiles (id, email)
  values (v_user_id, nullif(auth.jwt() ->> 'email', ''))
  on conflict (id) do nothing;

  select * into v_existing from ace.profiles where id = v_user_id for update;
  if not found then
    raise exception 'Student profile not found.' using errcode = 'P0002';
  end if;

  if v_existing.institution_id is not null and v_existing.program_id is not null then
    select (i.name = v_institution and p.name = v_course)
      into v_keep_catalog_link
    from ace.institutions i
    join ace.programs p on p.id = v_existing.program_id and p.institution_id = i.id
    where i.id = v_existing.institution_id;
    v_keep_catalog_link := coalesce(v_keep_catalog_link, false);
  end if;

  update ace.profiles
  set display_name = btrim(p_display_name),
      target_score = p_target_score,
      institution = v_institution,
      course = v_course,
      institution_id = case when v_keep_catalog_link then v_existing.institution_id else null end,
      program_id = case when v_keep_catalog_link then v_existing.program_id else null end,
      updated_at = pg_catalog.now()
  where id = v_user_id;

  insert into ace.student_preferences (user_id, daily_minutes)
  values (v_user_id, p_daily_minutes)
  on conflict (user_id) do update
    set daily_minutes = excluded.daily_minutes,
        updated_at = pg_catalog.now();

  delete from ace.student_subjects where user_id = v_user_id;
  insert into ace.student_subjects (user_id, subject_id, is_primary, sort_order)
  select v_user_id, subject_id, (subject.code = 'ENG'), (ordinality - 1)::integer
  from unnest(p_subject_ids) with ordinality as selected(subject_id, ordinality)
  join ace.subjects subject on subject.id = selected.subject_id and subject.active = true
  order by case when subject.code = 'ENG' then 0 else 1 end, ordinality;
end;
$function$;

CREATE OR REPLACE FUNCTION ace.set_student_subjects(p_subject_ids uuid[])
 RETURNS SETOF ace.student_subjects
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'ace', 'auth'
AS $function$
declare v_user uuid := auth.uid();
begin
 if v_user is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if p_subject_ids is null or cardinality(p_subject_ids)<>4
    or (select count(distinct x) from unnest(p_subject_ids) x)<>4
    or (select count(*) from ace.subjects where id=any(p_subject_ids) and active)<>4
    or not exists(select 1 from ace.subjects where id=any(p_subject_ids) and code='ENG' and active) then
   raise exception 'Select English and three distinct active additional subjects' using errcode='22023';
 end if;
 -- Serialize concurrent calls to this subject-selection RPC.
 perform pg_advisory_xact_lock(hashtextextended(v_user::text,0));
 delete from ace.student_subjects where user_id=v_user;
 return query
 insert into ace.student_subjects(user_id,subject_id,is_primary,sort_order)
 select v_user,s.id,s.code='ENG',
   (row_number() over(order by case when s.code='ENG' then 0 else 1 end,u.ord)-1)::integer
 from unnest(p_subject_ids) with ordinality u(id,ord)
 join ace.subjects s on s.id=u.id
 returning *;
end;
$function$;

CREATE OR REPLACE FUNCTION ace.set_user_role(target_user_id uuid, target_role text)
 RETURNS ace.roles
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'ace', 'auth'
AS $function$
declare v_previous text; v_result ace.roles;
begin
 if auth.uid() is null then raise exception 'Administrator access required' using errcode='42501'; end if;
 -- Serialize role mutations BEFORE checking caller privileges/last-admin count.
 -- This prevents concurrent demotions from each observing a different last admin.
 lock table ace.roles in share row exclusive mode;
 -- Stale repeatable-read snapshots must serialize instead of counting old admins.
 perform 1 from ace.roles where role='admin' order by user_id for update;
 if not ace.is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
 if target_role is null or target_role not in ('student','editor','admin') or target_user_id is null then
   raise exception 'Invalid target role or user' using errcode='22023';
 end if;
 if not exists(select 1 from auth.users where id=target_user_id) then
   raise exception 'Target user does not exist' using errcode='22023';
 end if;
 select role into v_previous from ace.roles where user_id=target_user_id;
 if v_previous='admin' and target_role<>'admin'
    and (select count(*) from ace.roles where role='admin')<=1 then
   raise exception 'Cannot remove the last administrator' using errcode='23514';
 end if;
 insert into ace.roles(user_id,role) values(target_user_id,target_role)
 on conflict(user_id) do update set role=excluded.role returning * into v_result;
 insert into ace.audit_events(actor_user_id,event_type,entity_type,entity_id,metadata)
 values(auth.uid(),'role_changed','user_role',target_user_id,
   jsonb_build_object('previous_role',v_previous,'new_role',target_role));
 return v_result;
end;
$function$;

CREATE OR REPLACE FUNCTION ace.stage_catalog_import(p_source_id uuid, p_season_id uuid, p_dataset_type text, p_snapshot_hash text, p_metadata jsonb, p_rows jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'ace', 'auth'
AS $function$
declare
  v_user uuid := auth.uid();
  v_source ace.catalog_sources%rowtype;
  v_season_status text;
  v_existing ace.catalog_import_batches%rowtype;
  v_batch ace.catalog_import_batches%rowtype;
  v_row_count integer;
begin
  if v_user is null or not ace.can_manage_catalog() then
    raise exception 'Admin/editor access required';
  end if;

  if p_source_id is null or p_dataset_type is null or p_snapshot_hash is null then
    raise exception 'source_id, dataset_type and snapshot_hash are required';
  end if;

  if p_dataset_type not in ('institutions','programs','utme_rules','syllabus') then
    raise exception 'Invalid dataset_type';
  end if;

  if jsonb_typeof(p_rows) <> 'array' then
    raise exception 'rows must be a JSON array';
  end if;

  v_row_count := jsonb_array_length(p_rows);
  if v_row_count < 1 or v_row_count > 5000 then
    raise exception 'rows must contain 1-5000 items';
  end if;

  select * into v_source
  from ace.catalog_sources
  where id = p_source_id;

  if not found then
    raise exception 'Catalog source not found';
  end if;

  if v_source.status not in ('reviewed','approved') then
    raise exception 'Catalog source must be reviewed or approved before import';
  end if;

  if p_season_id is not null then
    select status into v_season_status
    from ace.exam_seasons
    where id = p_season_id;

    if v_season_status is null then
      raise exception 'Season not found';
    end if;

    if v_season_status = 'archived' then
      raise exception 'Cannot import into an archived season';
    end if;
  end if;

  select * into v_existing
  from ace.catalog_import_batches
  where snapshot_hash = p_snapshot_hash
  limit 1;

  if found then
    return jsonb_build_object(
      'batch_id', v_existing.id,
      'status', v_existing.status,
      'row_count', v_existing.row_count,
      'idempotent', true,
      'message', 'This exact catalog snapshot was already staged.'
    );
  end if;

  insert into ace.catalog_import_batches (
    source_id, season_id, dataset_type, status, row_count,
    snapshot_hash, metadata
  )
  values (
    p_source_id, p_season_id, p_dataset_type, 'staged', v_row_count,
    p_snapshot_hash,
    coalesce(p_metadata, '{}'::jsonb) ||
      jsonb_build_object(
        'source_title', v_source.title,
        'imported_by', v_user
      )
  )
  returning * into v_batch;

  insert into ace.catalog_import_rows (
    batch_id, row_number, entity_type, external_key, payload,
    validation_status, validation_errors
  )
  select
    v_batch.id,
    x.row_number,
    x.entity_type,
    x.external_key,
    x.payload,
    'pending',
    '[]'::jsonb
  from jsonb_to_recordset(p_rows) as x(
    row_number integer,
    entity_type text,
    external_key text,
    payload jsonb
  );

  return jsonb_build_object(
    'batch_id', v_batch.id,
    'status', 'staged',
    'row_count', v_row_count,
    'source', v_source.title,
    'imported_by', v_user,
    'snapshot_hash', p_snapshot_hash
  );
end;
$function$;

CREATE OR REPLACE FUNCTION ace.start_attempt(p_mode text, p_subject_id uuid DEFAULT NULL::uuid, p_question_count integer DEFAULT 20, p_duration_seconds integer DEFAULT 1800, p_question_ids uuid[] DEFAULT NULL::uuid[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'ace', 'public'
AS $function$
declare
  v_user uuid := auth.uid();
  v_attempt uuid;
  v_seed bigint;
  v_ids uuid[];
  v_order jsonb;
  v_options jsonb := '{}'::jsonb;
  v_q uuid;
  v_opts jsonb;
  v_opt_keys jsonb;
begin
  if v_user is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if p_mode is null or p_mode not in ('practice','cbt','mock','learning','revision','ai_practice') then raise exception 'Unsupported attempt mode' using errcode='22023'; end if;
  if p_question_count is null or p_question_count < 1 or p_question_count > 500 then raise exception 'Invalid question count' using errcode='22023'; end if;
  if p_duration_seconds is null or p_duration_seconds < 60 or p_duration_seconds > 86400 then raise exception 'Invalid duration' using errcode='22023'; end if;

  v_seed := floor(random()*9223372036854775807)::bigint;

  if p_question_ids is not null and cardinality(p_question_ids) > 0 then
    select array_agg(q.id order by array_position(p_question_ids,q.id)) into v_ids
    from ace.questions q
    where q.id = any(p_question_ids)
      and q.active = true
      and q.review_status = 'published'
      and q.rights_status in ('owned','licensed','permitted')
      and (p_subject_id is null or q.subject_id = p_subject_id);
  else
    select array_agg(x.id order by x.rank) into v_ids
    from (
      select q.id, row_number() over(order by md5(v_seed::text || ':' || q.id::text)) as rank
      from ace.questions q
      where q.active = true
        and q.review_status = 'published'
        and q.rights_status in ('owned','licensed','permitted')
        and (p_subject_id is null or q.subject_id = p_subject_id)
      limit p_question_count
    ) x;
  end if;

  if v_ids is null or cardinality(v_ids) = 0 then
    raise exception 'No published questions available for this attempt';
  end if;
  if cardinality(v_ids) > p_question_count then v_ids := v_ids[1:p_question_count]; end if;

  select jsonb_agg(to_jsonb(qid) order by ord) into v_order
  from unnest(v_ids) with ordinality u(qid,ord);

  foreach v_q in array v_ids loop
    select options into v_opts from ace.questions where id = v_q;
    select jsonb_agg(e.value->>'key' order by md5(v_seed::text || ':' || v_q::text || ':' || (e.value->>'key')))
      into v_opt_keys
    from jsonb_array_elements(v_opts) e(value)
    where e.value ? 'key';
    v_options := v_options || jsonb_build_object(v_q::text, coalesce(v_opt_keys,'[]'::jsonb));
  end loop;

  insert into ace.attempts(user_id,mode,subject_id,started_at,duration_seconds,random_seed,question_order,option_order,status)
  values(v_user,p_mode,p_subject_id,now(),p_duration_seconds,v_seed,v_order,v_options,'active')
  returning id into v_attempt;

  return jsonb_build_object('attempt_id',v_attempt,'status','active','started_at',now(),
    'duration_seconds',p_duration_seconds,'random_seed',v_seed,'question_order',v_order,
    'option_order',v_options,'question_count',cardinality(v_ids));
end;
$function$;

CREATE OR REPLACE FUNCTION ace.submit_attempt(p_attempt_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'ace', 'public'
AS $function$
declare a ace.attempts%rowtype; v_total integer; v_answered integer; v_correct integer; v_score numeric; r record;
begin
  select * into a from ace.attempts where id=p_attempt_id and user_id=auth.uid() for update;
  if not found then raise exception 'Attempt not found' using errcode='P0002'; end if;
  if a.status='completed' then return jsonb_build_object('attempt_id',a.id,'status','completed','score',a.score,'correct_count',a.correct_count,'answered_count',a.answered_count,'completed_at',a.completed_at); end if;
  if a.status<>'active' then raise exception 'Attempt cannot be submitted'; end if;
  select jsonb_array_length(a.question_order) into v_total;
  select count(*) filter(where selected_option_key is not null),count(*) filter(where is_correct=true) into v_answered,v_correct from ace.attempt_answers where attempt_id=a.id;
  v_score:=round((v_correct::numeric*100)/nullif(v_total,0),2);
  update ace.attempts set status='completed',completed_at=now(),score=v_score,correct_count=v_correct,answered_count=v_answered where id=a.id;
  for r in select question_id,is_correct,coalesce(response_ms,0) response_ms from ace.attempt_answers where attempt_id=a.id loop
    insert into ace.student_question_stats(user_id,question_id,attempts,correct_count,incorrect_count,total_response_ms,last_answered_at) values(a.user_id,r.question_id,1,case when r.is_correct then 1 else 0 end,case when r.is_correct then 0 else 1 end,r.response_ms,now()) on conflict(user_id,question_id) do update set attempts=ace.student_question_stats.attempts+1,correct_count=ace.student_question_stats.correct_count+excluded.correct_count,incorrect_count=ace.student_question_stats.incorrect_count+excluded.incorrect_count,total_response_ms=ace.student_question_stats.total_response_ms+excluded.total_response_ms,last_answered_at=excluded.last_answered_at;
  end loop;
  return jsonb_build_object('attempt_id',a.id,'status','completed','score',v_score,'correct_count',v_correct,'answered_count',v_answered,'total_questions',v_total,'completed_at',now());
end;
$function$;

CREATE OR REPLACE FUNCTION ace.touch_preferences_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'ace', 'pg_temp'
AS $function$ begin new.updated_at = now(); return new; end; $function$;

CREATE OR REPLACE FUNCTION ace.touch_profile_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'ace', 'pg_temp'
AS $function$ begin new.updated_at = now(); return new; end; $function$;

CREATE OR REPLACE FUNCTION ace.validate_catalog_batch(p_batch_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'ace', 'auth'
AS $function$
declare
  v_user uuid := auth.uid();
  v_batch ace.catalog_import_batches%rowtype;
  v_errors jsonb := '[]'::jsonb;
  r record;
  v_count integer := 0;
  v_seen jsonb := '{}'::jsonb;
  v_expected_dataset text;
  v_source_status text;
  v_season_status text;
  v_key text;
begin
  if v_user is null or not ace.is_admin_or_editor() then
    raise exception 'Admin/editor access required';
  end if;

  select * into v_batch from ace.catalog_import_batches where id = p_batch_id;
  if not found then raise exception 'Import batch not found'; end if;

  select status into v_source_status from ace.catalog_sources where id = v_batch.source_id;
  if v_source_status is null then
    raise exception 'Catalog source not found';
  end if;
  if v_source_status not in ('reviewed','approved') then
    v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',0,'error','Catalog source must be reviewed or approved'));
  end if;

  if v_batch.season_id is not null then
    select status into v_season_status from ace.exam_seasons where id=v_batch.season_id;
    if v_season_status is null then
      v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',0,'error','Season not found'));
    elsif v_season_status in ('archived','closed') then
      v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',0,'error','Imports cannot target a closed or archived season'));
    end if;
  end if;

  for r in select * from ace.catalog_import_rows where batch_id=p_batch_id order by row_number loop
    v_count := v_count + 1;
    if r.entity_type='institution' then
      if v_batch.dataset_type <> 'institutions' then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Entity type does not match batch dataset')); end if;
      if coalesce(length(trim(r.payload->>'name')),0)=0 then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Institution name is required')); end if;
      if r.payload->>'institution_type' not in ('university','polytechnic','college_of_education','other') then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Invalid institution type')); end if;
      if coalesce(length(trim(r.external_key)),0)=0 then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Institution external_key is required')); end if;
    elsif r.entity_type='program' then
      if v_batch.dataset_type <> 'programs' then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Entity type does not match batch dataset')); end if;
      if coalesce(length(trim(r.payload->>'name')),0)=0 then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Program name is required')); end if;
      if coalesce(length(trim(r.payload->>'institution_external_key')),0)=0 then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Program institution_external_key is required')); end if;
      if coalesce(length(trim(r.external_key)),0)=0 then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Program external_key is required')); end if;
      if coalesce(r.payload->>'award_level','degree') not in ('degree','nd','hnd','nce','other') then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Invalid program award_level')); end if;
    elsif r.entity_type='program_utme_rule' then
      if v_batch.dataset_type <> 'utme_rules' then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Entity type does not match batch dataset')); end if;
      if coalesce(length(trim(r.payload->>'program_external_key')),0)=0 then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Program external key is required')); end if;
      if jsonb_typeof(r.payload->'required_subject_codes') <> 'array' then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','required_subject_codes must be an array')); end if;
      if coalesce(jsonb_array_length(r.payload->'required_subject_codes'),0) < 1 then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','At least one required subject code is required')); end if;
      if coalesce(length(trim(r.external_key)),0)=0 then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','UTME rule external_key is required')); end if;
    elsif r.entity_type in ('syllabus_topic','syllabus_subtopic') then
      if v_batch.dataset_type <> 'syllabus' then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Entity type does not match batch dataset')); end if;
      if coalesce(length(trim(r.payload->>'name')),0)=0 then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Syllabus name is required')); end if;
      if r.entity_type='syllabus_subtopic' and coalesce(length(trim(r.payload->>'topic_external_key')),0)=0 then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Syllabus subtopic topic_external_key is required')); end if;
      if coalesce(length(trim(r.external_key)),0)=0 then v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Syllabus external_key is required')); end if;
    end if;

    v_key := coalesce(r.entity_type,'') || ':' || coalesce(r.external_key,'#row-'||r.row_number::text);
    if v_seen ? v_key then
      v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',r.row_number,'error','Duplicate entity external key in batch'));
    else
      v_seen := v_seen || jsonb_build_object(v_key,true);
    end if;
  end loop;

  update ace.catalog_import_rows cr
  set validation_status = case when exists (select 1 from jsonb_array_elements(v_errors) e where coalesce((e->>'row')::int,0)=cr.row_number) then 'invalid' else 'valid' end,
      validation_errors = coalesce((select jsonb_agg(e) from jsonb_array_elements(v_errors) e where coalesce((e->>'row')::int,0)=cr.row_number),'[]'::jsonb)
  where cr.batch_id=p_batch_id;

  update ace.catalog_import_batches
  set row_count=v_count,
      validation_errors=v_errors,
      status='reviewing',
      updated_at=now()
  where id=p_batch_id;

  return jsonb_build_object('batch_id',p_batch_id,'row_count',v_count,'error_count',jsonb_array_length(v_errors),'errors',v_errors);
end;
$function$;

CREATE OR REPLACE FUNCTION ace.validate_exam_config(p_exam_config_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'ace'
AS $function$
declare
  c ace.exam_configs%rowtype;
  required_count integer;
  optional_count integer;
  required_questions integer;
  optional_question_counts jsonb;
  result jsonb;
  v_min integer;
  v_max integer;
begin
  if auth.uid() is null or not ace.is_admin_or_editor() then
    raise exception 'Administrator/editor access required' using errcode='42501';
  end if;
  select * into c from ace.exam_configs where id=p_exam_config_id;
  if not found then return jsonb_build_object('valid',false,'errors',jsonb_build_array('Exam configuration not found')); end if;
  select count(*) filter (where required), count(*) filter (where not required), coalesce(sum(question_count) filter (where required),0)
    into required_count, optional_count, required_questions
  from ace.exam_config_subjects where exam_config_id=p_exam_config_id;

  optional_question_counts := coalesce((select jsonb_agg(distinct question_count order by question_count) from ace.exam_config_subjects where exam_config_id=p_exam_config_id and not required),'[]'::jsonb);
  result := jsonb_build_object(
    'valid', true,
    'errors', '[]'::jsonb,
    'required_subjects', required_count,
    'optional_subjects', optional_count,
    'required_questions', required_questions,
    'optional_question_counts', optional_question_counts,
    'total_questions', c.total_questions,
    'duration_seconds', c.duration_seconds,
    'option_count', c.option_count
  );

  if c.duration_seconds <= 0 then result := jsonb_set(result,'{valid}','false'::jsonb); result := jsonb_set(result,'{errors}', (result->'errors') || jsonb_build_array('Duration must be positive')); end if;
  if c.total_questions <= 0 then result := jsonb_set(result,'{valid}','false'::jsonb); result := jsonb_set(result,'{errors}', (result->'errors') || jsonb_build_array('Total question count must be positive')); end if;
  if c.option_count < 2 or c.option_count > 8 then result := jsonb_set(result,'{valid}','false'::jsonb); result := jsonb_set(result,'{errors}', (result->'errors') || jsonb_build_array('Option count must be between 2 and 8')); end if;
  if required_count < 1 then result := jsonb_set(result,'{valid}','false'::jsonb); result := jsonb_set(result,'{errors}', (result->'errors') || jsonb_build_array('At least one required subject is required')); end if;
  if optional_count < 1 then result := jsonb_set(result,'{valid}','false'::jsonb); result := jsonb_set(result,'{errors}', (result->'errors') || jsonb_build_array('At least one optional subject is required')); end if;
  if exists (select 1 from ace.exam_config_subjects where exam_config_id=p_exam_config_id and question_count <= 0) then result := jsonb_set(result,'{valid}','false'::jsonb); result := jsonb_set(result,'{errors}', (result->'errors') || jsonb_build_array('All configured subject question counts must be positive')); end if;
  if required_count<>1 or not exists(select 1 from ace.exam_config_subjects cs join ace.subjects sub on sub.id=cs.subject_id
      where cs.exam_config_id=p_exam_config_id and cs.required and sub.code='ENG' and sub.active) then
    result:=jsonb_set(result,'{valid}','false'::jsonb);
    result:=jsonb_set(result,'{errors}',(result->'errors')||jsonb_build_array('Exactly one compulsory active English subject is required'));
  end if;
  if optional_count<3 then
    result:=jsonb_set(result,'{valid}','false'::jsonb);
    result:=jsonb_set(result,'{errors}',(result->'errors')||jsonb_build_array('At least three optional subjects are required'));
  end if;
  if exists(select 1 from ace.exam_config_subjects cs join ace.subjects sub on sub.id=cs.subject_id
      where cs.exam_config_id=p_exam_config_id and not sub.active) then
    result:=jsonb_set(result,'{valid}','false'::jsonb);
    result:=jsonb_set(result,'{errors}',(result->'errors')||jsonb_build_array('Configured subjects must be active'));
  end if;
  select sum(question_count) into v_min from (select question_count from ace.exam_config_subjects
    where exam_config_id=p_exam_config_id and not required order by question_count limit 3) x;
  select sum(question_count) into v_max from (select question_count from ace.exam_config_subjects
    where exam_config_id=p_exam_config_id and not required order by question_count desc limit 3) x;
  if optional_count>=3 and (required_questions+v_min<>c.total_questions or required_questions+v_max<>c.total_questions) then
    result:=jsonb_set(result,'{valid}','false'::jsonb);
    result:=jsonb_set(result,'{errors}',(result->'errors')||jsonb_build_array('Every choice of three optional subjects must match the configured total'));
  end if;
  return result;
end;
$function$;

ALTER TABLE ace."ai_providers" ADD CONSTRAINT "ai_providers_code_key" UNIQUE (code);

ALTER TABLE ace."ai_providers" ADD CONSTRAINT "ai_providers_pkey" PRIMARY KEY (id);

ALTER TABLE ace."ai_requests" ADD CONSTRAINT "ai_requests_pkey" PRIMARY KEY (id);

ALTER TABLE ace."ai_requests" ADD CONSTRAINT "ai_requests_status_check" CHECK (status = ANY (ARRAY['started'::text, 'success'::text, 'error'::text, 'blocked'::text]));

ALTER TABLE ace."ai_usage" ADD CONSTRAINT "ai_usage_pkey" PRIMARY KEY (id);

ALTER TABLE ace."ai_usage" ADD CONSTRAINT "ai_usage_status_check" CHECK (status = ANY (ARRAY['success'::text, 'error'::text, 'blocked'::text]));

ALTER TABLE ace."attempt_answers" ADD CONSTRAINT "attempt_answers_attempt_id_question_id_key" UNIQUE (attempt_id, question_id);

ALTER TABLE ace."attempt_answers" ADD CONSTRAINT "attempt_answers_pkey" PRIMARY KEY (id);

ALTER TABLE ace."attempts" ADD CONSTRAINT "attempts_mode_check" CHECK (mode = ANY (ARRAY['practice'::text, 'cbt'::text, 'mock'::text, 'learning'::text, 'revision'::text, 'ai_practice'::text]));

ALTER TABLE ace."attempts" ADD CONSTRAINT "attempts_pkey" PRIMARY KEY (id);

ALTER TABLE ace."attempts" ADD CONSTRAINT "attempts_status_check" CHECK (status = ANY (ARRAY['active'::text, 'paused'::text, 'completed'::text, 'abandoned'::text]));

ALTER TABLE ace."audit_events" ADD CONSTRAINT "audit_events_pkey" PRIMARY KEY (id);

ALTER TABLE ace."catalog_import_batches" ADD CONSTRAINT "catalog_import_batches_dataset_type_check" CHECK (dataset_type = ANY (ARRAY['institutions'::text, 'programs'::text, 'utme_rules'::text, 'syllabus'::text]));

ALTER TABLE ace."catalog_import_batches" ADD CONSTRAINT "catalog_import_batches_pkey" PRIMARY KEY (id);

ALTER TABLE ace."catalog_import_batches" ADD CONSTRAINT "catalog_import_batches_row_count_check" CHECK (row_count >= 0);

ALTER TABLE ace."catalog_import_batches" ADD CONSTRAINT "catalog_import_batches_status_check" CHECK (status = ANY (ARRAY['staged'::text, 'reviewing'::text, 'approved'::text, 'published'::text, 'rejected'::text]));

ALTER TABLE ace."catalog_import_rows" ADD CONSTRAINT "catalog_import_rows_batch_id_row_number_key" UNIQUE (batch_id, row_number);

ALTER TABLE ace."catalog_import_rows" ADD CONSTRAINT "catalog_import_rows_entity_type_check" CHECK (entity_type = ANY (ARRAY['institution'::text, 'program'::text, 'program_utme_rule'::text, 'syllabus_topic'::text, 'syllabus_subtopic'::text]));

ALTER TABLE ace."catalog_import_rows" ADD CONSTRAINT "catalog_import_rows_pkey" PRIMARY KEY (id);

ALTER TABLE ace."catalog_import_rows" ADD CONSTRAINT "catalog_import_rows_row_number_check" CHECK (row_number > 0);

ALTER TABLE ace."catalog_import_rows" ADD CONSTRAINT "catalog_import_rows_validation_status_check" CHECK (validation_status = ANY (ARRAY['pending'::text, 'valid'::text, 'invalid'::text, 'approved'::text, 'rejected'::text]));

ALTER TABLE ace."catalog_sources" ADD CONSTRAINT "catalog_sources_pkey" PRIMARY KEY (id);

ALTER TABLE ace."catalog_sources" ADD CONSTRAINT "catalog_sources_source_type_check" CHECK (source_type = ANY (ARRAY['jamb'::text, 'ibass'::text, 'institution'::text, 'other'::text]));

ALTER TABLE ace."catalog_sources" ADD CONSTRAINT "catalog_sources_status_check" CHECK (status = ANY (ARRAY['discovered'::text, 'reviewed'::text, 'approved'::text, 'superseded'::text, 'rejected'::text]));

ALTER TABLE ace."devices" ADD CONSTRAINT "devices_pkey" PRIMARY KEY (id);

ALTER TABLE ace."devices" ADD CONSTRAINT "devices_user_id_device_hash_key" UNIQUE (user_id, device_hash);

ALTER TABLE ace."entitlements" ADD CONSTRAINT "entitlements_check" CHECK (ends_at > starts_at);

ALTER TABLE ace."entitlements" ADD CONSTRAINT "entitlements_pkey" PRIMARY KEY (id);

ALTER TABLE ace."entitlements" ADD CONSTRAINT "entitlements_source_check" CHECK (source = ANY (ARRAY['payment'::text, 'referral'::text, 'admin'::text, 'promo'::text]));

ALTER TABLE ace."entitlements" ADD CONSTRAINT "entitlements_status_check" CHECK (status = ANY (ARRAY['active'::text, 'expired'::text, 'revoked'::text]));

ALTER TABLE ace."exam_config_subjects" ADD CONSTRAINT "exam_config_subjects_pkey" PRIMARY KEY (exam_config_id, subject_id);

ALTER TABLE ace."exam_config_subjects" ADD CONSTRAINT "exam_config_subjects_question_count_check" CHECK (question_count > 0);

ALTER TABLE ace."exam_configs" ADD CONSTRAINT "exam_configs_duration_seconds_check" CHECK (duration_seconds > 0);

ALTER TABLE ace."exam_configs" ADD CONSTRAINT "exam_configs_option_count_check" CHECK (option_count >= 2 AND option_count <= 8);

ALTER TABLE ace."exam_configs" ADD CONSTRAINT "exam_configs_pkey" PRIMARY KEY (id);

ALTER TABLE ace."exam_configs" ADD CONSTRAINT "exam_configs_season_id_version_key" UNIQUE (season_id, version);

ALTER TABLE ace."exam_configs" ADD CONSTRAINT "exam_configs_total_questions_check" CHECK (total_questions > 0);

ALTER TABLE ace."exam_seasons" ADD CONSTRAINT "exam_seasons_code_key" UNIQUE (code);

ALTER TABLE ace."exam_seasons" ADD CONSTRAINT "exam_seasons_pkey" PRIMARY KEY (id);

ALTER TABLE ace."exam_seasons" ADD CONSTRAINT "exam_seasons_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'closed'::text, 'archived'::text]));

ALTER TABLE ace."feature_flags" ADD CONSTRAINT "feature_flags_pkey" PRIMARY KEY (key);

ALTER TABLE ace."feature_flags" ADD CONSTRAINT "feature_flags_rollout_check" CHECK (rollout >= 0::numeric AND rollout <= 100::numeric);

ALTER TABLE ace."flashcard_reviews" ADD CONSTRAINT "flashcard_reviews_pkey" PRIMARY KEY (user_id, flashcard_id);

ALTER TABLE ace."flashcards" ADD CONSTRAINT "flashcards_pkey" PRIMARY KEY (id);

ALTER TABLE ace."flashcards" ADD CONSTRAINT "flashcards_source_type_check" CHECK (source_type = ANY (ARRAY['platform'::text, 'licensed'::text, 'derived'::text, 'ai_reviewed'::text]));

ALTER TABLE ace."institutions" ADD CONSTRAINT "institutions_institution_type_check" CHECK (institution_type = ANY (ARRAY['university'::text, 'polytechnic'::text, 'college_of_education'::text, 'other'::text]));

ALTER TABLE ace."institutions" ADD CONSTRAINT "institutions_jamb_code_key" UNIQUE (jamb_code);

ALTER TABLE ace."institutions" ADD CONSTRAINT "institutions_ownership_check" CHECK (ownership = ANY (ARRAY['federal'::text, 'state'::text, 'private'::text, 'other'::text]));

ALTER TABLE ace."institutions" ADD CONSTRAINT "institutions_pkey" PRIMARY KEY (id);

ALTER TABLE ace."institutions" ADD CONSTRAINT "institutions_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'suspended'::text, 'archived'::text]));

ALTER TABLE ace."knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_pkey" PRIMARY KEY (id);

ALTER TABLE ace."knowledge_sources" ADD CONSTRAINT "knowledge_sources_pkey" PRIMARY KEY (id);

ALTER TABLE ace."knowledge_sources" ADD CONSTRAINT "knowledge_sources_rights_status_check" CHECK (rights_status = ANY (ARRAY['pending'::text, 'approved'::text, 'restricted'::text, 'rejected'::text, 'takedown'::text]));

ALTER TABLE ace."knowledge_sources" ADD CONSTRAINT "knowledge_sources_source_type_check" CHECK (source_type = ANY (ARRAY['jamb_syllabus'::text, 'textbook'::text, 'past_question'::text, 'platform'::text, 'web'::text, 'other'::text]));

ALTER TABLE ace."learning_progress" ADD CONSTRAINT "learning_progress_check" CHECK (subject_id IS NOT NULL OR topic_id IS NOT NULL OR subtopic_id IS NOT NULL);

ALTER TABLE ace."learning_progress" ADD CONSTRAINT "learning_progress_mastery_check" CHECK (mastery >= 0::numeric AND mastery <= 1::numeric);

ALTER TABLE ace."learning_progress" ADD CONSTRAINT "learning_progress_pkey" PRIMARY KEY (user_id, subject_id, topic_id, subtopic_id);

ALTER TABLE ace."learning_progress" ADD CONSTRAINT "learning_progress_status_check" CHECK (status = ANY (ARRAY['not_started'::text, 'learning'::text, 'review'::text, 'mastered'::text]));

ALTER TABLE ace."notification_preferences" ADD CONSTRAINT "notification_preferences_pkey" PRIMARY KEY (user_id);

ALTER TABLE ace."notifications" ADD CONSTRAINT "notifications_pkey" PRIMARY KEY (id);

ALTER TABLE ace."payment_events" ADD CONSTRAINT "payment_events_pkey" PRIMARY KEY (id);

ALTER TABLE ace."payment_events" ADD CONSTRAINT "payment_events_provider_id_event_id_key" UNIQUE (provider_id, event_id);

ALTER TABLE ace."payment_providers" ADD CONSTRAINT "payment_providers_code_key" UNIQUE (code);

ALTER TABLE ace."payment_providers" ADD CONSTRAINT "payment_providers_pkey" PRIMARY KEY (id);

ALTER TABLE ace."payments" ADD CONSTRAINT "payments_amount_minor_check" CHECK (amount_minor >= 0);

ALTER TABLE ace."payments" ADD CONSTRAINT "payments_pkey" PRIMARY KEY (id);

ALTER TABLE ace."payments" ADD CONSTRAINT "payments_provider_id_provider_reference_key" UNIQUE (provider_id, provider_reference);

ALTER TABLE ace."payments" ADD CONSTRAINT "payments_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'verified'::text, 'failed'::text, 'refunded'::text, 'reversed'::text]));

ALTER TABLE ace."product_events" ADD CONSTRAINT "product_events_pkey" PRIMARY KEY (id);

ALTER TABLE ace."products" ADD CONSTRAINT "products_code_key" UNIQUE (code);

ALTER TABLE ace."products" ADD CONSTRAINT "products_duration_days_check" CHECK (duration_days IS NULL OR duration_days > 0);

ALTER TABLE ace."products" ADD CONSTRAINT "products_pkey" PRIMARY KEY (id);

ALTER TABLE ace."products" ADD CONSTRAINT "products_price_minor_check" CHECK (price_minor >= 0);

ALTER TABLE ace."profiles" ADD CONSTRAINT "profiles_pkey" PRIMARY KEY (id);

ALTER TABLE ace."profiles" ADD CONSTRAINT "profiles_prep_time_minutes_check" CHECK (prep_time_minutes IS NULL OR prep_time_minutes >= 0);

ALTER TABLE ace."profiles" ADD CONSTRAINT "profiles_prep_time_positive" CHECK (prep_time_minutes IS NULL OR prep_time_minutes > 0);

ALTER TABLE ace."profiles" ADD CONSTRAINT "profiles_target_score_check" CHECK (target_score >= 0 AND target_score <= 400);

ALTER TABLE ace."profiles" ADD CONSTRAINT "profiles_target_score_range" CHECK (target_score IS NULL OR target_score >= 0 AND target_score <= 400);

ALTER TABLE ace."program_utme_rules" ADD CONSTRAINT "program_utme_rules_minimum_optional_subjects_check" CHECK (minimum_optional_subjects >= 0);

ALTER TABLE ace."program_utme_rules" ADD CONSTRAINT "program_utme_rules_pkey" PRIMARY KEY (id);

ALTER TABLE ace."program_utme_rules" ADD CONSTRAINT "program_utme_rules_season_id_program_id_version_key" UNIQUE (season_id, program_id, version);

ALTER TABLE ace."program_utme_rules" ADD CONSTRAINT "program_utme_rules_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'archived'::text]));

ALTER TABLE ace."program_utme_rules" ADD CONSTRAINT "program_utme_rules_version_check" CHECK (version > 0);

ALTER TABLE ace."programs" ADD CONSTRAINT "programs_institution_id_name_key" UNIQUE (institution_id, name);

ALTER TABLE ace."programs" ADD CONSTRAINT "programs_pkey" PRIMARY KEY (id);

ALTER TABLE ace."programs" ADD CONSTRAINT "programs_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'suspended'::text, 'archived'::text]));

ALTER TABLE ace."question_media" ADD CONSTRAINT "question_media_kind_check" CHECK (kind = ANY (ARRAY['image'::text, 'audio'::text, 'video'::text, 'diagram'::text, 'file'::text]));

ALTER TABLE ace."question_media" ADD CONSTRAINT "question_media_pkey" PRIMARY KEY (id);

ALTER TABLE ace."question_media" ADD CONSTRAINT "question_media_size_bytes_check" CHECK (size_bytes IS NULL OR size_bytes >= 0);

ALTER TABLE ace."question_versions" ADD CONSTRAINT "question_versions_pkey" PRIMARY KEY (id);

ALTER TABLE ace."question_versions" ADD CONSTRAINT "question_versions_question_id_version_key" UNIQUE (question_id, version);

ALTER TABLE ace."questions" ADD CONSTRAINT "questions_difficulty_check" CHECK (difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text]));

ALTER TABLE ace."questions" ADD CONSTRAINT "questions_pkey" PRIMARY KEY (id);

ALTER TABLE ace."questions" ADD CONSTRAINT "questions_review_status_check" CHECK (review_status = ANY (ARRAY['draft'::text, 'in_review'::text, 'approved'::text, 'published'::text, 'rejected'::text]));

ALTER TABLE ace."questions" ADD CONSTRAINT "questions_rights_status_check" CHECK (rights_status = ANY (ARRAY['unknown'::text, 'owned'::text, 'licensed'::text, 'permitted'::text, 'restricted'::text, 'rejected'::text]));

ALTER TABLE ace."referral_campaigns" ADD CONSTRAINT "referral_campaigns_pkey" PRIMARY KEY (id);

ALTER TABLE ace."referral_campaigns" ADD CONSTRAINT "referral_campaigns_required_qualified_referrals_check" CHECK (required_qualified_referrals > 0);

ALTER TABLE ace."referral_codes" ADD CONSTRAINT "referral_codes_code_key" UNIQUE (code);

ALTER TABLE ace."referral_codes" ADD CONSTRAINT "referral_codes_pkey" PRIMARY KEY (id);

ALTER TABLE ace."referral_codes" ADD CONSTRAINT "referral_codes_user_id_key" UNIQUE (user_id);

ALTER TABLE ace."referral_rewards" ADD CONSTRAINT "referral_rewards_campaign_id_user_id_key" UNIQUE (campaign_id, user_id);

ALTER TABLE ace."referral_rewards" ADD CONSTRAINT "referral_rewards_pkey" PRIMARY KEY (id);

ALTER TABLE ace."referrals" ADD CONSTRAINT "referrals_check" CHECK (referrer_user_id <> referred_user_id);

ALTER TABLE ace."referrals" ADD CONSTRAINT "referrals_pkey" PRIMARY KEY (id);

ALTER TABLE ace."referrals" ADD CONSTRAINT "referrals_referred_user_id_key" UNIQUE (referred_user_id);

ALTER TABLE ace."referrals" ADD CONSTRAINT "referrals_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'qualified'::text, 'rejected'::text, 'reversed'::text]));

ALTER TABLE ace."roles" ADD CONSTRAINT "roles_pkey" PRIMARY KEY (user_id);

ALTER TABLE ace."roles" ADD CONSTRAINT "roles_role_check" CHECK (role = ANY (ARRAY['student'::text, 'editor'::text, 'admin'::text]));

ALTER TABLE ace."student_preferences" ADD CONSTRAINT "student_preferences_daily_minutes_check" CHECK (daily_minutes IS NULL OR daily_minutes > 0);

ALTER TABLE ace."student_preferences" ADD CONSTRAINT "student_preferences_pkey" PRIMARY KEY (user_id);

ALTER TABLE ace."student_question_stats" ADD CONSTRAINT "student_question_stats_pkey" PRIMARY KEY (user_id, question_id);

ALTER TABLE ace."student_subjects" ADD CONSTRAINT "student_subjects_pkey" PRIMARY KEY (user_id, subject_id);

ALTER TABLE ace."study_plan_items" ADD CONSTRAINT "study_plan_items_pkey" PRIMARY KEY (id);

ALTER TABLE ace."study_plan_items" ADD CONSTRAINT "study_plan_items_plan_id_position_key" UNIQUE (plan_id, "position");

ALTER TABLE ace."study_plans" ADD CONSTRAINT "study_plans_generated_by_check" CHECK (generated_by = ANY (ARRAY['system'::text, 'ai'::text, 'admin'::text, 'hybrid'::text]));

ALTER TABLE ace."study_plans" ADD CONSTRAINT "study_plans_pkey" PRIMARY KEY (id);

ALTER TABLE ace."study_plans" ADD CONSTRAINT "study_plans_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'completed'::text, 'archived'::text]));

ALTER TABLE ace."subjects" ADD CONSTRAINT "subjects_code_key" UNIQUE (code);

ALTER TABLE ace."subjects" ADD CONSTRAINT "subjects_pkey" PRIMARY KEY (id);

ALTER TABLE ace."subtopics" ADD CONSTRAINT "subtopics_pkey" PRIMARY KEY (id);

ALTER TABLE ace."subtopics" ADD CONSTRAINT "subtopics_topic_id_name_key" UNIQUE (topic_id, name);

ALTER TABLE ace."syllabus_versions" ADD CONSTRAINT "syllabus_versions_id_subject_key" UNIQUE (id, subject_id);

ALTER TABLE ace."syllabus_versions" ADD CONSTRAINT "syllabus_versions_pkey" PRIMARY KEY (id);

ALTER TABLE ace."syllabus_versions" ADD CONSTRAINT "syllabus_versions_rights_status_check" CHECK (rights_status = ANY (ARRAY['pending'::text, 'approved'::text, 'restricted'::text, 'rejected'::text]));

ALTER TABLE ace."syllabus_versions" ADD CONSTRAINT "syllabus_versions_season_id_subject_id_version_key" UNIQUE (season_id, subject_id, version);

ALTER TABLE ace."syllabus_versions" ADD CONSTRAINT "syllabus_versions_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'archived'::text]));

ALTER TABLE ace."syllabus_versions" ADD CONSTRAINT "syllabus_versions_version_check" CHECK (version > 0);

ALTER TABLE ace."topics" ADD CONSTRAINT "topics_id_version_key" UNIQUE (id, syllabus_version_id);

ALTER TABLE ace."topics" ADD CONSTRAINT "topics_pkey" PRIMARY KEY (id);

ALTER TABLE ace."topics" ADD CONSTRAINT "topics_version_name_key" UNIQUE (syllabus_version_id, name);

ALTER TABLE ace."ai_requests" ADD CONSTRAINT "ai_requests_provider_id_fkey" FOREIGN KEY (provider_id) REFERENCES ace.ai_providers(id) ON DELETE SET NULL;

ALTER TABLE ace."ai_requests" ADD CONSTRAINT "ai_requests_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE ace."ai_usage" ADD CONSTRAINT "ai_usage_provider_id_fkey" FOREIGN KEY (provider_id) REFERENCES ace.ai_providers(id) ON DELETE SET NULL;

ALTER TABLE ace."ai_usage" ADD CONSTRAINT "ai_usage_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE ace."attempt_answers" ADD CONSTRAINT "attempt_answers_attempt_id_fkey" FOREIGN KEY (attempt_id) REFERENCES ace.attempts(id) ON DELETE CASCADE;

ALTER TABLE ace."attempt_answers" ADD CONSTRAINT "attempt_answers_question_id_fkey" FOREIGN KEY (question_id) REFERENCES ace.questions(id);

ALTER TABLE ace."attempts" ADD CONSTRAINT "attempts_subject_id_fkey" FOREIGN KEY (subject_id) REFERENCES ace.subjects(id);

ALTER TABLE ace."attempts" ADD CONSTRAINT "attempts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ace."audit_events" ADD CONSTRAINT "audit_events_actor_user_id_fkey" FOREIGN KEY (actor_user_id) REFERENCES auth.users(id);

ALTER TABLE ace."catalog_import_batches" ADD CONSTRAINT "catalog_import_batches_season_id_fkey" FOREIGN KEY (season_id) REFERENCES ace.exam_seasons(id) ON DELETE RESTRICT;

ALTER TABLE ace."catalog_import_batches" ADD CONSTRAINT "catalog_import_batches_source_id_fkey" FOREIGN KEY (source_id) REFERENCES ace.catalog_sources(id) ON DELETE RESTRICT;

ALTER TABLE ace."catalog_import_rows" ADD CONSTRAINT "catalog_import_rows_batch_id_fkey" FOREIGN KEY (batch_id) REFERENCES ace.catalog_import_batches(id) ON DELETE CASCADE;

ALTER TABLE ace."devices" ADD CONSTRAINT "devices_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ace."entitlements" ADD CONSTRAINT "entitlements_payment_id_fkey" FOREIGN KEY (payment_id) REFERENCES ace.payments(id) ON DELETE SET NULL;

ALTER TABLE ace."entitlements" ADD CONSTRAINT "entitlements_product_id_fkey" FOREIGN KEY (product_id) REFERENCES ace.products(id) ON DELETE SET NULL;

ALTER TABLE ace."entitlements" ADD CONSTRAINT "entitlements_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ace."exam_config_subjects" ADD CONSTRAINT "exam_config_subjects_exam_config_id_fkey" FOREIGN KEY (exam_config_id) REFERENCES ace.exam_configs(id) ON DELETE CASCADE;

ALTER TABLE ace."exam_config_subjects" ADD CONSTRAINT "exam_config_subjects_subject_id_fkey" FOREIGN KEY (subject_id) REFERENCES ace.subjects(id) ON DELETE RESTRICT;

ALTER TABLE ace."exam_configs" ADD CONSTRAINT "exam_configs_season_id_fkey" FOREIGN KEY (season_id) REFERENCES ace.exam_seasons(id) ON DELETE CASCADE;

ALTER TABLE ace."flashcard_reviews" ADD CONSTRAINT "flashcard_reviews_flashcard_id_fkey" FOREIGN KEY (flashcard_id) REFERENCES ace.flashcards(id) ON DELETE CASCADE;

ALTER TABLE ace."flashcard_reviews" ADD CONSTRAINT "flashcard_reviews_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ace."flashcards" ADD CONSTRAINT "flashcards_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE ace."flashcards" ADD CONSTRAINT "flashcards_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE ace."flashcards" ADD CONSTRAINT "flashcards_subject_id_fkey" FOREIGN KEY (subject_id) REFERENCES ace.subjects(id) ON DELETE SET NULL;

ALTER TABLE ace."flashcards" ADD CONSTRAINT "flashcards_subtopic_id_fkey" FOREIGN KEY (subtopic_id) REFERENCES ace.subtopics(id) ON DELETE SET NULL;

ALTER TABLE ace."flashcards" ADD CONSTRAINT "flashcards_topic_id_fkey" FOREIGN KEY (topic_id) REFERENCES ace.topics(id) ON DELETE SET NULL;

ALTER TABLE ace."knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_source_id_fkey" FOREIGN KEY (source_id) REFERENCES ace.knowledge_sources(id) ON DELETE CASCADE;

ALTER TABLE ace."knowledge_sources" ADD CONSTRAINT "knowledge_sources_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE ace."knowledge_sources" ADD CONSTRAINT "knowledge_sources_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE ace."learning_progress" ADD CONSTRAINT "learning_progress_subject_id_fkey" FOREIGN KEY (subject_id) REFERENCES ace.subjects(id) ON DELETE CASCADE;

ALTER TABLE ace."learning_progress" ADD CONSTRAINT "learning_progress_subtopic_id_fkey" FOREIGN KEY (subtopic_id) REFERENCES ace.subtopics(id) ON DELETE CASCADE;

ALTER TABLE ace."learning_progress" ADD CONSTRAINT "learning_progress_topic_id_fkey" FOREIGN KEY (topic_id) REFERENCES ace.topics(id) ON DELETE CASCADE;

ALTER TABLE ace."learning_progress" ADD CONSTRAINT "learning_progress_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ace."notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ace."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ace."payment_events" ADD CONSTRAINT "payment_events_provider_id_fkey" FOREIGN KEY (provider_id) REFERENCES ace.payment_providers(id) ON DELETE SET NULL;

ALTER TABLE ace."payments" ADD CONSTRAINT "payments_product_id_fkey" FOREIGN KEY (product_id) REFERENCES ace.products(id) ON DELETE SET NULL;

ALTER TABLE ace."payments" ADD CONSTRAINT "payments_provider_id_fkey" FOREIGN KEY (provider_id) REFERENCES ace.payment_providers(id) ON DELETE SET NULL;

ALTER TABLE ace."payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE RESTRICT;

ALTER TABLE ace."product_events" ADD CONSTRAINT "product_events_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE ace."products" ADD CONSTRAINT "products_season_id_fkey" FOREIGN KEY (season_id) REFERENCES ace.exam_seasons(id) ON DELETE SET NULL;

ALTER TABLE ace."profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ace."profiles" ADD CONSTRAINT "profiles_institution_id_fkey" FOREIGN KEY (institution_id) REFERENCES ace.institutions(id);

ALTER TABLE ace."profiles" ADD CONSTRAINT "profiles_program_id_fkey" FOREIGN KEY (program_id) REFERENCES ace.programs(id);

ALTER TABLE ace."program_utme_rules" ADD CONSTRAINT "program_utme_rules_program_id_fkey" FOREIGN KEY (program_id) REFERENCES ace.programs(id) ON DELETE CASCADE;

ALTER TABLE ace."program_utme_rules" ADD CONSTRAINT "program_utme_rules_season_id_fkey" FOREIGN KEY (season_id) REFERENCES ace.exam_seasons(id) ON DELETE RESTRICT;

ALTER TABLE ace."programs" ADD CONSTRAINT "programs_institution_id_fkey" FOREIGN KEY (institution_id) REFERENCES ace.institutions(id) ON DELETE RESTRICT;

ALTER TABLE ace."question_media" ADD CONSTRAINT "question_media_question_id_fkey" FOREIGN KEY (question_id) REFERENCES ace.questions(id) ON DELETE CASCADE;

ALTER TABLE ace."question_versions" ADD CONSTRAINT "question_versions_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE ace."question_versions" ADD CONSTRAINT "question_versions_question_id_fkey" FOREIGN KEY (question_id) REFERENCES ace.questions(id) ON DELETE CASCADE;

ALTER TABLE ace."questions" ADD CONSTRAINT "questions_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE ace."questions" ADD CONSTRAINT "questions_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);

ALTER TABLE ace."questions" ADD CONSTRAINT "questions_subject_id_fkey" FOREIGN KEY (subject_id) REFERENCES ace.subjects(id);

ALTER TABLE ace."questions" ADD CONSTRAINT "questions_subtopic_id_fkey" FOREIGN KEY (subtopic_id) REFERENCES ace.subtopics(id);

ALTER TABLE ace."questions" ADD CONSTRAINT "questions_topic_id_fkey" FOREIGN KEY (topic_id) REFERENCES ace.topics(id);

ALTER TABLE ace."referral_campaigns" ADD CONSTRAINT "referral_campaigns_reward_product_id_fkey" FOREIGN KEY (reward_product_id) REFERENCES ace.products(id) ON DELETE SET NULL;

ALTER TABLE ace."referral_campaigns" ADD CONSTRAINT "referral_campaigns_season_id_fkey" FOREIGN KEY (season_id) REFERENCES ace.exam_seasons(id) ON DELETE SET NULL;

ALTER TABLE ace."referral_codes" ADD CONSTRAINT "referral_codes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ace."referral_rewards" ADD CONSTRAINT "referral_rewards_campaign_id_fkey" FOREIGN KEY (campaign_id) REFERENCES ace.referral_campaigns(id) ON DELETE CASCADE;

ALTER TABLE ace."referral_rewards" ADD CONSTRAINT "referral_rewards_entitlement_id_fkey" FOREIGN KEY (entitlement_id) REFERENCES ace.entitlements(id) ON DELETE SET NULL;

ALTER TABLE ace."referral_rewards" ADD CONSTRAINT "referral_rewards_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ace."referrals" ADD CONSTRAINT "referrals_referral_code_id_fkey" FOREIGN KEY (referral_code_id) REFERENCES ace.referral_codes(id) ON DELETE SET NULL;

ALTER TABLE ace."referrals" ADD CONSTRAINT "referrals_referred_user_id_fkey" FOREIGN KEY (referred_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ace."referrals" ADD CONSTRAINT "referrals_referrer_user_id_fkey" FOREIGN KEY (referrer_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ace."roles" ADD CONSTRAINT "roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ace."student_preferences" ADD CONSTRAINT "student_preferences_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ace."student_question_stats" ADD CONSTRAINT "student_question_stats_question_id_fkey" FOREIGN KEY (question_id) REFERENCES ace.questions(id) ON DELETE CASCADE;

ALTER TABLE ace."student_question_stats" ADD CONSTRAINT "student_question_stats_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ace."student_subjects" ADD CONSTRAINT "student_subjects_subject_id_fkey" FOREIGN KEY (subject_id) REFERENCES ace.subjects(id) ON DELETE CASCADE;

ALTER TABLE ace."student_subjects" ADD CONSTRAINT "student_subjects_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ace."study_plan_items" ADD CONSTRAINT "study_plan_items_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES ace.study_plans(id) ON DELETE CASCADE;

ALTER TABLE ace."study_plan_items" ADD CONSTRAINT "study_plan_items_subject_id_fkey" FOREIGN KEY (subject_id) REFERENCES ace.subjects(id) ON DELETE SET NULL;

ALTER TABLE ace."study_plan_items" ADD CONSTRAINT "study_plan_items_subtopic_id_fkey" FOREIGN KEY (subtopic_id) REFERENCES ace.subtopics(id) ON DELETE SET NULL;

ALTER TABLE ace."study_plan_items" ADD CONSTRAINT "study_plan_items_topic_id_fkey" FOREIGN KEY (topic_id) REFERENCES ace.topics(id) ON DELETE SET NULL;

ALTER TABLE ace."study_plans" ADD CONSTRAINT "study_plans_season_id_fkey" FOREIGN KEY (season_id) REFERENCES ace.exam_seasons(id) ON DELETE SET NULL;

ALTER TABLE ace."study_plans" ADD CONSTRAINT "study_plans_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ace."subtopics" ADD CONSTRAINT "subtopics_parent_version_fkey" FOREIGN KEY (topic_id, syllabus_version_id) REFERENCES ace.topics(id, syllabus_version_id) ON DELETE CASCADE;

ALTER TABLE ace."subtopics" ADD CONSTRAINT "subtopics_syllabus_version_id_fkey" FOREIGN KEY (syllabus_version_id) REFERENCES ace.syllabus_versions(id) ON DELETE RESTRICT;

ALTER TABLE ace."subtopics" ADD CONSTRAINT "subtopics_topic_id_fkey" FOREIGN KEY (topic_id) REFERENCES ace.topics(id) ON DELETE CASCADE;

ALTER TABLE ace."syllabus_versions" ADD CONSTRAINT "syllabus_versions_season_id_fkey" FOREIGN KEY (season_id) REFERENCES ace.exam_seasons(id) ON DELETE RESTRICT;

ALTER TABLE ace."syllabus_versions" ADD CONSTRAINT "syllabus_versions_subject_id_fkey" FOREIGN KEY (subject_id) REFERENCES ace.subjects(id) ON DELETE RESTRICT;

ALTER TABLE ace."topics" ADD CONSTRAINT "topics_subject_id_fkey" FOREIGN KEY (subject_id) REFERENCES ace.subjects(id) ON DELETE CASCADE;

ALTER TABLE ace."topics" ADD CONSTRAINT "topics_syllabus_version_id_fkey" FOREIGN KEY (syllabus_version_id) REFERENCES ace.syllabus_versions(id) ON DELETE RESTRICT;

ALTER TABLE ace."topics" ADD CONSTRAINT "topics_version_subject_fkey" FOREIGN KEY (syllabus_version_id, subject_id) REFERENCES ace.syllabus_versions(id, subject_id) ON DELETE RESTRICT;

CREATE INDEX idx_ai_requests_provider ON ace.ai_requests USING btree (provider_id);

CREATE INDEX idx_ai_requests_user_created ON ace.ai_requests USING btree (user_id, created_at DESC);

CREATE INDEX idx_ai_usage_provider ON ace.ai_usage USING btree (provider_id);

CREATE INDEX idx_ai_usage_user_created ON ace.ai_usage USING btree (user_id, created_at DESC);

CREATE INDEX idx_answers_attempt ON ace.attempt_answers USING btree (attempt_id);

CREATE INDEX idx_attempt_answers_question ON ace.attempt_answers USING btree (question_id);

CREATE INDEX idx_attempts_subject ON ace.attempts USING btree (subject_id);

CREATE INDEX idx_attempts_user_started ON ace.attempts USING btree (user_id, started_at DESC);

CREATE INDEX idx_attempts_user_status ON ace.attempts USING btree (user_id, status);

CREATE INDEX idx_audit_actor_created ON ace.audit_events USING btree (actor_user_id, created_at DESC);

CREATE INDEX idx_catalog_batches_season_type ON ace.catalog_import_batches USING btree (season_id, dataset_type, status);

CREATE INDEX idx_catalog_batches_source ON ace.catalog_import_batches USING btree (source_id);

CREATE UNIQUE INDEX uq_catalog_import_batches_snapshot_hash ON ace.catalog_import_batches USING btree (snapshot_hash) WHERE (snapshot_hash IS NOT NULL);

CREATE INDEX idx_catalog_rows_batch_status ON ace.catalog_import_rows USING btree (batch_id, validation_status);

CREATE INDEX idx_catalog_sources_status ON ace.catalog_sources USING btree (status, source_type);

CREATE INDEX idx_devices_user ON ace.devices USING btree (user_id);

CREATE INDEX idx_entitlements_payment ON ace.entitlements USING btree (payment_id);

CREATE INDEX idx_entitlements_product ON ace.entitlements USING btree (product_id);

CREATE INDEX idx_entitlements_user_window ON ace.entitlements USING btree (user_id, status, starts_at, ends_at);

CREATE INDEX idx_exam_config_subjects_subject ON ace.exam_config_subjects USING btree (subject_id);

CREATE INDEX idx_exam_configs_season_active ON ace.exam_configs USING btree (season_id, active);

CREATE UNIQUE INDEX ux_exam_configs_single_active_per_season ON ace.exam_configs USING btree (season_id) WHERE (active = true);

CREATE UNIQUE INDEX ux_exam_seasons_single_active ON ace.exam_seasons USING btree (status) WHERE (status = 'active'::text);

CREATE INDEX idx_flashcard_reviews_card ON ace.flashcard_reviews USING btree (flashcard_id);

CREATE INDEX idx_flashcard_reviews_due ON ace.flashcard_reviews USING btree (user_id, next_review_at);

CREATE INDEX idx_flashcards_created_by ON ace.flashcards USING btree (created_by);

CREATE INDEX idx_flashcards_reviewed_by ON ace.flashcards USING btree (reviewed_by);

CREATE INDEX idx_flashcards_subtopic ON ace.flashcards USING btree (subtopic_id);

CREATE INDEX idx_flashcards_taxonomy ON ace.flashcards USING btree (subject_id, topic_id, subtopic_id, active);

CREATE INDEX idx_flashcards_topic ON ace.flashcards USING btree (topic_id);

CREATE INDEX idx_institutions_active_name ON ace.institutions USING btree (status, name);

CREATE INDEX idx_knowledge_chunks_source ON ace.knowledge_chunks USING btree (source_id);

CREATE INDEX idx_knowledge_sources_created_by ON ace.knowledge_sources USING btree (created_by);

CREATE INDEX idx_knowledge_sources_reviewed_by ON ace.knowledge_sources USING btree (reviewed_by);

CREATE INDEX idx_learning_progress_subject ON ace.learning_progress USING btree (subject_id);

CREATE INDEX idx_learning_progress_subtopic ON ace.learning_progress USING btree (subtopic_id);

CREATE INDEX idx_learning_progress_topic ON ace.learning_progress USING btree (topic_id);

CREATE INDEX idx_learning_progress_user ON ace.learning_progress USING btree (user_id, subject_id, topic_id, subtopic_id);

CREATE INDEX idx_notifications_user_unread ON ace.notifications USING btree (user_id, read_at, created_at DESC);

CREATE INDEX idx_payments_product ON ace.payments USING btree (product_id);

CREATE INDEX idx_payments_status ON ace.payments USING btree (status);

CREATE INDEX idx_payments_user_created ON ace.payments USING btree (user_id, created_at DESC);

CREATE INDEX idx_product_events_user_created ON ace.product_events USING btree (user_id, created_at DESC);

CREATE INDEX idx_products_season ON ace.products USING btree (season_id);

CREATE INDEX idx_profiles_institution_id ON ace.profiles USING btree (institution_id);

CREATE INDEX idx_profiles_program_id ON ace.profiles USING btree (program_id);

CREATE INDEX idx_program_rules_season_program ON ace.program_utme_rules USING btree (season_id, program_id, status);

CREATE INDEX idx_program_utme_rules_program ON ace.program_utme_rules USING btree (program_id);

CREATE INDEX idx_programs_institution_active_name ON ace.programs USING btree (institution_id, status, name);

CREATE INDEX idx_question_media_question ON ace.question_media USING btree (question_id);

CREATE INDEX idx_question_versions_created_by ON ace.question_versions USING btree (created_by);

CREATE INDEX idx_questions_created_by ON ace.questions USING btree (created_by);

CREATE INDEX idx_questions_reviewed_by ON ace.questions USING btree (reviewed_by);

CREATE INDEX idx_questions_status ON ace.questions USING btree (review_status, active);

CREATE INDEX idx_questions_subtopic ON ace.questions USING btree (subtopic_id);

CREATE INDEX idx_questions_taxonomy ON ace.questions USING btree (subject_id, topic_id, subtopic_id);

CREATE INDEX idx_questions_topic ON ace.questions USING btree (topic_id);

CREATE INDEX idx_referral_campaigns_reward_product ON ace.referral_campaigns USING btree (reward_product_id);

CREATE INDEX idx_referral_campaigns_season ON ace.referral_campaigns USING btree (season_id);

CREATE INDEX idx_referral_rewards_entitlement ON ace.referral_rewards USING btree (entitlement_id);

CREATE INDEX idx_referral_rewards_user ON ace.referral_rewards USING btree (user_id);

CREATE INDEX idx_referrals_code ON ace.referrals USING btree (referral_code_id);

CREATE INDEX idx_referrals_referrer_status ON ace.referrals USING btree (referrer_user_id, status);

CREATE INDEX idx_student_question_stats_question ON ace.student_question_stats USING btree (question_id);

CREATE INDEX idx_student_subjects_subject ON ace.student_subjects USING btree (subject_id);

CREATE INDEX idx_student_subjects_user ON ace.student_subjects USING btree (user_id);

CREATE INDEX idx_study_plan_items_plan_date ON ace.study_plan_items USING btree (plan_id, scheduled_for);

CREATE INDEX idx_study_plan_items_subject ON ace.study_plan_items USING btree (subject_id);

CREATE INDEX idx_study_plan_items_subtopic ON ace.study_plan_items USING btree (subtopic_id);

CREATE INDEX idx_study_plan_items_topic ON ace.study_plan_items USING btree (topic_id);

CREATE INDEX idx_study_plans_season ON ace.study_plans USING btree (season_id);

CREATE INDEX idx_study_plans_user_status ON ace.study_plans USING btree (user_id, status);

CREATE INDEX idx_subtopics_syllabus_version ON ace.subtopics USING btree (syllabus_version_id, sort_order);

CREATE INDEX idx_subtopics_topic ON ace.subtopics USING btree (topic_id);

CREATE INDEX idx_syllabus_versions_active ON ace.syllabus_versions USING btree (season_id, status);

CREATE INDEX idx_syllabus_versions_season_subject ON ace.syllabus_versions USING btree (season_id, subject_id);

CREATE INDEX idx_syllabus_versions_subject ON ace.syllabus_versions USING btree (subject_id);

CREATE UNIQUE INDEX ux_active_syllabus_per_season_subject ON ace.syllabus_versions USING btree (season_id, subject_id) WHERE (status = 'active'::text);

CREATE INDEX idx_topics_subject ON ace.topics USING btree (subject_id);

CREATE INDEX idx_topics_syllabus_version ON ace.topics USING btree (syllabus_version_id, sort_order);

CREATE UNIQUE INDEX topics_legacy_subject_name_idx ON ace.topics USING btree (subject_id, name) WHERE (syllabus_version_id IS NULL);

ALTER TABLE ace."ai_providers" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."ai_requests" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."ai_usage" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."attempt_answers" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."attempts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."audit_events" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."catalog_import_batches" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."catalog_import_rows" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."catalog_sources" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."devices" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."entitlements" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."exam_config_subjects" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."exam_configs" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."exam_seasons" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."feature_flags" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."flashcard_reviews" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."flashcards" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."institutions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."knowledge_chunks" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."knowledge_sources" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."learning_progress" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."notification_preferences" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."notifications" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."payment_events" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."payment_providers" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."payments" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."product_events" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."products" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."profiles" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."program_utme_rules" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."programs" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."question_media" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."question_versions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."questions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."referral_campaigns" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."referral_codes" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."referral_rewards" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."referrals" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."roles" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."student_preferences" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."student_question_stats" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."student_subjects" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."study_plan_items" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."study_plans" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."subjects" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."subtopics" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."syllabus_versions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE ace."topics" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_providers_admin_all" ON ace."ai_providers" AS PERMISSIVE FOR ALL TO "authenticated" USING (ace.is_admin()) WITH CHECK (ace.is_admin());

CREATE POLICY "ai_providers_admin_read" ON ace."ai_providers" AS PERMISSIVE FOR SELECT TO "authenticated" USING (ace.is_admin());

CREATE POLICY "ai_requests_self" ON ace."ai_requests" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((user_id = auth.uid()));

CREATE POLICY "ai_usage_admin_read" ON ace."ai_usage" AS PERMISSIVE FOR SELECT TO "authenticated" USING (ace.is_admin());

CREATE POLICY "ai_usage_self" ON ace."ai_usage" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((user_id = auth.uid()));

CREATE POLICY "answers_owner" ON ace."attempt_answers" AS PERMISSIVE FOR ALL TO PUBLIC USING ((EXISTS ( SELECT 1
   FROM ace.attempts a
  WHERE ((a.id = attempt_answers.attempt_id) AND ((a.user_id = auth.uid()) OR ace.is_admin()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ace.attempts a
  WHERE ((a.id = attempt_answers.attempt_id) AND ((a.user_id = auth.uid()) OR ace.is_admin())))));

CREATE POLICY "attempts_owner" ON ace."attempts" AS PERMISSIVE FOR ALL TO PUBLIC USING (((user_id = auth.uid()) OR ace.is_admin())) WITH CHECK (((user_id = auth.uid()) OR ace.is_admin()));

CREATE POLICY "audit_admin_read" ON ace."audit_events" AS PERMISSIVE FOR SELECT TO PUBLIC USING (((actor_user_id = auth.uid()) OR ace.is_admin()));

CREATE POLICY "audit_insert_authenticated" ON ace."audit_events" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK (((actor_user_id = auth.uid()) OR (actor_user_id IS NULL)));

CREATE POLICY "catalog_batches_manage_admin" ON ace."catalog_import_batches" AS PERMISSIVE FOR ALL TO "authenticated" USING (( SELECT ace.is_admin() AS is_admin)) WITH CHECK (( SELECT ace.is_admin() AS is_admin));

CREATE POLICY "catalog_batches_read_editor" ON ace."catalog_import_batches" AS PERMISSIVE FOR SELECT TO "authenticated" USING (ace.is_admin_or_editor());

CREATE POLICY "catalog_rows_manage_admin" ON ace."catalog_import_rows" AS PERMISSIVE FOR ALL TO "authenticated" USING (( SELECT ace.is_admin() AS is_admin)) WITH CHECK (( SELECT ace.is_admin() AS is_admin));

CREATE POLICY "catalog_rows_read_editor" ON ace."catalog_import_rows" AS PERMISSIVE FOR SELECT TO "authenticated" USING (ace.is_admin_or_editor());

CREATE POLICY "catalog_sources_manage_admin" ON ace."catalog_sources" AS PERMISSIVE FOR ALL TO "authenticated" USING (( SELECT ace.is_admin() AS is_admin)) WITH CHECK (( SELECT ace.is_admin() AS is_admin));

CREATE POLICY "catalog_sources_read_editor" ON ace."catalog_sources" AS PERMISSIVE FOR SELECT TO "authenticated" USING (ace.is_admin_or_editor());

CREATE POLICY "devices_self" ON ace."devices" AS PERMISSIVE FOR ALL TO "authenticated" USING ((user_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "entitlements_admin_all" ON ace."entitlements" AS PERMISSIVE FOR ALL TO "authenticated" USING (ace.is_admin()) WITH CHECK (ace.is_admin());

CREATE POLICY "entitlements_self_read" ON ace."entitlements" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((user_id = auth.uid()));

CREATE POLICY "exam_config_subjects_manage_editor" ON ace."exam_config_subjects" AS PERMISSIVE FOR ALL TO "authenticated" USING (ace.is_admin_or_editor()) WITH CHECK (ace.is_admin_or_editor());

CREATE POLICY "exam_config_subjects_read_authenticated" ON ace."exam_config_subjects" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM (ace.exam_configs c
     JOIN ace.exam_seasons s ON ((s.id = c.season_id)))
  WHERE ((c.id = exam_config_subjects.exam_config_id) AND c.active AND (s.status = ANY (ARRAY['active'::text, 'closed'::text]))))) OR ace.is_admin_or_editor()));

CREATE POLICY "exam_configs_admin_all" ON ace."exam_configs" AS PERMISSIVE FOR ALL TO "authenticated" USING (ace.is_admin()) WITH CHECK (ace.is_admin());

CREATE POLICY "exam_configs_public_read" ON ace."exam_configs" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ((active AND (EXISTS ( SELECT 1
   FROM ace.exam_seasons s
  WHERE ((s.id = exam_configs.season_id) AND (s.status = ANY (ARRAY['active'::text, 'closed'::text])))))));

CREATE POLICY "exam_configs_read_authenticated_v2" ON ace."exam_configs" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((active AND (EXISTS ( SELECT 1
   FROM ace.exam_seasons s
  WHERE ((s.id = exam_configs.season_id) AND (s.status = ANY (ARRAY['active'::text, 'closed'::text])))))) OR ace.is_admin_or_editor()));

CREATE POLICY "exam_seasons_admin_all" ON ace."exam_seasons" AS PERMISSIVE FOR ALL TO "authenticated" USING (ace.is_admin()) WITH CHECK (ace.is_admin());

CREATE POLICY "exam_seasons_public_read" ON ace."exam_seasons" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ((status = ANY (ARRAY['active'::text, 'closed'::text])));

CREATE POLICY "exam_seasons_read_authenticated_v2" ON ace."exam_seasons" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((status = ANY (ARRAY['active'::text, 'closed'::text])) OR ace.is_admin_or_editor()));

CREATE POLICY "feature_flags_admin_all" ON ace."feature_flags" AS PERMISSIVE FOR ALL TO "authenticated" USING (ace.is_admin()) WITH CHECK (ace.is_admin());

CREATE POLICY "feature_flags_authenticated_read" ON ace."feature_flags" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "flashcard_reviews_self" ON ace."flashcard_reviews" AS PERMISSIVE FOR ALL TO "authenticated" USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "flashcards_admin_all" ON ace."flashcards" AS PERMISSIVE FOR ALL TO "authenticated" USING (ace.is_admin()) WITH CHECK (ace.is_admin());

CREATE POLICY "flashcards_public_read" ON ace."flashcards" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ((active = true));

CREATE POLICY "institutions_manage_editor" ON ace."institutions" AS PERMISSIVE FOR ALL TO "authenticated" USING (ace.is_admin_or_editor()) WITH CHECK (ace.is_admin_or_editor());

CREATE POLICY "institutions_read_authenticated" ON ace."institutions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((status = 'active'::text) OR ace.is_admin_or_editor()));

CREATE POLICY "knowledge_chunks_admin_all" ON ace."knowledge_chunks" AS PERMISSIVE FOR ALL TO "authenticated" USING (ace.is_admin()) WITH CHECK (ace.is_admin());

CREATE POLICY "knowledge_chunks_admin_read" ON ace."knowledge_chunks" AS PERMISSIVE FOR SELECT TO "authenticated" USING (ace.is_admin());

CREATE POLICY "knowledge_sources_admin_all" ON ace."knowledge_sources" AS PERMISSIVE FOR ALL TO "authenticated" USING (ace.is_admin()) WITH CHECK (ace.is_admin());

CREATE POLICY "knowledge_sources_admin_read" ON ace."knowledge_sources" AS PERMISSIVE FOR SELECT TO "authenticated" USING (ace.is_admin());

CREATE POLICY "learning_progress_self" ON ace."learning_progress" AS PERMISSIVE FOR ALL TO "authenticated" USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "notification_preferences_self" ON ace."notification_preferences" AS PERMISSIVE FOR ALL TO "authenticated" USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "notifications_admin_all" ON ace."notifications" AS PERMISSIVE FOR ALL TO "authenticated" USING (ace.is_admin()) WITH CHECK (ace.is_admin());

CREATE POLICY "notifications_mark_read_self" ON ace."notifications" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "notifications_self" ON ace."notifications" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((user_id = auth.uid()));

CREATE POLICY "payment_events_admin_all" ON ace."payment_events" AS PERMISSIVE FOR ALL TO "authenticated" USING (ace.is_admin()) WITH CHECK (ace.is_admin());

CREATE POLICY "payment_providers_admin_all" ON ace."payment_providers" AS PERMISSIVE FOR ALL TO "authenticated" USING (ace.is_admin()) WITH CHECK (ace.is_admin());

CREATE POLICY "payment_providers_admin_read" ON ace."payment_providers" AS PERMISSIVE FOR SELECT TO "authenticated" USING (ace.is_admin());

CREATE POLICY "payments_admin_all" ON ace."payments" AS PERMISSIVE FOR ALL TO "authenticated" USING (ace.is_admin()) WITH CHECK (ace.is_admin());

CREATE POLICY "payments_self_read" ON ace."payments" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((user_id = auth.uid()));

CREATE POLICY "product_events_admin_read" ON ace."product_events" AS PERMISSIVE FOR SELECT TO "authenticated" USING (ace.is_admin());

CREATE POLICY "product_events_self_insert" ON ace."product_events" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "products_admin_all" ON ace."products" AS PERMISSIVE FOR ALL TO "authenticated" USING (ace.is_admin()) WITH CHECK (ace.is_admin());

CREATE POLICY "products_public_read" ON ace."products" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ((active = true));

CREATE POLICY "profiles_self_select" ON ace."profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "profiles_self_update" ON ace."profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((id = ( SELECT auth.uid() AS uid))) WITH CHECK ((id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "program_utme_rules_manage_editor" ON ace."program_utme_rules" AS PERMISSIVE FOR ALL TO "authenticated" USING (ace.is_admin_or_editor()) WITH CHECK (ace.is_admin_or_editor());

CREATE POLICY "program_utme_rules_read_authenticated" ON ace."program_utme_rules" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((status = 'active'::text) OR ace.is_admin_or_editor()));

CREATE POLICY "programs_manage_editor" ON ace."programs" AS PERMISSIVE FOR ALL TO "authenticated" USING (ace.is_admin_or_editor()) WITH CHECK (ace.is_admin_or_editor());

CREATE POLICY "programs_read_authenticated" ON ace."programs" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((status = 'active'::text) OR ace.is_admin_or_editor()));

CREATE POLICY "question_media_admin_all" ON ace."question_media" AS PERMISSIVE FOR ALL TO "authenticated" USING (ace.is_admin()) WITH CHECK (ace.is_admin());

CREATE POLICY "question_media_public_read" ON ace."question_media" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ((EXISTS ( SELECT 1
   FROM ace.questions q
  WHERE ((q.id = question_media.question_id) AND (q.active = true) AND (q.review_status = 'published'::text)))));

CREATE POLICY "question_versions_editor_manage" ON ace."question_versions" AS PERMISSIVE FOR ALL TO PUBLIC USING (ace.is_admin_or_editor()) WITH CHECK (ace.is_admin_or_editor());

CREATE POLICY "question_versions_editor_read" ON ace."question_versions" AS PERMISSIVE FOR SELECT TO PUBLIC USING (ace.is_admin_or_editor());

CREATE POLICY "questions_editor_manage" ON ace."questions" AS PERMISSIVE FOR ALL TO PUBLIC USING (ace.is_admin_or_editor()) WITH CHECK (ace.is_admin_or_editor());

CREATE POLICY "questions_public_read" ON ace."questions" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((((active = true) AND (review_status = 'published'::text) AND (rights_status = ANY (ARRAY['owned'::text, 'licensed'::text, 'permitted'::text]))) OR ace.is_admin_or_editor()));

CREATE POLICY "referral_campaigns_admin_all" ON ace."referral_campaigns" AS PERMISSIVE FOR ALL TO "authenticated" USING (ace.is_admin()) WITH CHECK (ace.is_admin());

CREATE POLICY "referral_codes_self" ON ace."referral_codes" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((user_id = auth.uid()));

CREATE POLICY "referral_rewards_admin_all" ON ace."referral_rewards" AS PERMISSIVE FOR ALL TO "authenticated" USING (ace.is_admin()) WITH CHECK (ace.is_admin());

CREATE POLICY "referral_rewards_self" ON ace."referral_rewards" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((user_id = auth.uid()));

CREATE POLICY "referrals_participant_read" ON ace."referrals" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((referrer_user_id = auth.uid()) OR (referred_user_id = auth.uid())));

CREATE POLICY "roles_self_select" ON ace."roles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "student_preferences_self" ON ace."student_preferences" AS PERMISSIVE FOR ALL TO "authenticated" USING ((user_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "stats_owner" ON ace."student_question_stats" AS PERMISSIVE FOR ALL TO PUBLIC USING (((user_id = auth.uid()) OR ace.is_admin())) WITH CHECK (((user_id = auth.uid()) OR ace.is_admin()));

CREATE POLICY "student_subjects_self" ON ace."student_subjects" AS PERMISSIVE FOR ALL TO "authenticated" USING ((user_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "study_plan_items_self" ON ace."study_plan_items" AS PERMISSIVE FOR ALL TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ace.study_plans p
  WHERE ((p.id = study_plan_items.plan_id) AND (p.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ace.study_plans p
  WHERE ((p.id = study_plan_items.plan_id) AND (p.user_id = auth.uid())))));

CREATE POLICY "study_plans_self" ON ace."study_plans" AS PERMISSIVE FOR ALL TO "authenticated" USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "subjects_editor_manage" ON ace."subjects" AS PERMISSIVE FOR ALL TO PUBLIC USING (ace.is_admin_or_editor()) WITH CHECK (ace.is_admin_or_editor());

CREATE POLICY "subjects_public_read" ON ace."subjects" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((active OR ace.is_admin_or_editor()));

CREATE POLICY "subtopics_editor_manage" ON ace."subtopics" AS PERMISSIVE FOR ALL TO PUBLIC USING (ace.is_admin_or_editor()) WITH CHECK (ace.is_admin_or_editor());

CREATE POLICY "subtopics_public_read" ON ace."subtopics" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((((active = true) AND ace.is_syllabus_version_public(syllabus_version_id) AND (EXISTS ( SELECT 1
   FROM ace.topics t
  WHERE ((t.id = subtopics.topic_id) AND (t.syllabus_version_id = subtopics.syllabus_version_id) AND (t.active = true))))) OR ace.is_admin_or_editor()));

CREATE POLICY "syllabus_versions_manage_editor" ON ace."syllabus_versions" AS PERMISSIVE FOR ALL TO "authenticated" USING (ace.is_admin_or_editor()) WITH CHECK (ace.is_admin_or_editor());

CREATE POLICY "syllabus_versions_read_authenticated" ON ace."syllabus_versions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((status = 'active'::text) OR ace.is_admin_or_editor()));

CREATE POLICY "topics_editor_manage" ON ace."topics" AS PERMISSIVE FOR ALL TO PUBLIC USING (ace.is_admin_or_editor()) WITH CHECK (ace.is_admin_or_editor());

CREATE POLICY "topics_public_read" ON ace."topics" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((((active = true) AND ace.is_syllabus_version_public(syllabus_version_id)) OR ace.is_admin_or_editor()));

CREATE TRIGGER guard_exam_composition BEFORE INSERT OR DELETE OR UPDATE ON ace.exam_config_subjects FOR EACH ROW EXECUTE FUNCTION ace.guard_exam_composition();

CREATE TRIGGER profiles_touch_updated_at BEFORE UPDATE ON ace.profiles FOR EACH ROW EXECUTE FUNCTION ace.touch_profile_updated_at();

CREATE TRIGGER student_preferences_touch_updated_at BEFORE UPDATE ON ace.student_preferences FOR EACH ROW EXECUTE FUNCTION ace.touch_preferences_updated_at();

CREATE TRIGGER guard_syllabus_authoring BEFORE INSERT OR DELETE OR UPDATE ON ace.subtopics FOR EACH ROW EXECUTE FUNCTION ace.guard_syllabus_authoring();

CREATE TRIGGER guard_syllabus_authoring BEFORE INSERT OR DELETE OR UPDATE ON ace.syllabus_versions FOR EACH ROW EXECUTE FUNCTION ace.guard_syllabus_authoring();

CREATE TRIGGER guard_syllabus_authoring BEFORE INSERT OR DELETE OR UPDATE ON ace.topics FOR EACH ROW EXECUTE FUNCTION ace.guard_syllabus_authoring();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION ace.handle_new_user();

REVOKE ALL ON SCHEMA ace FROM PUBLIC, anon, authenticated;

GRANT USAGE ON SCHEMA ace TO authenticated;

REVOKE ALL ON ALL TABLES IN SCHEMA ace FROM PUBLIC, anon, authenticated;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA ace FROM PUBLIC, anon, authenticated;

GRANT INSERT, SELECT, UPDATE, DELETE ON ace."catalog_import_batches" TO authenticated;

GRANT INSERT, SELECT, UPDATE, DELETE ON ace."catalog_import_rows" TO authenticated;

GRANT INSERT, SELECT, UPDATE, DELETE ON ace."catalog_sources" TO authenticated;

GRANT INSERT, SELECT, UPDATE ON ace."devices" TO authenticated;

GRANT INSERT, SELECT, UPDATE, DELETE ON ace."exam_config_subjects" TO authenticated;

GRANT SELECT ON ace."exam_configs" TO authenticated;

GRANT SELECT ON ace."exam_seasons" TO authenticated;

GRANT INSERT, SELECT, UPDATE, DELETE ON ace."institutions" TO authenticated;

GRANT SELECT, UPDATE ON ace."profiles" TO authenticated;

GRANT INSERT, SELECT, UPDATE, DELETE ON ace."program_utme_rules" TO authenticated;

GRANT INSERT, SELECT, UPDATE, DELETE ON ace."programs" TO authenticated;

GRANT SELECT, UPDATE ON ace."student_preferences" TO authenticated;

GRANT SELECT ON ace."student_subjects" TO authenticated;

GRANT SELECT ON ace."subjects" TO authenticated;

GRANT INSERT, SELECT, UPDATE ON ace."subtopics" TO authenticated;

GRANT INSERT, SELECT, UPDATE, DELETE ON ace."syllabus_versions" TO authenticated;

GRANT INSERT, SELECT, UPDATE ON ace."topics" TO authenticated;

GRANT EXECUTE ON FUNCTION ace."activate_exam_config"(p_exam_config_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION ace."activate_exam_season"(p_season_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION ace."activate_syllabus_version"(p_syllabus_version_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION ace."approve_catalog_batch"(p_batch_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION ace."can_manage_catalog"() TO authenticated;

GRANT EXECUTE ON FUNCTION ace."check_catalog_import_idempotency"(p_snapshot_hash text) TO authenticated;

GRANT EXECUTE ON FUNCTION ace."get_active_exam_blueprint"() TO authenticated;

GRANT EXECUTE ON FUNCTION ace."get_catalog_institutions"() TO authenticated;

GRANT EXECUTE ON FUNCTION ace."get_catalog_source"(p_source_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION ace."has_active_entitlement"(p_user_id uuid, p_product_code text) TO authenticated;

GRANT EXECUTE ON FUNCTION ace."is_admin"() TO authenticated;

GRANT EXECUTE ON FUNCTION ace."is_admin_or_editor"() TO authenticated;

GRANT EXECUTE ON FUNCTION ace."is_syllabus_version_public"(p_syllabus_version_id uuid) TO anon;

GRANT EXECUTE ON FUNCTION ace."is_syllabus_version_public"(p_syllabus_version_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION ace."publish_catalog_batch"(p_batch_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION ace."resume_attempt"(p_attempt_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION ace."save_attempt_answer"(p_attempt_id uuid, p_question_id uuid, p_selected_option_key text, p_response_ms integer) TO authenticated;

GRANT EXECUTE ON FUNCTION ace."save_student_foundation"(p_display_name text, p_target_score smallint, p_institution text, p_course text, p_daily_minutes integer, p_subject_ids uuid[]) TO authenticated;

GRANT EXECUTE ON FUNCTION ace."save_student_foundation_catalog"(p_display_name text, p_target_score smallint, p_institution_id uuid, p_program_id uuid, p_daily_minutes integer) TO authenticated;

GRANT EXECUTE ON FUNCTION ace."save_student_foundation_catalog_with_subjects"(p_display_name text, p_target_score smallint, p_institution_id uuid, p_program_id uuid, p_daily_minutes integer, p_subject_ids uuid[]) TO authenticated;

GRANT EXECUTE ON FUNCTION ace."save_student_preparation_foundation"(p_display_name text, p_target_score smallint, p_institution_goal text, p_course_goal text, p_daily_minutes integer, p_subject_ids uuid[]) TO authenticated;

GRANT EXECUTE ON FUNCTION ace."set_student_subjects"(p_subject_ids uuid[]) TO authenticated;

GRANT EXECUTE ON FUNCTION ace."set_user_role"(target_user_id uuid, target_role text) TO authenticated;

GRANT EXECUTE ON FUNCTION ace."stage_catalog_import"(p_source_id uuid, p_season_id uuid, p_dataset_type text, p_snapshot_hash text, p_metadata jsonb, p_rows jsonb) TO authenticated;

GRANT EXECUTE ON FUNCTION ace."start_attempt"(p_mode text, p_subject_id uuid, p_question_count integer, p_duration_seconds integer, p_question_ids uuid[]) TO authenticated;

GRANT EXECUTE ON FUNCTION ace."submit_attempt"(p_attempt_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION ace."touch_preferences_updated_at"() TO PUBLIC;

GRANT EXECUTE ON FUNCTION ace."touch_profile_updated_at"() TO PUBLIC;

GRANT EXECUTE ON FUNCTION ace."validate_catalog_batch"(p_batch_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION ace."validate_exam_config"(p_exam_config_id uuid) TO authenticated;

COMMIT;

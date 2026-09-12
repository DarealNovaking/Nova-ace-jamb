# ÑØVÃ ACE JAMB — Final Architecture

## Architecture lock

This is the implementation target for ACE JAMB. Build all major product capabilities now; use free-tier infrastructure first and replace/scale providers only when capacity or reliability requires it. Do not defer a feature merely because its eventual infrastructure may be paid.

## System shape

`React/Vite PWA → service boundaries → Supabase/Postgres/RLS + Edge Functions → provider adapters`

Provider adapters isolate external dependencies:
- AI: Gemini first where API access/terms permit; replaceable without changing product services.
- Payments: Paystack first; provider-neutral payment records/webhooks/entitlements.
- Email: Resend/free equivalent.
- Push: FCM.
- Storage: Supabase Storage first; R2-compatible abstraction for future media scale.
- Edge/security: Cloudflare services where useful; never required for core operation.

## Core domains

1. Identity/profile — auth, profile, target score, institution, course, subjects, preferences, devices.
2. Season/exam — season, versioned exam config, composition, rules, deadlines.
3. Content — subjects/topics/subtopics, rich questions, versions, media, provenance, rights, review/publish state.
4. Learning — learning progress, mastery, practice modes, mistake bank, flashcard review, recommendations.
5. CBT — persistent attempts, deterministic question/option mapping, server timer/scoring, recovery.
6. Planning — study plans and scheduled activities driven by performance and season.
7. Monetization — products, payment providers, payments, webhook events, server-verified entitlements.
8. Growth — referral codes, qualified referrals, configurable anti-abuse qualification, rewards.
9. AI/knowledge — rights-aware sources/chunks, embeddings, grounded requests, provider/model usage and quotas.
10. Engagement — notifications, preferences, push devices, community CTA and future real WhatsApp verification.
11. Operations — feature flags, product events, audit events, admin roles, moderation/security telemetry.

## Trust model

The database/server is authoritative. The client is never authoritative for:
- scores/correctness
- CBT timing or completion
- payment success
- premium entitlement
- referral qualification/rewards
- admin permissions
- AI generation approval

Privileged mutations go through authenticated server/service boundaries. Webhooks are idempotent. Provider secrets stay in server-side secrets, never browser code.

## Personalization loop

`Onboard → Diagnose → Learn → Practice → Mistakes → Mastery → Recommend → Revise → CBT → Analyze → Adapt → Final Stretch`

Performance data should drive weakness, speed, repeated-mistake, readiness, adaptive practice and study plans.

## Monetization

ACE Pass is currently ₦899. The product record is represented in NGN minor units. Access is seasonal and entitlement is server verified. Referral access requires 5 qualified real-user referrals; qualification is based on configurable meaningful activity, not clicks/shares.

## AI

AI is a grounded service, not an unrestricted chatbot. Retrieval sources include current JAMB syllabus material, permitted/authorized references, platform-authored content, structured past-question knowledge and carefully sourced web material. Provenance and rights are retained. AI-generated educational content/questions require validation and is never automatically treated as official JAMB content.

## Rights

ACE must not wholesale mirror copyrighted textbooks. Ingest only material with appropriate rights/permissions or legally permissible derived/excerpted knowledge. Admin review/takedown is part of the content pipeline.

## Performance

Mobile-first, low-bandwidth, low-end Android. PWA core functionality must work without 3D, AI, audio or other non-core services. Cache educational content carefully; never allow caching to corrupt live CBT state.

## Current implementation state

Supabase project `nova-ace-jamb` is ACTIVE_HEALTHY in Canada Central. The `ace` schema already contains the initial content/CBT foundation. Persistent CBT RPCs and the React persistent CBT component are implemented. The final architecture migration has now added season/exam configuration, student preferences/subjects, media, learning progress, flashcard review, study plans, notifications, devices, payments, products, entitlements, referrals, AI providers/usage/requests, rights-aware knowledge sources/chunks, feature flags and product events, plus indexes and RLS.

## Required implementation order

1. Finish authenticated CBT E2E verification and remove the dormant legacy CBT path.
2. Complete service boundaries and server-side admin authorization; eliminate unsafe legacy AppDeploy mutations.
3. Populate/verify season + official JAMB configuration and syllabus taxonomy.
4. Build the quality-controlled question/content ingestion and review pipeline.
5. Build the personalized Learning/Practice/Mistake/Mastery engine.
6. Build payment + referral Edge Functions and provider webhook verification.
7. Build grounded AI services with Gemini adapter, quotas, retrieval and validation.
8. Build flashcards/audio/revision/plans/recommendations.
9. Build notifications/community/admin command center.
10. Run security, performance, accessibility, abuse, interrupted-CBT, payment and AI-failure QA on real low-end Android/network conditions.

## Non-goals

Do not merge ACE JAMB with Ñøvã CBT MAX or DROP. Do not replace Supabase with Firebase. Do not hard-code JAMB rules that belong in season/exam configuration. Do not make client-side claims the source of truth.

# ÑØVÃ ACE JAMB — Master Handoff Progress

## 2026-09-12 — Backend/Supabase migration milestone

### Completed
- Verified repository `DarealNovaking/Nova-ace-jamb` and canonical handoff `docs/ACE-JAMB-MASTER-HANDOFF.md`.
- Confirmed Supabase project `nova-ace-jamb` (`uokiqlgmzprqfbzmedaz`) is ACTIVE_HEALTHY in Canada Central.
- Established the ACE application database foundation under the `ace` schema, including profiles, roles, syllabus hierarchy, rich questions/versioning, attempts/answers, student performance stats, and audit events.
- Added a browser-safe Supabase client and provider bridge so the existing React app's `@appdeploy/client` import is now routed through a Supabase-backed adapter without rewriting the UI in this milestone.
- Added Supabase client dependency and Vite alias for the migration bridge.
- Exposed the `ace` schema through the Supabase API layer and verified the PostgREST schema configuration.
- Existing AppDeploy backend remains intact as a migration fallback; it has not been blindly deleted.

### Important verification/findings
- Supabase security advisor currently reports **0 security lints**.
- Performance advisor still has optimization findings; some foreign-key indexes were added in the final architecture migration, but RLS init-plan and overlapping-policy cleanup remains before scale/production.
- Supabase's generated public-schema TypeScript types do not currently include the custom `ace` schema, so typed definitions need a deliberate custom-schema strategy rather than being treated as complete.
- The existing AppDeploy admin mutation routes remain unsafe for production because they are not protected by `requireAuth()`; the new bridge must not inherit that weakness as the final architecture.

## 2026-09-12 — Persistent CBT service milestone
- Added authenticated Supabase RPCs for the CBT attempt lifecycle: create attempt, persist deterministic question/option randomization, resume/recover state, save validated answers, submit, server-side score, and student-question performance aggregation.
- CBT functions use `security invoker`, require `auth.uid()`, restrict execution to the `authenticated` role, validate that submitted questions/options belong to the persisted attempt, and keep the canonical answer key server-side.
- Added supporting attempt/answer indexes and committed the migration source under `supabase/migrations/20260912010000_persistent_cbt_service.sql`.
- Added `src/lib/cbtService.ts` as the frontend service boundary for the RPC lifecycle.
- Unauthenticated invocation was explicitly verified to fail; authenticated end-to-end CBT execution still requires a real authenticated test user and published question fixture data.

## 2026-09-12 — Persistent CBT UI integration milestone
- Extended `cbtService` with persisted question loading in the exact stored attempt order and option-key presentation order.
- Added `src/components/PersistentCBT.tsx` implementing the real attempt lifecycle in React: server-created attempt, deterministic presentation mapping, answer autosave, persisted resume, server-derived timer, question navigation/map, timeout submission, and server-side results.
- Added a dedicated `?cbt=1` integration entry point in `src/main.tsx` so the persistent CBT UI could be exercised without destroying the existing prototype/admin UI during migration.

## 2026-09-12 — Main CBT route migration bridge
- Updated `src/main.tsx` so the existing visible **Start CBT** and **CBT Practice** entry points are intercepted into the persistent CBT route instead of entering the legacy client-side CBT screen.
- Added a browser-history back path to return to the main ACE JAMB application while preserving the existing home/learning/admin prototype during the migration.
- The legacy CBT component remains in `App.tsx` as dormant migration code; it is no longer the intended user entry path. A later cleanup should remove/refactor that dead path after authenticated E2E verification.

## 2026-09-12 — Final architecture foundation milestone

### Completed
- Locked the implementation target in `docs/FINAL-ARCHITECTURE.md`.
- Applied the final ACE platform architecture to Supabase under the `ace` schema.
- Added season-aware/versioned exam configuration so JAMB rules and composition are data-driven rather than permanently hard-coded.
- Added student preferences/subjects state for personalization.
- Added rich question media metadata and rights/provenance-aware content support.
- Added flashcards/review state, learning progress, study plans/items and notification/device infrastructure.
- Added provider-neutral monetization architecture: payment providers, products, payments, idempotent webhook-event records and server-verified entitlement records. ACE Pass is configured as **₦899**; provider registry is ready for Paystack without exposing secrets in the database.
- Added referral codes, referral records, configurable campaigns and reward records. The default campaign direction is **5 qualified referrals** with meaningful-usage qualification; actual qualification/reward logic must execute server-side.
- Added AI provider registry, AI usage/request tracking, rights-aware knowledge sources/chunks with vector embeddings, grounding provenance fields and feature flags. Gemini is represented as the preferred adapter candidate; provider credentials remain server-side.
- Added product events for the personalization/growth loop and operational analytics, plus centralized entitlement and admin predicates.
- Added supporting foreign-key indexes and a primary key for learning progress.
- Enabled RLS on all new protected architecture tables and separated student-owned reads/writes from admin control-plane policies.
- Verified Supabase security advisor remains at **0 security lints** after the architecture migration.

### Architecture rule locked
Build every major product capability now. Use free-tier infrastructure first; upgrade/replace infrastructure only when capacity, reliability or provider requirements demand it. Feature existence is not deferred because infrastructure may later become paid.

## 2026-09-12 — Batch 0: Architecture + Build Lock
- Re-checked the canonical master handoff, final architecture document, repository state, package/tooling, Supabase migrations and current database functions before continuing.
- Locked the sequential implementation contract in `docs/BATCH-GATES.md`: each batch must be implemented, verified, documented and committed before the next batch begins.
- Confirmed the architecture boundary: React/Vite PWA → service boundaries → Supabase/Postgres/RLS + Edge Functions → provider adapters; client state is never authoritative for scores, CBT timing/completion, payment, entitlement, referrals, admin permissions or AI approval.
- Added `.env.example` for browser-safe Supabase configuration and removed the checked-in publishable-key fallback from `src/lib/supabase.ts`; the publishable key is now required through `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Added `.gitignore` protection for local environment files while retaining `.env.example`.
- Added a `typecheck` script alongside the existing Vite build script to make the Batch 0/ongoing verification contract explicit.
- Confirmed current Supabase migration state remains eight migrations through `batch_1_identity_function_hardening`; no Batch 2+ implementation was started during Batch 0.
- Batch 0 exit criteria are satisfied and the final Batch 0 documentation/configuration changes are committed to `main`.

## 2026-09-12 — Batch 1: Identity + Student Profile
- Added automatic Supabase `auth.users` onboarding trigger: creates the ACE profile, default student role, student preferences, notification preferences and deterministic referral code when a new account is created.
- Added timestamp-maintenance triggers for profiles and student preferences.
- Hardened trigger function search paths after security-advisor review.
- Added `src/lib/authService.ts` for browser auth/session operations and `src/lib/studentService.ts` for profile, preferences and selected-subject service boundaries.
- Added an authenticated student foundation gate and onboarding UI. New signed-in students are routed through persistent profile setup before entering the main application; the profile captures display name, target score, institution, course, daily study time and 1–4 selected subjects.
- Added `src/lib/deviceService.ts` to create a locally persistent installation identifier, hash it with SHA-256 and register/update the authenticated device for cross-session continuity. This is a continuity identifier, not a security-grade fingerprint or anti-abuse control.
- Added a protected CBT entry gate that requires a Supabase session before the persistent CBT UI can be entered.
- Added atomic `ace.set_student_subjects(uuid[])` RPC with authenticated-only execution, active-subject validation and 1–4 selection enforcement.
- Hardened identity RLS: profiles are authenticated/self-owned only; role records are student-self-read only; privileged admin predicates are no longer executable by `anon`; profile target score and preparation time have defensive database constraints.
- Added `.github/workflows/verify.yml` for repository typecheck/build verification.
- Tightened `StudentFoundationGate`: a missing profile (`PGRST116`) is treated as onboarding, while device/RLS/network/other database failures now surface as an explicit retryable account-preparation error instead of silently forcing onboarding.
- Re-verified identity function execution privileges: `anon` cannot execute `is_admin`, `is_admin_or_editor` or `set_student_subjects`; `authenticated` can. Re-verified student-owned RLS policies on profiles, roles, preferences and selected subjects.
- Added `src/components/StudentAuth.tsx` as the actual Supabase authentication entry screen. Unauthenticated users are now held at the Supabase email/magic-link flow rather than entering the legacy AppDeploy authentication path; Supabase's documented passwordless flow supports automatic account creation after email verification.

### Batch 1 continuation — gate hardening and CI
- Fixed the legacy provider-bridge TypeScript contract so the migration shim remains type-safe without restoring the obsolete AppDeploy package.
- Applied identity performance hardening migration `20260912195056_batch_1_identity_performance_hardening_v2` in Supabase; the migration removes a duplicate learning-progress uniqueness structure and documents the remaining advisor-driven optimization boundary.
- GitHub Actions verification for commit `087853cdc69d56246cd86a3b28aa8fc46d79b98f` completed successfully: `npm install`, `npm run typecheck`, and `npm run build` all passed.
- Supabase still has no authenticated test user, so authenticated onboarding/multi-session E2E remains the final Batch 1 gate. No Batch 2 implementation has been started.

### Batch 1 gate status
**NOT CLOSED YET.** The implementation, database hardening, and CI build verification are passing. The remaining exit-gate blocker is a real authenticated E2E flow using a test account and suitable fixture data; this cannot be truthfully marked passed while `auth.users` has no test account.

## Important
This file records notable project progress only—milestones, architecture decisions, important blockers, and completed phases. It intentionally does not log every individual command or implementation action.

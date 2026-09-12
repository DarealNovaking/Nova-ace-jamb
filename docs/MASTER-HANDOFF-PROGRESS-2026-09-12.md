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
- Supabase security advisor previously reported **0 security lints**.
- Performance advisor has optimization findings (foreign-key indexes, RLS init-plan optimization, and overlapping permissive policies). These remain cleanup work before scale/production.
- Supabase's generated public-schema TypeScript types do not currently include the custom `ace` schema, so typed definitions need a deliberate custom-schema strategy rather than being treated as complete.
- The existing AppDeploy admin mutation routes remain unsafe for production because they are not protected by `requireAuth()`; the new bridge must not inherit that weakness as the final architecture.

### 2026-09-12 — Persistent CBT service milestone
- Added authenticated Supabase RPCs for the CBT attempt lifecycle: create attempt, persist deterministic question/option randomization, resume/recover state, save validated answers, submit, server-side score, and student-question performance aggregation.
- CBT functions use `security invoker`, require `auth.uid()`, restrict execution to the `authenticated` role, validate that submitted questions/options belong to the persisted attempt, and keep the canonical answer key server-side.
- Added supporting attempt/answer indexes and committed the migration source under `supabase/migrations/20260912010000_persistent_cbt_service.sql`.
- Added `src/lib/cbtService.ts` as the frontend service boundary for the RPC lifecycle.
- Unauthenticated invocation was explicitly verified to fail; authenticated end-to-end CBT execution still requires a real authenticated test user and published question fixture data.

### 2026-09-12 — Persistent CBT UI integration milestone
- Extended `cbtService` with persisted question loading in the exact stored attempt order and option-key presentation order.
- Added `src/components/PersistentCBT.tsx` implementing the real attempt lifecycle in React: server-created attempt, deterministic presentation mapping, answer autosave, persisted resume, server-derived timer, question navigation/map, timeout submission, and server-side results.
- Added a dedicated `?cbt=1` integration entry point in `src/main.tsx` so the persistent CBT UI could be exercised without destroying the existing prototype/admin UI during migration.

### 2026-09-12 — Main CBT route migration bridge
- Updated `src/main.tsx` so the existing visible **Start CBT** and **CBT Practice** entry points are intercepted into the persistent CBT route instead of entering the legacy client-side CBT screen.
- Added a browser-history back path to return to the main ACE JAMB application while preserving the existing home/learning/admin prototype during the migration.
- The legacy CBT component remains in `App.tsx` as dormant migration code; it is no longer the intended user entry path. A later cleanup should remove/refactor that dead path after authenticated E2E verification.

### Current state
- Frontend migration is underway: UI behavior is preserved while data/auth access is being moved behind a provider boundary.
- Persistent CBT database primitives, service boundary, and production-oriented CBT UI component now exist, and the primary CBT entry path is routed to the persistent implementation.
- The legacy CBT implementation remains in source temporarily for safe migration rollback and should not be treated as production CBT.
- No production question dataset, payment, referral, AI, notification, or WhatsApp integration has been enabled.

### Next meaningful milestones
1. Run authenticated E2E CBT verification with representative published question fixtures, including reload/resume, answer persistence, timeout and server scoring.
2. Refactor/remove the dormant legacy CBT path after E2E passes, so the application has one authoritative CBT implementation.
3. Complete and verify the Supabase service boundary, including authenticated/admin authorization rather than client-trusted admin mutations.
4. Clean up current Supabase performance advisor findings as schema/API access patterns stabilize.
5. Add season/exam configuration and finish syllabus/question intelligence before real content ingestion.

## Important
This file records notable project progress only—milestones, architecture decisions, important blockers, and significant changes. It intentionally does not log every individual command or implementation action.

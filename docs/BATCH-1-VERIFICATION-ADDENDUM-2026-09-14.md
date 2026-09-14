# Batch 1 Verification Addendum — 2026-09-14

## Purpose
Record the latest Batch 1 verification and security hardening without claiming the formal gate is closed prematurely.

## Verified
- GitHub Actions run `34903295388` completed successfully on the browser-test commit: dependency install, TypeScript typecheck, production build, Playwright browser installation, and **4 Playwright tests passed**.
- The Playwright smoke suite covers the student entry surface on desktop and mobile browser profiles.
- Supabase project `nova-ace-jamb` is `ACTIVE_HEALTHY`.
- All Batch 1 student data tables inspected (`profiles`, `roles`, `student_preferences`, `student_subjects`, `devices`) have RLS enabled.
- Batch 1 RLS policies use the optimized `(select auth.uid())` form on the inspected student tables.
- The atomic `ace.save_student_foundation(...)` function was exercised under an authenticated PostgreSQL request context with four active subjects; it completed successfully inside a transaction that was rolled back, proving the server-side validation/write path can execute without leaving test data behind.
- `ace.set_student_subjects(uuid[])` was discovered to be `SECURITY INVOKER` and failed under the authenticated role because its internal DELETE required a table grant. It was hardened to `SECURITY DEFINER` with a fixed `search_path`, and `anon/public` EXECUTE was revoked while `authenticated` EXECUTE was granted.
- The hardened `ace.set_student_subjects(uuid[])` was then exercised under an authenticated request context with four active subjects and successfully produced four selected-subject rows inside a transaction that was rolled back.
- Rollback cleanup was verified: temporary test catalog/season records were not persisted.
- Invalid target-score validation was exercised and correctly rejected.

## Current limitation
The full browser-level authenticated onboarding gate is **not yet closed**. The current production onboarding surface is catalog-driven, while the live catalog intentionally contains no published institutions/programmes/UTME rules. We must not fabricate catalog data just to make the test pass. A real end-to-end save/reload/sign-in test therefore remains pending until authoritative catalog data is published through the Batch 2 ingestion pipeline.

The Supabase security advisor still reports one dashboard-level warning: **Leaked Password Protection is disabled**. This is recommended pre-release hardening, but is not being falsely represented as a code-level failure.

## Gate status
**Batch 1: IMPLEMENTATION HARDENING VERIFIED; FORMAL GATE OPEN.**

Do not start Batch 3. Continue only with Batch 1 gate closure work or the explicitly authorized Batch 2 implementation work. The formal gate requires the authenticated browser flow, persistence/reload verification, sign-out/sign-in continuity, protected-access behavior, and final RLS isolation evidence.

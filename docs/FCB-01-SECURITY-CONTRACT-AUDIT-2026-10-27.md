# FCB-01 security and backend-contract evidence

This is an audit record under the existing final completion batch, not another backlog.
Baseline: GitHub main `3a24fca5a9f63b9111d5d89ff6c0b0fd1bb22d9a`.
Work branch: `security/fcb-01-contract-audit`. Production project: `uokiqlgmzprqfbzmedaz`.
All production inspection was read-only. No migration, content change, deployment or provider activation was performed.

## Verified findings and proposed remediation

| Severity | Evidence / impact | Source change | State |
|---|---|---|---|
| High | Editors have table grants plus an ALL RLS policy on `syllabus_versions`; direct updates can approve rights/activate content without the activation RPC. Editors can also change active topic trees. | Authenticated-role trigger preserves pending draft authoring, reserves reviewed/publication changes for admin, locks parent version and audits rights/status changes. | Disposable SQL reproduced bypass before fix and passed after fix; live fix NOT applied. |
| High | Editor ALL policies on legacy `catalog_sources`, import batches and rows bypass admin-only source/batch approval. | Keep editor reads and existing guarded staging/validation RPCs; restrict direct mutation policies to administrators. No catalogue workflow reactivated. | Source/tested; live fix NOT applied. |
| Medium | `has_active_entitlement(user_id,product)` bypasses RLS without checking the requested owner. Any signed-in caller can probe another account's access. | Permit own lookup or administrator reconciliation only; end timestamp is exclusive. | Reproduced before fix; owner/editor/admin tests pass after fix. |
| Medium | `get_catalog_source`, `get_catalog_institutions`, `check_catalog_import_idempotency` expose non-public review metadata to any authenticated user. | Require admin/editor identity in each definer function body. Preserve signatures and return shapes. | Student denial and editor access tested. |
| High integrity risk | `set_user_role` counts remaining admins without serializing concurrent demotions. | Serialize role mutations, lock administrator rows before rechecking authorization/count, reject NULL targets, preserve audit. | Sequential role/audit negatives pass; native READ COMMITTED and REPEATABLE READ races PASS on source 50d2b22 in Verify 40533656094. |
| Medium contract | Legacy subject-save APIs accept 1–4 subjects without compulsory English. | Require four distinct active subjects including ENG and canonicalize English primary/first. | Invalid selections and successful English-last legacy profile save tested. |
| High before content/API enablement | Question publication and attempt queries omit rights checks; NULL attempt count bypasses its upper bound. Current missing table grants fail closed, so this is not evidence that live students can currently retrieve these rows. | Recover historical reviewed rights gate as a new forward migration, require owned/licensed/permitted rights, reject NULL mode/count/duration. No table privileges added. | Rights leakage and NULL bound failures reproduced; SQL tests pass after fix. |
| Runtime defect | `loadCbtQuestions` selects nonexistent `question_text`; production stores `stem`. | PostgREST alias `question_text:stem`, exact safe projection tested. | Typecheck/build and service-contract regression pass; full browser run pending CI. |

The new migrations are `20261027151954_fcb_01_rpc_security_boundaries.sql`,
`20261027152101_fcb_01_syllabus_authorization.sql`, and
`20261027152507_fcb_01_question_rights_gate.sql`.

## Complete live function audience audit

Read all 30 live definitions and EXECUTE ACLs: 23 SECURITY DEFINER, 7 invoker.
All privileged exposed functions have explicit authenticated grants rather than PUBLIC grants;
the syllabus visibility helper also grants anon. Trigger-only `handle_new_user` has no API execute grant.

| Functions | Actual boundary / disposition |
|---|---|
| `is_admin`, `is_admin_or_editor`, `can_manage_catalog` | Self role lookup from protected roles table using auth.uid; intentional definer helpers. No user-metadata role authorization. |
| `is_syllabus_version_public` | Boolean active AND rights-approved test used by RLS. Intentional bounded helper; anon lacks ace schema USAGE in current production. Do not remove it merely to silence advisor. |
| `handle_new_user` | Trigger only; assigns student, never trusts user metadata for role. User-provided names/timezone remain profile input. |
| `has_active_entitlement` | Missing owner guard fixed in proposed migration. |
| `get_catalog_source`, `get_catalog_institutions`, `check_catalog_import_idempotency` | Missing audience guards fixed in proposed migration; legacy endpoint behavior otherwise preserved. |
| `set_user_role` | Admin guard exists; proposed locking, null checks and last-admin tests above. |
| `save_student_preparation_foundation` | Authenticated self-only atomic save; English+3 enforcement already present. Current production onboarding path, catalogue independent. |
| `set_student_subjects`, `save_student_foundation` | Self-only, legacy subject invariants hardened in proposal. |
| `save_student_foundation_catalog`, `save_student_foundation_catalog_with_subjects` | Self-only historical catalogue-dependent APIs; not used by current onboarding. No new grants or callers. Retired consumer/subject-rule cleanup must not silently reactivate these APIs. |
| `activate_exam_config`, `activate_exam_season`, `activate_syllabus_version` | Explicit admin/editor caller guard. New syllabus trigger additionally prevents editor publication via a definer RPC. Season/config admin/editor separation remains a release review item. |
| `validate_exam_config` | Draft metadata validator now requires an admin/editor caller in the proposed migration; student rejection and editor missing-config result tested. |
| `stage_catalog_import`, `validate_catalog_batch`, `publish_catalog_batch` | Explicit manager/editor caller guards and lifecycle checks; direct editor approval bypass addressed separately via policies. Legacy source/deployment differences remain; no deployment was attempted. |
| `approve_catalog_batch` | Admin-only guard; direct editor table bypass addressed in proposal. |
| `start_attempt`, `resume_attempt`, `save_attempt_answer`, `submit_attempt` | Invoker; owner checks exist. Current direct table privileges are missing and fail closed. See CBT blocker below. |
| `get_active_exam_blueprint` | Invoker subject to underlying grants/RLS. No privilege escalation by itself. |
| `touch_profile_updated_at`, `touch_preferences_updated_at` | Invoker trigger helpers; no privileged reads/writes outside trigger row. |

## Migration history reconciliation

At the inspected baseline, 31 repository files represent 29 unique migration names versus 41 live names.
Only eight repository version IDs match the applied ledger; corresponding name matches often use different timestamps.
Do not use counts as a reason to rewrite the production ledger or blindly run `supabase db push`.

Twelve live migration names have no checked-in counterpart:

- `initial_ace_core_schema`
- `expose_ace_schema_to_api`
- `fix_cbt_deterministic_mapping`
- `final_ace_platform_architecture`
- `final_ace_architecture_indexes`
- `batch_1_identity_function_hardening`
- `batch_2_admin_role_management_fix_audit`
- `add_catalog_manager_role_check`
- `add_catalog_source_lookup`
- `add_catalog_import_idempotency_check`
- `add_atomic_catalog_import_staging`
- `add_ibass_institution_stage_lookup`

The earliest tracked migration references tables that the repository does not create.
A clean full-history replay is therefore BLOCKED; current CI SQL scripts construct isolated fixtures,
not the complete production schema. Two snapshot-idempotency files are byte-identical;
two FK-index migrations create equivalent column indexes with different names. Do not delete applied history/indexes blindly.

Metadata-only inspection confirms all 41 ledger entries retain a non-null `statements` array entry.
Only names/versions/counts/hashes were inspected. An entry may contain an entire script with DML or secret-bearing literals;
prefix filtering cannot establish safe recovery. Recover a catalog-derived schema-only baseline, or use a reviewed
offline SQL-parser/redaction process before extracting original scripts. No original migration SQL or secret values were read.

## Grants, storage, security and performance

- Rechecked all 48 ace tables: RLS enabled. `anon` currently lacks ace USAGE; authenticated has USAGE.
- `questions`, attempts/answers/stats, payments/entitlements, notifications, most learning/AI tables have no explicit API table ACL.
  RLS policies alone do not make their frontend services work. Never grant broad writes to unblock them.
- **CBT release blocker:** owner ALL policies would allow callers to edit scores/correctness/timing if broad write grants were added.
  Existing invoker RPCs depend on those writes. `save_attempt_answer` also returns correctness before submission.
  A dedicated server-only mutation boundary and safe question projection must precede operational live CBT/grants.
- Zero Storage buckets and zero Storage policies: uploads/audio delivery are not configured. No guessed bucket or media URL added.
- Security advisor: 24 WARN notices (1 anon helper, 22 authenticated definer notices, leaked-password protection).
  Notices require function-specific review; intentional self/role helpers are not 23 proven vulnerabilities.
- Leaked-password protection is disabled. Current official Supabase password-security documentation says it requires Pro or above.
  No paid upgrade or auth setting change authorized/performed. Source: https://supabase.com/docs/guides/auth/password-security
- Performance advisor: 20 auth/RLS initialization WARN, 49 overlapping-policy WARN, 72 unused-index INFO.
  Prioritize hot owner queries and remove only demonstrated redundant policy paths after security behavior tests;
  zero/low traffic makes unused-index status insufficient grounds to drop indexes. New admin policies use scalar SELECT helpers.
  Read-only EXPLAIN (no ANALYZE, synthetic UUID filters) selected `idx_attempts_user_started` for history and `idx_questions_taxonomy` for published subject questions. These privileged planner checks establish index availability, not authenticated-RLS latency or measured throughput. No index change justified; load testing remains outstanding.
- High-confidence source secret-pattern scan: no private-key, sb_secret or GitHub-token patterns found in source/functions/workflows.
  This is a limited scan, not proof that no secret exists anywhere. No secret values were requested/read/logged.
- Dependency lockfile added; `npm ci` verified locally; npm audit reports zero known vulnerabilities at this lock.
  Both CI workflows now use the lockfile and npm ci. No additional runtime dependency introduced.

## Verification and release state

PASS locally: 33 Node unit/contract tests; TypeScript; production Vite build; npm ci; npm audit (0 vulnerabilities);
the existing onboarding and syllabus-visibility SQL scripts plus all three new FCB-01 SQL scripts in disposable PGlite PostgreSQL.
RED/GREEN evidence includes entitlement probe, editor syllabus rights bypass, unknown-rights exposure, NULL attempt count,
and valid English-last legacy save ordering. SQL fixtures contain synthetic users/content only.

GitHub Verify run 40532523228 on review commit `34d484767477cae6a08051afffc3b44e6fefadd0`: PASS, including native PostgreSQL existing/new SQL suites and Deno checks. Playwright run 40532523408: PASS, 158 tests and zero failures, job log inspected. Follow-up multi-session concurrency and role-aware academic UI changes (six new browser cases) require a fresh SHA-matched CI run.
Local Chromium installation failed because the CDN returned truncated archives; no browser PASS invented.
Real account/provider/device behavior, complete schema replay, backups and deployed SHA remain UNVERIFIED.
Supabase CLI telemetry was rejected by automatic review; no further CLI use or workaround attempted. The generated migration files already existed.

FCB-01 remains OPEN. Source remediation is not a production fix until authorized application and read-only verification.
Before any production application: snapshot reviewed function/policy/trigger definitions, confirm current schema still matches,
take a restorable provider backup, review each forward delta, use a controlled targeted application rather than full-history replay,
and retain the previous definitions for rollback. No application approval is implied by this report.

## FCB-02 content inventory / dependent gates

Live read-only grouping confirms 25 2026 drafts/pending pointing to the IBASS homepage and 25 2027 drafts/pending
pointing to the JAMB homepage with pending_official_publication provenance. There are no approved extracted topics.
The repository contains no syllabus PDF, lawful question corpus, licensed reference source or audio asset.
Homepage URLs and historical 2026 exam composition are not 2027 publication/rights approval.

Education publication (FCB-02/03), real content-backed attempts (FCB-04/05/06), grounded knowledge (FCB-07), and release (FCB-11/12)
remain acceptance-blocked on the named source/rights/season and live-operation gates. Payment/AI/email/push provider selection,
business thresholds and cost authorization remain undecided; no provider chosen silently. Existing optional WhatsApp CTA preserved.


Follow-up source also aligns the academic UI with server approval boundaries: both role RPCs must succeed;
editor rights/activation controls are absent, reviewed drafts are read-only, pending drafts retain authoring.
Admin rights and activation actions have browser regression coverage. Native psql concurrency harness refuses remote hosts
and production-shaped auth.users tables, observes actual lock contention, then asserts one administrator remains.
It is wired after the RPC fixture before later suites replace schemas. CI execution of the added coverage remains pending.


### FCB-01 native concurrency verified; final browser repair — 2026-10-27
- Source `50d2b22dd964954e7a0d3ea8b53478e4c59867ac`: Verify 40533656094 PASS, including actual two-session PostgreSQL races. READ COMMITTED rejected competing demotion with 23514; REPEATABLE READ rejected stale competing demotion with 40001; one admin remained in both. Job logs inspected. All three security SQL suites also PASS.
- E2E 40533655982: **162 PASS, 2 FAIL** in the new admin rights-control assertion (both platforms). Artifact DOM/trace prove both role RPCs returned true and the control was rendered as combobox Rights review; exact getByLabel included option text. Fixed the locator to accessible combobox role, preserving all authorization assertions; no product bypass or skipped test. New SHA rerun pending.
- Also found/fixed the same real `question_text`/`stem` schema mismatch in AdminQuestionReviewQueue; exact-projection pagination/fulltext mocks now reject invalid requests. Legacy dataAdapter.loadBootstrap has no callers/imports and remains untouched.
- Added metadata-only incident rollback snapshot at `docs/rollback/fcb-01-before.sql`: 10 exact original RPC definitions/hashes, four original policies, removal of three new triggers/guard. Independent review found no omission; forward+rollback DDL compiled against catalog-derived column fixture on PGlite. This is not a production backup or full-history replay; rollback deliberately restores known security gaps and requires incident approval.
- Next exact action: inspect final PR head's full 164-test browser result and Verify; fix any reproduced failure, then record the concrete production authorization/content gates. Main and production remain unchanged; final batch remains OPEN.

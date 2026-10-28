# FCB-01 security and backend-contract evidence

Current verified source/test: `ecbc0127906a4af8f2a3f1f4e915f2635ab86004`, PR #10.
Verify [40535097721](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40535097721) PASS;
Playwright [40535098147](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40535098147) PASS **164 tests, zero failures**.
Native concurrent administrator demotions pass READ COMMITTED and REPEATABLE READ.
Production application and FCB-01 acceptance remain OPEN.

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

The new migrations are `20261027164433_fcb_01_rpc_security_boundaries.sql`,
`20261027164455_fcb_01_syllabus_authorization.sql`, and
`20261027164518_fcb_01_question_rights_gate.sql`.

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


## FCB-01 verified review milestone — 2026-10-27 (current checkpoint)
- **Review PR:** https://github.com/DarealNovaking/Nova-ace-jamb/pull/10. Latest verified source/test SHA **ecbc0127906a4af8f2a3f1f4e915f2635ab86004**. GitHub **Verify 40535097721 PASS** (Deno, unit/contract, typecheck/build, all five SQL suites and native two-session admin-demotion tests). GitHub **E2E 40535098147 PASS: 164 desktop/mobile Playwright tests, zero failures**, actual job logs inspected. This supersedes earlier pending/failed browser entries; no failing test skipped.
- **Fixed in source, NOT yet in production:** owner-scoped entitlement RPC, draft metadata/validation audience guards, admin-only direct approval policies, English+3 legacy save guards/order, concurrent last-admin protection, syllabus rights/publication trigger/audit, question rights and NULL attempt bounds, CBT/admin question stem aliases and role-aware academic UI. Main remains `3a24fca5a9f63b9111d5d89ff6c0b0fd1bb22d9a`; PR not merged to avoid unapproved release activity.
- **Content inventory:** `docs/FCB-02-CONTENT-RIGHTS-INVENTORY-2026-10-27.md` individually lists all 50 versions (25 subjects across two seasons); 0 approved rights. No lawful question/syllabus/audio corpus exists in the repository. FCB-02 publication and dependent content packages cannot pass without identified sources, rights and official season configuration. No content was invented or published.
- **Evidence / rollback:** `docs/FCB-01-SECURITY-CONTRACT-AUDIT-2026-10-27.md` and `docs/rollback/fcb-01-before.sql`. Rollback is reviewed metadata restoration, not a data backup; it restores known weaknesses and is incident-only. Full historical migration replay remains blocked by the documented 12 missing-source counterparts/timestamp divergence. Never blindly db-push or grant client score/answer writes.
- **Status:** FCB-01 audit/remediation source is reviewed and regression-verified; **FCB-01 acceptance and the unified FCB-01..12 batch remain OPEN**. Production security remediation is not applied, live service flows/deployed SHA are unverified, and approved content/providers are missing. FCB-08/09 source integrations remain gated by the audited foundation and undecided provider/business settings; no provider or cost enabled.
- **Exact next action / required owner authorization:** review PR #10, then obtain explicit authorization for only its three targeted production security migrations after current-definition preflight and backup/rollback review. Do not merge/deploy, publish content or enable providers implicitly. Independently recover a safe schema-only migration baseline and identify the first authorized syllabus/question sources for FCB-02. A new agent must resume PR #10 and this verified SHA, not restart the 158-test frontend baseline or retired catalogue.
- No production database/content writes, deployment, paid upgrade or billable provider activation occurred. The following handoff-only commit changes no verified source/test files; PR checks may run again for documentation alone.


## FCB-01 targeted production remediation verified — 2026-10-27 (current checkpoint)
- Owner's repeated “Proceed keep working” followed the concrete request to apply only the three reviewed security migrations. That authorization was used only for those migrations; no release, content publication, provider activation or extra production changes are implied.
- Applied successfully through connected Supabase to project `uokiqlgmzprqfbzmedaz`: `20261027164433_fcb_01_rpc_security_boundaries.sql`, `20261027164455_fcb_01_syllabus_authorization.sql`, `20261027164518_fcb_01_question_rights_gate.sql`. Source files were renamed to the actual tool-assigned ledger IDs; SQL bodies are unchanged. Earlier filenames in historical entries are superseded. Ledger now has 44 entries.
- Preflight: ten existing function definitions matched the reviewed rollback hashes; four policies matched the prior snapshot. Forward/rollback DDL compilation passed on a disposable catalog-column fixture. The rollback is metadata restoration, not a production data backup, and deliberately restores known weaknesses.
- Live postflight PASS: all eleven changed/new function definitions exactly match independently compiled reviewed source; three syllabus triggers and four expected policies exist; all 48 ace tables retain RLS. Questions/versions/topics/attempts counts stayed 0/50/0/0. A READ ONLY transaction using synthetic JWT claims verified owner/audience denial, NULL argument rejection, revoked trigger/anon execution and absent client score/answer write privileges, then rolled back. No production test fixture or student data mutation was performed.
- The first migration request expired; read-only ledger/function inspection proved it had not applied before the successful retry. No duplicate application. Security advisors remain 24 previously classified warnings; this is not a zero-vulnerability claim.
- Prior source verification remains Verify 40535097721 PASS and E2E 40535098147 PASS (164 tests). Renamed-file references require focused replay verification; frontend code is unchanged. PR #10 remains the review branch; main was not merged and no frontend/services were deployed.
- FCB-01 and the unified final batch remain OPEN: clean schema reproduction, secure CBT server contracts, approved educational content and provider/release gates remain unresolved. Do not blindly replay historical migrations or add broad client mutation grants.
- Exact next action: recover and validate a schema-only baseline from catalog metadata in a disposable database, preserving current ACLs/RLS without extracting ledger SQL, user rows or secrets; then continue the canonical FCB dependencies. No further owner action is required for this source audit work.


### Schema recovery publication restriction — 2026-10-27
- Local schema-only recovery replay and exact catalog comparison passed, including real pgvector, signup-role isolation and existing-schema refusal. The full catalog snapshot, recovered SQL and recovery-only CI artifacts remain local on `local/fcb-01-schema-recovery`; they are not included in this review branch.
- Automatic approval review rejected publishing that production-derived snapshot to GitHub because it contains live schema definitions, ACLs and security metadata whose export was not specifically authorized. No alternate tool or indirect upload was used. Specific owner approval is needed to publish the full snapshot; generic new source contracts/synthetic tests and previously reviewed migration renames can continue independently.
- Main documentation `17f29e137a483066789e0242f20637c89beeae08` was merged into this review branch, preserving Balanced Autonomy and the safe CBT delivery finding. No main application source changed.
- Exact next action: implement/test an owner-scoped answer-key-free CBT delivery proposal with synthetic fixtures; no new production application is authorized. FCB-01 and the final batch remain OPEN.


### FCB-01 safe CBT delivery proposal — 2026-10-27
- Added `supabase/proposals/fcb_01_attempt_question_delivery.sql`, deliberately outside automatic migrations: authenticated owner-only active/unexpired attempt delivery, fixed pg_catalog-first search path, current publication/rights checks, exact attempt order, all-or-nothing withdrawal and a nested option key/text whitelist. No explanation, answer key, correctness or whole-row table grant is returned. No admin/editor bypass.
- Synthetic disposable PostgreSQL test first failed because the endpoint was missing, then passed after implementation. It covers ordered delivery, nested secret stripping, label compatibility, NULL/anonymous/cross-owner/missing attempts, no direct table grant, draft/inactive/rights withdrawal, missing questions, expiry/completion and duplicate IDs. Added this sixth SQL suite to native Verify CI.
- This proposal is NOT applied or connected to the current client. Existing start/resume/save/submit invoker/grant and correctness-oracle gaps still require a coordinated secure mutation redesign; enabling only delivery would not make CBT operational. Existing frontend journeys are preserved.
- Only reviewed pre-existing migration filename alignment, concise evidence, this new source proposal and synthetic tests are published; the blocked full live snapshot is excluded from branch history. Native CI result is PENDING until actual logs are inspected.
- Exact next action: inspect PR #10 Verify including the new SQL suite, then implement secure CBT mutation contracts without exposing answer correctness before submission. Full snapshot export requires specific owner authorization due automatic approval review; no additional production deployment or schema change is authorized.


### FCB-01 recovery verified; CBT and signup proposals — 2026-10-27
- Authorized recovery source published as `7aa36bda73a07fc24f3cf83382e0c41084215644`. Verify **40586134313 PASS**, including native PostgreSQL 17/pgvector recovery job **122477884813**: exact catalog/ACL parity, synthetic auth trigger, deterministic renderer and refusal of an existing schema; logs inspected. E2E 40586134436 was still running at this entry, not claimed passed. Export approval blocker is resolved.
- New source review proposals (not production migrations): `fcb_01_cbt_mutation_contract.sql` implements explicitly owner-scoped start/resume/save/submit without client table grants, hides correctness until submission, recomputes score from selections, locks attempt/content rows, checks current rights/publication and bounds, and makes submit replays idempotent. `fcb_01_signup_referral_collision.sql` fixes the reproduced signup failure when two Auth UUIDs share their first eight hex characters, retains existing codes, retries collisions safely and keeps student-only role provisioning with pg_catalog-first search path.
- Local RED/GREEN: old invoker start fails on denied questions access; signup same-prefix fixture fails on referral_codes_code_key. Both new full-schema suites PASS after the corresponding proposals. CBT tests cover cross-owner/no identity, option/membership/timing bounds, clearing answers, hidden/falsified aggregates, recomputed scores, repeated submit, immutable completion, expiry and rights withdrawal. No live test data written.
- Added native two-session CBT replay/save races to recovery CI (READ COMMITTED + REPEATABLE READ); result PENDING until actual new SHA CI logs inspected. The runner refuses anything except a local, exact empty synthetic auth/recovered fixture.
- These proposals remain disconnected from the frontend and NOT applied. Further CBT release gates include immutable question/version snapshots, official exam-config authority, budgets/abuse controls and approved content. Do not enable the new definer surface merely to clear a permission error; it needs the coordinated release review. The isolated signup correction can be reviewed/applied separately only with specific production authorization.
- FCB-01 and final batch OPEN. Next action: inspect the proposed-contract native CI/concurrency results, fix failures, then complete immutable CBT content/configuration boundaries or request only a concrete verified isolated production fix. Preserve compulsory English+3 and the established frontend.


### FCB-01 native CBT security verification and signup review — 2026-10-27
- Source `c6e051932918557cfdf0654db4cd575894d6b87f`: **Verify 40587125770 PASS**. Native recovery job **122481455391** passed full catalog parity, secure CBT mutation tests and signup prefix-collision regression. Actual logs confirm all three two-session CBT races pass: READ COMMITTED duplicate submit, REPEATABLE READ duplicate submit/retry, and save blocked behind submit. One statistics credit per attempt, completed answers unchanged. Existing role concurrency and six prior SQL suites also pass.
- Local mutation tests caught removal of resume ownership, save-response secrecy, active-result masking and submit idempotency. Read-only live preflight confirms current signup function SHA256 `7ca9fd70304ee8f1fb6496c68ec0279fbb92a28b5d28a3591f0afc91562b7be9`, owner postgres, owner-only EXECUTE, matching the recovered snapshot. Prepared `docs/rollback/fcb-01-signup-referral-before.sql`; forward/rollback compilation and exact original definition restoration PASS on disposable PostgreSQL. This is metadata rollback, not a data backup.
- Follow-up privacy test first reproduced full Auth ID exposure in the initially proposed collision fallback. Changed fallback to a fresh random identifier; local signup/privacy regression and rollback verification PASS. Existing short codes and rows remain unchanged. This follow-up requires SHA-matched native CI verification; do not carry the previous source's result over to new SQL.
- Export approval has been fulfilled; no production blocker for publishing metadata remains. The signup correction is separately reviewable and ready for final CI/preflight, but its production application is NOT authorized. The broader CBT proposal is NOT release-ready: immutable question/version snapshots, official configuration, resource-abuse/entitlement gates and approved content remain. No further schema/data writes, deployments or providers enabled.
- Next exact action: inspect final source CI/browser results, fix any failure, then obtain specific authorization only if applying the verified isolated signup trigger correction. Continue source-only CBT/content work independently; never interpret snapshot publication approval as a production mutation grant. FCB-01 and all final-batch acceptance remain OPEN.


## FCB-01 verified recovery and backend-contract milestone — 2026-10-27 (current checkpoint)
- **Source SHA:** `1e51830e11bb74b58536a31fa43c19d41f4fd9a2`, PR #10. **Verify 40587888984 PASS** (native recovery/parity/refusal, nine SQL suites across both database jobs, native role and three CBT races, Deno/Node checks, typecheck/build). **E2E 40587888996 PASS: 164 desktop/mobile tests**, actual job 122484122481 log inspected. Source beyond this SHA changes documentation only. Fresh npm audit reports 0 known vulnerabilities.
- **Publication approval fulfilled:** the full metadata-only schema recovery is in the review branch, outside migrations, with deterministic renderer and native PostgreSQL 17/pgvector tests. No credentials or user rows included. This reconstructs the present schema; incomplete historical migration replay remains a separate constraint. The previous export blocker is resolved; do not ask the owner again.
- **New source contracts verified, not applied:** owner-scoped CBT delivery and start/resume/save/submit; no whole-row question or score/answer mutation grants; no correctness before submission; server recomputation, expiry/rights checks, idempotent statistics and concurrent terminal-state preservation. These remain proposals pending immutable content/version/configuration and abuse/entitlement release gates. Frontend remains unchanged in this continuation.
- **Isolated signup fix ready for specific production authorization:** reproduced collision of two Auth UUIDs sharing a short referral prefix. Proposed trigger now retains existing/available short codes, uses random fallback codes without exposing full Auth IDs, provisions only student roles and has a fixed pg_catalog-first path. Native regression including privacy PASS. Current live function exact preflight SHA256 `7ca9fd70304ee8f1fb6496c68ec0279fbb92a28b5d28a3591f0afc91562b7be9` matches `docs/rollback/fcb-01-signup-referral-before.sql`; disposable forward/rollback restores exact metadata. No existing account/referral row mutation proposed. It has NOT been applied.
- **FCB-02 source check:** official e-syllabus rendered successfully but supplied no document-specific reuse authority or verified 2027 exam configuration. Inventory updated; all fifty stored drafts remain pending. No syllabus/question content imported or published and no programme catalogue workflow revived.
- **Production state:** only the three earlier specifically approved security migrations are applied. No further production schema/data changes, releases or provider activation. FCB-01 and unified FCB-01..12 remain OPEN.
- **Exact next action:** obtain specific authorization before applying only `supabase/proposals/fcb_01_signup_referral_collision.sql` after a fresh hash/ACL preflight; record its actual tool-assigned migration ID and verify definitions/ACLs without creating real production test users. If authorization has not arrived, continue source-only immutable CBT/version/configuration work. Do not apply the broader CBT proposal or merge/release implicitly.


## FCB-01 signup correction applied and verified — 2026-10-27
- Owner explicitly approved applying only the isolated signup fix. Fresh preflight matched the reviewed original function SHA256 `7ca9fd70304ee8f1fb6496c68ec0279fbb92a28b5d28a3591f0afc91562b7be9`, postgres owner, owner-only EXECUTE, existing signup trigger and absence of this migration. Disposable collision/privacy and exact rollback tests passed before application.
- Applied successfully through connected Supabase as **20261027220044_fcb_01_signup_referral_collision**. Promoted the reviewed proposal to that actual source migration filename and updated its test include. Only outer transaction wrappers were removed for tool application; function/revoke SQL otherwise matches reviewed source. Ledger is now 45 entries. No production fixtures, existing account/referral updates, deploys or provider activation.
- Live postflight PASS: function exactly matches independently compiled source, SHA256 **4c781801956265f3672464d9b009d4c53c6883983d418b13156e1e57c359dfe2**; postgres owner/owner-only EXECUTE retained; anon/authenticated direct execution false; existing auth.users signup trigger unchanged; exactly one new ledger entry. No claim of a newly created live-account test.
- A READ ONLY catalog comparison confirmed every other captured column/constraint/index/function/policy/trigger/table/schema ACL unchanged. Updated recovery metadata/SQL to the new live signup definition; deterministic renderer, full replay/parity, existing-schema refusal, signup/privacy/rollback and CBT mutation suites PASS locally. Snapshot now reflects all four approved migrations; its native new-SHA checks are PENDING. Earlier historical snapshot remains recoverable in Git.
- This resolves the isolated signup production gate. Do not ask to approve or apply it again. Broader CBT proposals remain unapplied; no implicit merge or release authorization. FCB-01 and final batch remain OPEN. Next safe action: immutable per-attempt question/version snapshots and corresponding scoring/withdrawal/answer-leakage regression tests in source only, while updated native recovery checks run.


### FCB-01 immutable CBT paper/version source follow-up — 2026-10-27
- Continued independently after the authorized signup application. New full-schema test first reproduced an active attempt receiving changed question text/options after a published-row edit; the existing scoring path also used the current answer key. This is a paper-integrity gap, not acceptable exam behavior.
- Extended source-only CBT proposal to capture a private per-attempt question payload including content_version, original text/options/key and taxonomy under row locks. Paper, membership and option-order snapshots are immutable. Delivery whitelists original paper fields, saving validates original options, submission grades the original key; current question publication/rights still gate every operation. No direct private-column/table API grants and no pre-submission key disclosure.
- Shared synthetic content fixture extracted for full-schema and native concurrency tests. Local PASS: old attempt retains version 1 text/options/score after version 2 edit; new attempt receives version 2; snapshot/order mutation rejected; current rights withdrawal blocks delivery/save/submit; private fields and trigger RPC execution denied. Existing CBT mutation and minimal delivery suites also PASS. Added the new suite before native concurrency in recovery CI; new source SHA native/browser results PENDING.
- The snapshot column/trigger and broader CBT RPC changes are proposals only; none applied to production or connected to the frontend. The live recovery snapshot still exactly represents the four approved migrations (449 columns/31 functions). Source trial adds a private column/trigger only in disposable databases. Official exam-configuration authority, abuse/entitlement gates and approved content remain release blockers.
- FCB-01/final batch remain OPEN. Next action: inspect native snapshot and concurrency regressions for this source, fix failures, then harden official CBT/mock configuration and resource boundaries in source while FCB-02 awaits document-level source/rights authority. Do not ask to reapply the signup fix or infer approval for CBT production changes.


### FCB-01 exam configuration/season approval hardening — 2026-10-27
- Verified the next concrete boundary gap: live activate_exam_config and activate_exam_season permit editor activation, and exam_config_subjects has editor ALL policy. Direct child authoring currently also encounters missing parent SELECT privileges; merely adding a grant would expose active composition mutation. A synthetic test first reproduced editor activation before implementing fixes. No production configuration was touched.
- New source-only proposal `fcb_01_exam_config_security.sql`: administrator-only audited activation; preserve configuration version identity (activation must not collide with a later draft's unique season/version key); idempotent approval; one active config per season and one active season globally; parent/all-season row locks reject stale REPEATABLE READ approvals. Draft subject authoring retained and audited, active compositions immutable, including moves/deletes.
- Validation enforces exactly compulsory active English plus any three configured active optional subjects, with consistent configured totals. No official year/date/duration/question composition invented. Season activation requires one valid config and approved published topic/subtopic trees for its configured subjects. Missing external official-season/content rights remain real publication gates.
- Narrow parent metadata SELECT grants are paired with corrected RLS: students cannot read draft seasons, configurations under unpublished seasons or inactive compositions. No question/answer/private-snapshot or score mutation grants. New trigger functions are not exposed for direct execution.
- Local full-schema authorization/composition/metadata/audit/closed-season tests PASS. Added five native approval races (configuration READ COMMITTED/REPEATABLE READ; editor write behind approval; global season READ COMMITTED/REPEATABLE READ), using exact local synthetic fixture guards and targeted cleanup. New-SHA native results PENDING.
- Immutable-paper source 94631f8332190c14adbbdd60757611ca0a12a4f8: Verify 40593143059 PASS, including snapshot and existing CBT concurrency. Its E2E 40593143070 completed successfully (count log still to inspect). Live remains only four approved migrations, including verified signup 20261027220044; none of these broader CBT/configuration proposals applied. Next action: inspect final native approval races and full browser result; fix failures and record evidence. FCB-01/final batch remain OPEN.


### FCB-01 native approval regression exposed taxonomy versioning defect — 2026-10-27
- Source 9455c1508672bca97cb0cc2bbae72c85693189c0: Verify **40596043387 FAIL** in native approval setup, not silently waived. Actual job 122512087845 logs show configuration READ COMMITTED, REPEATABLE READ and editor-after-approval races PASS; global season cases were BLOCKED because `topics_subject_id_name_key` forbids the same subject/topic name across two seasonal syllabus versions. Standalone local reproduction confirms the real schema defect; no fixture names were changed to hide it.
- Added source-only `fcb_01_syllabus_version_identity.sql`: unique topic names scoped to a syllabus version; retain legacy null-version uniqueness; composite FKs enforce version/subject and parent/child version consistency. Topic deletion retains existing child-cascade semantics. No rows removed, no catalogue import revived, no production schema application. New version identity/duplicate/mismatch/cascade regression PASS locally.
- Tightened season approval to require active published topic AND subtopic nodes, not merely an active rights-approved version header. New tests first reproduced acceptance of inactive topics, then both inactive-topic/subtopic negatives pass after the fix. Existing configuration authorization suite PASS.
- Prepared both metadata rollback files. Local forward/rollback restores exact original catalog definitions and API privileges. Taxonomy rollback explicitly refuses data that now legitimately repeats names across versions; it never deletes/reconciles real content automatically. New-SHA native/global-season and browser checks PENDING.
- Applied production state remains only the four earlier approved migrations, latest signup 20261027220044 verified exact-source/owner-only ACL. No more production changes authorized or performed. Next action: rerun and inspect all five approval races plus existing role/CBT/snapshot tests, fix any failure, and request a specific reviewed production security bundle only after evidence is green. FCB-01/final batch remain OPEN.


## FCB-01 verified signup deployment and security review bundle — 2026-10-27 (current checkpoint)
- **Production completed:** signup fix applied as **20261027220044_fcb_01_signup_referral_collision** after explicit owner authorization; exact reviewed definition/ACL/trigger postflight PASS. Live function SHA256 `4c781801956265f3672464d9b009d4c53c6883983d418b13156e1e57c359dfe2`; direct anon/authenticated execution false. Four approved migrations total, ledger 45. No production test accounts/content edits/deployment/provider activation. Do not ask to approve or apply this fix again.
- **Latest verified source:** `92a5316cbbcfc77ffc358c37a56d6187ebc44d81`, PR #10. **Verify 40597290888 PASS**: 12 SQL suites, all 10 native concurrency cases (2 role, 3 CBT, 5 config/season), recovery/catalog/ACL parity, Node/Deno, typecheck/build. **E2E 40597291143 PASS, 164 desktop/mobile tests**, actual job 122516313744 log inspected. Recovered-schema job 122516313126 logs inspected. This supersedes failed Verify 40596043387; failure exposed and fixed the genuine cross-version topic uniqueness defect, not skipped or hidden by fixture renaming. Following evidence commits change documentation only.
- **Source-only progress:** immutable private CBT paper/version capture and grading, secret-free delivery, idempotent/locked owner-scoped writes; admin-only audited exam/season approval, protected active compositions with retained draft editing, English+3 total consistency, hidden unpublished metadata, and correct syllabus version/subject/child identities. These broader proposals have NOT been applied or wired to the frontend. Official mock configuration binding, abuse/entitlement and approved-content release gates remain.
- **Next concrete production review:** `docs/FCB-01-NEXT-SECURITY-APPLICATION-2026-10-27.md` limits the requested bundle to the two named configuration/season and syllabus-version security proposals. No activation of any real season/configuration/content, no broader CBT RPC/private-column deployment, no merge/release or provider costs. Fresh read-only preflight: original three function hashes/four policies/parent ACLs match rollback; 0 topics, 0 subtopics, 0 mismatched version relations, original global name constraint present. No existing content needs deletion or repair. Native tests and complete forward/rollback catalog parity PASS; taxonomy rollback refuses legitimate cross-version duplicates instead of deleting them.
- **Required owner action before that live step:** specifically approve this separate two-proposal security bundle. The earlier “yes proceed” authorized the isolated signup correction only. Until approval, continue source-only official mock/resource-boundary work or FCB-02 source/rights research; never reapply/signup or implicitly activate/publish anything. FCB-01 and FCB-01..12 final acceptance remain OPEN, with all 50 real syllabus drafts still rights pending and no lawful published question bank/providers.

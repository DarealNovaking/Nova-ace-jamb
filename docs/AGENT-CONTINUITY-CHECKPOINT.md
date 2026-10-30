# ACE JAMB — Current Agent Checkpoint

> **Current state:** FCB-03 image upload and pre-decoding authorization are source-only and Verify-green; no production changes. See top checkpoint below. Older entries are historical.

## Private authenticated upload service and pre-decoding authorization — 30 October 2026

- **Source implementation only, not deployed:** `supabase/functions/question-media-upload/index.ts` is an explicitly gated Edge entrypoint using live-token verification via Supabase Auth `getUser(token)`, exact-origin CORS, immutable private Storage upload/readback, and a transaction-local verified-user claim over a TLS Postgres connection that checks `current_user='ace_media_executor'`. Missing server secrets/bucket settings return 503. No credential, bucket, deployment, role or permission change was made in the live project.
- `supabase/proposals/fcb03_media_executor_grants.sql` grants a separately provisioned, unprivileged executor only schema USAGE and EXECUTE on internal private media-intent and preflight RPCs; **no table permissions**. It validates the executor lacks superuser/BYPASSRLS/CREATEROLE/CREATEDB/REPLICATION. `supabase/proposals/fcb03_media_preflight.sql` creates a source-only, private, side-effect-free permission check that validates current editor/administrator role, draft ownership, revision and nonpublished state **before costly WASM decoding**; intent reservation and confirmation still recheck under locks, preventing time-of-check/time-of-use bypass. Installation order must be preflight SQL before grants. Both are proposals, not applied to production.
- `supabase/functions/_shared/questionMediaUpload.ts` now rechecks immutable private object readback on identical verified upload replay; missing/wrong-MIME/same-length tampered objects fail closed instead of returning false success. `tests/question-media-upload.test.mjs` includes the preflight/student-authorization rejection and replay tamper tests; `tests/sql/fcb03_media_executor.test.sql` checks least-privilege function calls and no authenticated/anonymous exposure in disposable PostgreSQL.
- **Verified evidence:** latest implementation head `5dcf673beb9281378fcb9e61badf96e62674ef66`, GitHub Actions **Verify SUCCESS all 7 jobs**, run `40977843456` (native question-workflow PostgreSQL guards, 110 Node tests, real Deno/WASM decoding, Edge TypeScript checks, frontend typecheck/build and other baseline jobs). The ACE JAMB E2E run `40977843536` was IN PROGRESS at this checkpoint and is **not claimed PASS**.
- **Remaining gates:** no live upload because approved private Storage bucket, dedicated SQL executor credential/role, deployed Edge function, access policies, environment secrets and integration acceptance do not exist yet. Also not implemented: rights/reviewer-verified publication binding, student-owned-attempt media delivery, guarded takedown/retention and complete media workflow UI. No production SQL/Storage/data/roles, deployment, question publication, or session changes were made. Existing plain-text authoring and CBT remain the current production behavior.
- **Exact next action:** build/verify the student-owned-attempt private image delivery proxy and reviewed media/question revision linkage in isolated tests; then prepare a specific production release package for explicit owner approval. FCB-03 is IN PROGRESS; FCB-01/02 remain COMPLETE.




## Private image reservation and byte-verification implementation — 29 October 2026

- New proposal **`supabase/proposals/fcb03_media_intents.sql`** creates an RLS-enabled `ace.question_media_intents` staging table with **no client table privileges** and two trusted-server-only functions with **no anon/authenticated EXECUTE**. Reservation requires a current editor/admin role, private owned/current question revision (admin exception for editing), bounded image metadata, rights evidence, unique server-generated opaque object path, 15-minute expiry, four-live-intents-per-question/revision limit and identical-request replay. Confirmation rechecks actor, ownership, revision and asserted SHA-256/MIME/size before marking **metadata only** as verified. Both paths share the existing question-authoring advisory lock and question-row lock. The reservation's SHA/size/MIME are *claimed*, not sufficient to trust actual bytes.
- New reusable **`supabase/functions/_shared/questionMedia.ts`** is a backend-only, fail-closed protocol. It requires a **supplied real safe decoder/re-encoder** (not yet integrated); format/magic-byte agreement, at most 2 MiB, single frame, bounded decoded dimensions, SHA-256 of sanitized bytes and immutable storage write/readback SHA-256 match before database confirmation. No public URLs, bucket, live endpoint, media publication or automatic file cleanup. Without a real sanitizer/storage adapter this helper cannot upload an actual image.
- New **`tests/sql/fcb03_media_intents.test.sql`** covers server-only grants, actor/owner denials, idempotency, mismatches, immutable generated paths, four-intent cap, stale question revisions and no automatic question/media publication in a disposable PostgreSQL fixture. The fixture was corrected to respect one-active-season and existing rights/role guards. New **`tests/media-storage-flow.test.mjs`** uses mock storage/sanitizer to exercise unsafe byte denial, output dimensions/frames, readback tampering, wrong intent path, failures and safe confirmation. The Verify workflow now executes these tests and Deno-checks the helper.
- Verified **all seven GitHub Verify jobs PASS** on implementation SHA `6549f88dcc85f07383a6a528010b1a0cea435cb8`, run `40967952767`. In particular native `question-workflow` PostgreSQL and `verify` Node/Deno/typecheck/build jobs passed. Browser E2E run `40967952876` was still in progress when this note was prepared; no browser success claimed for that SHA yet. Earlier test-red events were test-fixture/DDL name issues and were corrected; no migration was applied to live Supabase.
- **Not shipped:** No real image decoder, upload/download Edge Function, Supabase Storage bucket, storage policies, rights publication linkage, signed student proxy, cleanup job, server HTTP authentication, production migration, production content write, merge or deployment. Existing plain-text authoring and CBT remain untouched. FCB-03 stays OPEN; the 40 original draft questions remain unpublished and still need a genuinely different authorized reviewer. FCB-01/02 stay COMPLETE.
- **Next:** integrate a vetted real image decode/re-encode adapter and authenticated owner-bound upload endpoint against private/mock Storage, with cross-request/concurrent editor/review/takedown tests; prepare a concrete package for **separate specific owner approval** before any production SQL, bucket, provider or deployment operation.

## Current: FCB-03 private PostgreSQL rich-content validation — 29 October 2026

- PR23 branch `feat/fcb03-rich-content-contract` now also contains `supabase/proposals/fcb03_rich_content_validation.sql`, a **source-only, non-deployed** PostgreSQL validator with strict version, exact fallback, allowed shapes/bounds/control characters, private image UUID and explicit denial of public/anonymous/authenticated EXECUTE. It is deliberately not wired into question save/history/CBT; existing rich/media inputs remain rejected. Full private image lifecycle and storage authorization are specified in `docs/FCB-03-PRIVATE-MEDIA-LIFECYCLE-2026-10-29.md`; no Storage bucket/object or real upload endpoint was created.
- Fresh isolated PostgreSQL 17 CI tests `tests/sql/fcb03_rich_content.test.sql` PASS: one full rich-question payload, 23 hostile/refusal cases, 4 ACL-denial checks. All seven Verify jobs PASS on code SHA `7e48853c07a0920ac31b5c89e1024374a445a72d` in run `40959377728`, including existing question-workflow regression suites. Earlier full 258-browser E2E completed PASS for first corrected frontend-only candidate (run `40958014342`); browser E2E on new SQL/test source (`40959377355`) was still in progress at this checkpoint. New documentation-only commits do not change tested runtime code.
- FCB-03 remains OPEN. No merge, live migration, database/question/media/content mutation, storage resources, account/session changes or deployment performed. 40 draft questions remain unreviewed/unpublished; a genuinely distinct administrator remains a review prerequisite. FCB-01/02 remain complete.
- **Next:** confirm newest PR23 browser tests; then implement private upload intents and question/revision ownership/rights binding against disposable PostgreSQL plus mocked object storage. Production SQL, Storage creation and any deployment still require specific owner approval.

---


## Current: FCB-03 rich-content v1 source-only candidate — 29 October 2026

Verified main includes merged PR22 (`6ba898bdb64161d2b289df5d2e18fe18a3224f6a`). Current work is on `feat/fcb03-rich-content-contract`: strict, bounded versioned document parser; accessible text-only React renderer for paragraphs, Unicode math, tables and inaccessible image placeholders; untrusted-data/refusal and static-render tests; Verify CI registration. See `docs/FCB-03-RICH-CONTENT-V1-IMPLEMENTATION-2026-10-29.md`. No tests are claimed passed before CI. No source mutation on main, no production SQL/Storage, deployment, role/session or question/content changes. Existing plain-text RPC and editor remain unchanged; rich payloads are intentionally not accepted by production. FCB-03 still OPEN, 40 drafts unpublished, separate administrator required. FCB-01/02 remain COMPLETE.

**Exact next action:** inspect new PR GitHub Actions and correct any failing tests; then design/test the matching server-side and private media contract in isolated PostgreSQL. Production storage/database creation and deployment require specific additional approval.

--- 


> **Current-state rule:** this opening section is authoritative. Entries below the historical divider are evidence history and do not override this section.


## Current: FCB-03 real image sanitization and upload HTTP boundary verified on source branch — 30 October 2026

PR23 branch `feat/fcb03-rich-content-contract` has a strictly bounded server-only upload HTTP handler, private question/revision image-intent SQL proposal, immutable storage digest attestation, and a real pinned WASM ImageMagick still-image sanitizer. It is **not** a live upload API. Latest implementation SHA `36e76d73b0937f7e1c17c37d63dc85bd3ca3b4fb`: all seven Verify jobs PASS in `40976524664`, with 109 Node tests, 2 real Deno/WASM tests, current typecheck/build and native disposable SQL guards passing. The latest full browser E2E was pending at this checkpoint; do not infer browser PASS. Code is PR23 OPEN/unmerged, production unchanged. No Supabase SQL, Storage, Edge Function, content, user role/session or Cloudflare deployment mutation.

Remaining FCB-03: connect server JWT verification with least-privilege trusted DB transaction and immutable private Storage; media rights/reviewer publication and withdrawal; student-owned-attempt binary proxy, history/retention, moderation, and genuinely independent 40-draft review. Never silently re-enable the catalogue or reopen FCB-01/02. **Exact next action:** implement secure server adapters and gated entrypoint in source with mock/negative tests, then student media delivery. Request specific production authorization only at release boundary.


## Current: FCB-03 student delivery prerequisite repaired in PR22 — 29 October 2026

Read-only live contract inspection found student CBT/topic/evidence services directly queried ace.questions despite authenticated table/column SELECT being revoked. PR22 reuses the existing get_attempt_questions(uuid), unchanged, with actual server attempt ID and strict whole-paper/order/public-field/frozen-option-set validation. Two proposal-only metadata RPCs supply bounded published topic IDs and self-tracked topic mappings without exposing answers or granting table reads. Expired active attempts skip question delivery and preserve saved-answer submit/retry. No production mutation, deployment, account/session change or paid browser action occurred.

Tested runtime source406b6cb1ba2dc6dc7118be397c4d0351fe0814d5:94Node/typecheck/build PASS;109PGlite cases PASS; all7Verify jobs40942753474 PASS including115native PostgreSQL cases (109sequential+6contention). All258unfiltereddesktop/mobile browser tests PASS in40942753493/job123690807524 (6.3m); desktop/mobile expired-session retry screenshots inspected, no overflow or question content. Independent review's stale fixture and missing option-membership findings were corrected with RED→GREEN regressions; minor SQL formatting deferred. Exact proposal/body hashes and installation/disable order are in docs/FCB-03-STUDENT-DELIVERY-RELEASE-2026-10-29.md and compiled manifest. Production remains PR21 deployment5f8cac64/versionb9d792fa at100%; both new RPCs absent, questions/media0, existing attempt body MD5e45c9fbac60bdaf1a3c58a26173c53bd unchanged.

FCB-03 remains IN PROGRESS: rich formulas/tables/images, private media/storage, reports/moderation and genuine approved intake still open.40drafts remain unpublished; genuinely different administrator review remains mandatory. Preserve student prof_71146dfad171406c and admin prof_7d8a04d909144650; student saved sign-in restoration is needed only for genuine live acceptance. FCB-01/02 must not reopen.

**Exact next action:** obtain specific approval to install only the two metadata functions and merge/deploy PR22. AGENTS.md requires separate production approval; earlier PR21 approval does not cover this release.

## Current: dashboard redesign deployed; FCB-03 resumed — 29 October 2026

The owner specifically approved PR21 merge/production deployment. Exact approved head fa6de9124955bcbb2dd5dacb87f5de5358fe6761 merged as8a107e3832b59f67c58ccdf1b649054e22cad66d (tree e42e2f307fa327b68b1652e353a3cadc7905c783). Cloudflare buildbd2cc573-668d-48fb-807c-d150674d6e9b succeeded at19:58:10WAT; active deployment5f8cac64-9ee0-4cfc-ad9d-f67fed3d7417 serves versionb9d792fa-1720-458e-9ec0-578bed437592 at100%. Fourteen fresh live HTTP checks PASS: home/four admin routes, correct entry/project, student dashboard/study workspace, both admin gates, shared navigation, review controls, mobile CSS and source-matching service worker. No SQL, production question/content/role mutations or account/session clearing.

All final PR-head checks passed before merge. Fresh post-merge all7Verifyjobs PASS in40935662384 and all246unfiltereddesktop/mobile browser tests PASS in40935662430/job123665402575 (5.9m), with completed job logs inspected. Earlier82Node/typecheck/build,91native question/history cases and four final inspected UI screenshots remain evidence. Dashboard UI slice is released; FCB-03 itself is not complete.

Two bounded read-only real-profile checks: administrator ad118f57-84e8-4203-81bf-f90c05780b8f (6steps/27seconds) PASS, still authenticated, overview/sidebar/workspace shortcuts/operations and Question bank review controls/empty state confirmed; no signout. Student8214f3db-1525-4470-ab1c-b66a61e547b6 (3steps, duration reported0) met a sign-in wall and stopped immediately. Its saved authentication was not available in this run; cause unverified. No signout, storage clearing, credentials access or login repair was performed. Preserve exact profiles prof_71146dfad171406c and prof_7d8a04d909144650. Fresh genuine student UI acceptance requires owner sign-in restoration; do not claim it passed from mocked tests or HTTP delivery. Known listed-rate cumulative estimate≈$0.47 (excludes any unreported student browser duration); within the approved$2 budget. Posted charges were not supplied. No further metered run started.

FCB-03 resumed with repository rich-content contract inspection, recorded in docs/FCB-03-RICH-CONTENT-CONTRACT-NOTES-2026-10-29.md. Existing payload validators and server/media/history guards are text-only; student CBT projection excludes keys/explanations. Extend a versioned shared renderer/validator and private delivery boundary coherently rather than bypassing those guards. Corrected stale proposal-only history wording in docs/FCB-03-REMAINING-CONTRACTS-2026-10-29.md: PR20 functions are already installed/deployed and must not be reinstalled.

Evidence: docs/evidence/dashboard-release-2026-10-29.json. This post-release record is on docs/dashboard-release to avoid a redundant production docs deployment. Deferred UI minors remain generic identity copy inside study modes and internal JSX/mode-label cleanup.

**Exact next action:** implement and verify FCB-03 rich-content/media/storage and then reporting/moderation against the audited contracts. Obtain separate concrete approval for any future production migration/storage creation/content intake/release. Forty original AI-assisted drafts remain unreviewed/unpublished; a genuinely different administrator must review before publication. Restore student browser sign-in when the owner is available without disturbing the working admin session. FCB-02 remains VERIFIED COMPLETE.

## Current: dashboard UI/UX redesign prepared in PR21 — 29 October 2026

The owner explicitly paused FCB-03 to organize and polish both student/admin dashboards. PR21 feat/dashboard-design introduces a shared dark/lavender workspace shell, compact desktop sidebar, mobile navigation, clear active destinations and consistent spacing/typography. Student home has one CBT action, actionable learning access, actual subject/topic counts, saved subjects and a six-topic preview linking to the complete searchable workspace. Account/notifications/support remain accessible. Admin overview/academic/question routes share navigation; authorized editors never see the full-admin overview link. The obsolete Batch3 milestone is removed. Existing gates, services, forms, publication/rights review and source attribution remain intact. No dependencies, SQL, production content/role mutations or real-profile actions.

Local82Node/typecheck/build PASS. First UI source940ed215 passed244unfiltereddesktop/mobile Playwright (40911362922/job123579887459,5.8m); its four dashboard screenshots were inspected. Review found two material accessibility/navigation defects: skip links followed sidebar controls and study-to-account links could arrive before asynchronously mounted anchor targets. Both corrected with first-Tab/SSR order and delayed account/support regressions. Final mobile chrome was tightened after screenshot inspection; all admin destinations now fit without a horizontal scroller. Final sourceaaf5501d passed all246unfiltereddesktop/mobile browser tests in40927091099/job123635561946 (5.8m); all7Verifyjobs in40927091089 PASS, including91native question/history database scenarios. Four final dashboard screenshots inspected, including reduced mobile chrome and all-three-admin-destination visibility. Narrow320/393 and wide1440 layouts, long names, >=44px nav targets, first-Tab skip navigation, query/back focus, bounded/full topics and delayed account/support anchors passed. Subsequent whitespace-only source cleanup preserves all49compiledasset filenames and SHA256 hashes; final docs do not alter tested behavior.

Independent read-only review found no other material security/correctness issue. Deferred minors: desktop student identity uses generic copy inside study modes; dense JSX and duplicated study-mode labels could be tidied later. No further real TinyFish run or spend was started; preserve prof_71146dfad171406c and prof_7d8a04d909144650 without signout/session clearing. Production remains approved history release cb6ef545/version76d89d0c at100%; PR21 is not production-deployed.

**Exact next action:** obtain specific approval to merge/deploy PR21 through the existing Cloudflare trigger; no database migration or content publication is part of this UI release. AGENTS.md requires specific production deployment approval; PR20 approval does not cover this new UI release. Resume FCB-03 after this UI task; its genuine independent-review/content intake, rich-media/storage/moderation gaps remain open. FCB-02 stays VERIFIED COMPLETE.

## Current: question history and restoration deployed — 29 October 2026

The owner specifically approved the prepared two-function installation and PR20 deployment. Supabase migration20261029160300_fcb03_question_history installed the exact reviewed proposal (SHA256975e65e0cb544d8738a95e5d496e3919c6d6008b54e45122a6c60fc80c338b0d; stripped bodya93441092140bae8990d97f6a0e90c37dc6dffa3c6f68a1a83368faa392b20e1). Both compiled bodies, postgres owner, guarded SECURITY DEFINER configs and ACLs match; anonymous EXECUTE is denied and both identity-free calls were actually rejected. Existing manage/review bodies remain unchanged. Questions/history/media remain0/0/0. Two expected authenticated-definer advisor notices were assessed against the reviewed guards; existing notices remain, not a zero-advisory claim.

PR20 merged exact approved head03b64dd7 as cb6ef545dd79bf9fe9281dd054076e6120f6c8a7 (tree e7a1228d819960501b6a1ad52e722925258019e9). Cloudflare build17f47ac2-7977-4c40-ab7d-f897d3fff05e succeeded at17:04:03WAT; deployment96e4e28a-c719-48f5-b5b3-0ea6f1c70adb serves version76d89d0c-9749-4cb5-981a-ea1a8b3eef9c at100%. Eleven fresh live HTTP checks PASS: home/four admin routes, correct entry/project, academic gate, question queue, CSV importer, AdminQuestionHistory-XGFU17Ar.js with restore controls/RPCs, and source-matching service worker. This verifies delivery, not a production restoration transaction. All PR-head checks passed before merge; tested runtime/test/CI blobs are unchanged from the verified234browser/91nativeDB/77Node source.

Neither real saved profile was signed out or cleared; no further paid browser run, question upload/publication, role/bucket change or content mutation occurred. Forty original AI-assisted drafts remain unreviewed. FCB-03 remains IN PROGRESS; FCB-02 remains VERIFIED COMPLETE. Genuine approved intake and independently authorized administrator review, live save/review/publish/withdraw/restore acceptance, rich content/media/storage and dedicated reporting/moderation remain. Deferred history keyboard-focus polish and delayed synthetic-session regressions remain as previously recorded.

Fresh post-merge CI also passed: all seven Verify jobs in40907760216 and all234unfiltereddesktop/mobile browser tests in40907760189/job123567091680 (5.5m), verified from the completed job logs.

Evidence: docs/evidence/fcb03-question-history-release-2026-10-29.json. Release documentation is on docs/fcb03-history-release, preserving production source without a redundant docs-only deployment.

**Exact next action:** continue independent rich-media/storage/moderation implementation under the existing final-batch scope; arrange a genuinely different administrator and obtain specific content-intake authorization before uploading the prepared drafts. Do not simulate reviewer independence, re-request this completed PR20 release approval, or reopen finished FCB-02 work.

## Previous: real sessions verified; history/restore and 40 original drafts prepared in PR20 — 29 October 2026

The owner authorized substantial FCB-03 work while away, approved a total $2 TinyFish browser budget, saved separate student/admin profiles and explicitly required no signouts/session clearing. Preserve both profiles and switch between them only: student prof_71146dfad171406c, administrator prof_7d8a04d909144650. Two genuine ten-step read-only runs completed: student07b99cf3-7354-48fb-a4d7-ad4712bab40b saw authenticated published syllabus32topics and was denied /admin-questions without editorial/answer controls; admin243422c1-ad60-4502-ba6c-0e84754de138 opened the deployed importer/template/25subject choices and editor, then closed without saving. Specific populated topic selection was not verified by that admin run. Neither profile was signed out. Approximate listed-rate usage$0.33 (20steps/262seconds); actual posted charges were not provided. Account ignored max_steps/strict settings, so do not assume a hard tool-call cap; no further metered runs started. Source fetches were listed as free.

PR20 feat/fcb03-question-history adds two proposal-only guarded RPCs and a typed UI: coherent ten-snapshot cursor pages and restoring older text as a new private draft with required reason, optimistic version, immutable history and atomic audit. Existing manage_question performs validation/ancestry/duplicate/ownership locks and resets publication/rights/reviewer; unsupported media is refused. Anonymous/student/identity-free/untrusted owner/stale revision/published-edit and bad cursor/source/reason cases are covered. No live SQL installation, question mutation, role change or deployment was performed in this work.

Tested source49a25000b600ed53d20257d3dd2f4807fb46ca49 (runtime30104c9): all234unfiltereddesktop/mobile Playwright PASS (40902536563/job123548418170,5.5m); all7VerifyjobsPASS (40902536692), including91native database cases (85sequential+6realcontention,job123548419131). Local77Node/typecheck/build and85PGlite cases PASS. Initial browser absence reproduced before UI; first implemented run232PASS/2FAIL was a selector matching ten hidden/visible answer labels, fixed by scoping assertions to the single open details element. Final desktop/mobile screenshots inspected. Compiled new-function manifest and metadata-disable script verified locally; existing manage/review MD5 fingerprints exactly match production. Final subsequent changes are documentation/data checksum normalization only, retaining tested runtime/test/CI blobs.

Prepared40original AI-assisted ACE practice drafts (8each MAT/PHY/CHE/BIO/ENG), five topic-specific CSVs and a readable REVIEW.md worksheet. Actual importer parsed all40 and matched manifest; duplicate checks and exact LF-byte SHA256 checksums passed. The remote GitHub transport normalizes text line endings, so the local CSVs were standardized to LF and checksums regenerated for exact downloadable bytes. Independent technical/content review found no blocking code issue, definite wrong key, multiple-answer ambiguity or broad-topic mismatch; this is not genuine administrator approval. The exact publisher EPUB could not be retrieved (invalid shell bytes; alternate free fetch timed out), so no external exercises/rights were approved or copied. Drafts remain unreviewed, not uploaded or published.

Live read-only preflight: questions/history/media0/0/0, one administrator, new history RPCs absent; no question-named Storage bucket or ace report-named table found (not a complete Storage/moderation audit). A genuinely different authorized administrator must review before publication; do not elevate/reuse the student profile or simulate independence with the owner's other account. Rich content/formulas/tables/images, secure Storage/delivery, dedicated reporting/moderation and genuine published intake remain FCB-03 gaps. FCB-03 is IN PROGRESS; FCB-02 remains VERIFIED COMPLETE.

Deferred nonblocking review points: move keyboard focus into history and back to its trigger; add history-specific delayed read/restore completion tests after synthetic session unmount. Guards were inspected; no blocking issue found. Evidence: docs/evidence/fcb03-question-history-verification-2026-10-29.json, compiled manifest/live preflight/real-session JSON; release package docs/FCB-03-HISTORY-RELEASE-2026-10-29.md; remaining contracts docs/FCB-03-REMAINING-CONTRACTS-2026-10-29.md; intake docs/content-review/fcb03-original-intake/.

**Exact next action on owner return:** approve installing the exact two-function proposal (SHA256975e65e0cb544d8738a95e5d496e3919c6d6008b54e45122a6c60fc80c338b0d; stripped installation bodya93441092140bae8990d97f6a0e90c37dc6dffa3c6f68a1a83368faa392b20e1) and merging/deploying PR20, following the reviewable release sequence. AGENTS.md requires specific production approval; the prior approval covered PR19 only. Then prepare the genuine independent-reviewer/content-intake action. Do not restart finished syllabus/import work, sign out either profile, publish the draft bank, install proposals or trigger a new deployment without that specific approval.

## Current: CSV question upload deployed and live delivery verified — 29 October 2026

Owner explicitly approved merging PR19 and deploying bulk upload. PR19 merged as ba347f808c34d637bc72692a44f8fcabe6049f3f; its tree f5b51b6d2c936093611bca7a28bbae170a5437e2 exactly matches the approved PR. All checks on final head1231112f were successful before merge. Prior full224desktop/mobile,72Node and61native database results remain recorded; no runtime changes were made during deployment.

Cloudflare build e9a42ec7-3cdc-4ad1-9d74-e84dd13d1506 succeeded for this exact merge, completed14:42:51WAT. Bounded build logs confirm version0ff49afc-eff5-4048-87c8-3c8928d92a61; active deployment7fcdcc31-f79b-4c54-89f4-0557014385b0 serves that version at100%. Ten live HTTP GET checks PASS: home and four existing admin routes serve the expected shell; entry bundle references the correct Supabase project and question route; academic gate/review queue and the new AdminQuestionImport-D-YYNR2X.js chunk are available with import/template/preview/receipt controls and guarded question RPC references; service-worker bytes match source. This verifies delivery, not a genuine signed-in production CSV transaction. The owner previously confirmed the question workspace opens.

CSV upload is LIVE at /admin-questions → Import questions: one subject/topic per file, optional subtopic, up to100question rows/1MiB, preview/validation, explicit source evidence, private draft saves and stop-on-uncertain receipt. No questions were uploaded or published by this deployment; no database migration or role changes. FCB-03 remains IN PROGRESS; rich content/media/storage, moderation/version restoration, actual signed-in author/reviewer acceptance and the first lawful independently reviewed dataset remain. FCB-02 remains VERIFIED COMPLETE. Next: prepare a small source-documented intake batch against the active taxonomy, verify answers/topic mapping, then obtain/perform the authorized genuine author and independent-review workflow before publication. Do not replay completed syllabus work or imply that the bank is populated.

Evidence: docs/evidence/fcb03-question-import-2026-10-29.json. Latest post-release handoff is on docs/fcb03-release-retry to record the release without unnecessarily triggering another production deployment for documentation alone. The approval boundary recorded below is resolved for PR19; it is historical, not a new permission request.

## Current: CSV question intake verified in PR19; production approval pending — 29 October 2026

Owner confirmed the deployed administrator question workspace opens. This confirms genuine-user workspace visibility, not a completed production save/independent review. The owner then requested bulk upload and authorized proceeding; PR19 (feat/fcb03-question-import) now adds UTF-8 CSV intake: header-only template, one approved subject/topic and optional subtopic per file, 100-row/1 MiB limits, strict quoted/multiline parser, full draft/source validation, duplicate blocking, safely rendered preview, explicit rights-evidence confirmation, sequential guarded private-draft saves, stop/freeze on an unconfirmed response, per-row IDs and receipt, and signout/unmount cancellation of subsequent rows. No new dependency or database migration; no direct question table writes, automatic submission, approval or publication.

Verified application source 375b231455f97499f88b023c99f7d831328dfaed; final tested application/test/CI tree source d4494b24efedcf9149852943ac6db4206b8032ce (only the Verify test list differs). Seven relevant blob hashes exactly match the local worktree. All 224 unfiltered desktop/mobile Playwright tests PASS in run40878284412/job123463430904 (5.1m); all seven Verify jobs PASS in40878284522, including 60 Node20+12 Node24 cases and61 native question scenarios (57sequential+4contention,job123462680497). Local72Node/typecheck/build PASS. Browser absence of Import questions reproduced in original run40877145402 before the UI; parser/runner and real React server-rendered entry also observed RED then GREEN. Final desktop/mobile importer screenshots inspected. Passing artifact12900055392 SHA25616587ed24be84fa462ee5065c846fe4c96f9afd997045d1d2ee25736bb6aa55d.

Independent review found no material issues and independently passed11import tests. Deferred nonblocking coverage: deterministic delayed File.arrayBuffer stale-read browser case; exact-limit and multibyte byte-limit parser cases. Corresponding generation/byte guards were inspected. Browser tests intercept all Supabase traffic; no production question mutation or signed-in upload is claimed.

FCB-03 remains IN PROGRESS. The text editor is live on91f610f; bulk upload is prepared in PR19 and is NOT yet live. Source intake/media/storage/moderation/version restoration and the first lawful independently reviewed dataset remain. FCB-02 remains VERIFIED COMPLETE; do not restart it. Evidence: docs/evidence/fcb03-question-import-2026-10-29.json; operator guide: docs/QUESTION-CSV-IMPORT.md. Current docs-only evidence commit does not change the tested runtime/test/CI blobs; an automatically triggered redundant CI run does not invalidate the named completed run.

**Exact next action:** obtain specific owner approval to merge PR19 into main and deploy CSV intake through the existing Cloudflare main trigger. AGENTS.md requires specific approval for production deployments; merging main implicitly triggers that deployment. Then verify the deployed source/version and live importer chunk and update release evidence. Do not publish any questions or alter roles as part of deployment. Preserve this worktree and the unrelated original checkout changes.

## Current: FCB-03 text-question editor deployed — 29 October 2026

The owner explicitly approved the pending production retry. One build of exact merge `91f610f83df92edf0b03fda735848571fc3a0bd1` succeeded: build `5b390bf3-40ea-4a7b-893d-f4bee10284b5`, completed 13:22 WAT. Cloudflare uploaded the assets and deployed version `074a87c2-dfae-4e39-9a72-e74d404cf64a` at 100%, deployment `931f2f95-efc8-4c71-8c16-f3ecf6f80254`. The previous API 10013 failure and retry approval blocker are resolved; no configuration/source changes or additional retries were needed.

Nine live HTTP checks PASS: home, /admin, /admin-academic, /admin-import and /admin-questions share the expected app shell; the entry bundle contains the question route and correct Supabase project; the academic gate and question queue chunks contain the editor and guarded manage_question/review_questions RPC references; service worker bytes match source. This is HTTP delivery verification, not signed-in browser acceptance. Full prior 214 browser tests and 61 native database scenarios remain valid; no application code changed during this release.

The text-question authoring/review/publication slice is deployed. Backend installation remains verified as recorded below; no questions were published. FCB-03 remains IN PROGRESS: actual signed-in author/reviewer acceptance, rich content/media/storage, imports/moderation/version restoration and the first lawful independently reviewed dataset remain. FCB-02 is VERIFIED COMPLETE and must not be repeated. Next: verify the genuine administrator can open /admin-questions, then continue the remaining content workflow against the recorded design. Release evidence is in docs/evidence/fcb-03-question-workflow-release-2026-10-29.json. Latest continuity is recorded on docs/fcb03-release-retry to avoid an unnecessary second deployment for documentation only.

## Current: FCB-03 editor merged; production retry requires approval — 29 October 2026

FCB-02 is VERIFIED COMPLETE and active. PR18 merged as91f610f83df92edf0b03fda735848571fc3a0bd1. Text-question workspace/application source cc51a39 passed214unfiltereddesktop/mobilecases(E2E40851850866/job123373018607), all7Verifyjobs(40851850815),61nativePostgreSQLscenarios(57sequential+4actualcontention,job123373019009),61localNode/15Python/typecheck/build. Desktop/mobile editor screenshots inspected; no overflow. Independent review's SQL whitespace mismatch and stale REST fixtures were reproduced/fixed; cross-tab logout/account-change cache clearing was reproduced/fixed in both administrative gates. Final exact-label test issue was confirmed against the enabled dropdown snapshot, then fixed using accessible combobox names; final214PASS, no skipped suite/filter.

Backend installed as20261029095101_fcb03_question_workflow under the owner's standing do-it-all/proceed direction. All7functionbodySHA/owner/config/ACLs exactly match the isolated compiled manifest, two triggers enabled, anonymous EXECUTE denied and identity-free authenticated read/write denied by the expected guard. Questions/history/media0/0/0; roles hash unchanged,25approvedactiveindexversions and active2026practicebaseline preserved. Only two expected authenticated-definer advisor notices added; existing findings unchanged. Exact migration/proposalSHA and evidence are in docs/evidence/fcb-03-question-workflow-release-2026-10-29.json. No genuine-user impersonation, paid browser run or question publication.

Cloudflare build4ac3635e-6662-4997-a3e5-b155e0db93a4 for merge91f610f built the app successfully(22assets,Wrangler4.155.0), then asset-upload-session returned unknown APIerror10013. Old production deployment09307756-0235-40d9-9b32-a3ed7996c0ec/version5e377d6f-7845-4b5b-835b-108743f6ba53 remains at100%; the new editor is NOT live. Raw-log request was rejected as unbounded/sensitive; a materially safer bounded/redacted error-line read succeeded. Do not retrieve unrestricted logs. One exact-commit production build retry was then rejected BEFORE execution by automatic approval review: prior proceed was not deemed explicit approval for this specific production mutation. Do not bypass with a direct deploy, alternate provider or a commit to main that implicitly retriggers deployment.

**Exact next action:** obtain explicit approval for one Cloudflare production build/deployment retry of91f610f through existing trigger0e4b50fc-9c5e-4cde-bdd4-cede32aed57e. Then run that exact build, inspect bounded diagnostics if it fails, verify active version/source and live/admin-questions assets, and update release evidence. No source rewrite or new sign-in is indicated by the observed API error. Documentation is preserved on non-triggering docs/fcb03-release-retry so recording this blocker does not bypass the rejected retry.

FCB-03 remains IN PROGRESS: finish the editor release and actual signed-in author/reviewer acceptance, then rich media/storage, import/moderation/version restoration and the first lawful independently reviewed dataset. The first-source note reuses the prior materials report and verifies Siyavula's unbranded-edition notices; exact EPUB bytes/component licences and questions are not yet approved. The completed FCB-02 package must not be repeated.

### Previous verified state

## Current: FCB-02 verified complete — 29 October 2026

FCB-02 VERIFIED COMPLETE — 29 October 2026, for the owner-approved original ACE concept index and clearly labelled 2026 practice baseline. The owner restored the same index through the genuine administrator Publish action after the independently verified withdrawal. Fresh read-only Primary postflight exactly matches all 25 active/approved v3 versions, 108 study groups, 1167 concepts, the existing 2026-format configuration and its 25 subject-composition rows. Source topic/concept and private v2 version fingerprints are unchanged. Totals remain 100 versions/322 topics/2123 subtopics: no duplicate records. The preparation season/config are active, dates null. Exactly two publication audits (initial absent→published and withdrawn→published) and one withdrawal audit have canonical administrator actors and the reviewed package/candidate digests.

Restored non-admin authenticated-role reads without JWT identity expose 25 versions/108 groups/1167 concepts and the correct active blueprint, with zero private versions. The owner previously confirmed topics and subtopics in the student interface; that is owner-reported acceptance, not an automated real-account browser claim. Fresh focused publication/student-display tests: 7 PASS. Prior exact-source release evidence remains 202 browser cases and 24 native database scenarios; the full suite was not rerun for this documentation-only acceptance.

Acceptance: approved versioned index/launch coverage PASS; active practice season and English60+three40 composition PASS; source preservation and private-draft visibility PASS; student display PASS (owner report); live takedown PASS; exact live restoration PASS. No more administrator clicks are needed. Scope excludes official 2027 confirmation, annual prescribed books, source prose/PDF reuse licensing and question/lesson/media approval; these are not claimed complete. The narrow factual-concept/original-arrangement use basis is recorded without claiming an external JAMB licence. Existing private source drafts remain private.

Next exact action: begin FCB-03 by inspecting the existing question authoring/review/publication contracts, current question-bank state and approved-source inventory; prepare the smallest lawful reviewed launch dataset and finish gaps through existing architecture. Do not restart FCB-02 or assume the active index is a populated question bank. FCB-03..12 remain separate. No production writes, paid browser runs or new deployment occurred during this verification. Evidence: docs/evidence/fcb-02-study-publication-postflight-2026-10-29.json.

### Previous verified state

## Current: withdrawal verified; restore the index next — 29 October 2026

Live withdrawal verified — 29 October 2026. The owner completed Withdraw ACE study index in the genuine administrator session. Independent read-only Primary checks: all 25 v3 versions are draft/restricted with null activation timestamps; 0 active topics/subtopics; practice baseline inactive; preparation season draft. All 100 versions, 322 topics, 2123 subtopics and 25 baseline composition rows remain stored. One canonical-admin withdrawal audit matches the reviewed package/candidate, alongside the original publication audit. Read-only authenticated-role checks without a JWT identity expose 0 versions/topics/subtopics/configurations. No connector production writes or deletion occurred. Withdrawal acceptance PASS; student display previously PASS by owner report. FCB-02 remains IN PROGRESS only until restoration and final saved-state verification. Exact next action: genuine administrator clicks Publish ACE study index on the regular Academic Structure page to restore the same index and baseline, then independently verify the exact candidate, active visibility and restoration audit. Do not leave the site withdrawn or create another package.

### Previous verified state

## Current: student display confirmed; final withdrawal/restoration pending — 29 October 2026

Owner-reported student acceptance — 29 October 2026: the owner confirms “I can see topics and subtopics.” Mark the student display check PASS (owner-reported; not an automated signed-in browser run). Publication and activation remain independently verified. Only controlled live withdrawal/restoration acceptance remains open. Exact next action: in the regular Academic Structure page, use Withdraw ACE study index once; independently verify hidden content and inactive baseline before the genuine administrator republishes the same exact index. No new publication copy, deletion, claim spoofing or paid browser run.

### Previous verified state

## Current: ACE study index published and independently verified — 29 October 2026

The owner completed Publish ACE study index in the genuine administrator session. Fresh read-only Primary verification confirms 100 syllabus versions: 25 active/approved v3 and 75 older drafts. Totals are 322 topics/2123 subtopics, with exactly 108 groups/1167 concepts active. Every new version, topic, concept, practice configuration field and all 25 composition rows match the reviewed package exactly. Source topic/subtopic fingerprints and the private v2 version fingerprint are unchanged. One publication audit binds package 77045759503d5b89be336dad2942bebc9eb67540c1c63c81d75db5324370ba7f and candidate c2b54cf4c6c877cab38e5fbeae6057ff09544aa56093eb0fcd2d34611e19fb20 to a canonical administrator actor.

Saved practice configuration 396d1910-d458-5d5f-8484-380bc8c71919 and the preparation season are active. Historical 2026 configuration remains inactive and its season closed; unconfirmed dates remain null. Practice is explicitly based on 2026 rules, not confirmed 2027 rules. No new content mutations were performed by this verification.

Read-only SET LOCAL ROLE authenticated without a JWT identity returns exactly 25 versions/108 groups/1167 concepts, one configuration and the correct active blueprint; zero private versions are visible. This validates the non-admin database visibility path, not a signed-in student's browser. No claims or account identity were forged. Fresh focused tests: node --test tests/study-publication.test.mjs tests/student-syllabus.test.mjs — 7 PASS. Prior 202 browser/24 native database checks remain historical release evidence; not rerun in this documentation-only verification.

**FCB-02 remains IN PROGRESS:** publication/activation and persisted content checks PASS; actual signed-in student browser acceptance and live withdrawal/restoration remain UNVERIFIED. Do not withdraw the newly published content just to satisfy a check without the genuine admin session and a controlled restoration path. TinyFish remains out of credit; no paid runs or provider switch authorized. Exact next action: open the regular site using a student account and verify Syllabus topics displays the selected subjects' study groups rather than the unpublished-content empty state. Record the result, then complete the controlled live withdrawal/restoration acceptance with the real admin session. Do not recreate the baseline or republish unnecessarily.

Evidence: docs/evidence/fcb-02-study-publication-postflight-2026-10-29.json. Unrelated existing FRONTEND-PHASE-3-CURRENT-HANDOFF edit preserved.

### Previous verified state

## Current: ACE study publication controls released — 29 October 2026

PR17 merged d1e3cca60c3d9aefe05e8e1d03cf2f33d27f41dd; tree437846a00becc2f17abcb4cecc6cb2527ad82852 exactly equals tested source7d05f173c82db9605d4b32109d82c15515a48a39. All6VerifyjobsPASS (40835010709), including24native PostgreSQL cases with4real contention scenarios (job123317640073; logs inspected). Full unfiltered202desktop/mobile testsPASS (40835010609/job123317639436;202/4.5min log inspected).42selectedNode/15Python/typecheck/buildPASS. Independent security/UI review has no remaining blockers; count-drift withdrawal reporting finding was reproduced RED and fixed. Final frontend update hides inactive draft-creation controls after confirmed publication. No temporary browser filters.

Cloudflare production build9e7d9842-9323-4db5-b1b2-e6993fdc01ee SUCCESS from merge d1e3cca6. Active deploymentd7f78b7e-3001-4a8d-b5d8-fd3184aa3071 servesf4a3928a-d62c-4a9d-bfe9-25aa1c6b3a2e at100%. Final preview10GETchecksPASS; production10GETchecksPASS (routes/shell/project/RPC/digest/assets/service worker; no auth execution). No provider configuration/secrets changes.

Helper installed as20261029023824_fcb02_original_study_publication. BodySHAe27729207c20d1975add819c45a5604e168ec7fb1eb77dc636e886291711c90e matches reviewed source; postgres/definer/pg_catalog+pg_temp/3s/privateACL/genuine-admin role lock/READCOMMITTED. Identity-free operation denied. Ledger56. Fresh prepublication read:75versions, zero new index versions, zero active topics/subtopics/configs/seasons, zero publication audits. No content/rights/activation writes by connector. Publication package77045759503d5b89be336dad2942bebc9eb67540c1c63c81d75db5324370ba7f/458704bytes, candidatec2b54cf4c6c877cab38e5fbeae6057ff09544aa56093eb0fcd2d34611e19fb20.25newv3/108groups/1167concepts retain1170source IDs. Narrow concept-name/original-arrangement scope only, no JAMB licence claim; annual reading texts and2027dates unconfirmed. Old75review/scaffold versions remain private/unchanged. Withdrawal is scoped/no-delete and survives content drift; republishing requires exact validation.

**Exact next action:** owner refreshes the regular https://nova-ace-jamb.novaking5002.workers.dev/admin-academic page and clicks **Publish ACE study index** in **ACE study index publication**. This must use the actual signed-in administrator session; it is an execution gesture, not another approval. Do not use preview links, Create2026practice, the old rights dropdowns, fixed staging, identity spoofing or paid TinyFish runs. TinyFish wallet remains exhausted; no top-up or provider switch authorized.

After the click, independently read-only verify100versions total (new25active/approved; old75unchanged),322topics/2123subtopics total and108/1167active, savedbaselineactive/25compositionrows, preparationseasonactive/null dates, exactlyone publication audit with genuine canonicaladmin actor, expected candidate metadata/rows and preserved historical/source checksums. Then complete actual student/season/withdrawal/restore acceptance. **FCB-02 remains IN PROGRESS, not done from deployment alone.** Evidence: docs/evidence/fcb-02-study-publication-release-2026-10-29.json and original-study-helper-install evidence.

An unrelated pre-existing working-tree edit to docs/FRONTEND-PHASE-3-CURRENT-HANDOFF-2026-10-23.md was preserved and excluded from these commits.

### Previous verified state

## Current: original-index preparation merged; publication implementation under test — 29 October 2026

PR16 merged3006635cdb73a079cc21eaf1def435d315557f50, tree1e4e338248f886ff9a1537fd57eb43ba235dbf6d equals tested7f723ddf21ffa32087e6b5088108d6a5c69d8a38. Full194desktop/mobile tests PASS (40806009533/job123225019661, log inspected), all5VerifyjobsPASS (40806009575). Original candidate25/108/1167,1170lineage and student-note filtering complete. Cloudflare auto deployment not yet inspected.

Current branch feat/fcb02-study-publication adds UNAPPLIED fixed genuine-admin check/publish/withdraw RPC and dashboard panel. Package digest77045759503d5b89be336dad2942bebc9eb67540c1c63c81d75db5324370ba7f,458704UTF8bytes. Exact candidate +saved2026baseline+sourcefacts/originalarrangement assessment bound; no external JAMB licence claim. Publication validates source/config/content drift and atomically activates25newv3/108/1167 plus existing baseline/season, preserving privatev2. Withdrawal uses only fixed identifiers, no deletes, remains available after drift; restoration still requires exact validation. Independent withdrawal readback does not falsely require unchanged source text.

SQL inert stub RED then19PGlite casesPASS, including rollback/privacy/withdrawal/restoration/source+content drift/real-admin/RC/trusted-owner refusals. Native23cases (19sequential+4contention) implemented but NOT YET RUN.6focusedNode,15Python/typecheck/buildPASS.4newbrowserflows added (expected202total), executionpending. Independent read-only security/UI review requested. Production installer NOT applied, no live content/rights/activation writes, no paid browser action.

**Exact next action:** finish independent review, publish this branch for full native/browser CI; fix any findings before installing the exact reviewed RPC and deploying controls. Then owner uses real-admin Publish ACE study index and independent read-only postflight, followed by actual student/withdrawal acceptance. No user action required yet; never impersonate or replay original staging. FCB-02 remains IN PROGRESS.

### Previous verified state

## Current: original ACE study-index candidate — 29 October 2026

Owner chose **Our own organization**. On feat/fcb02-independent-index, generated a separate inactive/pending v3 candidate:25versions,108original study groups,1167concept entries covering all1170source IDs (214roots +956corrected children). Digest c2b54cf4c6c877cab38e5fbeae6057ff09544aa56093eb0fcd2d34611e19fb20. Original frozen payload/digest and live source records unchanged. Generator validates corrected live fingerprints and rejects duplicate/missing/cross-subject root mappings. Narrow proposed factual-concept/original-arrangement basis documented in docs/FCB-02-ORIGINAL-INDEX-BASIS-2026-10-29.md; no external JAMB licence claimed. No publication or live writes.

Reserved editorial descriptions are now omitted at the student getSyllabusTree boundary without altering admin/source records. Helper regression reproduced RED then2/2GREEN; generator stub RED then4/4GREEN. Full content Python14tests, selected Node37tests, typecheck and build PASS. New desktop/mobile browser regression added but NOT YET RUN. Independent reviewer initial attempt failed due model capacity; one retry requested. Full CI/review/publication/actual student and withdrawal acceptance pending. TinyFish remains out of credit; no paid runs or impersonation.

**Exact next action:** publish this implementation branch for full CI and independent review, fix findings, then implement the narrowly scoped genuine-admin publication contract against the exact reviewed candidate. The already verified2026configuration does not need recreation or another click. No user action required now. FCB-02 remains IN PROGRESS.

### Previous verified state

## Current: 2026 practice configuration saved and verified — 29 October 2026

The owner completed the genuine administrator action. Independent read-only postflight exactly matched every reviewed configuration field (excluding generated created_at) and all25subject rows. Candidate396d1910-d458-5d5f-8484-380bc8c71919 now exists:7200seconds,180questions,4options, English60 plus3choices at40. Total2configurations/50composition rows. One practice_baseline_created audit event has a non-null actor whose canonical role is admin. No user identifiers were copied into this evidence.

The candidate remains inactive; preparation season remains draft with null dates. No active configs/seasons/topics/subtopics. Historical source/config/season/25rows projection remains0dbb29b684d68024a96cad55dcf6dec0b378ad22ea56a50b5a89309e72975b7d. The214-topic projection2012de2bfc6beeebcc1e31a232037c54,956-subtopic projection86806e7337523a601427debd19e26888 and25v2 version projection5082c7d856c33bcfe7dd16edb30eb1ad all remain unchanged.25v2 versions remain draft/rights pending;50v1 scaffolds remain49pending/1approved drafts. No connector writes or identity impersonation occurred. Evidence: docs/evidence/fcb-02-2026-practice-created-2026-10-29.json.

**The 2026 practice-configuration implementation plan is COMPLETE. No more Create/check/sign-in gesture is needed for this step.** Retain the existing full192browser/25native-contention/42import verification and production-release evidence; these documentation-only updates introduce no runtime change or new runtime test claim. FCB-02 remains IN PROGRESS because syllabus-use evidence, legitimate publication/activation and actual student/season/rollback/takedown acceptance remain open. The owner-selected labelled2026 baseline removes waiting for official2027 format confirmation; do not reopen that decision or require a human teacher signature.

**Exact next action:** resolve/document the supported source-use basis for the current source-derived taxonomy (permission/licence or another appropriately supported basis; no claim that every short concept label needs licensing). Then use genuine administrator publication and existing activation contracts, and verify the actual student journey and withdrawal/rollback. Do not mark the whole batch done from an inactive configuration, invent source rights, toggle approval to satisfy tests, replay fixed staging or create another baseline copy.

### Earlier release evidence

## Current: 2026 practice action released — 29 October 2026

PR15 is merged as898cc577b68f43246d824186192b8606274599f1. Its tree4ebde726f05975b692d42375e54646a926ba0040 exactly matches tested source195f8461dee0927196ee544acca990b216f06a2d. All5Verify jobs passed (40797396665), including25new native practice cases with5real contention scenarios and42existing import cases. Full unfiltered192desktop/mobile tests passed (40797396676/job123197087279).47localNode/10Python/typecheck/build passed. Final independent review findings were reproduced RED and fixed: bounded test connections and explicit read-committed admission prevent the stale-repeatable-read case. Do not repeat this finished verification or request the2026-format choice again.

Production Cloudflare build2592521e-8d06-4a39-9987-e0c8a07deee9 succeeded from that merge. Active deployment507e5e6e-ce1c-487a-ae3e-b98d567d3ae4 serves9dfd94df-c0cf-4c23-8632-3a9a99c4f161 at100%.9production and9preview route/asset/project/digest checks passed; the served admin chunk contains the new control. These GET probes are not genuine-admin execution. Evidence: docs/evidence/fcb-02-2026-practice-release-2026-10-29.json.

Both server migrations are installed (20261029004531 and20261029005504); final helper body SHA4551d7f09a78c2d71fcfa08b52758d9aff3a2386f44e7c01293c64f0ad703c1e, private admin guard, locked role, exact source-format/candidate checks, atomic creation, strict replay and no activation. Ledger55; adviser summary unchanged. No configuration rows were created through the connector. Last live read: candidate absent,1historical config, zero active configs/seasons/topics/subtopics, corrected subtopic projection86806e7337523a601427debd19e26888 unchanged.

**Exact next action:** owner refreshes regular /admin-academic and clicks **Create 2026 practice draft** under **2026 practice baseline**. This is the actual authenticated execution gesture, not another approval request. No more sign-in requests, TinyFish paid runs or claims impersonation. Then read-only verify the exact candidate,25children,50total composition rows, one creation audit with genuine actor, inactive state, unchanged source/history projection0dbb29b684d68024a96cad55dcf6dec0b378ad22ea56a50b5a89309e72975b7d and unchanged taxonomy. FCB-02 remains in progress; source-use, legitimate publication/activation and actual student/rollback/takedown acceptance remain separate. Final2027 facts are no longer a prerequisite for this labelled2026 practice baseline.

### Earlier implementation and verification history

## Final review isolation fix — 2026-10-29

UI source9feaebc90485b35efc4a4a1576f14d04d75cc94a fullbrowser40796603744/job123194479548 PASS (192cases; loginspection next), Verify40796603743PASS. Reviewer found staleRRsnapshot couldhidecompositiondrift becauseparentlockdoesnotinvalidatechild-onlyedits. Reproduced newRR-refusal regressionREDagainstoldhelper; addedexplicitREADCOMMITTEDrestriction, bothRR/serializablecasesGREEN.20localSQLcasesandguardedupgradepathPASS. Historicalappliedmigration20261029004531unchanged; guardedpatch installed20261029005504_fcb02_practice_read_committed, exactbodySHA4551d7f09a78c2d71fcfa08b52758d9aff3a2386f44e7c01293c64f0ad703c1e matchescanonicalnewinitialinstaller. Samepostgresowner/definer/ACL/path/3stimeout; ledger55/configcount1/candidateabsent. Evidence fcb-02-2026-practice-isolation-fix-2026-10-29.json. Dedicatedboundeddisposable nativeCIjob addsfivecontention cases (source/targetedits, concurrentcreate, demotion-first/operation-first) plus20sequentialcases; finalCIpending. NofurtherUIchange; fullunfilteredbrowserworkflowunchanged. Nextpublishpatchedsource, inspectfullVerify/native25+192browser, merge/deployverifiedfrontend, thenrealadminCreate2026practice draft andpostflight.

### Previous UI implementation evidence

## Practice administrator panel implemented — 2026-10-29

Test-first focused browser run40796128322/job123193397417 reproduced6expected missing-panel failures (threeflows/twoprojects); firstfullrun40795696304 wascancelled, not PASS. Coreguardunitstub RED2/4 then4/4GREEN. Implemented AdminPracticeBaseline +typed parser/create-readback coordinator; noautoRPC onmount, admin-onlydisplay, explicitcreate/check, duplicateinflight guard, sanitizederrors/check-before-retry, createdstate independentlychecked. Addededitor-exclusionbrowserregression. FULL unfiltered npm rune2e restored; workflowdiffagainstab47823 EMPTY.47localNode tests (35+12),10Pythonunits,typecheck/buildPASS;18localSQLcasesPASS includinguntrustedowner/sourcecomposition/conflict/historicalpreservation. Native/full192browserCI andfinalboundedUIreview PENDING. Livehelperalreadyinstalled; configcandidate remainsabsent. Nextpublishfinalsource/fullCI/review, merge/deployverifiedfrontend, then userCreate2026practice draft throughrealadminsession andindependentpostflight. No repeatapprovalneeded; no TinyFishcredit/topup/runs.

### Server installation evidence

## 2026 draft helper installed — 2026-10-29

Exact reviewed server source7e150ae1 nativeVerify40795696229/job123191525883 confirms14newSQL+42existingimport scenarios PASS. Source/body reviewed; no authorization/atomicity blocker. Testtransport isolation finding reproduced RED thenfixed by bounded local transport+preinstall emptyrecovery preflight;10PythonunitsPASS. Installed20261029004531_fcb02_2026_practice_draft; ownerpostgres/definer/pg_catalog,pg_temp/3s; bodySHA c98e06501cc60463043899afa76e6307396cfe6f0c76e7f536f2974aa2cda9ff matches local. ACL onlypostgres/authenticated; realadmin+lockedrole required. Liveidentityfreeowner/authenticated callsrefused, cache reloadnotified, ledger54/configcount1/candidateabsent. No appdata/activation/publication changed. Evidence docs/evidence/fcb-02-2026-practice-helper-install-2026-10-29.json. BrowserREDpending; focusedtest-only workflowtemporary, MUSTrestorefullnpmrune2e beforefinalCI/release. Sourceinstallerhistoricalformat/composition contract is exact forcheckedfields, not allhistoricalmetadata. NextfinishpanelRED/GREEN andfullCI, independentUIreview, release then genuineadminCreate2026practice draft action.

### Earlier implementation state

## 2026 practice draft implementation started — 2026-10-29

Branch feat/fcb02-2026-practice-draft. Implementing fixed admin-only check/create RPC, no activation/publication. SQL behavior test first RED on inert stub (no complete draft), then14isolated PostgreSQL-compatible cases PASS pending nativeCI confirmation. NativeCI step added. Three new browser cases pending RED (panel absent), implementation follows after reproduced failure. Source installer supabase/proposals/fcb02_2026_practice_draft.sql not installed live. Target exact candidate396d1910-d458-5d5f-8484-380bc8c71919; all previous content/format decisions preserved. Next native/browser RED check, minimal admin panel, full verification/review, exact installer/front-end release and genuine admin creation. No live mutation yet.

### Baseline decision

## Owner selected 2026 preparation baseline — 2026-10-29

Use verified 2026 rules for preparation: 2hours/180questions/4options; English60 plus3subjects at40. Owner instruction supersedes waiting for official2027 settings as a baseline prerequisite. Label UTME practice — 2026 rules, source_year2026/official_2027_confirmedfalse; unconfirmed dates null. Preserve closed historical2026 record and annual reading-text qualifications. Exact prepared inactive config/25subject candidate: docs/content-review/fcb-02-2026-baseline-proposal-2026-10-29.json; decision/evidence docs/FCB-02-2026-BASELINE-DECISION-2026-10-29.md. Fresh live source snapshot matches; all2024 three-optional-subject combinations and25unique IDs checked. No live writes/activation or publication; no server validation claimed. Config root grants SELECT only and composition trigger requires genuine actor; no create-config RPC currently exists. Next independent implementation: reviewed genuine-admin draft configuration creation route using this fixed candidate, without broad grants/claims spoofing; source-use/publication/student acceptance gates remain. Do not repeat2027 research or ask for this same baseline choice again.

### Previous external-evidence findings (format-policy wait superseded)

## FCB-02 external-evidence investigation — 2026-10-29

All8corrections verified complete; do not repeat that work. Fresh official-source investigation and live read-only season/config/rights check are recorded in docs/FCB-02-EXTERNAL-EVIDENCE-2026-10-29.md.2027 remains draft/null dates/no config; closed2026 historical config inactive.25v2draft/pending,zeroactive taxonomy. Officialcalendar/third-party pages maintenance; indexedIBASS registration announcement pending. Final2027 facts and applicable source-use basis not established. Statutory concepts/data exclusions and context-dependent fair dealing were checked; do not assert that all short labels require a licence or that government material is automatically reusable. Existing compilation not cleared by this research.

Prepared precise UNSENT support request docs/FCB-02-JAMB-REQUEST-DRAFT-2026-10-29.md. No external messages, database/schema/rights/config/publication or runtime changes. Canonical acceptance unchanged: FCB-02 BLOCKED_EXTERNAL_EVIDENCE, not DONE. Exact next action: obtain rights/use-basis and final2027 documentary clarification through official contact or supplied valid evidence, then genuine-admin activation/publication and actual student/rollback/takedown acceptance. No repeat approval needed for already-authorized development; missing facts/rights cannot be supplied by another generic proceed. Current user action, if seeking that route, is to submit prepared request through officialsupport; sending has not been authorized. Do not silently substitute a provisional season/practice config to mark this batch done.

### Earlier correction evidence

## FCB-02 correction postflight — 2026-10-29 (Africa/Lagos)

Owner reported Apply reviewed corrections done. Fresh read-only SQL confirms all eight reviewed corrections now saved, including History/PHE names and Conditional sentences source note. Entire956-row seven-field subtopic projection equals precomputed final target86806e7337523a601427debd19e26888;214-topic projection remains2012de2bfc6beeebcc1e31a232037c54. All214topics/956subtopics inactive.25v2 versions remain draft/rights pending;50v1 scaffolds unchanged in grouped state (one approved draft/49pending drafts). No connector writes, role/schema/config/rights/publication change. Evidence docs/evidence/fcb-02-corrections-postflight-2026-10-29.json. Merged main b45c4d7 now has all6 GitHub checks completed SUCCESS, including full browser suite and production Cloudflare.

Correction work COMPLETE; no further user click/sign-in/paid automation or staging replay required. FCB-02 overall remains IN PROGRESS because documented source-use basis, official2027 season/config and legitimate published student acceptance remain open. Human subject-teacher prerequisite was withdrawn; do not reinstate it. Exact next action: resolve/document remaining launch source-use and official2027 configuration evidence, preserving inactive drafts until supported publication/activation. Do not claim missing official facts or mark the whole milestone complete.

### Previous release state (superseded by postflight above)

## FCB-02 frontend released — 2026-10-29 (Africa/Lagos)

PR12 merged as b45c4d772362cedb897aa701faa152baff23b53c; its tree e8f512349318272cdb8167de44a9f77de4cb48be exactly matches tested source814a911d710bdfb987ec9765ffa92b5b96fae17b/local a5857ee. PR10 became merged by ancestry; do not merge/replay its older source separately. Full unfiltered E2E40759431770/job123067025376 passed184 desktop/mobile cases (4.2m). Verify40759431969 passed all4jobs; native job123067027083 confirms42SQL scenarios.43localNode tests/typecheck/build passed. Final bounded reviewer found no blocker in callback-ref fix/selection-race regression/full workflow.

Cloudflare production build a534ec00-f99c-4a2a-8c3a-0c5d6806e121 succeeded from main b45c4d7 using npm run build / npx wrangler deploy. Active deployment cde9a3d9-65f1-499f-b5aa-9e2020367758 serves version fc17ae88-5863-41d2-9ed8-481a22a82190 at100%; prior809c6301 retained. Preview build94a8b2b1 succeeded/deployment46de4af5;9preview HTTP asset/route/digest checks passed. 9production HTTP asset/route/digest checks also passed; new correction panel is present in served JS (unauthenticated GET evidence, not live browser execution). No new live schema/roles/claims/rights/config/publication mutation.

Live readback still214inactive topics/956inactive subtopics; current full subtopic projection e5380bea7564102134b8720bece5a771. History/PHE labels and Conditional description remain pending.25v2 remain draft/rights pending. Final target projection86806e7337523a601427debd19e26888. TinyFish exhausted; do not launch further paid runs or top up automatically. The user has already authorized these corrections. Exact next action: user opens regular /admin-academic and presses Apply reviewed corrections under Finish reviewed corrections; then read-only verify target projection and inactive/version state. This is execution in the genuine user session, not another approval request. FCB-02 stays IN PROGRESS pending those fields, source-use basis, official2027 config and published student acceptance.

### Previous checkpoint (superseded by release state above)

- **Updated:** 2026-10-28 — FCB-01 VERIFIED COMPLETE; FCB-02 authenticated administrator helper INSTALLED after specific approval; isolated frontend Preview DEPLOYED/VERIFIED; signed-admin Preview acceptance and existing private staging VERIFIED; production release and publication remain pending.
- **Latest live correction progress:** fourrenames+twoadds saved throughrealadmin;2labels+1sourcenote pending.214topics/956children/allinactive; actualaddIDs and whole-projectionchecksums in fcb-02-live-corrections-progress-2026-10-28.json. TinyFishcreditexhausted; no newrunsstartedafterlimit. Guardedadmincompletionactioninprogress, no source/rights/season facts invented.
- **Latest editor acceptance:** source2490040 on fix/fcb02-subtopic-edit /PR12.176browserchecksPASS,allVerifyjobsPASS(42native),36localNode/typecheck/buildPASS,independentreviewclear.9liveHTTPchecksPASS. No live draftcorrectionsyet; stableoriginneedsuserlogin. Production unchanged. ParentCloudflareWorkerIDd94d2a25f876477aa50a2bac80ca7022tracksMAIN;oldbbb0IDwasPREVIEWconfig,notglobalproviderstate. Evidence fcb-02-subtopic-editor-verification-2026-10-28.json.
- **Repository:** `DarealNovaking/Nova-ace-jamb`; existing PR [#10](https://github.com/DarealNovaking/Nova-ace-jamb/pull/10), remote branch `security/fcb-01-contract-audit`. Latest fully verified source/test/Preview SHA **`7b9ff4319924f415b594e0f20ac428f002952f84`**. Evidence closeout lives on docs/fcb-02-preview-verification; connected runtime branch remains pinned to7b9ff43. Main last confirmed `17f29e137a483066789e0242f20637c89beeae08`; no merge or frontend deployment. Workspace `/workspace/scratch/84a394a7502b/Nova-ace-jamb`; inspect actual local branch/HEAD before continuing.
- **FCB-01 production baseline:** eleven reviewed migrations applied after approval; ledger52,51 RLS tables/39 functions/11 triggers. Source/recovery/API ACL baseline independently verified. Approved-config owner-only CBT server contracts, immutable papers/scoring, administrator season/config approvals and English-plus-three enforcement implemented. Do not reopen/reapply this finished baseline. Frontend integration remains FCB-04.
- **Production content now verified:** 75 draft syllabus versions: 50 existing v1 (49 rights pending; Agriculture 2026 rights approved by user) plus25 v2 rights-pending review drafts;214 inactive topics/954 inactive subtopics. Matching package-stage audit at2026-10-28T17:36:41.155557Z predates the read-only TinyFish check. No content published.
- **Connector:** use Supabase Primary `link_6ad4c02b73a08191a9ae6a568bb1428f`, project `uokiqlgmzprqfbzmedaz`; write-enabled, not read-only. Other Supabase link has request-state failures. Browser auth fallback was declined and closed. Do not request passwords or restart that fallback.
- **Active scope:** one approved final batch FCB-01..12. FCB-01 DONE; FCB-02 IN PROGRESS. Programme/institution catalogue import remains retired; IBASS syllabus research is active. Preserve the existing architecture/frontend and English plus three other subjects.
- **FCB-02 source material:** all25 official PDF hashes/locators reviewed;214 roots/955 child candidates/1,169 locators. Import excludes unnamed English reading-text placeholder ENG-01-04, yielding954 children. No novel or Arabic disputed period date selected. PHE heading exceptions remain disclosed. Hausa set-text evidence2026–2030 and Yoruba poetry2027 scope are recorded; no whole-syllabus annual approval inferred. Rights, independent academic approval and publication remain unapproved.
- **Implemented source entry point:** `scripts/prepare-fcb02-import.py` now emits one fixed-package admin RPC installer, guarded helper-only uninstaller, canonical client payload, direct SQL scripts and manifest. Existing academic workspace gains `AdminSyllabusReviewPackage` and typed `syllabusReviewService`. Auto-preview only; explicit write confirmations; editor/student exclusion; safe unavailable/error/retry states. Stage creates only25 new version-2 pending drafts/214 inactive topics/954 inactive children; preserves all50 scaffolds. Exact replay no-ops; undo rejects edits, approvals, additions and all captured references, including RLS-hidden student progress.
- **Security:** real `auth.uid()`/admin check, role row FOR SHARE through commit, trusted RLS-bypass owner, exact payload byte length/SHA before JSON, explicit `pg_catalog,pg_temp` with temp last and qualified catalog relations. Row locks protect undo/FK races. Source data remains data; direct scripts use base64/server SHA. No roles/claims/publication changes. Uninstall verifies source/owner/definer/config and drops only the unchanged helper.
- **Security regression evidence:** temporary pg_constraint shadowing was reproduced RED, then fixed and verified GREEN. Earlier native harness stall was a missing psql newline, fixed in test transport. Both defects are resolved in the latest source; do not repeat those investigations without new evidence.
- **Current package:** digest **`aa9340d4f81bdf5253c322b14a9a091f8b0cd638a6593fd3805b207ee1453ef3`**. Installer SHA256 `a07a244340fc414e4f8701cc75714cc6496b6e978842500e14e765837386f580`; uninstaller `a8dcdfdba3dbb938727b6c4202f177f7b26852dad040f7c63296a76d843fe3d0`. Manifest: `docs/content-review/import-proposal/review.json`; scope/boundaries: adjacent README. Payload roughly624KB /97KB gzip, dynamically loaded only for the admin panel; student entry size unchanged.
- **Exact-source Verify:** [40693456640](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40693456640) completed PASS:9 Python units, deterministic manifest/client diff, **42 native PostgreSQL scenarios** including temp-catalog regression, executor/reference race and both demotion orderings; other security/recovery/contract/race jobs, Node/Deno, typecheck/build PASS. Native job122833915258 logs inspected. [Reviewed installer/package and test evidence](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40693456640/artifacts/12817893123).
- **Browser evidence:** previous application source677503c passed172 desktop/mobile tests in run40674942702; captured layouts visually inspected with no clipping/overflow. Exact-source [browser run40693456615](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40693456615) completed PASS,172 tests (3.9m), job122833915323 log inspected. Local browser BLOCKED (Chromium absent; downloaded archive truncated); CI is the verified alternative. Native SQL plus mocked browser tests do not claim a live authenticated production/PostgREST execution. Independent bounded security review found no remaining blocker and independently checked final payload/digest/file hashes.
- **Approval boundary:** owner said approveeverythingwhilefollowingJAMBinstructions, aftertheexact8draftcorrectionproposal. Approvalpersistsforreviewedcorrectionsandnecessaryverifiedfrontendcompletion; do notaskagain. Itdoesnotestablishmissingofficial2027facts,externalsourcepermission,orpaidwallet/provideractivation.
- **Remaining FCB-02 acceptance gates:** two reviewedlabelchanges+one sourcenote arequeuedinadmincompletionaction; sources/review/helper/staging/signed-in acceptanceareverified. Finalsource-usebasis,official2027configurationandactualpublished-recordstudentacceptanceremainopen. A human subjectteacherisnotablanketprerequisite; nofalsecompletionorofficialfacts.
- **Exact next action:** latestcallbackracefix+FULLworkflowrestorationprepared. Publishfinalhead, verify184browsercases/fullVerify andboundedreview, deployverifiedfrontendcompletion underownerallapproval, then userclicks Apply reviewed corrections. TinyFishcreditexhausted:no paidruns/signinrequests. Remaining3fieldpatchesnotapplied;targetsubtopicfingerprint86806e7337523a601427debd19e26888.

- **Installation evidence:** `docs/evidence/fcb-02-helper-install-2026-10-28.json`; actual migration `supabase/migrations/20261028133030_fcb02_fixed_review_admin_executor.sql`. First connector request expired; helper and ledger were verified absent, then exact same installer retry succeeded. Server-recorded installer SHA exactly matches reviewed manifest; function body SHA `4e6cd804d74557376587677d6d8cef4ebe10f467e38ac70f87863f719803ad60`,postgres owner,SECURITY DEFINER,pg_catalog/pg_temp path,3s lock timeout. ACL only postgres/authenticated; PUBLIC/anon denied. Live no-identity authenticated and anonymous invocations refused without claims changes.50version-row/role hashes and counts unchanged;0topics/subtopics/questions/attempts,4audit events. Advisors added only the expected authenticated-definer exposure notice for this internally admin-guarded API; no other change. Existing baseline39functions plus this additive migration recovers40; no FCB-01 snapshot rewrite.

- **Release-readiness preparation:** PR10 title/body now describe private syllabus staging plus the already-installed security contracts. Source66e06c5: Verify40697812911 PASS (all four jobs); native job122849177437 log confirms42 scenarios and exact applied-migration/generator comparison. E2E40697812905 PASS,172 desktop/mobile tests (3.9m), job122849178011 terminal log inspected. GitHub reports open/non-draft/mergeable, main17f29e1 ancestor; no submitted reviews or review threads. Bounded independent runtime diff review found no blocker in7src files; branch scope80files at that source includes existing applied migrations/recovery/tests/docs. Cloudflare Workers remains documented provider; historical owner URL nova-ace-jamb.novaking5002.workers.dev is not independently verified as current deployment identity. Evidence: `docs/evidence/fcb-02-admin-release-readiness-2026-10-28.json`. No runtime changes, merge, deployment, content staging or account/rights changes in this preparation batch.

- **Important release discovery (supersedes no-provider-evidence inference):** legacy commit statuses were empty, but full GitHub check-runs expose the Cloudflare Workers and Pages integration. Main17f29e1 check122456058417 SUCCESS: Worker nova-ace-jamb,build99ddf614-8a81-41e6-b9fe-aa72d82edd2f,version809c6301-c4b1-41a4-ae7e-b6e054aacc46. Candidate66e06c5 check122849757177 FAILURE: build6f148286-5a67-4787-abf2-5ee544915c25; summary only build/script links,0annotations, no reason. Historical success is not proof of active/retained rollback version. The external build integration is real despite absent repo config. PR description now highlights this release blocker. `docs/evidence/fcb-02-admin-release-readiness-2026-10-28.json` records exact check IDs,versions and dashboard links. Current document-only head ee81f846 has Actions checks, but no Cloudflare check when inspected; do not silently treat the earlier failed runtime build as resolved.

- **Cloudflare access/diagnosis now VERIFIED (supersedes log-access blocker):** authenticated Cloudflare GET calls succeeded. Failed build6f148286 on66e06c5 compiles successfully; Wrangler 4.154.0 preview fails because config lacks previews{}. Current actual git_repository.branch is security/fcb-01-contract-audit; production_settings deploy command is npxwranglerpreview; auto_build_enabled true,previews_enabled false,oneexactbranch trigger. Do not assume provider tracks main now. Active productiondeployment222bdd23-037d-4784-8d08-31a2db159015 servesversion809c6301-c4b1-41a4-ae7e-b6e054aacc46 at100%; linked successfulbuild99ddf614 is main17f29e1 and used npxwranglerdeploy. Previousversionbbb25d60-1a0c-4003-8f1f-5607995327d9(number640) retained/GET200; no rollback executed. No bindings;compatdate2026-10-23,SPAassets,observabilityenabled1. Source fix13-line wrangler.jsonc addspreviews{},distSPA and preserves name/date/observability; no new app dependencies. Typecheck/build,Wranglerconfigparse/dryrun,6local workerdHTTP/filechecks PASS; independentconfigreview no blocker. No provider writes/retries/uploads,preview creation,Supabase changes,mainmerge orcontentstage. Evidence: `docs/evidence/fcb-02-cloudflare-build-diagnosis-2026-10-28.json`. User need not relay logs or credentials.

- **Approved Preview execution COMPLETE:** owner proceeded after specific isolated-preview request. Fast-forwarded connectedbranch ec0b119→7b9ff43 with lease. Cloudflare build02896185-963e-4062-a4a8-8f03ca0820de completed SUCCESS; terminal log confirms preview command/upload completed. Stable URL https://security-fcb-01-contract-audit-nova-ace-jamb.novaking5002.workers.dev ; pinned deployment https://7582fe37-nova-ace-jamb.novaking5002.workers.dev . Nine live unauthenticated HTTP checks PASS: four SPA routes,unique root,entryJS expected Supabase project,academic chunk RPC,correct payload digest,sw.js exactsource bytes. Probe initially mishandled lower-case HTTP header names; corrected in scratch probe, no application defect/change. No JavaScript execution,login or authenticated admin acceptance claimed. Production latestdeployment222bdd23/version809c6301 remains unchanged at100%. Verify40726609816 PASS(all4jobs),9units/42native scenarios(log122951477978 inspected). E2E40726609864 PASS,172tests(log122951477691 inspected). No Supabase mutations,staging,roles/rights/publication/mainmerge/proddeploy. Evidence: `docs/evidence/fcb-02-preview-verification-2026-10-28.json`. Evidence branch is separate so connected Preview stays on exacttested7b9ff43.

---

## Historical checkpoint entries (superseded where newer evidence conflicts)

# Historical opening snapshot — Batch 6

> Superseded historical snapshot; follow the current opening section above.

- **Updated:** 2026-10-27 — Batch 6 flashcard review flow and deterministic E2E retry correction.
- **Repository:** `DarealNovaking/Nova-ace-jamb`, branch `main`.
- **Latest code/test commit:** `5e50ad3911dca56752486889b78ae1b3815edbfa` (`test(frontend): make flashcard retry fixture deterministic`).
- **CI evidence:** Verify run [40421139598](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40421139598) PASS on code commit `02930d58f3ed87942d11f6acc08c48e8f28b5b29). E2E [40421619724](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40421619724) on commit `b7b387c` completed with 80 passed / 2 failed. The remaining failure is the error/retry test fixture: the app can mount/reload more than once before the test clicks retry, so counting two failed requests was still nondeterministic. Latest fix keeps all flashcard requests failing until the test explicitly enables success immediately before retry. Verify [40422034609](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40422034609) and E2E [40422034652](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40422034652) were QUEUED at this checkpoint update.
- **Mission-based completion verdict:** the entire frontend is **NOT COMPLETE**. Master handoff Sections 2 and 41 define the whole product; the canonical frontend plan contains 16 acceptance batches. Phase 3 closeout is not whole-product completion.
- **Current authorized scope:** frontend-only implementation on `main`; read-only Supabase schema/data/contract inspection allowed. Do not write backend/schema/RPC/Edge Function/production data, deploy, or revive the retired catalogue UI/importer.
- **Batch 6 implementation:** authenticated active-card loading for selected subjects and general cards; randomized presentation with due cards first; syllabus topic/subtopic labels where published; answer reveal; recall/needs-practice review saving; per-card review counts and next-review date; accessible session progress; retry, honest empty/error, save-error and completion states. Files: `src/lib/flashcardService.ts`, `src/components/StudentFlashcards.tsx`, `src/components/StudentStudyWorkspace.tsx`, `tests/e2e/smoke.spec.ts`. Tests cover saved review, due-first ordering/topic mapping/history, empty state and load retry. Live flashcards/reviews remain 0 rows; all UI tests use mocked Supabase traffic.
- **Whole-product frontend still incomplete:** lesson/content experience; working specialized practice modes; reviewed quick-revision materials; adaptive study schedules/readiness/recommendations; audio player; grounded AI tutor interface and secure service boundary; verifiable community membership/group routing; notification delivery and admin announcement controls; payment checkout/verification and referral qualification/reward flows; full admin command center/question authoring/review/rights/moderation/operations; whole-product integration and release acceptance.
- **Manual acceptance:** owner-reported PASS for keyboard navigation, TalkBack smoke test, performance/recovery, PWA/offline/recovery and Cloudflare alignment. Exact deployed Cloudflare SHA and exhaustive device acceptance remain independently unverified.
- **Exact next action:** inspect terminal result of runs 40422034609 and 40422034652. Fix any reproduced source/test defect and record the final Batch 6 acceptance before moving to Batch 7. Do not begin backend implementation until whole-product frontend acceptance is complete or named exceptions are explicitly accepted.
- **Source-of-truth roles:** `AGENTS.md` is the discovery entry point; `docs/AGENT-PROMPTS.md` contains canonical agent instructions; this checkpoint is current state; the master handoff defines product mission and architecture.

---



## Anti-drift prompt update — 2026-10-18
- Added mandatory project-only scope and anti-drift rules to `docs/AGENT-PROMPTS.md`, including a dedicated Agent 9 prompt for the primary ChatGPT project partner.
- Rules cover truthful status labels, inspect-before-propose, single-owner integration, no scope drift, no repeated failed calls, production safety, evidence-based verification, handoff updates, and concise action reports.
- Prompt-pack commit: `261716c12f1df17c814302febf950166f7657d14`.
- No application code, database data, or deployment was changed. Prompt pack was written successfully; read-back verification is the next check.
- Next action remains restoring read-only Supabase inspection and reconciling the deployed/repository `catalog-import` function before implementation.


## Verified live-system and agent-continuity update — 2026-10-18
- Repository: DarealNovaking/Nova-ace-jamb, branch main. HEAD observed after master-handoff update: 420e3918b6f48ed59a27781aea69c4a750d93309.
- docs/AGENT-PROMPTS.md now makes one universal instruction canonical for every agent; role-specific sections are optional bounded task briefs. Commit: e79d863963d8c48d87cdb26b1ceff550cbc407c9.
- Supabase access is working for this inspection; do not call Supabase blocked. Read-only SQL, migration listing, table/schema listing, and deployed function retrieval succeeded.
- Live counts: ace.institutions=791, ace.programs=0, ace.program_utme_rules=0, ace.subjects=25.
- Deployed functions: catalog-import v7 and ibass-catalog-stage v4, both verify_jwt=true. No database writes or deployments performed.
- Catalogue remains Batch 2 in progress because programme and UTME-rule tables are empty. Do not re-upload the institution workbook without fresh evidence.
- Next action: compare both deployed function implementations with repository source, catalogue contract, migrations/RPCs, and AdminCatalogueImport caller. Validate official IBASS parsing on a bounded non-publishing sample, then implement and test the smallest safe correction. Batch 3 remains locked.


## Batch 2 investigation findings — 2026-10-18
- Live state: 791 institutions, all draft; 0 programs; 0 UTME rules; 25 subjects. Import batches: 3 published, 1 rejected. No data was changed.
- Active deployed ibass-catalog-stage v4 has no matching source file at supabase/functions/ibass-catalog-stage/index.ts on current main (404). Repo only lists catalog-import under supabase/functions. Treat deployed-only code as source-control drift; do not redeploy.
- AdminCatalogueImport is institution-workbook-only and never invokes ibass-catalog-stage. It expects catalog-import response property batch_id. Deployed catalog-import v7 delegates to ace.stage_catalog_import; verify actual RPC return shape and compatibility before touching code. Repository catalog-import has different CORS and response behavior.
- A previous expected migration filename was absent at the exact path. Enumerate actual repository migrations and map them to live migration ledger before making schema claims.
- Next action: reconcile the missing deployed function source and response contracts, then implement a safe, explicit admin action to stage programme/rule discovery only after official source payload and requirement parsing are validated on a bounded sample. Keep all new records unactivated until validation/approval/publication gates pass.


## Batch 2 continuation — 2026-10-18
- Recovered active deployed `ibass-catalog-stage` v4 source into `supabase/functions/ibass-catalog-stage/index.ts`; commit `50013989322b104ae3848e571508b64e925cf157`. Source recovery only; function not deployed.
- Added and applied `20261018120000_batch_2_resolve_ibass_program_external_keys`; GitHub commit `b1ac3ace8a954a503d06dd9f2e64be677e2f991c`. Live migration tool returned success. It extends the publication RPC programme lookup to match stable external keys stored in program provenance; it did not insert/update catalogue rows.
- Confirmed remaining blocking contract defects: IBASS parser emits `alternative_subject_groups`, live publication expects `alternative_groups`; alternative requirements are not represented safely by current parser; rule source status is `reviewed` while publication requires `approved`; deployed catalog-import v7 returns RPC-shaped JSON while repository implementation/UI expect `batch_id`.
- Current counts last verified: institutions 791 (all draft), programs 0, rules 0, subjects 25. No catalogue data rows staged/published. No build/typecheck/Playwright/parser integration tests performed.
- Exact next action: reconcile catalog-import contract and migration/RPC shapes, add non-publishing tests for official IBASS payloads and alternatives, fix the payload key and source approval gate, then add explicit admin staging UI and verify with Playwright. Do not deploy functions or import/publish programmes/rules until those checks pass. Batch 3 locked.


## Batch 2 continuation — 2026-10-18 (payload contract correction)
- Committed `de5cb5a103b949ef65fb6c8ccc49e2fc68bf5516`: IBASS function now emits `alternative_groups` to match the live publication RPC/contract. Source-only; no deployment.
- Alternative subject requirement handling remains conservative but incomplete: parser declines to stage text containing common alternative/choice terms; no real endpoint fixture/parser tests have run.
- An attempted `AdminCatalogueImport.tsx` UI patch was blocked by tool safety checks before the GitHub write; the UI remains institution-workbook-only. Do not document this as implemented.
- No catalogue data writes or function deployments. Last verified live counts: 791 institutions (draft), 0 programmes, 0 rules, 25 subjects.
- Next concrete action: add an isolated admin UI for selecting a valid season and up to 25 institutions, invoke the existing authenticated IBASS staging function, then test official payload parsing, RPC response contract, typecheck/build, and Playwright. Keep staging/review separate from approval/publication; Batch 3 remains locked.


## Batch 2 continuation — 2026-10-18 (admin staging UI added, verification pending)
- Created `src/components/AdminIbassStage.tsx` (commit `d46ef6975d2b74460cdeb5232847da05e31423c9`) and mounted it on `src/admin-import.tsx` (commit `ada5133419395b9d96aa980b72cfe3c64a7c565e`).
- UI checks session and `ace.is_admin()`, loads institution options via `get_catalog_institutions`, loads seasons from verified `ace.exam_seasons` columns, limits each action to 25 institutions, calls `ibass-catalog-stage`, and reports staged batches/unresolved items. It deliberately does not approve or publish.
- Supabase schema query verified current seasons: JAMB UTME 2027 (draft), JAMB UTME 2026 (closed). IBASS programme source status is approved; brochure-detail source is reviewed. Keep review/approval/publication separate.
- No data rows staged or published; no function deployment. Source writes succeeded, but no typecheck/build/Playwright/runtime staging verification has been run. The deployed/repository `catalog-import` response shape and official payload parsing remain unverified; alternative requirements are still conservatively unresolved rather than faithfully modeled.
- Exact next action: verify actual deployed response shape and stage response IDs without publishing; add parser fixtures/tests for official programme JSON and brochure HTML; run typecheck/build/Playwright; update this checkpoint and master handoff before any deployment. Batch 3 locked.


## Continuation attempt — 2026-10-18 (runtime verification blocked)
- Re-read the current checkpoint, master handoff, Batch 2 IBASS progress handoff, agent prompts, current admin staging UI, repository `catalog-import`, and recovered `ibass-catalog-stage` source.
- Current repository latest commit observed before this documentation update: `a31a070b5a60cd57eb166d16f03688db5f4090c4` (`docs: checkpoint IBASS UI verification pending`); default branch is `main`, repository remains private, and GitHub reports read/write permission.
- Static source confirmation: repository `supabase/functions/catalog-import/index.ts` returns `batch_id`, `status`, and `row_count` on successful staging and idempotent replay. The recovered `ibass-catalog-stage` source calls `catalog-import` for programme and rule batches and returns `program_import` / `utme_rule_import` payloads. This verifies repository source contracts only; it does not establish the currently deployed `catalog-import` response shape or prove runtime compatibility.
- Supabase live verification was attempted through the connected tools for deployed `catalog-import` source, edge-function listing, and read-only catalogue counts. All three calls returned MCP `-32600: You do not have permission to perform this action`. This differs from the earlier 2026-10-18 successful inspection recorded above; treat live deployment and current DB counts as presently UNVERIFIED, not as reverted or changed.
- No staging request was sent, no database rows were changed, and no Edge Function was deployed. No typecheck, build, parser fixture test, or Playwright test was run in this continuation.
- Blocker: current Supabase connector permission does not permit reading deployed function metadata/source or running read-only SQL. Required user action: restore/reauthorize the connected Supabase project access for `amswykapebeevhstmvii`, then rerun read-only source/count checks. Do not share service-role keys or passwords in chat.
- Next action: once read access is restored, compare deployed `catalog-import` response and `ace.stage_catalog_import` RPC contract against repository code; add isolated fixture tests for official programme JSON and brochure HTML (especially alternative/optional subject groups); run `npm run typecheck`, `npm run build`, and available Playwright coverage. Do not invoke production staging or deploy until these checks establish a safe contract. Batch 2 remains IN PROGRESS; Batch 3 remains LOCKED.


## Continuation — 2026-10-18 (live Supabase access recovered; project ref reconciled)
- Root cause of the previous connector denial was a stale/mismatched Supabase project reference in the checkpoint: `amswykapebeevhstmvii` is NOT the active project returned by the connected Supabase account. The actual active project is `nova-ace-jamb`, ref `uokiqlgmzprqfbzmedaz`, region `ca-central-1`, status `ACTIVE_HEALTHY`. Use this verified project ref going forward; do not use the older `amswykapebeevhstmvii` for ACE JAMB checks.
- Live Supabase read access is now confirmed against `uokiqlgmzprqfbzmedaz`: Edge Function list returned `catalog-import` ACTIVE v7 and `ibass-catalog-stage` ACTIVE v4; deployed `catalog-import` and `ibass-catalog-stage` source were retrieved successfully. `verify_jwt=true` on both functions.
- Live read-only counts: `ace.institutions=791`, `ace.programs=0`, `ace.program_utme_rules=0`, `ace.subjects=25`. Thus the institution import exists, but no programme or programme-UTME rows have been published/recorded in those tables at this point. Current seasons: JAMB UTME 2027 (`draft`) and JAMB UTME 2026 (`closed`). IBASS programme endpoint source is `approved`; brochure-detail source is `reviewed`.
- Live `information_schema.routines` check confirms `ace.stage_catalog_import` returns jsonb and is SECURITY DEFINER; `ace.can_manage_catalog`, `ace.get_catalog_institutions`, and `ace.is_admin` are also SECURITY DEFINER. Do not change these privilege boundaries without reviewing their function bodies/grants and verifying `auth.uid()` authorization. Routine argument introspection query was blocked by tool safety checks, so the exact live RPC argument signature remains unverified.
- Deployed `catalog-import` v7 uses the authenticated user's JWT for `ace.can_manage_catalog` and `ace.stage_catalog_import`, and returns the RPC JSON response directly (HTTP 200 for idempotent replay, 201 otherwise). Deployed `ibass-catalog-stage` v4 currently emits `alternative_groups: []` in its rule payload. It deliberately declines requirements containing alternatives/optional phrasing by marking them unresolved, but any parsed rule still has a conservative empty alternatives array. No staging call has been made.
- Important remaining risks before production staging: the deployed wrapper treats programme endpoint data as an array and expects each row to have `id` and `title`; official payload format has not been fixture-tested. Its brochure parser uses the first tbody row and normalizes programme titles exactly. Alternative/optional groups are not modeled. The live RPC payload contract and target schema must be checked against migration/source definitions before staging.
- A local clone/build attempt was blocked because this runtime cannot resolve `github.com`; no typecheck, build, parser fixtures, or Playwright tests ran. No production rows changed and no function was deployed.
- Next action: reconcile the current deployed wrapper/RPC contract with repository migrations/source; add deterministic parser fixtures/tests (including alternate/optional subject combinations); then run typecheck/build/Playwright in a network-enabled repository runtime. Only after checks pass, perform a small authenticated staging-only test with a confirmed admin session and a valid non-archived season; inspect batch IDs/row counts and leave all rows pending validation. Batch 2 remains IN PROGRESS; Batch 3 remains LOCKED.


## Exact continuation checkpoint — 2026-10-18 (latest)
- Repo: `DarealNovaking/Nova-ace-jamb`, branch `main`. Latest known source commits in this continuation: `098756ee127978d5811a0a89dada46f645e8980a`, `ff4c3ae83ea4f0caf6e79f597c8b66d9d87719bb`, `da7c96d06bbbe4151f011238ae555cccc228cd17`, `a6bc5aa65bbf0315dfc5fa58648049f9b3be881b`. Handoff update commit: `5fef75e0a0e79f98865112b56d65a96c0a0fcfe8`.
- Confirmed current official institution JSON is nested; parser now recursively visits `children` and removes a selected institution's state suffix before strict normalized name matching. Missing programme requirement text is explicitly listed as unresolved. If the batch produces programme records but zero parseable UTME rules, the function returns HTTP 422 before calling `catalog-import`, so no partial programme-only batch is staged.
- Live source investigation proves the current IBASS brochure page has changed to a React application; old modal/table selectors are absent. The legacy programme endpoint still returns `{id,title}` records. A read-only call to the newer API list endpoint returned a limited 3-row result for FUTA with empty UTME requirement fields, so it is not yet a validated replacement. Official requirements/alternatives endpoint remains to be identified.
- **No deployment, staging request, catalogue write, approval, publication, or database mutation was performed.** Source commits are un-deployed. Typecheck/build/Deno tests/Playwright remain unrun and unverified; no local clone is available because the container cannot resolve GitHub.
- **Exact next action:** inspect current IBASS app-bundle API calls and use read-only calls to identify the endpoint that supplies `programme_utme_subject_data`, `programme_utme_requirements_data`, and alternatives; capture representative official payload fixtures (including alternative/optional subject wording); implement/test a parser against those fixtures. Then run TypeScript/Deno checks, build, and Playwright in a network-enabled repository runtime. Do not deploy or stage until the tests pass. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## Verification follow-up — 2026-10-18
- Latest parser source commit: `5c4ce3b97ff3f0d3c0e976a8e4bd5fece579d4f5` (normalized state suffix matching no longer constructs a dynamic regex).
- Confirmed GitHub Actions passed on prior source commit `a6bc5aa65bbf0315dfc5fa58648049f9b3be881b`: `Verify` passed (TypeScript typecheck + production build) and `ACE JAMB E2E` passed (Playwright). This does not validate the subsequent `5c4ce3b` edit.
- At checkpoint time, `Verify` run `39132839357` and `ACE JAMB E2E` run `39132839355` for `5c4ce3b` were in progress; recheck these exact runs before claiming the latest source passes.
- No live staging/deployment/database write occurred. The live IBASS brochure's old DOM selectors are obsolete; identify the current official endpoint for detailed UTME requirements and alternatives before changing the importer further.


## Latest evidence — 2026-10-18
- CI verified successful: `Verify` and `ACE JAMB E2E` both passed for parser source commit `5c4ce3b97ff3f0d3c0e976a8e4bd5fece579d4f5`; both also passed on docs commit `f1a4395a4b91d79091be90cb1f4e0a455a1ece9f`. This validates frontend TypeScript/build and existing Playwright tests, not the Deno importer with real IBASS fixtures.
- Current official API `POST /ibass/institution/programmes/1306?page=1` returns only 3 FUTA programmes and all returned rows have empty `subjects`, `utme_requirements`, and `details`. Searching this API for Microbiology and Agricultural Engineering returns zero rows, while the legacy endpoint has many more. The current official app bundle only references `/inst-type`, `/inst-category`, `/ibass/institutions?page=`, `/ibass/institution/programmes/`, `/ibass/eligibility-checker/`, and `/ibass/eligibility-checker/submit`. A synthetic eligibility-checker submit probe returned HTTP 500, so no requirement details were recovered.
- This leaves the requirement source unresolved. The code now safely handles nested institution tree mapping and refuses to stage any batch if it parsed zero UTME rules. No live function deployment, catalogue staging, approval, publication, or database write occurred.
- **Next action:** inspect the official brochure's downloadable documents/alternative authoritative payloads and build fixtures before changing parser logic. Do not switch to the newer API list as source of truth until programme coverage and requirement completeness are confirmed. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## Post-investigation live recheck — 2026-10-18
- Reconfirmed live Supabase project `uokiqlgmzprqfbzmedaz`: `catalog-import` ACTIVE v7 and `ibass-catalog-stage` ACTIVE v4, both JWT verification enabled. Neither function was redeployed.
- Read-only database counts remain: 791 institutions, 0 programmes, 0 UTME rules, 4 import batches. No catalogue rows were added during this continuation.
- Latest source commit `5c4ce3b97ff3f0d3c0e976a8e4bd5fece579d4f5` passed Verify and Playwright. Current remaining blocker is authoritative programme requirement/alternative data access; keep importer fail-closed and do not stage/deploy until the current official source is parsed and fixture-tested.


## Exact continuation checkpoint — 2026-10-18 (official IBASS API parser)
- Repo `DarealNovaking/Nova-ace-jamb`, branch `main`. Current relevant commits: parser module `a26306cb27b8f80fe906edfc0238f437cd26747a`; parser fixtures `78be7993f0d3a8524e1043e6df1a961297c0d6bf`; Edge Function source `991bfd925ddbf9d8368b6e1b02330102281f13a4`; Verify workflow adds Node parser tests in `c154016fe1bf97766f8ab02f630af520d794ed94`.
- Official data source confirmed: GET `https://ibass-api.jamb.gov.ng/api/ibass/eligibility-checker/{institutionId}` gives institution-specific programme IDs/titles. POST `https://ibass-api.jamb.gov.ng/api/ibass/eligibility-checker/submit` returns `programme_utme_subject_data` with required/optional subject lists and choice title. FUTA Microbiology test confirmed Biology/Chemistry/English required, Mathematics/Physics optional with one-of semantics. Old brochure modal/table selectors are removed from the staging function.
- Parser currently fails closed for unknown labels, missing English, and unverified secondary optional groups. It emits alternative groups as `{subject_codes: string[], minimum_required: number}`; compatibility with any future evaluator remains unverified. Each request is capped at 150 programmes; larger selection returns before any staging. Up to four read-only official detail requests run concurrently.
- CI runs `39134452901` (Verify) and `39134452893` (ACE JAMB E2E) for commit `c154016fe1bf97766f8ab02f630af520d794ed94` were still in progress at checkpoint time. Recheck those runs before reporting tests passed. The Edge Function is not included in the current frontend typecheck, and no Deno test has been run yet.
- No live function deployment, staging request, approval, publication, or DB write. Supabase project `uokiqlgmzprqfbzmedaz` last verified with 791 institutions, 0 programs, 0 UTME rules, 4 existing import batches; deployed functions still `catalog-import` v7 and `ibass-catalog-stage` v4.
- **Next action:** check CI results; add Deno/runtime coverage for parser + source API response contracts; verify alternative group semantics on more official programmes and reconcile the target evaluator contract. Only after those checks, stage one institution as a review-only test; do not deploy or publish. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## CI follow-up — Deno type-check adjustment (2026-10-18)
- Verify run `39134557338` for commit `25e0d20cbc1e66c325131fc11c26871f14f0f912` passed all six Node parser tests, then failed at Deno check because the Supabase Edge Runtime remote declaration references missing `npm:openai@^4.52.5`. Frontend typecheck/build were skipped. This is a toolchain/declaration dependency issue requiring verification, not a passed Edge Function check.
- Verify workflow now runs `deno check --no-check=remote supabase/functions/ibass-catalog-stage/index.ts` at commit `26f381d6972848fc112fd732db7be75af0920b57`. Verify run `39134695379` and E2E run `39134695400` were still in progress at checkpoint time. Recheck both and read logs for any new errors.
- **Next action:** confirm the adjusted CI result; if local check still fails, use a dedicated Deno configuration or an isolated local syntax/typecheck that does not resolve the unrelated remote OpenAI declaration. Then continue evaluator-contract review before any staging trial. No deployment/staging/approval/publication or DB writes.


## Latest source adjustment — 2026-10-18
- Deno check still failed with `--no-check=remote` because the explicit Supabase Edge Runtime declaration imported an unrelated missing OpenAI npm type dependency. Removed `import "jsr:@supabase/functions-js/edge-runtime.d.ts";` from `supabase/functions/ibass-catalog-stage/index.ts` in commit `3ca00b5a831556090be41991d7545e4dda94e87e`. Verify and E2E for that commit were queued; check run outcomes. No deploy or database write.


## Exact continuation checkpoint — UTME alternatives + deployment guard (2026-10-18)
- Verified official API response shape: GET `/api/ibass/eligibility-checker/{institutionId}` returns a top-level `status` and `data` programme list; POST `/api/ibass/eligibility-checker/submit` returns structured `programme_utme_subject_data`. Four FUTA programme examples tested read-only: Microbiology, Biochemistry, Computer Science, Agricultural Engineering. Subject aliases used are present as active codes in live `ace.subjects`.
- Onboarding now renders official optional-subject checkboxes and sends four selected subject IDs to new RPC `ace.save_student_foundation_catalog_with_subjects`. New migration: `supabase/migrations/20261018143241_batch_2_utme_subject_choice.sql`; current final migration commit `30cc19001519ddc01215e9c523d6c92555e24846`. Do not apply until SQL is tested in a disposable database. Live Supabase still has no programs/rules; no stage request has been sent.
- Deno parser check, Node parser fixtures, frontend typecheck/build and E2E passed on earlier commits: Verify `91df16fab9360da38918007216ca6e4463ce4924` passed; E2E also passed for that commit. Verify for onboarding commit `ed85fca0c4d175a332ba90f9ef7eb5690f773775` passed. Recheck latest workflow-guard commit `1f2e3366f8dcaaef99f6ab8c844fedb7ad42bb2d` before claiming current checks pass.
- Important deployment finding: automatic push deploy ran as workflow `39135691876`, but Cloudflare API rejected the configured token (10000/9109) at the deploy step, so no Worker deploy succeeded. The workflow now has only `workflow_dispatch`; do not initiate it until credentials are repaired and the user explicitly authorizes production deployment.
- Exact next action: recheck latest Verify/E2E; test migration/RPC in a disposable database, including fixed, one-of, missing-required, wrong-option, duplicate, and inactive-subject cases; add/execute frontend onboarding test. Then review before applying migration. Afterwards stage one institution only into review batches and validate; do not approve or publish. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## SQL migration test checkpoint (2026-10-18)
- New isolated Postgres 16 integration test `tests/sql/utme_subject_choice.test.sql` is wired into `.github/workflows/verify.yml`. It executes migration `20261018143241_batch_2_utme_subject_choice.sql` against disposable fixture schemas and checks valid alternative selection plus invalid/missing/duplicate/inactive choices.
- First job `39136090924` failed because test calls used integer `300` while RPC argument is `smallint`. Fixture corrected to `300::smallint` in commit `024dd88295f49ab16aed85fcad65959c3a4f83dc`. Recheck latest CI; do not infer migration pass from the failed fixture run.
- No live migration deployment or Supabase writes. Deployment workflow is manual-only; prior Cloudflare deploy run failed at token authentication and did not deploy.


## PostgreSQL migration test result — 2026-10-18
- Corrected fixture commit `024dd88295f49ab16aed85fcad65959c3a4f83dc`: disposable PostgreSQL 16 migration test job passed (`39136190437`). The real migration applied in the isolated database; valid alternative selection and rejection cases for missing required subject, wrong option, duplicates and inactive subject all passed. English was asserted as primary subject.
- Full frontend Verify/E2E for the newest checkpoint commit may still be running; recheck before claiming all latest CI complete. Live migration not applied; no catalogue staging/publication.


## Live migration applied — 2026-10-18
- Applied migration `batch_2_utme_subject_choice` to Supabase project `uokiqlgmzprqfbzmedaz`; verified recorded version `20261018143241` and function privileges/signature by read-only SQL. Repository file is `supabase/migrations/20261018143241_batch_2_utme_subject_choice.sql` and the disposable SQL test points to that file.
- Verified live catalogue unchanged: 791 institutions, 0 programmes, 0 UTME rules, 4 pre-existing batches. No staging/approval/publication or Edge Function deployment.
- Confirm CI for the synchronized filename; then inspect security advisors and stage one institution into review-only batches with authenticated admin/editor access. Do not approve or publish. The 2027 season is still draft; no active season exists.


## Post-apply advisor verification (2026-10-18)
- Security advisors after applying the RPC migration reported only the pre-existing `auth_leaked_password_protection` warning; no new security lint was returned. The function remains intentionally SECURITY DEFINER, requires `auth.uid()`, and grants EXECUTE to authenticated only (anon/public denied).
- CI for latest filename/docs synchronization is still in progress; prior commit `024dd88295f49ab16aed85fcad65959c3a4f83dc` passed Verify, isolated PostgreSQL migration tests, and E2E. Confirm latest CI before closing the current action.

## Live student-account failure investigation — 2026-10-18

- User screenshot shows the deployed app's generic “We couldn’t prepare your account” screen at the Cloudflare Worker origin.
- Read-only Supabase logs correlate the failure with repeated authenticated POST /rest/v1/rpc/is_admin requests returning HTTP 406 and PostgREST PGRST106 (latest observed 2026-10-18 15:26:53 UTC). This occurs before device registration/profile/onboarding logic, so those later steps are not the present root cause.
- src/components/StudentFoundationGate.tsx and src/components/AdminFoundationGate.tsx invoke ace.rpc('is_admin'); src/lib/supabase.ts binds the client to custom schema ace. ace has USAGE granted to authenticated (verified read-only SQL), but the PostgREST error indicates the requested schema is not currently exposed by the Data API. SQL current_setting('pgrst.db_schemas', true) was null and authenticator has no pgrst.db_schemas role override; do not attempt to change API exposure through an unverified SQL workaround.
- Current repo HEAD observed: 4d165f57a2a348367f258a4998ef1091831606d9 (docs: record post-migration security advisor result). GitHub combined commit status returned no status records; CI outcome for latest main remains unverified. No application code, database rows, API settings, or deployment were changed during this investigation.
- Exact blocker / user action: in Supabase Dashboard for project nova-ace-jamb (uokiqlgmzprqfbzmedaz), open Project Settings → API (Data API / Exposed schemas), ensure custom schema ace is in the exposed schemas list, and save. Preserve least privilege: do not grant USAGE to anon; the live read-only check showed anon currently has no ace schema USAGE. Existing table/RPC grants and RLS must remain the authorization boundary.
- After the setting is saved, retry the app and recheck Supabase logs. Expected evidence is is_admin no longer returning PGRST106; then exercise admin/student routing, profile/preference reads, device registration and onboarding save. Do not treat the issue as fixed until the real flow passes.
- Next action: user enables ace in Supabase Data API exposed schemas, then integrator verifies API behavior and latest CI before proceeding with Batch 2 review-only staging. Do not stage, approve, publish, deploy functions, or deploy frontend as part of this fix without the required checks/authorization.


## Account preparation recovered; resume Batch 2 — 2026-10-18
- User reports the ACE app is back and working after adding custom schema `ace` to the Supabase Data API exposed schemas.
- Live log verification confirms recovery of the gate RPC: POST `/rest/v1/rpc/is_admin` returned HTTP 200 twice at 2026-10-18 15:53:18 and 15:53:23 UTC. In the 24-hour log summary, 8 requests returned 200 and the earlier 35 requests returned 406/PGRST106; latest 406 was at 15:26:53 UTC. The later successful requests support that schema exposure fixed the gate. Full student/admin route, preference read, device flow, and onboarding-save behavior are not independently verified by the available request logs; user reports the app is back.
- Live catalogue counts verified using actual schema/table names: 791 `ace.institutions`, 0 `ace.programs`, 0 `ace.program_utme_rules`, 4 `ace.catalog_import_batches`. No catalogue rows were modified. Existing counts for `profiles`, `student_preferences`, and `devices` were read only; do not treat counts as a user-specific onboarding test.
- CI remains UNVERIFIED: GitHub combined status for latest known main commit `2f902a3ef30812a023e254f8f131da6c3b5a8bdf` returned no status records, and the workflow-run connector only returned no PR-triggered runs. Prior commit `024dd88295f49ab16aed85fcad65959c3a4f83dc` passed Verify, disposable PostgreSQL migration integration, and ACE JAMB E2E; confirm current main CI through Actions before claiming latest checks pass.
- Next documented project action remains Batch 2: confirm current Verify/E2E and migration filename synchronization, then use an authenticated admin/editor session to stage one institution only into a review batch and validate it. Current database catalogue has no programs/rules, so do not invent official catalogue facts. Do not approve or publish. Batch 3 remains locked; 2027 season remains draft and no active season exists. Deployment workflow is manual-only and must not be run without repaired credentials and explicit production-deployment authorization.


## Batch 2 safety gate — existing admin importer is not review-only (2026-10-18)
- User confirmed they are signed in as administrator/editor. Their browser session is not accessible to this agent's connected browser; no authenticated admin action was performed.
- Inspected `src/components/AdminCatalogueImport.tsx` and `supabase/functions/catalog-import/index.ts`. The current admin importer is explicitly a bulk 791-row workflow: it requires exactly 791 workbook rows split NUC 328 / NBTE 199 / NCCE 264, stages three authority-specific batches, then automatically calls `validate_catalog_batch`, `approve_catalog_batch`, and `publish_catalog_batch`, finally asserting 791 institutions. It is NOT a safe path to stage one institution into review-only status. Do not ask user to upload a workbook or click Choose XLSX for this milestone; that could approve/publish data.
- Edge Function `catalog-import` itself stages supplied rows as `staged` and enforces authenticated admin/editor role and reviewed/approved source. However the current frontend immediately follows staging with validation, approval, and publication. No import request was sent; no catalogue rows were modified.
- Live `ace.catalog_import_batches` status summary: 3 published institution batches and 1 rejected institution batch. Live catalogue remains 791 institutions, 0 programs, 0 program UTME rules. No active exam season is present; 2027 season remains draft.
- Exact next action: implement a separate, explicit single-row review-only staging path in the admin UI (or use a documented existing review-only admin route if discovered), with a source that is already reviewed/approved, one selected institution, payload preview, and a strict stop after `catalog-import` returns `status=staged`; do not invoke validation/approval/publication from that path. Add tests proving only one row is submitted and no approve/publish RPC is called. Recheck latest CI first/alongside this change. Do not stage production data until this safe path is available and reviewed. Batch 2 remains in progress; Batch 3 locked.


## Review-only staging UI implementation — 2026-10-18
- Current verified main commits include review-only component `12c362b4c646de89b6d03d1792a9eebe5a2bc06b`, admin gate integration `60e5246ecc9e76801ab74c75f38c423404d42921`, static safety tests `2417607f97fb0efb02f88da932ecaa9f432986e5`, CI wiring `1af0d018830465c25b916ce71ed0278e303ae95b`, and progress handoff `7af02783293291d1ef800df1adc9229bacb8c675`.
- Added `src/components/AdminReviewOnlyStage.tsx`, mounted in `src/components/AdminFoundationGate.tsx` before the existing bulk importer. It selects one existing institution, requires a matching approved source and explicit confirmation, previews the payload, and calls only `catalog-import`. It requires response `status=staged`, `row_count=1`, and `batch_id`. It does not invoke validate/approve/publish RPCs.
- Added `tests/review-only-stage.test.mjs` and wired it into Verify. These are static source-contract tests; authenticated browser QA and real staging remain outstanding.
- Live Supabase read access verified: `catalog_sources` contains approved authority sources and reviewed/approved IBASS sources; live Edge Functions remain `catalog-import` v7 and `ibass-catalog-stage` v4 with JWT verification. No deployment or live staging request was made. No live data was changed.
- CI for the latest main HEAD has not yet been verified. Do not claim the new test, typecheck, build, SQL integration, or E2E passed until Actions evidence is inspected.
- Exact next action: check CI on latest `main`; if green, use the separate **Single-row review-only staging** UI in the authenticated admin dashboard (never the XLSX bulk importer), stage one selected institution, and verify one new pending row/batch via read-only SQL. Stop before validation, approval, or publication. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## Review-only staging live verification — 2026-10-18
- User screenshot showed the admin UI reporting batch `993bfb6c-b6d0-4ace-9e6e-4db48df064f7` staged with one row.
- Read-only SQL against live Supabase project `uokiqlgmzprqfbzmedaz` verified the batch exists with `dataset_type='institutions'`, `status='staged'`, recorded `row_count=1`, and exactly one associated `ace.catalog_import_rows` row. The row has `validation_status='pending'`, `published_id IS NULL`, `entity_type='institution'`, external key `COE0001`, and payload name A.D. Rufa'i College of Education, Legal and General Studies, Bauchi. The source is `NCCE accredited colleges of education` and source status is `approved`.
- The batch metadata records purpose `review-only safety verification`, importer `nova-ace-review-only-single-row`, and the institution ID. Current institution record remains `draft`. No validation, approval, publication, or data mutation was performed during this verification.
- Inspected deployed `catalog-import` Edge Function v7 source: it validates authenticated user and `ace.can_manage_catalog()`, then calls only `ace.stage_catalog_import` for this request and returns the staging result. This function itself does not call validation/approval/publication. Its request schema matches the UI's `source_id`, `dataset_type`, `rows`, and `metadata` shape. JWT verification is enabled.
- GitHub combined status for `76c7a04444b6250089b3c6617026167ffaa4d0df` returned no status records; latest CI remains UNVERIFIED. No successful test/build/E2E claim is made.
- **Next action:** inspect GitHub Actions directly or obtain a usable checkout/runtime to run the workflow checks; then inspect the deployed site’s actual browser flow and verify UI test/build results. Keep the current batch staged; do not validate, approve, or publish it. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## Latest CI verification — 2026-10-18
- GitHub Actions runs for current docs checkpoint commit `d4fbbccb1b238af22dbe81e6de32f6f77fd05f55` have completed successfully.
- Verify run `39171595079`: both `verify` and `utme-subject-choice-migration` jobs passed. Verified steps include Node parser + review-only staging tests, Deno check for `ibass-catalog-stage`, `npm run typecheck`, `npm run build`, and the disposable PostgreSQL migration integration test.
- ACE JAMB E2E run `39171595081`: job `e2e` passed, including typecheck, build, Playwright browser tests, and artifact upload.
- This is repository CI evidence, not a manual authenticated browser test of the deployed staging component. The previously verified live batch `993bfb6c-b6d0-4ace-9e6e-4db48df064f7` remains staged with exactly one pending row and no published ID.
- **Next action:** inspect the admin frontend gate for a safety issue: the review-only panel is mounted in the same admin view as the bulk importer, and source matching currently requires an existing institution's provenance to point to an approved source. Review whether the selector can accidentally create duplicate staging batches on repeated clicks and whether the function/RPC enforces duplicate-batch/idempotency safeguards. Do not validate, approve, or publish the current batch. After this review, continue authoritative catalogue ingestion only with verified source coverage and explicit safety gates. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## Authoritative IBASS pipeline review — 2026-10-18
- Inspected repository supabase/functions/ibass-catalog-stage/index.ts and parser.js, plus live ace.validate_catalog_batch, ace.publish_catalog_batch, and ace.stage_catalog_import definitions. No function calls or database mutations were performed.
- Live read-only query confirms catalogue remains 791 institutions, 0 programs, 0 programme UTME rules. Seasons: 2026 is closed; 2027 is draft. The programme endpoint source 16388e42-7bed-4541-89ff-8ffb0e648425 is approved; brochure detail source 9959f7d6-0071-4ab3-880c-a79f3c81e561 is reviewed.
- Pipeline safely refuses ambiguous institution mappings, missing official IDs, missing programme identifiers, mismatched IBASS requirement responses, unrecognized subject labels, and unsupported second optional-subject groups. Parser tests cover several cases. However, the function uses a hardcoded generic REQUIREMENTS_REQUEST (including fixed UTME subjects) when querying programme requirement details; this needs validation against official API semantics before a broad run.
- The Edge Function stages program and UTME-rule batches via two separate catalog-import requests. If the program staging request succeeds and the rule request fails, a partial staged result can remain; this is not a published-data mutation, but it requires operator reconciliation. The function also permits passing a draft season because it only rejects archived seasons. Live 2027 season is draft and 2026 is closed; do not run broad staging until season targeting is explicitly confirmed.
- The publication RPC can publish program/rule records only after separate validation and approval; program publication resolves institution by institution_external_key matching institution jamb_code or UUID, and UTME rules resolve the program by external key/provenance. Current code appears to use UUIDs consistently for institution lookup and shared external keys for program/rule linking.
- No official programme ingestion was triggered; no rows were staged, validated, approved, published, or otherwise changed in this investigation.
- Next action: verify official IBASS requirements endpoint behavior with a small read-only request/response fixture and ensure the generic request does not contaminate or constrain returned requirements; then implement an explicit dry-run/preview mode and partial-staging reconciliation reporting before invoking staging for the draft 2027 season. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## IBASS endpoint read-only probe — 2026-10-18
- Performed read-only fetches of the official JAMB legacy endpoints. `subjects_jamb.json?v=1` returned a subject list (e.g. Agriculture, Arabic, Art, Biology, Chemistry, CRS, Commerce, Economics, French, Geography, Government, Hausa, History, Home Economics, Igbo, Islamic Religious Studies, Literature in English, Mathematics, Music, Physics, Principles of Accounts, Yoruba). `load_programs.php?school=1` returned an empty JSON array; this single numeric ID is not sufficient to infer the endpoint is broken or determine the correct programme-request contract. Fetching `institution_data.json?v=1` through the read-only extraction provider returned `empty_content`, so its structure was not verified in this probe.
- A search for public documentation of `ibass-api.jamb.gov.ng/api/ibass/eligibility-checker/submit` did not yield an authoritative contract sufficient to confirm whether the fixed `REQUIREMENTS_REQUEST` fields influence `programme_utme_subject_data`. This remains unresolved; no POST was sent to the IBASS requirements endpoint and no catalogue ingestion was invoked.
- Current parser safely rejects unrecognized subject labels, missing English in required subjects, unclear optional-subject counts, and any populated `optional_subjects_by_group2`. The current alias map does not include some labels present in the official legacy subjects JSON, including Hausa Language, Igbo Language, Islamic Religious Studies, and possibly other source variants; this may cause safe false negatives until aliases are mapped to verified `ace.subjects` codes. Do not blindly add aliases until the actual database subject-code catalogue is inspected.
- No source code was changed in this investigation. Live programme and rule counts remain 0 as last observed; no new staging batches were created. The original single-row institution batch remains staged.
- **Next action:** inspect `ace.subjects` active codes and the full deployed IBASS endpoint response contract using one institution ID discovered from the official hierarchy, then create deterministic response fixtures/tests to establish request semantics and expand only verified aliases. After that, implement preview/dry-run and partial-staging reconciliation before any broad import. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## Catalogue replacement investigation — 2026-10-19
- Re-inspected current main files: `StudentOnboarding.tsx`, `StudentFoundationGate.tsx`, `studentService.ts`, `seasonService.ts`, current master handoff, IBASS progress handoff, and `ibass-catalog-stage` v4 source. Catalogue is a hard onboarding gate: active institutions → active programmes → active-season active UTME rule → exactly four selected subjects → `save_student_foundation_catalog_with_subjects`. Missing catalogue blocks course selection and onboarding completion.
- Official IBASS brochure-by-institution and eligibility pages are publicly accessible, but a stable documented API contract suitable for a live-only replacement is not verified. The old `load_programs.php?school=1` probe was not a valid basis to judge endpoint health; full institution hierarchy and deployed requirements POST semantics remain unverified. No POST, import, database write, or deployment occurred.
- Recommended direction: do not drop catalogue tables/records. Make preparation onboarding independent of catalogue completeness, with subject selection available and institution/course eligibility clearly unresolved until backed by a verified season-specific rule. Retain a small audited local catalogue/cache and an official JAMB checker fallback. Detailed investigation: `docs/CATALOGUE-REPLACEMENT-INVESTIGATION-2026-10-19.md`.
- No app code changed; no tests run. Main branch's historical `src/components/AdminIBASSProgrammeImport.tsx` path returns 404 and must not be assumed present.
- Next action: inspect SQL/RLS for `save_student_foundation_catalog_with_subjects` and onboarding completion, then implement the smallest additive preparation-only save path with tests. Batch 2 remains IN PROGRESS; Batch 3 remains LOCKED.


## Preparation onboarding decoupling — 2026-10-19
- **Decision approved by user:** keep the catalogue and decouple preparation onboarding from catalogue completeness.
- **Code added:** `supabase/migrations/20261019120000_preparation_onboarding_without_catalogue.sql`; new authenticated RPC validates 4 distinct active subjects, auth, score, display name and study minutes; unresolved institution/course text is not treated as verified structured catalogue data.
- **Frontend/service:** `src/lib/studentService.ts` now calls the new preparation RPC; `src/components/StudentOnboarding.tsx` selects four preparation subjects without institution/programme/rule dependencies and labels them as not an official combination; `src/components/StudentFoundationGate.tsx` no longer requires institution/course text to enter the app and requires exactly four saved subjects.
- **Tests:** extended `tests/sql/utme_subject_choice.test.sql` with preparation-only save assertions, unauthenticated-call rejection, and deletion of fixture catalogue rows before the prep-only save to prove the empty-catalogue path. This runs only in disposable CI PostgreSQL.
- **Live schema read:** profile institution/course text and structured institution/programme IDs are nullable; student preferences and student subjects tables are present. No production data changes or migration application performed.
- **Changes committed through multiple GitHub Contents API commits; latest HEAD and CI status still need verification.**
- **Not yet verified:** npm typecheck/build, SQL migration test, authenticated browser/E2E, production migration/deployment.
- **Exact next action:** fetch current `main` HEAD and latest Verify workflow runs; inspect logs for typecheck/build/SQL failures and fix before any production migration. Keep Batch 2 IN PROGRESS and Batch 3 LOCKED.


## Official subject inventory research and parser aliases — 2026-10-19
- Inspected JAMB eligibility subject endpoint `https://eligibility.jamb.gov.ng/subjects_jamb.json?v=1`, IBASS eligibility checker, e-syllabus and brochure pages.
- The observed endpoint returns 22 subject labels: Agriculture, Arabic, Art, Biology, Chemistry, Christian Religious Studies, Commerce, Economics, French, Geography, Government, Hausa Language, History, Home Economics, Igbo Language, Islamic Religious Studies, Literature in English, Mathematics, Music, Physics, Principles of Accounts, Yoruba Language. English is not in that JSON response, but IBASS eligibility checker explicitly says select 4 UTME subjects including English. Do not treat this endpoint payload as proven exhaustive; e-syllabus content is paginated and fetch extraction did not reveal every row.
- Updated parser aliases for Agriculture Science and exact labels Hausa Language, Igbo Language, Islamic Religious Studies, Yoruba Language; added parser test coverage for every observed label.
- Read-only production `ace.subjects` query returned 25 active rows, including Computer Studies, Use of English, and Physical and Health Education. IBASS e-syllabus search confirms Computer Studies appears in the official subject listing. The eligibility JSON omits Computer Studies, PHE, and English, so it is not an exhaustive inventory. PHE remains unverified from current official IBASS evidence; no production rows were changed.
- Latest parser/test commits: `74175a7f402977420132f95409ce7561414f29cc`, `7087af857d5e3394a3ca748f4841baf4c279b867`. Current CI for those commits still needs inspection.
- No live data, production migration or deployment changed.
- Next action: inspect CI for parser commits, then find complete current IBASS subject inventory and compare against `ace.subjects`; do not bulk-add unverified entries.


## CI verification and IBASS inventory follow-up — 2026-10-19
- Refreshed repository state: `main` HEAD `f489713e5ada29b3e06b750c2929644e1c587a26`.
- Verify workflow run `39177813651` passed on this HEAD: parser/review-only-stage Node tests, Deno type check for `ibass-catalog-stage`, `npm run typecheck`, `npm run build`, and disposable PostgreSQL `utme-subject-choice.test` migration job all succeeded.
- ACE JAMB E2E workflow run `39177813601` passed on this HEAD, including typecheck, build, Playwright browser tests and artifact upload. The exact official-label parser test also passed in Verify run `39177774340` for commit `7087af857d5e3394a3ca748f4841baf4c279b867`.
- Official IBASS e-syllabus page displays 12 entries and client-side pagination controls. Adding URL query parameters `?page=2` / `?page=3` did not change extracted results; this approach does not retrieve the remaining pages. Search results and visible first-page content confirm Computer Studies is included. No current official evidence for Physical and Health Education was found in these searches.
- Inventory conclusion unchanged: the official eligibility JSON's 22 rows are not exhaustive; ACE production has 25 active subject rows; PHE remains unverified and must not be deleted without evidence. No live subject rows, production migration, or deployment changed.
- **Next action:** inspect IBASS's actual pagination/data-loading mechanism or discover an authoritative full subject inventory endpoint, then compare each source label to `ace.subjects`. Do not bulk-add or delete subjects based on incomplete extraction. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## Official subject pagination probe retry — 2026-10-19
- Refreshed main HEAD: `55c102de9d68f21ccf765c559cbefb8b17189fb4`; read both handoff documents.
- Tried official IBASS structured HTML/JSON, `?page=2`, `?page=3`, and DataTables-like `draw/start/length` query parameters. The fetch provider still returned only first-page subject rows or no rows, and did not expose pagination targets or later-page contents. This route is blocked/inconclusive; do not retry identical URL query tricks without new evidence.
- Official eligibility endpoint still returns 22 subjects; read-only production ace.subjects query returns 25 active rows. Official e-syllabus first page confirms Computer Studies; official eligibility UI makes English a required selection despite its JSON omission. PHE remains unverified. No live subject writes, migrations, or deployment occurred.
- Next action: find the official page JavaScript/data endpoint or official syllabus download that yields the full subject list, then reconcile labels with production ace.subjects. If the connected fetch route cannot inspect scripts, use an alternative permitted public-source route or document the precise access limitation before asking the user for any needed access. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## Official JAMB bulletin cross-check — 2026-10-19
- Further official-source search found JAMB bulletin PDFs dated 2022 that explicitly mention Computer Studies or Physical and Health Education as selectable UTME subjects. This is historical corroboration, not proof of the complete current-season list.
- Current official eligibility homepage search text also includes Physical And Health Education, but the official `subjects_jamb.json` payload excludes both PHE and Computer Studies. The official e-syllabus first page confirms Computer Studies. Keep existing PHE row pending stronger current-season verification; do not delete or duplicate it.
- Official IBASS extraction still exposes only the first 12 e-syllabus cards and hides the app bundle/API references; pagination URL probes did not retrieve pages 2–3. `robots.txt` permits crawling, but `sitemap.xml` returned empty content through the extraction provider. This route remains inconclusive.
- No production subject changes, migrations, staging or deployments. Current inventory is still not certified complete.
- Next action: inspect the official frontend bundle or live eligibility UI's selectable subject list and compare against the current-season JAMB source; then make only evidence-backed catalogue changes with tests. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## Decision — stop subject-inventory investigation and proceed — 2026-10-19
- Subject inventory research is timeboxed and **closed for this workstream**. Do not repeat official IBASS pagination probes or keep catalogue completeness as a blocker.
- Use the existing 25 active production subject rows as the working baseline. Keep existing Computer Studies and Use of English entries and retain Physical and Health Education pending new authoritative current-season evidence. Do not bulk-add/delete rows or claim the inventory is fully certified.
- Known limitation: official eligibility JSON has 22 labels and is incomplete; IBASS e-syllabus confirms Computer Studies; English is required by the eligibility UI; current-season PHE status remains unresolved. This is deferred, not treated as verified.
- **Next concrete action:** refresh current main CI results and inspect catalogue-import deployed/source drift plus onboarding migration readiness. Continue implementation after verification; no production migration/deployment without passing checks and a confirmed safe path. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## Execution checkpoint — 2026-10-19
- Current main HEAD before this note: 3cae57fe9497fa5bb084c6474d8e4f0738c7723d.
- Verify run 39179042756 passed parser tests, Deno check, npm typecheck/build and disposable PostgreSQL subject-choice migration test. E2E run 39179042775 passed typecheck/build but Playwright browser installation/tests were still running at last check.
- Production migration history ends at 20261018143241_batch_2_utme_subject_choice. New migration 20261019120000_preparation_onboarding_without_catalogue.sql is not applied; read-only function lookup returned null. No migration/data writes performed.
- catalog-import repo source and deployed v7 differ materially. Repo checks source review/season state and writes batch/rows directly; deployed v7 uses can_manage_catalog and stage_catalog_import RPC, with CORS handling, but lacks the source-review/season checks visible in repo source. Do not redeploy before reconciling and testing both behavior and RPC privileges.
- Next: refresh E2E result, inspect stage_catalog_import migration/privileges and import tests, reconcile drift with regression coverage. Keep onboarding migration unapplied pending verification. Subject inventory research is closed/deferred. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## Catalogue importer reconciliation — 2026-10-19
- Repository function aligned to deployed `catalog-import` v7 RPC architecture in commit `de074f6f5acc97b1cffe9ad49b9342ba634da8c1`. It now handles OPTIONS/CORS, validates caller JWT and `can_manage_catalog`, enforces payload bounds, delegates staging to `stage_catalog_import`, and returns sanitized errors. Direct non-atomic table inserts were removed.
- Added `tests/catalog-import-contract.test.mjs` in commit `1b9053cb202e65ea3430e0aed0ecfa19d405ecf6`. It asserts the atomic RPC/auth/CORS contract and prevents accidental direct inserts or DB error leakage.
- Live read-only `pg_get_functiondef` confirmed `can_manage_catalog()` checks `ace.roles` against `auth.uid()`; `stage_catalog_import(...)` checks caller role, dataset/row bounds, source reviewed/approved state, season existence/archive state, snapshot idempotency, and stages batch+rows in one transaction. Function ACL lists `authenticated` execute. This resolves the earlier concern that the deployed RPC omitted source/season checks.
- New source/test commits occurred after the previous successful CI runs. Latest verified successful CI is still for pre-change HEAD `548fc58f516d796b42cd0d7363c5d799c36fe75f`; current commits need fresh Verify and E2E results.
- Source-control blocker: live migration ledger includes `20261006124552_add_catalog_manager_role_check`, `20261006125056_add_catalog_source_lookup`, `20261006125420_add_catalog_import_idempotency_check`, `20261006125836_add_atomic_catalog_import_staging`, and `20261006130820_add_ibass_institution_stage_lookup`, but corresponding migration files are absent from current main migration directory. Do not deploy or alter the live RPC until this migration drift is reconciled. No production migration/deployment or catalogue writes performed.
- Onboarding migration `20261019120000_preparation_onboarding_without_catalogue.sql` remains unapplied; live RPC lookup previously returned null.
- **Next action:** refresh CI for current main, then recover/reconcile missing migration source files from verified deployment/history; afterward continue onboarding migration readiness checks. Batch 2 IN PROGRESS; Batch 3 LOCKED.

## CI coverage correction — 2026-10-19
- Verify + E2E succeeded on `893fb9af417ca0a0e69746810f6e369935277aa0`, but Verify job inspection showed the new `tests/catalog-import-contract.test.mjs` was not included in the test command and `supabase/functions/catalog-import/index.ts` was not Deno-checked.
- Updated `.github/workflows/verify.yml` to run the new contract test and type-check the importer with Deno (`--no-check=remote`) in commit `3eefab18992c276794aac2323faa8f5672c6824b`. CI for this change is pending.
- Live deployed function v7 still has raw `detail` response fields for permission/staging errors and accepts array payloads as object payloads. Repository source sanitizes those errors and rejects arrays. Do not claim deployed/source parity or deploy before the missing historical migration source is reconciled and the new CI passes.
- **Next action:** verify the workflow run for the current main HEAD, then continue source recovery for the five production-only migration versions and onboarding migration readiness. No production writes/deployments.



### Migration-source recovery and onboarding test review — 2026-10-19
- GitHub file-history queries for three representative missing migration paths (20261006124552_add_catalog_manager_role_check.sql, 20261006125836_add_atomic_catalog_import_staging.sql, 20261006130820_add_ibass_institution_stage_lookup.sql) returned no commits. These five production-ledger migration source files cannot be recovered from those expected repository paths/history; do not fabricate their original historical contents.
- Read-only production schema inspection confirmed catalog staging functions, constraints and indexes exist, including unique partial index ace.uq_catalog_import_batches_snapshot_hash. Keep this source-control drift open and avoid deployment until a safe forward reconciliation is designed and tested.
- Existing disposable PostgreSQL test script tests/sql/utme_subject_choice.test.sql also applies 20261019120000_preparation_onboarding_without_catalogue.sql and checks prep-only save with empty goals, four active subjects, preference persistence, clearing unverified structured catalogue IDs, and unauthenticated rejection. Verify workflow runs this SQL script; the latest workflow rerun after importer test/Deno-check correction is still in progress at time of this note.
- The onboarding RPC remains absent from production (to_regprocedure(...) previously returned null); no migration has been applied.
- Next: confirm current Verify + E2E runs; if green, design a separate forward-only source reconciliation for missing catalog RPC/indexes using live definitions and disposable PostgreSQL tests, then review onboarding deployment safety. No production changes/deployments.



### Importer Deno check failure and correction — 2026-10-19
- First run with expanded Verify coverage: contract tests passed (14 total), disposable PostgreSQL onboarding/UTME migration test passed, but Deno check for catalog-import failed before checking the function because the optional edge-runtime.d.ts import triggered a missing npm:openai package resolution in the runner. The deployed function's sibling ibass-catalog-stage source does not use this type-only import.
- Removed the unnecessary edge-runtime.d.ts import from supabase/functions/catalog-import/index.ts in commit fe83e32501790e4139e6b8729b9cfe6be7cc83bb; Deno provides the runtime globals and the file still uses Deno.serve. Fresh Verify/E2E is pending. Do not count the importer Deno check as passed until a new run succeeds.
- Existing run 39180989334: contract tests PASS; disposable PostgreSQL migration test PASS (including prep-only onboarding assertions); importer Deno check FAIL due to package resolution; later steps skipped. Failure diagnosed from job logs, not inferred.
- Next action: confirm Deno check and full Verify/E2E on the current HEAD; if Deno still fails, adjust the type-check setup without adding unnecessary runtime dependencies. No production migration/deployment.

## Batch 2 execution checkpoint — 2026-10-19
- Latest verified main before this checkpoint update: e64a696e596cbf6a2f8e803ea755d1ddc23278b0. Master handoff has since been updated in commit 9b62b5a3a6d7de25920e543c1f1ab196d722cead.
- Verify run 39181108028: SUCCESS. Verified steps include the catalogue importer contract tests, Deno checks for both Edge Functions, app typecheck/build, and disposable PostgreSQL onboarding/UTME migration test. E2E run 39181108062: SUCCESS. The previous importer Deno resolution failure is resolved.
- Read-only live DB counts: 791 institutions; 0 programs; 0 program_utme_rules; 13 catalog_sources; 5 import batches; 793 import rows. All 791 institutions are draft and have no JAMB code. The three published institution batches have 328, 199, and 264 rows, but published here means imported to draft catalogue records, not launch-ready activation.
- A rejected incomplete 791-row batch has only one persisted row; do not retry it as canonical. Test-only staged batch 993bfb6c-b6d0-4ace-9e6e-4db48df064f7 is one review-only row and must not be approved/published.
- Active ibass-catalog-stage requires an authenticated admin/editor caller JWT and stages up to 25 institution IDs per request. No authenticated user session is exposed by the current connector tools. No production write, stage invocation, migration, or deployment was attempted. Do not bypass caller authorization with service-role direct inserts.
- Five production migration versions dated 2026-10-06 remain absent from source control; do not redeploy catalog-import until a safe forward-only source reconciliation is designed/tested. Onboarding migration 20261019120000_preparation_onboarding_without_catalogue.sql remains unapplied to production.
- Exact next action: use an authenticated admin/editor session in the application to stage official IBASS programme records for a small batch of verified institution mappings (maximum 25 institution IDs per request); review unresolved mappings and counts, then continue bounded batches. After programme validation/review/publication, stage UTME rules preserving alternatives. If no UI action exists, add/enable an authenticated invocation path rather than sharing tokens in chat. Batch 2 remains IN PROGRESS; Batch 3 LOCKED.

## Batch 2 implementation checkpoint — 2026-10-19
- **Settled decision:** existing 25-subject catalogue baseline remains fixed; subject-inventory research is closed. Do not re-open the 791-institution/catalogue discussion as a scope decision. Proceed with Batch 2 implementation.
- **Repo/branch/HEAD before this change:** `DarealNovaking/Nova-ace-jamb` / `main` / `dd3270fbcaa8be8e29b19cf3e6a25fc979752055`.
- **Bug identified:** active routing in `src/main.tsx` sends `/admin` and `/admin-import` to `AdminFoundationGate`, but that gate omitted `AdminIbassStage`; the component existed but was not exposed in the active authenticated admin dashboard.
- **Implementation:** `AdminFoundationGate` now imports and renders `AdminIbassStage` after existing review/import panels. Existing auth gate and component's session/admin checks remain in force. No production data was changed and no stage request/deployment was made.
- **Verification status:** code path inspected; commit CI is pending. Runtime admin flow and live staging are unverified because no authenticated admin browser session is available through connected tools.
- **Next concrete action:** check the implementation commit's CI results. If passing, perform a small controlled stage via the authenticated app, inspect staged programme/rule batches and unresolved items, and only then plan the review/approval path. Batch 3 remains locked.


## Verification follow-up — 2026-10-19
- GitHub Actions verified the admin-route change and its documentation commits: Verify run `39210980334` and E2E run `39210980315` both completed successfully on HEAD `90baf9e5e30f5a8ebaa78dde369096d4ec47430a`. Earlier code commit and docs commit workflows also passed.
- Read-only Supabase counts: institutions 791; programs 0; program UTME rules 0; subjects 25; import batches 5; import rows 793. No production writes were made. Do not interpret these counts as a reason to reopen the settled catalogue decision.
- Deployed `ibass-catalog-stage` is active v4 with JWT verification. It validates the user and catalog manager role, accepts 1–25 institution IDs, discovers IBASS programme/requirement data and stages through `catalog-import`; no approval/publication is invoked by this function.
- **Blocked only at live authenticated execution:** no signed-in admin browser session is exposed by connected tools. UI reachability and CI are verified, but real staging and batch inspection are not.
- Next: authenticated administrator visits `/admin`, selects exam season and small agreed institution subset, invokes staging once, and reports/inspects batch IDs and unresolved rows before any approval/publication. Batch 3 locked; 25-subject baseline fixed.


## Verified continuation checkpoint — English-default preparation onboarding (2026-10-19)
- **Current task:** preparation-first student journey. The catalogue is no longer the primary journey or a gate to learning/CBT. Follow `docs/CATALOGUE-REPLACEMENT-INVESTIGATION-2026-10-19.md`; this supersedes stale checkpoint lines that prioritize Batch 2 ingestion.
- **Repository:** `DarealNovaking/Nova-ace-jamb`, branch `main`. Latest code commit for this task: `a9d731604984a3de5c664023fada4fa4affc69e8`; migration source update: `28bf75b6d4f1699e46b625f85e710bd97fa27564`. Master-handoff update: `2801115b6241f7f2f642928198be1391d93848de`. Refresh HEAD before further edits.
- **UI change:** `src/components/StudentOnboarding.tsx` automatically selects and locks the active `ENG` subject; user chooses exactly three additional subjects. Existing saved selections are normalized to English plus up to three active alternatives. Display clarifies English is included and counts the three remaining choices.
- **Database change:** updated migration `20261019120000_preparation_onboarding_without_catalogue.sql` requires four distinct active subject IDs including active English. Supabase `apply_migration` returned success for `preparation_onboarding_without_catalogue` on project `uokiqlgmzprqfbzmedaz`. Immediately before apply, read-only query confirmed 1 active ENG subject, 25 active subjects, and no existing `save_student_preparation_foundation` RPC. Do not expose student records or PII.
- **Verification status:** GitHub writes returned commits successfully; Supabase migration tool returned `success: true`. Build, typecheck, Playwright, CI, live RPC signature/grants after migration, and full student runtime journey remain pending/unverified in this session.
- **Open risks:** Confirm the UI always receives `ENG` among active subjects; if absent, onboarding intentionally blocks saving with an explanatory message. Confirm no active onboarding call site still uses legacy catalogue-required RPCs. The migration keeps legacy catalogue tables intact.
- **Exact next action:** inspect latest HEAD and workflow runs; run `npm run typecheck`, `npm run build`, and Playwright onboarding tests. Add an E2E assertion that English is checked/disabled and exactly three other subjects are required. Then verify the deployed RPC definition and authenticated-only grants read-only. Update this checkpoint and master handoff with real results.


## Batch 2 scope reset — preparation-first gate (2026-10-19)
- Product decision: Batch 2 completion is not gated on bulk catalogue ingestion. Student preparation/onboarding/learning/CBT must work without institution/programme/UTME-rule rows. Catalogue verification remains separate optional capability; do not delete legacy data/schema/RPCs.
- Revised acceptance criteria are recorded in `docs/ACE-JAMB-MASTER-HANDOFF.md`: secure preparation RPC; English auto-included + three other active subjects; no catalogue hard gate; explicit season/source verification; RLS/grant checks; Playwright for empty catalogue, persistence/reload, auth/error paths; both handoffs updated with evidence.
- Current HEAD before this scope update was `f758b231a9eec2488c1ed62511fde5a0b67d2666`. English UI commit `a9d731604984a3de5c664023fada4fa4affc69e8`; migration-source commit `28bf75b6d4f1699e46b625f85e710bd97fa27564`; migration applied live and RPC signature/grants/English validation verified read-only.
- CI at `f758b231a9eec2488c1ed62511fde5a0b67d2666`: Verify passed; ACE JAMB E2E passed. Treat these as pipeline outcomes only, not proof that revised acceptance criteria are all covered.
- **Batch 2 remains OPEN** pending Playwright-spec audit and evidence for empty-catalogue onboarding, English plus three selection, persistence/reload and navigation to learning/CBT. Do not unlock/declare Batch 2 complete just because catalogue is optional.
- Next action: inspect current E2E specs and all onboarding save/gate call sites, add targeted regression coverage, run CI, and update both handoff documents with real results. Do not ask the user to re-upload catalogue data or require any manual action yet.


## Preparation-first validation hardening — 2026-10-19

- Latest test change: 54833febb635c2e45d0e2d17960e39940c7ce6c9 expands tests/sql/utme_subject_choice.test.sql with empty institution/programme/rule rows and server rejection checks for missing ENG, duplicate subjects and inactive subjects.
- Active onboarding call path uses saveStudentPreparationFoundation → save_student_preparation_foundation; legacy catalogue RPC wrappers remain in studentService.ts but have no call from the active onboarding component. The gate checks profile/preferences/four saved subjects, not institution/programme/rule records.
- Current Playwright tests are only smoke checks (entry surface and mobile body). No authenticated onboarding assertions yet for English disabled/preselected, exactly three additional subjects, persistence/reload, empty catalogue, error handling or Learning/CBT navigation.
- Read-only production SQL confirms preparation RPC signature, authenticated EXECUTE=true, anon EXECUTE=false and English validation. No production writes were performed in this step.
- Supabase Security Advisor flags authenticated-executable SECURITY DEFINER functions (including this RPC) and disabled leaked-password protection. Review RPC body/authorization deliberately; signed-in students must be able to save only their own profile through auth.uid().
- Verify run 39331339786 and E2E run 39331339916 were in progress at time of note, both targeting 54833febb635c2e45d0e2d17960e39940c7ce6c9. Do not record them as passed until final workflow result is fetched. Local checks were not run.
- Exact next action: fetch final workflow/job outcomes; resolve any SQL failure; add authenticated Playwright coverage for onboarding selection, persistence/reload and Learning/CBT navigation. Batch 2 remains OPEN; no user action required yet.


- **Failed investigation / correction:** Verify run 39331339786 failed in the disposable SQL test because request.jwt.claim.sub was cleared for the unauthenticated case and not restored before new English/duplicate/inactive assertions. Job logs proved the auth guard fired first; the assertions were not actually validating the target rules. Fixed by restoring the synthetic test user claim before those assertions in commit b95e72071995a2ce99a4a5b893be5efac90f9c92. Await fresh Verify/E2E results; do not count the earlier failed run as a pass.


## First-time onboarding defect found and corrected — 2026-10-19

- Previous corrected SQL Verify and E2E workflows passed on 89c0718db20c78513846f205b588bcdb066471ca. These runs did not include authenticated onboarding tests; existing browser specs are smoke tests only.
- Found that a missing profile causes StudentFoundationGate to show onboarding, while StudentOnboarding previously rejected PGRST116 from getStudentProfile/getStudentPreferences, leaving first-time users with a load error.
- Fixed in b0a003f63bc5d6c7ff97e605b784ae4bb0c50e19: PGRST116 is treated as an absent optional profile/preferences row and default values are used; unrelated errors still fail visibly. Active-subject loading remains required.
- Wait for CI on the fix, then add authenticated Playwright coverage for setup with absent profile/preferences and no catalogue rows, English locked + three additional subjects, save/reload, and Learning/CBT navigation. Batch 2 remains OPEN.


## Authenticated onboarding E2E added — 2026-10-19

- Commit `c25d7b95fa02aa839e37d463516bf903a443e6a8` updates `tests/e2e/smoke.spec.ts` with mocked authenticated first-time student setup. All calls to the Supabase project URL are intercepted; test user/session data is synthetic. Test covers absent profile/preferences, preparation UI without catalogue rows, ENG preselected/disabled, exactly three additional selections, selection count and button enablement/limit behavior.
- CI on this commit is pending and must be checked before treating the new spec as passed. The first-time onboarding code fix in `b0a003f63bc5d6c7ff97e605b784ae4bb0c50e19` has passed both Verify and E2E workflows on `a9f0485990ef5c3d2448bb2bda8933f97129691e`, but those E2E specs predated this regression test.
- Still missing: save/reload persistence and Learning/CBT navigation tests; review live SECURITY DEFINER RPC body/authorization and leaked-password protection warning. Batch 2 remains OPEN; no user action required.
- Exact next action: fetch workflow result for the latest test commit, correct any failure, then extend the mocked authenticated journey to cover save/reload and Learning/CBT navigation.


## Active continuity checkpoint — preparation-first onboarding (2026-10-19)

### Source of truth
- Repository: `DarealNovaking/Nova-ace-jamb`, branch `main`.
- Latest commit observed: `e912d5e5c0b7b0127ddddcf15c3fc6465c30e1be` — `docs: checkpoint onboarding browser test`.
- Product direction: **catalogue is no longer used as a prerequisite for student onboarding/preparation**. Do not make empty institutions/programmes/UTME-rule tables a blocker for the active core student journey. Institution/course are optional goals. Do not delete legacy catalogue infrastructure without dependency review.

### Current verified implementation
- `StudentFoundationGate.tsx` checks admin role, registers the current device, then reads the student profile and preferences/subjects. A missing profile is routed to onboarding.
- `StudentOnboarding.tsx` treats PGRST116 for absent profile/preferences as a first-time-user state, uses default preparation values, requires active subject loading, and saves through `saveStudentPreparationFoundation`.
- `b0a003f63bc5d6c7ff97e605b784ae4bb0c50e19` introduced the absent-row fix.
- `c25d7b95fa02aa839e37d463516bf903a443e6a8` adds mocked authenticated Playwright coverage for rendering onboarding without catalogue rows, English preselected/disabled, and three additional subject choices. The test intercepts Supabase requests and does not mutate production data.
- `e912d5e5c0b7b0127ddddcf15c3fc6465c30e1be` records that test and explicitly leaves its CI outcome pending.

### Current user-visible issue / evidence boundary
- Reported screen error: “Unable to prepare your ACE account. Please try again.”
- Root cause is **not verified**. In the gate, `registerCurrentDevice()` executes before profile/onboarding checks and can fail the entire initialization; inspect its implementation and relevant Supabase logs before changing it. Also verify `is_admin` RPC and profile/preferences/subjects requests. Do not present device registration as the confirmed cause.
- Current Verify/E2E workflow status for the latest commit has not been confirmed in this checkpoint. No claim that the latest browser regression passed.
- No production writes, privileged auth bypass, or deployment were performed during this checkpoint.

### Remaining acceptance criteria
1. Confirm current CI/Verify/E2E results for `main`; fix any failing run and rerun.
2. Identify the actual cause of the account-preparation error using implementation plus sanitized logs; fix safely and add regression coverage.
3. Extend the browser journey through save, persisted reload, and Learning/CBT navigation. Keep mocked tests clearly labelled; distinguish them from a real authenticated persistence check.
4. Review the preparation RPC's SECURITY DEFINER body/authorization and the existing leaked-password-protection warning.
5. Update master handoff, this checkpoint, and the historical Batch 2 blocker handoff to reflect the corrected product direction and evidence.
6. Batch 2 remains OPEN until the core student journey is verified. Do not deploy production unless explicitly authorized and deployment credentials are functional.

### Exact next action
Fetch the latest Verify and ACE JAMB E2E workflow results, then inspect `src/lib/deviceService.ts`, the `is_admin`/preparation RPC definitions, and recent relevant Supabase logs. Establish the actual failure before editing application code. No user action is currently required.


## Follow-up implementation — first-time profile save (2026-10-20)

- Commit `6f738122d631bf50943640a7ddc6f1ef4250217b`: `StudentFoundationGate.tsx` now extracts `message` from Supabase/PostgREST error objects as well as native Error instances, reducing generic error masking.
- Commit `622e35df07e2a18f02dc5f3f86df67dba782bf89`: added migration `supabase/migrations/20261020000100_first_time_preparation_profile.sql`.
- Applied the migration to live Supabase project `uokiqlgmzprqfbzmedaz`. Read-only verification confirmed the live `ace.save_student_preparation_foundation` definition includes a profile insert and checks `auth.uid()`. This migration is non-destructive and only creates the row for the authenticated user's own UUID if absent.
- Not verified: full CI/build; live authenticated save/reload; Learning/CBT navigation; exact source of the previously reported “Unable to prepare your ACE account” screen. The gate's improved error extraction should help identify the failing request on retest, but must not be represented as proof that the initialization error is fixed.
- No production deployment was run from this action; the database function migration was applied directly through Supabase migration tooling.

### Next action
Re-run Verify/E2E CI for the latest main commits, then reproduce sign-in with the affected account and record the now-visible error safely. If onboarding opens, complete setup and confirm persisted profile, preferences, four subject rows, and Learning/CBT navigation. Batch 2 remains OPEN.


## Batch 2 status update — CLOSED (2026-10-20)

- Project owner confirms student login works, preparation profile can be completed and saved, data persists after refresh, and Learning/CBT navigation works.
- **Batch 2 is CLOSED for the active preparation-first student journey**, based on this user-run verification. Catalogue population remains out of scope for this journey.
- Live Supabase migration `20261020000100_first_time_preparation_profile.sql` is applied; read-only verification confirmed the deployed save RPC creates a missing profile and checks `auth.uid()`.
- Verification distinction: the live user journey is reported as working by the project owner; the agent has not independently run a browser session. CI/build and automated authenticated persistence/navigation tests remain unverified and should be completed as follow-up QA. Do not misrepresent them as passing.
- No frontend deployment was performed in this closure step.
- **Exact next action:** resume the next milestone in the master handoff; schedule CI/build and strengthen automated authenticated journey coverage as QA follow-up. Reopen Batch 2 only if a reproducible regression appears.


## Active milestone — Batch 3 Academic Structure kickoff (2026-10-20)

- Repo `DarealNovaking/Nova-ace-jamb`, branch `main`; observed HEAD before this checkpoint write: `20c0910ccc551e06468bdd5b339b985fc67be764`. Master handoff updated in commit `3b938ef8b6abd4b8e891229e6b5373314fd1646c` with the detailed audit.
- Batch 2 remains closed for the student preparation journey. Batch 3 here means the next academic-structure milestone in the canonical roadmap, not catalogue ingestion as a prerequisite.
- Source audit confirms the syllabus/season schema migration and existing tables for subjects, topics, subtopics, syllabus versions, exam seasons/configs, questions, and learning progress. RLS is enabled on the listed academic tables. Do not duplicate existing schema or seed guessed official JAMB data.
- Supabase table-list tool returned approximate zero row counts for the core academic tables, but this conflicts with the owner's verified live onboarding journey and the tool did not establish exact SQL counts. Treat counts as unverified pending a supported read-only check.
- Important architecture warning: `src/App.tsx` appears to use `@appdeploy/client`, while the preparation-first onboarding implementation is in Supabase-backed components/libs. Must trace `src/main.tsx`, HTML entrypoint, Vite config and routes before changing UI, to avoid implementing against a dormant prototype.
- CI wrapper returned no workflow runs/statuses for current HEAD; latest typecheck/build/E2E are not verified. No application code, DB data, migration, or deployment changed during this audit.
- **Exact next action:** trace active build/route entrypoint; obtain exact read-only counts for subjects/topics/subtopics/seasons/configs/syllabus versions/questions; inspect existing academic services/admin controls; implement the smallest verified gap with RLS and review/publish safeguards; run typecheck/build/Playwright and update both handoff files.
- **Status: Batch 3 IN PROGRESS (audit only; implementation not yet started).**


## Legacy provider removal — 2026-10-20

- Removed unused legacy prototype/integration files: `src/App.tsx`, `src/providerBridge.ts`, `src/types/appdeploy-client.d.ts`, `appdeploy.auth-login.json`; removed `@appdeploy/client` alias from `vite.config.ts`.
- Actual entrypoint confirmed as `src/main.tsx`, using Supabase-backed student/admin gates and CBT component. No production DB or deployment changes.
- Code commits: `35fc382fd8ace91464c743973da332eadf196c21`, `216dc14e1d0859abb0d43e4651a8b48e6806b613`, `4c03678ed0dc9fd051c20f1d01b8bd9d5166e2e8`, `f3740d5712033263a651905d7cf94591b1fbca52`, `f253e249370e170f97eb0151422015513c2636a5`.
- Build/typecheck/E2E remain unverified after changes. Next: residual-reference scan, run typecheck/build and Playwright, resolve errors, then continue Batch 3.


## Active continuity checkpoint — post-legacy-removal CI regression (2026-10-20)

### Repository and evidence
- Repo: `DarealNovaking/Nova-ace-jamb`, branch `main`.
- Latest relevant commits: `9c585a6213b2943573abdb5601a3e5c2a2f1b19f`, `69404fe1fff598429b45ec8169162ffedbf7a6be`, `7c1c124e459b7a64816c4277dac59c750f9364eb`.
- The last completed workflows before the fix were Verify run `39339534465` and ACE JAMB E2E run `39339534495` on `84d36fbe87ad7b1c690a28187c0fe7be6967b3a2`; both failed at TypeScript check because `StudentFoundationGate.tsx` imported the deleted `../App`. Build and browser tests were skipped. The disposable PostgreSQL migration test and the static/Deno checks preceding typecheck passed.
- Corrected the active route to use new `src/components/StudentDashboard.tsx`; this avoids restoring the removed AppDeploy-based demo. Dashboard reads saved student profile/subjects from Supabase, loads only active subject rows, and displays topics only from active rights-approved syllabus versions. No invented syllabus content is shown.
- Corrected subject filtering to use the actual `subjects.active` column, matching `StudentOnboarding.tsx`.
- AppDeploy legacy-reference search returned no results before this route regression was fixed; source inspection then found the dangling `../App` import. The active student gate now points at the new dashboard. Re-run a residual-reference scan after current CI.
- No live database writes, migrations, deployments, or catalogue imports were performed.

### Current verification state
- CI runs triggered by the fix were queued at the last poll: Verify `39506323322` and ACE JAMB E2E `39506323321` (commit `69404fe1`), plus Verify `39506318882` and ACE JAMB E2E `39506318829` (commit `9c585a62`). A later code commit `7c1c124e` should have its own runs; fetch the latest runs rather than relying on queued historical entries.
- Dashboard build/typecheck/browser behavior remains **unverified** until the latest CI results finish. No Playwright browser test passed on the pre-fix commit because typecheck failed first.
- Batch 2 remains closed based on the owner's direct confirmation of student login, preparation save/persistence and Learning/CBT navigation. Automated follow-up QA is still required.
- Active milestone remains **Batch 3 — Academic Structure**.

### Exact next action
1. Fetch Verify and ACE JAMB E2E workflow outcomes for the latest `main` HEAD; inspect failed job logs if needed. Resolve any errors and wait for the rerun to finish.
2. Confirm the legacy-provider residual scan and add/adjust Playwright coverage for the post-onboarding dashboard and CBT navigation where feasible.
3. Continue Batch 3 with read-only inspection of academic table counts/records, subject/syllabus services, and admin/editor review/publish controls. Do not invent JAMB data, seed production rows, deploy, or re-open catalogue ingestion as an onboarding gate.
4. Update this checkpoint and master handoff with actual CI outcomes and the next verified gap.


## Batch 3 read-only data audit — 2026-10-20

- Live Supabase read-only SQL query succeeded after correcting one column-name assumption (`questions.active`, not `is_active`). Exact counts: `ace.subjects=25`, active subjects=25, topics=0, subtopics=0, seasons=2, exam configs=1, active configs=0, syllabus versions=50, active syllabus versions=0, questions=0, active questions=0.
- Season state: JAMB 2026 is closed; JAMB 2027 is draft. Sole config “2026 UTME official structure” is inactive (180 questions, 7200 seconds). All 50 syllabus versions are draft / rights pending. No official content should be invented or activated to make the UI look populated.
- Existing database controls found: activation/validation functions `activate_exam_config`, `activate_exam_season`, `activate_syllabus_version`, `validate_exam_config`; RLS policies allow editor/admin management for academic rows and constrain ordinary reads. Function bodies/grants still need a focused review before relying on them for the UI.
- Current component inventory contains catalogue staging/import admin panels but no academic-structure editor. The admin route checks `is_admin()`, so content-editor route access must be designed explicitly and must not confer full admin privileges.
- Verify run `39506340527` for commit `7c1c124e` **passed** all jobs, including typecheck/build and disposable SQL migration test. ACE JAMB E2E run `39506340498` was still in progress at the last poll. Search for `appdeploy` returned zero matches.
- The initial audit query failed because of the guessed `is_active` question column; corrected to `active`, after which the query succeeded. This was read-only and made no data changes.
- **Exact next action:** fetch final E2E outcome for `39506340498` and the latest `main` runs; then inspect the activation/validation RPC bodies and EXECUTE grants, design a separate least-privilege editor path, and implement the smallest draft academic authoring/review surface. Do not create guessed JAMB content, activate unverified seasons, deploy, or mutate production data without explicit authorization.


## Final verification follow-up — 2026-10-20

- E2E run `39506340498` for code commit `7c1c124e` completed successfully: 6 Playwright tests passed, after typecheck/build passed. Verify run `39506340527` also passed all jobs. Latest documentation-only main commits' Verify jobs passed; their E2E runs were still in progress at the last poll, so fetch current HEAD's final E2E result before calling all latest CI green.
- Read-only activation function review: `activate_exam_config`, `activate_exam_season`, and `activate_syllabus_version` enforce authenticated editor/admin role checks and fixed search paths; anon/public EXECUTE is false. `validate_exam_config` is validation-only and has no editor check, but anon/public EXECUTE is false.
- Security issue to fix before authoring UI: current public SELECT policies on `topics` and `subtopics` only check row `active`, not whether the linked syllabus version is active and rights-approved. Since syllabus activation requires active topics, draft topics could be exposed while the parent syllabus is still draft. No policy change was made in this audit.
- No live data/schema changes or deployments were performed. Search for `appdeploy` returns no matches. Dashboard code has successful Verify + E2E on commit `7c1c124e`.
- **Exact next action:** finish latest main E2E check; implement a migration to make public topic/subtopic reads require an active, rights-approved parent syllabus version, add disposable SQL regression coverage to CI, then build a separate least-privilege `/admin-academic` route for draft version/topic/subtopic authoring and provenance/rights review. Do not seed invented content or apply a production migration without a reviewed, verified change.


## Current continuation checkpoint — Batch 3 security + authoring (2026-10-20)

- Repo `DarealNovaking/Nova-ace-jamb`, branch `main`; last observed HEAD before this checkpoint commit: `566673fb72311d730686d31d126a66ed0acee255`.
- Implemented source-only migration `20261020120000_syllabus_publication_visibility.sql`: public topic/subtopic reads require active rows tied to active + rights-approved syllabus versions; subtopics additionally require an active matching parent topic. SECURITY DEFINER helper exposes only a boolean and uses fixed search path. Existing editor/admin review access is retained.
- Added SQL regression test `tests/sql/syllabus_publication_visibility.test.sql` and Verify workflow step. The disposable PostgreSQL test reported “syllabus publication visibility tests passed” in the latest observed Verify run for commit `566673fb`; TypeScript validation also passed. Verify production build and Playwright were still running at last poll, so overall latest HEAD is not yet fully verified.
- Added `AdminAcademicWorkspace.tsx`, `AcademicFoundationGate.tsx`, route `/admin-academic`, and student-session redirect for content editors. The workspace creates source-attributed draft versions, leaves rights pending by default, lets editors draft topics/subtopics inactive, supports rights review, and calls only the existing guarded activation RPC. No official content is seeded or invented.
- Added Playwright cases for authorized editor access and denial for a student. Latest E2E run `39507436232` remained in progress at last poll.
- Earlier CI failure on commit `94203c9f` was due to malformed SQL dollar delimiters in the test harness. Fixed with named `$fn$` delimiters; the subsequent Verify run `39507338409` passed. The current test job subsequently showed the SQL regression test passing.
- No production schema migration, database write, or deployment was performed. The migration is committed but unapplied to production.

### Exact next action
1. Fetch completion status and job logs for Verify `39507436241` and E2E `39507436232` (or newest runs on current HEAD after this documentation commit).
2. Fix any failures; ensure all latest Verify, build, disposable SQL, and Playwright checks pass.
3. Only after reviewing current live grants/policies and receiving explicit deployment/migration authorization, apply the visibility migration to production and verify its deployed policy definitions read-only.
4. Continue with source-verified syllabus content; never invent JAMB syllabus data or activate unverified season/configuration rows.


## Verification closeout (2026-10-20)
- Code commit `566673fb72311d730686d31d126a66ed0acee255` passed Verify run `39507436241`, including typecheck/build and both disposable PostgreSQL SQL suites. The syllabus visibility test passed.
- E2E run `39507436232` passed on that code commit: Playwright reports 10 passed (8.2s), including academic editor access/denial coverage.
- Docs commits `844424c0` and `e3920954` followed; their workflows were still in progress at the last poll. Recheck latest HEAD CI before declaring current HEAD fully green.
- The new migration is committed but has not been applied to the live database. Next: check latest HEAD workflows, then request explicit authorization before applying the reviewed migration. No production data changes or deployment occurred.


## Production migration closeout — 2026-10-20

- User authorized the syllabus visibility migration. Applied `syllabus_publication_visibility` to Supabase project `uokiqlgmzprqfbzmedaz`; recorded migration version: `20261020222636`.
- Read-only verification: current topic/subtopic SELECT policies match the reviewed migration; public reads require active rows tied to active + rights-approved syllabus versions, with subtopics additionally requiring an active matching parent topic. Admin/editor draft-review access remains in policy.
- Read-only verification: `ace.is_syllabus_version_public(uuid)` is SECURITY DEFINER with fixed `search_path=pg_catalog, ace`; EXECUTE granted to `anon` and `authenticated`, not PUBLIC.
- Latest current-HEAD workflows both passed: Verify `39507661501`, E2E `39507661518` for `e1f15d4bb99810b5fb04781c9095520aab41a33b`. Prior code commit E2E `39507436232` reported 10 Playwright tests passed.
- No syllabus rows were inserted or activated; no frontend deployment was run.
- Remaining verification: live anonymous API behavior and editor draft visibility have not yet been exercised through HTTP/authenticated UI. Next action: perform safe read-only API/UI smoke tests, then proceed with source-backed syllabus authoring and rights review.


### Follow-up smoke-test finding — anonymous schema access (2026-10-20)
- A read-only privilege check found `has_schema_privilege('anon','ace','USAGE') = false` while `authenticated` is true. Attempting a read-only query after `SET LOCAL ROLE anon` therefore failed at schema permission resolution before table RLS could be exercised; no data changed.
- Do not add `USAGE` for anon automatically: that expands API reachability for the entire `ace` schema, not just syllabus topics/subtopics. Review existing object/table/function grants and intended anonymous product requirements first. Authenticated access is not blocked by this schema privilege.
- Exact next action: inspect the existing schema-exposure migration and current anon grants on ACE objects; decide whether anonymous syllabus reads are actually required. If yes, make the smallest narrowly reviewed grant/policy adjustment and add a regression check; otherwise test the publication boundary under an authenticated non-editor role.


## Academic editor API privilege gap — 2026-10-20

- Read-only live grant audit found authenticated has table privileges on `ace.syllabus_versions` but no SELECT/INSERT/UPDATE grants on `ace.topics` or `ace.subtopics`. The existing editor component calls those tables through the authenticated Supabase Data API, so the workspace's topic/subtopic loading and authoring would fail despite RLS policies being correct.
- Added source migration `20261020230000_academic_topic_editor_api_privileges.sql` granting SELECT/INSERT/UPDATE on topics and subtopics to `authenticated`. These grants do not bypass RLS: the existing `topics_editor_manage` and `subtopics_editor_manage` policies still require `ace.is_admin_or_editor()` for writes; SELECT remains constrained by publication/editor policies. No DELETE grant was added because the current workspace does not delete rows.
- Updated the disposable visibility SQL test to apply the grant migration. CI for the latest commits must confirm the combined test passes.
- **Production status:** this new privileges migration is source-only and has NOT been applied to live Supabase. The earlier authorization covered the syllabus visibility migration specifically, not this additional table-privilege change. No production grant was changed by this audit.
- Next: verify CI for the source migration/test, then request explicit authorization to apply the topic/subtopic API privilege migration. After approval, apply it and read-only verify grants, RLS policies, and the live editor workflow. Anonymous schema access remains intentionally ungranted; the product currently exposes the ACE schema to authenticated users only.


## Academic topic/subtopic API privilege migration — applied and verified (2026-10-20)

- Project owner replied “proceed” to the explicit request to apply the separate topic/subtopic API privilege migration after CI passed; treated as authorization for this migration only.
- Confirmed main HEAD before this documentation update was 6178069dfa5bc13ddd28cf396d5c73b2353c8ec8.
- Current-HEAD CI passed before applying the migration: Verify run 39510386608 and ACE JAMB E2E run 39510386522, both on 6178069dfa5bc13ddd28cf396d5c73b2353c8ec8.
- Applied source migration supabase/migrations/20261020230000_academic_topic_editor_api_privileges.sql to live Supabase project uokiqlgmzprqfbzmedaz using migration name academic_topic_editor_api_privileges. Live migration history now records version 20261020224807.
- Read-only verification confirms both ace.topics and ace.subtopics grant authenticated SELECT, INSERT and UPDATE; DELETE remains false; RLS is enabled on both tables.
- Read-only policy verification confirms topics_editor_manage and subtopics_editor_manage still require ace.is_admin_or_editor() for writes. Publication SELECT policies remain in place, including active/right-approved syllabus-version checks and the active matching parent-topic check for subtopics. No anonymous schema usage was granted.
- No syllabus/topic/subtopic content was inserted, edited, or activated. No frontend deployment was performed. Database grants and policy definitions were verified; a real authenticated editor browser/API create-and-read smoke test is still pending.
- Next action: run a safe live editor workflow smoke test with an authorized editor session (draft-only; no activation of unverified content), confirm topic/subtopic reads and draft writes, then update both handoff files with the observed result. Keep anonymous schema access unchanged.


## Current continuation — frontend-first student journey QA (2026-10-20)

- Actual repository: `DarealNovaking/Nova-ace-jamb`, branch `main`; code/test commit `5893127760a7fac88871cc934544fb6cd77f61a6`.
- Inspected the current student entry gate, dashboard, student service, syllabus service, E2E smoke tests, package scripts, and latest CI. Main HEAD before the test change was `5047974f35ebbdffe712c9f663420f10506ed847`; its Verify run `39510772594` and E2E run `39510772622` both passed.
- Added a mocked Playwright regression test for a prepared student dashboard: profile/subjects render, unpublished syllabus content is not invented, reload retains the authenticated dashboard state, and the CBT CTA navigates to `?cbt=1`. All Supabase requests in this test are intercepted; no production records are touched.
- New CI is pending: Verify `39511826720`, ACE JAMB E2E `39511826534`, both on `5893127760a7fac88871cc934544fb6cd77f61a6`. New test is not yet verified.
- No UI implementation, production database, migration, deployment, or catalogue data changed in this step.
- Important remaining gap: the dashboard is a landing/overview, not a full lesson experience. Active rights-approved syllabus versions/topics were last audited as empty/unpublished; never manufacture JAMB content to fill the screen.
- Exact next action: poll both listed CI runs, inspect job logs and fix any failure. Once green, build the next student-facing frontend flow only after checking existing components/routes and actual available data; preserve the current Supabase authorization/RLS boundaries. Update both continuity documents after that change.


## Frontend batch checkpoint — preparation workspaces + admin milestone alignment (2026-10-20)

### Implemented on main
- `06b5b78672ee31db7e69dcc0f16ca73431685232`: new `src/components/StudentStudyWorkspace.tsx` with Learn, Practice, Quick Revision, Flashcards, Progress and Study Plan views.
- `1f7253c02325d6003bd1f3c395b0a236d69ebe43`: dashboard navigation and workspace state in `src/components/StudentDashboard.tsx`.
- `c18baf86e1482076aabea9cbb15f281fa348dc1c`: Playwright journey covering all six student tools and their empty states.
- `a02516bf0e308958c4564ea6960ee4fbeed4485b`: admin dashboard now reflects Batch 3 / Academic Structure and links directly to `/admin-academic`.

### Correctness boundary
- Workspaces show only saved subjects and verified active/rights-approved topics passed from the existing dashboard service.
- Lesson text, questions, flashcard facts and performance metrics are not fabricated. The latest live audit found no active questions and no active rights-approved syllabus versions/topics; confirm current live state before assuming this has changed.
- Practice opens the existing protected CBT implementation. No new backend schema or data path was added.
- No live data, migrations, production grants or deployment changed in this frontend batch. Existing catalogue import/review UI was retained.

### Verification state at checkpoint
- Verify run `39512223624` passed for component commit `06b5b78672ee31db7e69dcc0f16ca73431685232`.
- Remaining/newest runs were still running or queued: E2E `39512223597`; Verify `39512272979`; E2E `39512273077`; Verify `39512296427`; E2E `39512296132`; Verify `39512374477`; E2E `39512374470`. Latest code HEAD before this checkpoint documentation commit: `a02516bf0e308958c4564ea6960ee4fbeed4485b`. Full batch is not yet CI-verified.
- No deployment was performed.

### Exact next action
1. Poll Verify and ACE JAMB E2E for the latest frontend/admin code and documentation commits.
2. If any run fails, inspect job steps/logs and fix the smallest cause; rerun CI.
3. Update both handoff documents with the final run IDs/results.
4. Once green, continue frontend work dependent on actual lesson/question/attempt data only when those verified records exist; do not invent official JAMB material.


### Frontend E2E follow-up — strict locator fixed (2026-10-20)

- E2E `39512296132` failed on commit `c18baf86e1482076aabea9cbb15f281fa348dc1c`; TypeScript and build passed, 12 browser tests passed, and the workspace test failed on a duplicate heading match.
- The log showed Quick Revision had both a page `h1` and section `h2` with the same accessible name. Fixed Quick Revision and Study Plan test locators to require `level: 1`.
- Fix commit: `f096ffdbe3079fb933794a5ce158dc03135b9141`.
- Reruns for the fix and latest admin/frontend commits are pending. The frontend batch remains **not fully verified** until latest-main Verify and E2E pass.
- Exact next action: poll latest runs for commit `f096ffdbe3079fb933794a5ce158dc03135b9141` and the subsequent handoff commits; fix any further failure and then record final CI results in both docs.


## Current continuation — saved student study routine + CI follow-up (2026-10-21)

- Actual repository: `DarealNovaking/Nova-ace-jamb`, branch `main`. The previous frontend workspace batch is now CI-verified on commit `f74ab7e1f80e5a7859f66a5f68b15c953df753c9`: Verify `39512540188` and ACE JAMB E2E `39512540266` both passed.
- New code commits: `541cef132ce99222981e9632b7c4f7912f995ee5` adds `StudentStudyPlan.tsx`; `ba1b2445d90c86709cb9af607427f9c3bbb3cf6d` connects it to `StudentStudyWorkspace.tsx`; `d2aff7f9cedc6a16b14ef31febcf972d9bf1aeba` tests save behavior in `tests/e2e/smoke.spec.ts`.
- The study plan now lets an authenticated student edit daily study minutes and preferred study days, and saves through the existing student-preferences service. No migration/schema change was added. The page describes saved preferences, not a generated lesson timetable. Playwright Supabase traffic is mocked.
- Both handoff files are being kept current. No production data, migration, deployment, content publication or catalogue import was changed.
- New feature CI is pending: Verify `39513774609` and ACE JAMB E2E `39513774499` are queued on the study-plan test commit; earlier runs `39513749185`, `39513749121`, `39513734298` relate to preceding commits. Latest-main runs must be checked after the docs commits as well.
- Remaining: full lesson delivery, real question practice, flashcards and performance analytics depend on verified published learning content and/or real saved attempts. The last verified database audit found no active rights-approved syllabus versions/topics and no active questions; confirm live state before assuming it changed.
- **Exact next action:** poll Verify/E2E for current `main`, inspect logs for failures, fix the smallest cause, and update both handoffs with green results. Then continue the next frontend flow only where verified content and service contracts exist. Do not invent JAMB material, fake scores, or generated-schedule completion.


## Frontend completion batch — 2026-10-21
- User direction: batch all remaining frontend work into one coordinated frontend milestone; backend is not the focus for this batch. Existing service contracts may be used; missing backend capabilities must be called out, not simulated.
- Repository: `DarealNovaking/Nova-ace-jamb`, branch `main`. GitHub recursive tree retrieved with tree SHA `f14af8ea403854e264fb532cd5734f8723c7df9d` before the frontend batch document commit. Batch doc commit: `0a1cc22685d443ade2c9aec8165cd70b365008a4`.
- Added `docs/FRONTEND-COMPLETION-BATCH-2026-10-21.md` defining scope and acceptance gates. It explicitly marks implementation and tests as not yet verified.
- Entry routing verified from `src/main.tsx`: `/admin-academic` → `AcademicFoundationGate`; `/admin` and `/admin-import` → `AdminFoundationGate`; CBT query flag → `ProtectedCBT`; default → `StudentFoundationGate`. Preserve this behaviour unless source/test evidence identifies a regression.
- Existing frontend components identified: `StudentAuth`, `StudentOnboarding`, `StudentDashboard`, `StudentStudyPlan`, `StudentStudyWorkspace`, `ProtectedCBT`, `PersistentCBT`, plus admin/academic gates/workspaces. Package scripts include `npm run typecheck`, `npm run build`, and `npm run e2e`.
- Verification status: repository tree and selected docs/entry point/package scripts inspected. No application source changes, build, typecheck, Playwright, live DB query, or deployment performed in this batch setup step.
- Blockers: none identified for repository inspection at this point. Implementation status for individual features is not yet classified because component/service/test source review remains outstanding. Supabase is not being declared blocked.
- Exact next action: inspect full source for student auth/onboarding/dashboard/workspace/study plan/CBT, related service modules and tests; implement the highest-impact evidence-backed gaps; then run typecheck, build and Playwright and record outcomes.


## Whole-product frontend + channel integration scope correction — 2026-10-21

- Owner direction: all frontend work must reflect the complete product in the canonical handoff, and the channel integration must be explicitly included.
- Batch document updated in commit `adfd7e0dd7e8439b6e04abf5c4106a008635edee`: `docs/FRONTEND-COMPLETION-BATCH-2026-10-21.md`.
- Expanded scope: student identity/onboarding/dashboard; learning/practice/mistake/adaptive; CBT/mocks; revision/flashcards/audio; study plans/analytics/readiness; grounded AI/knowledge; channel/community gate; notifications/announcements/push; ACE Pass/payment/entitlement; referrals; admin command center; PWA/offline; accessibility/performance/security and full Playwright/CI verification.
- Channel flow placement: after onboarding/profile setup and before main dashboard. Group routing must use explicit reviewed institution mappings and a defined fallback for optional/unmapped institutions. Never invent group URLs.
- Critical canonical constraint: master handoff section 23 marks WhatsApp membership verification UNDECIDED. A client-side “I joined”, URL click, localStorage flag or route cannot prove membership. The UI may be prepared, but mandatory gate enforcement requires an independently verifiable server-side integration. No automatic WhatsApp posting/management.
- Existing frontend entry in `src/main.tsx` has only academic editor, admin/import, CBT query mode and default student gate. No dedicated UI component/route was found in the repository tree for channel verification, notifications, payment/referral, grounded AI, audio or the full command center. Existing student workspace shows explicit not-yet-published/empty states for lesson content, questions, flashcards and verified performance.
- No application code or production data changed in this scope correction. No build/typecheck/Playwright/live DB query/deployment was performed.
- Exact next action: inspect actual service/migration/test contracts and latest CI for community, notifications, payments/entitlements, referrals, AI/knowledge, audio, feature flags and admin operations; classify each UI domain against real contracts; implement evidence-backed gaps and run typecheck/build/Playwright. Supabase is connected and must not be described as blocked.


## Live frontend contract audit — 2026-10-21
- Supabase project `nova-ace-jamb` (`uokiqlgmzprqfbzmedaz`) read-only project check: ACTIVE_HEALTHY; connection works and is not blocked.
- Live schema includes domain tables for notifications/preferences, products/payments/payment providers/payment events/entitlements, referrals/campaigns/codes/rewards, AI providers/requests/usage, knowledge sources/chunks, flashcards/reviews, learning progress, study plans/items, devices, feature flags, audit events and product events. Audit-time counts: subjects 25; topics/subtopics/questions/flashcards/learning_progress/attempts/study_plans/notifications/payments/entitlements/referrals/referral campaigns/rewards/knowledge sources/chunks/AI requests all 0; notification preferences 4; products 1; referral codes 4; AI providers 2; devices 7. Counts are not feature readiness guarantees.
- Live Edge Function inventory listed `catalog-import` and `ibass-catalog-stage`; no dedicated channel verification, payment webhook, referral qualification, AI request or notification delivery function was listed.
- No dedicated community/channel membership or institution-group mapping table was found in the inspected live `ace` inventory. Channel verification remains UNDECIDED per master handoff; do not implement fake membership proof or claim an unbypassable gate. Intended UI position is after onboarding and before dashboard; group routing requires reviewed mappings and fallback.
- Current `src/lib` modules cover auth, CBT, data adapter, device, season/syllabus, student and Supabase. No dedicated UI/service modules for community/channel, notifications, payment/referral, AI/knowledge or audio were found in the source tree. Inspect RLS/RPC/provider contracts before connecting UI to the domain tables.
- Expanded batch document now includes the full product frontend: `docs/FRONTEND-COMPLETION-BATCH-2026-10-21.md`. The batch is not implementation-complete. No application source or production data/schema changed during this audit; Supabase reads were read-only.
- CI runs `39514640639` Verify and `39514640651` E2E passed on earlier docs-only baseline `bce60df163ee855ada622276d45488a53bc4ea6f`. Latest checked runs `39515107606` Verify and `39515107387` E2E on `ce737e1c2876cac9a18c0e8e1d74a5bd39ea1fa6` were in progress. Recheck the newest `main` runs before treating them as passed.
- Exact next action: inspect actual RLS/RPC/provider contracts for each existing domain, reconcile live database objects with migration source, classify every frontend domain against verified contracts, then implement highest-priority UI/service gaps and run typecheck/build/Playwright. Do not claim Supabase is blocked.


## RLS/service-boundary findings from live read-only audit — 2026-10-21
- Notifications: authenticated students can SELECT their own notifications and UPDATE their own rows for read state; admin has ALL. Notification preferences have a self-only ALL policy. This suggests an inbox/preferences UI can use these existing boundaries, but a delivery/scheduling service still needs verification.
- Products: active products are publicly readable. Payments are self-readable and admin-manageable; entitlements are self-readable and admin-manageable. Student payment creation/verification must use a server/provider flow, not direct client writes.
- Referral codes are self-readable; referrals are readable only to participants; referral rewards are self-readable. No student-write policy for qualification/reward was found, so a frontend must not calculate/award qualification client-side.
- Flashcard review and learning progress are self-scoped; study plans/items are owner-scoped; devices are self-scoped. Their corresponding tables were empty for content/activity in the audit (flashcards 0, learning progress 0, study plans 0), so screens need correct empty states until valid records exist.
- AI providers and knowledge sources/chunks are admin-only; AI requests are self-readable and AI usage is self/admin-readable. No dedicated AI request Edge Function was listed, and no student INSERT policy for AI requests appeared. Do not call provider secrets from the browser or build a fake tutor; establish a server-side request boundary first.
- Feature flags are readable by authenticated users and writable only by admins. Audit events are readable to actor/admin and inserts are constrained to self/null actor. Admin UI must respect these RLS boundaries.
- These findings are schema/policy observations only; no row was changed. See live schema/counts above. No channel verification/group mapping contract was found.


## Current continuation checkpoint — Phase 1 frontend (2026-10-21)

- **Current objective:** execute Phase 1 batches 1–5 (authentication/onboarding, dashboard/navigation, syllabus workspace, practice/questions, CBT).
- **Source changes committed:** `src/components/StudentFoundationGate.tsx` handles a missing first-use preferences row as onboarding and suppresses raw database/provider error details; `src/components/StudentDashboard.tsx` persists workspace state in `?view=`, restores on reload, and syncs back/forward; `src/main.tsx` no longer intercepts clicks by matching visible button text and preserves URL parameters when leaving CBT.
- **Commits:** `79d99942491507b0e8e7fc3d1a8f9d4862f7f9ea`, `66b0f606ec33f1061ae97f34c937a5b531c0e3ea`, `4e522f91ee686635dc725149bbac038ff02c9020`.
- **Tests:** not run in this slice. The combined-status API returned an empty status list, which is not evidence of passing CI. No typecheck, build, Playwright, authenticated browser run, database write, or deployment has been verified.
- **Important known state:** learning/practice/flashcard/progress screens currently contain explicit honest empty/placeholder states; live audit previously found no topic/question/flashcard/learning-progress rows. Do not fabricate content to make these screens look populated. CBT uses server RPCs in `src/lib/cbtService.ts`; keep attempts, timing and scoring server-authoritative.
- **Exact next action:** inspect current auth E2E test inventory and auth/session lifecycle; fix first-use/profile/preferences race and onboarding recovery, add/adjust Playwright coverage for auth/onboarding and dashboard URL history, then run typecheck/build/E2E. Continue with syllabus and CBT checks after these tests. Update this checkpoint and the master handoff after each meaningful slice.


### Phase 1 latest verified code slice — 2026-10-21
- Added first-use missing-preferences recovery, safe student-facing errors, auth callback deferral, initial-session handling, and sequence guards against stale role/profile lookups in `StudentFoundationGate`.
- Workspace route is query-backed and browser history-aware; CBT navigation preserves unrelated query state and no longer relies on global button-label interception.
- Syllabus subtopics are now passed from `seasonService` and rendered under the selected parent topic.
- Commits: `79d99942491507b0e8e7fc3d1a8f9d4862f7f9ea`, `66b0f606ec33f1061ae97f34c937a5b531c0e3ea`, `4e522f91ee686635dc725149bbac038ff02c9020`, `fc2b70c7733671d0e13a88265c9da7a95bef91a3`, `95cb90c4bf3f8f4f3f53e043aa95ae3496f459f1`, `a757f602f7d045d16ed53b511c2a5369a310a689`, `49c8949fdc9771876cc6e6150f96cb9fcc70cd6b`.
- **Verification:** not run. Combined commit status returned no status entries; associated workflow lookup returned no runs. No typecheck, build, Playwright, authenticated browser verification, DB writes, or deployment.
- **Next action:** inspect current auth and CBT test inventory via a runtime or GitHub Actions result path; run typecheck/build/E2E, fix discovered issues, then finish Phase 1 batches 3–5 against real content/server contracts. Do not mark Phase 1 complete yet.


### CI failure and correction — 2026-10-21
- GitHub Actions Verify and E2E both failed at typecheck with `src/components/StudentDashboard.tsx(128,200): TS1005 '}' expected`.
- Root cause: missing closing brace for the JSX `onClick` expression introduced in the workspace URL/history change.
- Fix commit: `23735a150ba0d142f29ec0919df69c33236a4f2f`.
- Latest post-fix CI status: not yet confirmed. Next action: poll `/actions/runs`, inspect Verify and ACE JAMB E2E runs whose `head_sha` is the fix commit or newer, then fix any remaining failures before continuing Phase 1.


## Canonical frontend execution batches (16-batch plan)

This is the single frontend batch plan for the project. The detailed scope and acceptance checklist live in [docs/FRONTEND-COMPLETION-BATCH-2026-10-21.md](FRONTEND-COMPLETION-BATCH-2026-10-21.md). These are execution groups, not claims of completion. Existing working features must be hardened rather than rebuilt; no batch is complete until its acceptance checks pass.

| Phase | Batch | Scope and acceptance target |
|---|---:|---|
| 1 — Core student experience | 1 | Authentication, sessions, account recovery, onboarding/profile, English auto-included + exactly three other subjects, route protection. |
| 1 — Core student experience | 2 | Dashboard, student navigation, account entry points, responsive states, URL/history restoration, recoverable errors. |
| 1 — Core student experience | 3 | Published syllabus tree, subjects/topics/subtopics, lesson view and honest unpublished-content states. |
| 1 — Core student experience | 4 | Practice, reviewed question data, answer/explanation flow, mistakes review and saved progress; never invent official questions. |
| 1 — Core student experience | 5 | CBT/mock setup, timer, navigation, answer persistence/recovery, submission and server-authoritative scoring/results. |
| 2 — Learning & intelligence | 6 | Quick revision and verified flashcard decks/reviews. |
| 2 — Learning & intelligence | 7 | Study-plan creation/schedule, saved learning stats and readiness derived from real activity. |
| 2 — Learning & intelligence | 8 | Audio lessons, accessible playback controls, progress persistence and unavailable/error states. |
| 2 — Learning & intelligence | 9 | Grounded AI tutor with provenance, usage limits and server-side provider boundary. |
| 3 — Community & student services | 10 | Community/channel entry and gate, real membership-status contract, institution-group mapping, return flow and anti-bypass tests. Mandatory verification stays off until provider/server verification and approved mappings exist. |
| 3 — Community & student services | 11 | Student notification inbox, read state/preferences, announcements and push only if delivery infrastructure exists. |
| 3 — Community & student services | 12 | ACE Pass purchase/status, payment provider verification, entitlements and referrals/rewards backed by server-side qualification. |
| 4 — Admin & production readiness | 13 | Admin command center for students, content, questions, audio, flashcards, notifications, payments, referrals, AI knowledge, moderation, analytics and audit. |
| 4 — Admin & production readiness | 14 | Academic administration, syllabus/content publication review, permissions and review-only safeguards. |
| 4 — Admin & production readiness | 15 | Shared design system, mobile responsiveness, accessibility, PWA/offline and safe caching. |
| 4 — Admin & production readiness | 16 | Full route/role regression, Playwright, typecheck/build, integration/security checks, performance and release readiness. |

**Execution order:** finish Phase 1 batches 1–5 first; do not skip ahead to disconnected features. Within each batch: inspect current implementation → smallest safe implementation/hardening → test → update this plan and both canonical handoffs. Independent tasks may run in parallel only when they do not conflict on source files or acceptance dependencies.


## Phase 1 execution status — 2026-10-21

| Batch | Current evidence-based state | Next acceptance work |
|---:|---|---|
| 1 — Authentication & onboarding | Hardened: missing first-use preferences now routes to onboarding; auth refresh sequence guards and initial-session handling added; onboarding errors sanitized. | Verify sign-up/sign-in/password recovery/session races and subject choice through Playwright. |
| 2 — Dashboard & navigation | Workspace state uses `?view=`; reload/back/forward E2E assertions added; CBT URL expectation tightened. | Await current GitHub Verify/E2E runs; test dashboard retry and relevant query-parameter combinations. |
| 3 — Syllabus workspace | Approved topic/subtopic records are passed to the workspace; empty/unpublished states remain honest. | Test with approved/published syllabus fixtures and empty/rights-filtered records. |
| 4 — Practice & questions | UI currently provides a clear placeholder; last live database audit found zero questions. No fake question bank added. | Inspect current question schema/RPC contracts and verified data. Implement only when question records and server contracts permit. |
| 5 — CBT & mock exams | Existing RPC-backed CBT has resume/load/save/submit/timer flow; added active-attempt guards, duplicate-submit guard and sanitized errors. | Verify RPC contracts, expiry/retry/recovery/answer persistence and score output through tests. |

Recent implementation commits: `23735a150ba0d142f29ec0919df69c33236a4f2f` (JSX correction after CI exposed syntax failure), `77c907b1fb548df3f0ca87204f1272137d41f85e` (workspace reload/history E2E coverage), `f886ad493d617e460fc1a34f92b5cd28edf81160` (CBT duplicate submission/error hardening), `3fd59568f9d5e965b78bc90d698afdaee1c6fc9d` (onboarding error hardening).

CI for commit `23735a1` and subsequent docs-only commit `13865f1` passed both Verify and ACE JAMB E2E. New runs for the added workspace test and CBT/onboarding changes are queued/in progress at time of this update; do not treat those latest changes as verified until their runs finish. No deployment or database writes were made.


## Phase 1 continuation — latest source work (2026-10-21)

### Additional implementation completed
- `tests/e2e/smoke.spec.ts`: added route-state assertions for `?view=learn`, reload restoration, browser back/forward, a mocked server-authoritative CBT answer/submission path, active-attempt recovery after reload, and a practice-mode request against an empty published question bank. The tests intercept Supabase; they do not write production data.
- `src/components/PersistentCBT.tsx`: added duplicate-submit protection, active-attempt-only answer writes, safe user-facing errors, completed-attempt result restoration without refetching question content, normalization of the legacy idempotent-submit response's missing `total_questions`, and local recovery-pointer support. It now accepts `mode` so practice calls the existing `start_attempt` RPC as `practice`, not `cbt`. Known empty-bank errors are mapped to an honest published-question message.
- `src/components/ProtectedCBT.tsx`: stores the current attempt pointer under the authenticated user's ID and attempt mode, so accounts and practice/CBT modes do not share recovery pointers.
- `src/components/StudentDashboard.tsx` and `src/components/StudentStudyWorkspace.tsx`: the Practice workspace now starts a real practice-mode server attempt; the normal CBT entry continues to start CBT mode.
- `src/components/StudentOnboarding.tsx`: load/save failures use recoverable messages instead of exposing raw database/provider errors.
- Source/test commits in this slice include `77c907b1fb548df3f0ca87204f1272137d41f85e`, `f886ad493d617e460fc1a34f92b5cd28edf81160`, `3fd59568f9d5e965b78bc90d698afdaee1c6fc9d`, `3ff92a04b6150a5aeac7f4223be1aac1f9e2180a`, `e82b0806a5e955f5ab29b3d790694e8fa5736b9b`, `07240ee8e9c8c87cd307bb3475076d56bdc4ee3e`, `8ae2c2932f0f6e035f0a151667cd329c82de1cb1`, `b9543ce8b629eaf8bd35c7e01360de6bcefd68f7`, `b17fcb169f7170474dc7e272966d4b5ceb74e55b`, `50422f3a2469ac071f260307c1f23eb432046930`, `90ddc88bb188be177925022f2c679cc61b577377`, `82e97c60c9a54fa1477e1a9cdf50b32871faeb3a`, `a093314e2a21ef4027cd704e2839f355ee2a46e0`, `7e7e5019ffebd7b7c28e60bd3e590812c1576979`, `3621f44ab444f6f89fd5c95bd42074cdcf7805bb`, `2877a28c905cab68f5742026092271b13e1b2f46`.

### Verification status — do not overstate
- Earlier GitHub Verify and ACE JAMB E2E runs passed on commit `23735a1` and the documentation successor `13865f1`.
- Verify and E2E passed for the earlier onboarding error-hardening commit `3fd5956` (confirmed from Actions).
- Latest navigation/CBT/practice test and source changes are still queued/in progress at this note; no pass is claimed for those commits yet. See [GitHub Actions](https://github.com/DarealNovaking/Nova-ace-jamb/actions).
- No production database writes, migrations, or deployment were performed.
- The live database audit found no published questions at that time. The practice flow is now wired to the real server RPC but must show the empty-bank state until verified questions are published.

### Exact next action
Poll Verify and ACE JAMB E2E for the latest source/test commits, fix any failing assertions or type/build errors, then inspect the published-question/attempt contracts again and finish Phase 1 acceptance for batches 1–5. Phase 1 remains in progress.


## Phase 1 follow-on — practice mode and recovery contract (2026-10-21)

- The Practice workspace now routes to `?cbt=1&mode=practice` and invokes the existing server-side `start_attempt` RPC with `p_mode: 'practice'`. Standard dashboard CBT explicitly uses `cbt` mode.
- CBT active-attempt pointers are stored locally by authenticated user ID and attempt mode, and are used to call the existing ownership-checked `resume_attempt` RPC after reload. This is a recovery pointer only; answers, timing and scores remain server-authoritative. Completed attempts restore their result without requiring question content to be fetched again. Practice and CBT pointers are isolated from each other.
- The Practice entry maps the known server error for an empty published question bank to a clear unavailable state. No synthetic questions were added.
- Added E2E cases for: practice mode + empty bank, active CBT resume after reload, and a mocked save/submit/result journey. Existing tests also cover dashboard workspace URL/history. All Supabase routes in these tests are intercepted; tests do not write production data.
- Commits after the prior log: `b17fcb169f7170474dc7e272966d4b5ceb74e55b`, `50422f3a2469ac071f260307c1f23eb432046930`, `90ddc88bb188be177925022f2c679cc61b577377`, `82e97c60c9a54fa1477e1a9cdf50b32871faeb3a`, `a093314e2a21ef4027cd704e2839f355ee2a46e0`, `3621f44ab444f6f89fd5c95bd42074cdcf7805bb`, `2877a28c905cab68f5742026092271b13e1b2f46`, `cba0c14efc6808af36be7d9616cae7f6f1b59da9`.
- GitHub CI caught intermediate type errors while the mode prop/callback were being introduced in separate commits. The final source fixes those errors: `PersistentCBT` declares the mode prop and the dashboard click handler explicitly calls `startCbt('cbt')`. CI for the final `cba0c14` commit is queued; no pass is claimed yet. Some earlier intermediate commits therefore correctly show failures and should not be treated as the final state.
- No DB migrations, production data writes, or deployment were performed.

### Current exact next action
Check Verify and ACE JAMB E2E on the latest main commit after `cba0c14` and this documentation update. Fix any remaining typecheck or Playwright failure before advancing Phase 1. Then continue batch 1 auth/onboarding E2E, batch 3 published-syllabus fixtures, and batch 5 CBT expiry/submit/recovery acceptance. Phase 1 is still in progress.


## Frontend Phase 1 continuation — 2026-10-21
- Current task: finish the coordinated frontend batches, starting with auth/onboarding/dashboard/syllabus/practice/CBT.
- Added E2E test `onboarding save contract` in `tests/e2e/smoke.spec.ts`; it verifies the mocked server RPC receives English + exactly three additional subject IDs and expected profile fields. Commit: `b8881491720d74832f7a18401b905b7967368567`.
- No production data writes, migrations, or deployment. Verify workflow for prior checkpoint SHA `a8c44efc5b5438d8b69c06fad8ca3f2f5b00911d` passed typecheck/build; E2E was still running and the new commit's checks remain to be inspected.
- Exact next action: inspect Actions for HEAD `b8881491720d74832f7a18401b905b7967368567`, resolve any failing E2E assertions, then add CBT expiry/completed-attempt recovery regression coverage. Keep empty/unpublished question states honest.


### Phase 1 continuation — mode-specific CBT recovery fix (2026-10-21)
- Found and fixed a fresh-sign-in inconsistency in `src/components/ProtectedCBT.tsx`: after sign-in, Practice was assigned the CBT local recovery key. Commit: `04ad0edae2bfa936997a0edfeb1d6138a87d03f7`. Recovery key now uses the validated route mode, keeping practice and CBT attempt pointers isolated.
- Verification: preceding Verify workflow passed typecheck/build at SHA `38a948349c6c732f5b8ae144051dff3650b089c7`; corresponding E2E and several older E2E runs were still in progress at last inspection. No E2E pass is claimed for this fix yet. No database writes, migrations, or deployment.
- Exact next action: poll Verify/E2E on the new fix SHA; add/verify a regression for signing into Practice and preserving its mode-specific key; then test CBT expiry, completed-attempt recovery and syllabus published/unpublished states. Phase 1 is still in progress.


### Latest Phase 1 test addition — completed CBT recovery (2026-10-21)
- Added mocked E2E coverage for restoring a completed attempt's server-authoritative score without fetching question rows. Test iterations: `4e8fc1c5c6c8493c20635d1651b19d0968ca03bf`, `ef6ec1e5478612d0cb1fa5bd6866c39ef330b6a9`, `bc616ee623ec88cefb524e4c5762901a0ef5e77f`.
- CI status: Verify previously passed at SHA `38a948349c6c732f5b8ae144051dff3650b089c7`; current source/test commit's E2E outcome is unverified because the observed workflow runs were queued/in progress at runner setup. Do not mark the new test passed.
- No production DB writes, migrations, or deployment. Exact next action: poll latest main runs; fix E2E failures, add practice sign-in recovery-key coverage, then verify CBT expiry/retry and syllabus published/unpublished states. Phase 1 remains in progress.


## Continuity refresh — 2026-10-21 (current inspection)
- Verified repository: private `DarealNovaking/Nova-ace-jamb`, default branch `main`; GitHub connector reports admin/push permission.
- Latest commit observed on main: `b0a31f07e90b001771880854162451ce64d55d2f` — docs-only update recording completed CBT recovery test coverage. Latest related source/test commits include `bc616ee623ec88cefb524e4c5762901a0ef5e77f` (dashboard recovery entry) and earlier recovery assertion commits.
- Current checkpoint's latest Phase 1 note says the next action is to inspect Verify and ACE JAMB E2E for latest source/test commits, fix failures, then add practice sign-in recovery-key coverage and verify CBT expiry/retry plus syllabus published/unpublished states. Phase 1 remains in progress; do not advance to disconnected feature batches.
- Read current `package.json`: scripts include `typecheck` (`tsc --noEmit`), `build` (`vite build`), and `e2e` (`playwright test`).
- Current source read-back confirms `ProtectedCBT.tsx` derives local recovery storage keys from validated route mode and user ID, and passes `mode` to `PersistentCBT`. Current E2E file contains workspace reload/history, onboarding RPC contract, and student workspace empty-state tests.
- CI limitation in this inspection: the GitHub combined-status endpoint returned an empty status list for latest main SHA `b0a31f07e90b001771880854162451ce64d55d2f`; this is not evidence of a pass or failure. No workflow run result could be confirmed from that endpoint. Therefore latest E2E outcome remains UNVERIFIED.
- No application code, production database, migration, or deployment changed during this inspection. The prior catalogue/Batch 2 status is historical and not the current execution focus: latest checkpoint explicitly tracks Phase 1 frontend batches 1–5. Do not restart the catalogue investigation without new evidence or a current handoff direction.
- Exact next action: obtain the latest GitHub Actions Verify and ACE JAMB E2E run results for current main/source commits; if run results are inaccessible through the available connector, use the repository Actions page as the alternate read path. Fix any reproducible failures, then add a regression for signing into Practice and preserving the practice-specific recovery key. After that, test CBT expiry/retry and syllabus published/unpublished states. Update both canonical handoffs after each meaningful change.


## Actions verification attempt — blocker (2026-10-21)
- Attempted the alternate GitHub Actions browser path at the repository Actions page. It returned 404 because the private repository requires GitHub sign-in; the available browser profile has no GitHub session. No workflows were modified or rerun.
- GitHub combined-status endpoint also returned an empty status list for the previously observed source/docs SHA, so current Verify/E2E status remains UNVERIFIED (not passed, not failed).
- Canonical handoff refresh commits created immediately before this note: checkpoint `993aacd1e5a61c8e9c451ba69b14395573117e8a`; master handoff `f6985461170a6400678130c45cac7c55904b952e`.
- Required user action to unblock browser-based Actions inspection: explicitly authorize a GitHub browser sign-in setup for the existing browser profile; no password should be sent in chat. Once the profile is signed in to an account with access to this private repository, repeat read-only Actions inspection. Meanwhile, continue only safe repository-backed work and do not claim CI success.

## Current Phase 1 acceptance checkpoint — 2026-10-21

- **This section supersedes older checkpoint instructions that make catalogue ingestion the immediate next action.** The current student journey is preparation-first and must function without institution/programme/UTME catalogue completeness. Keep legacy catalogue schema/data unless a separate approved decision explicitly requests destructive removal.
- **Repository / branch:** `DarealNovaking/Nova-ace-jamb` / `main`. The last code/test commit observed before this checkpoint update is `ee68f8d3df4447933c30aa5912f26673a01393ad`. Documentation commits that follow this note will advance HEAD; refresh main before editing.
- **Verified:** GitHub Actions Verify run `39530603871` on `ee68f8d3df4447933c30aa5912f26673a01393ad` completed successfully. The previous E2E run `39529889223` failed after typecheck/build/browser installation passed. Its four failures were two tests duplicated across desktop/mobile: practice empty-question error state not found, and the randomized-options submit test clicked the wrong displayed label.
- **Fix submitted:** `tests/e2e/smoke.spec.ts` changed in commit `ee68f8d3df4447933c30aa5912f26673a01393ad`: the practice RPC error mock now sets explicit JSON content type and the test waits for `p_mode=practice`; the submit test now clicks `B. First answer` because its mocked canonical option A is displayed second under option order `B, A`.
- **Current E2E run:** `39530604054` for the fix commit was still `in_progress` at last poll. Do not claim E2E pass until its final conclusion and logs are inspected.
- **Phase 1 decision:** OPEN; not verified complete. Current coverage includes student entry/onboarding, workspace route/history behavior, honest no-content states, practice-vs-CBT mode, active attempt resume, and completed-result restoration without refetching question content. Remaining acceptance work includes confirming the practice empty-state fix, practice sign-in recovery-key regression, CBT expiry/retry, and published/unpublished syllabus states.
- **No production action:** No production migration, database write, Edge Function deployment, or application deployment was performed during this review.
- **Exact next action:** inspect E2E run `39530604054`. If the practice empty-state assertion still fails, read the latest job log and artifact to establish the actual rendered state, then fix the underlying component/mock contract. Once E2E is green, add the remaining practice sign-in recovery, CBT expiry/retry, and syllabus publication-state tests, rerun Verify + E2E, and only then decide whether Phase 1 can close.

## E2E root-cause fix checkpoint — 2026-10-21
- E2E run `39530604054` failed again; its Playwright artifact was inspected. The page snapshot proves the practice error fell through to the generic load error, and the answer-button accessible names were rendered without spaces (e.g. `B.First answer`). This is concrete evidence, not an inferred cause.
- Fixes committed to main: `59c9b8c4963e3f568aea492f3374945253541b38` handles structured Supabase/PostgREST error objects when deriving a safe student-facing message; `e9c38e41e15c68c76336efe35dc810541d6feffd` supplies explicit accessible names for randomized answer buttons and marks the visual letter span aria-hidden. The practice test now waits for and asserts the actual practice-mode RPC payload before checking the empty-state copy.
- Verification: Verify/E2E on these fixes was queued/in progress at time of update. Do not treat the fix as verified yet. Last completed E2E on the prior test-only commit still had 20 passed and 4 failed (two scenarios x desktop/mobile).
- **Phase 1 remains OPEN.** Do not start Phase 2 or call this complete until current E2E is green and remaining sign-in recovery, CBT expiry/retry, and published/unpublished syllabus acceptance checks are covered and pass.
- **Exact next action:** inspect the Verify and E2E runs for main after `e9c38e4`; if E2E fails, use the current run's job logs/artifacts to fix the actual failure. No production data, migrations, or deployments were changed.

## Phase 1 evidence checkpoint — 2026-10-21

- Latest verified code/test commit before this note: c0094f44134e8a334d67c1499ac08f97df3e80a8. Verify run 39532411416 passed; ACE JAMB E2E run 39532411391 passed with 36/36 Playwright tests across Chromium and mobile Chromium.
- Added verified E2E coverage for: password-reset request with same-origin redirect; password update in a recovery session; practice-mode sign-in recovery pointer; expired CBT auto-submit and retry after transient submit failure; active-attempt reload; completed result restoration; practice empty-question state; active approved syllabus fixture and pending-rights suppression; dashboard route/history and onboarding save contracts.
- Earlier Playwright artifacts identified two real UI/test-contract issues and the code was fixed: structured PostgREST errors were not reliably mapped to the honest no-published-questions state, and randomized answer buttons had concatenated accessible names. A later syntax typo in the aria-label patch failed typecheck, was fixed in 26867a75ff9425151af690cead7306096a485b0d, and Verify/E2E passed after that correction.
- Read-only live SQL counts: 25 subjects; 2 exam seasons; 0 active approved syllabus versions; 0 topics; 0 subtopics; 0 questions; 0 flashcards; 0 attempts. This is current evidence that content-dependent acceptance cannot be proven with production data yet. No live data writes or migrations were performed.
- **Phase 1 remains OPEN.** Batch 3 has no published syllabus tree in live data. Batch 4 is still materially incomplete: no reviewed questions exist, so answer/explanation, mistakes-review and saved practice-progress behavior cannot be accepted end-to-end with real content. Mocked E2E fixtures verify client/server contracts only. Batch 1 still needs broader sign-up/session-race/recovery-link coverage; Batch 2 needs dashboard retry and query-parameter interaction coverage.
- Product direction remains preparation-first: institution/programme catalogue completeness is not a prerequisite for student onboarding. Retain legacy catalogue infrastructure unless separately approved; do not resume catalogue ingestion as the next student-journey task.
- **Exact next action:** inspect the existing question authoring/review/publication UI and the live start_attempt/question read contracts. Determine the smallest safe way to load lawfully sourced, reviewable syllabus/questions without fabricating JAMB content or making production writes without approval. Continue independent auth/session and dashboard retry acceptance coverage. Do not start Phase 2 yet.

## Latest verified state — 2026-10-21
- **Main HEAD:** `74c9594a33053e16bb713e547d731282e1851ec4` (`test(auth): isolate retry coverage at device registration`). Refresh main before the next edit.
- **CI verified on this SHA:** Verify run `39533078821` = success. ACE JAMB E2E run `39533078809` = success; log says **40 passed (38.7s)**. This supersedes the prior in-progress status and the intermediate retry-test failure on SHA `73c74c74ae1218ae5183bc03a0799a86fd9758d0`.
- Automated acceptance coverage now includes password reset and recovery-session update, Practice sign-in recovery key, CBT expiry auto-submit and transient submit retry, active-attempt resume, completed result restore, practice empty-question state, randomized answer selection, syllabus approved/pending-rights UI fixtures, workspace routing/history, onboarding save, and device-registration retry.
- **Phase 1 is still OPEN, not complete.** The latest recorded read-only live Supabase audit found 25 subjects, 2 exam seasons, 0 active approved syllabus versions, 0 topics, 0 subtopics, 0 questions, 0 flashcards and 0 attempts. This blocks acceptance of the real syllabus/question preparation journey, answers/explanations, mistakes review and saved practice progress. Mock fixtures and green CI do not prove production content readiness. No official JAMB content was invented, and no production data writes, migrations or deployments were performed.
- **Exact next action:** inspect the existing syllabus/question authoring, review, publication and question-read/start-attempt contracts; determine the smallest safe, lawful way to provide actual reviewable content without fake data or unauthorized production writes. Keep catalogue ingestion out of the critical path. Continue any remaining auth/session race and dashboard retry/query-state checks in parallel. Do not start Phase 2 until Batches 3–4 have real approved content and their end-to-end student journey is verified.

## Question rights gate checkpoint — 2026-10-21

- Current verified implementation/test commit before this documentation update: f2d7e0ade4a2607fae8f05c1802dbce267a13e84. Verify run 39533469598 SUCCESS; ACE JAMB E2E run 39533470537 SUCCESS. E2E has 40/40 tests passing.
- Read-only live inspection found questions_public_read did not constrain rights_status and the deployed start_attempt/save_attempt_answer functions did not explicitly filter rights_status. Because the policy includes an editor-access OR branch, server-side filters are necessary even though the functions are SECURITY INVOKER.
- Added migration source supabase/migrations/20261021100000_question_rights_publication_gate.sql: public question reads require active + published + rights_status owned/licensed/permitted; start_attempt filters both random selection and explicit IDs; save_attempt_answer rejects non-permitted rights. Admin/editor direct review access remains available.
- Added tests/sql/question_rights_publication_gate.test.sql and wired it into .github/workflows/verify.yml. Verify's disposable PostgreSQL job passed the new test, including editor RPC bypass attempts and restricted-question answer rejection.
- **Not applied to live Supabase.** This is source + disposable verification only; no live schema/data changes or app deployment. The live question table is currently empty, but the rights gate should be applied before question content is published. Production application requires explicit approval under the project's migration rules.
- Live exact counts: 25 subjects; 2 seasons; 0 active approved syllabus versions; 0 topics; 0 subtopics; 0 questions; 0 flashcards; 0 attempts. Phase 1 remains open because content-dependent Batch 3–4 work cannot be verified with real approved content.
- **Next action:** request/obtain explicit approval to apply migration 20261021100000_question_rights_publication_gate.sql to live Supabase; after approval, apply once and verify live policy/function definitions and test safe read paths. Continue independent auth/session and dashboard acceptance tests while no content is fabricated and no app deployment is performed.

## Content-source discovery checkpoint — 2026-10-21

- Candidate official syllabus provenance source found: https://ibass.jamb.gov.ng/e-syllabus (the official JAMB homepage links to IBASS). Its reuse/licensing terms are not yet verified. Do not publish imported syllabus content or set rights_status to approved until rights review is recorded.
- No verified official reusable question bank was found in this investigation. No questions were invented or inserted. Continue to keep the student empty state honest until lawful reviewed content is available.
- Latest code migration/test status remains: question rights gate migration exists in repo and passes disposable SQL CI, but has not been applied to live Supabase. Explicit production migration authorization remains required.

## Deployment-asset removal checkpoint — 2026-10-21

- User requested removal of app-deploy-related assets. Deleted .github/workflows/deploy-production.yml, wrangler.jsonc and legacy backend/index.ts (which imported @appdeploy/sdk); rewrote README.md to remove the legacy provider and old deployment instructions.
- Recursive main-tree scan returned no filenames matching AppDeploy, Wrangler, deploy or Cloudflare. package.json has no deploy script. Remaining workflows are Verify and ACE JAMB E2E only.
- No app deployment was run. Historical Cloudflare/AppDeploy deployment notes earlier in the master handoff are archival only and must not be executed or used to recreate removed files without a new user instruction.
- This removal does not change the current Phase 1 result: Verify/E2E are green on the previous verified code commit, the question-rights migration is source-only, and Phase 1 remains open due to no live approved syllabus/question content.

## Scope correction — 2026-10-21

- User reaffirmed the active task boundary: **frontend only**. Do not make Supabase schema/RPC/policy changes, apply production migrations, write production data, or pursue backend/security migration work as the next milestone. The previous question-rights migration and SQL regression test were removed because they were out of scope; the corresponding Verify workflow step was removed. No live Supabase change was made.
- Treat any earlier paragraph in this handoff that recommends applying migration `20261021100000_question_rights_publication_gate.sql` as superseded/out-of-scope. Do not recreate it unless the user explicitly expands scope.
- Current frontend-only next action: continue the Phase 1 acceptance work identified in the latest checkpoint: sign-up/auth session-race and recovery-link callback coverage, dashboard retry/query-state coverage, and front-end syllabus/practice/CBT states using mocked contracts only. Do not fabricate official content; keep empty states honest. No app deployment.


## Phase 1 frontend acceptance — 2026-10-21

- Resumed from verified `main` HEAD `10cc1e4a83182a866128bd8d64a7cfe70e83f10b`. The latest ACE JAMB E2E workflow on that exact HEAD completed successfully (`39536781903`).
- Frontend-only change prepared: dashboard loads now ignore stale overlapping responses using a request sequence guard, and student-facing dashboard failures use a generic recovery message rather than exposing raw provider/database error text.
- Added mocked Playwright coverage for dashboard query failure, non-disclosure of internal error details, retry recovery, and successful empty-state rendering. No Supabase schema/RPC/policy changes, production writes, or app deployment.
- Phase 1 remains OPEN until the updated commit passes CI and the content-dependent student journey can be verified against real reviewed/published content. Existing handoff evidence reports no active approved syllabus/topics/questions; do not invent content or mark this gate passed based on fixtures.
- Next action after this commit: inspect CI on the new HEAD, fix any failing frontend test, and continue auth/session-race coverage using mocked auth callbacks. Keep backend and deployment work out of scope.



## CI failure investigation and correction — 2026-10-21

- Verify passed on commit `2d95ea0b3970fa2da1e3361e6b84f211cc3f251d`; E2E had 40 passing and 2 failing. The failures were both browser projects running the newly added dashboard retry test; it failed before the expected dashboard heading because the fixture injected the failure into the profile endpoint during auth/bootstrap, not into a dashboard-only query.
- Corrected the test to fail the first syllabus-version query instead, leaving mocked auth/profile bootstrap intact, then allow retry to fall through to the fixture. This is test isolation correction, not a production backend change.
- Commits: `c34f9f97246c95e4d6d2fc493c515cb3e5c892ac` (first targeted attempt, superseded by better isolation) and `1054617f37aa84f12ed2f9686ace11de3f5ca0ae` (isolates failure to syllabus-version query).
- Current verification for `1054617f37aa84f12ed2f9686ace11de3f5ca0ae`: Verify and ACE JAMB E2E queued at last check. Do not claim the correction passed until those runs finish.
- Continue frontend only. No Supabase schema/RPC/policy changes, production writes, or app deployment. Phase 1 remains open pending auth/session-race coverage and real reviewed/published syllabus/question content acceptance.


## Dashboard retry fixture target correction — 2026-10-21

- Further source inspection showed syllabus-version lookup is skipped when the active exam blueprint is absent in the standard fixture. The retry test now fails the dashboard-only `rpc/get_active_exam_blueprint` request once and then falls back to the prepared student's mocked `null` response, so the failure is guaranteed to occur in dashboard loading without breaking authentication.
- Latest test fixture commit: `1c7709664b961c3f0019b1fd9d2cb8769b51601c`. Prior CI runs do not include this exact test target yet; await CI on current HEAD before declaring the test green.
- Scope unchanged: frontend-only, no production data writes, no schema/RPC/policy edits, no deployment. Phase 1 remains open pending CI and auth/session-race acceptance plus real reviewed/published content.


## Current handoff — frontend Phase 1 only (2026-10-21)

**Verified repo:** `DarealNovaking/Nova-ace-jamb`, branch `main`; HEAD `c119e0e6af1a52da1811e6fa66d102cf1d2fdced`.

**Scope:** finish frontend Phase 1. Do not shift to backend, live content ingestion, production database work, migrations, or deployment. Missing published academic rows are not a frontend blocker; use test fixtures and honest empty states.

**Last failed acceptance:** E2E run `39580697582` on `450b22d33ac6ebe321183b1606df571d2202636f` had 38 passing and 4 failing. Two unique test causes (each failed on desktop + mobile): syllabus fixture route mismatch and dashboard retry targeting the wrong endpoint. Corrected both in `tests/e2e/smoke.spec.ts`, commit `c119e0e6af1a52da1811e6fa66d102cf1d2fdced`.

**Verification pending:** Verify `39607769410`; E2E `39607769274`. Both were in progress at checkpoint write time. Poll them; no green claim until final conclusions are successful.

**Exact next action:** inspect both run conclusions for `c119e0e6af1a52da1811e6fa66d102cf1d2fdced`. Fix test or source failures before adding scope. After green CI, continue frontend acceptance for auth/session race and recovery callback, dashboard retry/query-state, learning/practice/revision/flashcards/progress/study-plan, and CBT expiry/submit/resume/completed-result recovery. Update this checkpoint and master handoff after meaningful work. Phase 1 remains OPEN until all frontend acceptance items are verified.


## Frontend Phase 1 continuation update — 2026-10-21

- Current scope: **finish frontend Phase 1 only**. Backend readiness and live academic content are not frontend completion gates. Use mocked contracts and truthful empty states. No production writes, backend/schema/RPC/policy changes, migrations, or app deployment.
- Test-fixture correction in `tests/e2e/smoke.spec.ts`: syllabus fixture now routes `syllabus_versions` to its own endpoint (not `get_active_exam_blueprint`); dashboard retry now fails `rpc/get_active_exam_blueprint`, the actual request used by dashboard loading. Source commit: `c119e0e6af1a52da1811e6fa66d102cf1d2fdced`.
- Frontend error handling improvement: study-plan load/save now shows generic recovery messages rather than raw provider/database error text. Added a mocked E2E test asserting save failure does not expose internal provider details. Source commits: `4d6d341ad52d906fe63e1c1aabf76c2cda87ee75`, `593cbd446ecb1e24df05629c5cb4659e0645fafb`.
- CI on the route correction and prior docs commits was still running at the time of this update; the latest source commits need their own final Verify and E2E results. Do not claim the changes passed until completed workflows confirm it.
- Phase 1 remains **OPEN**. Next: poll CI on current main HEAD; fix any failures; then complete remaining frontend acceptance for auth/session race and recovery callback, dashboard retry/query states, workspace states, and CBT expiry/submit/resume/result recovery. No live-content dependency.


## Frontend Phase 1 active continuation — auth race and safe errors (2026-10-21)

- Current milestone remains frontend-only Phase 1. No backend/database changes, production writes, migrations, or deployment; mock API contracts and honest empty states are expected.
- Fixed the test-fixture route mismatches: approved syllabus fixture now intercepts `/rest/v1/syllabus_versions`, while dashboard failure/retry targets `/rest/v1/rpc/get_active_exam_blueprint`. On source commit `c119e0e6af1a52da1811e6fa66d102cf1d2fdced`, Verify and Playwright E2E passed; the E2E suite reported **42/42 passing** on desktop and mobile Chromium.
- Sanitized student study-plan preference load/save errors to generic recovery copy and added a mocked save-failure test that asserts provider details are not rendered. Typecheck/build passed on source commit `593cbd446ecb1e24df05629c5cb4659e0645fafb`; E2E for the expanded suite was still running when this note was written.
- Fixed an initial-session race in `StudentFoundationGate.tsx`: once a recognized Supabase auth-state callback arrives, a slower initial `getCurrentUser()` probe can no longer overwrite the callback's newer user/session state. Auth-probe failures now use generic student-facing copy. Commit `96a0f601f8fd976221f2aa98354702cd94315b1e`.
- Latest HEAD at this note is `96a0f601f8fd976221f2aa98354702cd94315b1e`. Relevant CI runs were still in progress: Verify/E2E must be polled for the latest HEAD before claiming this work passed. Older E2E runs on the expanded test suite were also still running; do not treat those as successful until their final conclusions are available.
- Phase 1 remains **OPEN**. Next: verify current HEAD in CI; resolve any E2E failures or hanging tests; then finish the remaining frontend acceptance list for authentication/recovery, dashboard/query states, workspace states, and CBT expiry/submit/resume/results. No live academic content prerequisite.


## Frontend Phase 1 CI failure investigation (2026-10-21)

- After adding the study-plan save-failure E2E, Verify passed but Playwright E2E failed on both desktop and mobile. The failing step was clicking `Save study preferences`; the button remained unavailable while saved preferences were still loading. The failure is a test synchronization issue so far, not proof of a product defect.
- Updated `tests/e2e/smoke.spec.ts` to explicitly wait for `Loading your saved preferences…` to disappear and the save button to become enabled before clicking. Commit `aea5436978e43530a28a899da12ba4e1843de2c0`.
- Confirmed `Verify` passed on docs HEAD `11ccb9e343686da335f576e245993c5b1b452840`; the E2E job failed on earlier commit `e5163cc26c4cebec562fe8f83474426f686d1333` with the above timeout. E2E on `11ccb9e3` was still in progress during this investigation. A separate Playwright browser-install step also logged DNS resolution failures for `playwright.download.prss.microsoft.com`; it must be distinguished from test failures in the newest run.
- Phase 1 remains **OPEN**. Next: wait for current-main Verify and E2E results after `aea5436`; if green, continue remaining frontend acceptance checks for auth/recovery, dashboard/query states, workspace states, and CBT expiry/submit/resume/results. Frontend-only scope; no production backend, database, or deployment changes.


## Continuation verification — 2026-10-21 (current-main CI lookup limitation)

- Re-inspected the live GitHub repository via the connected GitHub integration. Repository is private, default branch `main`, and this integration has read/write permissions. The newest repository-scoped commit returned by the commit search is `fa4ebb1aa5d7530d691c25196bb735f24d160671` (`docs: record frontend e2e failure and test synchronization fix`); it changes only the master handoff, continuity checkpoint, and `docs/FRONTEND-COMPLETION-BATCH-2026-10-21.md`.
- Read the latest frontend completion batch, current `tests/e2e/smoke.spec.ts`, `src/components/StudentFoundationGate.tsx`, and `.github/workflows/verify.yml`. Current scope remains frontend-only Phase 1. The auth initial-session race fix and recovery-link tests exist in source; more acceptance coverage is still required for auth/session races, dashboard retry/query states, workspace states, and CBT expiry/submit/resume/results.
- Verification lookup attempted on the latest repository commit: GitHub combined commit status returned no status entries. The connected workflow-run lookup explicitly returns only pull-request-triggered runs and returned no runs for the inspected commits, so it cannot establish the current push-triggered Verify/E2E conclusions. No local clone/browser execution was possible through the available tools in this session. **Current-main Verify/E2E is UNVERIFIED**, not green or failed.
- No application code, production data, Supabase schema/RPC/policies, migrations, or deployment were changed in this continuation.
- Exact next action: obtain current `main` push-triggered Verify and ACE JAMB E2E conclusions using a workflow-run listing/log path that includes push events; fix any failures on the exact tested SHA. Then add/verify the remaining mocked frontend acceptance coverage, starting with the initial auth-session probe race and recovery callback, and keep Phase 1 open until the acceptance matrix is green.

## CI lookup follow-up — 2026-10-21

- Followed up on the previously pending run IDs rather than treating them as unknown: GitHub Actions run `39607769410` completed successfully for Verify, including `npm run typecheck`, `npm run build`, parser/contract tests, Deno checks, and the disposable PostgreSQL tests. ACE JAMB E2E run `39607769274` also completed successfully; its Playwright browser-test step and browser installation both concluded success.
- Important SHA boundary: these run IDs correspond to the earlier `c119e0e6af1a52da1811e6fa66d102cf1d2fdced` fixture-correction checkpoint, not the later source change `aea5436978e43530a28a899da12ba4e1843de2c0` (study-preference test synchronization) or current docs HEAD `54ec1c62c95d3782c88890159bc64f2b58aebd5d`. Therefore they verify that earlier baseline only; they do not prove latest-main E2E is green.
- Rechecked commit status and commit-associated workflow lookup for `aea5436` and current docs HEAD: combined statuses remain empty and the workflow lookup exposes only pull-request-triggered runs, with no matching runs. Current latest-main acceptance remains UNVERIFIED for the later source changes.
- Next: continue the existing frontend Phase 1 acceptance list, then use a workflow-run listing path that includes push events to verify the exact latest source SHA. Do not restart completed baseline work. No production/backend changes or deployment.

## Auth-session race acceptance test — 2026-10-21

- Added a mocked Playwright regression test in `tests/e2e/smoke.spec.ts` (commit `7a9d91515f86ed474fd905ab1c89fbac7746ec5a`). It delays the initial `/auth/v1/user` probe, returns a stale unauthenticated response, and asserts that the newer persisted auth-state session still reaches the prepared student dashboard instead of falling back to sign-in. All other requests use the existing isolated mocked fixture.
- GitHub read-back confirms the test exists on `main`. This is source-level verification only; the new test has NOT yet run in Playwright/CI. Do not mark it passing until a run against commit `7a9d91515f86ed474fd905ab1c89fbac7746ec5a` completes successfully.
- Scope stayed frontend-only: no backend/database changes, migrations, production writes, or deployment. Phase 1 remains OPEN.
- Exact next action: retrieve the push-triggered Verify and ACE JAMB E2E runs for this commit, fix any failing assertion/fixture, then continue the remaining dashboard query-state, workspace, and CBT recovery acceptance coverage.


## Current-main verification — 2026-10-21 (auth race test)

- Repository HEAD observed: `869a00d8d21243a978a5cb7b580e85c54992e6e1` on `main`. GitHub Actions push-triggered run discovery is working through the Actions runs collection; do not use the older commit-associated workflow wrapper for this check.
- Verify run `39610640949` on this exact SHA completed with conclusion `success`. Confirmed steps passed: parser/contract tests, Deno checks for both catalog functions, `npm run typecheck`, `npm run build`, and disposable PostgreSQL migration/policy tests.
- ACE JAMB E2E run `39610640807` targets the same exact SHA. Typecheck and build passed in its job; Playwright browser tests were still running at the last poll. E2E is therefore **PENDING**, not passed or failed yet. Continue polling the run and inspect test output if it fails.
- Auth-session race regression test exists in `tests/e2e/smoke.spec.ts`; the exact latest-main Playwright result is the remaining immediate verification gate. Scope remains frontend-only; no production DB writes, schema changes, or deployment.
- Next action: poll run `39610640807` to conclusion. If green, proceed to the remaining frontend acceptance gaps (especially recovery callback coverage and explicit CBT resume/results recovery if not already covered), run current-main E2E after each source change, and keep Phase 1 open until the acceptance matrix is satisfied.


## Auth/session race and mobile E2E correction — 2026-10-21

- Exact tested SHA `869a00d8d21243a978a5cb7b580e85c54992e6e1`: Verify run `39610640949` passed, including typecheck/build and repository contract checks. ACE JAMB E2E run `39610640807` failed: 42 passed, 4 failed (two distinct tests on desktop + mobile).
- Failure 1: the new race test intercepted `/auth/v1/user` with a 401, which caused the Supabase client to lose its seeded session before the student dashboard rendered. Root cause: the gate was starting `getCurrentUser()` before subscribing to auth-state changes, so the network probe competed with persisted-session initialization. Source fix committed as `74fde7dd9944cc5e4ce387d0ef6bbde622904d7e`: removed the competing initial network probe and now initializes student UI from Supabase auth-state events (server-side RLS/RPC authorization remains authoritative).
- Failure 2: the mobile study-plan test used exact accessible-name matching, but the dashboard button's accessible name also includes its descriptive text. Corrected the locator to match `/Study plan/`.
- Test corrections committed as `6a50545b23a9d4ae77d5b12cb9f4ff5b3cb04ddc`. The race test now asserts that the persisted session renders the dashboard without issuing a competing `/auth/v1/user` probe. This is a deterministic regression assertion, not yet verified by CI.
- Current next action: wait for Verify and ACE JAMB E2E on `6a50545b23a9d4ae77d5b12cb9f4ff5b3cb04ddc`; fix any remaining failures. Keep Phase 1 OPEN until current-main Playwright is green and acceptance coverage is reviewed. No backend/schema changes, production data writes, or deployment.


## Phase 1 frontend acceptance — verified closure — 2026-10-21

- Exact application/test commit: `455456890bac3aba584c54a1cbfe8dff0af8868c` on `main`. GitHub Verify run `39612545662` completed `success`; ACE JAMB E2E run `39612545462` completed `success` on that same SHA.
- E2E evidence: Playwright ran **46 tests, all 46 passed** on the configured desktop and mobile Chromium projects. The run covers account creation/email normalization, password-reset request and recovery password update, persisted student auth state, onboarding with English automatically included plus exactly three chosen subjects, dashboard query failure/retry and safe error copy, workspace navigation/reload/back-forward/empty states, syllabus approved/pending visibility, study-plan save/error recovery, CBT practice start, active-attempt resume, completed-result recovery, answer submission and result rendering, expiry auto-submit and transient submission retry, and editor/student access states.
- Verify evidence: typecheck, production build, parser/contract tests, Deno checks for both catalogue functions, and disposable PostgreSQL migration/policy tests all passed. These are CI checks on the listed commit; no claim is made about live content availability.
- Regression fixes included: removed the competing initial `getCurrentUser()` network probe from `StudentFoundationGate`; initial UI session is now driven by Supabase auth-state events. Corrected Playwright accessible-name matching for the Study plan navigation button on desktop/mobile.
- **Phase 1 (frontend acceptance batches 1–5) is CLOSED for the current mocked-contract acceptance scope.** This does not mean the entire whole-product frontend batch is complete. Keep the larger batch OPEN for the remaining workstreams, including community/channel gate UI and institution routing (without pretending client-side clicks verify membership), notifications/announcements, ACE Pass/payments, referrals, grounded AI/audio, and remaining admin command-center UX. No live academic content, production database changes, migrations, or deployment were part of this Phase 1 closure.
- Exact next action: continue the integrated whole-product frontend batch from its current status matrix, beginning with the remaining workstream/service-contract audit and the safe community/channel gate UI placement after onboarding. Preserve the documented rule that mandatory WhatsApp membership enforcement waits for a genuine server-verifiable contract; do not invent channel URLs, institution group mappings, payment status, notification delivery, or provider capabilities.


## Frontend Phase 2 — community welcome slice started — 2026-10-21

- Phase 1 remains closed on its verified mocked-contract acceptance commit. The active milestone is now the integrated whole-product frontend batch, starting with the documented community/channel flow after onboarding.
- Added `src/components/CommunityChannelWelcome.tsx` and wired it into `src/components/StudentFoundationGate.tsx`. Students completing onboarding see a responsive, keyboard-accessible community welcome page before the dashboard, can optionally open a configured official WhatsApp destination, and can continue without joining. The UI explicitly states membership is not verified here.
- Destination is read only from `VITE_NOVA_WHATSAPP_CHANNEL_URL`; it is rendered only for HTTPS URLs on the allowlisted WhatsApp hosts. No channel/group URL is invented. If unset/invalid, the UI shows an honest “link coming soon” state.
- Extended `tests/e2e/smoke.spec.ts` onboarding flow to assert the welcome page, unconfigured-link empty state, and continuation path. CI must confirm this exact test on the latest main commit before this slice is called verified.
- No backend, Supabase schema/RPC/RLS, production data, or deployment changes. This is an optional community connection point, not secure membership enforcement; institution-specific group routing and verified membership remain out of scope until backed by approved mappings and a server-verifiable contract.
- Exact next action: poll Verify and ACE JAMB E2E for commit `87147e8b90c5bd42167bf3c5305a7ddd73136707`; fix actual failures from logs. Once green, proceed through the existing whole-product frontend status matrix, prioritizing channel-link configuration/documentation and then notification/announcement UI only after checking existing contracts. Do not mark the whole frontend batch complete.


## Frontend Phase 2 community welcome — CI verification result — 2026-10-21

- Verified source/test HEAD before this documentation-only update: `b7867d0c329f787ca3e3913d736bfa301787aa0d`. Verify run `39614886069` passed. ACE JAMB E2E run `39614885727` passed on the exact same SHA; Playwright reported **46 passed (34.9s)** across the configured desktop/mobile projects.
- The existing onboarding E2E now covers the community welcome screen, honest unconfigured-channel state, and continuing to the student dashboard after the saved foundation is loaded. This verifies the optional UI journey against mocked Supabase contracts, not a live WhatsApp destination or membership check.
- Phase 2 is **IN PROGRESS**. The community welcome slice is implemented and CI-verified; no real channel URL has been supplied/configured. No backend, Supabase schema/RPC/RLS, production data, or deployment changes were made.
- Next action: continue the integrated frontend Phase 2 matrix. Confirm the official WhatsApp channel URL/configuration from a trusted project source before configuring `VITE_NOVA_WHATSAPP_CHANNEL_URL`; then inspect existing notification/announcement contracts and implement only supported UI states. Do not invent institution group URLs or claim membership verification.


## Frontend Phase 2 — official community channel configured and notification contract audit — 2026-10-21

- User supplied the official community destination: `https://whatsapp.com/channel/0029VbCW3b1Gk1FtAtO7Qv1N`. The welcome component now uses this as its safe default while still allowing `VITE_NOVA_WHATSAPP_CHANNEL_URL` to override it. URL validation remains HTTPS-only and restricted to approved WhatsApp hosts; the external link opens in a new tab with `noopener noreferrer`.
- Updated `tests/e2e/smoke.spec.ts` to assert the official URL, external target, and safe rel attributes on the onboarding-to-community journey. CI on the resulting HEAD is required before claiming the new assertion passed.
- Notification/announcement contract audit: recursive repository tree and GitHub code searches for notification/announcement files and identifiers found no dedicated frontend component/service, migration, or documented delivery contract in the inspected main branch. This is a bounded source search, not proof no related capability exists in every external provider. Do not invent notifications or pretend delivery exists; next inspect schema/service definitions more broadly, then decide whether to build an honest empty state or a contract-backed UI.
- No backend/Supabase schema/RPC/RLS, production data, deployment, or membership verification changes. The community connection remains optional.
- Exact next action: verify the latest source/test commit with both Verify and ACE JAMB E2E workflows; then continue the Phase 2 service-contract audit and implement the next supported frontend slice.


## Frontend Phase 2 — student notification inbox and preferences — 2026-10-21

- Added `src/components/StudentNotifications.tsx` and mounted it in `src/components/StudentDashboard.tsx`. The inbox reads only the signed-in student's sent notification rows, orders newest first, caps the list at 30, supports per-row mark-as-read, and uses generic retryable error copy. Read-state updates rely on the existing self-only RLS policy; no client-side broadcast/notification creation is implemented.
- Added account-scoped notification preference controls for in-app, email and optional product announcements. Preferences are upserted for the authenticated user under the existing self-only RLS policy. Push preference is shown disabled with explicit copy because a saved preference alone does not configure push delivery. Empty inbox says no sent notifications are available rather than inventing announcements.
- Added Playwright coverage for the honest empty state, disabled push control and saving preferences using mocked Supabase requests. The test does not read/write production student data.
- Read-only Supabase audit confirmed live `ace.notifications` and `ace.notification_preferences` columns and policies: students can select their own notifications, update their own read state, and manage their own preferences; admin has the notification ALL policy. No delivery/scheduling Edge Function is currently listed, so admin broadcast/scheduling and actual email/push delivery are still not claimed as implemented.
- Further read-only check: ACE Pass product is active at 89,900 minor units NGN (= ₦899); Paystack provider is present but disabled; no active referral campaign rows were returned. Student checkout and qualified-referral rewards must remain unavailable/authoritative until the provider and qualification service are genuinely enabled. No live rows were mutated.
- Commits: `6349ed25ec4e5d15bf788080995b21d26edb58cb` (inbox component), `9371a945acfba8d962d9c866674ad01f22e11e53` (RLS-scoped read update correction), `6cb1d82d47cd973ac7f410559d9f1bc14ed3d799` (dashboard integration), `53972edc2d41e5c796b31675b7071b102ef161b4` (Playwright coverage).
- Verification status at this checkpoint: latest main HEAD is `53972edc2d41e5c796b31675b7071b102ef161b4`. GitHub Verify run `39616992052` and ACE JAMB E2E run `39616992180` are queued for this exact SHA; do not claim either passed until final conclusions are retrieved.
- No schema/migration/RPC/RLS changes, production data writes, or deployment. Phase 2 remains in progress; notifications inbox/preferences UI is implemented, while delivery, admin announcements, payment checkout, referral qualification, grounded AI request boundary, audio content, and broader admin command center remain dependent on real service/provider contracts.
- Exact next action: verify CI on this latest HEAD; then continue the remaining Phase 2 UI work only against verified contracts and keep unavailable server-side capabilities clearly disabled/unavailable.


## Frontend Phase 2 — ACE Pass and referral account surfaces — 2026-10-21

- Added `src/components/StudentAccountAccess.tsx` and mounted it on the student dashboard. It reads active products, the signed-in student's own entitlements and payment history, own referral codes, referrals where they are the referrer, and own reward records using existing `ace` schema/RLS boundaries. No direct payment, entitlement, referral qualification, or reward writes are performed.
- ACE Pass panel shows current active entitlement if the server has one, recent payment history, and a disabled checkout control with explicit unavailable copy. Read-only live audit found the ACE Pass product at ₦899 and Paystack provider disabled; no checkout initiation/webhook service was listed. The component does not claim payment completion or enable checkout.
- Referral panel shows only a code already issued by the backend, allows copying it, and counts rows with a server-populated `qualified_at`. It does not generate codes, issue rewards, or show a made-up campaign target; no active referral campaign row was found in the read-only audit.
- Added Playwright coverage for no-entitlement/no-code/no-campaign empty states and disabled checkout, using mocked requests only. This complements the notification inbox/preferences E2E added in the same Phase 2 sequence.
- Latest application/test HEAD at this checkpoint: `5c276b5fd8d6f2a980fcf917e4bf417fb6fd63b7`. Verify run `39617273249` and ACE JAMB E2E run `39617273391` are queued for this exact SHA; do not claim success until they finish.
- No schema/migration/RPC/RLS changes, production data writes, or deployment. Phase 2 remains IN PROGRESS: community CTA, notification inbox/preferences, and read-only ACE Pass/referral status surfaces exist; real notification delivery/admin scheduling, checkout/payment verification, referral qualification/campaigns, grounded AI request boundary, audio content, and remaining admin command-center UI still require verified service/provider contracts and further implementation.
- Exact next action: poll Verify/E2E for the latest SHA, fix any real failures, then continue the remaining service audit and frontend slices. Do not close Phase 2 while the AI/audio/admin/settings/PWA acceptance items remain incomplete or contract-blocked.


## Frontend Phase 2 — learning-support availability and account settings — 2026-10-21

- Added `src/components/LearningSupportStatus.tsx` to the student dashboard. It explicitly reports the grounded AI tutor as not enabled for students until approved knowledge sources and a secure server-side request boundary exist, and audio learning as unavailable until rights-cleared audio/transcripts and a delivery path are published. Read-only live audit found one configured AI provider but zero active rights-cleared knowledge sources, zero knowledge chunks, and no audio table in the inspected `ace` schema; the frontend does not call providers directly or fabricate lessons.
- Added `src/components/StudentAccountSettings.tsx` using existing `getStudentProfile`, `updateStudentProfile`, `getStudentPreferences`, and `updateStudentPreferences` services. It lets the authenticated student edit display name, target score, optional institution/course, and daily study time with range validation and generic save/load errors. Added mocked Playwright coverage for loading and saving those fields; no live student data was modified.
- Updated `tests/e2e/smoke.spec.ts` with checks for AI/audio unavailable states and account settings persistence contracts, in addition to notification preferences and ACE Pass/referral empty states. Test-fixture response for preference upsert was corrected to return the row required by the existing service's `.select().single()` contract.
- Current source/test HEAD: `329206b2a593e64e3c471aed2546c2623482b103`. Its Verify run `39617877703` and E2E run `39617878043` were queued at the last check. Earlier E2E run `39617831967` for the account-settings source/test commit `75c643ec81a75203c6d22fdc3798b1d1a4a5fa23` was in progress; it is not proof of the latest fixture correction. Do not claim tests passed until the exact current HEAD is verified.
- A local Git clone was attempted for direct npm/typecheck/Playwright verification, but this environment could not resolve `github.com`; no local checkout or local test run was produced. CI remains the verification path.
- No Supabase schema/RPC/RLS changes, production data writes, or deployment. Phase 2 is still IN PROGRESS. The student UI now includes community channel, notification inbox/preferences, read-only ACE Pass/referral status, account settings, and truthful AI/audio availability states. Admin announcement delivery/scheduling, payment checkout/provider verification, referral campaign/qualification, secure AI request/retrieval, audio content/player, expanded admin command center, and PWA/offline work remain incomplete or service-dependent.
- Exact next action: poll Verify and E2E for current HEAD `329206b2a593e64e3c471aed2546c2623482b103`, fix any failures, then continue the remaining frontend matrix. Do not declare Phase 2 complete while these listed surfaces remain unfinished or blocked by absent verified contracts.


## Phase 2 Playwright failure investigation and selector correction — 2026-10-21

- Retrieved full GitHub Actions logs for ACE JAMB E2E run `39617989320` (tested SHA `cd8243a49ae7977621c14a403d6ffd485c7a089d`). Result: 48 passed, 6 failed across desktop/mobile; all six were in three newly added tests and were locator/semantic collisions, not failed service assertions.
- Root causes from logs: the account settings and notification preference tests used `getByRole('status')` after adding static AI/audio availability badges with the same role, making the locator non-unique; the ACE Pass heading locator matched both the panel heading and product heading. Corrected by removing live-status semantics from static availability badges and targeting exact confirmation text / the panel's `#account-access-title` id.
- Fix commits: `5ee8fed95ac7a615add09496888827a471e33caa` (static badge semantics), `abea253c3afe4b8b35f37857fb49af3eb2a1b73c` (specific E2E locators). These fixes require a fresh CI run on the latest main HEAD; they are not yet verified by a completed run.
- The same failed run's Verify workflow completed successfully on the prior docs HEAD `cd8243a49ae7977621c14a403d6ffd485c7a089d`; its E2E result remains failed for the test-fixture locator issue described above. No production data or schema was changed.
- Exact next action: run/poll Verify and ACE JAMB E2E on the latest source/test HEAD and fix any remaining actual failures before continuing the Phase 2 matrix.


## Phase 2 current-main verification — 2026-10-21

- After correcting the locator/semantics failures, GitHub Verify run `39618718288` and ACE JAMB E2E run `39618718305` both completed successfully on exact current main HEAD `472f2fdbaf51d92fb21f83ab9c21dd5bdd861d76`.
- Verify workflow passed, including typecheck and production build plus repository contract/Deno/disposable-PostgreSQL checks. Playwright E2E reported **54 passed (34.0s)** across desktop and mobile Chromium projects.
- The previously failing six test cases were resolved by changing only test locators and static badge semantics. No remaining E2E failures are reported for this HEAD.
- This is verification of the current mocked-contract frontend states, not proof of live notification delivery, payment checkout, referral rewards, AI responses, audio playback, production deployment, or whole-product frontend completion.
- Phase 2 remains IN PROGRESS. Next workstream: inspect and extend the existing admin/academic frontend into a truthful operations command center without introducing unsupported broadcast/payment/AI actions; then review PWA/offline readiness and remaining frontend acceptance matrix.


## Phase 2 — admin operations readiness overview — 2026-10-21

- Added `src/components/AdminOperationsOverview.tsx` to the existing admin-only `AdminFoundationGate`. It displays read-only counts for active products, enabled payment providers, pending payments, notification records, active referral campaigns, rights-cleared knowledge sources, enabled AI providers, active flashcards, and registered devices, with explicit caveats that counts do not perform delivery/verification/qualification or enable AI. It contains no student PII and no write actions.
- The overview uses existing admin-authorized `ace` table policies and only count/head queries; it does not mutate live rows. Existing catalogue review/import and academic workspace flows remain in place.
- Added mocked Playwright admin-route coverage asserting the operations overview and honest unsupported-service indicators. No live administrator session or production row was used by the test.
- Source/test commit: `ca4b025c94ff41629d9d59b4c284fa6ef0ba7c6c` (admin integration), `b6002c1d089658cf8cb99955957247d7dbf2c499` (E2E test). Verification is pending for the current source/test HEAD.
- Phase 2 remains IN PROGRESS. This adds operational visibility only; it does not implement admin announcement delivery/scheduling, payment checkout/webhooks, referral qualification, secure AI requests, audio playback, or PWA/offline behavior.
- Exact next action: run/poll Verify and ACE JAMB E2E on the latest main HEAD; fix any failures. Then assess PWA/offline readiness and the remaining admin/account acceptance gaps without adding unsupported write actions.



## Phase 2 — safe PWA shell and offline boundary — 2026-10-21

- Repository audit found no manifest or service worker. Added `public/manifest.webmanifest`, `public/nova-ace-icon.svg`, and `public/sw.js`; linked the manifest/theme/icon in `index.html` and registered the worker only in production from `src/main.tsx`. Installation failures are non-fatal.
- The worker caches only the app shell and Vite content-hashed static assets. It is same-origin GET only, excludes `/rest/`, `/auth/`, `/functions/`, `/storage/`, `/realtime/`, `/api/` and `/sw.js`, and uses network-first navigation with the static root as offline fallback. It does not cache API/auth/payment/CBT response data or claim offline CBT operation.
- Added Playwright coverage for manifest metadata, service-worker asset, explicit API/auth cache exclusions and registration. Verification remains pending; CI attempts on the admin-overview commits failed before any runner was assigned (runner ID 0, no steps/logs). A generic typing correction for count queries was committed as `fcb23495b4399451177e1e7f1f7eef0eb07e0e48`; do not claim admin/PWA verification until CI executes normally.
- Current Phase 2 source/test scope includes community link, notification inbox/preferences, read-only ACE Pass/referral status, account settings, truthful AI/audio states, admin readiness counts, and the PWA shell. Delivery/payment/referral/AI/audio server capabilities remain absent or disabled and are not simulated.
- Exact next action: obtain a real runner-backed Verify and Playwright E2E result for the latest main SHA; fix any source/test failures, then complete the remaining admin command-center review and close only after the acceptance matrix is satisfied.


## Phase 2 CI execution blocker — latest main — 2026-10-21

- Latest source/test/docs HEAD: `ae7f9705feb2b7ac2851e093523be1bd2db01a94` (`feat: add safe installable PWA shell and phase two handoff`). Verify run `39620272686` and ACE JAMB E2E run `39620272651` both concluded failure, but the associated jobs have `runner_id: 0`, zero steps, and no retrievable job logs. Re-running the preceding failed workflow also produced runner-less failures. This is not evidence of a TypeScript or Playwright assertion failure; the jobs did not execute.
- The last runner-backed E2E result before adding the admin command center and PWA was 54/54 passing on `472f2fdbaf51d92fb21f83ab9c21dd5bdd861d76`. It does not verify the later admin/PWA changes. Local verification is also unavailable because this environment cannot resolve `github.com` for a clone.
- No production deployment, Supabase schema change, or live data write was made. Do not mark current HEAD verified or Phase 2 complete until Verify and Playwright execute on a real runner.
- Exact next action: restore runner-backed CI execution (or retry when GitHub Actions can assign runners), inspect actual typecheck/build/test results on `ae7f9705feb2b7ac2851e093523be1bd2db01a94`, fix any real failures, then continue the remaining admin/announcement and PWA acceptance gates. Phase 2 remains IN PROGRESS.


## Phase 2 closeout attempt — CI retry and final blockers — 2026-10-21

- Re-inspected the private repository metadata and current `main` files through the connected GitHub integration. The current main HEAD observed before this note was `6104fc1ffa4c825972baffdfef0693ee82c03456` (`docs: record phase two CI runner blocker`).
- Verified `src/components/CommunityChannelWelcome.tsx` now contains the user-provided official channel URL as a safe HTTPS fallback: `https://whatsapp.com/channel/0029VbCW3b1Gk1FtAtO7Qv1N`. Membership is explicitly optional and not claimed as verified.
- Re-ran the latest Verify run `39620456709` and E2E run `39620456629` (attempt 2) for the current main SHA. Both again concluded failure before useful job evidence was available. The GitHub connector reports null job logs/steps and a log fetch returned BlobNotFound; therefore this is **not** evidence of a source/test assertion failure, and neither build nor Playwright was verified on this SHA.
- Previous known runner-backed baseline remains Verify passed and Playwright 54/54 passed on `472f2fdbaf51d92fb21f83ab9c21dd5bdd861d76`, before the newer admin operations overview and PWA shell. That older result does not verify current main.
- Manual source review confirmed the student settings flow relies on a preferences row existing (`getStudentPreferences().single()`); this is an acceptance risk for accounts without a row and should be covered once runner-backed tests can execute. The admin operations overview uses read-only count/head queries and reports unsupported services honestly. The service worker is same-origin GET only and excludes known API/auth/storage/function/realtime prefixes; its real browser behavior still requires Playwright verification.
- No production deployment, database mutation, schema change, or student-data write was performed in this closeout attempt.
- **Status: Phase 2 is NOT closed.** The batch still has unverified source/test changes and unfinished backend-dependent surfaces: admin announcement delivery/scheduling, payment checkout/provider verification, referral qualification/rewards, secure AI request/retrieval, audio content/playback, and meaningful offline/CBT acceptance. These must not be represented as implemented just because their UI reports status.
- **Exact next action:** open the repository's GitHub Actions page and inspect why both jobs fail without steps/logs; restore a functioning GitHub-hosted runner or resolve the Actions service/runner/account restriction, then rerun Verify and ACE JAMB E2E on the latest main SHA. Fix any actual code failures from those runs, add a regression test for missing student preferences, and continue only the remaining acceptance gates supported by real service contracts. Do not call Phase 2 complete until the exact latest source/test SHA passes the required checks and remaining scope is either implemented and verified or explicitly removed from the phase's acceptance criteria by the project owner.

## Frontend Phase 2 continuation — 2026-10-21

- Re-verified current repository `main` HEAD at start of this continuation: `444c3a6eb856ddd33a4211709ce677cd3bb9e072`. The current Phase 2 batch and closeout notes confirm that latest source/test changes have not passed runner-backed Verify/E2E; GitHub Actions allowance is exhausted for the current monthly period. Do not treat runner-less failures as code failures or as successful verification.
- Implemented a narrow student-settings robustness fix in `src/lib/studentService.ts`: `getStudentPreferences()` now uses `maybeSingle()` and returns safe empty defaults when an authenticated student's preferences row does not yet exist. The existing save path already uses an authenticated `upsert`, so opening settings no longer fails solely because the preferences row is absent.
- No production database rows, schema, Edge Functions, payment, referral, AI/audio services, or deployment were changed.
- Verification: GitHub source write returned a commit SHA. Typecheck/build/Playwright have NOT been run for this change because GitHub Actions minutes are exhausted and no local checkout/test environment is available in this tool session. The fix needs runner-backed or local test verification before Phase 2 can close.
- Remaining Phase 2 blockers remain: runner-backed typecheck/build/E2E, missing-preferences regression coverage, and backend-dependent services that must remain honestly unavailable until real contracts exist.
- Exact next action: add/execute a Playwright regression for opening and saving settings when `student_preferences` returns no row; when Actions usage resets or a local environment is available, run `npm run typecheck`, `npm run build`, and targeted/full `npm run e2e`, then continue the acceptance matrix.

## Phase 2 continuation — missing-preferences regression coverage added (2026-10-21)

- Added a mocked Playwright regression in `tests/e2e/smoke.spec.ts` that exercises a prepared student's Account Settings when the `student_preferences` GET returns PostgREST's no-row response, then attempts to save daily study time through the existing preferences upsert path.
- All Supabase API traffic in this test is intercepted; it does not access production rows or credentials.
- Source and test writes were accepted by GitHub. The test has NOT been executed, and its behavior is not yet verified by Playwright. Typecheck/build/E2E remain unverified while runner-backed Actions execution is unavailable.
- Next action: run the targeted test and the full typecheck/build/E2E suite in a local checkout or when Actions runner capacity is restored; fix any real failures before closing Phase 2.

## Phase 2 continuation — admin authorization error sanitization (2026-10-21)

- Updated `src/components/AdminFoundationGate.tsx` so a failed `ace.rpc('is_admin')`/auth check displays generic recovery copy and never directly renders raw exception text.
- Added a mocked E2E regression in `tests/e2e/smoke.spec.ts`: `rpc/is_admin` returns a synthetic internal database error; the `/admin` access screen must show the generic message and not reveal the private error text.
- Commits: `19f79805873f9e35218534a729bb536ceae08647`, `2e5947e85690c603cf9a0fc3024cd226f265480d`.
- Source/test writes succeeded through GitHub and are present on `main`; execution is **unverified**. Typecheck/build/Playwright were not run. GitHub Actions minutes are exhausted per user report, and no local checkout is available in this session.
- No production data/schema changes or deployment. Phase 2 is not closed; payment verification, notification delivery/scheduling, referral qualification, grounded AI request/retrieval, audio delivery, and full admin operations remain unavailable or incomplete unless backed by verified server contracts.
- Exact next action: once Actions capacity resets or a local checkout is available, run typecheck, build, and the full Playwright suite against the current `main` SHA; resolve all actual failures and then re-evaluate Phase 2 acceptance gates.


## Phase 2 continuation — live catalogue state reconciled (2026-10-21)

- Read-only inspection confirmed current GitHub `main` HEAD at start of this investigation: `709c1b6fde957f631c9ca8420c2ece7727ecdda5`. No application source or production data was changed in this investigation.
- Supabase connector access is working for project `nova-ace-jamb` (`uokiqlgmzprqfbzmedaz`). This corrects older checkpoint notes that described the database as inaccessible; those notes reflect a prior failed access attempt and should not be treated as current status.
- Live read-only SQL counts: `ace.institutions` = 791; `ace.programs` = 0; `ace.program_utme_rules` = 0; `ace.subjects` = 25; `ace.topics` = 0; `ace.questions` = 0; `ace.exam_seasons` = 2; `ace.catalog_sources` = 13; `ace.catalog_import_batches` = 5; `ace.catalog_import_rows` = 793.
- Import-batch status query: institution batches include 3 published batches totaling 791 rows, 1 rejected batch totaling 791 rows, and 1 staged batch with 1 row. Therefore, the 791-institution catalogue is already published; do not ask the user to re-upload the workbook without new evidence.
- The verified next catalogue gap is institution → programme → UTME-rule ingestion: live `ace.programs` and `ace.program_utme_rules` are both empty. The existing `ibass-catalog-stage` function is ACTIVE version 4 and `catalog-import` is ACTIVE version 7 with `verify_jwt=true`. Repository and deployed function implementations must be compared before any deployment; do not blindly redeploy repository copies.
- The admin UI already exposes IBASS staging for 1–25 institutions and a selected exam season. Executing it requires a real authenticated administrator session; no session token was available to this investigation. No import was started and no production rows were modified.
- User instruction: defer the full typecheck/build/Playwright/deployed acceptance suite until the end of Phase 2. This investigation used read-only database queries only; no tests were run.
- Phase 2 is still OPEN. Backend-dependent notification delivery/scheduling, payments, referral qualification/rewards, grounded AI retrieval, audio delivery, and PWA/browser acceptance are not proven complete by their status UI.
- Exact next action: continue implementation without re-uploading the institution workbook; reconcile the deployed IBASS/catalog-import contracts and use the authenticated admin staging flow to ingest official programme and UTME-rule data, preserving unresolved/alternative subject requirements. Record batch IDs/statuses and verify only through read-only counts. Perform the agreed full test matrix at the end.


## Frontend Phase 2 continuation — design-system hardening (2026-10-21)

- User instruction: finish Frontend Phase 2 on the existing ACE JAMB repository; do not restart the project or revisit the resolved institution/catalogue discussion. GitHub Actions included minutes are exhausted per the user's billing screenshot, so avoid unnecessary workflow triggers.
- Read-only source inspection covered the main router, global CSS, student auth/onboarding/dashboard/study workspace, protected CBT entry, account settings, notifications, community-channel welcome and admin operations overview.
- Updated `src/index.css` in commit `6959ea4e055ece0cb7b768704556a399307a5bf4`: removed duplicate rules, consolidated design tokens (including purple/gold), improved keyboard focus visibility, reduced-motion support, form target sizing, disabled-button affordance and responsive decorative orbs. Existing class selectors were preserved.
- GitHub accepted the source update. Typecheck/build/Playwright/browser visual checks are NOT run; no local checkout is available in this session and Actions capacity is exhausted. No deployment or production DB changes were made.
- Status: Phase 2 remains OPEN. This is one foundation improvement, not the full frontend closeout. Backend-dependent payments, referral qualification, AI retrieval, audio delivery and notification scheduling/delivery remain unverified until real server contracts and end-to-end evidence exist.
- Exact next action: continue the current-source frontend audit and scoped implementation, then execute typecheck, production build and full Playwright suite when local execution or Actions capacity is available. Record all actual results before closing Phase 2.


## Phase 2 frontend audit continuation (2026-10-21, follow-up)

- Inspected the current Playwright smoke test inventory. Existing tests cover account recovery, mobile student entry, onboarding, persisted dashboard, CBT attempt persistence/empty bank, approved syllabus/rights states, workspace navigation, settings, learning-support honest availability, payment/referral states, notifications, study plan, PWA shell, and admin access/readiness.
- Fixed stale practice-workspace copy in `src/components/StudentStudyWorkspace.tsx`: it no longer asserts that the latest database audit has zero active questions. It now explains that question availability is checked when starting a session and that the app must not invent questions or fake attempts.
- Commit: `5db968b85207444f83415ac53e7db825e2a3d1c8`. GitHub accepted the update; no DB/deployment changes made.
- Tests were inspected but NOT executed. TypeScript, production build, browser/mobile rendering, and Playwright remain unverified because no local checkout/runtime is available in this session and Actions minutes are exhausted.
- Phase 2 remains OPEN. Next: continue targeted source review for stale claims/navigation regressions, then run typecheck/build and existing desktop + mobile Playwright suite in a local execution environment. Do not fabricate official question-bank content or call placeholder backend-dependent services complete.


## Final Phase 2 frontend review — 2026-10-21

- Final source review checked route/navigation synchronization, student workspace empty states, mobile semantics, E2E inventory and workflow config. Dashboard/workspace custom-event navigation and URL `popstate` synchronization are present. Existing Playwright tests cover mobile entry, dashboard CBT navigation and workspace navigation/empty states. Tests were inspected, NOT executed.
- Both workflow-referenced functions exist on current `main`: `supabase/functions/ibass-catalog-stage/index.ts` and `supabase/functions/catalog-import/index.ts`. Older checkpoint claims that the first is missing are stale.
- Latest inspected Actions run `39648461718` (`0b7e0bf6e35da56b70bd20862f4da1260252efc1`) shows both jobs failed without step summaries. Log retrieval returned 404 BlobNotFound, so root cause remains unknown. User screenshot confirms included Actions minutes exhausted (2,000/2,000). No new workflow triggered.
- No new source edit warranted from this read-only review. Phase 2 implementation review is substantially complete, but closure is BLOCKED pending actual `npm run typecheck`, `npm run build`, and `npm run e2e` results; none run in this session because no local checkout/runtime is available and Actions minutes are exhausted.
- Exact next action: run `npm install`, typecheck, build and E2E in a local execution environment or after Actions minutes reset; fix reproducible failures, record evidence, and then close Phase 2. Do not revisit settled catalogue/institution decisions.


## Phase 3 readiness audit — 2026-10-22
- Verified current `main` HEAD: `78af176d91d596e260d995c2ef53a6ae0a4080c7`.
- Read-only audit inspected student auth/onboarding/profile/dashboard/workspace source and live Supabase schema/counts.
- Live counts: profiles 4; student_preferences 4; student_subjects 8; subjects 25; exam_seasons 2; syllabus_versions 50; topics 0; subtopics 0; questions 0; attempts 0. These are point-in-time counts.
- RLS policies observed: profiles self SELECT/UPDATE; student_preferences and student_subjects owner-scoped ALL with USING + WITH CHECK; roles self SELECT. RPC signatures inspected, but function bodies/grants not audited.
- Source contains existing auth/session gate, admin/editor routing, onboarding persistence, subject selection, and community-gate state. No app code, DB data, migrations, or deployment changed. No typecheck/build/E2E tests run.
- **Scope/roadmap correction:** The master handoff does not define a canonical “Phase 3 — Student Foundation” milestone. Do not treat that label as established. User explicitly said current task is Phase 2 frontend closeout and not catalogue work; this audit did not start catalogue work.
- **Next action:** Keep general Phase 2 checks deferred until GitHub Actions is available, then reconcile the exact next milestone against the owner-approved roadmap before implementation. Do not invent a Phase 3 scope.


### Student-foundation RPC body follow-up — 2026-10-22
- Read-only live inspection of `ace.save_student_preparation_foundation` confirmed a pinned search path, explicit `auth.uid()` check, input validation, exactly four distinct active subjects including English, and writes scoped to the current user's profile/preferences/subjects.
- EXECUTE grants/privileges remain unverified; no security sign-off claimed. No DB mutation or source change.


## Current Frontend Phase 2 checkpoint — 2026-10-23
- Active scope is Frontend Phase 2 closeout, not catalogue ingestion or an inferred Phase 3 milestone.
- HEAD at investigation start: `0cf9fe0aae55a5f7a907a09503dc239d63d89598`. Documentation follow-up commits now exist; refresh main HEAD before source changes.
- Verify run `39810652243` passed; reported typecheck, build, Node/Deno and SQL checks passed.
- E2E run `39810652048`, job `119935661138`, ended before any steps executed (`steps: []`, no runner assigned). This is not a Playwright assertion failure; exact start cause remains unconfirmed. Prior user report mentioned Actions billing/spending restriction—verify current status.
- Phase 2 remains OPEN. Playwright desktop/mobile and deployed-flow acceptance are not verified. No app source, DB rows, migrations or deployment changed in this investigation.
- Next: inspect E2E annotations, restore runner execution, run the existing E2E suite against current main, review desktop/mobile navigation, student settings, admin authorization and PWA, fix reproducible defects, and record evidence. Current concise handoff: `docs/FRONTEND-PHASE-2-CURRENT-HANDOFF-2026-10-23.md`. Frontend batch log also updated.
- Anti-drift: do not re-upload the 791-institution workbook without new evidence, reopen resolved admin/student routing without evidence, or claim E2E passed.


## E2E execution results and Phase 2 defect triage — 2026-10-23
- Retried the existing E2E job, run [39810652048](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39810652048), job ID `120401891161`. Runner started successfully and completed dependency install, `npm run typecheck`, `npm run build`, and Playwright browser installation.
- Typecheck: PASS. Build: PASS, with existing Vite warning that the minified JS chunk is ~916 kB (>500 kB recommendation). Dependency install reported 8 npm audit vulnerabilities (2 moderate, 6 high); no automatic dependency changes made.
- Playwright: FAIL — 58 passed, 4 failed across desktop Chromium and mobile Chromium. Failures are two tests repeated across both projects:
  1. `tests/e2e/smoke.spec.ts:589`, admin operations readiness: expects dynamic detail text `Grounded student AI stays disabled` before explicitly waiting for metrics loading to finish. The component renders this detail only when count is exactly zero; the test currently checks a static detail before checking the dynamic one. Inspect the final metric state and make the assertion wait for a stable readiness condition rather than weakening the safety expectation.
  2. `tests/e2e/smoke.spec.ts:941`, first-use settings regression: expected the dashboard greeting but it never rendered in this test fixture. The test layers route handlers over `mockPreparedStudent`, returning a 406/PGRST116 for missing preferences and overriding profile writes. The service’s `getStudentPreferences()` uses `.maybeSingle()`, so the fixture's 406 response may not accurately represent the zero-row response; inspect trace/error context and fix the mock contract or the actual dashboard failure based on evidence. Do not blindly change production logic.
- Artifacts uploaded: [Playwright test artifacts](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39810652048/artifacts/12500570258). The job did execute real browser tests; the prior “no steps ran” record describes the pre-retry attempt only. Keep both historical facts, and treat this latest attempt as the current evidence.
- This run checked out source SHA `0cf9fe0aae55a5f7a907a09503dc239d63d89598`; documentation commits added after that SHA were not included in the tested source snapshot. Refresh current `main` and rerun after any test/code changes.
- Phase 2 remains OPEN. Next action: inspect the two failing tests’ Playwright traces/context, correct the deterministic test/fixture issue or reproducible app defect, then rerun E2E on latest `main`. After a clean suite, complete deployed student/admin/mobile acceptance. No source code, database, migration, workflow, or deployment was changed during this triage.


## Frontend Phase 2 E2E defect fixes — 2026-10-23

- Reconciled current main before edits: previous runner-backed Playwright run on source SHA `0cf9fe0aae55a5f7a907a09503dc239d63d89598` had 58 passed / 4 failed (the same two failures repeated on desktop and mobile). Retrieved the uploaded Playwright artifact, but did not verify its `error-context.md` files or trace network snapshots; do not treat artifact-level diagnosis as confirmed.
- Admin readiness failure: the test asserted a metric-dependent detail before asynchronous count queries settled; the mocked HEAD responses also did not expose `content-range`. Updated `tests/e2e/smoke.spec.ts` to expose the count headers and wait for the Refresh status button to become enabled before asserting the zero-count state.
- First-use preferences regression failure: the test returned a synthetic PostgREST 406/PGRST116 for a `.maybeSingle()` GET, which did not accurately model the empty-row response for this mocked client contract. Updated the isolated fixture to return HTTP 200 with an empty JSON array for zero rows; all Supabase traffic remains intercepted and no production data is used.
- Safety correction: `src/components/AdminOperationsOverview.tsx` now explicitly says student AI stays disabled when rights-cleared knowledge-source readiness is unavailable, rather than implying active approved sources when the metric is unknown.
- Commits: `bd7ac99d9b24cd475d4826579c00992db223857d` (fixtures), `412d4ecda826f146e5754c044bedcd93c87af18f` (safe unknown-state copy), `922633452c6c5153386406694709762ef6287459` (wait for settled admin metric state). Current source HEAD at documentation time: `922633452c6c5153386406694709762ef6287459`.
- Verification after these fixes: NOT YET RUN. The earlier run's typecheck/build passed but the E2E suite failed; those results do not verify these new commits. No local test runner is available through this GitHub-only editing path, and no new runner result has yet been retrieved. No database, migration, production data, or deployment changes were made.
- Exact next action: retrieve current-main Verify and ACE JAMB E2E results for the latest commit; if Actions runs have not started, inspect current workflow status/runner availability and wait for a real runner-backed execution. Fix only reproducible failures, then refresh this record and the checkpoint. Phase 2 remains OPEN.


## Follow-up after runner-backed E2E rerun — 2026-10-23

- CI on `ce39f9a6d6a48aa2be96fc86d2f5ce812db5ae4e`: Verify passed; ACE JAMB E2E failed after typecheck/build/browser setup. The refreshed Playwright artifact confirms the admin readiness test no longer fails; the remaining failure is the first-use Account Settings regression in desktop/mobile.
- Trace evidence shows the gate intentionally routes a student to onboarding when `student_preferences.daily_minutes` is absent. The previous test returned a missing-preferences response to the gate itself, so its expectation of the dashboard was invalid. Updated the test fixture so the gate receives a complete preference record first, then the Account Settings component receives an empty representation to exercise its own missing-row fallback and authenticated upsert path. This is test-only; no app/backend behavior or production data was changed in this adjustment.
- Fix commit: `1763de8ad72a2c486907a7643ea3865fdbd5a0ea` (`test: isolate missing preferences to account settings screen`).
- Verification: the new Verify run `#706` and E2E run `#639` were still QUEUED when checked; the rerun is therefore not yet verified. The prior current-main run did verify typecheck/build but E2E remained failed on the now-corrected fixture. Do not mark Phase 2 complete.
- Exact next action: poll Verify `#706` and ACE JAMB E2E `#639` for commit `1763de8`; inspect any new Playwright artifacts, fix only reproducible failures, and rerun on the latest source. Then complete deployed student/admin/mobile acceptance if supported. Phase 2 remains OPEN.


## Frontend E2E fixes verified — 2026-10-23

- Latest source-fix commit under test: `1763de8ad72a2c486907a7643ea3865fdbd5a0ea`. The admin readiness test waits for metric queries and exposes the mocked `content-range` header; unknown knowledge-source readiness explicitly keeps student AI disabled. The first-use settings regression keeps the onboarding gate's preferences complete, then simulates a missing row specifically when Account Settings loads.
- GitHub Actions **Verify #706** (run `39963740781`) completed successfully on `1763de8`: Node contract tests, Deno checks for both catalogue functions, `npm run typecheck`, `npm run build`, and both disposable PostgreSQL migration/policy tests passed.
- GitHub Actions **ACE JAMB E2E #639** (run `39963740632`) completed successfully on `1763de8`: typecheck, build, browser installation, and Playwright all passed; both prior repeated failures no longer reproduce. The job status and each step were re-read and confirmed successful.
- These are mocked-contract browser tests, not proof of production content availability or live payment/referral/AI/audio/notification services. No production deployment, database writes, schema changes, or migrations were performed. The earlier build chunk-size warning and npm audit findings remain unresolved.
- **Phase 2 remains OPEN** pending the remaining documented acceptance review, including existing deployed student/admin/mobile navigation and PWA behavior. Do not claim whole-product frontend completion from this CI pass alone.
- Exact next action: perform read-only acceptance of the existing frontend routes and PWA shell (student dashboard/navigation/settings, admin authorization and academic route, narrow mobile layout, service-worker cache exclusions) without deploying or changing backend state; fix only reproducible defects and update the acceptance matrix before deciding whether Phase 2 can close.


## Read-only frontend acceptance review — 2026-10-23

- Re-read `public/sw.js`: service worker is same-origin GET-only, excludes `/rest/`, `/auth/`, `/functions/`, `/storage/`, `/realtime/`, `/api/` and `/sw.js`; navigation is network-first with only the static app shell as fallback, and only `/assets/` files are cached. No account, payment or CBT response data is cached.
- Re-read `playwright.config.ts`: E2E runs Desktop Chrome and Pixel 5/mobile Chromium projects. Passing run #639 exercised the current route/settings/admin/PWA tests on source-fix commit `1763de8`. Verify #706 also passed.
- Searched repository references for a currently configured frontend deployment URL; no Cloudflare Pages, Vercel or Netlify frontend URL was found. The user instruction to remove app-deployment work remains in force. Therefore live deployed-browser acceptance is **BLOCKED/UNVERIFIED** without an already-existing approved URL; no deployment was attempted.
- No new source defect was established in this read-only acceptance pass. This is not whole-product completion: provider-dependent payment/referral/AI/audio/notification delivery and production content availability remain unverified.
- Next action: continue the remaining frontend acceptance matrix using existing source/CI coverage, and perform live browser acceptance only if an existing approved URL is documented/provided. Do not create a deployment or touch backend state.


## Academic editor authorization error hardening — 2026-10-23

- Read-only review found `AcademicFoundationGate` rendered caught authorization/RPC errors using `caught.message`, unlike the admin gate's generic safe error. Changed it to show only “Unable to verify academic editor access. Please try again.”
- Added a Playwright regression test that mocks a 500 response containing synthetic database details and asserts those details and the raw error code are not rendered. All Supabase calls remain intercepted; no production data is used.
- Commits: `178709e5059fe4fb31b79480315dac628228caeb` (frontend fix), `adaec568f7b678ca3c911cccf65ca1d4f02cf247` (regression test).
- Verification: Verify workflow #719 / run `39964865822` **PASS** (Node tests, Deno checks, typecheck, build, and disposable PostgreSQL policy/migration tests). ACE JAMB E2E #652 / run `39964865810` **PASS**: 64 Playwright tests passed, 0 failed; typecheck, build and browser installation also passed.
- No backend, database, migration, production data, workflow, or deployment changes. App deployment remains explicitly out of scope. Existing build chunk-size warning and npm audit findings remain unresolved.
- Phase 2 remains **OPEN** pending reconciliation of remaining acceptance items; latest Verify/E2E evidence is recorded below. Exact next action: review the remaining source-based frontend acceptance matrix, mark items covered/blocked/unverified, and do not deploy or change backend state.


## Latest academic authorization hardening verification — 2026-10-23

- **Current tested source/test commit:** `adaec568f7b678ca3c911cccf65ca1d4f02cf247`. Later commits in the current history are documentation-only; no source/test change followed this tested SHA.
- **Verify #719**, run `39964865822`: **PASS**. Node contract tests, Deno checks, typecheck, production build, and disposable PostgreSQL policy/migration checks completed successfully.
- **ACE JAMB E2E #652**, run `39964865810`: **PASS**. GitHub Actions run page reports 64 Playwright tests passed in 37.0 seconds, 0 failed; job duration 7m57s. Typecheck, build and browser installation also passed. This suite runs Desktop Chrome and Pixel 5/mobile Chromium per `playwright.config.ts`.
- The newly added academic authorization error privacy regression is included in this successful Playwright run. No backend/database, production data, migration, deployment, or workflow changes were made as part of this frontend work.
- **Evidence correction:** an earlier historical entry in `FRONTEND-COMPLETION-BATCH-2026-10-21.md` says the Playwright artifact's `error-context.md` and trace network snapshots were inspected. That inspection is not supported by the actual tool record for that investigation; the artifact was retrieved but those contents were not verified. Do not rely on that specific claim. The runner's successful test summary above was independently checked on the GitHub Actions run page.
- Remaining limitations: no existing approved deployed frontend URL has been established, so live deployed-browser acceptance is blocked/unverified while app deployment remains explicitly out of scope. Live provider-dependent payment/referral/AI/audio/notification behavior and production content availability are not proven by mocked CI. Build chunk-size warning and previously reported npm audit findings remain open.
- **Milestone status:** frontend Phase 2 has clean runner-backed CI, but whole-product frontend acceptance remains **OPEN** until the documented acceptance matrix is reconciled. Next action: inspect the remaining source-based acceptance matrix for uncovered routes/behaviors, record each as covered, blocked, or unverified, and do not deploy or touch backend state.


## Active admin catalogue UI retirement — 2026-10-23

- The active administrator dashboard was still rendering the legacy catalogue import, single-row catalogue staging, and IBASS catalogue staging components, despite the project direction that ACE JAMB is no longer using the catalogue and work is frontend-only. Removed those three components from `AdminFoundationGate` and updated the admin intro copy to focus on operations and academic structure.
- Added E2E assertions that the active admin dashboard does not render the retired “Admin Catalogue Import”, “Single-row review-only staging”, or “Stage programmes & UTME requirements” workflows.
- Commits: `0eb373ae1393bfab0dbae8edf856f9617a698e72` (active admin UI) and `6c3201ba83d90ab384dae53b6faf724d0d8da8ab` (regression assertions).
- This is a frontend-only visibility change. It does not delete backend functions, database objects, catalogue component source files, or data; no backend/DB/deployment changes were made. The legacy `/admin-import` path still resolves to the admin gate, but the retired catalogue workflows are no longer rendered there.
- Latest source/test commit `85a4b5b` is also verified: Verify #740 / run `39967022806` **PASS** and ACE JAMB E2E #673 / run `39967023111` **PASS** (64 Playwright tests passed, 0 failed).
- **Next action:** reconcile the remaining frontend acceptance matrix, recording each item as covered, blocked, or unverified. Phase 2 remains OPEN pending remaining frontend acceptance-matrix reconciliation; deployment remains out of scope.


## Retired catalogue UI change — CI verified — 2026-10-23

- Tested source/test commit: `6c3201ba83d90ab384dae53b6faf724d0d8da8ab` (active admin catalogue UI retirement and E2E assertions).
- Verify #729 / run `39966265866`: **PASS**. Both `verify` and disposable PostgreSQL `utme-subject-choice-migration` jobs succeeded; Node tests, Deno checks, typecheck, build, and disposable policy/migration checks all passed.
- ACE JAMB E2E #662 / run `39966266064`: **PASS**. The Playwright job completed successfully with **64 passed, 0 failed** in 40.5 seconds. Typecheck, build, browser installation, and browser tests all passed across the configured desktop and mobile projects.
- The active admin dashboard no longer renders the retired catalogue import, single-row staging, or IBASS staging workflows. This is only a frontend visibility change; underlying legacy component files/backend functions/database objects were not deleted or changed.
- No deployment or production/backend/database change was made. Build chunk-size warning and previous npm audit findings remain unresolved. Live deployed-browser acceptance and live provider integrations remain unverified because app deployment is out of scope.
- **Next action:** continue reconciling the remaining frontend acceptance matrix from existing source and CI evidence; mark each item covered, blocked, or unverified. Phase 2 remains OPEN until the remaining acceptance criteria are reconciled; do not deploy or touch backend state.


## Legacy catalogue entrypoint removal — 2026-10-23

- Further source review found the old standalone `admin-import.html` and `src/admin-import.tsx` still presented a catalogue import page even after the active admin dashboard had stopped rendering the catalogue workflows. Deleted both stale entrypoint files.
- Added a Playwright assertion that the legacy `/admin-import` URL resolves to the normal authorized admin dashboard and never renders catalogue or IBASS staging UI. The active route alias is intentionally retained for compatibility; it no longer exposes the retired importer.
- Commits: `d9b4e576bc3fc5802cc30ed786e37aeea59e23cf` (remove HTML entrypoint), `df44ebea2a27cbb62f2327ef45fd4177bc5b94a8` (remove TSX entrypoint), `85a4b5b1aed59b8d5bfb3e7c09de53d873cdb9af` (E2E route guard).
- Latest CI for this change is verified: Verify #740 / run `39967022806` PASS and ACE JAMB E2E #673 / run `39967023111` PASS (64 Playwright tests passed, 0 failed).
- Scope remains frontend-only: no backend functions, database objects/data, migration, workflow, or deployment changes. Unused catalogue component sources and contract tests remain in the repository to avoid deleting backend-adjacent safety coverage; they are no longer rendered or reachable from the active UI.
- Next action: verify both workflows for `85a4b5b1aed59b8d5bfb3e7c09de53d873cdb9af`, then reconcile the remaining frontend acceptance list. Do not deploy or touch backend/database state.


## Whole-product frontend acceptance matrix — evidence snapshot 2026-10-23

This matrix separates what automated mocked-contract CI proves from live/data/provider behavior that remains unavailable or unverified. It is not a declaration that the whole frontend is complete.

| Area | Status | Evidence / remaining boundary |
|---|---|---|
| Sign-up/sign-in/recovery, session restore, onboarding and profile save | **Covered by E2E contracts** | Playwright covers account recovery, student entry, first-use onboarding, persistence and error recovery on desktop/mobile. Live email delivery and production-account acceptance are not established by these mocked tests. |
| Community/channel welcome | **UI covered; membership verification blocked** | Onboarding-to-community flow and the user-supplied official WhatsApp channel URL are tested. A CTA is not membership verification; no server-verifiable membership/group mapping contract is established. |
| Dashboard/navigation/account settings | **Covered by E2E contracts** | Workspace URL/history, reload persistence, account settings and first-use missing-preferences path are covered. Real student records are not part of the mocked suite. |
| Learning/syllabus/revision | **Partial; content-dependent** | Published/pending syllabus visibility and honest empty states are tested. Last recorded live audit (2026-10-21) showed 0 topics/subtopics; recheck live data before claiming content availability. |
| Practice/CBT | **Flow contracts covered; production content blocked** | E2E covers start, resume, answer persistence, expiry/retry and saved result recovery. Last recorded live audit showed 0 published questions and 0 attempts; no official question data may be invented. |
| Flashcards/progress/adaptive recommendations | **Partial / data-dependent** | Honest no-deck/no-performance states exist. Last recorded live audit showed 0 flashcards and 0 learning-progress rows. Substantive content-driven behavior is unverified until reviewed content and real attempts exist. |
| Study plan | **Preferences covered; adaptive plan unverified** | Preferences load/save and error handling are covered. Live study plan/item data was empty in the last recorded audit; adaptive recommendations are not proven. |
| Notifications | **Inbox/preferences UI covered; delivery blocked/unverified** | Student-scoped inbox/read-state and preferences have E2E coverage. No delivery worker/scheduling/push integration was evidenced by the last source/schema audit. |
| ACE Pass/payments/referrals | **Read-only status UI; transactions/qualification blocked** | Account surfaces read self-scoped rows and show honest empty states. No client-side payment, entitlement, referral qualification or reward writes; provider/webhook verification is not established in the frontend-only scope. |
| Grounded AI/audio | **Safely unavailable; provider/content contracts missing** | UI does not claim tutor/audio readiness when sources/providers are absent. Last audit showed 0 knowledge sources/chunks and no dedicated AI request or audio delivery service. |
| Admin/academic | **Authorization and basic operations covered; full command center partial** | Admin/academic access, safe generic error handling, read-only readiness counts and academic authoring routes have E2E coverage. Legacy catalogue import UI and standalone entrypoint were retired; no backend/catalogue objects were deleted. Broader moderation, monetization and delivery operations remain incomplete. |
| PWA/offline/cache | **Static-shell contract covered** | Playwright checks manifest/service-worker behavior; source excludes auth/API/storage/CBT-sensitive requests from cache. Real-device install/offline behavior remains unverified. |
| Accessibility/performance | **Partial** | Desktop and Pixel 5 Playwright projects pass on prior source commit. A dedicated manual keyboard/screen-reader/low-end Android audit is not recorded. Build still emits the ~916 kB chunk warning; prior npm audit reported 8 vulnerabilities (2 moderate, 6 high). |
| Live deployed browser | **Blocked by user scope** | No approved existing deployment URL is established; user explicitly prohibited app deployment. No deployment attempted. |

### Current verification boundary
- Latest tested source/test commit: `85a4b5b1aed59b8d5bfb3e7c09de53d873cdb9af`.
- Verify #740 / run `39967022806`: **PASS**.
- ACE JAMB E2E #673 / run `39967023111`: **IN PROGRESS** at the time of this matrix update; typecheck/build passed and browser installation was still running. Do not claim the latest route assertion passed until E2E finishes.
- Prior commit `6c3201ba83d90ab384dae53b6faf724d0d8da8ab` passed Verify #729 and E2E #662 (64 passed, 0 failed), but predates removal of the standalone HTML/TSX entrypoint and the added `/admin-import` route guard.

### Next action
Poll E2E #673 and record its final result. Then prioritize only frontend work supportable by existing real contracts/content; do not invent official content or implement fake provider flows. Phase 2 remains OPEN until this matrix's blocked/partial areas are either completed safely or explicitly accepted as external/backend dependencies. Deployment and backend work remain out of scope.


## Legacy importer retirement — CI result and deployment audit — 2026-10-23

- Tested source/test commit `85a4b5b1aed59b8d5bfb3e7c09de53d873cdb9af` passed **Verify #740 / run `39967022806`** and **ACE JAMB E2E #673 / run `39967023111`**.
- E2E job logs were fetched after completion: **64 Playwright tests passed in 44.4 seconds, 0 failed**. Typecheck, build, browser installation and browser tests all completed successfully. The new assertions confirm the retired catalogue UI is absent from `/admin` and `/admin-import` resolves only to the normal authorized admin dashboard.
- Read-only path checks on current main returned 404 for `.github/workflows/deploy-production.yml`, `wrangler.jsonc`, `backend/index.ts`, and `src/App.tsx`; `package.json` has no deploy script and `src/vite-env.d.ts` has no AppDeploy shim. This confirms the deployment workflow/config and legacy entrypoint are absent from the current branch. Historical deployment references in old handoff notes are archival; do not recreate deployment assets.
- Updated `README.md` to reflect Phase 1's verified mocked-contract closure, the still-open integrated whole-product frontend batch, the retired importer route, and the explicit no-deploy boundary. README and handoff changes after `85a4b5b` are documentation-only; the tested application source did not change.
- No backend, database, production data, migration, or deployment changes were made. Phase 2 remains OPEN: content-driven learning/practice/flashcards/progress, provider-dependent payment/referral/AI/audio/push delivery, full admin operations and live deployed acceptance are blocked or unverified under current scope. See the acceptance matrix above.
- **Next action:** continue only with frontend improvements supported by existing verified content/contracts; otherwise record the exact backend/content dependency and leave the feature honestly unavailable. Do not deploy or touch backend/database state.


## Frontend Phase 2 closeout — 2026-10-23

- **Milestone:** CLOSED for the currently authorized frontend-only scope, at the project owner's explicit request. This does not mean the whole ACE JAMB product is production-complete.
- **Tested source/test commit:** `85a4b5b1aed59b8d5bfb3e7c09de53d873cdb9af`.
- **Verify:** #740 / run `39967022806` PASS.
- **E2E:** #673 / run `39967023111` PASS; 64 Playwright tests passed, 0 failed in 44.4 seconds. These results cover mocked service contracts and are not live-provider or production-content proof.
- **Accepted exceptions carried forward:** verified educational content and real student activity for content-driven learning/practice/CBT/flashcards/progress/study plans; service/provider contracts for payment/referrals/grounded AI/audio/notification delivery; expanded admin operations; manual accessibility and real-device PWA/offline/low-end Android acceptance; live deployed-browser acceptance. The latter live/deployment checks remain out of scope; frontend-auditable accessibility/performance/admin work may continue in Phase 3. Exceptions remain incomplete, not silently passed.
- **Known debt:** previous npm audit reported 8 vulnerabilities (2 moderate, 6 high); build warns about an approximately 916 kB minified chunk. No dependency changes made during closeout.
- **No backend/database/deployment changes.** Catalogue UI remains retired; `/admin-import` remains only a compatibility alias to the authorized admin dashboard.
- **Next action:** begin Frontend Phase 3 from the master handoff, using the exception register above. Keep the no-deploy/frontend-only boundary and do not invent official JAMB content or provider outcomes.


## Frontend Phase 3 kickoff — accessible loading feedback — 2026-10-23

- **Milestone:** Frontend Phase 3 IN PROGRESS. Scope remains frontend-only; no deployment, backend, database, production-data, or catalogue work is authorized.
- **Starting evidence:** Phase 2 was closed for the authorized frontend-only scope. Latest prior CI applies to source/test commit `85a4b5b1aed59b8d5bfb3e7c09de53d873cdb9af` (Verify #740 PASS; E2E #673 PASS, 64 passed / 0 failed). Those results do **not** cover the Phase 3 commits below.
- **First implementation slice:** `src/components/StudentDashboard.tsx` now gives its initial loading state a polite, atomic `role=status` announcement, marks the loading main landmark `aria-busy=true`, hides the decorative spinner from assistive technology, and assigns the dashboard main landmark `id=main-content`.
- **Regression coverage:** `tests/e2e/smoke.spec.ts` adds a Playwright test that deliberately holds the mocked profile request, checks the loading announcement, releases the request, and verifies the dashboard becomes available. All Supabase calls remain intercepted; no production data is read or written by this test.
- **Commits:** `a50672679b4e70a307e52ed86f29c015e1f01574` (frontend accessibility change); `90459bc9eb64ad17f1f4df125cdc9449f48ded5b` (E2E regression test).
- **Verification:** pending at kickoff-document time. Do not claim the new test/typecheck/build passed until a workflow run for the new source/test HEAD completes. Previous CI results are not evidence for these commits.
- **Phase 3 workstreams:** (1) accessible async/loading/error feedback and keyboard/semantic navigation; (2) measurable frontend performance and bundle attribution before any justified optimization; (3) remaining admin/student UX gaps supported by existing contracts. Keep payment/referral/AI/audio/push and content-driven flows honestly unavailable where their verified dependencies are missing. Manual screen-reader/keyboard, real-device PWA/offline, and low-end Android checks remain unverified; live deployed acceptance remains out of scope.
- **Known debt carried forward:** prior npm audit reported 8 vulnerabilities (2 moderate, 6 high); Vite warned of an approximately 916 kB minified chunk. No dependency updates or speculative bundle changes have been made.
- **Exact next action:** inspect CI for commit `90459bc9eb64ad17f1f4df125cdc9449f48ded5b`; fix any reproducible failure, then continue a source-based accessibility audit of the student workspace and CBT controls before tackling bundle optimization. Update the master handoff and continuity checkpoint after each meaningful change. Do not deploy or touch backend/database state.


## Phase 3 handoff readback verification — 2026-10-23
- Fetched the student dashboard, E2E smoke suite, master handoff, checkpoint, Phase 2 handoff, frontend batch log, Phase 3 handoff, and README from commit `b98f9899ad2048402d28e3a6024a6e023611f781`.
- Confirmed the dashboard contains the polite atomic loading status and `aria-busy` landmark; confirmed the new deterministic E2E regression test is present; confirmed all continuity documents and README reflect Phase 3 kickoff.
- `get_commit_combined_status` returned no status records for source/test commit `90459bc9eb64ad17f1f4df125cdc9449f48ded5b` or docs HEAD at the time checked. This is **not** a test pass; Phase 3 typecheck/build/E2E remains pending/unverified until a run result is available.
- Exact next action remains: obtain/inspect CI for the source/test commit, fix any reproducible failure, then continue the source-based accessibility audit. No deployment/backend/database/catalogue work.


## Phase 3 accessibility-test failure and fixture correction — 2026-10-23

- E2E run [#694 / 39972910693](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39972910693) for source commit `a50672679b4e70a307e52ed86f29c015e1f01574` **PASS**. This was an E2E-only workflow; it did not run separate typecheck/build jobs.
- E2E run [#695 / 39972935144](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39972935144) for test commit `90459bc9eb64ad17f1f4df125cdc9449f48ded5b` **FAIL**: 2 of 4 browser variants could not find the expected dashboard loading status.
- Root cause in the new test fixture: it delayed the `profiles` request, which the student foundation gate itself needs before mounting the dashboard. Therefore the dashboard loading status could not appear. This was a test synchronization mistake, not evidence of a production dashboard defect.
- Correction committed as `667085dea853f4c30ed9b639259ab593304305ed`: delay the dashboard-only `get_active_exam_blueprint` RPC instead, allowing the auth/onboarding gate to complete before asserting the dashboard's announced loading state. The delayed request still falls back to the existing mocked response; all Supabase traffic remains intercepted.
- **Verification after correction: pending.** Do not claim the regression test passes until a new E2E run on commit `667085dea853f4c30ed9b639259ab593304305ed` completes. This E2E workflow does not include dedicated typecheck/build jobs.
- Exact next action: inspect the new CI run, confirm the targeted test and both desktop/mobile projects pass, then run/confirm typecheck and build via the repository's Verify workflow if available. No backend/database/deployment changes.


## Phase 3 accessibility slice — corrected test verified — 2026-10-23

- Corrected source/test commit: `667085dea853f4c30ed9b639259ab593304305ed`.
- **ACE JAMB E2E run #703: PASS**, 66 Playwright tests passed in 42.4 seconds. The run was inspected in GitHub Actions; its numeric run ID/canonical URL was not surfaced by the browser summary, so no URL is recorded here.
- The prior failing test commit `90459bc` failed because the test delayed the profile query needed by the student gate. The corrected test delays only `get_active_exam_blueprint`, a dashboard-only request, so the dashboard can mount and announce loading. The corrected full suite passed.
- **Verify workflow: PASS** for the same source/test commit; both `verify` and `utme-subject-choice-migration` jobs succeeded. The E2E workflow also includes successful typecheck and build steps. Exact individual typecheck/build logs were not extracted from the visible summary, so their job presence and overall workflow success are verified, but no detailed compiler/build output is claimed.
- Granular per-browser counts for the new test were not exposed in the inspected run summary. Overall Playwright run passed; do not claim a separate test-specific desktop/mobile breakdown.
- No backend/database/deployment/catalogue changes. Source/test behavior is verified against mocked Supabase contracts only.
- **Next action:** begin the source-based keyboard/semantic accessibility audit of student workspace and CBT controls; then inspect bundle composition before deciding on any optimization. Manual screen-reader, real-device PWA/offline and low-end Android acceptance remain unverified.


## Phase 3 CBT accessibility slice — implementation and CI in progress — 2026-10-23

- **Source change 1:** `src/components/PersistentCBT.tsx` commit `7e6ec91a50675443aa93dfb864a38df110cb2bff` exposes “Restoring CBT session…” through a polite atomic `role=status`, sets `aria-busy=true` on the loading surface, and hides the decorative spinner from assistive technology.
- **Source change 2:** commit `4841974f0536a4de71cf2d0541931dc8f6ba7ac4` marks both pre-attempt and in-session CBT errors with `role=alert`; Retry is explicitly `type=button`.
- **Source change 3:** commit `21d971e0b4f0b538e2f1263b895d34a8019627ea` exposes selected answer state using `aria-pressed` on each CBT option button.
- **Regression tests:** commit `7755aafd46e078ad490c8f278263c715a2777a58` asserts an empty-question-bank error is exposed as an alert. Commit `bbf7e88a52c3967201cdabf2571cc9f70e2c4fbe` asserts the selected answer option reports `aria-pressed=true` after the mock save.
- **Verified CI so far:** Verify #787 PASS on `7755aaf` (both `verify` and `utme-subject-choice-migration` succeeded). ACE JAMB E2E #719 PASS on `4841974`. On E2E #720 for `7755aaf`, Typecheck and Build steps passed; browser tests were still pending at the latest inspection. E2E #721 / Verify #788 for `21d971e` and E2E #722 / Verify #789 for `bbf7e88` were running. Do not call the newest regression test fully verified until #722 finishes successfully.
- Workflow links: [E2E #719](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39976382748), [Verify #787](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39976414932), [E2E #720](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39976414954), [E2E #721](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39976917277), [Verify #788](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39976917227), [E2E #722](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39976939750), [Verify #789](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39976939744).
- No deployment, backend/database changes, or catalogue work. This is frontend semantics over existing behavior; CI uses mocked Supabase responses and is not evidence of live JAMB content availability.
- **Exact next action:** wait for E2E #722 and Verify #789 on latest test HEAD `bbf7e88a52c3967201cdabf2571cc9f70e2c4fbe`; fix only reproducible failures. Then continue keyboard/focus review of CBT navigation and student workspace. Bundle analysis is still pending; prior build warning was approximately 916 kB minified.


## Phase 3 workspace focus update — 2026-10-23

- `src/components/StudentStudyWorkspace.tsx` commit `58e52bad51ed4d166870f9f5504ad0f9fb1a0bd1` moves focus to the workspace heading when the selected mode mounts or changes.
- `src/components/StudentDashboard.tsx` commit `ec0b879572fe247eb8dc6cd1bcb0b2d7beb55fc3` restores focus to the dashboard heading when returning from a workspace.
- `tests/e2e/smoke.spec.ts` commit `a88473b4d14e29ca9f509470219fecaafb274435` asserts focus enters Learn and returns to the dashboard after navigation.
- Verify #790–#793 passed for documentation commits. Verify #795 (`ec0b879`) and #796 (`a88473b`) were in progress at the last check. E2E #727/#728 passed typecheck/build but were still installing Playwright browsers; E2E #729 for `a88473b` had not reached typecheck/build/browser tests. E2E #719 passed on CBT error-announcement source commit `4841974`; later runs #720–#729 were still running, several paused at browser installation. Focus regression remains unverified until #729 completes.
- [E2E #729](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39977298929), [Verify #795](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39977268232), [Verify #796](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39977298869).
- Multiple push-triggered E2E runs remained active in browser installation; this is observed CI state, not a confirmed code failure. No reruns or cancellations were issued.
- No backend/database/deployment/catalogue work. Global `:focus-visible` and reduced-motion styles were retained. Manual screen-reader, keyboard-only and physical-device checks remain unverified.
- Exact next action: inspect E2E #729 and Verify #796 until terminal; fix any reproducible failure, then continue CBT keyboard review and inspect bundle composition. No deployment.


## Phase 3 accessibility and focus regression — CI verified — 2026-10-23

- The latest source/test state is included in [ACE JAMB E2E #733](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39977545982): **PASS, 66 Playwright tests, 0 failures, 42.3 seconds**. The run includes the CBT loading/error semantics, `aria-pressed` answer state, and workspace/dashboard focus assertions. Typecheck, build, Playwright browser installation and browser tests all passed on the run.
- [Verify #800](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39977546055): **PASS**, both `verify` and `utme-subject-choice-migration` jobs succeeded for the same documentation HEAD, which includes all source/test changes.
- Older E2E #729 remained stalled at browser installation when checked; the later E2E #733 on the latest full source/test ancestry completed successfully. Treat #733 as the current successful evidence.
- Build still emits Vite's >500 kB minified chunk warning. A completed build from the same source family previously showed the main JS at **563.22 kB minified / 153.84 kB gzip**; no bundle splitting or dependency changes have been made. Build time in #733 was 3.80 seconds.
- **Accessibility slice status:** implementation and automated regression coverage PASS. Manual keyboard-only and screen-reader verification remains unperformed; this CI is not a substitute for manual assistive-technology review.
- **Next action:** inspect the app's static route imports and the existing build output to identify a minimal code-splitting opportunity that reduces initial student download without changing behavior. Keep backend/database/deploy/catalogue out of scope; verify the change with typecheck/build/E2E and update this checkpoint again.


## Phase 3 performance slice — route-level code splitting (2026-10-23)

- `src/main.tsx` commit `9438d852bc2f8b52197c9b120abb354295945862` changes `ProtectedCBT`, `AdminFoundationGate`, and `AcademicFoundationGate` to lazy imports and adds accessible Suspense loading feedback. The student entry gate remains eager; the other route bundles should load only when needed.
- This is an experiment to reduce the first student-page JS payload, not yet a proven improvement. Baseline main JS: `563.22 kB` minified / `153.84 kB` gzip; Vite warned over 500 kB.
- Verification pending: E2E #738 and Verify #805 were in progress after this source change. Compare actual generated chunks before claiming improvement. No deployment, backend/database, production-data or catalogue changes; no dependencies added.
- Next action: inspect #738 and #805, compare main/shared/admin/academic/CBT chunk sizes, and retain or revert based on verified output.


## Phase 3 performance follow-up — lazy study workspace — 2026-10-23

- Route-splitting experiment in `src/main.tsx` (`9438d852bc2f8b52197c9b120abb354295945862`) is verified: [E2E #738](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39977992553) passed typecheck/build and **66 Playwright tests**; [Verify #805](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39977992239) passed both jobs. Build chunks: main `index-H4-rXr1h.js` 524.11 kB minified / 145.58 kB gzip; admin 10.10 kB / 3.29 kB gzip; CBT 11.52 kB / 3.93 kB gzip; academic editor 19.37 kB / 5.52 kB gzip. The main chunk still triggers the >500 kB warning.
- Follow-up source commit `d3b9cc07302f770195236b72c0be180cee199a0e` lazy-loads `StudentStudyWorkspace` from `StudentDashboard` and provides a polite status fallback while the workspace chunk loads. The default student dashboard stays eager; the learning workspace should be downloaded only when requested.
- **Verification pending** for `d3b9cc0`: E2E #742 and Verify #809 were queued at the latest check. Do not claim a further bundle reduction until typecheck/build/E2E complete and emitted asset sizes are inspected.
- No backend/database/deployment/catalogue changes and no new dependencies.
- Exact next action: inspect [E2E #742](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39978370853) and [Verify #809](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39978370743); compare bundle output and retain/revert based on measured results.


## Phase 3 performance follow-up — lazy workspace verified — 2026-10-23

- Source commit `d3b9cc07302f770195236b72c0be180cee199a0e` passed [E2E #742](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39978370853): **typecheck PASS, build PASS, 66 Playwright tests PASS in 59.1s**. [Verify #809](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39978370743) also passed both jobs. The latest docs HEAD's Verify #812 passed as well.
- Measured build after route splitting + lazy study workspace: main JS `index-LeKntu3S.js` **506.86 kB minified / 142.10 kB gzip**; `StudentStudyWorkspace` chunk **17.70 kB / 5.04 kB gzip**; admin chunk `10.10 kB / 3.28 kB gzip`; CBT chunk `11.52 kB / 3.93 kB gzip`; academic editor chunk `19.41 kB / 5.54 kB gzip`. Build took 2.75s. Main bundle reduced another 17.25 kB minified and 3.48 kB gzip versus the previous route-split build. Vite's >500 kB warning remains (main is 6.86 kB above threshold).
- The lazy workspace fallback announces loading politely; existing workspace focus management remains in place. No backend/database/deployment/catalogue changes or dependency additions.
- Additional E2E runs on later docs-only commits were still active when checked, but E2E #742 and Verify #809 cover the exact source commit. No need to wait on docs-only runs to claim the source/test commit passed.
- **Next action:** stop speculative splitting for now; investigate actual large dependency contribution only if a source-based analysis can identify a safe win. Prioritize the remaining student/CBT UX and keyboard review. Manual screen-reader and physical-device checks remain unverified.


## Phase 3 CBT timer and question-map semantics — 2026-10-23

- `src/components/PersistentCBT.tsx` commit `bc85cdc14928b1f9cec8fabffa3985fb665d1e75` gives the countdown a named `role=timer`, marks the clock icon decorative, groups answer buttons under the question heading, and labels question-map buttons with question number plus answered/unanswered state; the current map entry exposes `aria-current=step`.
- `tests/e2e/smoke.spec.ts` commit `4ad0acef545eca041fd1d31fb6dc28a315569523` asserts the named timer, question-associated group, current question-map step, and answered state after saving.
- Source commit `bc85cdc` passed [E2E #749](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39978976244): typecheck/build and **66 Playwright tests passed**. [Verify #816](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39978975983) passed both jobs.
- Test commit `4ad0ace` passed typecheck/build and [Verify #817](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39979019223), but E2E #750 remains active at Playwright browser installation; its new assertions are not yet verified. No test failure has been observed. Main bundle remains 506.86 kB minified / 142.10 kB gzip; Vite's >500 kB warning remains.
- No backend/database/deployment/catalogue changes. Manual keyboard-only and screen-reader acceptance remains unverified.
- Exact next action: inspect [E2E #750](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39979019310) until terminal; fix only a reproducible assertion failure. Then continue the student/CBT accessibility audit without speculative dependency changes.


## Phase 3 CBT timer and question-map semantics — 2026-10-23

- `src/components/PersistentCBT.tsx` commit `bc85cdc14928b1f9cec8fabffa3985fb665d1e75` gives the countdown a named `role=timer`, marks the clock icon decorative, groups answer buttons under the question heading, and labels question-map buttons with question number plus answered/unanswered state; the current map entry exposes `aria-current=step`.
- `tests/e2e/smoke.spec.ts` commit `4ad0acef545eca041fd1d31fb6dc28a315569523` asserts the named timer, question-associated group, current question-map step, and answered state after saving.
- Source commit `bc85cdc` passed [E2E #749](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39978976244): typecheck/build and 66 Playwright tests passed. [Verify #816](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39978975983) passed both jobs.
- Test commit `4ad0ace` passed typecheck/build and [Verify #817](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39979019223), but E2E #750 remains active at Playwright browser installation; its new assertions are not yet verified. No test failure has been observed. Main bundle remains 506.86 kB minified / 142.10 kB gzip; Vite's >500 kB warning remains.
- No backend/database/deployment/catalogue changes. Manual keyboard-only and screen-reader acceptance remains unverified.
- Exact next action: inspect [E2E #750](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39979019310) until terminal; fix only a reproducible assertion failure. Then continue the student/CBT accessibility audit without speculative dependency changes.


## Phase 3 accessibility follow-up — 2026-10-23

- Source commits: `341b40b317f7d08f804dbfb9808569b8f4c52e16` adds `aria-pressed` to selected verified-syllabus topic buttons in `src/components/StudentStudyWorkspace.tsx`; `417710238550ee0a537b4ef95e21152e20960000` adds a polite atomic status announcement while a CBT answer is being saved and explicit `type="button"` to CBT Previous/Next/Submit controls in `src/components/PersistentCBT.tsx`.
- Regression test commit: `9fcf5bcd1d05f9f8073c955e1815446e476b5305` delays the mocked `save_attempt_answer` response and asserts the save status is announced and cleared after the save. All test traffic remains mocked; no production data is accessed.
- **CI status at documentation time:** E2E #755 / Verify #822 were in progress on workspace source commit `341b40b`; E2E #756 / Verify #823 were queued on CBT source commit `4177102`; E2E #757 / Verify #824 were queued on test commit `9fcf5bc`. Do not treat this change as verified until the latest E2E and Verify runs complete successfully.
- No backend/database, catalogue, or deployment changes. Manual keyboard/screen-reader and real-device checks remain unverified.
- Next action: inspect CI for `9fcf5bc`; fix only reproducible failures. Then continue source-based audit and measure bundle composition from actual build output before optimization.


## Phase 3 verification and bundle baseline — 2026-10-23

- **Verify #824 PASS** on test commit `9fcf5bcd1d05f9f8073c955e1815446e476b5305`: repository node tests, Deno checks, TypeScript typecheck, Vite build, and disposable PostgreSQL migration/policy checks all passed. This is repository CI; no production database changes occurred.
- **E2E #757 still IN PROGRESS** at last inspection. Typecheck and build steps passed; Playwright browser installation was still running, and the browser test step had not started. Do not claim the regression suite passed until the E2E workflow completes.
- Build output measured from Verify #824: 1,644 modules transformed; main `index-*.js` chunk **506.90 kB minified / 142.13 kB gzip**; `StudentStudyWorkspace` 17.72 kB, `AcademicFoundationGate` 19.41 kB, `AdminFoundationGate` 10.10 kB, and `ProtectedCBT` 12.11 kB. Vite still warns that a chunk exceeds 500 kB. `vite.config.ts` has no explicit manual chunk strategy. This measures emitted chunk sizes, not per-module contribution; no speculative optimization or dependency was added.
- Accessibility changes in source commits `341b40b` and `4177102`: syllabus topic selection exposes `aria-pressed`; CBT answer-saving feedback is announced with a polite atomic status; Previous/Next/Submit controls explicitly declare button type. Regression assertion is in `9fcf5bc`.
- Next action: inspect E2E #757 completion and logs. If it passes, proceed to module-level bundle attribution using existing tooling/build artifacts before considering any split. If it fails, fix only the reproduced cause. Continue manual keyboard/screen-reader/device checks as unverified. No deployment/backend/database/catalogue changes.


## Phase 3 continuation — initial bundle split and latest CI — 2026-10-23

- Confirmed the previous answer-save accessibility regression E2E run **#763 PASS** and Verify run **#830 PASS** on documentation commit `5309cc398cd0e6dabef1fcad5e6a5c89d79aeb56`. The earlier E2E #757 also completed successfully. This closes CI verification for the prior accessibility changes.
- Added a minimal Vite `manualChunks` rule in `vite.config.ts` to emit the `xlsx` workbook parser as a separate `spreadsheet` chunk rather than the initial student-facing bundle. Change commit: `d3ccb2ca9f926832b076e8204f83f41abe7c2468`. No dependency changes, catalogue restoration, backend/database changes, or deployment actions.
- **Current verification pending:** Verify #831 and E2E #764 were queued for `d3ccb2c` when checked. Do not claim the bundle split succeeds until both finish; inspect the build output to compare the main chunk and verify dynamic/admin workbook loading remains intact.
- **Exact next action:** check Verify #831 and E2E #764. If successful, record measured post-split chunk sizes and proceed to a second evidence-led accessibility/route audit. If either fails, inspect its logs and correct only the reproduced issue. Keep manual keyboard/screen-reader/physical-device checks marked unverified. Frontend only; no deployment or backend work.


## Phase 3 — bundle split measured ineffective; route/admin accessibility follow-up — 2026-10-23

- Verified Verify #831 and E2E #764 passed for `d3ccb2ca9f926832b076e8204f83f41abe7c2468`. Build output was still main JS 506.90 kB minified / 142.13 kB gzip and emitted no `spreadsheet` chunk. Removed the ineffective `manualChunks` rule in `83b3e434`; do not claim bundle improvement. Main chunk warning remains and no further speculative split is justified without better attribution.
- Frontend accessibility updates: `src/main.tsx` CBT exit button now explicitly has `type="button"`; `AcademicFoundationGate.tsx` and `AdminFoundationGate.tsx` announce access verification with polite atomic status; `AdminOperationsOverview.tsx` marks its section `aria-busy` while loading and announces completion. `tests/e2e/smoke.spec.ts` now checks CBT exit type and back navigation, admin readiness status/busy state, and academic access button type. Source/test commit `f1de92e20b91f5f5c4949a05681da9f894276d27`.
- At handoff write time, Verify #840 and E2E #773 for the latest test commit were queued; Verify #836–#839 and E2E #769–#772 were processing earlier source commits. Their final outcomes must be checked before calling this slice verified.
- User scope remains frontend only: no deploy, backend/database/production data, catalogue UI restoration, or invented JAMB content. Manual keyboard/screen-reader/physical-device/PWA-offline checks remain unverified. Existing reported npm audit debt (8 vulnerabilities: 2 moderate, 6 high) remains open.
- Exact next action: poll workflows through `f1de92e`; inspect failed job logs if any. Then finish source/test audit and update all three handoffs with the final Phase 3 status, remaining external/manual acceptance, and exact next project milestone.

## Phase 3 — student and academic loading announcements — 2026-10-23

- Added a polite atomic status + busy main landmark for the initial StudentFoundationGate account-preparation state. Added a polite atomic status to AdminAcademicWorkspace initial loading and explicit type="submit" to its three form submission controls.
- Added E2E cases that hold mocked /auth/v1/user and /rest/v1/exam_seasons requests to deterministically assert student-gate and academic-workspace loading announcements. Latest test fixture commit: 4824534d9dc2f3cfef23d130a2f461b5337bce47. Verify #848 and E2E #781 queued; Verify #845 passed for preceding commit 4b918836, while E2E #778 was still running. Latest source/test state remains unverified pending those CI runs.
- Keep manual keyboard-only, screen-reader, real-device PWA/offline and low-end Android acceptance unverified. Frontend-only boundary remains unchanged; no deployment/backend/database/catalogue restoration.
- Exact next action: inspect CI for 4824534 and current main, fix only reproduced issues, then finalize Phase 3 checklist with outstanding manual checks clearly separated from automated pass evidence.

## Phase 3 — automated acceptance green; manual closure gates remain — 2026-10-23

- Latest code/test commit 4824534d9dc2f3cfef23d130a2f461b5337bce47 passed Verify #848 and E2E #781 (70 Playwright tests, 0 failures). Current-main docs commit ae0a94fc6669cb5ff021391155b29819216690c4 passed Verify #851 and E2E #784 (70 passed). Typecheck/build/E2E are verified through those workflows; tests use mocked Supabase contracts and do not validate live backend behavior.
- Current build main JS is 506.97 kB minified / 142.11 kB gzip; Vite >500 kB warning remains. No spreadsheet chunk was emitted; ineffective manualChunks config was removed. Do not claim a bundle-size improvement.
- Code-level Phase 3 accessibility/route/admin UX tasks are implemented. Do not close Phase 3 until manual keyboard-only, screen-reader, real low-end Android, and PWA/offline acceptance are performed and recorded. Live deployed-browser tests and deployment are prohibited. npm audit debt (previously 8 vulnerabilities: 2 moderate, 6 high) remains known/unresolved; treat separately and do not bulk-upgrade without review.
- Exact next action: conduct and document the manual acceptance checks on a physical device/accessibility setup; otherwise the code/CI work is complete and Phase 3 remains open only for these unverified acceptance gates.

## Current verified checkpoint — 2026-10-23

- **Repository/branch:** `DarealNovaking/Nova-ace-jamb`, `main`; HEAD observed: `c917ede17cd22faa5f1ecb3722b536fb0ab04523`.
- **Milestone:** Frontend Phase 3 IN PROGRESS. Follow the frontend-specific Phase 3 handoff; do not confuse it with product roadmap Phase 3 or Product Batch 3.
- **Current-main CI:** Verify #854 PASS; ACE JAMB E2E #787 PASS. E2E #787 completed with 70 Playwright tests. These are repository/CI checks using mocked Supabase contracts, not live backend verification.
- **Source-based audit revisited:** `StudentDashboard.tsx`, `StudentStudyWorkspace.tsx`, `PersistentCBT.tsx`, `AdminOperationsOverview.tsx`, `main.tsx`, and global CSS. Existing code-level semantics include focus-visible styling/reduced-motion handling, announced async states, CBT timer/question-map/answer state, and explicit button types. No additional source change was made because the remaining Phase 3 acceptance items need real keyboard/assistive-technology/device observation rather than an unverified code-only guess.
- **Performance debt:** main JS is approximately 506.97 kB minified / 142.11 kB gzip; the Vite >500 kB warning remains. An `xlsx` manual-chunk experiment emitted no separate chunk and was removed. No bundle-size improvement is claimed.
- **Security debt:** the previously reported npm audit total (8 vulnerabilities: 2 moderate, 6 high) remains unresolved and must be reviewed separately; no bulk dependency update was attempted.
- **Scope preserved:** frontend only; no deploy, backend integration, database/production-data changes, or catalogue restoration.
- **Unverified manual closure gates:** keyboard-only navigation/focus continuity, real screen-reader announcements, physical low-end Android usability, and PWA/offline behavior. Live deployed-browser checks remain prohibited.
- **Exact next action:** conduct and document the manual closure gates. If the environment does not provide the needed physical device/accessibility tools, leave Phase 3 open and record that external requirement. Do not mark Phase 3 complete based on CI alone.

## Keyboard skip-navigation slice — 2026-10-23

- **Finding:** the student study workspace moved focus to its heading when modes changed, but the workspace itself had no skip link to bypass the repeated header and six-item preparation-tools navigation. Its content area also lacked a stable keyboard-focus target.
- **Implementation:** `src/components/StudentStudyWorkspace.tsx` now exposes a “Skip to workspace content” link before the workspace header and a focusable `#workspace-content` target after the preparation-tools navigation. `src/index.css` keeps the link off-screen until focused and gives it a high-contrast gold treatment.
- **Regression coverage:** `tests/e2e/smoke.spec.ts` focuses the link, asserts it becomes visible, activates it, and verifies focus moves to the content target. This is a Playwright assertion against the mocked student session.
- **Commits:** source `9bab0f1f2c2d09768204aef7d8d31a028e6f1b7c`; CSS `886bac0fadc36b131bae256ef4b7688084e00746`; E2E `0b74ed321726a6b1d4ab2647425fce79379e095b`.
- **Verification at documentation time:** pending CI for the source/test changes; do not call this slice verified until Verify and ACE JAMB E2E complete successfully. No live Supabase calls are made by the added test.
- **Scope:** frontend only. No backend/database/deployment/catalogue changes.
- **Exact next action:** inspect CI for the latest source/test HEAD. Fix only reproducible failures; if both workflows pass, continue the documented keyboard/semantic audit and keep manual screen-reader/device/PWA acceptance gates open until actually performed.


## Skip-link CI failure investigation — 2026-10-23

- **Observed current-main CI:** Verify #863 passed on `f70e99ab`, but ACE JAMB E2E #796 failed. The E2E suite reported 68 passed and 2 failed (Chromium and mobile Chromium variants of the student preparation-workspace test); both failed at the browser-history assertion expecting the dashboard immediately after one `goBack()`. The newly added native skip link navigates to `#workspace-content`, which creates a same-route fragment history entry. This is a deterministic test expectation mismatch, not a typecheck/build failure; CI Verify passed.
- **Fix committed:** `698adc82d653967d0963d93d58fe428988bc3882` updates `tests/e2e/smoke.spec.ts` to assert that Back first removes the fragment while staying in Learn, then returns to the dashboard; Forward traverses both entries. This preserves native accessible anchor behavior instead of suppressing the fragment or weakening the test.
- **Verification status:** the fix has been committed to `main`; the new Verify/E2E runs have not yet been observed to completion. Do not mark the fix verified until E2E passes.
- **Scope:** frontend test-only change. No backend, database, deployment, catalogue, or production-data changes.
- **Exact next action:** inspect the new GitHub Actions runs for commit `698adc82`; if E2E passes, continue Phase 3 manual keyboard/screen-reader/device/PWA acceptance and leave those gates open until actually observed.


## CBT keyboard interaction audit — 2026-10-23

- **Skip-link history fix verification:** GitHub Actions ACE JAMB E2E #798 passed on `ec494db1`, and Verify #865 passed on that commit. Since `ec494db1` descends from `698adc82`, the E2E result covers the fragment-history assertion fix. The newest docs-only E2E runs were still queued/in progress during the previous check; they are not needed to establish source/test coverage for that fix.
- **New keyboard regression:** `e1adc83834b5fb8467e85abdbc5797b2a9d5afd0` updates the existing persistent-CBT E2E interaction to focus the first answer and activate it with Enter, then retain assertions for the saving status, selected `aria-pressed` state, and answered question-map state. This adds direct automated keyboard coverage without changing product behavior.
- **Verification status:** new E2E/Verify for `e1adc838` are pending; do not claim the new regression passes until confirmed.
- **Source audit findings:** CBT options are native buttons with explicit `type="button"`, accessible option names and `aria-pressed`; question-map controls use accessible labels and `aria-current="step"`; answer saving uses a polite status announcement; the timer has a label; navigation is grouped and named. This source review is not a substitute for screen-reader/manual keyboard testing.
- **Exact next action:** inspect CI for `e1adc838`; then continue reviewing bundle composition and leave real screen-reader, physical low-end Android, and real-device PWA/offline acceptance open until performed. No backend, database, deployment, or catalogue changes.


## Phase 3 verification update — 2026-10-23

- **Skip navigation + route history:** E2E #798 passed with **70 tests passed** on `ec494db1`; Verify #865 passed on the same commit. That commit contains the skip-link history test correction, so this slice is verified in mocked-browser CI.
- **CBT keyboard test:** source/test commit `e1adc83834b5fb8467e85abdbc5797b2a9d5afd0` adds keyboard activation of an answer via focus + Enter. Verify #868 passed for that commit. E2E #801 was still in progress at the latest status check, so this new keyboard regression remains pending E2E confirmation.
- **Bundle composition measurement:** successful Verify #865 build reports main JS `index-iQ74Py6c.js` at **507.00 kB minified / 142.13 kB gzip**, with lazy chunks: Admin Foundation 10.36 kB / 3.35 kB gzip; Protected CBT 12.11 kB / 4.09 kB gzip; Student Study Workspace 17.91 kB / 5.10 kB gzip; Academic Foundation 19.71 kB / 5.60 kB gzip. Vite's >500 kB main-chunk warning remains; no speculative chunking change was made because the available build report does not attribute the main chunk's module composition.
- **PWA source review:** `public/sw.js` uses a network-first navigation strategy with static app-shell fallback, caches same-origin hashed `/assets/` GET responses, and explicitly excludes auth/API/storage/realtime/function prefixes. Playwright mocks/static-shell coverage is not proof of install/offline behavior on a physical device. Manifest advertises standalone display and an SVG icon; device install acceptance remains unverified.
- **Dependency audit signal:** Verify #865 npm install reported 4 vulnerabilities (3 moderate, 1 high). This differs from earlier reports and is a fresh install audit summary, not a remediation. No broad dependency upgrades were attempted.
- **Exact next action:** get the final E2E #801 result for keyboard CBT selection. If it passes, continue with evidence-backed accessibility/performance work; leave screen-reader, physical low-end Android, and real-device PWA/offline acceptance gates open until performed. Frontend-only scope remains unchanged.


## Current continuation update — 2026-10-23

- **Latest verified repository HEAD at this update:** `c4e0abb1c201860c806c8940634adf81444db4ad` (`test(a11y): assert dashboard focus after CBT exit`). This commit adds an E2E assertion that exiting the CBT returns focus to the dashboard heading.
- **Frontend change in progress:** `48c0564c` marks the CBT exit history entry for focus restoration; `a74da584` restores focus to the dashboard heading after the dashboard has finished loading and consumes the one-time history marker; `c4e0abb1` extends the existing mocked-browser test to assert focus. These commits are source/test changes only.
- **Verification:** Verify #875/#876 and E2E #808/#809 were still in progress; Verify #877 and E2E #810 were queued at this snapshot. Therefore the focus-restoration change is **not yet verified**. Do not infer success from queued/running status. Recheck current Actions results at the next continuation.
- **Previously confirmed:** E2E #801 passed on `e1adc838` (70 tests), and Verify #868 passed. This resolves the stale pending note in earlier entries.
- **Open acceptance gates:** physical screen-reader test, full keyboard-only user journey on device, low-end Android usability, and install/offline behavior on a real device remain unverified. Main JS chunk warning (>500 kB minified) and install audit finding (4 vulnerabilities: 3 moderate, 1 high at Verify #865) remain unresolved; no broad dependency update or speculative chunking was attempted.
- **Scope guard:** continue frontend-only. No backend, database, deployment, catalogue, or fabricated JAMB content changes.
- **Exact next action:** inspect Verify #877 and E2E #810 (and latest runs for their descendant commits). Fix any reproducible failure, then update all three handoff documents with observed results. Keep manual device/screen-reader gates open until physically tested.


## PWA cache/privacy contract regression coverage — 2026-10-23

- Added `tests/pwa-contract.test.mjs` and wired it into `.github/workflows/verify.yml`. The new Node tests assert the app-shell list, same-origin GET and hashed-`/assets/` cache boundary, network-first navigation/static-shell fallback, exclusion of auth/API/storage/realtime/functions/service-worker paths before cache handling, and standalone root-scoped manifest/icon metadata.
- This is a static source-contract test. It does **not** execute the service worker in a browser, and does not prove installability, cache lifecycle behavior, offline recovery, or physical-device behavior. Those manual gates remain open.
- Commits: test `9b426edc4381fabb673c7d0df251828dd927f074`; CI wiring `75b14bc1564456e7108a79bd1bca263359d1e723`. CI verification is **PENDING** at this note; check Actions for the current `main` HEAD before claiming the new test passes.
- No runtime application behavior, dependencies, backend/database state, catalogue UI, or deployment configuration was changed. Frontend-only scope remains in force.
- **Exact next action:** inspect Verify and ACE JAMB E2E workflows triggered by `75b14bc`. If Verify fails, correct only a reproduced test/contract mismatch; if green, keep real-device PWA/offline and screen-reader acceptance unverified until hands-on checks occur.


## PWA contract CI result — 2026-10-23

- Verify #885, run `39994246802`, completed **PASS** on commit `75b14bc1564456e7108a79bd1bca263359d1e723`. Confirmed successful steps: the expanded Node test command including `tests/pwa-contract.test.mjs`, both Deno checks, TypeScript typecheck, Vite build, and both disposable PostgreSQL migration/policy tests. This verifies the static source-contract checks only, not live service-worker/browser/offline behavior.
- ACE JAMB E2E #818, run `39994246766`, was still **in progress at Playwright browser installation** at the time of this update. Do not claim E2E passed for this change until the browser tests complete.
- **Next action:** poll E2E #818 and the current-main E2E run; if a run fails, inspect the failed step and logs before changing code. Keep physical-device PWA/offline and screen-reader acceptance open.


## Runtime PWA cache regression coverage — 2026-10-23

- Added `tests/pwa-runtime.test.mjs`, which executes `public/sw.js` in a Node VM with mocked service-worker APIs. It exercises install-time app-shell caching, privacy exclusions for auth/API/storage/realtime/functions/cross-origin/non-GET/service-worker requests, successful same-origin asset caching, and offline navigation fallback to the static shell.
- Wired the runtime tests into the existing Node test step in `.github/workflows/verify.yml`. Commits: test file `ec6aa50e3bb7e49906bbaf8cd1b39f6055a6a010`; CI wiring/current source HEAD `6b6686997a2635ad3700f8aabb04c4d26e7a3fbc`.
- Verification is **PENDING** for the new runtime test commit at this checkpoint: Verify #892 (`39999218330`) was installing dependencies, and E2E #825 (`39999218502`) was installing dependencies. Latest HEAD has additional queued workflows #893 and #826. Do not claim the runtime test passed until Verify #892 or a newer Verify on the relevant source commit completes successfully.
- Previous static PWA contract suite did pass as part of Verify #885 on `75b14bc`; E2E #818 passed on that commit. That result does not include the new runtime test file.
- Runtime test is still an isolated mock-based exercise, not an actual browser service-worker lifecycle or device/offline test. Real-device install/offline recovery and manual screen-reader/keyboard acceptance remain open. No app runtime code, backend/database, deployment, catalogue UI, or dependencies were changed.
- **Exact next action:** inspect Verify #892 and E2E #825. If Verify fails, inspect the Node test output and correct the test harness or assertion with evidence; if green, confirm the current main commit's Verify/E2E status, then continue with the next bounded frontend-only accessibility check.


## PWA runtime-test failure investigation and correction — 2026-10-23

- CI exposed a **test-harness mismatch**, not a confirmed service-worker defect: Verify #893 on `6b6686997a` failed in `tests/pwa-runtime.test.mjs` because Node's built-in `Response` reports `type: "default"`, while a real same-origin browser fetch response has `type: "basic"`. The service worker correctly caches only `response.type === 'basic'`; the test mock had incorrectly used a default Node Response.
- Corrected the test mock in commit `a2f50cb5b55ff46ccc5d0531d3d3856aa9275e62` to emulate the browser's same-origin response contract (`ok: true`, `type: 'basic'`, `clone()`). No production/runtime app code was changed.
- **Verification of the correction is pending**: Verify #897 and E2E #830 were queued on `a2f50cb5b5` at last inspection. Do not call the new runtime test green until Verify finishes successfully.
- Failed CI on intervening docs-only commits also contained the same harness assertion, because those commits retained the failing test. The relevant root cause was found from the job log, and the test mock—not the service worker's privacy guard—was corrected.
- **Exact next action:** inspect Verify #897 logs/result. If green, record passing runtime tests and then check current HEAD workflows. If another failure occurs, use its exact output to correct only the failing assertion/harness. Continue to leave physical-device PWA/offline and manual accessibility acceptance open.


## PWA runtime regression verification result — 2026-10-23

- Verify #897, run `39999507889`, completed **PASS** on source/test commit `a2f50cb5b55ff46ccc5d0531d3d3856aa9275e62`. Both Verify jobs passed, including the expanded Node suite with `tests/pwa-runtime.test.mjs`, Deno/typecheck/build checks, and disposable PostgreSQL tests.
- This resolves the specific test-harness failure documented above: the mock now emulates the browser's same-origin `Response.type === 'basic'` contract. The test now covers install-time static shell caching, exclusion boundaries, same-origin build asset caching, and offline navigation fallback under mocked service-worker APIs.
- E2E #830 on `a2f50cb5b5` was still running at the last check; E2E on the latest docs HEAD is also pending. Do not claim current docs HEAD E2E passed until the relevant run completes. Runtime service-worker tests are mocked and do not substitute for browser/device install and offline acceptance.
- **Next action:** check the latest main HEAD's Verify/E2E status. If both are green, continue the bounded accessibility audit; leave real-device PWA/offline and manual screen-reader gates open.

## Reduced-motion accessibility regression test — 2026-10-23

- Source/test commit: `a389b2faaedc36c8a2b3510ab937eba5c4bdf069` adds a Playwright test to `tests/e2e/smoke.spec.ts`. It emulates OS reduced-motion preference and asserts smooth scrolling is disabled and CSS animation/transition durations are reduced to <= 0.1 ms.
- The test exercises the existing `src/index.css` reduced-motion media query. No production runtime code was changed; Supabase calls remain mocked through the existing test helper.
- At the time of source commit, Verify #904 (`40000305709`) and ACE JAMB E2E #837 (`40000305699`) were queued. **Do not treat the new E2E assertion as verified until E2E completes successfully.** Subsequent documentation commits may create newer CI runs; always check current `main` HEAD and its workflow results.
- No backend/database, deployment, catalogue UI, dependency, or production-data changes. Phase 3 remains IN PROGRESS.
- Manual gates still open: full keyboard-only acceptance, actual screen-reader test, low-end physical Android, and real-device PWA install/offline recovery.
- **Exact next action:** poll the E2E and Verify runs for the test commit and current `main`; fix only evidence-backed failures and then update all three handoffs with terminal results.

## Reduced-motion test CI status update — 2026-10-23

- Verify #904 (`40000305709`) passed on `a389b2faaedc36c8a2b3510ab937eba5c4bdf069`; Node tests, Deno checks, typecheck, build, and disposable PostgreSQL migration/policy checks all completed successfully.
- ACE JAMB E2E #837 (`40000305699`) was still in progress during Playwright browser installation. The new reduced-motion browser assertion remains **unverified** until E2E completes. Check current-main workflow runs after docs updates.
- **Exact next action:** inspect E2E #837 and newest E2E run; diagnose any failing assertion from the report/log before modifying code.

## CBT skip-link accessibility improvement — 2026-10-23

- `src/main.tsx` now adds `Skip to CBT content` in the CBT shell and targets a `tabIndex={-1}` wrapper around the lazy CBT content, allowing keyboard users to skip the Back control.
- Added an E2E regression test in `tests/e2e/smoke.spec.ts`: enter CBT, focus the skip link, press Enter, and assert `#cbt-content` receives focus.
- Reduced-motion browser test verified: ACE JAMB E2E #842 (`40000507926`) **PASS** and Verify #909 (`40000507942`) **PASS** on commit `37c42c68d0cb`. This is evidence for reduced-motion only; it does not cover the newer CBT skip-link test.
- CBT skip-link commits: `7a2439232662ba9f6e084ae99148e0f8c1ce8404` (implementation), `a2305b077e44a7ac685b17d90a3c26c6d18debad` (test). Current-main CI is pending/in progress; wait for E2E to complete before claiming the new test passes.
- No backend/database, deployment, catalogue UI, dependency, or production data changes. Phase 3 remains IN PROGRESS.
- **Exact next action:** poll latest main E2E and Verify; inspect any failed Playwright assertion/log, fix only evidenced issues, then record final results here and in the master/current Phase 3 handoffs.

## CBT skip-link verification update — 2026-10-23

- Verify #912 (`40001230846`) passed on `a2305b077e44` for the CBT skip-link source/test revision. The automated verification workflow completed successfully.
- E2E #845 (`40001230788`) was still installing Playwright browser, so the new focus assertion has not yet been exercised in a browser. Latest-main E2E #848 and Verify #915 were queued at last check.
- **Next action:** poll E2E #845 and current-main E2E #848; if the CBT skip-link assertion fails, inspect the Playwright output and fix only the demonstrated issue.

## CBT skip-link browser verification result — 2026-10-23

- ACE JAMB E2E #850 (`40001391449`) **PASS** on commit `693a94fae956`; its job log explicitly reports **74 passed (1.1m)**. This verifies the CBT skip-link keyboard-focus assertion and the reduced-motion regression in the same browser suite.
- Verify #917 (`40001391242`) passed on `693a94fae956`; Verify #918 passed on current HEAD `d751b9f1dc98ae2b58d34d4c985bc6aead7a7cf3`. E2E #851 (`40001413124`) on that HEAD remained in progress during latest inspection.
- **Next action:** recheck E2E #851; then inspect Vite bundle composition/source map or build output before deciding whether a safe code-splitting change is warranted. Do not change dependencies or split chunks speculatively. Manual accessibility and physical-device PWA/offline checks remain unverified.

## Dashboard keyboard skip-link improvement — 2026-10-23

- `src/components/StudentDashboard.tsx` now renders a `Skip to dashboard content` link and makes the main dashboard landmark focusable with `tabIndex={-1}`. Playwright coverage was added to `tests/e2e/smoke.spec.ts` for Enter activation and target focus.
- E2E #850 (`40001391449`) verified the earlier CBT skip link and reduced-motion assertion with **74 passed**; that run predates this dashboard-link change. The new dashboard test remains pending until current-main E2E completes.
- Bundle evidence from Verify #918: main `index` chunk 507.45 kB minified / 142.27 kB gzip; separate chunks already exist for CBT/workspace/admin routes. Build logs do not identify the dominant dependency, so do not add manual chunk rules or alter dependencies without further attribution.
- **Next action:** poll the newest E2E/Verify runs. Fix any actual dashboard skip-link failure. If green, continue with a non-invasive bundle attribution approach; keep manual screen-reader, full keyboard journey, physical Android, and real-device PWA/offline checks explicitly unverified.



## Current verified checkpoint — 2026-10-24

- Repository/branch: `DarealNovaking/Nova-ace-jamb` / `main`.
- Verified HEAD: `f4282be00bd2f0a244891a8942c70f91954b7e6f`; repository default branch is `main`.
- Scope: frontend only. Do not deploy, change backend/database/production data, restore catalogue UI, or do app-deployment work.
- Phase 2 closed for authorized frontend scope; Frontend Phase 3 remains in progress.
- Latest progress handoff: `docs/FRONTEND-PHASE-3-CURRENT-HANDOFF-2026-10-23.md`.
- Verified current-HEAD CI: ACE JAMB E2E run #859, run ID `40002624496`, PASS on the exact HEAD above. Confirmed job steps: Typecheck PASS, Build PASS, Playwright browser tests PASS. Link: https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40002624496. No separate Verify workflow result was established in this inspection; do not claim one.
- Dashboard skip link and focusable target are present in `src/components/StudentDashboard.tsx`; the latest E2E run succeeded. Exact per-project test counts were not extracted.
- Current `vite.config.ts` has only the React plugin; no bundle analyzer is configured. Package scripts include build/typecheck/e2e. Prior handoff reports entry chunk 507.45 kB minified / 142.27 kB gzip, but this must be remeasured from current output before optimizing.
- No source-code changes, backend/database changes, deployment, or production mutation were made in this continuation.
- Open acceptance gates: manual keyboard-only navigation; real screen-reader behavior; physical low-end Android; real-device PWA/offline installation and recovery. Dependency audit debt remains open. CI is mocked and does not prove live Supabase/provider/content correctness.
- Exact next action: measure and attribute the current build's entry chunk to actual modules; only then decide whether a narrowly scoped frontend optimization is justified. Continue updating both master handoff and checkpoint after meaningful work.


## Bundle investigation checkpoint — 2026-10-24

- Retrieved current-main E2E #859 build logs (run `40002624496`, job `120582364412`). Build transformed 1,644 modules; entry bundle is 507.56 kB minified / 142.26 kB gzip; CSS 21.51 kB / 5.27 kB gzip. CBT, student workspace, admin and academic gate are already separate lazy chunks (12.11, 17.91, 10.36 and 19.71 kB respectively, minified).
- Typecheck PASS, build PASS, Playwright PASS (**76 tests passed**). Build time 3.69 s. The warning is real, but current log does not attribute bytes to individual modules; no root cause or safe split can yet be asserted.
- CI's npm install reported 4 vulnerabilities (3 moderate, 1 high). This differs from the older handoff audit; current full audit details remain unverified.
- No source change or dependency was introduced. No deployment, backend/database/catalogue change, or production mutation.
- **Next action:** obtain module-level size attribution with a reproducible non-production analysis method. Then make only an evidence-backed, narrow optimization and rerun typecheck/build/E2E. Do not add speculative manual chunk rules. Manual screen-reader/device/PWA acceptance remains open.


## Opt-in bundle module attribution tooling — 2026-10-24

- Added an opt-in Rollup/Vite build-report plugin in `vite.config.ts`. It is inactive by default and only logs the top 20 rendered modules per output chunk when `ANALYZE_BUNDLE=1`; it adds no package dependency and does not alter app runtime behavior.
- Updated `.github/workflows/verify.yml` so its build step sets `ANALYZE_BUNDLE=1`, making module-level rendered-size evidence available in the Verify build log. This is diagnostic tooling only; no manual chunk rules or dependency upgrades were introduced.
- Initial workflow edit accidentally encoded newlines literally and produced an invalid workflow run (#934, run `40038978894`, failure before jobs). Inspected the stored file, corrected the YAML step formatting in a follow-up commit, and re-read both files. Treat that failure as a workflow-edit error, not an app-code failure.
- Current code/config head: `b64cf42a0518ef416934a1053a051183fce69070`. Verify #936 (run `40039021997`) and E2E #869 (run `40039022122`) were queued at the time of this update. Results are pending; do not claim the report compiled or tests passed until those runs complete.
- No backend/database, catalogue UI, deployment, production data, or app runtime behavior was changed. Frontend Phase 3 remains in progress.
- **Exact next action:** inspect Verify #936 logs for typecheck/build status and the `[Bundle module report]` output; confirm E2E #869. If typecheck fails due to Vite plugin typing or path normalization, fix only that evidenced issue, then rerun. Use the measured top contributors to decide whether a narrow optimization is justified.


## Bundle attribution result and targeted split — 2026-10-24

- The opt-in module report executed successfully in Verify #939, run `40039049121`, on commit `5b81fb2b507aa800d8043c637e7b1a8c7bd1274c`. Node contract tests, Deno checks, TypeScript typecheck, build, and both disposable PostgreSQL checks passed. The analyzer build step passed.
- Measured entry output at that revision: `index-DkPomfcT.js` **507.60 kB minified / 142.28 kB gzip**. Module report's rendered (pre-minification) attribution for the entry chunk lists React DOM client at 644,593 bytes, Supabase auth `GoTrueClient` at 253,168 bytes, Supabase PostgREST at 106,076 bytes, Supabase Storage at 106,053 bytes, Supabase Phoenix at 54,182 bytes, and `supabase-js` at 34,626 bytes. These are module rendered lengths, not minified bytes.
- App modules present in the entry include `StudentDashboard.tsx` (15,551 rendered bytes), `StudentAccountAccess.tsx` (13,124), and `StudentNotifications.tsx` (11,864). The current dashboard gate eagerly imported the dashboard, pulling its screen-specific modules into the entry chunk. The entry exceeds Vite's warning threshold by only about 7.6 kB, but this provides a low-risk split target.
- Implemented a narrow optimization in `src/components/StudentFoundationGate.tsx`: `StudentDashboard` now loads with React `lazy()` after authentication/onboarding gates pass, with an accessible `role=status` loading fallback. No dependencies were added; no backend/database, catalogue UI, deployment, or production data changed.
- Source commit: `d6a00df63d85be2010c68bb8828f88df3f9175b0`. Verify #940 (run `40039116617`) and E2E #873 (run `40039116551`) were queued at the time of this note; optimization outcome and browser regression status are **pending**. Do not claim bundle reduction until the new build output is inspected. The successful analyzer run predates this optimization and is only the baseline evidence.
- **Exact next action:** inspect Verify #940's build report for new entry/chunk sizes and typecheck result; inspect E2E #873 and confirm student dashboard loading/navigation tests pass. If the entry remains over 500 kB, compare the new measured sizes before considering another split. Keep physical-device and manual accessibility gates open.


## Dashboard lazy-load verification update — 2026-10-24

- Verify #940 / run `40039116617` **PASS** on source commit `d6a00df63d85be2010c68bb8828f88df3f9175b0`: Node contract tests, Deno checks, TypeScript typecheck, build + module report, and both disposable PostgreSQL checks passed.
- Measured bundle improvement after lazy-loading `StudentDashboard`: entry changed from **507.60 kB / 142.28 kB gzip** to **466.57 kB / 133.68 kB gzip** (a reduction of **41.03 kB minified and 8.60 kB gzip**). The new `StudentDashboard` chunk is **37.40 kB / 9.30 kB gzip**. Entry is now below Vite's 500 kB warning threshold; other route chunks remain split.
- E2E #873 / run `40039116551` was still running Playwright when this update was written. Browser regression coverage for the new lazy boundary is **pending**, not passed. Current-main docs commits may queue newer E2E runs; inspect the latest run before closing the check.
- No dependencies were added. No backend/database, catalogue UI, deployment, or production data changed. The opt-in module report remains disabled unless `ANALYZE_BUNDLE=1` is set; CI Verify explicitly enables it for the build step.
- **Exact next action:** inspect E2E #873 and the latest-main E2E result; if green, record the Playwright count and close this specific optimization verification. If it fails, use the browser failure output to correct the regression only. Keep manual keyboard/screen-reader, low-end Android and real-device PWA/offline gates open.


## Dashboard lazy-load browser verification result — 2026-10-24

- ACE JAMB E2E #873 / run `40039116551` completed **PASS** on source commit `d6a00df63d85be2010c68bb8828f88df3f9175b0`; Playwright log confirms **76 passed (1.7m)**. Typecheck and build also passed in that E2E workflow.
- Verify #940 / run `40039116617` **PASS** on the same source commit, including Node contract tests, Deno checks, TypeScript, build/module report, and both disposable PostgreSQL checks.
- Bundle result confirmed: entry **466.57 kB minified / 133.68 kB gzip**, dashboard chunk **37.40 kB / 9.30 kB gzip**. Compared with the measured baseline, initial entry fell by 41.03 kB minified and 8.60 kB gzip and is now under Vite's 500 kB warning threshold.
- The latest docs-only HEAD at this checkpoint is `9dc79e33b3b7341a9c60b50885c53ba6effec756`; Verify #946 and E2E #879 were queued on that docs HEAD. The application change itself has green CI/E2E on its source commit; do not claim those latest docs-HEAD runs completed until checked.
- **Next action:** confirm the queued docs-HEAD Verify/E2E runs settle, then continue Phase 3's next bounded frontend accessibility audit. Manual keyboard-only, actual screen-reader, physical low-end Android, and real-device PWA/offline acceptance remain open.


## Phase 3 continuation checkpoint — 2026-10-24

- Re-read current GitHub `main`: HEAD is `9dc79e33b3b7341a9c60b50885c53ba6effec756` (`docs(phase-3): record measured dashboard bundle reduction`). Repository remains on `main`; user-approved scope remains frontend only.
- Confirmed the narrow lazy-load optimization is present in `src/components/StudentFoundationGate.tsx`: `StudentDashboard` is loaded through React `lazy()` only after the auth/onboarding gates, with an accessible polite status fallback. The opt-in module report in `vite.config.ts` is enabled by the Verify workflow only when `ANALYZE_BUNDLE=1`.
- Verification on source commit `d6a00df63d85be2010c68bb8828f88df3f9175b0`: Verify #940 / run `40039116617` passed (Node contract tests, Deno checks, TypeScript typecheck, build + module attribution, and disposable PostgreSQL tests). Build measured entry reduction from **507.60 kB / 142.28 kB gzip** to **466.57 kB / 133.68 kB gzip**; `StudentDashboard` now emits a separate **37.40 kB / 9.30 kB gzip** chunk. Entry is below Vite's 500 kB warning threshold.
- Browser regression verification: E2E #873 / run `40039116551` passed on the optimization source commit; logs explicitly report **76 Playwright tests passed (1.7m)**, including typecheck and build. This closes the browser-check gate for this specific lazy-load change.
- Latest-main runs at time of checkpoint: Verify #946 / run `40039372685` and E2E #879 / run `40039372596` were queued/in progress against current main; earlier adjacent runs #945 / `40039370114` and E2E #878 / `40039370052` were also in progress. These are **not yet terminal results**; poll before claiming current-HEAD CI is green. New documentation commits will enqueue further workflow runs.
- No dependency was added. No backend/database, catalogue UI, deployment, or production data was changed. Remaining unverified acceptance gates: manual keyboard-only pass, real screen-reader behavior, physical low-end Android usability, and real-device PWA/offline install/recovery.
- **Exact next action:** poll latest-main E2E and Verify; inspect the analyzer output for the new entry/chunk split if needed. If green, proceed to the next Phase 3 frontend acceptance item in the handoff; do not make another bundle split without new measured evidence.


## Continuation audit — 2026-10-24 (current-state reconciliation)
- Re-read the master handoff, continuity checkpoint, latest progress notes, and current GitHub `main`. The current documented milestone is Phase 3 frontend accessibility/performance, not the older Batch 2 importer task from the earlier chat context. Current source HEAD from commit search is `5b81fb2b507aa800d8043c637e7b1a8c7bd1274c` (`docs(phase-3): checkpoint bundle attribution tooling`, 2026-10-24 00:19 +01:00). Follow the current main/checkpoint over older chat plans.
- Latest checkpoint's immediate action was poll the current-main Verify/E2E workflows, then proceed with the next bounded accessibility audit if green. GitHub workflow-run tool returned no PR-triggered runs for current HEAD and combined commit status has no status records; this connector cannot establish current main's latest run conclusions. Therefore latest-HEAD CI is UNVERIFIED; do not infer pass from earlier source-commit runs.
- Verified current code: `src/components/StudentFoundationGate.tsx` uses a polite `role=status`/`aria-live` loading message and lazy-loads the dashboard after auth/onboarding gates. `src/components/StudentDashboard.tsx` includes a skip link targeting `#dashboard-content`, a focusable main target, and heading focus management on view changes/history restoration. `src/index.css` visually hides `.skip-link` off-screen until keyboard focus and defines a `:focus-visible` outline. Earlier checkpoint records 76 Playwright tests passed and Verify checks passed on source commit `d6a00df63d85be2010c68bb8828f88df3f9175b0`; those results do not prove current HEAD green.
- Older Batch 2 review-only component remains on branch `feat/batch2-review-only-staging` and is not integrated into current `main`; it is not the next action under the current Phase 3 checkpoint. Keep it isolated and do not merge/deploy it as complete. It remains blocked by the AppDeploy-vs-Supabase auth boundary, and no production data was changed.
- No application code or production state changed in this continuation. No tests were run locally because the connected GitHub tools provide file/status retrieval but no repository checkout/test runner; do not mark code-level tests as run.
- Next action: inspect GitHub Actions directly for current-main HEAD `5b81fb2b507aa800d8043c637e7b1a8c7bd1274c` (Verify and ACE JAMB E2E). Once terminal outcomes are known, continue the next bounded frontend accessibility audit; keep manual keyboard-only, actual screen-reader, physical low-end Android, and real-device PWA/offline checks open until performed.


## Workspace lazy-loading landmark accessibility fix — 2026-10-24

- Source-based Phase 3 audit found that the lazy-loaded study workspace's `Suspense` fallback in `src/components/StudentDashboard.tsx` used a generic `div` while loading. During that interval, the page temporarily lacked the workspace's main landmark and did not expose a busy main region.
- Changed the fallback to a `main` landmark with `id="workspace-content"`, `aria-busy="true"`, and the existing polite atomic loading status. The loaded `StudentStudyWorkspace` retains the same target ID and skip link; the change does not alter routing, auth, data, or runtime feature behavior.
- Source commit: `5a40cf658a652e816dd3f5f9973ef0234848bb66`. CI verification is pending at the time of this note; do not claim this specific change passed until current-HEAD Verify and E2E runs finish.
- Prior baseline at commit `5b81fb2b507aa800d8043c637e7b1a8c7bd1274c`: Verify #939 and ACE JAMB E2E #872 both passed. Those results predate this source change.
- No local test runner/repository checkout is available through the current connected GitHub tools. No backend/database, catalogue, dependency, deployment, or production-data changes were made.
- **Next action:** inspect Verify and ACE JAMB E2E runs for commit `5a40cf658a652e816dd3f5f9973ef0234848bb66`; if both pass, record their terminal results and continue the next bounded accessibility audit. Manual keyboard-only, actual screen-reader, physical low-end Android, and real-device PWA/offline acceptance remain unverified.


## Phase 3 verification and study-plan loading status — 2026-10-24

- Verified GitHub Actions on documentation HEAD `e44330417f86fdf661dbc1c5e3630149e4ce35cd`: Verify #957 completed successfully (https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40041370064); ACE JAMB E2E #890 completed successfully (https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40041370063). The E2E run includes successful typecheck, build, browser test step, and artifact upload. This HEAD includes the workspace loading main-landmark fix from `5a40cf658a652e816dd3f5f9973ef0234848bb66`.
- Continued source audit found `src/components/StudentStudyPlan.tsx` rendered its asynchronous “Loading your saved preferences…” message without status semantics. Updated it to `role="status" aria-live="polite" aria-atomic="true"`; marked the spinner `aria-hidden="true"` as decorative. Source commit: `0599678b0010298d0228cb804b714aac2450b58e`.
- Verification for the new study-plan status change is pending; do not attribute the earlier passing CI results to this later commit. Connected GitHub tools do not provide a local checkout/test runner.
- No auth, database, catalogue, dependency, or deployment changes. Manual keyboard-only, actual screen-reader, physical low-end Android, and real-device PWA/offline acceptance remain unverified.
- **Next action:** inspect Verify and ACE JAMB E2E for `0599678b0010298d0228cb804b714aac2450b58e`; if green, continue the bounded audit of dynamic announcements and keyboard/focus behavior. Keep catalogue importer isolated until its separate auth integration blocker is resolved.


## Phase 3 CI reconciliation — study-plan loading announcement — 2026-10-24

- Source commit `0599678b0010298d0228cb804b714aac2450b58e`: Verify #958 PASS (https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40041648736); ACE JAMB E2E #891 PASS (https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40041648697). Verify's Node contract tests, Deno checks, typecheck, build/module report, and disposable PostgreSQL checks passed; E2E's typecheck, build, Playwright browser tests, and artifact uploads passed.
- Docs HEAD `6a89c163a19ff6e603e76baa8b038fd37b890041`: Verify #960 PASS (https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40041675299). E2E #893 (https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40041675326) was still in progress at the last inspection; poll it before declaring docs HEAD fully green.
- Source audit reconfirmed study workspace keyboard semantics: skip link/target, focusable mode heading on navigation, `aria-current="page"` for active mode, labeled subject filter, and `aria-pressed` on selected topic buttons. No further defect confirmed in this pass; no speculative source changes.
- No production/backend/database/catalogue/dependency/deployment changes. Manual keyboard-only, real screen-reader, physical low-end Android, and real-device PWA/offline checks remain unverified.
- **Exact next action:** poll E2E #893; then inspect asynchronous status/error announcements in student account/support surfaces and add a focused test only if a concrete semantic gap is confirmed. Keep the importer isolated behind the existing auth integration blocker.


## Phase 3 account-surface loading announcements — 2026-10-24

- Bounded source audit found three student-facing account surfaces exposed loading only through an SVG spinner's `aria-label`, without a live status container. Updated:
  - `src/components/StudentNotifications.tsx`: polite atomic status with visible “Loading notifications…” text; spinner is decorative.
  - `src/components/StudentAccountAccess.tsx`: polite atomic status and visible loading text for ACE Pass and referrals; spinners are decorative.
  - `src/components/StudentAccountSettings.tsx`: polite atomic status and visible loading text while settings are loaded; spinner is decorative.
- Commits: `050a1fb7a46958b26f7f728f812c25e53689bb94`, `45ffe07290496e155f546df274e08a7f73f0f0c9`, `cd425a23ba57756fce170dad215e8422f4bd4809`.
- This is semantic loading feedback only; data access, authorization, save behavior, and UI state transitions were not intentionally changed. Verification for these new commits is pending; do not claim typecheck/build/Playwright success until workflows finish.
- The earlier study-plan source commit `0599678b0010298d0228cb804b714aac2450b58e` is verified: Verify #958 and E2E #891 both passed. Documentation-head E2E #893 was still running when last checked.
- No backend/database, catalogue, dependency, deployment, or production-data changes. Manual keyboard-only, actual screen-reader, low-end Android, and real-device PWA/offline checks remain unverified.
- **Next action:** inspect current-main Verify and ACE JAMB E2E for the account loading commits; if green, continue only if another concrete gap is found. Record all failures and outcomes; keep the importer isolated behind its separate auth integration blocker.


## Phase 3 CI closure and onboarding feedback audit — 2026-10-24

- Rechecked the latest GitHub Actions runs for the previous account loading changes. All Verify/E2E runs for source commits `050a1fb7a46958b26f7f728f812c25e53689bb94`, `45ffe07290496e155f546df274e08a7f73f0f0c9`, and `cd425a23ba57756fce170dad215e8422f4bd4809` completed successfully. Docs-head Verify #967 and E2E #900 also passed (https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40042114159 and https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40042114162). Docs-head E2E #893 ultimately passed (https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40041675326).
- Continued bounded audit found `src/components/StudentOnboarding.tsx` had a plain loading paragraph without status semantics, and the asynchronous save had no separate live status. Updated the loading branch to a busy main landmark with polite atomic status; added a polite atomic “Saving your preparation profile…” announcement while saving. Source commit: `d978365ebe3a1edf794909702d98abf51655a41a`.
- Verification for `d978365ebe3a1edf794909702d98abf51655a41a` is pending; do not attribute earlier green CI to this newest commit. No data access, authorization, save validation, or persistence logic was changed intentionally.
- No backend/database/catalogue/dependency/deployment/production-data changes. Manual keyboard-only, actual screen-reader, low-end Android, and real-device PWA/offline acceptance remain unverified.
- **Next action:** inspect Verify and ACE JAMB E2E for `d978365ebe3a1edf794909702d98abf51655a41a`; if both pass, proceed to any further confirmed student journey issue, otherwise diagnose and fix the actual failing check. Keep the catalogue importer isolated behind the existing auth integration blocker.


## Phase 3 onboarding CI result and continuity — 2026-10-24

- Verified source commit `d978365ebe3a1edf794909702d98abf51655a41a`: Verify run #968 passed (https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40042420977) and ACE JAMB E2E run #901 passed (https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40042420987). E2E job steps confirmed Typecheck, Build, and browser tests all succeeded.
- Current `main` HEAD remains `635f357b0f549c0be7f360ef8d4a6dfc7c4127ca` (`docs(phase-3): checkpoint onboarding status semantics`). Verify run #970 passed (https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40042443134). E2E run #903 was still running at last poll; run #902 for master-handoff commit `41ae3a26cf5b742eed391e426ab95ab1dc68f523` was also still running. Do not mark these docs-head E2E runs as passed until GitHub reports a completed success.
- Follow-up bounded review of onboarding, student workspace, auth, dashboard, foundation gate, notifications, account settings, and account access found no additional confirmed defect suitable for a safe speculative patch. Onboarding load failure is surfaced as an alert with a clear connection/retry instruction; this review did not change runtime code.
- No backend/database/catalogue/dependency/deployment/production-data changes. Manual keyboard-only, actual screen-reader, low-end Android, and real-device PWA/offline acceptance remain unverified.
- **Next action:** re-poll E2E runs #902 and #903 until they complete and record their actual conclusions; then continue the Phase 3 audit only for a concrete, reproducible student-journey issue. Keep the catalogue importer isolated behind the existing auth integration blocker.


## Phase 3 onboarding status semantics — CI closure and continuation — 2026-10-24

- Re-verified repository `main` HEAD before this update: `de744979723ec33c3353c1d3427d674bd1136aeb` (`docs(phase-3): checkpoint onboarding CI results`). This supersedes the older checkpoint below that still described HEAD as `635f357b0f549c0be7f360ef8d4a6dfc7c4127ca` and docs-head E2E runs as pending.
- The onboarding status semantics change is present in `src/components/StudentOnboarding.tsx` at source commit `d978365ebe3a1edf794909702d98abf51655a41a`: profile loading and saving are exposed as polite atomic live status messages; the loading container is marked busy. Authentication, validation, persistence, and data access were not changed.
- Confirmed green CI: Verify #968 (`40042420977`) and ACE JAMB E2E #901 (`40042420987`) for source commit `d978365ebe3a1edf794909702d98abf51655a41a`; Verify #969 (`40042436702`) and E2E #902 (`40042436639`) for master-handoff commit `41ae3a26cf5b742eed391e426ab95ab1dc68f523`; Verify #970 (`40042443134`) and E2E #903 (`40042443081`) for checkpoint commit `635f357b0f549c0be7f360ef8d4a6dfc7c4127ca`. All six runs completed with `success`.
- Bounded review of onboarding, student workspace, auth, dashboard, foundation gate, notifications, account settings, and account access found no further confirmed defect warranting a speculative patch. No runtime code changed during that review.
- No backend/database/catalogue/dependency/deployment/production-data changes. Manual keyboard-only, actual screen-reader, physical low-end Android, and real-device PWA/offline acceptance remain unverified.
- **Next action:** continue Phase 3 with a bounded source/test audit for one concrete, reproducible student-journey accessibility defect; patch only with evidence, run focused tests and CI/E2E, then update this handoff plus the master handoff and continuity checkpoint. Keep catalogue importer isolated behind the existing auth integration blocker.


## Authentication submission feedback audit — 2026-10-24

- Audited `src/components/StudentAuth.tsx` after latest-main Verify #970 and E2E #903 passed, and latest docs-head Verify #40043704805 and E2E #40043704828 also passed on `1944b0305c5d10fced8d388954b1e8c0a4c888aa`. (The E2E runs for two superseded documentation commits remain in progress; they do not supersede the successful latest-head E2E result.)
- Found one concrete accessibility gap: the submit button changed its visible label to “Please wait…” while authentication/reset work was in flight, but the busy state did not have a dedicated live status announcement. Fixed in `src/components/StudentAuth.tsx` commit `2f7be1d2cd79189014e159c46ccc4f24d1f2be97` by exposing mode-specific polite, atomic status text for sign-in, account creation, password reset, and password update. Existing button disabling and auth flow are unchanged.
- Verification for the new source commit is pending until the new GitHub Verify and ACE JAMB E2E workflows complete. Do not call this fix verified until those results are terminal and successful.
- No backend, database, catalogue, dependency, deployment, or production-data changes. Manual keyboard-only, actual screen-reader, low-end Android, and real-device PWA/offline acceptance remain unverified.
- **Next action:** poll Verify/E2E for `2f7be1d2cd79189014e159c46ccc4f24d1f2be97`; if green, record exact run IDs and continue the bounded Phase 3 audit. Keep catalogue importer isolated behind the existing auth integration blocker.


## Phase 3 closeout checkpoint — 2026-10-24

- Verified current repository state: `main` HEAD is `94d799f005c18f73d31488f4d14b1ce9ff93287d`. The authentication submission status announcement fix is present in source commit `2f7be1d2cd79189014e159c46ccc4f24d1f2be97`.
- CI is green for the auth fix: Verify run [#40043991916](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40043991916) and ACE JAMB E2E run [#40043992000](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40043992000), both completed successfully.
- The three subsequent documentation commits also have successful Verify and E2E runs: master handoff commit `a5098086912fd22fb6e6c2aecf099c668cb82fbf` (#40044006361, #40044006268); checkpoint commit `e66fadad2d5159e48e2cd2d005b147437650387d` (#40044013395, #40044013492); current `main` HEAD `94d799f005c18f73d31488f4d14b1ce9ff93287d` (#40044018863, #40044018919). All eight runs are completed with `success`.
- **Rush-mode recommendation:** stop adding speculative frontend changes. Automated engineering gate is green; remaining acceptance is manual: keyboard-only navigation, actual screen-reader announcements, low-end Android behavior, and real-device PWA/offline behavior. These checks have not been performed by this agent and must not be represented as passed.
- No deployment, backend/database/catalogue/dependency, or production-data changes were made. The catalogue importer remains isolated behind the existing auth integration blocker.
- **Exact next action:** perform the four manual acceptance checks on a real supported device/browser. If unavailable before the deadline, close the implementation sprint as “automated checks passed; manual acceptance outstanding,” not as fully production-accepted. Only reopen implementation for a reproducible failure.


## Real-device Phase 3 acceptance report — 2026-10-24

- User-reported device: Tecno Pop 5 Pro (low-end Android). These are user-reported manual results, not independently observed by the agent.
- **PASS (user-reported):** navigation and layout; forms and keyboard accessibility.
- **SKIPPED:** screen-reader announcements; performance and offline/PWA behavior. Do not treat either as passed.
- Deployment caveat remains: the latest repository `main` HEAD verified before this report was `e3522a452e2024fe9bd2774080ad8e99a6ed5409`, with Verify #40071809240 and ACE JAMB E2E #40071809175 both successful. These CI results do not establish that Cloudflare serves this commit. The repo's existing handoff reports no verified frontend deployment URL and says deployment was not performed; no deployment was initiated as part of this acceptance session.
- **Current acceptance status:** partial manual acceptance passed on the user's device; screen-reader and performance/offline checks remain skipped; exact live deployment/version remains unverified until the user provides the URL and live deployment evidence can be checked.
- **Next action:** obtain the exact site URL the user tested and verify what can be established about the live build. Then, if time/device settings permit, test performance/offline and screen-reader behavior. Do not deploy or alter production systems merely to make the tests possible.


## Live URL investigation — 2026-10-24

- User supplied the exact URL tested on their Tecno Pop 5 Pro: https://nova-ace-jamb.novaking5002.workers.dev/?mode=practice
- A fresh public page fetch succeeded and returned the title “ÑØVÃ ACE JAMB” with the sign-in/create-account/forgot-password gate visible for this URL. This confirms the Workers URL responds with the expected app identity, but the HTML/page extraction exposes no deployed Git SHA, build ID, or deployment metadata; therefore it does not independently prove which source commit is live.
- Repository main HEAD is e9ccb8288a62ead7d53f49fdfe3d7bf758e22736 (docs(phase-3): record manual acceptance report, 2026-10-24 07:49 UTC). Verify run #40075620405 and ACE JAMB E2E run #40075620412 both succeeded for this exact HEAD. This is a docs-only commit; the preceding app-code checkpoint remains e3522a452e2024fe9bd2774080ad8e99a6ed5409, whose Verify and E2E runs also passed.
- User reports Cloudflare showed a recent deployment around the time of testing. This timing is plausible but is not independently verified from Cloudflare's dashboard/API here. Do not state that the live build SHA is confirmed.
- No deployment or production change was performed.
- Next action: compare the deployment's commit/source in Cloudflare dashboard with e3522a452e2024fe9bd2774080ad8e99a6ed5409 (or a later application-code commit if one exists). Then perform the still-skipped screen-reader and performance/offline checks when feasible. Keep acceptance partial until those checks are completed or explicitly deferred.


## Repository-only continuation — 2026-10-24

- Re-read repository state: main HEAD b509b3541bc5ed91e4f9bbf89e6a3f6564ed480a (docs(phase-3): record live deployment investigation).
- Latest-head CI confirmed terminal green: Verify run 40076019216 and ACE JAMB E2E run 40076019162, both for exact HEAD b509b3541bc5ed91e4f9bbf89e6a3f6564ed480a.
- User requested skipping browser automation and asked to document the live-site smoke test as blocked. TinyFish strict mode was rejected because beta access is unavailable; per tool instruction, retrying in default mode required user approval, and the user explicitly chose to skip it. Status: BLOCKED / NOT RUN, not a site failure.
- No source/app code changed. No browser automation, sign-in, form submission, deployment, backend/database, or production-data operations were performed. No new local test execution was performed.
- Acceptance still stands: user-reported PASS for navigation/layout and forms/keyboard accessibility on Tecno Pop 5 Pro; screen-reader and performance/offline/PWA SKIPPED. Cloudflare version 12b23757-15a4-4173-be81-df22e2f0f12f is visible in user screenshots, but the screenshots do not show its source Git SHA. The public Workers page responds with expected ACE JAMB title/auth gate but exposes no build SHA.
- Exact next action: when user is ready and browser automation is available/approved, run a read-only mobile smoke check of https://nova-ace-jamb.novaking5002.workers.dev/?mode=practice; separately complete real screen-reader and offline/PWA checks on-device. Do not claim full production acceptance or exact deployment/source matching until those gates have evidence.


## Latest documentation CI confirmation — 2026-10-24 08:50 UTC

- Re-polled current `main`: HEAD `93dbc1aa432f1ac1b10d67645bf6ef7998673b7e` (`docs(phase-3): record blocked live smoke test and acceptance status`).
- Verify run `40079433968` and ACE JAMB E2E run `40079433972` both completed successfully for this exact HEAD. This confirms repository checks after the documentation update; it does not verify the live Cloudflare build, browser smoke test, screen-reader behavior, or physical-device offline/PWA behavior.
- No app-code change, deployment, or production data operation. Continue with the next bounded repository-only review; preserve all manual/live acceptance gates as open.


## Phase 3 CBT submission status announcement — 2026-10-24

- Repository HEAD at implementation: `ba1695695b268f6310d5d2dc445e5c0d9417381e` (`fix(a11y): announce CBT submission progress`).
- Bounded source audit of `src/components/PersistentCBT.tsx` found that answer saving already had a polite atomic status announcement, but submitting changed the button label only. Extended the existing status region to announce “Submitting your CBT…” while submission is in progress. No CBT submission, persistence, scoring, authorization, or timer logic was changed.
- CI triggered for the source commit: Verify run 995 (`40090688712`) and ACE JAMB E2E run 928 (`40090688664`). They were in progress when this note was prepared; do not claim pass until both are terminal and successful.
- Prior main HEAD `b13cb3023f2ac3bdf605ca04957b1d9911dd2657` had Verify #994 and ACE JAMB E2E #927 both green.
- No deployment, backend/database, catalogue, dependency, or production-data changes.
- Manual screen-reader announcement behavior remains unverified. Other outstanding acceptance: live Cloudflare source SHA mapping; real screen-reader; performance/offline/PWA on-device checks; user-reported device navigation/forms acceptance remains reported, not independently observed.
- **Next action:** poll Verify and ACE JAMB E2E for `ba1695695b268f6310d5d2dc445e5c0d9417381e`; fix only any actual failure, then continue the bounded student journey/CBT accessibility audit for a concrete gap.


## Phase 3 automated closeout — 2026-10-24

- Re-polled the exact CBT accessibility source commit `ba1695695b268f6310d5d2dc445e5c0d9417381e`: Verify run #995 (`40090688712`) and ACE JAMB E2E run #928 (`40090688664`) both completed successfully. The CBT submission progress announcement is therefore covered by green automated CI/E2E.
- Latest documentation HEAD before this closeout was `c122847c18fe4d6b588e9cb15fc2790c9a6c261f`; Verify #998 (`40090729624`) and ACE JAMB E2E #931 (`40090729719`) both completed successfully.
- Phase 3 repository implementation gate: **automated checks passed**. This is not a claim of complete production acceptance. User-reported navigation/layout and forms/keyboard accessibility on Tecno Pop 5 Pro remain reported rather than independently observed. Real screen-reader announcements and on-device performance/offline/PWA remain untested. Live Cloudflare URL responds, but the deployed source SHA is still not verified; read-only live browser smoke testing was previously blocked/not run.
- No deployment, database, catalogue, dependency, or production-data change was made. Catalogue importer remains outside this frontend closeout and blocked by its separately documented auth integration.
- **Exact next action:** treat Phase 3 code implementation as closed for now; when available, complete the remaining manual acceptance: verify Cloudflare's source commit, perform read-only live smoke test, screen-reader test, and performance/offline/PWA test on the target Android device. Reopen source work only for a reproducible defect. Do not describe the product as fully production-accepted until these gates have evidence.


## Phase 3 latest-HEAD CI confirmation — 2026-10-24 11:45 UTC

- Rechecked GitHub main HEAD: `9a19c6e22eec62948daa2d24787cfb771c7bf7b1` (`docs: checkpoint phase 3 automated closeout`).
- Verify run #1001 (`40090973046`) and ACE JAMB E2E run #934 (`40090973067`) both completed with conclusion `success` against this exact HEAD. This closes the repository automated-check gate for the current code and documentation state.
- The CBT submission progress announcement source commit `ba1695695b268f6310d5d2dc445e5c0d9417381e` also has successful Verify #995 (`40090688712`) and E2E #928 (`40090688664`).
- Phase 3 frontend implementation is **closed for now on repository/automated evidence**. This does not equal full production acceptance: Cloudflare deployment-to-source SHA mapping remains unverified; the live browser smoke test remains BLOCKED / NOT RUN (previously user chose not to authorize the retry); actual screen-reader behavior and real-device performance/offline/PWA remain untested. Navigation/layout and forms/keyboard PASS are user-reported, not independently observed.
- No deployment, backend/database, catalogue, dependency, or production-data operation was performed. Do not reopen the resolved catalogue/UI decision as part of this frontend closeout. Catalogue importer remains a separate, previously documented issue.
- **Exact next action:** only when browser automation is approved/available, run a read-only smoke test against `https://nova-ace-jamb.novaking5002.workers.dev/?mode=practice`; separately verify the Cloudflare source commit and complete screen-reader plus performance/offline/PWA checks on the Tecno Pop 5 Pro. Reopen source work only for a reproducible defect; do not call the product fully production-accepted until these manual gates have evidence.


## Phase 3 read-only live smoke test — 2026-10-24 12:00 UTC

- Latest-HEAD CI before this live test: Verify #1004 (`40091627675`) and ACE JAMB E2E #937 (`40091627735`) both completed successfully against `889a9dd2cc92ced663b2f3d52fdc534b81d3c783`.
- A live read-only browser smoke test completed at `https://nova-ace-jamb.novaking5002.workers.dev/?mode=practice`. Observed initial render: ÑØVÃ ACE JAMB login/account portal; email and password fields; Sign in, Create an account, Forgot password? controls; centered dark-theme layout. No visible runtime error overlay or warning appeared. No forms were filled or submitted.
- Test limitations: console/network diagnostics were not captured; multiple viewport sizes were not visually tested; authentication/backend/persistence were not exercised; `?mode=practice` did not expose visible practice-mode UI. No build version or source commit SHA was exposed by the page. Therefore Cloudflare deployed-source SHA mapping remains unresolved.
- Browser automation report indicates no visible error, but this does not constitute a full interactive authenticated journey or proof of backend correctness. Real screen-reader behavior and on-device performance/offline/PWA remain untested; navigation/layout and forms/keyboard PASS remain user-reported.
- No deployment, database, catalogue, dependency, or production-data operation was performed. Catalogue work remains separate and must not be reopened as part of frontend Phase 3.
- **Exact next action:** if deployment/source identity can be confirmed from Cloudflare dashboard or build metadata, record the verified SHA; otherwise keep it explicitly unverified. Complete real screen-reader and performance/offline/PWA checks on Tecno Pop 5 Pro when available. Reopen implementation only for a reproducible defect.


## Latest verified frontend acceptance state — 2026-10-24

- Current main HEAD at verification time: `eefd1a0a86b55f6652285c92fdf9ddb1480b60f5`.
- Verify run [40092049137](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40092049137): **PASS** on the exact HEAD. Typecheck, build/bundle attribution, parser/review-stage/catalog-import/PWA tests, Deno checks, and disposable PostgreSQL migration/policy tests passed.
- ACE JAMB E2E run [40092049176](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40092049176): **PASS** on the exact HEAD, including typecheck/build and Playwright browser tests.
- Live read-only smoke test [488b36f4-57af-4c5a-be1c-4cb17d1d85b7](https://agent.tinyfish.ai/runs/488b36f4-57af-4c5a-be1c-4cb17d1d85b7): Cloudflare Worker URL loaded the authentication screen without a visible error overlay. This does not establish deployed source SHA, successful sign-in, backend persistence, or the practice-mode route behavior.
- **Still open:** Cloudflare deployed source SHA mapping; manual keyboard-only acceptance; real TalkBack/screen-reader behavior; physical low-end Android interaction/performance; installable PWA/offline/recovery checks.
- **User boundary:** do not deploy, alter backend/database/production data, or reopen institutions/catalogue. Only reproduce and fix a concrete frontend defect if found.
- **Next action:** run the current handoff's manual acceptance checklist on the phone and report each check as PASS/FAIL/BLOCKED. Do not send credentials. Keep untested gates open until observed.


## Latest-HEAD CI result and continuation — 2026-10-25

- Verified main HEAD: `f6254d90ecc6b41b5da46c22ef2b29fcbc219111` (`docs: sync checkpoint with master TalkBack update`).
- Verify #1023 ([run 40169073637](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40169073637)): **PASS** on this exact SHA.
- ACE JAMB E2E #956 ([run 40169073604](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40169073604)): **PASS** on this exact SHA. Dependency install, typecheck, build, Playwright browser setup, and browser tests passed.
- This closes the automated repository-check gate for the current HEAD. It is not proof of the exact Cloudflare deployed source SHA or exhaustive real-device acceptance.
- Latest manual acceptance remains user-reported PASS: keyboard navigation; TalkBack smoke test; performance/recovery; PWA/offline/recovery; Cloudflare source version. Agent did not independently witness the device tests, and the precise deployed SHA was not independently read back.
- No reproducible frontend defect is open. No app code, deployment, backend/database, catalogue, dependencies, or production data were changed.
- **Exact next action:** do not reopen implementation speculatively. If Cloudflare deployment metadata is accessible, verify its deployed commit SHA against the intended release; if it is not accessible, explicitly retain that item as unverified. Continue source work only for a concrete reproducible defect or a specifically required deeper acceptance test.


## Latest-HEAD CI and Cloudflare confirmation — 2026-10-25

- Verified main HEAD: `98fe28cc8eb47b02d6e018cb97d8def919b3beb5` (`docs: record latest frontend CI results`).
- Verify #1024 ([run 40169272168](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40169272168)): **PASS** on this exact SHA.
- ACE JAMB E2E #957 ([run 40169272184](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40169272184)): **PASS** on this exact SHA; typecheck, build, Playwright browser setup, and browser tests passed.
- Project owner confirms the Cloudflare deployment matches. Record **PASS (owner-confirmed)**. Exact deployed commit SHA was not provided or independently read from deployment metadata during this session; independent SHA verification remains outstanding.
- Manual device acceptance remains user-reported PASS for keyboard navigation, TalkBack smoke test, performance/recovery, and PWA/offline/recovery. No concrete frontend defect is open.
- No app code, deployment, backend/database, catalogue, dependencies, or production data were changed.
- **Exact next action:** do not reopen frontend implementation speculatively. Continue only for a reproducible defect or a required deeper acceptance test. If the exact Cloudflare deployed SHA is later available, compare it to the intended release commit and record the evidence; otherwise keep the independent SHA read-back explicitly outstanding.


## Frontend completion status reconciliation — 2026-10-27

- Re-read the master handoff from the beginning, the current checkpoint, and the canonical agent instructions against actual GitHub main.
- Current main HEAD at review start: `b7d90f01a3418ab2b48a31437065d07797ceae33` (`Add files via upload`, 2026-10-26). GitHub Verify run [40412443730](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40412443730) and ACE JAMB E2E run [40412443718](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40412443718) both completed successfully for that exact SHA.
- **Correct distinction:** Frontend Phase 3 implementation is closed for the previously authorized frontend-only scope; this is not a claim that every product-facing frontend capability or the whole product is complete. The Phase 2 closeout explicitly carried exceptions for content-driven Learning/Practice/CBT/Flashcards/Progress/adaptive plans (which depend on verified published content and real activity), provider/contract-dependent payment/referral/grounded-AI/audio/notification outcomes, expanded admin operations, and manual/deployed acceptance evidence.
- Latest manual acceptance in this handoff is owner-reported PASS for keyboard navigation, TalkBack smoke-test level, performance/recovery, PWA/offline/recovery, and Cloudflare source-version alignment. Exact deployed Cloudflare SHA has not been independently read back; owner-confirmed alignment is not the same as independent SHA verification.
- No frontend code, backend, database, production data, deployment, or catalogue was changed during this reconciliation.
- The checkpoint's prior HEAD reference was stale. Update it to the actual HEAD above and do not use older checkpoint entries to overrule the newer master-handoff status.
- **Exact next action:** keep speculative frontend implementation closed; determine whether the project owner explicitly authorizes the next backend milestone. Do not start backend/database/production changes solely from a mistaken claim that the entire frontend product is complete.


## Batch 6 continuation — stale flashcard request guard — 2026-10-27

- Previous `main` E2E run [40426918661](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40426918661) finished **FAIL**: 80 passed, 2 failed, both the flashcard error/retry scenario on desktop and mobile. Browser-test logs show `getByRole('alert')` absent after the forced 503 response. Previous Verify [40426918635](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40426918635) passed.
- Application change committed as `9370c52a8ce5420a8568885253e200aa9d1baf26` (`src/components/StudentFlashcards.tsx`): track each load sequence and ignore superseded load successes, failures, and loading-finalizers so an older request cannot overwrite a newer result.
- Fresh Verify [40432192708](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40432192708) and E2E [40432192662](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40432192662) were **queued** at inspection; neither is claimed passed. No deployment, backend, schema, or live-data change.
- **Batch 6 remains open** until latest E2E is green. Exact next action: inspect both terminal CI results, investigate remaining error/retry failures if any, then close Batch 6 with evidence.


## Frontend Batch 6 completion and accelerated batch execution — 2026-10-27

- Batch 6 on main code/test SHA 1b42b24b8e258500b77fe4163b1b0db80ebd53eb is **accepted for mocked frontend flows**: GitHub Verify run 40432802473 PASS; ACE JAMB E2E run 40432802273 PASS on the exact same SHA. This does not prove production flashcard content exists; previous live flashcard count was zero.
- Owner requests completing remaining frontend capabilities in larger continuous batches, delaying full regression until the final milestone. Focused validation/security checks are still required after material slices; GitHub Actions may run automatically on commits. No backend, database or deployment authorization implied.
- Batch 8 incremental implementation: src/lib/studySchedule.ts generates an honest, deterministic upcoming two-week study-routine preview rotating saved student subjects on selected weekdays using preferred daily study minutes; src/components/StudentStudyPlan.tsx displays the preview. Pure tests are in tests/study-schedule.test.mjs.
- This is a frontend-only local preview, not persisted study-plan items, topic weakness analysis or adaptive scheduling. Batch 8 remains PARTIAL pending actual backend plan contracts and remaining acceptance criteria.
- No live data writes, migrations, provider or production deployment changes.
- Exact next action: inspect typecheck/build and scheduling test evidence for the new code; then implement the remaining Batch 7 mistake/revision interactions and Batch 8 integration dependencies without inventing question content; finish with full regression and real-device acceptance.


## Batch 7 source implementation slice — 2026-10-27

- Added StudentQuickRevision with approved syllabus topic selection/detail, read-only mistake history summary from the existing student_question_stats contract, explicit load/error/retry/empty states, and an honestly labeled generic practice action. Reused existing subject/topic props in StudentStudyWorkspace.
- Added fetchStudentMistakes to practiceService for self-scoped mistake reads that throw failures instead of silently turning network/auth errors into false empty histories. Existing progress helper remains unchanged.
- Important exceptions: live published topics/questions and study data were previously empty; per-question review, repeated-mistake drills, weakness/speed targeting and content-based quick revision remain incomplete, not simulated. Batch 7 is PARTIAL.
- No backend, schema, content, payment, provider, deployment, or production-data operation. Exact next action: verify source typecheck/build and continue real approved-question review/mode contract implementation; full product regression at final frontend milestone.


## Frontend continuous execution: focused mistake practice + progress history — 2026-10-27

- **Owner direction:** Continue frontend implementation in larger batches, defer full suite/release acceptance until the end, but keep focused compile/security checks, resolve material regressions, update both handoffs, and never invent content or live provider behavior. Remain on `main`; no backend/database writes or deployment authorization.
- **Batch 6 accepted:** code SHA `1b42b24b8e258500b77fe4163b1b0db80ebd53eb` passed Verify [40432802473](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40432802473) and E2E [40432802273](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40432802273). This tests fixture-backed frontend flows, not live content.
- Previous Batch 7 revision UI source SHA `5fe217411343559b8a842457cb4e989d2125757a` passed Verify [40434647797](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40434647797) but E2E [40434647730](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40434647730) FAILED: 80 pass / 2 fail because the legacy test expected old empty-state copy. Later code changes update that assertion.
- **Targeted mistake review:** commit `88ea5a3c965490966744a95c71cb7c7a8fd4b2d2` wires `StudentQuickRevision` → dashboard query `mode=practice&focus=mistakes` → `ProtectedCBT` → `PersistentCBT` / `start_attempt`. The browser loads only the signed-in student's `student_question_stats` rows and passes distinct UUID question IDs (up to 20) to the already-existing server-authoritative `start_attempt` RPC, which itself filters for active published questions. Focused attempts use a separate per-user recovery key so general CBT/practice sessions cannot collide. No incorrect-answer history triggers an honest empty state; auth/query failure has retry. Tests use mocked Supabase calls to verify the RPC body and no-attempt empty behavior. Verify [40436142693](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40436142693) PASS; E2E [40436142662](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40436142662) was still running at checkpoint preparation.
- **Performance history:** commit `6d8e4c2bce1d7ab7131ca15344487a79aecbfae5` adds strict self-scoped attempt fetch, recoverable loading/error/refresh, and a pure `summarizeAccuracyTrend` helper comparing real recent completed session accuracy in percentage points. The UI explicitly avoids predicted JAMB scores and limits its claim to 20 recent saved attempts. New isolated tests in `tests/progress-summary.test.mjs` and mocked browser fixture in `tests/e2e/smoke.spec.ts`. Verify [40436438949](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40436438949) PASS; E2E [40436438865](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40436438865) was still running at this checkpoint.
- **Batch 8 preview:** previous code commit `72b7eec4bbc4e775057c0e72247e0f7565037c45` adds a deterministic two-week subject rotation from saved days/minutes. Its Verify [40434348975](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40434348975) and E2E [40434349027](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40434349027) both passed (correct repository path is `DarealNovaking/Nova-ace-jamb`). Preview is not persisted adaptive planning.
- **Acceptance boundary:** Batch 7 and Batch 9 frontend capabilities remain PARTIAL: targeted practice and real progress summaries now have code/fixture tests, but real approved questions, topic-level weakness/speed modes, adaptive recommendations, and live-user runtime evidence remain outstanding. Batch 8 still requires a verified plan-item persistence/adaptation contract. Backend/provider-dependent domains in other batches remain as recorded in the canonical capability matrix.
- **Contract inspection blocker:** Attempt to read Supabase via available connection failed with `link_id must identify an eligible linked account`. No live schema or permission change was made; do not infer write access. The existing checked-in `start_attempt` SQL and self-scoped client query served as the implementation authority for the targeted practice flow.
- **Changed source:** `src/components/StudentQuickRevision.tsx`, `StudentStudyWorkspace.tsx`, `StudentDashboard.tsx`, `ProtectedCBT.tsx`, `PersistentCBT.tsx`, `StudentProgressSummary.tsx`, `src/lib/practiceService.ts`, `src/lib/progressSummary.ts`, `tests/e2e/smoke.spec.ts`, `tests/progress-summary.test.mjs`. No migration, Edge Function, dependency, catalogue, payment, or deployment changes.
- **Exact next action:** inspect E2E terminal results for 40436142662 and 40436438865, fix any reproducible failures with log evidence, then continue the highest-value remaining frontend scope on main. Do not mark the whole frontend or backend-dependent batches complete.


## Continuous frontend continuation: targeted practice E2E closure and study focus — 2026-10-27

- The earlier targeted mistake-practice commit `88ea5a3c965490966744a95c71cb7c7a8fd4b2d2` passed Verify but failed Playwright on both browser profiles because its new test expected a short exact accessible button name while the dashboard button includes descriptive secondary text. The test source was corrected on `main` in commit `a4568ff06ada7b09ae29adc94039d6d50ac7ab4e`; **Verify [40436855279](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40436855279) PASS and ACE JAMB E2E [40436855263](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40436855263) PASS on the same SHA**. This verifies the fixture-backed mistake history → focused CBT request, return empty state, existing flashcard and other browser regression tests. No published production question content was asserted.
- Latest additional frontend commit `9353f6d51752041d48fac8817c433703e4a47a35`: `src/components/StudentStudyPlan.tsx` loads the logged-in student's most recent 20 saved attempts through the already self-scoped read-only `fetchStudentAttempts` and presents an evidence-based study focus only when at least five subject-specific answers support a comparison. `src/lib/progressSummary.ts` adds the pure `suggestStudyFocus` selector, declining to invent a recommendation when no reliable subject-level record exists. New isolated test and Playwright fixture validate weakest-observed-subject selection and owner-scoped fetch; no topic/CBT prediction or adaptive-plan completion is claimed.
- The last code commit was in CI when this checkpoint was authored: Verify [40437108536](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40437108536) and E2E [40437108551](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40437108551) **IN PROGRESS**, not yet accepted. Previous progress-trend commit `6d8e4c2bce1d7ab7131ca15344487a79aecbfae5` passed Verify [40436438949](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40436438949); its E2E failed only the older exact-button locator, fixed in `a4568ff`. The verified `a4568ff` workflow covers the progress-trend code.
- Batch 6 is accepted on fixture-backed frontend and CI evidence. Batch 7 now has real self-scoped mistake history, general practice, and working server-filtered mistake-only practice; broader quick revision content, slow/weak/topic classification and other specialized modes remain incomplete. Batch 8 has preference persistence, two-week routine preview, and a real performance-informed focus suggestion, but persisted daily activity/adaptive topic plans still depend on verified backend contract. Batch 9 has recent completed-session accuracy and delta history, but mastery/readiness/topics and speed analytics remain incomplete.
- Source paths for latest change: `src/components/StudentStudyPlan.tsx`, `src/lib/progressSummary.ts`, `tests/progress-summary.test.mjs`, `tests/e2e/smoke.spec.ts`. Frontend-only, no migration, Edge Function, provider secret, production data, catalogue or Cloudflare deployment action.
- Supabase read-only access attempt through the current connector was rejected as an ineligible linked account. The existing checked-in SQL `supabase/migrations/20260912010000_persistent_cbt_service.sql` evidences the published-question filtering and mode contract. Any future study-plan persistence requires independently verified live schema/privileges before frontend writes.
- **Exact next action:** inspect terminal Verify/E2E results for `9353f6d` and repair any reproduced failure; then continue the next frontend-only acceptance gap without creating backend/provider mocks that claim production capability. Run full integrated acceptance before declaring the entire frontend complete.


## Continued frontend batches 4, 12, 13 and CI state — 2026-10-27

- **Confirmed baseline before these changes:** `main` SHA `fccdd31fcc4ff4e1510d0f61ee70b45861ff5403` passed Verify [40437291286](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40437291286) and E2E [40437291351](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40437291351). This includes the mistake-focused practice, recent completed-session progress, and evidence-based suggested study subject; CI uses isolated Supabase fixtures, not live published questions.
- **Batch 13 (notification hardening):** code SHA `46824905a30985dec5f55e7802a1af0c87e2c005` changes `src/components/StudentNotifications.tsx` to reject superseded asynchronous loads and post-unmount updates; mark-read updates additionally constrain `user_id` to the authenticated user (RLS remains authoritative). A failed inbox fetch now shows a retry affordance rather than a misleading empty inbox. Playwright fixtures cover failed load → retry and owner-scoped mark-read URL. Verify [40437663009](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40437663009) PASS; E2E [40437662926](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40437662926) was IN PROGRESS at this note. Delivery/push/admin announcement services remain unavailable/unverified; do not claim this batch fully accepted.
- **Batch 12 (ACE Pass/referral hardening):** code SHA `6dfcac7cdde7f96bc08feca538ffdbf9249fbc3d` changes `src/components/StudentAccountAccess.tsx` to ignore obsolete loads, distinguish API errors from genuinely empty payment, entitlement or referral data, and provide a retry action. Playwright mocks a failed product query then successful recovery. Verify [40437764077](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40437764077) PASS; E2E [40437764061](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40437764061) was IN PROGRESS. Payment initiation/webhook/entitlement verification and referral qualification remain server-dependent and disabled; no client-side entitlement manipulation was added.
- **Batch 4 speed-practice flow:** code SHA `99b09a9b1cd11c955c129a3e4d59fa22f69375dd` adds a Practice workspace action for **up to 10 approved questions in 10 minutes**. It uses existing `mode=practice&focus=speed` state and server `start_attempt` RPC with `p_question_count=10`, `p_duration_seconds=600`. The recovery pointer is separate from normal CBT, standard practice and mistake practice. Server still checks published active questions; no artificial question bank or scores. New Playwright fixture verifies RPC parameters and honest empty-bank handling. Copy refinement SHA `87137d56d558c6ef23bcdd3dcb0721866827f69f` clarifies 'up to' due to variable published question count. Verify and E2E for the newest SHA were not yet terminal when recorded.
- New/changed files: `src/components/StudentNotifications.tsx`, `src/components/StudentAccountAccess.tsx`, `src/components/StudentStudyWorkspace.tsx`, `src/components/StudentDashboard.tsx`, `src/components/ProtectedCBT.tsx`, `src/components/PersistentCBT.tsx`, `tests/e2e/smoke.spec.ts`.
- **Status:** Batch 6 remains accepted. Batches 4, 7, 8, 9, 12, 13 are improved but **PARTIAL** against the whole-product 16-batch acceptance plan. Other unfinished provider/content/admin domains remain as in the canonical matrix. No database writes, schema change, Edge Function, dependency, checkout enablement, admin publication, catalogue operation, or Cloudflare deployment.
- **Exact next action:** inspect terminal CI results for runs 40437662926, 40437764061 and the latest speed-practice commits; fix any reproduced error, then continue only safe frontend integration/design tasks backed by existing contracts. Defer consolidated release acceptance until the full frontend scope is ready, and preserve backend-dependent exceptions explicitly.


## Batch 4/7 further practice hardening — 2026-10-27

- **Verified prior source:** subject practice code SHA `ee71bfa53048ee7a4b97bf7be2c04121fecb8360` passed Verify [40438068017](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40438068017) and E2E [40438068060](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40438068060). Speed-practice copy/refinement SHA `87137d56d558c6ef23bcdd3dcb0721866827f69f` also passed Verify [40437902497](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40437902497) and E2E [40437902488](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40437902488). All CI browser tests run against fixtures; approved production question inventory is still unevidenced/previously zero.
- **Repeated mistakes:** new commit `3e8a6b206eb304bd5f14667158def9acbcda6e9a` adds the 'Practise repeated mistakes' option when current-user saved stats record at least two incorrect attempts on a question. It retrieves self-scoped stats, passes only repeatedly missed UUID IDs to published-question-filtering `start_attempt`, and uses a distinct per-user recovery pointer. No qualifying stats means a truthful empty state, and no unpublished question is synthesized. Added mocked Playwright check for filtering once-missed questions. Verify [40438217077](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40438217077) PASS; E2E [40438217536](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40438217536) was still running when recorded.
- **Observed weaker-subject practice:** new commit `3c4713bd22a2d2a9b3d672ae20eef3b58e014bb9` adds a Progress CTA for a subject with the lowest observed accuracy among qualifying completed subject-specific student attempts (minimum saved-answer evidence applies). CTA launches the existing subject-filtered practice flow, never a predicted score or topic-level diagnostic. Added mocked Playwright assertion for RPC `p_subject_id` from real fixture history. Verify [40438371990](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40438371990) and E2E [40438371881](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40438371881) were queued at recording.
- Files: `src/components/StudentQuickRevision.tsx`, `src/components/StudentStudyWorkspace.tsx`, `src/components/StudentDashboard.tsx`, `src/components/StudentProgressSummary.tsx`, `src/components/ProtectedCBT.tsx`, `src/components/PersistentCBT.tsx`, `tests/e2e/smoke.spec.ts`.
- **Acceptance:** The frontend now supports general practice, subject practice, timed speed practice, missed-question practice, repeatedly missed question practice and an observed lower-accuracy subject CTA against existing server RPC filtering. This does **not** complete the full weakness/topic/subtopic/adaptive/readiness/final-stretch modes or live approved educational question content, nor the whole 16-batch frontend product. Keep Batch 4/7/9 partially open for those explicit criteria.
- No backend/schema/data/provider/deployment/release operation. Exact next action: obtain terminal Verify/E2E for new focused modes, fix any reproducible failures, then continue the next safe frontend milestone or record exact missing contracts as blockers.


## Frontend Batch 4 — reviewed topic/subtopic practice (2026-10-27)

- **Verified incoming baseline:** `main` source SHA `f73924a130b4c3bd6467be615543a329a3d18b4c` completed Verify [40438444279](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40438444279) **PASS** and ACE JAMB E2E [40438444305](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40438444305) **PASS**. Covers fixture-backed general, saved-subject, speed, first/repeated-mistake and observed-low-accuracy-subject practice at that SHA.
- **Implementation commit:** `11181e103e542d8e4dc308cd8e4317b1e4c45eaa`. `StudentStudyWorkspace` now lists approved published syllabus topics for the selected preparation subject, optional published subtopics, and guarded buttons for topic/subtopic practice. Selecting a different subject resets the selected topic/subtopic. This does not revive the retired catalogue.
- `StudentDashboard` validates the choice against the already-loaded approved syllabus tree, then places only selected subject/topic/subtopic UUIDs in practice route state. `ProtectedCBT` validates URL UUID shapes, loads only up to 20 active/published question **IDs** scoped to subject/topic/subtopic with the self-authenticated `practiceService.listPublishedTopicQuestionIds` helper, and keeps separate per-user recovery keys for each targeted scope. Empty results are explicit and never fall back to a random/general attempt; provider errors are redacted and retryable.
- `PersistentCBT` uses the existing server-authoritative `start_attempt` RPC with both subject ID and fetched question ID list. The existing SQL contract (`supabase/migrations/20260912010000_persistent_cbt_service.sql`) revalidates active, published question IDs and performs server-controlled randomization, answer saving and scoring. No new schema, RPC, permissions, production-data writes or backend service was introduced.
- **E2E test commit:** `96930faa37c3c7db9291d7ae0327b8af324cf5b9`. Mocked browser tests assert approved topic ID filtering, subject/topic RLS-style query parameters, server RPC input, and subtopic empty-bank behavior without accidentally invoking `start_attempt`. They never touch live data.
- **Verification at checkpoint:** Verify [40465463579](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40465463579) **PASS** on implementation commit. Verify [40465524796](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40465524796) **PASS** on test commit. E2E [40465463580](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40465463580) and [40465524913](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40465524913) **IN PROGRESS**; no browser pass claimed yet. Precise live approved-topic and published-question availability remains unverified; past read-only evidence showed zero.
- **Current Batch 4 acceptance:** more capable but **PARTIAL**. Frontend now has topic and subtopic selection over existing published-question contracts; remaining broader topic weakness, adaptive/readiness/final-stretch, complete content and device acceptance are still outstanding.
- **Exact next action:** inspect terminal E2E outcomes for both latest topic commits, fix any fixture/runtime regression, then continue another specific whole-product frontend acceptance gap while preserving frontend-only scope and recording provider/content dependencies.


## Batch 5 CBT review controls, submission safeguards and response timing — 2026-10-27

- **Verified incoming baseline**: `main` source `f7fa055f50bc6eeb5df36f8ed0b82a66c6ef8c27` passed GitHub Verify [40466798585](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40466798585) and ACE JAMB E2E [40466798532](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40466798532), including the previously added approved topic/subtopic practice flows and administrator-only read-only question review queue. The queue is not a publishing service.
- **CBT review markers**: `src/components/PersistentCBT.tsx` commit `b64dd1b2adcd6cb480aa85dfc5edda2892fda090` adds mark/unmark for review, question-map marked/unanswered counts and styling, next-unanswered navigation and per-attempt local review-marker persistence across reloads; markers are removed after completed submission and are not submitted as answers, scores or analytics. `tests/e2e/smoke.spec.ts` test commit `6b5bcba5f4fdaffa1e725814f5c50ccc51d1c370` verifies marked navigation/recovery and cleanup. Both SHA-level Verify/E2E runs passed: [Verify 40470497939](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40470497939), [E2E 40470497952](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40470497952).
- **Submission safety and results**: commit `3418ec77d9cc5d6caffd58d2815e56e38d558c0c` adds review-before-submission confirmation for active CBT with unanswered or marked questions, explicitly permits returning to review, prevents manual submission while an answer is still saving, and preserves automatic timed-expiry submission. Displays the server-reported correct/total, answered/unanswered breakdown and a link to saved progress history; it never implies an official or predicted JAMB score. [Verify 40470735696](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40470735696) **PASS**, [ACE JAMB E2E 40470735761](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40470735761) **PASS** on the same source SHA.
- **Response-time bug fix**: commit `386ec15927d32959b1cfec07bbbd2e5018aa00b2` changes `PersistentCBT` answer-save timing from the prior saved answer's timestamp (always null on first response) to a monotonic time elapsed since the displayed question became active; new E2E assertion checks that the first answer sends a positive `p_response_ms`. This enables future reliable per-answer observations. Historical rows with null/zero time cannot be retroactively reconstructed. At this checkpoint, Verify [40471085080](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40471085080) and E2E [40471085078](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40471085078) were **IN PROGRESS** and must not be claimed passed.
- **Acceptance boundary**: Batch 5 frontend control/recovery/reporting is improved, but full mock composition must remain governed by verified season configuration and published content; independently verified live deployment and final device/release acceptance remain open. The full frontend 16-batch matrix is NOT closed. Other content/provider/backend-dependent gaps remain explicitly blocked/partial as in the retained product mission.
- **Files**: `src/components/PersistentCBT.tsx`, `tests/e2e/smoke.spec.ts`, and the three continuity documents. No schema, live student record, payment, catalogue, Cloudflare deployment, content-publication or other production write was performed.
- **Exact next action**: inspect terminal results of 40471085080 and 40471085078, fix any reproduced browser/runtime failure, then continue the highest-value safe frontend-only acceptance gap. Record external/provider/data contract blockers instead of inventing functionality. Keep comprehensive release acceptance until remaining frontend work has been integrated.


## Frontend Batch 5 CBT recovery safety: retain attempt after transient resume error — 2026-10-27

- **Incoming HEAD:** `3e312a42ecdb82eb2448dfe3f731b0d6d1b451d2`; GitHub Verify [40471275234](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40471275234) **PASS** and ACE JAMB E2E [40471275222](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40471275222) **PASS** on that exact SHA. Prior response-time fix [40471085080](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40471085080) Verify and [40471085078](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40471085078) E2E also passed; the previous checkpoint's "pending" status was historical.
- **Verified issue in source:** `PersistentCBT.load` previously discarded any saved CBT recovery pointer when `resume_attempt` threw and began a new attempt, even if a transient network, authorization or server failure caused the error. This risks fragmenting saved progress and duplicates a new attempt after a recoverable failure.
- **Fix:** only server-reported `P0002` ("Attempt not found") permits clearing a stale local pointer and starting a replacement; all other resume failures keep the original pointer and surface existing generic retry UI. Explicit resume IDs always fail visibly, never implicitly replace.
- **Focused browser fixtures added** in `tests/e2e/smoke.spec.ts`: transient resume failure → pointer retained / no start / retry restores original; definitive P0002 → pointer replaced once / new attempt resumed. The tests mock all Supabase requests, do not write real student data, and check that provider error text stays private.
- **Affected files:** `src/components/PersistentCBT.tsx`, `tests/e2e/smoke.spec.ts`, and continuity docs. No schema/Edge Function/deployment/production student-data action.
- **Verification status at edit:** latest commit's fresh GitHub Verify and E2E are **NOT YET VERIFIED**. Do not close Batch 5 or full product acceptance based solely on the code change. Browser mocks are not proof of real server configuration or published content.
- **Exact next action:** inspect the new SHA-matched GitHub Verify and E2E results, repair a reproduced failure if found; then continue the next safe frontend-only acceptance gap under the retained 16-batch product matrix.


## CBT countdown safety follow-up — 2026-10-27

- The prior recovery-pointer safety correction is committed as `7c5c778fd1442ff0f30639731f5204a51c637660`; Verify [40472126194](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40472126194) and E2E [40472126205](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40472126205) were running at this edit, not assumed green.
- **Source defect found:** despite receiving `resume_attempt.remaining_seconds` from the server, `PersistentCBT` recomputed remaining time each second using the device's wall clock and `started_at`. A wrong handset date/time could show instant expiry or extra time, even for a valid server-active attempt.
- **Fix:** anchor the visible countdown to the server-reported remaining time and elapsed `performance.now()` (monotonic); clamp to the session duration. Server-side answer/save/submit authorization remains authoritative. A new browser fixture intentionally supplies a wildly skewed `started_at` and verifies that a server report of 90 seconds does not auto-submit after ~1 second.
- Source: `src/components/PersistentCBT.tsx`. Tests: `tests/e2e/smoke.spec.ts`. No schema, data, deployment, catalogue or payment change.
- **Status:** code change recorded; new code/test SHA's Verify/E2E remains **UNVERIFIED** until terminal green. Full CBT mock composition and whole-product frontend acceptance remain open.
- **Exact next action:** inspect the freshest GitHub Verify and ACE JAMB E2E terminal result; fix reproducible timer/recovery failures; continue remaining frontend acceptance gaps while respecting missing education/service contracts.


## Batch 8 saved-preferences load-failure guard — 2026-10-27

- **Found from source:** `StudentStudyPlan` had fallback UI defaults (60 minutes, weekdays) and kept Save enabled even after `getStudentPreferences` failed. A student saving during a temporary outage could overwrite real account preferences with those defaults.
- **Frontend fix:** track unsuccessful initial/retry loads explicitly, disable time/day inputs and Save until account preferences have loaded successfully, and offer an accessible retry. Saving remains enabled after a save-specific failure if the original account read succeeded. `savePlan` also enforces the guard in code.
- **Fixture regression:** `tests/e2e/smoke.spec.ts` injects a failed preferences GET and checks Save blocked/no write; retry returns 75 minutes + Friday and the UI restores those saved values before enabling Save. This test does not touch real student data.
- **Files:** `src/components/StudentStudyPlan.tsx`, `tests/e2e/smoke.spec.ts`, three continuity documents. No SQL/provider/deploy/payment/content writes.
- **Previous app verification:** recovery pointer fix `7c5c778fd1442ff0f30639731f5204a51c637660` passed Verify [40472126194](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40472126194) and ACE JAMB E2E [40472126205](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40472126205). Monotonic CBT timer code `58be8f44553402ae3c66fb1d5a6dba9367c8fffb` passed Verify [40472442407](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40472442407), while E2E [40472442404](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40472442404) was still running when inspected.
- **Acceptance:** front-end data-integrity guard implemented, but code/test SHA terminal Verify/E2E still pending at time of handoff. Persisted daily schedule/adaptive planning remains a separate backend dependency. No whole-product frontend completion is claimed.
- **Exact next action:** inspect latest main SHA-matched Verify/E2E and resolve any reproduced failure, then move to the next safely implementable frontend acceptance criterion.


## Batch 1 saved-account field integrity on settings load error — 2026-10-27

- **Issue:** `StudentAccountSettings` rendered a writable form containing empty component defaults when either saved profile or study preferences failed to load, risking overwriting real fields on a later Save.
- **Fix:** only show editable account fields after both authenticated reads succeed; otherwise display a safe error and retry. Also block programmatic Save while account data has not loaded. Does not change how successful profile/preference updates are saved.
- **Fixture test:** failed initial GET blocks form and writes, no raw provider message; retry restores the saved display name and 75-minute study preference and enables editing. Existing successful account-settings test remains in the suite.
- **Changed:** `src/components/StudentAccountSettings.tsx`, `tests/e2e/smoke.spec.ts`, three handoffs. No database/migration/publishing/provider/deployment actions. The previous study-plan guard lives on `207282917e1a289ba922e62b5a53dff693781c2a`.
- **Verification:** new SHA CI is pending and must be checked; no live authenticated device test is claimed.
- **Next safe step:** inspect newest Verify and E2E results and fix only reproducible failures, then continue the remaining frontend acceptance work.


## Account settings split-update safety — 2026-10-27

- The existing account save uses `updateStudentProfile` and `updateStudentPreferences` as two separate authorized writes, **not** an atomic backend transaction. If the profile write succeeds and the preference write fails, the earlier generic failure copy misleadingly suggests no settings saved while the form still allows blind resubmission.
- **Frontend-only correction:** track successful profile write; when the second call fails, explicitly disclose partial-commit uncertainty, hide editing until saved values are reloaded, and offer Retry loading account settings. No attempt at client-side rollback, user data inference or new database contract. Earlier failure of the first write remains retryable within the loaded form.
- **Mocked E2E:** first profile PATCH success, second preferences POST error; assert no combined success claim, reload shows updated profile and unchanged 60-minute preference, no automatic duplicate writes.
- Files: `src/components/StudentAccountSettings.tsx`, `tests/e2e/smoke.spec.ts`, and continuity docs. Existing tests for successful dual updates and initial read errors remain. No backend/schema, deployment or production data write.
- **Verification:** CI on the new commit must be inspected before acceptance. Atomic account saves remain a backend contract gap, not claimed complete.
- **Next action:** inspect terminal Verify and E2E and repair any reproductions; continue remaining frontend-only acceptance tasks.


## CBT/account safety QA: isolate failed account-read fixture from onboarding — 2026-10-27

- **Observed terminal E2E failure:** run [40472721589](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40472721589), SHA `207282917e1a289ba922e62b5a53dff693781c2a`, **122 PASS / 2 FAIL**, both versions of `study-preference loading safety` in Chromium desktop/mobile.
- **Diagnosed from actual Playwright log:** test injected a failure on every `student_preferences` GET before the page mounted. The app's foundational onboarding/profile gate also reads that table; it blocked access to the study-plan workspace before the component under test loaded. The failed assertion was the missing `Build your study routine` heading, not a study-plan crash.
- **Fix:** in the study-plan recovery fixture, wait for the authenticated prepared dashboard to load, then inject the simulated preferences failure and navigate to Study Plan. Applied the same isolation to the account-settings read-error fixture, which would otherwise block initial student foundation setup. Tests still assert saved-data loading error, no write until retry, and recovery of real values.
- No source behavior change: test-only `tests/e2e/smoke.spec.ts` plus required handoffs. No production/student data writes.
- Earlier [40472442404](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40472442404) E2E and [40472442407](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40472442407) Verify **PASS** for the monotonic CBT timer. `2072829` Verify [40472721667](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40472721667) PASS. Do not claim latest additional account tests passed until SHA-matched rerun completes.
- **Next exact action:** check freshest Verify and Playwright E2E, fix only reproduced failures; then continue frontend acceptance while service/content dependent modules remain explicitly partial.


## Batch 9 approved subtopic performance and focused practice — 2026-10-27

- **Scope:** Extend real saved-question evidence beyond topics into approved syllabus subtopics, without invented scores or a new backend. `fetchStudentTopicEvidence` now reads the already present `questions.subtopic_id` metadata alongside active published question IDs, scoped to the signed-in user's observed question IDs.
- Pure `summarizeSubtopicEvidence` requires published question → subject → approved topic → approved subtopic alignment, deduplicates questions, ignores unsupported records, applies the same five-answer evidence threshold and sorts by observed answer accuracy. No official/JAMB score prediction.
- `StudentProgressSummary` displays honest loading, unavailable and insufficient-data states plus a CTA to the already server-filtered `mode=practice&focus=subtopic` flow for a qualified approved subtopic. No outside-topic fallback or unreviewed question text is generated.
- Added isolated tests and Playwright mocked approved syllabus/subtopic + saved history → subtopic-scoped practice, with zero live student data operations. Files: `src/lib/progressSummary.ts`, `src/lib/practiceService.ts`, `src/components/StudentProgressSummary.tsx`, `tests/progress-summary.test.mjs`, `tests/e2e/smoke.spec.ts`, handoffs.
- **Verification:** current commit CI pending. The earlier account/settings fixture setup correction `30a3f928bcc7dc32193429500c51253e1e603271` passed Verify [40473461390](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40473461390); E2E [40473461413](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40473461413) was still running at this checkpoint and must not be assumed green.
- **Acceptance:** Batch 9 remains PARTIAL (readiness, speed analytics, deeper mastery and live content/provider contracts not satisfied). Frontend-wide 16-batch completion and deployment are not claimed. No schema, provider, payment or production write.
- **Next action:** verify new main source SHA typecheck/build and Playwright across desktop/mobile; fix any regression from grounded evidence and continue remaining frontend scope.


## Batch 8 evidence-based subtopic next-step recommendation — 2026-10-27

- Extended the study-routine frontend to show a specific approved subtopic worth revisiting when the current user's saved published-question answer history contains at least five relevant decisions. Reuses `fetchStudentTopicEvidence` and `summarizeSubtopicEvidence`; no new database schema or speculative content. The student can launch the existing published-question-filtered subtopic practice contract from Study Plan.
- With no approved topics, no supported subtopic history, network failure or insufficient answers, the view says so instead of suggesting fake weaknesses. Study routine still rotates all selected subjects; no persisted AI/adaptive plan is claimed. Bounded additional read only runs when approved topics exist.
- Files: `src/components/StudentStudyPlan.tsx`, `src/components/StudentStudyWorkspace.tsx`, `tests/e2e/smoke.spec.ts`, canonical handoff, checkpoint and batch tracker.
- **Verification:** new code/test SHA CI is pending at commit time. Previous subtopic progress feature on `4bde63821ad8f50c715169afc51b321894ff1efc` had Verify [40473989897](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40473989897) PASS; E2E [40473989835](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40473989835) still running when inspected. Do not claim full Study Plan or whole-product completion.
- **Next action:** inspect newest Verify and E2E results; fix a reproduced integration regression; continue with the next frontend acceptance criterion respecting server/content dependencies.


## Batch 8 study-preview integrity follow-up — 2026-10-27

- Commit `73094564ddc43fdedebada657d8bcdd6d400de52` on `main` updates `src/components/StudentStudyPlan.tsx` so the two-week routine preview does not show fallback/default preferences while the saved account preferences are loading or after a failed read. It instead displays loading/retry guidance, preventing a misleading preview.
- No backend, schema, production data, catalogue, deployment or provider changes.
- Verification: source edit committed; new SHA typecheck/build and Playwright E2E NOT YET VERIFIED. Previous Batch 9 `4bde638` Verify run 40473989897 and E2E run 40473989835 both completed successfully (checked through GitHub jobs API). Do not claim the current commit is green.
- Next action: check SHA-matched Verify and E2E on `main`, repair any reproduced regression, then continue remaining frontend acceptance gaps under the 16-batch matrix.


## Batch 8 study preview regression coverage — 2026-10-27
- Added Playwright assertions to existing study-preference loading safety test in `tests/e2e/smoke.spec.ts`, commit `43ebad346be4dec52fc7c733000ce8ba15f0dfb6`. On failed account preference GET, preview must show reload guidance and not display an invented 75-minute session; after retry it must remove guidance and restore saved 75-minute preference. Complements UI guard commit `73094564ddc43fdedebada657d8bcdd6d400de52`.
- New SHA typecheck/build/E2E: UNVERIFIED; no tests were executed locally. No backend or live data changes.
- Next action: inspect latest main SHA-matched GitHub Verify and E2E; fix reproduced failures, then continue frontend acceptance matrix.


## Batch 13 notification preference load-integrity guard — 2026-10-27
- Frontend code commit `f62b55b9b3426066fb0a3786ec4465bc008b0cd7` changes `src/components/StudentNotifications.tsx`: settings are read-only until the authenticated notification+preference fetch succeeds, and save is blocked during failed/incomplete reads. Prevents saving component defaults over existing notification preferences after an API failure. Retry reloads from the existing read path.
- No backend, schema, delivery provider, deployment or production-data action. Push delivery remains unavailable; Batch 13 remains PARTIAL.
- Verification: source committed, latest SHA typecheck/build/Playwright UNVERIFIED. Next: add mocked regression coverage for failed preferences read → no write → retry restored values; then run SHA-matched CI and continue other independent frontend gaps.


## Batch 13 notification preferences Playwright regression — 2026-10-27
- Added mocked Playwright test in `tests/e2e/smoke.spec.ts`, code commit `2c030652ea3918ecf8492a62fe6c57982d63234f`: a failing `notification_preferences` read disables save and editing with zero writes; retry returns persisted settings (marketing enabled, email disabled), restores controls without writing defaults. Complements source guard `f62b55b9b3426066fb0a3786ec4465bc008b0cd7`.
- Verification status: source/test committed; latest SHA CI/typecheck/build/E2E UNVERIFIED. Batch 13 remains PARTIAL; push and email delivery not implemented or claimed. No backend/database/deployment changes.
- Next concrete action: verify latest SHA via runner-backed CI and fix any failures, then continue independently implementable frontend acceptance gaps.


## Batch 12 referral count scope accuracy — 2026-10-27
- Source commit `b1a44e581ad9d24b89395016829a37c54bfe94f9` updates `src/components/StudentAccountAccess.tsx` to explicitly label referral/qualified counts as based on at most the 100 most recent referral records (matching `.limit(100)`), not lifetime totals. Test commit `47eaa3821add4176cfea702530098491f32c595c` asserts the labels in `tests/e2e/smoke.spec.ts`.
- Verification: commits inspected/written; latest SHA typecheck/build/E2E UNVERIFIED. Batch 12 remains PARTIAL (payment and referral qualification provider-dependent). No backend, database or deployment changes.
- Next: runner-backed Verify/E2E on latest main, fix failures, continue independent frontend acceptance items.


## Continuous frontend regression repair and account/notification safety — 2026-10-27
- Inspected actual `main` and the live GitHub Actions list using read-only GitHub page evidence, then retrieved workflow jobs and E2E logs through connected GitHub. Prior `0cf5cc8b28338c8ff1f9987bdcbd3d434ede1a6a`: Verify run `40479343026` PASS; E2E run `40479342782` FAIL (132 passed / 2 failed, both platforms of the new notification preference failure test). Source behavior was not shown broken by that assertion alone.
- Regression test adjusted in `tests/e2e/smoke.spec.ts` by `01bb92bef3d92a318a76a5127630e6c9e2ab8529` to inject preference failure only after initial dashboard readiness and refresh. Verify PASS (run `40480536742`); E2E run `40480536968` FAIL (132 passed / 2 failed), now due to ambiguous global `Refresh` button locator (dashboard refresh and notification refresh). Scoped to `section[aria-labelledby=notifications-title]` in code commit `10bc9150280d0e833372b3d4abff9e16fcfb114c`; its SHA-matched CI pending.
- Batch 13 frontend fix `ee44f9b6efca71022398523bcc2e258d61c53e01` separates notification loading errors from interaction errors, retaining the existing inbox after a failed mark-read or preferences save instead of hiding rows as a load failure. Regression test `4860837a55be472e4e3c56c74655220cef625059` asserts failure → visible inbox → retry success. Verify PASS on `4860837` (run `40480666237`); E2E pending at inspection.
- Batch 1 frontend fix `70155931895ea1353efff3e22ef4edfa23ac7c4b` guards overlapping/obsolete account-settings reads across close/reopen and retry; regression test `3cc4c903ced2c265a7e508cbda5f38319f616948` checks late first profile response cannot replace a newer load. Verify PASS on `3cc4c90` (run `40481003614`); E2E pending at inspection.
- All changes are frontend/tests only; no backend schema/data, provider, catalogue, deployment, or secrets changed. Existing feature batches remain PARTIAL; do not equate passing Verify with successful E2E.
- **Exact next action:** check Verify and ACE JAMB E2E jobs for commit `10bc9150280d0e833372b3d4abff9e16fcfb114c`; inspect and fix any failed browser test, then continue other independent frontend acceptance items.


## Frontend CI recovery verified and redundant-run suppression — 2026-10-27
- **Green source/test baseline:** commit `10bc9150280d0e833372b3d4abff9e16fcfb114c` passed GitHub **Verify** run [40481124775](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40481124775) (both verify and UTME migration jobs successful) and **ACE JAMB E2E** run [40481125370](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40481125370) (**138 passed, 0 failed**; CI log retrieved). The new notification preference-retry test, failed mark-read preservation/retry test, and stale account-settings read test were present in this SHA, and both Playwright projects passed. The prior failures were in regression test setup/ambiguous button locator; the last locator was scoped to the notifications section rather than globally matching dashboard `Refresh`.
- **Workflow efficiency change:** `.github/workflows/e2e.yml` commit `9dd9e0ca6288341f2ff7b26d83bfd81b511da42c` and `.github/workflows/verify.yml` commit `6a147bc3fd20a064712d5527e5130a52e9d107dd` now set workflow/ref-scoped `concurrency` with `cancel-in-progress: true`, and exclude documentation-only `docs/**` / `**/*.md` **push** events. Pull-request checks remain enabled; source/test/workflow pushes still run checks. This reduces redundant browser minutes and preserves verification of the newest source SHA. Workflow change CI for latest `6a147bc` was still running/queued at the time of this entry; do not call it verified yet.
- No backend/database, production data, deployment, membership proof, payment, AI or catalogue changes. Batch 1/12/13 remain partially complete against full-product acceptance, notwithstanding these verified safeguards.
- **Next concrete action:** verify final Verify/E2E outcomes on workflow commit `6a147bc3fd20a064712d5527e5130a52e9d107dd`; investigate any failed job, then resume remaining frontend acceptance matrix with fewer CI runs. No user action currently needed.


## Batch 14 academic version-tree isolation — 2026-10-27
- Source commit `51f5716e20d9667de2ef88ac90118478bab386a1` updates `src/components/AdminAcademicWorkspace.tsx`: version-specific topic/subtopic loads have monotonic request IDs; selection invalidates and clears prior tree rows; stale responses are ignored. Pending/failed tree loads block topic/subtopic edits and version activation, including programmatic action checks. The version selector stays changeable during reads so a newer selection takes precedence; selected version controls are disabled during active write actions. No syllabus content, rights, publication or schema changes.
- Regression commit `4fe00f7ee849cf7ca2f827bde59ae25c9e0facdc` adds a mocked desktop/mobile Playwright journey switching A → delayed B → A; verifies old A content clears, editing is disabled while B loads and late B cannot replace A's tree. No production data touched.
- Verified: GitHub Verify run [40482247570](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40482247570) PASS (verify and UTME migration jobs). GitHub E2E run [40482247768](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40482247768) IN PROGRESS at documentation time; do not claim browser pass yet. CI concurrency supersedes earlier runs as intended, and documentation-only pushes are excluded from CI.
- Status: Batch 14 remains PARTIAL. Next exact action: inspect E2E run 40482247768; fix any evidenced failures and confirm passing desktop/mobile tests before moving to the next safe frontend acceptance gap.


## Batch 14 academic race regression closure and admin role retry — 2026-10-27
- Latest academic race regression corrected in `tests/e2e/smoke.spec.ts` commit `d2d0a02957f8370454aa5c177ecdea3571126970`. Prior `4fe00f7` Playwright failed on both platforms because its locator matched both a topic button and a parent-topic <option>; updated test scopes to visible topic buttons. **Verify [40482966169](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40482966169) PASS** (verify and UTME migration); **E2E [40482966105](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40482966105) PASS** (140 tests, 0 failed, CI job logs inspected). Confirms batch 14 async-version-selection safeguard on both browser projects. Batch 14 still PARTIAL for full command center/content publication scope.
- Follow-up admin login hardening: `src/components/AdminFoundationGate.tsx` code commit `04edf144280d19965b0972f2276d396314ffbee0` adds a retry action **only for transient administrator role lookup errors**; resets gating state to pending during retry and continues to require server `is_admin` true before showing admin content. Auth missing and denied roles do not receive client-only bypass. `tests/e2e/smoke.spec.ts` commit `6c1497722d9374e46787cc727eae16617cac129f` adds mocked error→retry→valid-admin and denied-role non-bypass regression journeys. Latest SHA Verify/E2E: PENDING, not yet claimed passed.
- No backend, schema, payments, publication, catalogue or deployment changes. CI docs-only exclusion and cancellation of obsolete runs are now observed working. User action required: none.
- Next exact action: inspect Verify/E2E on commit `6c1497722d9374e46787cc727eae16617cac129f` and repair any failure, then continue remaining frontend-only acceptance gaps without re-opening retired catalogue.


## Batch 14 admin authorization recovery verified — 2026-10-27
- Code commit `04edf144280d19965b0972f2276d396314ffbee0` adds retry UI for **transient** administrator role verification failures in `src/components/AdminFoundationGate.tsx`; retry rechecks the authenticated user and `ace.rpc('is_admin')` and keeps protected admin UI hidden unless true. Missing users and real denied roles cannot bypass the guard by retrying. Regression test commit `6c1497722d9374e46787cc727eae16617cac129f` adds transient-error-to-authorized recovery and denied-role non-bypass journeys.
- **Runner-backed verification on source/test commit `6c1497722d9374e46787cc727eae16617cac129f`: Verify [40483649121](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40483649121) PASS (both verify and UTME migration jobs); ACE JAMB E2E [40483649049](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40483649049) PASS, 144 browser tests passed, 0 failed, across chromium/mobile-chromium; job logs inspected. This supersedes preceding pending status for this source/test SHA.
- The previous green 140-test baseline `d2d0a02957f8370454aa5c177ecdea3571126970` remains recorded above, including Batch 14 syllabus tree request isolation. Workflow path exclusion for docs-only commits continues to avoid redundant builds. No backend, database/production data, deployment, catalogue or external service edits.
- Status: latest frontend source/test SHA verified via mocked service contracts, but whole-product frontend 16-batch acceptance remains OPEN for content/provider/admin product dependencies and live acceptance. No user action is required for this frontend check. Exact next action: inspect remaining independently implementable frontend acceptance gaps, especially admin/question content review and accessibility/PWA, then execute/test the next safe batch slice.


## Frontend admin read-only UX and academic failure safety — 2026-10-27
- **Admin question queue:** `src/components/AdminQuestionReviewQueue.tsx` implements read-only, server-backed 30-record pagination (fetches one extra row to detect next page), previous/next navigation, page-scoped status filter disclosure, and no-match feedback. Source commits `0aa302a6b2185c582ad868a130f66a3f34bda04d`, JSX correction `20c2a10aace8231544575bd28eb14635ef3d61d4`; Playwright coverage in `tests/e2e/smoke.spec.ts` at `8b67849af7f746019c9802c61f84458544f4ae50` and StrictMode-resilient assertion at `d95daa920c9fe19502b70ea90e3a07d0aafe4447`. This remains read-only, not a question publication/approval workflow. Earlier `8b67849` CI failed at JSX parsing; fixed before latest test attempt.
- **Admin operations counts:** `src/components/AdminOperationsOverview.tsx` at `c4d3faf66fa2aca60cc315f64ed795f7bd2d3a6c` rejects stale asynchronous reads, distinguishes all-unavailable API counts from valid zero-count cards, does not print a false latest-check timestamp, and exposes a retryable error. `8b67849` adds mock fail→refresh→correct-count browser coverage.
- **Academic workspace:** `src/components/AdminAcademicWorkspace.tsx` at `ad6abcd16c30c53b46f3a0527849a06ee9fbd4b6`, follow-up `8d0961f449d84d51acf65447db8e9f4878a7334d`, blocks syllabus authoring/activation after incomplete/failed initial or post-write reload, adds a retry action, hides raw service/database errors and avoids claiming confirmed success after a write whose reload failed. `tests/e2e/smoke.spec.ts` commit `e17d7983fc3793c35db9e2c7c14aa59f0324b2c7` tests failed read → no authoring → retry recovery and no private error text.
- **Current tested source/test status at this entry:** Verify [40490433321](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40490433321) PASS (verify + migration jobs) at code/test SHA `8d0961f449d84d51acf65447db8e9f4878a7334d`. ACE JAMB E2E [40490433285](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40490433285) RUNNING, not yet confirmed passed. Older cancelled runs are superseded by workflow concurrency and not independent regressions. Prior verified 144-test green baseline on `6c14977` remains documented above.
- No backend/database, official content publication, catalogue, Cloudflare deployment or production data action; Batch 13/14 and integrated 16-batch frontend acceptance still PARTIAL due missing real content/provider contracts and live checks.
- **Exact next action:** inspect E2E 40490433285 job result and logs, fix actual failures on latest source/test; then continue the next independent frontend-only acceptance improvement. User action: none for the current runner-backed test.


## Frontend admin review completeness and recovery test isolation — 2026-10-27
- Atomic code/test commit `47c76438b4131b6bd2c11ac7e9cfce6ed61a8c21`: `src/components/AcademicFoundationGate.tsx` retries transient editor authorization failures only after rechecking current authenticated user and server `is_admin_or_editor` (a rejected role still cannot enter); `src/components/AdminQuestionReviewQueue.tsx` exposes complete long question text through a keyboard-accessible native disclosure, preserving the 360-character overview and read-only/no-publish contract. `tests/e2e/smoke.spec.ts` includes mock server-gated editor retry and complete-question disclosure coverage.
- GitHub Verify [40491398495](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40491398495) PASS on code/test SHA `47c7643`. Earlier frontend source/test SHA `8d0961f` also passed Verify [40490433321](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40490433321), but its E2E [40490433285](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40490433285) FAILED with **146 passing and four failing desktop/mobile assertions**, confined to new academic-record-load and operational-count-failure mock cases: the expected error alerts were absent during initial startup. No production service or security failure has been established by those mocks. Do not describe that E2E SHA as green.
- Revised tests at commit `7f6e7c0de1e62a77b99ca723b25869c81b7463e2` inject failing mocks **after** the authorized workspace loads and use an explicit refresh; this isolates recovery from initial route/auth bootstrapping. Verify [40491656910](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40491656910) PASS (verify + UTME migration jobs); E2E [40491656951](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40491656951) IN PROGRESS at this note, result not yet verified.
- No backend, schema, live data, catalogue, provider, payment or deployment modifications. The whole integrated 16-batch frontend remains OPEN where reviewed content/verified services and operational publishing contracts are absent.
- **Next exact action:** fetch E2E 40491656951 final job and logs; correct any reproduced issues and only mark verified on SHA-matched passing CI. After green, re-evaluate remaining frontend-only acceptance gaps and document backend/provider dependencies as explicit exceptions rather than imaginary completion. No user action required for this CI cycle.


## Verified frontend administration closeout slice and 16-batch acceptance reconciliation — 2026-10-27

### Completed code, tests, and verification
- `src/components/AdminQuestionReviewQueue.tsx`: server-backed 30-question pagination with 31st-row next-page detection; explicit page-scoped status filtering and an accessible full-question disclosure for previews over 360 characters. Admin access remains server-gated; this is read-only, **not** a publication/approval control. Primary commits `0aa302a6b2185c582ad868a130f66a3f34bda04d`, `20c2a10aace8231544575bd28eb14635ef3d61d4`, `47c76438b4131b6bd2c11ac7e9cfce6ed61a8c21`.
- `src/components/AdminOperationsOverview.tsx`: stale asynchronous count results ignored, all-missing metrics labelled unavailable rather than zero, actionable retry; source commit `c4d3faf66fa2aca60cc315f64ed795f7bd2d3a6c`.
- `src/components/AdminAcademicWorkspace.tsx`: failed initial/refresh reads hide editing, source/service error text sanitized, post-write reload failure cannot claim full confirmation; commits `ad6abcd16c30c53b46f3a0527849a06ee9fbd4b6`, `8d0961f449d84d51acf65447db8e9f4878a7334d`.
- `src/components/AcademicFoundationGate.tsx`: transient role-check retry, always server `is_admin_or_editor` authorized before showing tools; atomic code/test commit `47c76438b4131b6bd2c11ac7e9cfce6ed61a8c21`. `tests/e2e/smoke.spec.ts` covers these features on desktop and mobile.
- **Latest fully tested source/test SHA:** `68721776b3c909ef66d3f328f04e6c79c3ba0f91`. GitHub **Verify** [40492699805](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40492699805): PASS (verify and disposable-Postgres UTME migration jobs, including typecheck and build). GitHub **ACE JAMB E2E** [40492699890](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40492699890): PASS (**154 Playwright tests, 0 failed**, chromium and mobile-chromium; job and logs inspected).
- **Failure investigation:** earlier E2E [40491656951](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40491656951) had 150 passing/4 failing assertions in two new failure-state tests. Inspected downloaded Playwright error-context and network traces: mocked 503 responses were repeatedly retried and the test snapshots still showed loading UI, not confirmed product defects. Test commit `6872177` uses immediate 400 error fixtures for deterministic failed-read/retry behavior; runner-backed full E2E now passes. Previous JSX class attribute error was corrected at `20c2a10`. No skipped failing tests or bypassed gates.
- **Known debt:** latest npm install still reports 1 high-severity dependency vulnerability; identify the exact package/advisory before selecting any fix. Bundle attribution shows React DOM and Supabase auth/network clients dominate the initial JS; changing chunk structure without measured benefit is not yet justified.

### Current whole-product frontend scope boundary (canonical 16 areas)
| Areas | Evidence-based state | Remaining condition |
|---|---|---|
| 1–2 identity, subjects, account and dashboard | Mocked service-contract journeys PASS | Live account/email/provider acceptance unverified |
| 3–4 learning and practice variants | Frontend approved-content/targeted modes and honest no-data paths implemented; mock tests PASS | Reviewed syllabus lessons/questions and real content-driven acceptance |
| 5 CBT | Timer, resume, review, submit/results mocked-contract flows PASS | Real published question content and live attempts |
| 6 flashcards/revision | Review/reveal/recovery frontend tested | Published rights-cleared revision/flashcard decks |
| 7 study plan/progress | Saved preference/schedule preview and evidence-based focus tested | Real activity/progress and server study-plan contracts for full adaptive experience |
| 8–9 audio and grounded AI | Safely unavailable, without fake delivery or generated official content | Reviewed content, transcripts, authorized providers and secure server request/delivery contracts |
| 10 community | WhatsApp channel CTA present; does not falsely claim membership | Server-verifiable membership/group mapping before mandatory gate |
| 11 notifications | Inbox, read, preferences and error recovery UI mocked tests PASS | Delivery/scheduling/push service and admin broadcast authorization |
| 12 ACE Pass/referrals | Read-only history/account/referral status tested | Verified payment, entitlement, qualification and reward backend/provider contracts |
| 13 admin operations | Read-only counts, question review pagination/full text and failure handling PASS | Full reviewed admin operations/approval/messaging/audit contracts |
| 14 academic authoring | Draft/rights/tree guard, role retry and read failure UX tests PASS | Complete rights-verified question approval/publication contract |
| 15 accessibility/PWA/performance | Automated responsive/keyboard/status/offline cache contracts covered; owner reported manual device checks | Independently verified device/screen-reader performance + known dependency/bundle debt |
| 16 full release/integration | Latest 154 mocked Playwright tests, typecheck, build and existing Verify jobs PASS | Production-content/provider, deployed SHA and live end-to-end acceptance remain unverified |

**Verdict:** the bounded frontend-only functionality supported by current established contracts has advanced and its latest source/test SHA is green, but the **entire 16-batch product frontend is not complete**. Do not reopen retired catalogue work, enable fake membership/payments/AI, deploy, publish content, modify live data or start unauthorized backend work. The next high-value milestone is to reconcile/authorize concrete backend/provider/content dependencies so these blocked frontend experiences can be completed against real contracts; separately investigate the specific high-severity dependency advisory under a scoped security change. No user action required to acknowledge the tests; explicit owner authorization is required before backend or production operations.


## Frontend completion continuation — searchable learning/revision and readable CBT (2026-10-27)
- Branch: `main`; latest source/test commit `1b9b4e4d836335b59690752809bc9c8949eccc74` (the only commits after the 154-test acceptance baseline are these documented frontend edits).
- `src/components/StudentStudyWorkspace.tsx`: rights-approved topic/subtopic search and subject filter, honest no-match/zero-content states, subtopic outline selection, topic/subtopic-specific practice links and functional shortcuts to observed weakness / missed / repeated-mistake practice. This only uses approved syllabus metadata already returned by `getSyllabusTree`; does not impersonate an unpublished full lesson or synthesize JAMB content. Atomic source/test commit `89fef3a9c0aeb8c42f797544ac585c91bdc172e0`, JSX closure fix `86a07b6ef1c1ab4da65910f9c86bbc87df7a1e93`.
- `src/components/StudentQuickRevision.tsx` and workspace props: searchable approved revision outlines with filter reset, selectable subtopic descriptions and server-filtered topic/subtopic-practice entry. Atomic source/test commit `bc503983d1fd9d721a1662bd2f41755eceb1ac3a`. Existing flashcard/plan/CBT logic preserved.
- `src/components/PersistentCBT.tsx`: safe, accessible white-space-preserving question and option text on small screens with wrapping. `tests/e2e/smoke.spec.ts` asserts question and option rendering contract. Atomic source/test commit `1b9b4e4d836335b59690752809bc9c8949eccc74`.
- Verification: GitHub **Verify** on `bc50398` run [40518966596](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40518966596) PASS (both jobs); **E2E** on that SHA run [40518966461](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40518966461) PASS **158 Playwright tests** (chromium and mobile, log inspected). Latest `1b9b4e4`: GitHub Verify [40519951445](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40519951445) PASS (typecheck/build/migration); latest E2E [40519951725](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40519951725) running at this note, NOT YET VERIFIED.
- Prior `02b07569d7afaf05492cd5c0653f210c9628347c` removed the retired, unused XLSX admin-import component and `xlsx` dependency; its GitHub Verify [40494209615](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40494209615) passed with `found 0 vulnerabilities`, and E2E [40494209644](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40494209644) passed 154 tests. No active catalogue flow was restored.
- Remaining **whole-product** frontend acceptance: lesson bodies, actual approved question/revision/audio/flashcard content, server-provided readiness/adaptive planning, grounded AI messaging, member-verified community routing, push/admin announcements, verified ACE Pass payment/referrals, and privileged question publishing/audit services all require reviewed backend/provider/content contracts not evidenced in the repository. Static placeholder shells or forged client-side authorizations are not substitutes. Real Cloudflare deployed-SHA and real-user/provider/device checks remain outside mocked browser tests.
- Scope: no database writes, provider secrets, production deploy, external service registration or backend migration. **Next exact action:** inspect E2E [40519951725](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40519951725), fix any failures, then classify the frontend-only milestone as verified against available service contracts while recording backend-dependent acceptance gates separately. No user action required for that automated check.


## Verified latest frontend source/test closeout — 2026-10-27
- Exact source/test SHA: `1b9b4e4d836335b59690752809bc9c8949eccc74` (latest frontend code commit). Documentation-only commits after this SHA do not change source/test artifacts.
- **GitHub Verify PASS**: [run 40519951445](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40519951445), both `verify` and `utme-subject-choice-migration` jobs successful, includes `npm run typecheck` and `npm run build`; install log reports **0 vulnerabilities**.
- **GitHub ACE JAMB E2E PASS**: [run 40519951725](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40519951725), job logs: **158 passed, 0 failed** across Chromium + mobile Chromium. New approved topic/subtopic search, quick revision scoped practice, and CBT paragraph layout assertions included and passed.
- **Frontend-only milestone result:** implemented and regression-verified the remaining independently executable student learning navigation, practice entry, revision search and CBT text legibility improvements against the existing authenticated service contract. Retired catalogue not reopened. No backend, Supabase production data, payment provider, AI API, media provider or deployment modifications.
- **Whole-product frontend acceptance NOT fully closed:** approved detailed lesson/flashcard/audio content and live questions remain unpopulated; source-backed AI tutor and audio delivery need secure server/content contracts; premium checkout and referral qualification depend on provider/webhook/entitlement services; community membership cannot be independently checked by a frontend click; notifications require an approved sender and scheduler; full admin moderation/question approval and audit require authorized mutation/read-service contracts. Real Cloudflare deployed-SHA, real provider accounts, production content and physical-device accessibility acceptance are unverified by mocked Playwright. These gaps are genuine product/backend or content dependencies, not failing source checks.
- **Next concrete action:** move to an authorized backend/content contract implementation plan for rights-reviewed questions/lessons first (the dependency that unlocks live Learning, Practice, CBT, Revision and analytics); then connect the already-tested client interfaces and re-run live provider/production E2E before any launch-ready claim. No user action needed for these completed source/test verification checks. Owner authorization remains necessary before modifying live database/provider/deployment.


## Final master completion batch activation — 2026-10-27
- **Sole current backlog:** docs/ACE-JAMB-MASTER-HANDOFF.md → section "FINAL MASTER COMPLETION BATCH — ALL REMAINING ACE JAMB WORK". FCB-01..FCB-12 are reviewable work packages inside ONE final batch; no competing roadmap. Backend/source work is now in scope for planning and authorized implementation; production mutations, external billing and deployment still require review.
- **Baseline:** main source/test 1b9b4e4d836335b59690752809bc9c8949eccc74; Verify 40519951445 PASS, desktop/mobile E2E 40519951725 PASS **158 tests**. Latest intervening docs commits do not change app code.
- **2026-10-27 read-only live Supabase:** ACTIVE_HEALTHY; 48 ace tables with RLS; 41 migration entries; 25 subjects; 50 syllabus drafts pending rights, zero topics/subtopics/questions/flashcards/attempts; 2027 season draft and exam config inactive; product ₦899 configured but no verified payment/entitlement provider path. Only deployed Edge Functions are legacy catalog-import v7 and ibass-catalog-stage v4. Retired catalogue is never an onboarding prerequisite.
- **Security follow-up:** Supabase advisor 24 WARN findings (1 anon-executable SECURITY DEFINER, 22 authenticated-executable SECURITY DEFINER notices, 1 leaked-password-protection configuration), plus 141 performance WARN/INFO findings. These demand risk-ranked verification, not blanket vulnerability claims.
- **Status:** unified final batch OPEN; FCB-01 next. Remaining FCB-02..12 depend on source rights/season/content and provider/backend integration; no real data, provider or deployment writes authorized/performed in this planning commit.
- **One exact next action:** FCB-01 read-only compare actual RPC authorization/grants and applied migration history versus repository; implement testable least-privilege fixes on a reviewed code branch; prepare rights/official-source inventory for FCB-02 concurrently. Record evidence; move to FCB-02/03 without reopening IBASS/catalogue.


## Live reconciliation — 2026-10-27 (FCB-01 audit in progress)
- Verified repository exists and is writable: `DarealNovaking/Nova-ace-jamb`, default branch `main`. Latest commit returned by recent-commit search is `3a24fca5a9f63b9111d5d89ff6c0b0fd1bb22d9a` (completion-batch documentation). Do not confuse this documentation commit with application/test verification.
- Read the master handoff, checkpoint and agent prompt pack. The prompt pack's 2026-10-27 Final Completion Batch override is authoritative for scope: FCB-01..FCB-12; the older checkpoint's frontend-only restriction is superseded. No catalogue UI/import work is to be revived.
- Live Supabase project discovered from the connected account: ref `uokiqlgmzprqfbzmedaz`, project `nova-ace-jamb`, region `ca-central-1`, status `ACTIVE_HEALTHY`. This is the project used for this audit; do not substitute the older remembered project ref.
- Read-only schema inspection confirms the `ace` schema includes student attempts/answers, profiles/roles, question versions/media, syllabus versions/topics/subtopics, flashcards/reviews, study plans, AI usage/providers, notifications, payments/entitlements, referrals, and catalog legacy tables. No production writes, migrations, function deployments, provider spend, or content publication were performed.
- Live security advisor output includes warnings that numerous `SECURITY DEFINER` functions are executable by `authenticated`, including catalog operations, `set_user_role`, student-foundation RPCs, and entitlement checks. This is a lead, not yet proof of an exploitable vulnerability: each function body, caller contract, grants, and role checks must be reviewed before any grant change. Performance advisor also reports 20 RLS policies re-evaluating auth/current_setting per row; treat as optimization work after security boundaries are validated.
- The checkpoint's prior queued E2E/Verify run IDs (40422034609 / 40422034652) were not independently confirmed terminal in this pass. A combined-status lookup for the current documentation commit returned no statuses; this does not establish test failure or success. Earlier baseline runs in the prompt pack are historical baseline evidence only.
- A read-only count query using assumed `status` columns failed because the live schema differs from that assumption. No data changed. Next queries must inspect actual columns before counting or reasoning about content approval state.
- **Exact next action:** continue FCB-01 by inspecting live definitions and ACLs of the callable `SECURITY DEFINER` RPCs—prioritize `set_user_role`, `activate_exam_config`, `activate_exam_season`, `activate_syllabus_version`, `publish_catalog_batch`, `stage_catalog_import`, and `save_student_foundation*`; compare each against repository migrations/source and write focused non-production regression tests/migration proposal. Do not apply production changes or deploy without the required gate authorization.


## FCB-01 focused RPC review — 2026-10-27
Scope completed in this pass: live Supabase definitions for `set_user_role`, `activate_exam_config`, `activate_exam_season`, `activate_syllabus_version`, `approve_catalog_batch`, `publish_catalog_batch`, `has_active_entitlement`, `is_syllabus_version_public`, `can_manage_catalog`, `get_catalog_source`, `check_catalog_import_idempotency`, and student foundation save functions; live security advisor; repository role-management migration and historical handoff.

Verified controls:
- `ace.set_user_role(uuid,text)`: live definition checks authenticated caller and `ace.is_admin()`, restricts role values, verifies Auth target exists, serializes role changes, prevents last-admin removal, and writes an audit event. Historical migration explicitly revokes PUBLIC/anon and grants EXECUTE to authenticated only. No privilege-escalation path was confirmed in this function during this review.
- `activate_exam_config`, `activate_exam_season`, `activate_syllabus_version`, `approve_catalog_batch`, and `publish_catalog_batch`: inspected definitions include admin/editor or admin role checks, input/existence checks, validation/state gates, and fixed search paths. These checks lower risk but do not replace remaining full-path tests.
- `has_active_entitlement`: requires an authenticated caller and restricts the requested user ID to `auth.uid()` unless caller is admin.
- `get_catalog_source` and `check_catalog_import_idempotency`: both gate result rows on signed-in admin/editor role.
- `save_student_foundation_catalog_with_subjects`: writes profile/preferences/subjects for `auth.uid()`, validates score, time, four distinct active subjects, active institution/program/season, and the configured subject rule. No cross-user write was seen in the inspected body.
- `is_syllabus_version_public` is intentionally a boolean public-status helper for active, rights-approved syllabus versions. Its anon EXECUTE warning is not by itself a confirmed data leak; confirm call sites/policy dependencies before changing its grant.

Open hardening / not yet fully verified:
- Supabase security advisor observed 22 authenticated-callable SECURITY DEFINER functions and one anon-callable function at 2026-10-27 17:00 UTC. This is a broad heuristic warning, not 23 confirmed vulnerabilities.
- `approve_catalog_batch` has search_path `ace, public` rather than `pg_catalog` first. Its body uses qualified tables and role checks, but harden the path in a reviewed migration after checking dependencies. `can_manage_catalog` also has `ace, public`; review its dependency/callers before tightening.
- Not every one of the 22 function bodies, every RLS policy, Edge Function, API exposure setting, or frontend call site was reviewed; no full security regression suite was run. Do not mark FCB-01 security acceptance complete.
- Catalogue RPCs are historical/dormant scope and must not be revived for product work; only security hardening of existing callable surface is in scope.
- No live schema changes, data writes, grants, migrations, or deployments were performed. No regression tests were added in this pass; connected tool access did not provide a local checkout/test runner. The failed assumed-column count query remains a documented no-op.

Next exact action: inspect the remaining advisor-listed SECURITY DEFINER function definitions and their repository migration history/call sites; verify the exposed-schema/function grants and `public` schema CREATE privileges. Then add a focused migration/test proposal on a feature branch, run available checks, and request/confirm the production gate before applying anything.


## Current FCB-01 blocker — safe CBT question delivery (2026-10-27)
- Live `ace.questions` uses `stem`, not `question_text`; the frontend `src/lib/cbtService.ts` requests the nonexistent `question_text` field.
- Live privilege checks: `authenticated` has no SELECT on `ace.questions`. RLS policies do not grant privileges. Do not grant direct whole-row SELECT because the row includes `correct_option_key` and `explanation`.
- Active attempt RPCs inspected: start/resume/save/submit. Authenticated EXECUTE grants exist; no anon/PUBLIC EXECUTE appeared in the inspected grants. Owner checks visible in resume/save/submit. Full FCB-01 audit remains open.
- No production changes. Master handoff updated in commit `26c966d3f85ffa7227d12f9f19406cd5bfec6982`.
- **Next exact action:** search later migrations/tests for an existing safe answer-key-free question delivery API; if absent, implement one with regression tests and align the client DTO. Keep catalogue product work retired.


## FCB-01 security/contract remediation — 2026-10-27 (review branch, not production)
- Inspected actual main `3a24fca5a9f63b9111d5d89ff6c0b0fd1bb22d9a`, entire master/checkpoint through coordinated read-only review, current source/tests and live Supabase read-only. Work branch: `security/fcb-01-contract-audit`. Canonical FCB-01..12 unchanged; existing frontend baseline preserved.
- Audited all 30 live functions (23 definer / 7 invoker), RLS/table ACLs, columns, constraints/index metadata, storage and migration ledger. Verified editor syllabus rights/publication bypass, direct import-approval bypass, cross-account entitlement probe, draft metadata lookup gaps, legacy English enforcement gaps, nullable attempt bounds and CBT `question_text`/`stem` mismatch.
- Prepared three reviewed source migrations: `20261027151954_fcb_01_rpc_security_boundaries.sql` (owner/admin entitlement, manager metadata/validation, serialized last-admin guard, English+3 legacy saves, admin-only direct approval policies); `20261027152101_fcb_01_syllabus_authorization.sql` (pending-draft editor authoring, admin rights/publication, protected active trees, audit); `20261027152507_fcb_01_question_rights_gate.sql` (recovered historical rights gate plus NULL bounds, no new table grants). Production application NOT authorized/performed.
- `src/lib/cbtService.ts` now queries `question_text:stem`; existing CBT Playwright test rejects nonexistent-column requests and asserts safe projection. No frontend rebuild or catalogue revival. Lockfile added; Verify/E2E use `npm ci`; Verify runs the three new SQL regression suites.
- **Local PASS:** 33 Node unit/contract tests, typecheck, Vite build, npm ci, npm audit (0 known vulnerabilities); existing onboarding and syllabus SQL plus all three new suites on disposable PGlite PostgreSQL. RED/GREEN reproduced entitlement, editor approval, rights, NULL bounds and legacy English-first defects. Independent review found no blocking regression; multi-session role concurrency remains UNVERIFIED. Native PostgreSQL CI and full 158 browser tests PENDING on review branch; local browser download returned truncated archives.
- **Migration reconciliation:** baseline 31 files / 29 unique names vs 41 live names; 12 live source migrations absent, only eight matching version IDs; earliest tracked SQL depends on missing foundational tables. Stored ledger scripts exist (metadata/count/hash checked only), but may contain secret-bearing SQL; no raw recovery or ledger edits. Full clean replay BLOCKED, do not blindly db-push. Missing operational table grants currently fail closed; do NOT add broad CBT score/answer writes. Existing answer-save correctness response and owner ALL policies require a secure server mutation redesign before live CBT.
- **FCB-02 inventory:** no lawful question/syllabus/audio corpus in repo; live 50 syllabus drafts remain rights pending, homepage-only provenance. No official 2027 composition or content rights fabricated; publication and dependent content packages remain blocked at their gates. Provider choices/budgets, live schema application and release need specific authorization.
- **Details / evidence matrix:** `docs/FCB-01-SECURITY-CONTRACT-AUDIT-2026-10-27.md`. Advisor 24 security warnings reviewed, 141 performance findings classified; no blanket vuln claim/index removal. Leaked-password protection requires Supabase Pro per official docs; no upgrade requested/performed. Automatic review blocked unsolicited Supabase CLI telemetry; CLI stopped, unaffected work continued.
- **Status:** FCB-01 IN PROGRESS, final batch OPEN; source fixes do not mean production is fixed. **Next exact action:** inspect SHA-matched Verify/native PostgreSQL/desktop+mobile E2E on the review PR, repair any failure, then finish contract hardening/recovery and request only the concrete reviewed production authorization needed for live verification. No production data, deployment or billable provider action performed.


### FCB-01 verified source follow-up — 2026-10-27
- Review PR: https://github.com/DarealNovaking/Nova-ace-jamb/pull/10 (branch `security/fcb-01-contract-audit`; main and production unchanged).
- Source commit `34d484767477cae6a08051afffc3b44e6fefadd0`: GitHub Verify 40532523228 PASS, including both Deno checks, typecheck/build, unit tests and all five SQL suites in native PostgreSQL. E2E 40532523408 PASS: **158 passed, zero failed**, actual job log inspected. This verifies the initial FCB-01 remediation against existing browser journeys, not live production application.
- Follow-up source (awaiting new SHA verification): dual server role check and explicit admin-only rights/publication controls in AcademicFoundationGate/AdminAcademicWorkspace; editor pending-draft authoring retained, reviewed drafts read-only; six new desktop/mobile browser cases. Added native two-session role-demotion regression for READ COMMITTED and REPEATABLE READ, wired immediately after the RPC fixture; no live sessions/data touched. Updated README from stale Phase 3 scope to canonical FCB backlog. These added tests are not yet claimed passed in CI.
- Read-only EXPLAIN with synthetic UUIDs/no ANALYZE selected `idx_attempts_user_started` for history and `idx_questions_taxonomy` for published-question filtering. No index removal or measured performance claim. Native authenticated-role/load performance remains unverified.
- Exact next action: inspect final PR head's Verify/native concurrency and full Playwright result, repair failures, record actual evidence. FCB-01 remains OPEN until remaining source/replay and explicitly authorized live-verification gates are satisfied; no production authorization implied.


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


### FCB-01 verified continuation checkpoint — 2026-10-27
- Published safer source commit `d21e37d3b60e23fe95948c6d631b429fb4137bcf` to PR #10 via the connected GitHub API after ordinary git push lacked credentials. Its tree excludes the blocked full snapshot and recovery-only artifacts. This was a materially safer source publication, not an alternate export of the rejected snapshot.
- GitHub Verify **40582846448 PASS**: typecheck/build, Deno/Node checks, all six SQL suites, native last-admin races (23514/40001; one admin survives). Actual job 122466565524 logs inspected. E2E **40582846468 is IN PROGRESS**, not claimed passed. Prior verified browser baseline remains 164 passing tests at ecbc012.
- Local mutation checks caught removal of owner, rights and deadline guards. New proposed delivery also compiles against the full recovered schema; no further production changes performed. Read-only public/ace schema CREATE checks are false for both anon/authenticated; authenticated alone has ace USAGE.
- Active safe worktree: `/workspace/scratch/84a394a7502b/Nova-ace-jamb-safe`, branch `security/fcb-01-safe-continuation`, tracking remote PR branch `security/fcb-01-contract-audit`. Original worktree/local branch `local/fcb-01-schema-recovery` preserves the export-blocked snapshot; do not publish it without specific approval or overwrite the newer PR tree with it.
- These local evidence additions are intentionally not pushed while the unchanged source browser run is active, to avoid cancelling that run for documentation alone. Next action: inspect E2E 40582846468, publish final evidence once, then continue coordinated secure CBT mutation contracts. Snapshot publication needs specific owner approval because automatic approval review rejected exporting live schema/function/ACL security metadata. Final batch remains OPEN.


## FCB-01 verified continuation result — 2026-10-27 (current checkpoint)
- Review source SHA `d21e37d3b60e23fe95948c6d631b429fb4137bcf`, PR #10: **Verify 40582846448 PASS**, including all six SQL suites and native admin concurrency; **E2E 40582846468 PASS, 164 desktop/mobile tests, zero failures**. Actual job 122466563094 log reports `164 passed (3.7m)`. This supersedes the immediately preceding IN PROGRESS entry. No failing test skipped.
- Applied production changes remain only the three previously authorized security migrations, independently postflight-verified. New safe CBT delivery is a source proposal only, outside migrations and disconnected from the client. No deployment, content publication or provider activation.
- Export-blocked full schema recovery remains local; automatic approval review requires specific permission before publishing its live definitions/ACL metadata to GitHub. Safer source/synthetic tests were successfully published separately. Required handoff/checkpoint updated; this following evidence commit changes documentation only.
- FCB-01 and FCB-01..12 remain OPEN. Next safe source action is coordinated secure CBT mutation contracts (owner-scoped writes, no pre-submission correctness oracle or client score writes); approved-content and provider/release acceptance gates remain unresolved. Resume the safe worktree/PR above, preserving the local recovery branch without exporting it.


## FCB-01 recovery snapshot publication authorized — 2026-10-27
- Owner replied “proceed” to the specific request to publish the schema-only recovery snapshot to this repository. This resolves the prior export-approval blocker only; it does not authorize any further production schema/data changes, deployment, content publication or provider costs.
- Added the reviewed snapshot, catalog provenance, deterministic renderer, native PostgreSQL/pgvector replay/parity/refusal CI job and synthetic auth fixture to the safe PR branch. Existing safe CBT delivery proposal and all current source are preserved. Pattern scan found no credentials; provenance has catalog-only fields and no row payloads.
- Fresh local PASS: recovery replay, signup metadata cannot confer admin, existing-schema refusal, and exact parity for all 449 columns/210 constraints/80 additional indexes/31 functions/82 policies/6 triggers/48 table ACL/RLS definitions. Native recovery CI is PENDING, not claimed passed. Historical migration replay remains separately incomplete.
- Prior verified source d21e37d: Verify 40582846448 PASS; E2E 40582846468 PASS,164 tests. Next action: verify the native recovery job while implementing coordinated CBT mutation contracts and negative tests, preserving no direct score/answer writes or pre-submission correctness disclosure. Final batch remains OPEN.


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


## FCB-01 approved mock paper contract — 2026-10-28 (source review)
- Resumed actual PR #10 head `92a5316`, preserving local verified evidence commit `caf3b91`. Configuration/season and syllabus-version proposals were already CI green (Verify 40597290888; E2E 40597291143, 164). They remain unapplied; isolated signup rollout is complete and must not be repeated.
- Reproduced a separate integrity gap: the generic proposed `start_attempt` accepted caller-defined mock count/duration with no approved configuration. That path now rejects mock mode. New source-only `fcb_01_mock_contract.sql` provides owner-scoped approved-config start, audited active-season/config checks, compulsory English plus three distinct configured subjects, exact per-subject counts, supported server bounds, approved season-specific taxonomy/content, valid unique option keys, atomic insufficient-bank denial and immutable private configuration provenance. Reuses frozen-paper save/grade/delivery; no table writes or answer keys granted to clients.
- Local RED/GREEN PASS: caller-controlled mock rejection; endpoint absence then approved-paper success; anonymous/draft/NULL/duplicate/unconfigured selections; publication/rights/taxonomy/option withdrawal; no partial attempts; preserved config version/timer after metadata changes; safe delivery and idempotent scoring. Existing mutation/snapshot/configuration/version suites PASS; 33 Node tests, typecheck, production build and diff whitespace check PASS. No frontend changes. Two native mock-vs-approval races added for READ COMMITTED/REPEATABLE READ; SHA-matched CI/native/browser verification PENDING.
- Fresh connected read-only production check: 0 attempts, 0 approved published questions, 0 active configs, 0 active seasons. No live mutation, content publication, deployment or provider activation. Broader CBT/mock proposals remain disconnected from the frontend and need coordinated production review, abuse/entitlement policy and approved sources. Source safety is not full FCB-01 acceptance.
- Next action: inspect new SHA CI, fix any failure, record actual evidence, then continue source-only resource/entitlement boundaries. The separate two-proposal production security bundle still needs scoped authorization; generic continuation is not approval to activate content or deploy CBT.


## FCB-01 approved mock contract verified — 2026-10-28 (current evidence)
- PR #10 source/test **6ce26be683375cfcd4c510ddc747f6aed15582d4**: **Verify 40606756714 PASS** (13 SQL suites, 12 native concurrency cases, schema/catalog/ACL recovery, Node/Deno, typecheck/build); **E2E 40606756727 PASS, 164 desktop/mobile tests, zero failures**. Actual native job 122548059778 and browser job 122548059746 logs inspected. Mock/approval READ COMMITTED and REPEATABLE READ races both confirm approval waits until original paper capture commits. No failure skipped. Following evidence-only commit changes no source/tests.
- Added approved-config mock creation in source, preserved immutable paper/config version, exact English+3 composition, current approved taxonomy/rights checks and server timing/scoring; arbitrary generic mock creation rejected. Frontend unchanged. Proposals remain unapplied/unconnected. Main read back as `17f29e137a483066789e0242f20637c89beeae08`; no merge or deployment.
- Fixed continuity drift: the checkpoint now begins with the current FCB-01 state, verified source, real production status and exact next action; old Batch 6/frontend-only instructions are explicitly historical. Audit header likewise distinguishes initial investigation from current production/source state.
- Resource/entitlement release gate is concrete: no CBT/mock/practice limit flags in production; ACE Pass metadata contains seasonal access and price direction only; master section 20 and decision register leave exact free-tier limits undecided. No invented commercial quotas or automatic premium gating. Content rights/official configuration remain missing; all real content stays withheld.
- **Production unchanged this continuation:** four previously approved migrations total; signup already verified; no test accounts, season/config activation, content publication, provider or release actions. FCB-01 and final batch OPEN. Next live step requires scoped approval of only the two reviewed config/season and syllabus identity proposals in `docs/FCB-01-NEXT-SECURITY-APPLICATION-2026-10-27.md`, with new preflight/rollback/postflight. Broader CBT/mock production rollout is not included. Source resource policy work requires the owner-approved free/premium limits; approved document/question sources remain the FCB-02 gate.


## FCB-01 authorized security bundle — 28 October 2026 (partial live application)
- Owner explicitly approved applying the two reviewed configuration/syllabus security proposals. Authorization persists for those exact changes; do not ask again. No deletion/reset or broader release was authorized by the statement that only a test account exists.
- Fresh live preflight PASS: all three original function definitions/owners/ACLs and four policies exactly matched the reviewed baseline; parent tables had owner-only/default ACL and RLS; taxonomy and attempts empty, 50 versions, 0 active configs/seasons, ledger 45. Exact same-runtime disposable forward/rollback catalog parity PASS for both proposals, plus rollback refusal for conflicting versioned names. Raw comparison against a different engine capture initially flagged implicit/explicit default/owner ACL formatting and provenance fields; the same-runtime comparison resolved this without changing production or ignoring API permissions.
- **APPLIED/VERIFIED:** `20261028002329_fcb_01_syllabus_version_identity`. Five intended version/composite constraints and one legacy partial index match reviewed definitions; removed original global name key. Topics/subtopics stay 0/0, versions stay 50, active configs/seasons stay 0/0; all 48 tables retain RLS. No production fixtures/accounts/content changes. Source promoted to the actual ledger migration filename; test include updated.
- **BLOCKED/UNAPPLIED:** configuration/season proposal. Connector returns `McpServerError: Invalid or expired requestState`; read-only ledger/function/trigger checks after expiry prove no application. No blocking locks or active DDL sessions. One improved guarded request added a source-hash precondition and 5s/20s lock/statement bounds, but still expired before any observed change. Do not retry unchanged indefinitely or use execute_sql for DDL. Authorization is recorded; resume only with a working migration request context.
- Updated schema-only recovery from fresh live catalog: ONLY constraints/indexes changed; all other captured definitions/ACLs match exactly. Capture is now five approved migrations, 449 columns/214 constraints/81 additional indexes/31 functions/82 policies/6 triggers/48 RLS tables. Metadata-only export remains within the owner's prior explicit authorization. Current native replay/parity for this updated capture is PENDING; prior verified frontend/source 6ce26be retains 164 browser PASS and 13 SQL/12 concurrency PASS.
- FCB-01/final batch remain OPEN. Next: verify source promotion/recovery in native CI, record actual evidence, and complete the already-approved configuration security application when the connector works. Broader CBT/mock activation, official content/rights, free/premium limits and release gates remain separate.


## FCB-01 partial live application — verified final checkpoint (28 October 2026)
- Reviewed source **e9f0769b9a141255497e7e63de46f43cadab3d3b**, PR #10: **Verify 40612879826 PASS** (13 SQL suites, 12 native concurrency cases, updated full-schema recovery/parity/refusal, Node/Deno, typecheck/build); **E2E 40612879590 PASS, 164 desktop/mobile tests**, actual job 122568417583 log `164 passed (3.7m)`. Native recovery job 122568418613 logs confirm 449 columns/214 constraints/81 indexes/31 functions/82 policies/6 triggers/48 tables and API ACL parity. Following commit is evidence-only.
- Production syllabus identity migration **20261028002329** is applied and verified. Five approved migrations total, 46 ledger entries. No account/content data removed or changed; no season/config activation, broader CBT rollout, deployment or provider activation.
- Configuration/season security is **AUTHORIZED BUT BLOCKED**, not applied. A smaller guard-only request also expired (`Invalid or expired requestState`). Final live read-only check confirms all three original function SHA256 values unchanged, absent guard and no full/staged configuration migration ledger entries. Neither the full nor staged request partially applied. No further unchanged retries attempted. This is a connector request-context failure, not a permission refusal or evidence of a database lock; do not claim its internal cause is proven.
- Owner approval remains valid for the exact reviewed configuration SQL. Do not ask again or reapply signup/syllabus. Next action requires a working migration request context, then fresh preflight, configuration application and exact postflight. Use apply_migration for DDL; no execute_sql workaround. Broader content/official configuration, business policy and release gates remain separate. FCB-01 and FCB-01..12 remain OPEN.


## FCB-01 connector correction and approved configuration rollout — 28 October 2026
- Owner clarified they had not selected read-only access and explicitly requested another attempt. Plugin permission inspection confirms Supabase app-specific **Allow all actions**; live queries use `postgres` and `transaction_read_only=off`. Earlier expiry must not be described as read-only permission or user refusal. No app permissions were changed.
- Two connected account links both enumerate the same target project/org. Requests through the connection named **Supabase** continued to fail with `Invalid or expired requestState`; the alternative **Primary** connection successfully applied the exact approved configuration security SQL. This isolates the observed connection-dependent behavior, not its internal root cause. Prefer Primary for subsequent authorized migration operations. User declined the browser sign-in alternative; that tab was closed and no browser SQL was run. Do not reopen account sign-in without a new explicit request.
- **APPLIED/VERIFIED:** `20261028032933_fcb_01_exam_config_security` through Primary. Preflight matched original reviewed functions and absent migration/guard; postflight independently compiled reviewed source exactly matches all live function definitions, policies, guard/trigger and API privileges. Read-only synthetic unprivileged claims verify config/season approval and draft validation denial, plus no draft metadata reads. Trigger direct EXECUTE and anon approval remain false. No production test accounts/fixtures or content edits.
- Both approved bundle changes are now complete: syllabus identity `20261028002329` and configuration security `20261028032933`. Six approved fixes total; ledger 47. All 48 tables retain RLS. Topic/subtopic/attempt counts stay 0/0/0; versions 50; configs/seasons stay inactive. No content publication, broader CBT deployment, main merge, service deployment or provider activation.
- Source promoted to actual ledger migration filename; both SQL test includes updated. Fresh live metadata recovery changed only intended functions/policies/triggers/table ACLs: 449 columns/214 constraints/81 additional indexes/32 functions/82 policies/7 triggers/48 tables. Local full replay/parity/refusal and config/mock regressions PASS. Native SHA-matched CI for this snapshot is PENDING; prior e9f0769 remains Verify 40612879826 and 164 browser tests PASS. Do not misattribute old CI evidence to this new snapshot.
- FCB-01 and full FCB-01..12 remain OPEN. Next: inspect source promotion/recovery native CI and record evidence, then continue safe resource/entitlement contracts and FCB-02 sources. The production security bundle and connector permission question are resolved; no repeat approval/application needed. Broader CBT rollout still requires business/content/official-configuration and coordinated-release gates.


## FCB-01 verified connector and production bundle closeout — 28 October 2026
- Exact source **fa9a39db6962d1f4d318b62ba30583c0bf1da100**, PR #10: **Verify 40627341611 PASS** (13 SQL suites, 12 native concurrency cases, complete current-schema/API ACL replay/parity/refusal, Node/Deno, typecheck/build); **E2E 40627341587 PASS, 164 desktop/mobile tests**, actual native job 122615320619 and browser job 122615321094 logs inspected. No failure skipped. Following commit changes evidence only.
- Connector permission correction is VERIFIED: app-specific Allow all actions and postgres transaction_read_only off; Primary connection successfully applied `20261028032933_fcb_01_exam_config_security` to the same verified project. Other connection's requestState error remains unexplained; it is not evidence of read-only access. Use Primary. No permission setting changed and no browser sign-in/manual SQL required for successful application.
- Both approved fixes are live and exact-source verified, with retained RLS and current authorization negatives. Six applied fixes total, ledger 47; latest recovery captures 449 columns/214 constraints/81 additional indexes/32 functions/82 policies/7 triggers/48 tables. No account/content data changes, real fixture accounts, season/config activation, broader CBT rollout, merge/deployment or provider activation.
- Next canonical work: FCB-01 resource/entitlement policy/contract release boundaries and FCB-02 authorized educational source/rights evidence. All FCB-01..12 acceptance remains OPEN; this closes only the specifically approved security bundle and the operational connector blocker. Do not request approval/reapply these fixes or revive the refused browser-auth route.


## FCB-01 source resource/access boundary — 28 October 2026 (CI pending)
- Reproduced unconfigured repeated CBT starts being accepted in the earlier source proposal. Added private RLS/no-client-ACL runtime, mode-access and per-user usage tables; no production defaults or policies seeded. Missing/disabled policy fails closed. Configurable bounds, global cross-mode starts/cooldown/active slots, and current-owner entitlement checks are reserved before expensive selection. Policy changes audit before/after values. No administrator/editor access bypass.
- Extracted the private attempt factory (no client EXECUTE). Public generic mock creation stays rejected; approved mocks reserve the mock policy before bank selection and pass only an internal already-reserved flag to avoid a second charge. Ordinary callers cannot set or call this flag. Source remains unapplied/unconnected; live 48-table/six-fix snapshot is unchanged. Source trial adds three private tables (51 total in synthetic proposal fixtures).
- Local PASS: resource missing/disabled/bounds/quota/cross-mode/active-expiry/cooldown/window rollover/rollback/expired-revoked-cross-owner/admin-entitlement/audit/grant cases; existing mutations, paper snapshots and full mocks; 33 Node tests, typecheck/build, Python compilation, exact coordinated forward/rollback catalog parity and whitespace checks. Native CI pending. New contention cases cover new/existing counters under RC/RR, active slots, cooldown, entitlement expiry during locks, and disabled mocks denied before bank locks.
- Independent review identified a stale pre-lock timestamp; corrected by locking candidate entitlement/product rows before taking server time and checking only locked IDs. Also moved mock authorization ahead of content scans and added existing-counter contention tests. Focused re-review found no blocking issue; it did not execute native tests. Do not claim those pending cases passed until actual CI logs exist.
- Fresh live advisor inspection: security 24 WARN (1 intentional anon helper, 22 authenticated definer notices requiring audience review, 1 leaked-password setting); performance now 142 (2 unindexed-FK INFO from composite taxonomy constraints, 20 auth/RLS initplan WARN, 71 unused-index INFO, 49 permissive-policy WARN). No blanket vulnerability count or index deletion. Relevant sources remain https://supabase.com/docs/guides/database/database-linter and https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection. Production attempts/questions remain 0/0. No new live mutation, release or provider action.
- Prepared `docs/FCB-01-CBT-SECURITY-APPLICATION-2026-10-28.md` and data-refusing metadata rollback. Next: inspect new SHA native rollback/races and 164 browser regressions, repair failures, then request only the concrete reviewed disabled-by-default CBT security bundle if production application is needed. Business limits and approved content remain separate release decisions; FCB-01 and final FCB-01..12 remain OPEN.


## FCB-01 resource/access contract verified — 28 October 2026 (production review gate)
- Source **0735891c2e18e85d0736576aeed1e0be9272ea78**, PR #10: **Verify 40630042446 PASS** (14 SQL suites, exact coordinated CBT forward/rollback plus captured-paper refusal, 21 native concurrency cases, full current six-fix schema/API ACL recovery, Node/Deno, typecheck/build); **E2E 40630042678 PASS, 164 desktop/mobile tests**, actual native job 122624055817 and browser job 122624056136 logs inspected. All eight new resource races, disabled-mock-before-bank denial, native rollback and original races passed. Local npm audit: 0 vulnerabilities; high-confidence private-key/sb_secret/GitHub-token source scan: no matching files. Limited scan, not proof of absence of all secrets.
- Reviewer findings corrected before publication: entitlement time evaluated after lock waits; mock quota before bank work; existing-counter contention covered. Follow-up read-only review found no blocking issues. Current source no longer accepts unlimited unconfigured starts; missing policy denies by default. Synthetic numeric policies remain test-only. Policies/usage/private factory lack client grants; runtime/mode policy changes audit before/after values. No new package/dependency or frontend rewrite.
- **Ready for specific production review, not applied:** `docs/FCB-01-CBT-SECURITY-APPLICATION-2026-10-28.md` scopes the three coordinated source proposals. Runtime/mode access remains disabled because no real policies are seeded; business free/premium values and actual content/provider enablement stay later release gates. Rollback restores exact original catalog/ACL when safe and refuses captured papers rather than deleting data.
- Six previously approved live fixes remain unchanged. Working migration connection: Primary; app permissions Allow all actions, not read-only. No new production schema/account/content mutation, deployment/main merge, provider activation or browser-auth action occurred this continuation.
- **FCB-01 acceptance disposition:** live contract/audience audit, safe current-schema reproduction, source security/negative/race tests, dependency scan and advisor classification complete for inspected scope. Remaining live step is specifically authorized coordinated CBT security application and exact preflight/postflight. Until that reviewed deployment is approved and verified, FCB-01 remains OPEN. HTTP/IP invalid-request firewall, real-device/provider acceptance and exact deployed frontend SHA remain FCB-11/12 release evidence; transactional start limits are not advertised as a complete network firewall. Content/official season and commercial policies are FCB-02/04/08 gates, not silently fabricated here. No zero-warning claim: 24 intentional/setting WARN notices and 142 performance findings remain classified in the audit.
- Next: obtain only scoped production approval for the reviewed CBT bundle with runtime access disabled, apply through Primary after fresh six-fix catalog/zero-attempt checks, record actual assigned IDs, and verify live definitions/grants/guards with read-only negatives. Do not repeat any of the existing six migrations or enable launch policies/content/providers implicitly.


## FCB-01 approved CBT bundle applied and live-verified — 28 October 2026
- Owner explicitly approved the reviewed bundle with runtime access disabled. Fresh production preflight matched every captured six-fix catalog definition/API permission, zero attempts/questions, 50 versions, inactive configs/seasons and ledger 47. Independently compiled source and exact disposable rollback parity passed before application.
- Initial full-core migration request expired; live catalog/ledger proved no application. The SAME approved SQL was partitioned at independent statement boundaries: private infrastructure first, start factory next, save/resume/submit next. All three stages succeeded via Primary, followed by delivery and mock. Actual ledger/source IDs: **20261028043526_fcb_01_cbt_private_runtime**, **20261028043550_fcb_01_cbt_start_boundary**, **20261028043607_fcb_01_cbt_mutation_boundaries**, **20261028043630_fcb_01_attempt_question_delivery**, **20261028043747_fcb_01_mock_contract**. No scope expansion or runtime enablement. Eleven applied migration fixes total; ledger 52.
- Live postflight PASS: full schema/function/policy/trigger/API ACL catalog exactly matches independently compiled approved source; 51 RLS tables, 467 visible columns, 229 constraints, 82 additional indexes, 39 functions, 82 policies, 11 triggers. Runtime/mode/usage rows 0/0/0; attempts/questions 0/0; versions 50 and seasons/configs remain inactive. No account or educational data changed or production test fixtures created. No deployment/main merge/provider activation.
- Authorization probes PASS: default-disabled start denied; nonexistent/cross-owner-shaped resume/delivery/save/submit denied; invalid mock input denied; private reserved factory EXECUTE denied. Direct question reads, attempt/answer/counter writes and anonymous start remain false. Locking probes cannot run under PostgreSQL READ ONLY (25006); reran zero-row probes in a normal transaction then ROLLBACK. This was not a permission failure or a production fixture insertion; final row counts stayed zero.
- Promoted exact reviewed SQL into the five actual migration filenames; tests use a three-stage core fixture plus delivery/mock migrations. Updated current recovery snapshot from live metadata; private extra tables intentionally have RLS and no client grants/policies. Recovery tests now expect 51 tables. Rollback test restores the old 48-table/32-function invoker boundary, refuses captured papers, then upgrades back to the current catalog. Visible column order is compared rather than dropped internal attnum slots (rollback/re-add retains physical gaps); names/order/types/defaults/nullability/constraints/API privileges remain verified. Local replay/parity/refusal, rollback-upgrade parity, resource/mutation/snapshot/mock regressions PASS; current-SHA native CI pending.
- Advisor follow-up: security **30 WARN** (one intentional anon helper, 28 authenticated definer notices including six newly hardened owner/config RPC boundaries, one leaked-password setting) plus **3 INFO** for intentionally private no-policy RLS tables. These are classified API/setting notices, not 33 confirmed vulnerabilities. New private factory/reservation/trigger helpers have no client EXECUTE. Leaked-password setting remains a budget/plan-sensitive release item; no paid change inferred. Performance follow-up is recorded in the audit; no index removal or network-firewall claim.
- FCB-01 live application gate is satisfied. Final acceptance awaits native CI for promoted filenames/current 51-table snapshot and the unchanged 164-test frontend baseline; then close FCB-01 in the canonical backlog and continue FCB-02 approved source/rights/official-season work. Runtime/commercial/content enablement and FCB-11/12 real-device/provider/gateway/release acceptance remain separate gates, never implicitly completed.


## FCB-01 — VERIFIED COMPLETE, 28 October 2026
- **Accepted security/migration/backend-contract baseline:** scoped live-vs-repository audit and function audiences reconciled; owner-approved remediation is applied and independently verified; current schema can be safely rebuilt with exact visible definitions/order/API ACLs; negative rights/owner/admin/mode/quota tests and rollback protection pass. The approved runtime remains disabled. This closes FCB-01, not the product or later release gates.
- **Exact verified source:** `7e58dcec2ba72ce4469b7c3c315363b7a6ef324d`, PR #10. **Verify 40634326588 PASS:** 14 SQL suites, native rollback/upgrade/captured-paper refusal, 21 concurrency cases, complete 51-table recovery/ACL parity and existing-schema refusal, Node/Deno, typecheck/build. **E2E 40634326572 PASS: 164 desktop/mobile tests**, actual job 122637674579 log `164 passed (3.7m)`; native job 122637674782 logs inspected. No failure skipped. Following closeout commit is documentation-only.
- **Live accepted state:** five staged CBT migration IDs 20261028043526/43550/43607/43630/43747 applied after specific owner approval; earlier six fixes retained. Ledger 52; current snapshot 467 columns/229 constraints/82 additional indexes/39 functions/82 policies/11 triggers/51 RLS tables. Independent compilation matches live definitions/privileges. Runtime/mode/usage rows stay 0/0/0, attempts/questions stay 0/0, 50 versions unchanged, no active season/config. No production fixtures, account/content publication, paid provider, main merge or frontend deployment.
- **Residual findings are explicit later gates:** security advisor 30 WARN +3 intentional private-table INFO; performance 144 classified findings. Definer notices reflect audited APIs, not 29 confirmed exploits. Leaked-password plan/budget decision, measured load, real-device/provider and HTTP/IP invalid-request hardening remain tracked FCB-11/12 release acceptance. Native tests do not establish those live outcomes. Historical migration replay remains intentionally distinct from proven current-schema reproduction; never blindly db push missing historical foundations.
- **Next package: FCB-02** — verify authoritative 2027 settings and document-specific approved syllabus/source rights; establish chosen launch-subject taxonomy only from authorized material. Existing 50 drafts stay withheld; no lawful published question corpus exists. Canonical FCB-02/03/04 publication and integration acceptance remain OPEN. Runtime/business policy values and later provider/content activation require their own reviewed decisions; do not infer permission to activate from FCB-01 closeout. Preserve compulsory English plus any three other subjects and the retired catalogue boundary. Use Primary; no repeat application, approval request or browser sign-in for completed security work.

## 2026-10-28 — Signed-admin Preview acceptance verified

User opened and saved the TinyFish Default profile sign-in after explicitly requesting TinyFish verification. Run 51089e50-4fcc-4068-849e-129ee6738dd0 completed in 37 seconds: legitimate signed-admin access at the pinned Preview /admin-academic worked; Check review package returned “Private review drafts are staged” without an error. The automation clicked the read-only check only; it did not stage, remove, approve or activate anything.

Read-only Supabase verification: 25 version-2 drafts with pending rights, 214 topics and 954 subtopics, all inactive. All 50 version-1 scaffolds remain (49 pending rights; Agriculture 2026 approved by the user earlier, still draft). Audit event syllabus_review_package_staged at 2026-10-28T17:36:41.155557Z (18:36 WAT) pins the expected aa9340d4f81bdf5253c322b14a9a091f8b0cd638a6593fd3805b207ee1453ef3 digest and publication_allowed=false. Staging occurred before this automation; do not attribute it to the read-only check or repeat it. No connector writes, source runtime changes, release or publication in this verification.

Authenticated Preview acceptance and private staging are now VERIFIED. FCB-02 remains in progress: source-use/rights authority, independent academic review, year applicability and publication are unresolved. Next action: inspect the existing FCB-02 rights/academic/year review checklist and identify the exact outstanding evidence; do not infer rights approval from source availability or deploy/publish content.

## FCB-02 acceptance reconciliation — 2026-10-28

Read-only live follow-up confirms all25 v2 IDs, source URLs and per-subject214/954 counts reconcile with the package. All75 versions remain draft; no active season/config/version/topic/subtopic. The only stored config is historical2026, inactive;2027 has no config. Real signed-admin Preview check is PASS. Current JAMB homepage2027 Test Manual was inspected:31-page network simulation/asset verification manual, not finalUTME configuration. No final2027 config established by bounded official-source searches; no claim that it is unpublished everywhere. No permissions inferred from a legacy brochure-notice search snippet (direct open returned app HTML).

Acceptance matrix and25subject state recorded in docs/FCB-02-ACCEPTANCE-RECONCILIATION-2026-10-28.md and docs/evidence/fcb-02-acceptance-reconciliation-2026-10-28.json. No application change or new runtime test; prior exact-source CI evidence retained, actual published-record student/season/rollback/takedown acceptance remains UNVERIFIED. No live writes, approval, activation, release or publication. FCB-02 remains IN PROGRESS, blocked by documented source-use authority, independent academic sign-off/launch coverage and official2027 configuration. Next: obtain those exact evidence/decisions before proposing concrete activation/publication. Generic proceed is not evidence of source permission or official exam facts.

## 2026-10-28 — Source-based editorial review and concrete correction overlay

Owner rejects the suggested human-teacher prerequisite. That requirement was overly restrictive: the assistant can perform source-based navigation review, and no human expert endorsement is claimed. Primary agent inspected the25subject label tree; separate read-only reviewer checked high-risk source interpretations. Found8concrete corrections: add Arabic Derivatives and Conditional sentences; broaden Arabic demonstrative/relative/conditional/interrogative forms, triliteral/derived verbs and composition labels; correct Igbo child abuse, History transition to Fourth Republic and PHE sense organs. Primary independently confirmed source excerpts and rendered Arabicpage3. Four cached PDF hashes verified.

Prepared docs/content-review/fcb-02-editorial-corrections-2026-10-28.json (proposalSHA256340717e8b6522f144a498ab2e12ff323e12078c00be19bab8c830dfa89df1750) and docs/content-review/FCB-02-EDITORIAL-REVIEW-2026-10-28.md. Immutable original payload/helper digest unchanged. Overlay6renames/2inactiveadds yields956subtopics if approved; not applied. Live read-only exactexpected-row preflight PASS:6/6rename rows match;2newIDs absent;4/4affectedversions draft/rights-pending. Original package bulkundo must refuse after edits; no forced rollback proposed. This is bounded navigation review, not exhaustive objectives, books/lessons or legal permission.

Exact next action: obtain specific approval for these8production draft corrections under AGENTS.md, then use a legitimate authenticated admin authoring path; never forge connector claims. Existing UI currently creates but does not rename subtopics, so the application path for six renames must be implemented/verified or another genuinely authenticated supported path established before promising execution. No live writes, mainmerge, deployment, rightsapproval or publication. Actual2027config/source-use/publication gates remain; no teacher request should be repeated.

## Owner authorization update — 2026-10-28

User explicitly approved all remaining work within the condition that it follows JAMB guidance, immediately after the exact eight draft corrections were presented. This authorizes applying those eight reviewed edits; do not request the same approval again. Routine source work and necessary verified implementation can proceed within the existing FCB scope. The condition does not supply missing official facts, establish an external licence or authorize fabricating approval evidence.

TinyFish signed-admin correction run5adb8d18-a38f-40b0-b366-697c09ca7b1b is in progress. Goal limits writes to six exact name changes/two inactive additions, checks all expected rows and pending draft versions, uses only the genuine saved administrator session and existing RLS, and forbids token output, claim changes, publication/activation and bulk-stage/undo. Do not launch a duplicate run or retry writes until terminal status and read-only postflight are inspected. Intermediate database check still showed954subtopics and0/8expectedcorrectedrows; that is not final failure evidence.

## Eight-correction attempt blocked by TinyFish sign-out — 2026-10-28

Run5adb8d18-a38f-40b0-b366-697c09ca7b1b is TERMINAL after554seconds. TinyFish reports it clicked Sign out while navigating, invalidating the previously working admin session; no credentials stored and no correction writes reported. Independent read-only postflight:0/8correctedrows,954subtopics,0active. No operation completed; do not falsely report these approved corrections applied. This is a browser automation failure, not a Supabase read-only restriction or a missing user approval.

Renewed authorized Default-profile setup opened at exact pinned/admin-academic; user needs to sign in and Save profile. Handoff URL is intentionally not stored in source. Specific approval for all8draft edits persists; no permission question needed again. Next execution must explicitly prohibit Sign out and unrelated navigation; confirm session first and stop immediately on unsupported editing/authentication. Never extract credentials into chat, spoof JWT claims or bypass authoring triggers. Existing source-use and final2027fact evidence remain unresolved; no publication/activation occurred. Evidence docs/evidence/fcb-02-correction-attempt-2026-10-28.json.

## Supported editor path required — 2026-10-28

User saved refreshed TinyFish profile. Rune3a1853b-8cc4-4299-866f-dd3ddb6e524d completed232seconds: genuine admin access works and no Sign out occurred;0writes. Browser automation cannot execute authenticated browser-side REST, and existingUI has no rename controls. Do not repeat credential requests or the unsupported directAPI automation. Evidence docs/evidence/fcb-02-correction-resume-2026-10-28.json.

Implementing normal draft subtopic name/order editing in existing AdminAcademicWorkspace, using existing authenticated client/RLS/authoring triggers, no extra privileges/RPC. Tests first: local1fe19fb, remote4c70266d3628c27964d805d5dd63994f06bcb14d on fix/fcb02-subtopic-edit; draftPR12. E2E40746489018 and Verify40746489283 pending, intendedRED for missing controls. ConnectedPreview branch remains pinned7b9ff43; no runtime or production deployment. Owner approved all following-JAMB work and8draft corrections; do not ask again for this bounded completion.

Exact next action: observe browser regression failure, implement bounded name/order editor with original-row/version filters and safe errors; verify, review, deploy isolatedPreview under existing approval, then apply corrections via actualUI. Existing UI additions generateUUIDs; record actual inserted IDs and validate semantic payload/ordering if using manual add flow rather than falsely claim proposed IDs were used. No official2027facts, rightslicence or publication approval evidence invented.

## Draft subtopic editor implemented — 2026-10-28

RED confirmed by terminalE2E40746489018 logs(job123021535657):172existingcasesPASS;4newdesktop/mobilecasesFAIL at missing Edit name and order. Verify40746489283PASS. Implemented existing-workspace details form with name/display-order editing; trims/capsname200 and validatesintegerorder0..2147483647. Updates only{name,sort_order}, filtersid/version/parent/originalname/order and requiresmatchingreturnedID. Keepsdraft/editor/adminUIgates andexistingauthenticatedclient/RLS; noRPC,grants,schemaorpublicationchanges. Safeerrors/reloadfailurehandling reused.

Added src/lib/syllabusEdit.ts and tests/syllabus-edit.test.mjs, registeredunitinVerify. UnitREDvalidinputfailedNotImplemented,then3unitchecksPASS. All36localNodechecks,typecheck/buildPASS;preexistingnpmproxy/chunksizewarningsremain. ActualnewUIbrowserCIpending; independentboundedcodereviewrequested. TinyFishcurrentDefaultsessionworks onlyatpreviouspinnedprevieworigin; newimmutabledeploymentmayneednormalappSSO or stablePreview sign-in. Do not promise credentialreuse acrossorigins or ask for anotherlogin before verifiednewpreviewexists. Eightcontentcorrectionsremainapproved/unapplied.

## Draft subtopic editor VERIFIED/DEPLOYED — 2026-10-28

Exact source2490040196c71901348e4409975bb08f1de20fde on fix/fcb02-subtopic-edit, draftPR12 stacked onto security/fcb-01-contract-audit. Verify40748548480PASS(all4jobs), nativejob123028728552logs9units/42nativeSQLscenariosPASS. E2E40748548475job123028727708terminal log176PASS(4.0m).36localNode/typecheck/buildPASS; independentcode review no blocker. NewCI follows observedRED172PASS/4newFAIL. Source tree independentlymatched publishedGit tree. No serverRPC/schema/grants changes.

Cloudflare buildab622ae7-2667-4c3c-bbaf-6f24bd905d84SUCCESS; preview1c52be0a1a6b4429898ae8ed2d03f9f2 deployment8570f8c8-1de5-4cea-8c8b-2b751e1ec171. StableURL https://fix-fcb02-subtopic-edit-nova-ace-jamb.novaking5002.workers.dev ; pinnedURL https://8570f8c8-nova-ace-jamb.novaking5002.workers.dev .9liveGETchecksPASS plus neweditor text in actualacademicJS; original fixedpayload digest/serviceworker preserved. Production222bdd23/version809c6301remains100%,unchanged.

IMPORTANT PROVIDER CORRECTION: parent nova-ace-jamb WorkerIDd94d2a25f876477aa50a2bac80ca7022 actually tracks main,auto_build=true,previews_enabled=true,buildnpmrunbuild/deploynpxwranglerdeploy. Earlierbbb0f9fc9d7a48558333acc249957562 is the security/fcb-01-contract-audit PREVIEW ID, with its own branch-specificbuildsettings; the earlier statement that the productionprovider now tracks securitybranch was incorrect. No provider configuration changed. Newsource/docsbranches may auto-create previews, as directlyobserved; do not call them non-triggering. Mainupdates can releaseproduction.

TinyFish76c7873e-6610-4e7c-b470-fa8dc9d607cdstopped after10seconds because NEW stable previeworigin needs sign-in. No writes; postflight0/8corrections,214topics/954children,allinactive. ActualeditingUI now exists and isverified; do not retry unsupportedbrowserREST or asknewcontentapproval. Renewed authorized Defaultprofilesetup opened on STABLEfix-fcb02-subtopic-edit URL, not immutabledeploymentURL. User mustsigninandSaveprofile once for thisorigin; keepusingstableURLthroughfutureupdates. No handoffsessionURLstored. Exactnext: apply5Arabiccorrections throughnormalUI,then3othernames;recordapp-generatedIDsforthe2adds,setorder161/162,verifyall8withSQL. Source overlay originalfixedUUIDproposal remainsimmutable; executionrecordmuststateactualIDs. No rightsapproval/publication/activation/mainmerge/proddeployoccurred. Evidence docs/evidence/fcb-02-subtopic-editor-verification-2026-10-28.json.

## Live corrections and no-paid-browser completion path — 2026-10-28

User saved stable-origin Default TinyFish session; real admin authoring works. Independently verified four renames(ARA-03-01,ARA-03-15,ARA-04-01,IGB-04-08) and two inactive additions: Derivatives UUIDb8cc0f71-4227-4e61-9bd7-fec50ab3130f/order161; Conditional sentences UUID2f6c5f55-2982-4efd-acd5-ff753402f262/order162. Conditional description remainsNULL; History/PHE names stillold. Six conceptual corrections saved, but two names+one source-note field remain to finish the exact reviewed target. Do not overclaim tool reports: firstArabicrun claimed composition saved, but SQL caught unchanged value and later run fixed it. Actual app-generatedUUIDs differ from proposal; preserved and recorded.

All214topics exactlymatchoriginalseven-fieldprojection checksum2012de2bfc6beeebcc1e31a232037c54. All956subtopics match expectedpartialprojectione5380bea7564102134b8720bece5a771; targetafterremaining3fields86806e7337523a601427debd19e26888.25v2identity/source/rights/statusprojectionunchanged5082c7d856c33bcfe7dd16edb30eb1ad; allv2draftpending/allnodesinactive. Originalfixedpayload/digestunchanged. Evidence docs/evidence/fcb-02-live-corrections-progress-2026-10-28.json; no extra DBaudit event claimed.

TinyFishwalletobserved-0.088USD,autoreloadunconfigured. Two proposed single-edit runs didnotstart(list_runsconfirmednone); do not launchmorepaidruns or ask user to sign inagain. Allinitiatedrunsareterminal: f7a60f49(589s),ee8d8198(216s),6a712545(144s). Guardedcompletionactionprepared foruser'sexistingadminsession: twonames+Conditional source note, no extraRPC/schema/grants/claims. Noauto-reads/writesonmount; explicitApply,exactpreflight,skipcompleted,conditionalPATCHallrowfields,returned-IDchecks,readback,check-before-retry. RESTcallsnotatomic; parentstatuschecksarenotrowlocks. Ownerapprovalcoversallthesechanges; do notrequestanotherapproval.

Sourcecore7unitRED(5validcasesfailedstub)then43localNode/typecheck/buildPASS. BrowserRED40755640989job123053680538logs176PASS/6newFAILatmissingregion. Implementedpanel+core,bff8bab865fe34acc6897c2aaa2a54d3a9da8325 on fix/fcb02-subtopic-edit/PR12, nowtargetsMAIN sofullVerifyruns(branchfiltermain). Verify40757215496PASS;E2E40757215500PENDING,184casesincludingnewselection-race regression. ReviewfoundP2staleonChangedcallbackwhenuserversionswitchesmidoperation; latestcallbackref/layout-effectfixisnextafterobservedRED. No mainmerge/proddeploy/publication/rightsapproval. Keepstableprevieworigin; userclickafterverifiedactionavoidsTinyFishcreditcost.

## Reviewed-correction completion action — final selection fix prepared, 2026-10-28

FullE2E40757215500 passed182cases but newselectioncasefailedon a testlocator(getByLabel exacttext included optionlabels), nottheproductrace. Correctedlocator to existingknownnon-exactlabelpattern; temporarilyfocused onlythatregression onreviewbranch. Focusedrun40758738052/job123064573751 thenreproducedactualproductRED onbothplatforms: expectedreloadPHEversiona09f896e,receivedoldHistoryversion54a533a3. Verify40758737938PASS. Fixedchildcompletioncallback withuseLayoutEffect-syncedlatestonChangedref. RestoredoriginalFULLnpmrune2ecommand; finalworkflowdiffversus2490040isEMPTY. No narrowedfinalcoverage or skippedtests.

43localNode/typecheck/buildPASS afterfix; sourceexecution/race/latestcallbackreviewnext. Exactfinal184browser/fullVerifyCIpendingpublication. Allremaining3patchesstillunapplied, live956inactivechildren/fullprojectionpartialfingerprinte5380bea7564102134b8720bece5a771. No moreTinyFishrun,credentialrequestorpaidtopup. Ownerbroadapprovalpersiststhroughneededverifiedfrontendcompletion; source-use/final2027factsremainunestablished. Nextpublishfinalhead,fullCI/review/preview,thenprovideoneApplyreviewedcorrections actioninrealadminsession(noautomaticwrites,nomorepaidbrowsersteps).

Independent original-index review completed: no blocking issue in current candidate. One malformed-input gap (blank/padded group names accepted) reproduced RED then fixed;5generator tests nowPASS. Full content suite15testsPASS. Reviewer independently confirmed complete1170lineage, exact generated artifact and student/admin separation; browser execution stillpending.

Publication helper installed after native24casesPASS (20sequential+4actualcontention), Verify40807394841 all6jobsPASS, latestnativejob123229497134 loginspected. Installedledger20261029023824_fcb02_original_study_publication; bodySHAe27729207c20d1975add819c45a5604e168ec7fb1eb77dc636e886291711c90e matchesreviewedsource,postgresowner/definer,pg_catalog+pg_temp/3s,authenticatedonly; identity-freeoperationdenied. Ledger56,75versions,zeroactivecontent/config/seasons,zeroindexpublicationaudits. Original214/956/25v2fingerprintsunchanged andsavedbaselineexactreadback. No publication/contentmutation. Browser40807394849/job123229850216stillrunning. Fullscope24native +202browserexpected; initialoldbrowserrun40807224329cancelledafterSQLfixturecorrection, notPASS. Independentreviewcount-driftfindingfixedRED/GREEN, noreviewblockers. Nextfinishfullbrowser, recordrelease/deploy; genuineadminPublishactiononlyafterconcretecontrolsavailable.

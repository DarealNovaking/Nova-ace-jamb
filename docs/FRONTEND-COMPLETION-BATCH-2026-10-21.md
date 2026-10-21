# Full Product Frontend Completion Batch — 2026-10-21

## Objective
Complete the frontend for the whole ÑØVÃ ACE JAMB product defined by the master handoff and final architecture—not only student preparation screens. This document defines scope and acceptance gates; it does not claim the listed work is already implemented or tested.

## Verified repository starting point
- Branch: main. Repository tree was retrieved from GitHub during this task; tree SHA: f14af8ea403854e264fb532cd5734f8723c7df9d.
- App entry: src/main.tsx. It dispatches /admin-academic to AcademicFoundationGate, /admin and /admin-import to AdminFoundationGate, CBT query state to ProtectedCBT, and otherwise StudentFoundationGate.
- Existing student-facing components include StudentAuth, StudentOnboarding, StudentDashboard, StudentStudyPlan, StudentStudyWorkspace, ProtectedCBT and PersistentCBT.
- Existing admin/academic components include AdminFoundationGate, AdminAcademicWorkspace, AdminCatalogueImport, AdminIbassStage and AdminReviewOnlyStage.
- package.json exposes typecheck, build and Playwright e2e scripts.
- This task did not execute the app, run tests, inspect live Supabase, or deploy.

## Workstreams in this single frontend batch

### A. Baseline audit and route inventory
- Read each existing student-facing component, its service imports, relevant tests and route/entry logic.
- Inventory every rendered student feature and classify it as complete-and-verified, implemented-unverified, partial, missing, or backend-dependent.
- Preserve /admin, /admin-import and /admin-academic access behaviour; do not revive the previously resolved routing bug without new evidence.

### B. Student entry, auth and onboarding
- Verify sign-up/sign-in/recovery, session restoration, profile preparation, onboarding and reload continuity.
- English remains compulsory/automatically selected; the other three subjects follow current onboarding/product rules.
- Validate form errors, loading/retry/success states, accessibility, and narrow mobile layouts.

### C. Student dashboard and navigation
- Connect dashboard actions to real existing flows; remove dead-end/placeholder navigation.
- Use persisted profile and activity data only; handle first-use/empty/error states honestly.
- Ensure mobile navigation and browser back/forward work without breaking CBT entry.

### D. Learning and study workspace
- Audit current workspace modes and implement the existing product scope for learning, practice, quick revision and flashcards through reusable components.
- Verify question/answer mapping, navigation, explanations, progress and empty/error states where supported by real services.
- Do not fabricate lessons, official syllabus records, questions, explanations, or progress.

### E. CBT
- Verify exam setup, question/option mapping, answer persistence, navigation/review, timer expiry, submission, scoring/results and interrupted-session recovery against the current implementation and server contract.
- Keep scoring/authorization decisions server-authoritative where the architecture requires it; never trust client-submitted scores.
- Add regression coverage for reload/back navigation and session expiry.

### F. Study plan and progress
- Verify persisted study preferences, daily activities, progress metrics, mistakes/weakness displays and recommendations.
- Render only metrics supported by real data; show a clear empty state where history is insufficient.
- Identify missing backend contracts explicitly instead of faking functionality.

### G. Shared UX, accessibility and performance
- Preserve ÑØVÃ identity (royal purple, metallic gold, white and black).
- Check responsive layouts, keyboard focus, labels, contrast, reduced motion, low-bandwidth behaviour and low-end Android performance.
- Reuse existing design tokens/components and avoid new dependencies unless justified.

### H. Integration and release verification
- Run npm run typecheck and npm run build.
- Run npm run e2e / targeted Playwright flows for auth, onboarding, student dashboard navigation, study workspace, CBT and admin route regression when environment and test accounts permit.
- Record passed, failed, skipped and blocked checks separately. A successful build alone is not proof of end-to-end correctness.
- Inspect CI results and the final diff before declaring completion.

## Execution rules
1. One accountable integrator owns the batch and merges all work.
2. Work in small implementation slices within this single batch; avoid conflicting parallel edits to shared components.
3. Backend/Supabase work is not the objective of this batch, but existing service contracts may be inspected and used. Do not invent a missing backend capability.
4. No production schema/data mutation or deployment as part of frontend work without separate review/authorization.
5. After meaningful changes, update this batch record, docs/ACE-JAMB-MASTER-HANDOFF.md and docs/AGENT-CONTINUITY-CHECKPOINT.md.

## Scope correction — whole-product frontend and channel integration (2026-10-21)

The earlier workstream list was too narrow. The canonical product vision in `docs/ACE-JAMB-MASTER-HANDOFF.md` and `docs/FINAL-ARCHITECTURE.md` also requires the following frontend surfaces; these are now part of this same coordinated batch:

- **Community/channel gate:** intended student flow is sign-up/sign-in → preparation onboarding/profile save → Community/Channel Gate → main dashboard. Show the configured official Ñøvã WhatsApp Channel CTA. Route students to institution-specific groups only through explicit, reviewed mappings; if institution is optional/unmapped, use a documented general-community fallback or optional institution choice. Never invent destination URLs.
- **Verification rule:** master handoff section 23 says WhatsApp membership verification is currently UNDECIDED. A client-side “I joined” button, URL click, local storage flag or route is not verification. Audit supported platform/server capabilities and existing contracts before enforcing a mandatory gate. The UI may show honest pending/unsupported states, but do not claim a gate is secure/unbypassable without server-verifiable membership. No automatic WhatsApp posting or channel management is in scope.
- **Notifications and announcements:** in-app inbox/read state, admin announcements, targeted/scheduled notifications, user preferences, important system notices and push opt-in/device state only where the current service/provider exists. FCM was the prior direction but requires an integration audit.
- **ACE Pass and referrals:** checkout/payment status, transaction history, server-verified seasonal entitlement, referral code and qualified-referral progress. Master handoff currently records ₦899 seasonal ACE Pass and five qualified real-user referrals; never trust client-side success claims.
- **Grounded AI and knowledge UI:** tutor, explanation, diagnosis, revision and source/provenance surfaces only where the grounded AI/provider/quota/retrieval service is real; show quota/provider failure and fallback states; never present generated material as official JAMB content.
- **Audio learning:** player, playback state, transcript/accessibility alternatives and low-bandwidth/offline/error handling when authorized audio content/service exists.
- **Admin command center:** expand beyond the existing catalogue import/review surfaces toward student/account operations, content/question review, provenance/rights/takedown, flashcards/audio, payments/entitlements, referral activity, notifications, AI knowledge sources, moderation, analytics and security/audit visibility. Respect admin/editor least privilege and keep review-only staging separate from approval/publication.
- **Account/settings and PWA:** profile/preferences, notification settings, session controls, install/offline shell and safe cache behavior; never let caching corrupt live CBT state.
- **Whole-product UX/QA:** consistent royal-purple/metallic-gold/white/black design, mobile/low-end Android and low-bandwidth behavior, accessibility, empty/loading/error/retry/success states, typecheck, production build, Playwright and integration regression tests.

### Where channel integration belongs
The Channel Gate belongs **after onboarding and before the main dashboard in the intended student journey**. In the canonical implementation sequence, community/channel integration remains Batch 13 (Notifications + Community), after ACE Pass and Referral Growth dependencies. UI placement and implementation sequencing are different: document and design the flow now, but mandatory enforcement must wait until a genuine server-side verification contract is available. Core preparation must not be blocked by pretending a client click proves membership.

### Updated integrated work order
1. Audit all current routes/components/services/migrations/tests and latest CI; classify complete/verified, implemented-unverified, partial, missing, or contract-dependent.
2. Preserve and verify identity, onboarding, profile, dashboard and route/auth behavior.
3. Complete learning, question practice, mistake/adaptive flows and CBT against verified content/service contracts.
4. Complete revision, flashcards, audio, study plans, analytics and recommendations.
5. Add grounded AI UI only where the provider/retrieval contracts are ready.
6. Implement the Channel Gate and institution/group routing with the verification caveat above.
7. Implement notifications/preferences/announcements/push where supported.
8. Implement ACE Pass/payment/referral surfaces against server-authoritative contracts.
9. Expand admin/academic operations surfaces with least-privilege controls.
10. Finish PWA, mobile, accessibility, performance and whole-product Playwright regression.

### Current status and next action
**SCOPE EXPANDED; WHOLE-PRODUCT IMPLEMENTATION/VERIFICATION IS NOT COMPLETE.** Existing student screens visibly contain placeholder states for lesson delivery, question practice, flashcards and verified performance. The current source inventory does not show dedicated UI routes/components for channel verification, notifications, payments/referrals, grounded AI, audio or the full admin command center. This is an initial source-tree observation, not proof that no backend contracts exist.

Next: inspect the complete current service/migration/test contracts and latest CI for community gate, notifications, payments, referrals, AI, audio, feature flags and admin operations; produce an evidence-backed status matrix; then implement the smallest high-impact gaps in the order above. Do not assume Supabase is blocked, invent content or group mappings, or mark mocked/provider-dependent behavior as live verification.



## Evidence-backed live contract audit — 2026-10-21

### Supabase connection and live schema
- Connected Supabase project `nova-ace-jamb` (`uokiqlgmzprqfbzmedaz`) was queried read-only. Project status reported `ACTIVE_HEALTHY`; Supabase is accessible and not blocked.
- Live `ace` schema includes tables for notifications and notification preferences; products, payments, payment events, payment providers and entitlements; referral codes/referrals/campaigns/rewards; AI providers/requests/usage; knowledge sources/chunks; flashcards/reviews; learning progress; study plans/items; devices; feature flags; audit events and product events.
- Read-only counts at audit time: subjects 25; topics 0; subtopics 0; questions 0; flashcards 0; learning_progress 0; attempts 0; study_plans 0; notifications 0; notification_preferences 4; products 1; payments 0; entitlements 0; referral_codes 4; referrals 0; referral_campaigns 0; referral_rewards 0; knowledge_sources 0; knowledge_chunks 0; ai_providers 2; ai_requests 0; devices 7. Counts can change and are not a substitute for provider/feature verification.
- Live Edge Functions listed: `catalog-import` and `ibass-catalog-stage` only. No dedicated channel-membership verification, payment webhook, referral qualification, AI request, or notification delivery Edge Function appeared in that list.
- No dedicated community/channel/group mapping or channel-membership table appeared in the inspected live `ace` table inventory. Therefore institution-group routing and independently verified WhatsApp membership do not currently have an evidenced live schema/service contract. Do not fabricate one in the frontend.

### Frontend source status
- Current `src/lib` modules are auth, CBT, data adapter, device, season/syllabus, student and Supabase. There are no dedicated frontend service modules for channel verification, notifications, payments/entitlements, referrals, AI/knowledge or audio in the current source tree.
- Current UI routes remain student default, CBT query mode, `/admin`/`/admin-import`, and `/admin-academic`. The current frontend does not yet expose the full product domains listed above.
- Source/DB evidence confirms the next implementation cannot safely pretend that a database table alone means a feature is operational. For notifications, payments, referrals and AI, inspect RLS/RPC/provider configuration and define/reuse secure service boundaries before wiring UI. For channel verification, the platform capability/verification decision remains a specific blocker to mandatory enforcement; a CTA/gate design can be built without falsely claiming verification.

### CI state at audit time
- Verify and ACE JAMB E2E both passed on previous docs-only baseline commit `bce60df163ee855ada622276d45488a53bc4ea6f` (runs `39514640639` and `39514640651`).
- Runs for the newer scope/handoff commits were still in progress when queried: Verify `39515107606` on `ce737e1c2876cac9a18c0e8e1d74a5bd39ea1fa6`; ACE JAMB E2E `39515107387` on the same SHA. Recheck the newest `main` runs before relying on CI status.
- No app source was changed and no build or Playwright command was run directly in this audit. Live Supabase checks were read-only.


## RLS/service-boundary findings from live read-only audit — 2026-10-21
- Notifications: authenticated students can SELECT their own notifications and UPDATE their own rows for read state; admin has ALL. Notification preferences have a self-only ALL policy. This suggests an inbox/preferences UI can use these existing boundaries, but a delivery/scheduling service still needs verification.
- Products: active products are publicly readable. Payments are self-readable and admin-manageable; entitlements are self-readable and admin-manageable. Student payment creation/verification must use a server/provider flow, not direct client writes.
- Referral codes are self-readable; referrals are readable only to participants; referral rewards are self-readable. No student-write policy for qualification/reward was found, so a frontend must not calculate/award qualification client-side.
- Flashcard review and learning progress are self-scoped; study plans/items are owner-scoped; devices are self-scoped. Their corresponding tables were empty for content/activity in the audit (flashcards 0, learning progress 0, study plans 0), so screens need correct empty states until valid records exist.
- AI providers and knowledge sources/chunks are admin-only; AI requests are self-readable and AI usage is self/admin-readable. No dedicated AI request Edge Function was listed, and no student INSERT policy for AI requests appeared. Do not call provider secrets from the browser or build a fake tutor; establish a server-side request boundary first.
- Feature flags are readable by authenticated users and writable only by admins. Audit events are readable to actor/admin and inserts are constrained to self/null actor. Admin UI must respect these RLS boundaries.
- These findings are schema/policy observations only; no row was changed. See live schema/counts above. No channel verification/group mapping contract was found.


## Phase 1 implementation log — 2026-10-21

### Completed source changes (not a claim that all Phase 1 batches are complete)
- `src/components/StudentFoundationGate.tsx`: a newly created student account whose `student_preferences` row is not present (`PGRST116`) now proceeds to onboarding instead of falling into the generic account-load error screen. Other errors still fail closed into a recoverable error state. Raw database/provider error messages are no longer shown to students.
- `src/components/StudentDashboard.tsx`: selected workspace mode is now represented in the URL as `?view=<mode>`; valid modes restore after reload, workspace changes enter browser history, browser back/forward syncs the active workspace, and opening CBT removes the workspace query without discarding unrelated URL parameters.
- `src/main.tsx`: removed fragile document-wide button-text interception for CBT routing. CBT back navigation now removes only the `cbt` query parameter and preserves other URL state.
- Commits: `79d99942491507b0e8e7fc3d1a8f9d4862f7f9ea`, `66b0f606ec33f1061ae97f34c937a5b531c0e3ea`, `4e522f91ee686635dc725149bbac038ff02c9020`.

### Verification
- Read the current `main` source for the affected components before editing.
- GitHub combined commit-status endpoint returned an empty `statuses` array for these commits; this does **not** establish that CI passed.
- Typecheck, production build, Playwright, and live authenticated browser flows have **not yet been run** in this implementation slice.
- No database writes, migrations, or deployment were performed.

### Phase 1 remaining
- Batch 1: harden auth/session race and recovery/sign-up states; add/verify auth and onboarding E2E coverage.
- Batch 2: test URL/history navigation and student dashboard error/empty states.
- Batch 3: verify syllabus tree and learning workspace states against published records.
- Batch 4: implement practice only against verified question/answer data and available server contracts; never synthesize official questions.
- Batch 5: finish CBT recovery, timer, answer persistence, submission and results regression checks.
- Run `npm run typecheck`, `npm run build`, and `npm run e2e` after the phase's source slices; report each result separately.
- Continue to update this file and both canonical handoffs after each meaningful slice.


### Additional Phase 1 hardening slice — 2026-10-21
- `src/components/StudentFoundationGate.tsx`: auth refreshes now ignore stale async results, include the initial auth-session event, and defer auth-dependent Supabase requests until after the auth callback returns to avoid auth-lock races. Stale profile lookup errors are ignored rather than changing the current user's UI state.
- `src/components/StudentDashboard.tsx` + `src/components/StudentStudyWorkspace.tsx`: approved syllabus subtopics returned by the existing syllabus service are now passed through and displayed under their parent topic. This uses actual published records only.
- Commits: `a757f602f7d045d16ed53b511c2a5369a310a689`, `49c8949fdc9771876cc6e6150f96cb9fcc70cd6b`, `fc2b70c7733671d0e13a88265c9da7a95bef91a3`, `95cb90c4bf3f8f4f3f53e043aa95ae3496f459f1`.
- Verification remains outstanding: no local runtime is attached to this GitHub-only editing path. GitHub combined status returned no status entries, and commit-associated workflow lookup returned no runs. Typecheck/build/Playwright are **not verified**. Do not describe this as passed.


### CI-driven correction — 2026-10-21
- The first pushed verification runs failed at TypeScript parsing: `src/components/StudentDashboard.tsx(128,200): TS1005 '}' expected`. The failure was caused by a missing JSX expression closing brace in the new workspace-navigation click handler.
- Fixed in commit `23735a150ba0d142f29ec0919df69c33236a4f2f`.
- The failure was identified from actual GitHub Actions logs, not inferred. A post-fix run for the corrected commit has not yet been observed; the correction is **not verified until the new Verify and E2E runs finish**.


## Phase 1 continuation log — 2026-10-21

- Added Playwright assertions for workspace route state: clicking Learn sets `?view=learn`, reload restores Learn, browser back returns to dashboard, and forward restores Learn. CBT URL assertion now checks an actual query delimiter. Commit: `77c907b1fb548df3f0ca87204f1272137d41f85e`.
- `src/components/PersistentCBT.tsx`: answer selection now requires an active attempt; submission is guarded against duplicate concurrent calls; load/save/submit failures use student-safe messages while preserving retry affordances and server-authoritative RPCs. Commit: `f886ad493d617e460fc1a34f92b5cd28edf81160`.
- `src/components/StudentOnboarding.tsx`: load/save exceptions no longer surface raw backend/provider details to students; messages advise retrying. Commit: `3fd59568f9d5e965b78bc90d698afdaee1c6fc9d`.
- Canonical 16-batch plan and current Phase 1 status are now embedded in both master handoff and continuity checkpoint, as well as maintained in this batch tracker.
- Verification: Verify and ACE JAMB E2E passed for `23735a1` and documentation successor `13865f1`. New workflow runs for the test and source hardening commits are pending/running; wait for results. No database writes or deployment.


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


## Phase 1 continuation — onboarding save regression (2026-10-21)
- Added a Playwright E2E case in `tests/e2e/smoke.spec.ts` that intercepts all Supabase traffic and verifies the onboarding save RPC receives the display name, target score, optional admission goals, daily study time, and exactly four distinct subject IDs: compulsory English plus the three selected subjects.
- The test uses mocked responses only; it performs no production database writes.
- Commit: `b8881491720d74832f7a18401b905b7967368567`.
- Verification at commit time: GitHub Verify workflow for the previous checkpoint SHA `a8c44efc5b5438d8b69c06fad8ca3f2f5b00911d` passed typecheck/build; the Playwright workflow was still running. The new test's CI result is pending and must be checked before calling it passed.
- Next: inspect the new CI runs, fix any test failure, then add targeted regression coverage for CBT expiry and completed-attempt recovery. Live question content remains absent in the last verified audit; do not fabricate it.


### CBT recovery-key correction — 2026-10-21
- Inspection of the current `ProtectedCBT.tsx` found a mode-isolation defect: a student signing in from the Practice route was assigned the CBT recovery-storage key, although an already-authenticated student correctly used the selected mode. This could cause Practice and CBT to share or miss the intended recovery pointer after sign-in.
- Fixed in commit `04ad0edae2bfa936997a0edfeb1d6138a87d03f7`: sign-in now builds the recovery key from the route's validated `mode` (`cbt` or `practice`). No data schema or production data changed.
- GitHub Verify passed on the previous checkpoint SHA `38a948349c6c732f5b8ae144051dff3650b089c7`. The E2E run for that SHA was still marked in progress when checked; several older E2E runs were also still in progress with no final conclusion, so browser acceptance is not verified. No claim of Phase 1 completion.
- Next: poll CI for the new fix commit, add/verify a sign-in-to-practice recovery-key regression test, inspect CBT expiry and completed-attempt recovery paths, and finish syllabus published/unpublished fixture coverage. Keep question-bank empty states honest.


### Completed-attempt recovery regression coverage — 2026-10-21
- Added a mocked Playwright test proving a saved completed attempt can restore its server-returned result after entering CBT without fetching question content. This covers the recovery path when the published question rows may no longer be available; all Supabase calls are intercepted.
- Test change commits: `4e8fc1c5c6c8493c20635d1651b19d0968ca03bf`, `ef6ec1e5478612d0cb1fa5bd6866c39ef330b6a9`, `bc616ee623ec88cefb524e4c5762901a0ef5e77f` (test adjustments after source review). The test has not yet been verified by a completed E2E run.
- The fresh-sign-in practice recovery-key fix is in `04ad0edae2bfa936997a0edfeb1d6138a87d03f7`. Verify/E2E runs for that fix and later documentation/test commits are currently queued or in progress; no final browser pass is claimed.
- Next: inspect the newest E2E result, fix any failing assertion, add the practice sign-in key regression if feasible, then complete CBT expiry/retry and published/unpublished syllabus acceptance. Phase 1 remains open.

## Phase 1 verification refresh — 2026-10-21

- Verified code/test commit c0094f44134e8a334d67c1499ac08f97df3e80a8: Verify run 39532411416 SUCCESS; ACE JAMB E2E run 39532411391 SUCCESS, 36/36 tests passed on Chromium and mobile Chromium.
- Additional coverage now includes password-reset request, recovery-session password update, practice-mode sign-in recovery pointer, expired CBT auto-submit and retry after transient submission failure, active attempt resume, completed result restoration, syllabus approval/rights filtering, and answer-button accessible names.
- Current live data read is content-empty for the core academic path: 25 subjects and 2 exam seasons exist, but 0 active approved syllabus versions, 0 topics, 0 subtopics, 0 questions, 0 flashcards and 0 attempts. No production writes or deployment occurred in this work.
- **Batch 1:** substantially covered, but sign-up, session-race and recovery-link callback acceptance still need broader tests. **Batch 2:** workspace reload/back/forward passes; dashboard retry and query-parameter interaction tests remain. **Batch 3:** mocked published/pending-rights fixture tests pass, but production syllabus content is absent. **Batch 4:** still incomplete; the question bank is empty and practice answer/explanation, mistakes review and saved progress cannot be verified with real question content. **Batch 5:** mocked persistence, result, expiry and retry tests pass; live attempts/content are absent.
- Phase 1 is **not closed**. Continue Phase 1; inspect the existing question authoring/review/publication path and live question-read/start_attempt contracts, then determine a lawful, reviewable content path. Never invent official questions or claim mocked fixtures prove production content readiness.

## Question rights publication gate — 2026-10-21

- Read-only live RLS/function inspection found that question reads and attempt RPC selection did not enforce rights_status. Added migration source supabase/migrations/20261021100000_question_rights_publication_gate.sql and disposable PostgreSQL regression test tests/sql/question_rights_publication_gate.test.sql; Verify workflow runs the test.
- Verified on commit f2d7e0ade4a2607fae8f05c1802dbce267a13e84: Verify 39533469598 PASS; ACE JAMB E2E 39533470537 PASS (40/40). The new SQL test confirms only owned/licensed/permitted published questions are public/attemptable, even when an editor invokes the RPC; editors retain direct review access.
- Production migration has **not** been applied. The live DB has 0 questions, 0 topics, 0 subtopics, 0 active approved syllabus versions and 0 flashcards. Explicit production schema-change authorization is required before applying the migration.
- Phase 1 remains open: real approved content and the full practice/explanation/mistake/progress flow are still absent. Continue safe auth/session and dashboard acceptance work while resolving lawful content sourcing. Do not invent official questions or deploy the app.

## Content-source review note — 2026-10-21

- Candidate official syllabus provenance source identified: https://ibass.jamb.gov.ng/e-syllabus, linked from the official JAMB homepage. Reuse terms remain unverified; keep any imported data draft/pending until rights review. No verified official reusable question bank was identified, and no questions were fabricated.
- Question-rights migration source is committed and disposable SQL-tested but remains unapplied to live Supabase pending explicit authorization.

## Legacy deployment asset removal — 2026-10-21

- Deleted .github/workflows/deploy-production.yml, wrangler.jsonc and the legacy backend/index.ts AppDeploy SDK implementation; rewrote README.md to remove legacy provider and deployment instructions.
- Recursive main tree contains no filenames matching AppDeploy, Wrangler, deploy or Cloudflare. No application deployment was performed. Existing historical deployment notes are archival only and must not be acted on unless the user explicitly reverses the removal instruction.

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

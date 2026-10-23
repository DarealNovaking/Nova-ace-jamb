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


## Dashboard retry fixture target correction — 2026-10-21

- Further source inspection showed syllabus-version lookup is skipped when the active exam blueprint is absent in the standard fixture. The retry test now fails the dashboard-only `rpc/get_active_exam_blueprint` request once and then falls back to the prepared student's mocked `null` response, so the failure is guaranteed to occur in dashboard loading without breaking authentication.
- Latest test fixture commit: `1c7709664b961c3f0019b1fd9d2cb8769b51601c`. Prior CI runs do not include this exact test target yet; await CI on current HEAD before declaring the test green.
- Scope unchanged: frontend-only, no production data writes, no schema/RPC/policy edits, no deployment. Phase 1 remains open pending CI and auth/session-race acceptance plus real reviewed/published content.


## Active frontend-only status refresh — 2026-10-21

- This file's older notes that make real published content/backend readiness a prerequisite for frontend completion are superseded. The user's current milestone is to **finish the entire frontend Phase 1 first**. Do not perform backend changes, production writes, migrations, or deployment. Mocked fixtures are valid for frontend acceptance; content empty states must remain truthful.
- Latest source HEAD: `c119e0e6af1a52da1811e6fa66d102cf1d2fdced`. The previous E2E had 38 passed and 4 failed due to two route-matcher mistakes in test fixtures. Both were corrected in `tests/e2e/smoke.spec.ts`.
- Verify run `39607769410` and E2E run `39607769274` were pending at update time. Poll before declaring the fix verified.
- Phase 1 remains OPEN. Immediate next step: validate CI on the exact HEAD, then finish the remaining auth/session, dashboard, workspace, and CBT frontend acceptance checks.


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

- Repository HEAD at inspection: `869a00d8d21243a978a5cb7b580e85c54992e6e1` on `main`.
- Verify push run `39610640949` completed successfully on this exact SHA. Typecheck, production build, parser/contract tests, Deno checks, and disposable PostgreSQL migration/policy tests passed.
- ACE JAMB E2E push run `39610640807` targets the same SHA. Its typecheck/build steps passed; Playwright browser tests were still running at the last poll. E2E must remain PENDING until the run's final conclusion is retrieved.
- The added auth-session race test is present on main but has not yet been confirmed by a completed Playwright run. No production data, Supabase schema, or deployment changes.
- Next: poll run `39610640807`; if successful, continue remaining frontend acceptance gaps including password-recovery callback and CBT resume/results recovery where not covered, with E2E after source changes. Phase 1 remains OPEN.


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

## Phase 2 continuation — missing student-preferences row hardening (2026-10-21)

- Fixed `getStudentPreferences()` in `src/lib/studentService.ts` to treat a missing preferences row as a valid first-use state (`maybeSingle()` plus safe defaults), instead of throwing and preventing the Account Settings form from loading.
- Existing `updateStudentPreferences()` already uses an authenticated `upsert`, so saving can create the row without a schema migration.
- Verification: GitHub write succeeded; no typecheck/build/Playwright execution was available in this step. Regression test and runtime verification are still required. This does not close Phase 2.
- No live database mutation, schema change, deployment, or service activation was performed.
- Next: add a Playwright regression for missing preferences, then run typecheck/build/E2E when a runner or local environment is available.

## Phase 2 continuation — missing-preferences regression coverage added (2026-10-21)

- Added a mocked Playwright regression in `tests/e2e/smoke.spec.ts` that exercises a prepared student's Account Settings when the `student_preferences` GET returns PostgREST's no-row response, then attempts to save daily study time through the existing preferences upsert path.
- All Supabase API traffic in this test is intercepted; it does not access production rows or credentials.
- Source and test writes were accepted by GitHub. The test has NOT been executed, and its behavior is not yet verified by Playwright. Typecheck/build/E2E remain unverified while runner-backed Actions execution is unavailable.
- Next action: run the targeted test and the full typecheck/build/E2E suite in a local checkout or when Actions runner capacity is restored; fix any real failures before closing Phase 2.

## Phase 2 continuation — admin authorization error sanitization (2026-10-21)

- `src/components/AdminFoundationGate.tsx` now returns generic recovery copy when the admin role/RPC check fails instead of rendering raw provider/database exception messages.
- Added a mocked Playwright regression in `tests/e2e/smoke.spec.ts` that makes `rpc/is_admin` return a private-looking database error and asserts that the admin access screen does not expose it.
- Commits: `19f79805873f9e35218534a729bb536ceae08647` (source), `2e5947e85690c603cf9a0fc3024cd226f265480d` (test).
- Verification status: GitHub write/read-back is the only verification available in this session. Typecheck, build, and Playwright were not run. GitHub Actions monthly usage was reported exhausted; do not spend/retry runner jobs until capacity is restored or a local checkout is available.
- No production database/schema changes, live data writes, or deployment.
- Phase 2 remains OPEN. Backend-dependent delivery/payment/referral/AI/audio features are not implemented by UI status cards and must stay unavailable until real server-side contracts exist.
- Exact next action: when a local checkout or runner capacity is available, run `npm run typecheck`, `npm run build`, and `npm run e2e`; fix failures on the exact current `main` SHA, then complete the remaining frontend acceptance matrix before closure.


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


## Current Phase 2 runner status — 2026-10-23
- Current main HEAD observed: `0cf9fe0aae55a5f7a907a09503dc239d63d89598` (the documentation-only current-handoff commit follows this observed HEAD).
- Verify run `39810652243` passed, including typecheck, build and reported Node/Deno/SQL checks.
- E2E run `39810652048`, job `119935661138`, failed before steps started (`steps: []`, no runner assigned). No Playwright assertions executed; exact runner-start cause is unconfirmed. User previously reported Actions billing/spending restrictions, which should be checked rather than assumed as confirmed for this job.
- Phase 2 remains OPEN pending actual Playwright desktop/mobile and deployed-flow acceptance. No application source, database rows, migrations or deployment changed in this investigation.
- Next action: inspect job annotations, get a runner to execute E2E on current main, review results for student navigation/settings, admin access and PWA, fix reproducible defects, then record actual run IDs. See `docs/FRONTEND-PHASE-2-CURRENT-HANDOFF-2026-10-23.md` for the current concise status and anti-drift instructions.

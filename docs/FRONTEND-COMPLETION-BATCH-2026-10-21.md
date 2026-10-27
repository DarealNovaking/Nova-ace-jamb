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


## E2E fixture fixes verified — 2026-10-23

- Source/test fix commit: `1763de8ad72a2c486907a7643ea3865fdbd5a0ea`.
- Verify #706 / run `39963740781`: PASS. Node tests, Deno checks, typecheck, build and disposable PostgreSQL migration/policy tests passed.
- ACE JAMB E2E #639 / run `39963740632`: PASS. Playwright passed on the current source-fix commit after correcting the admin count-query wait/headers and isolating the missing-preferences test to the Account Settings component rather than the onboarding gate.
- No backend, database, migration, deployment or production data change. CI is mocked-contract coverage; provider-dependent payment, referral, AI, audio, notification delivery and production deployed acceptance remain unverified.
- Phase 2 remains OPEN. Next: read-only acceptance of existing student/admin/mobile routes and PWA cache behavior, then reconcile the remaining acceptance matrix and report any genuine blockers.


## Read-only frontend acceptance review — 2026-10-23

- Re-read `public/sw.js`: same-origin GET-only; excludes auth, REST, functions, storage, realtime, API and worker-script paths; network-first navigation falls back only to the static app shell; only Vite `/assets/` files are cached. No account/payment/CBT response data is cached.
- `playwright.config.ts` confirms Desktop Chrome and Pixel 5/mobile Chromium. Verify #706 and ACE JAMB E2E #639 passed on source-fix commit `1763de8`.
- Repository search did not find a configured Cloudflare Pages, Vercel or Netlify frontend URL. Because app deployment remains explicitly out of scope, deployed-browser acceptance is BLOCKED/UNVERIFIED until an already-existing approved URL is available; no deployment was attempted.
- No new source defect established. Whole-product frontend completion remains open; live provider-dependent delivery/payment/referral/AI/audio/notification behavior and production content availability are not proven by mocked CI.
- Next action: continue the remaining frontend acceptance matrix using source and CI evidence; perform live browser acceptance only if an existing approved URL is documented/provided. Do not deploy or change backend state.


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


## Phase 3 — keyboard focus continuity update (2026-10-23)

- Workspace focus management in `StudentStudyWorkspace.tsx` (`58e52bad51ed4d166870f9f5504ad0f9fb1a0bd1`) and dashboard return focus in `StudentDashboard.tsx` (`ec0b879572fe247eb8dc6cd1bcb0b2d7beb55fc3`); Playwright assertions in `smoke.spec.ts` (`a88473b4d14e29ca9f509470219fecaafb274435`).
- E2E #729 and Verify #796 for latest test commit were pending at the last check; earlier E2E runs #727/#728 passed typecheck/build but remained installing Playwright browsers. Do not mark focus regression verified until #729 passes. [E2E #729](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39977298929) · [Verify #796](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39977298869).
- No backend/database/deploy/catalogue changes. Next action: check terminal CI, then continue CBT keyboard audit and measure bundle composition.


## Phase 3 accessibility and focus regression — CI verified — 2026-10-23

- The latest source/test state is included in [ACE JAMB E2E #733](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39977545982): **PASS, 66 Playwright tests, 0 failures, 42.3 seconds**. The run includes the CBT loading/error semantics, `aria-pressed` answer state, and workspace/dashboard focus assertions. Typecheck, build, Playwright browser installation and browser tests all passed on the run.
- [Verify #800](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39977546055): **PASS**, both `verify` and `utme-subject-choice-migration` jobs succeeded for the same documentation HEAD, which includes all source/test changes.
- Older E2E #729 remained stalled at browser installation when checked; the later E2E #733 on the latest full source/test ancestry completed successfully. Treat #733 as the current successful evidence.
- Build still emits Vite's >500 kB minified chunk warning. A completed build from the same source family previously showed the main JS at **563.22 kB minified / 153.84 kB gzip**; no bundle splitting or dependency changes have been made. Build time in #733 was 3.80 seconds.
- **Accessibility slice status:** implementation and automated regression coverage PASS. Manual keyboard-only and screen-reader verification remains unperformed; this CI is not a substitute for manual assistive-technology review.
- **Next action:** inspect the app's static route imports and the existing build output to identify a minimal code-splitting opportunity that reduces initial student download without changing behavior. Keep backend/database/deploy/catalogue out of scope; verify the change with typecheck/build/E2E and update this checkpoint again.


## Whole-product frontend scope audit — 2026-10-27

**Decision: the entire frontend is NOT complete. Do not start the backend milestone yet.** This audit uses the retained mission in Sections 2 and 41, the canonical 16-batch plan, the full-product frontend batch, Phase 2/3 handoffs, the actual `main` source tree, CI on the audited SHA, and read-only live Supabase evidence. Phase 3 being closed means the bounded implementation/hardening sprint was closed; it does not override the explicit whole-product frontend scope.

### Repository and automated verification
- Audit base: `main` at `4283560e7af5174bc269a64f0b29f3ba79d3363b` (`docs: refresh checkpoint and clarify frontend completion`).
- Verify run [40419060651](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40419060651): PASS on that exact SHA.
- ACE JAMB E2E run [40419060619](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40419060619): PASS on that exact SHA.
- These CI workflows verify repository contracts and mocked Playwright journeys, not the existence of real content or operational payment/AI/audio/notification providers.
- Owner-reported acceptance remains PASS at the reported level for keyboard navigation, TalkBack smoke test, performance/recovery, PWA/offline/recovery, and Cloudflare deployment alignment. The deployed Cloudflare SHA has not been independently read back.

### Whole-product frontend acceptance matrix

| Capability / batch | Current evidence-based state | Verdict |
|---|---|---|
| Authentication, session restore, recovery, onboarding, profile and required subject selection (1) | Existing flows/components and mocked Playwright coverage; latest CI green. Live end-to-end account/provider delivery is not established by mocks. | Implemented; automated contracts pass; live acceptance partial |
| Dashboard, workspace navigation, URL/history and account settings (2) | Existing student dashboard, account settings, query-backed workspace navigation, retry/empty/error handling. | Implemented; CI covered |
| Syllabus browsing and lesson learning (3) | Syllabus/topic UI and truthful unpublished states exist, but lesson body/learning-content experience is a placeholder. | Partial |
| Standard practice, weakness/speed/mistake/repeated-mistake/adaptive/readiness modes (4) | Practice shell and CBT entry exist. Specialized practice cards are informational placeholders rather than working mode-specific flows. No published questions exist. | Partial / content and behavior incomplete |
| CBT/mock attempt flow (5) | Persistent CBT flow covers start/resume/save/expiry/retry/submission/result restoration in mocked tests. Live `ace.questions=0` and `ace.attempts=0`. | Flow implemented; real content/runtime acceptance blocked by absent data |
| Quick revision and flashcards (6) | Quick revision lists topic metadata rather than reviewed revision materials. Flashcards screen is a static empty-state placeholder; no flashcard fetch/reveal/review UI or frontend service exists despite existing `ace.flashcards`/`ace.flashcard_reviews` contracts. | Incomplete |
| Study schedule, saved stats, readiness and adaptive recommendations (7) | Current study-plan component saves daily minutes and preferred days only. It explicitly does not generate a schedule. No study plans/items or learning progress exist; no complete readiness/adaptive recommendation experience. | Partial / incomplete |
| Audio learning and playback (8) | Student dashboard shows an unavailable-state card. No player, playback progress, transcript control, or audio service/content exists. | UI stub only; full UI depends on content/service |
| Grounded AI tutor, diagnosis, explanations and generated practice (9) | Honest unavailable-state card only; no tutor conversation UI/service boundary. No knowledge sources/chunks or AI requests; no AI request Edge Function was found. | Incomplete; secure provider/retrieval dependency |
| Community/channel (10) | Onboarding-to-channel CTA exists and does not falsely claim membership verification. No server-verifiable membership or approved group-mapping contract. | CTA implemented; verification/routing incomplete and contract-blocked |
| Student notifications, announcements and push (11) | Student inbox/read-state/preferences UI exists. No delivery/scheduling/push function or admin announcement composer/scheduler exists. | Partial |
| ACE Pass, payment, entitlement, referral qualification/rewards (12) | Read-only account status/history/referral UI exists; checkout is deliberately disabled. No payment/referral/entitlement activity or server verification workflow exists. | Partial; operational flow contract-blocked |
| Admin command center (13) | Admin role gate and read-only operational metrics exist. The full student/account, moderation, rights/takedown, content/question review, media, payments, referrals, notifications, AI knowledge and audit operations are not implemented as a complete command center. | Partial |
| Academic administration and content publication safeguards (14) | Academic workspace supports syllabus version/topic/subtopic authoring and rights/status safeguards. No full question authoring/review/publish workflow is evidenced. | Partial |
| Shared design system, responsive mobile UX, accessibility and PWA/offline/cache safety (15) | Existing responsive UI, skip links/status semantics, PWA/service-worker tests and CI coverage. Owner-reported device checks passed; exact live source SHA and exhaustive device/screen-reader acceptance are not independently verified here. | Implementation/automated coverage present; manual evidence owner-reported |
| Full route/role regression, Playwright, typecheck/build, integration/security and release readiness (16) | Verify and E2E pass on audit base SHA. Live provider/content integrations and deployed SHA remain outside those tests. | CI gate passes; whole-product release gate does not |

### Read-only live Supabase evidence — 2026-10-27
Project `nova-ace-jamb` (`uokiqlgmzprqfbzmedaz`). A read-only SQL query returned:
- Academic content: subjects 25; exam seasons 2; exam configs 1; syllabus versions 50; topics 0; subtopics 0; questions 0; attempts 0.
- Learning: flashcards 0; flashcard reviews 0; study plans 0; study-plan items 0; learning-progress rows 0.
- Notifications and access: notifications 0; products 1; payment providers 1; payments 0; entitlements 0.
- Referrals: referral codes 5; referrals 0; referral campaigns 0; referral rewards 0.
- AI: providers 2; requests 0; knowledge sources 0; knowledge chunks 0.
- Catalogue context only: institutions 791; programs 0; programme UTME rules 0. The catalogue/importer UI remains retired by explicit product direction; this finding does not reopen catalogue work.
- Active Edge Functions listed: `catalog-import` and `ibass-catalog-stage` only. No dedicated AI request, payment verification/webhook, referral qualification, notification delivery, audio delivery, or channel-membership verification function was listed.

No database/schema/RPC/Edge Function changes, production-data writes, or deployment occurred during this audit. All live checks above were read-only.

### Scope and next action
- Keep the project on `main`; do not switch to backend implementation yet.
- Continue the canonical frontend batches with real existing contracts and truthful unavailable states; do not fabricate JAMB content or claim provider behavior.
- **Next concrete action:** implement the missing functional flashcard deck/reveal/review UI against the existing `ace.flashcards` and self-scoped `ace.flashcard_reviews` tables, add mocked Playwright coverage for empty/error and successful review paths, and verify it with CI. Then continue the remaining frontend gaps in the canonical 16-batch order.
- Backend milestone remains unauthorized until the whole-product frontend acceptance matrix is complete or the owner explicitly accepts named frontend items as backend-dependent exceptions.


## Frontend batch 6 — flashcard review UI implementation — 2026-10-27

- Implemented on `main` in application commit `cd495e4685e7629c5d6342c55e7ae5b6b4cbe2a2`.
- Added `src/lib/flashcardService.ts`: reads active cards for the authenticated student's selected subjects plus general cards; reads only the current user's review rows; saves review history through the existing `flashcard_reviews` composite key and self-scoped RLS policy. The UI never invents cards or writes to other users' progress.
- Added `src/components/StudentFlashcards.tsx`: loading, error/retry, honest empty, randomized deck, answer reveal, recall / needs-practice response, saved review status, per-card progress and completion/restart states.
- Wired the component into `src/components/StudentStudyWorkspace.tsx`.
- Updated `tests/e2e/smoke.spec.ts`: empty-state assertion plus Playwright cases for revealing a real fixture card and persisting a review, and for a recoverable load error/retry.
- **Verify run 40419868322:** PASS on the exact application commit (TypeScript typecheck, build and repository verification workflow).
- **ACE JAMB E2E run 40419868321:** NOT YET VERIFIED. The job reached Typecheck PASS and Build PASS, then remained at “Install Playwright browser”; the browser tests had not started at the last check. Attempting to retrieve the in-progress job log returned GitHub `404 BlobNotFound`, so this is a runner/browser-install blocker, not an app-test failure. Do not report E2E as passed or failed until the run reaches a terminal result.
- Read-only schema/RLS checks confirmed `ace.flashcards.active` supports public reading of active cards and `ace.flashcard_reviews` has a primary key on `(user_id, flashcard_id)` plus self-only authenticated RLS. Live flashcards/reviews are both currently 0 rows; all UI behavior is tested with mocked Playwright fixtures. No live rows were inserted or changed.
- No backend/schema/RPC/Edge Function change, deployment, or production-data write was made.
- **Exact next action:** recheck E2E run 40419868321. If it remains stalled, inspect and resolve the browser-install/runner path using fresh evidence; then record the terminal E2E result before moving to the next frontend batch.



## Frontend Batch 6 — due-first flashcard revision and history coverage — 2026-10-27

- Follow-up implementation is on `main`, code/test commit `02930d58f3ed87942d11f6acc08c48e8f28b5b29`.
- `StudentFlashcards.tsx` now randomizes cards within priority groups and presents cards with no/expired/invalid next-review dates before future-scheduled cards. Invalid stored dates fail safely into the due group.
- Flashcards receive published syllabus topics from the student dashboard and show subject/topic/subtopic mapping when available. Each card exposes saved review count, recalled count, next-review date and a screen-reader-labelled deck progress bar.
- `tests/e2e/smoke.spec.ts` now covers due-first ordering, topic mapping, future-scheduled review history, review saving, honest empty state and recoverable loading error/retry.
- Verification on source/test commit `ff172394824e4a380f692da42ed5947536c5f737`: Verify [40421059429](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40421059429) PASS, including typecheck/build and repository verification. The latest date-parsing robustness patch was then committed as `02930d58f3ed87942d11f6acc08c48e8f28b5b29`; Verify [40421139598](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40421139598) and E2E [40421139647](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40421139647) were still running when this handoff update was prepared.
- Read-only Supabase inspection remains unchanged: `ace.flashcards` and `ace.flashcard_reviews` have zero live rows. All browser cases mock Supabase requests; no live data was changed.
- No backend/schema/RPC/Edge Function changes, deployment, or catalogue work.
- **Batch 6 acceptance:** implementation and focused test coverage are present; final E2E acceptance remains pending the latest workflow's terminal result.
- **Exact next action:** check runs 40421139598 and 40421139647, fix any reproducible failures, and only then mark Batch 6 accepted.


## Batch 6 E2E failure analysis and test-fixture correction — 2026-10-27

- E2E run [40421139647](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40421139647) failed with 78 passed / 4 failed. The four failures were two tests each on desktop Chromium and mobile Chromium.
- Root cause 1: the preparation workspace H1 and flashcard component H2 both had the exact accessible name “Flashcards”, making a broad Playwright heading locator violate strict mode. The component H2 now reads “Your flashcard deck”, and tests target the workspace H1 explicitly.
- Root cause 2: the transient-error fixture failed only one of two parallel flashcard requests; the fixture now fails both initial requests, then returns empty responses on retry. This tests the intended error/retry state deterministically.
- Correction commit: `b7b387cc3772e8be481573b687b19d17c826b08b`. Fresh Verify run [40421619735](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40421619735) and E2E run [40421619724](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40421619724) were queued at this update. No new E2E pass is claimed.
- No live data, schema, backend functions or deployment changed.
- **Exact next action:** inspect the new CI runs, fix any further reproduced failure, then record the terminal outcome and close Batch 6 only when E2E passes.


## Batch 6 retry-fixture follow-up — 2026-10-27

- The first E2E failure was corrected for duplicate accessible headings; that correction worked. E2E [40421619724](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40421619724) then reached **80 passed / 2 failed**, both instances of the same flashcard load-error/retry test across Chromium desktop/mobile.
- The second fixture adjustment, “fail the first two parallel requests,” remained nondeterministic because the app may mount/reload before the user-initiated retry. The latest fixture instead keeps all flashcard requests at 503 until the test explicitly sets `allowFlashcardSuccess = true` just before clicking Retry.
- Latest code/test commit: `5e50ad3911dca56752486889b78ae1b3815edbfa`. Verify [40422034609](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40422034609) and E2E [40422034652](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40422034652) were queued when this update was prepared.
- No production data, schema, backend functions or deployment changed.
- **Exact next action:** wait for the latest CI result, inspect any new E2E failure evidence, and close Batch 6 only when the complete Playwright suite passes.


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

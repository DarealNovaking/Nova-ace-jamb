# Frontend Phase 3 — Current Handoff (2026-10-23)

## Current status
**IN PROGRESS — first accessibility slice committed and CI-verified.**

## Canonical project and scope
- Repository: `DarealNovaking/Nova-ace-jamb`
- Branch: `main`
- Current source/test commit: `667085dea853f4c30ed9b639259ab593304305ed` (corrected E2E fixture; CI pending). Documentation commits continue after this source/test commit.
- Phase 2 is closed for the authorized frontend-only scope; Phase 3 now owns the carried-forward frontend-auditable work.
- User boundary: frontend only. Do not deploy, alter backend/database/production data, restore catalogue UI, or invent JAMB content/provider results.

## First implementation slice
- `src/components/StudentDashboard.tsx`: initial loading main landmark now has `id="main-content"` and `aria-busy="true"`; loading text is exposed through polite atomic `role="status"`; decorative spinner is hidden from assistive technology. Home dashboard main landmark also uses `id="main-content"`.
- `tests/e2e/smoke.spec.ts`: added deterministic test that delays the mocked profile response, asserts the loading announcement, releases the response, and confirms the prepared dashboard renders.
- Source commit: [a506726](https://github.com/DarealNovaking/Nova-ace-jamb/commit/a50672679b4e70a307e52ed86f29c015e1f01574)
- Test commit: [90459bc](https://github.com/DarealNovaking/Nova-ace-jamb/commit/90459bc9eb64ad17f1f4df125cdc9449f48ded5b)

## Verification
- The last verified source/test snapshot before Phase 3 was `85a4b5b1aed59b8d5bfb3e7c09de53d873cdb9af`: Verify #740 PASS and E2E #673 PASS (64 Playwright tests, 0 failures).
- The new Phase 3 commits are **not covered** by those old results. E2E #694 passed for source commit `a506726`; E2E #695 failed for test commit `90459bc` because the test delayed `profiles` before the student gate mounted the dashboard. The test now delays dashboard-only RPC `get_active_exam_blueprint` in commit `667085d`.
- E2E #694 passed but is E2E-only; E2E #695 failed due to the test fixture described above. Corrected commit `667085d` passed E2E run #703 (66 tests / 42.4s). The Verify workflow's `verify` and `utme-subject-choice-migration` jobs also passed for the same commit. Typecheck/build steps were present in the successful E2E job, but detailed output was not extracted.
- Tests continue to use mocked Supabase contracts; they do not establish live content/provider behavior.

## Remaining Phase 3 priorities
1. Check CI for the source/test commits; diagnose any actual failures and rerun on current source.
2. Audit student workspace, CBT controls, forms, async states, keyboard focus and semantic landmarks. Add targeted regression coverage for each confirmed gap.
3. Measure the Vite chunk composition before deciding on a bundle optimization; prior build warning was approximately 916 kB minified. Avoid speculative rewrites.
4. Continue admin UX only where existing verified contracts support it.
5. Keep missing published content and missing payment/referral/AI/audio/notification delivery contracts honestly unavailable.
6. Manual keyboard/screen-reader review, real-device PWA/offline and low-end Android checks remain unverified. Live deployed-browser acceptance is out of scope because deployment is prohibited.

## Known debt carried forward
- Prior npm audit reported 8 vulnerabilities (2 moderate, 6 high); not remediated in this slice.
- Existing approximately 916 kB Vite chunk warning; not optimized in this slice.
- No backend/database/deployment/catalogue changes made.

## Exact next action
Proceed to the source-based keyboard/semantic audit of student workspace and CBT controls; inspect bundle composition before any optimization. Overall E2E and Verify jobs for `667085d` passed. Per-test desktop/mobile breakdown was not extracted; manual screen-reader/device acceptance remains unverified. Do not deploy.


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


## Keyboard focus continuity update — 2026-10-23

- `StudentStudyWorkspace.tsx` commit `58e52bad51ed4d166870f9f5504ad0f9fb1a0bd1` focuses the workspace heading on mount/mode change. `StudentDashboard.tsx` commit `ec0b879572fe247eb8dc6cd1bcb0b2d7beb55fc3` restores focus to the dashboard heading on return. Playwright assertions were added in `smoke.spec.ts` commit `a88473b4d14e29ca9f509470219fecaafb274435`.
- E2E #729 and Verify #796 for `a88473b` were pending at last inspection. E2E #727/#728 had passed typecheck/build but remained in Playwright browser installation. Treat focus behavior as implemented but not yet E2E-verified. [E2E #729](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39977298929) · [Verify #796](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39977298869).
- Several push-triggered E2E runs were active at browser installation. This is an observed CI bottleneck, not a confirmed code failure. No reruns or cancellations. No deployment/backend/database/catalogue work.
- Next: inspect #729/#796 until terminal, fix only confirmed failures, then continue CBT keyboard review and bundle measurement.


## Phase 3 accessibility and focus regression — CI verified — 2026-10-23

- The latest source/test state is included in [ACE JAMB E2E #733](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39977545982): **PASS, 66 Playwright tests, 0 failures, 42.3 seconds**. The run includes the CBT loading/error semantics, `aria-pressed` answer state, and workspace/dashboard focus assertions. Typecheck, build, Playwright browser installation and browser tests all passed on the run.
- [Verify #800](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39977546055): **PASS**, both `verify` and `utme-subject-choice-migration` jobs succeeded for the same documentation HEAD, which includes all source/test changes.
- Older E2E #729 remained stalled at browser installation when checked; the later E2E #733 on the latest full source/test ancestry completed successfully. Treat #733 as the current successful evidence.
- Build still emits Vite's >500 kB minified chunk warning. A completed build from the same source family previously showed the main JS at **563.22 kB minified / 153.84 kB gzip**; no bundle splitting or dependency changes have been made. Build time in #733 was 3.80 seconds.
- **Accessibility slice status:** implementation and automated regression coverage PASS. Manual keyboard-only and screen-reader verification remains unperformed; this CI is not a substitute for manual assistive-technology review.
- **Next action:** inspect the app's static route imports and the existing build output to identify a minimal code-splitting opportunity that reduces initial student download without changing behavior. Keep backend/database/deploy/catalogue out of scope; verify the change with typecheck/build/E2E and update this checkpoint again.


## Route-splitting experiment — 2026-10-23

- `src/main.tsx` commit `9438d852bc2f8b52197c9b120abb354295945862` uses lazy imports for protected CBT, admin and academic-editor routes, with accessible Suspense loading feedback. Student entry remains eager.
- Previous verified build baseline: main JS `563.22 kB` minified / `153.84 kB` gzip. This change is intended to reduce initial download but has not yet been proven to do so. E2E #738 and Verify #805 were pending at the last check.
- Next: check CI and compare emitted chunk sizes. Keep or revert based on measured results, not assumption. No deployment/backend/database/catalogue changes.


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


## CBT timer and question-map accessibility update — 2026-10-23

- `PersistentCBT.tsx` commit `bc85cdc14928b1f9cec8fabffa3985fb665d1e75` exposes a named timer, associates answer choices with their question, and gives question-map buttons useful labels and `aria-current=step` for the active question.
- `smoke.spec.ts` commit `4ad0acef545eca041fd1d31fb6dc28a315569523` covers these semantics. E2E #749 passed with 66 tests on the source commit; Verify #816 and #817 passed. E2E #750 for the new assertions remained at browser installation when checked. [E2E #750](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/39979019310).
- Bundle after route/workspace splitting: main JS 506.86 kB / 142.10 kB gzip; >500 kB Vite warning remains. No deploy/backend/database/catalogue work.
- Next: inspect E2E #750 terminal result; then continue keyboard and screen-reader source review.


## Phase 3 accessibility follow-up — 2026-10-23

- Source commits: `341b40b317f7d08f804dbfb9808569b8f4c52e16` adds `aria-pressed` to selected verified-syllabus topic buttons in `src/components/StudentStudyWorkspace.tsx`; `417710238550ee0a537b4ef95e21152e20960000` adds a polite atomic status announcement while a CBT answer is being saved and explicit `type="button"` to CBT Previous/Next/Submit controls in `src/components/PersistentCBT.tsx`.
- Regression test commit: `9fcf5bcd1d05f9f8073c955e1815446e476b5305` delays the mocked `save_attempt_answer` response and asserts the save status is announced and cleared after the save. All test traffic remains mocked; no production data is accessed.
- **CI status at documentation time:** E2E #755 / Verify #822 were in progress on workspace source commit `341b40b`; E2E #756 / Verify #823 were queued on CBT source commit `4177102`; E2E #757 / Verify #824 were queued on test commit `9fcf5bc`. Do not treat this change as verified until the latest E2E and Verify runs complete successfully.
- No backend/database, catalogue, or deployment changes. Manual keyboard/screen-reader and real-device checks remain unverified.
- Next action: inspect CI for `9fcf5bc`; fix only reproducible failures. Then continue source-based audit and measure bundle composition from actual build output before optimization.

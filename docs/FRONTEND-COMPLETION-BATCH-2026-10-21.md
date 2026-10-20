# Frontend Completion Batch — 2026-10-21

## Objective
Complete the existing student-facing frontend as one coordinated milestone, reusing current React/Supabase architecture and preserving the resolved admin/student route behaviour. This document defines scope and acceptance gates; it does not claim the listed work is already implemented or tested.

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

## Current status
**BATCH DEFINED — IMPLEMENTATION NOT YET VERIFIED.** Repository inventory confirms existing component entry points, but a full component-by-component audit, code changes and automated test runs remain outstanding.

## Exact next action
Fetch and inspect the full source of StudentDashboard.tsx, StudentStudyWorkspace.tsx, StudentStudyPlan.tsx, StudentOnboarding.tsx, StudentFoundationGate.tsx, StudentAuth.tsx, PersistentCBT.tsx, ProtectedCBT.tsx, related service modules and existing tests. Then implement the highest-impact gaps found by source evidence, starting with the core student journey.

# ÑØVÃ ACE JAMB

A scalable, mobile-first JAMB preparation platform.

## Canonical source

The GitHub repository is the source of truth. The current frontend uses React, TypeScript, Vite and Supabase Auth/PostgreSQL. The database's `ace` schema is the authoritative source for student profiles, syllabus versions, questions, attempts, answers and progress.

## Student experience

- Email sign-up, sign-in and account recovery
- Preparation onboarding and saved profile/preferences
- Student dashboard and preparation navigation
- Syllabus workspace with publication and rights checks
- Practice and CBT attempts with server-authoritative answer saving/scoring
- Active-attempt recovery, timer expiry, submission retry and completed-result restoration
- Honest empty states when approved content is unavailable

## Administration

- `/admin` — administrator-only operations overview and academic workspace entry
- `/admin-academic` — authorized academic structure and syllabus version/topic authoring
- `/admin-import` — compatibility alias to the normal authorized admin dashboard; the retired catalogue importer is no longer exposed
- Draft content must remain unpublished until its source, rights and review status are approved.

## Current milestone status

**Phase 1 (frontend acceptance batches 1–5) and Frontend Phase 2 are closed for their verified/authorized scopes. Frontend Phase 3 is now in progress**, beginning with accessible loading feedback and regression coverage. The first Phase 3 accessibility slice is now CI-verified: E2E run #703 passed with 66 Playwright tests, and the Verify workflow's `verify` and `utme-subject-choice-migration` jobs passed on corrected source/test commit `667085dea853f4c30ed9b639259ab593304305ed`. CI verifies the frontend against mocked service contracts; it does not prove live content or provider integrations exist. Content-driven learning/practice/progress, payment/referral/AI/audio/notification delivery, expanded admin operations, manual accessibility and real-device PWA acceptance remain incomplete or unverified as recorded in the master handoff. Do not fabricate official JAMB content or present fixtures as production data.

The user has explicitly kept app deployment out of scope. Deployment workflows/configuration and the legacy AppDeploy entrypoint were removed; do not recreate or deploy the app unless the user explicitly reverses that instruction.

## Local development

Requirements: Node.js 20+ and npm.

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to the intended Supabase project values.
3. Install dependencies: `npm install`.
4. Start the local development server: `npm run dev`.

## Verification

- `npm run typecheck`
- `npm run build`
- `npm run e2e`

GitHub Actions also runs parser/contract tests and SQL policy/migration tests against disposable PostgreSQL. Playwright tests use mocked service contracts; they do not prove that production content exists.

## Security and content integrity

- Never place service-role keys or provider secrets in frontend environment variables.
- Keep authorization and scoring decisions server-authoritative.
- Publish only reviewed content with an approved rights status.
- Do not invent official syllabus records, UTME combinations, questions or answer explanations.


## Frontend Phase 3

Current work prioritizes accessible async feedback, keyboard/semantic navigation, measurable performance, and frontend UX improvements backed by existing contracts. See the master handoff and continuity checkpoint for current status. Do not deploy, modify backend/database state, revive catalogue UI, or fabricate JAMB content/provider outcomes.

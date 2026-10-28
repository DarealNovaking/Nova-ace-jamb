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

**ONE final completion batch, FCB-01 through FCB-12, is active.** The canonical remaining work and dependencies are in `docs/ACE-JAMB-MASTER-HANDOFF.md` under “FINAL MASTER COMPLETION BATCH — ALL REMAINING ACE JAMB WORK”. FCB-01’s audited security, migration and backend-contract baseline is verified complete. FCB-02 is in progress: its fixed-package administrator helper is installed, while the admin-panel release, actual content staging and rights/publication acceptance remain gated. The current source has 172 passing mocked desktop/mobile Playwright tests. Preserve compulsory English plus three subjects and catalogue-independent onboarding; no full-product completion is claimed. Current audit evidence: `docs/FCB-01-SECURITY-CONTRACT-AUDIT-2026-10-27.md`.

Production migrations, content publication, deployments and billable provider activation require explicit approval at their documented FCB gates. Legacy deployment assets were removed; no production deployment workflow is currently enabled in this repository.

## Local development

Requirements: Node.js 20+ and npm.

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to the intended Supabase project values.
3. Install dependencies: `npm ci`.
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

The verified frontend foundation is retained while the approved FCB programme continues. See the master handoff and continuity checkpoint for current scope and acceptance. Production changes and release remain subject to their specific approval gates; the retired catalogue UI stays retired, and official content/provider outcomes must never be fabricated.

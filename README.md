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

- `/admin` — administrator-only workspace for source/catalogue review
- `/admin-academic` — academic structure and syllabus version/topic authoring
- Draft content must remain unpublished until its source, rights and review status are approved.

## Current milestone status

**Phase 1 is still open.** The automated student journey suite currently passes, but the live database has no active approved syllabus versions, topics, subtopics, questions, flashcards or attempts. Do not fabricate official JAMB questions or present mock fixtures as production content. The question-rights publication migration is in the repository and covered by disposable PostgreSQL tests; the live database policy still requires an approved, controlled migration step.

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

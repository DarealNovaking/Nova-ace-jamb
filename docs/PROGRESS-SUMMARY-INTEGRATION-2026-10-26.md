# Progress screen: real attempt data (2026-10-26)

Selective integration from the Gemini archive (not a copy). Replaces the static Progress placeholder in `StudentStudyWorkspace` with a view driven by the student's own saved attempts.

## What changed
- `src/lib/progressSummary.ts`: pure summary logic. Counts only completed attempts with answered questions. No projections, forecasts or pace claims.
- `src/lib/practiceService.ts`: read-only `listPastAttempts` and `listStudentMistakes` (own rows only). Return `[]` on any error or non-array response.
- `src/components/StudentProgressSummary.tsx`: tiles (kept "Verified performance" / "Not available yet" empty state for the existing E2E test), per-subject accuracy, last 5 sessions, missed-question count with a practice button.
- `src/components/StudentStudyWorkspace.tsx`: progress mode renders the new component.
- `tests/progress-summary.test.mjs`: 3 node tests (run with `node --experimental-strip-types --test`). Not added to `verify.yml`.

## Deliberately NOT brought over
- `StudentAnalyticsMastery.tsx`: invented "UTME score forecaster" (accuracy x 400), a "Cloud Synced" badge based only on `navigator.onLine`, an "Offline Mode · Cached Data" label with no cache, and pace claims using `attempts.duration_seconds` (that column is the allowed exam time, not time spent).
- `questionService.ts`: admin question authoring writing many `ace.questions` columns not verifiable from repo migrations; no UI uses it.
- Gemini `main.tsx` banner, dummy-key `supabase.ts`, `package.json`, `HANDOFF.md`.

## Must verify before merge
1. `ace.attempts` and `ace.student_question_stats` are created outside the repo migrations. Confirm authenticated students have SELECT on their own rows (grant + RLS). If not, Progress safely stays on "Not available yet".
2. Run `npm run typecheck`, `npm run build`, `npm run e2e` (not run in the authoring environment).
3. Add an E2E case with mocked attempts rows to cover the populated state.

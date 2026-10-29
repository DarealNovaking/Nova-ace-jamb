# CSV question intake implementation plan

> For agentic workers: implement inline using superpowers:executing-plans; one fresh final review.

**Goal:** upload and validate CSV questions, then save private drafts through existing controls.
**Architecture:** pure CSV/validation module, bounded sequential intake runner, accessible import panel integrated into the existing question queue. Reuse existing syllabus and mutation services.
**Tech stack:** React/TypeScript, existing Supabase RPC, Node tests and Playwright; zero new dependencies.
**Spec:** docs/superpowers/specs/2026-10-29-question-import-design.md

## Global constraints

100 rows, 1 MiB, UTF-8 CSV. No publication, database migration or paid resources. No persistence of uploaded answers in browser storage. Existing independent review remains mandatory.

## Review focus

Quoted multiline/CRLF and hostile text must remain data. File read/context races must invalidate old previews. Partial saves must count only confirmed readbacks. Logout/unmount must prevent later writes. Invalid rows/duplicate stems must cause zero writes.

### Task 1: CSV contract and sequential intake

Files: src/lib/questionImport.ts; tests/question-import.test.mjs.
Interfaces: parseQuestionImport(text, taxonomy) returns numbered valid drafts/errors; runQuestionImport(rows, save, isActive, onProgress) returns per-row saved/uncertain/pending outcomes.

- [x] Write failing parser/limit/duplicate/source and stop/cancel tests; observe RED.
- [x] Implement strict bounded parser using validateQuestionDraft and sequential runner; observe GREEN.
- [x] Run all Node tests and commit.

### Task 2: import panel and browser flows

Files: src/components/AdminQuestionImport.tsx; src/components/AdminQuestionReviewQueue.tsx; reusable src/lib/questionTaxonomyService.ts if needed; tests/e2e/smoke.spec.ts.
Consumes numbered draft preview and runner from Task 1; produces existing guarded private draft saves.

- [x] Write failing browser tests for file preview, zero-write errors, confirmed/partial saves, template, session cancellation and responsive layout; observe RED.
- [x] Implement bounded upload, approved taxonomy controls, preview, explicit confirmation, progress and freeze-on-error behavior; observe GREEN.
- [x] Run typecheck/build, all Node tests and full desktop/mobile Playwright; inspect layout and commit.

### Task 3: review and continuity

- [x] Fresh independent review of final diff and spec; fix material issues with reproduced regressions.
- [x] Record owner workspace-open acceptance, actual checks and release state in checkpoint/master handoff.
- [x] Push isolated branch and prepare reviewable PR; request any required specific production release approval only after verified implementation is concrete.

# Question workflow implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task with test-first verification.

**Goal:** Deliver the secure text-question authoring/review/publication vertical slice of FCB-03.
**Architecture:** Fixed authenticated RPCs manage the existing question and history tables; existing administrator queue becomes an authoring workspace. Two-person approval and server-side validation precede publication.
**Tech Stack:** PostgreSQL, React, TypeScript, Supabase, existing Playwright and Node test tools.
**Spec:** docs/superpowers/specs/2026-10-29-question-workflow-design.md

## Global constraints
- No new client table privileges or student answer-key exposure.
- Production installation/release follows the owner’s standing approval after verified source; no content mutation, paid browser call or source-rights fabrication is implied.
- Preserve unrelated edits and FCB-01/02 acceptance.
- No new dependencies; reuse the existing schema and components.

## Review focus
- Concurrent role demotion, duplicate creation and stale revisions must fail safely.
- Blank, malformed, oversized, unknown-key and unsupported media input must be rejected.
- Taxonomy must belong to the active approved syllabus and match the question's subject.
- Reviewer must differ from author and last content editor; edits invalidate old approval.
- Failed snapshots/audits must roll back the content mutation; uncertain network results require reload.

## Task 1: Server lifecycle and full-schema tests
Files: supabase/proposals/fcb03_question_workflow.sql; tests/sql/fcb03_question_workflow.py; tests/sql/fcb03_question_workflow_runner.mjs.
Interfaces: ace.manage_question(text,uuid,integer,jsonb) returns the saved question; ace.review_questions(text,integer) returns paginated privileged rows.
- [x] Write isolated recovered-schema cases for authoring, transitions, denied access, bad content, taxonomy, immutable history, private student visibility, stale updates, duplicates and rollback.
- [x] Run against an inert stub and observe the expected missing mutation failure.
- [x] Implement the lifecycle and bounded privileged read RPCs without broad grants.
- [x] Run all cases locally; wire native PostgreSQL execution into CI with an empty disposable-database guard.

## Task 2: Existing administrator workspace
Files: src/components/AdminQuestionReviewQueue.tsx; src/lib/questionWorkflow.ts; src/lib/questionWorkflowService.ts; tests/question-workflow.test.mjs; tests/e2e/smoke.spec.ts.
Interfaces: call the exact RPCs from Task 1; typed validation/readback adapters; reuse subject/taxonomy services.
- [x] Add failing unit/browser cases for draft creation, validation, review transitions, stale/denied saves and recovery.
- [x] Implement accessible bounded editor, status filters and transition controls with loading/error/empty/success states.
- [x] Run Node tests, typecheck, build and desktop/mobile browser checks.

## Task 3: Review and continuity
- [x] Review the complete diff and fix reproduced blocking findings.
- [x] Save inventory, tests, remaining FCB-03 source/media/dataset requirements and exact next action in the handoff/checkpoint.
- [x] Publish PR18 for native CI; full FCB-03 completion and a populated question bank are not claimed. The tested guarded installer was subsequently applied under standing authorization and independently verified; editor release is next.

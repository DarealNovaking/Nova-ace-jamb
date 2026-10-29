# Student question delivery implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restore student question delivery through safe server boundaries without reopening question-table access.
**Architecture:** Existing attempt RPC plus two bounded metadata RPCs; pure typed parsers; current UI/callers preserved.
**Tech Stack:** React19/TypeScript/Supabase/PostgreSQL/existing Playwright.
**Spec:** docs/superpowers/specs/2026-10-29-student-question-delivery-design.md

## Global Constraints
No production SQL/data/role/session mutations or deployment without specific approval. No new dependencies. Preserve no-direct-question-table grants and frozen answer isolation.

## Review Focus
- Missing/extra/duplicate/private question readback must stop whole paper loading.
- Delivery failure must not create another attempt or fall back to the sealed table.
- Expired/withdrawn/other-owner attempts retain existing server refusals.
- Topic/progress mappings must use approved published taxonomy and self-tracked evidence.
- Empty metadata results differ from network/authorization failure.

### Task1: typed delivery and service wiring
**Files:** src/lib/studentQuestionDelivery.ts, cbtService.ts, practiceService.ts, PersistentCBT.tsx; tests/student-question-delivery.test.mjs.
**Interfaces:** validateAttemptQuestionRequest(attemptId,ids), parseAttemptQuestions(value,ids), parsePublishedQuestionIds(value,limit), parseStudentQuestionTopics(value,ids); loadCbtQuestions(attemptId,ids). Existing practiceService signatures retained.
- [ ] Add parser and real-service boundary tests against inert/missing behavior; observe RED.
- [ ] Implement complete typed validation and replace direct question reads with RPCs.
- [ ] Pass tests/typecheck/build and commit.

### Task2: proposal-only metadata RPCs
**Files:** supabase/proposals/fcb03_student_question_delivery.sql; tests/sql/fcb03_student_delivery.py; existing guarded question runner/CI integration.
**Interfaces:** published_topic_questions(p_subject_id,p_topic_id,p_subtopic_id default null,p_limit default20); student_question_topics(p_question_ids uuid[]).
- [ ] Add isolated SQL negative/positive cases; observe RED with inert/missing functions.
- [ ] Implement identity/owner/isolation/limits/taxonomy/rights/self-stat guards, narrow output and grants; pass existing85sequential+6native races plus new cases.
- [ ] Record exact live existing endpoint/grant preflight; do not modify production.

### Task3: browser/regression and reviewable release
**Files:** tests/e2e/smoke.spec.ts; both canonical handoffs; evidence/release package.
- [ ] Update synthetic fixtures to real RPC transport, keep all production traffic intercepted; add direct-table-denial, exact attempt scope and malformed/missing/withdrawn delivery cases.
- [ ] Complete full desktop/mobile CI, Node/typecheck/build and independent review; fix material findings.
- [ ] Update source/evidence/handoffs and prepare exact two-function installation + deployment approval; no content publication. Rich/media/moderation remain open.

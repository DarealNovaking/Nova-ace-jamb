# Question history implementation plan

> Execute inline with superpowers:executing-plans and one independent final review.

**Goal:** bounded private history and auditable restoration into a fresh draft.
**Architecture:** two guarded RPCs wrap existing immutable snapshots and manage_question; typed service/parser and one review-queue panel.
**Stack:** current React/TypeScript/Supabase/PostgreSQL; no new dependencies.
**Spec:** docs/superpowers/specs/2026-10-29-question-history-design.md

## Constraints and review focus

Ten snapshots/page. Required reason ≤2000 characters. No publication/role change or real-profile signout. No direct table grants. Restore always creates a new draft revision. Verify stale role/row denial, arbitrary snapshot fields/media, audit atomicity, cursor readback, unmount and bounded rendering.

### Task 1 — guarded SQL history/restore

- [ ] Add failing disposable SQL history cases and observe RED.
- [ ] Implement proposal-only functions and pass PGlite cases.
- [ ] Include original cases plus two new native contention tests in the existing guarded disposable CI job.

### Task 2 — typed history UI

- [ ] Add failing strict parser and browser regressions.
- [ ] Implement typed service/parser and accessible bounded history panel; integrate queue mutual exclusion.
- [ ] Verify Node/typecheck/build and full desktop/mobile suite; inspect screenshots.

### Task 3 — evidence and content intake

- [ ] Record both genuine read-only session checks, budget evidence and preserve-signin instruction.
- [ ] Verify exact reference edition/rights evidence where retrievable; prepare a small clearly attributed practice intake without production publication.
- [ ] Independent final review, fix material defects, update checkpoint/master handoff, push reviewable source and exact approval boundary.

# 2026 practice draft implementation plan

> For agentic workers: use executing-plans inline; the owner already authorized proceeding without repeated planning questions.

Goal: create exactly the reviewed inactive 2026-format practice configuration in the preparation season.
Architecture: one fixed-payload administrator RPC with check/create actions, one admin-only panel, no broad grants and no activation. Reuse existing composition guard and validator.
Tech stack: PostgreSQL/Supabase, React/TypeScript, existing native SQL and Playwright runners.
Spec: docs/FCB-02-2026-BASELINE-DECISION-2026-10-29.md and its exact JSON candidate.

Constraints: 7200 seconds, 180 questions, 4 options, English60 plus three40;25subjects; target2027draft; source2026; null official dates; no rights/publication changes. Historical config stays unchanged.
Review focus: denied actors; snapshot drift/active or conflicting records; atomic failure/replay; concurrent demotion/configuration writes; uncertain browser response and no automatic writes.

- [ ] Task1: write real SQL tests and observe missing behavior RED with an inert stub. Implement fixed check/create RPC in supabase/proposals/fcb02_2026_practice_draft.sql. Verify authorization, drift refusal, creation, replay, rollback, privacy, source and season preservation; wire native CI and verify local PostgreSQL-compatible cases.
- [ ] Task2: write browser tests for explicit create, denial/error/retry and editor exclusion; observe RED. Implement AdminPracticeBaseline using existing authenticated RPC. Check readback before success, sanitize errors, require check after uncertain write, prevent duplicate in-flight submissions.
- [ ] Task3: typecheck/build/full existing Node/SQL/browser CI; independent bounded security review. Install exact reviewed RPC, publish verified frontend, then genuine-admin create gesture and independent SQL readback. Update both handoffs with actual evidence and unresolved content gates.

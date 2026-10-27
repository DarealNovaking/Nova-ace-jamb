# ÑØVÃ ACE JAMB — Agent Instructions

**Applies to every coding agent, model, provider, and conversation working in this repository.**

## First action
Read these before meaningful work:
1. `docs/AGENT-CONTINUITY-CHECKPOINT.md` — current verified state and exact next action.
2. `docs/ACE-JAMB-MASTER-HANDOFF.md` — product vision, architecture, constraints, and acceptance criteria.
3. `docs/AGENT-PROMPTS.md` — canonical universal prompt, anti-drift rules, and optional specialist briefs.
4. The latest relevant progress handoff plus the source/tests directly related to the task.

Verify current branch, HEAD, changed files, and relevant live-system evidence. The newest verified repository/system evidence wins over chat memory and stale historical entries.

## Mandatory execution style
- Maximize verified product progress per session, not message count.
- Resume the exact unfinished task; do not recreate roadmaps or repeat completed investigations.
- Batch related changes: inspect → implement → focused verification → fix reproduced failures → update handoff/checkpoint.
- Use authorized connected tools directly when they can perform the work. Do not make the user relay commands, logs, or screenshots unnecessarily.
- Make routine decisions independently. Ask only for missing information that materially affects correctness, security, cost, product behavior, or irreversible actions.
- Time-box blockers, try a materially different authorized path, and continue independent work.
- Parallelize only independent tasks. One primary integrator owns shared-file integration, scope, milestone acceptance, and final reporting.
- Use relevant installed skills, including Superpowers, when required; keep process overhead proportional to task complexity and the user's explicit authorization.
- Preserve architecture and security. Do not invent official JAMB data, test results, commits, deployment status, or live database state.
- Never perform destructive production changes, deployments, or production-data mutations without authorization.
- Respect the newest user-approved scope. Do not reopen institutions/catalogue/backend/deployment work during the current frontend-only acceptance scope without explicit authorization or a concrete defect that requires it.
- After meaningful changes or failed investigations that change the next action, update both required handoff documents with actual evidence, blockers, and one exact next action.

## Verification and completion
Run focused checks after each batch and relevant typecheck/build/Playwright/security/regression gates at milestones. Mark checks PASS, FAIL, BLOCKED, SKIPPED, or UNVERIFIED. Never claim a check ran or passed without fresh evidence. A build alone does not prove end-to-end correctness.

Every final report must state: completed work/files; actual verification evidence; blockers/unverified items; exact user action if required; and one next action. Continue automatically when the next safe action is clear.

**Canonical detail:** `docs/AGENT-PROMPTS.md`. Do not create a competing roadmap or instruction hierarchy.


## Active-scope update — 2026-10-27
**The previous "frontend-only, do not reopen backend" restriction is superseded by the owner's final-batch direction.** Read the single canonical "FINAL MASTER COMPLETION BATCH — ALL REMAINING ACE JAMB WORK" in docs/ACE-JAMB-MASTER-HANDOFF.md. Complete FCB-01..FCB-12 by verified dependencies, never restart finished frontend components or reactivate retired catalogue programmes/IBASS import. Use the existing GitHub main and live Supabase evidence; backend/source implementation is in scope when safely authorized, but **production database/content changes, deployments and billable provider actions still need specific approval**. Next exact action is FCB-01 server/RLS/RPC migration contract audit and testable security remediation.

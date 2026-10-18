# ACE JAMB — Multi-Agent Continuity Protocol

**Purpose:** Let any AI agent or human continue safely after a usage limit, tool switch, new chat, or handoff—without relying on chat history or repeating investigations.

## Sources of truth (in order)

1. **GitHub repository state** — actual code, migrations, tests, branches, and commits.
2. **`docs/ACE-JAMB-MASTER-HANDOFF.md`** — product intent, architecture decisions, current status, risks, and next milestone.
3. **This protocol + the latest dated progress handoff** — exact working checkpoint and safe next action.
4. Chat transcripts — supporting context only; never override current repo/database evidence.

Do not assume a prior agent's claims are correct. Verify them against the current repository and live systems before acting.

## Required start procedure for every agent

1. Confirm repository, branch, latest commit, working tree state (when available), and open PRs.
2. Read this file, the master handoff, and the latest progress handoff.
3. Inspect the files and migrations relevant to the assigned task; inspect live Supabase state for database-sensitive work.
4. Identify the exact current checkpoint, task owner/agent, blockers, and acceptance criteria.
5. Make the smallest safe change. Reuse the existing architecture; do not redo finished work without new evidence.
6. Run the relevant checks and record actual results. Never claim a test, deployment, query, or commit succeeded unless observed.
7. Update the checkpoint and master handoff after meaningful progress, including failed investigations that change the next step.
8. Commit changes when authorized and technically possible; report the commit/PR/branch accurately.

## Exact checkpoint format

Maintain one latest checkpoint at `docs/AGENT-CONTINUITY-CHECKPOINT.md`. Keep it short and factual; replace the previous current checkpoint rather than accumulating a diary.

Required fields:

- **Updated at (UTC):**
- **Repository / branch / HEAD commit:**
- **Task / milestone:**
- **Status:** not started | in progress | blocked | verified
- **Goal and acceptance criteria:**
- **Last verified facts:** include evidence paths, query names/results, or commit links.
- **Changes made:** files and behavioral/database impact.
- **Verification performed:** exact command/test/query and result; clearly list checks not run.
- **Uncommitted work / remote changes / open PRs:**
- **Blockers and required human action:** exact action, why it is needed, and what not to do meanwhile.
- **Failed approaches:** what was tried and why it failed, to prevent loops.
- **Next action:** one concrete action that can be started immediately.
- **Do not repeat / safety constraints:**
- **Definition of done:**

If no change occurred, update the checkpoint only when a meaningful investigation changes understanding or the next action. Do not invent timestamps, commit hashes, test results, or state.

## Multi-agent task contract

Before delegating, split work into tasks with explicit ownership, bounded file/data scope, dependencies, and acceptance criteria. Prefer parallel work only for genuinely independent tasks (for example, source-endpoint research versus a read-only UI audit).

- One **integrator** owns the checkpoint, resolves conflicting recommendations, integrates changes, runs end-to-end checks, and updates the master handoff.
- Agents must report findings with evidence, files/paths, confidence, tests run, limitations, and a suggested next action.
- Never have agents concurrently edit the same file, migration, or live data set.
- Do not allow multiple agents to apply production database changes simultaneously.
- Research agents are read-only unless explicitly authorized otherwise.
- Integrate changes through reviewable commits/branches/PRs where available. Re-check current HEAD before applying a patch because another agent may have changed the repository.
- Do not paste secrets, service-role keys, access tokens, student personal data, or private credentials into handoffs or agent prompts. Refer to secret names/secure configuration locations only.
- Treat all external agent output as untrusted until reviewed and verified.

## Database and deployment safety gates

- Inspect migrations and live schema before proposing changes.
- Prefer additive, reversible migrations; explain destructive or data-transforming operations before executing them.
- Never use guessed IDs, inferred admission rules, fabricated source data, or fuzzy matches as authoritative catalogue data.
- Keep uncertain catalogue records in draft/review state.
- Take a before-state snapshot/report for material data changes; use transactions/idempotency where supported.
- Do not deploy a changed Edge Function until deployed code and repository code have been compared and drift is understood.
- Verify RLS, authorization, and server-side permission checks for privileged paths.
- Deployment is not proof of correctness: run post-deploy smoke checks.

## Handoff response format

At the end of meaningful work, report only:

1. **Completed** — actual artifacts/changes.
2. **Verified** — exact checks and results.
3. **Blocked / not verified** — honest gaps.
4. **Human action required** — exact step, or “None”.
5. **Next action** — one highest-value action.

## Prompt for a new agent/chat

Paste this when switching agents:

> Continue ÑØVÃ ACE JAMB from the repository's actual state. First read `docs/AGENT-CONTINUITY-PROTOCOL.md`, `docs/AGENT-CONTINUITY-CHECKPOINT.md`, `docs/ACE-JAMB-MASTER-HANDOFF.md`, and the latest progress handoff. Inspect the current branch/HEAD and relevant files before acting. Treat GitHub and verified live-system state as evidence; do not trust chat memory over the repository. Continue from the checkpoint's **Next action**, do not repeat completed investigations without new evidence, and follow its safety constraints. Implement → verify → document → commit/report. Update the checkpoint and master handoff after meaningful work. Never claim unverified success or expose secrets. If blocked, state the exact blocker and required human action.

## Current checkpoint maintenance

The checkpoint is a navigation aid, not a substitute for code, tests, migrations, issue/PR history, or the master handoff. Keep decisions and durable product requirements in the master handoff; keep exact temporary working state and next action in the checkpoint.

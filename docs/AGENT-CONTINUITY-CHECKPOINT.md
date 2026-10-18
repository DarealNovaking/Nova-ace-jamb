# ACE JAMB — Current Agent Checkpoint

> This file must be refreshed from verified repository/system state at the start and end of meaningful work. Do not treat stale contents as current truth.

- **Updated at (UTC):** 2026-10-18 (date from current session; exact time not asserted)
- **Repository:** `DarealNovaking/Nova-ace-jamb`
- **Branch / HEAD commit:** Not re-verified in this change; next agent must inspect GitHub.
- **Task / milestone:** Establish reliable multi-agent continuity so work can safely resume across AI providers, chats, and usage limits.
- **Status:** Continuity protocol added; project checkpoint refresh still required.
- **Goal / acceptance criteria:** Every agent can identify the current verified state, avoid repeating work, continue the next concrete task, and safely record changes, tests, blockers, and required user actions.
- **Last verified facts:** Master handoff exists at `docs/ACE-JAMB-MASTER-HANDOFF.md`. Project context says the student catalogue has 791 imported institution rows in draft, zero programme rows, and zero UTME-rule rows; re-check live Supabase before making changes because these facts can go stale.
- **Changes made:** Adding the protocol and checkpoint files to GitHub; no application code or database data is changed by this continuity feature.
- **Verification performed:** Repository master handoff was read. New protocol/checkpoint content is documentation-only. Build/tests are not applicable to Markdown-only changes, but GitHub write result must be checked after commit.
- **Uncommitted work / open PRs:** Not re-verified; inspect GitHub and current PRs before coding.
- **Blockers / required human action:** None for the documentation system. Any external AI provider must be given repository access independently; this protocol does not grant access or share secrets.
- **Failed approaches:** Repeatedly relying on chat history and narrative summaries without a single explicit next-action checkpoint causes repeated investigation and lost momentum.
- **Next action:** Refresh this checkpoint after inspecting current GitHub HEAD, latest progress handoff, relevant catalogue code, and live Supabase state; then continue the catalogue milestone from verified evidence.
- **Do not repeat / safety constraints:** Do not re-upload the institutions workbook without evidence it is missing. Do not revisit the resolved admin/student routing issue without new evidence. Do not guess JAMB IDs or UTME combinations. Do not blindly redeploy the catalog-import Edge Function while deployed/repository code drift is unresolved. Never store secrets in documentation.
- **Definition of done:** Protocol and checkpoint exist in GitHub; master handoff points to them; a fresh agent can follow the new-agent prompt and find the next action; future meaningful work maintains the checkpoint and master handoff.

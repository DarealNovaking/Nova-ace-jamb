# Approved security bundle — partial application status (28 October 2026)

The owner explicitly approved the two-proposal bundle. Do not request approval again for the same reviewed SQL.

- **Applied and verified:** `20261028002329_fcb_01_syllabus_version_identity`. All five intended constraints and the partial legacy-name index are live; old global uniqueness is removed. No topics, subtopics or syllabus records changed.
- **Still unapplied:** `supabase/proposals/fcb_01_exam_config_security.sql`. Requests expired with `Invalid or expired requestState`; read-only checks confirm the original function hash, absent guard and no migration ledger entry. No lock/session remains. A guarded request with statement/lock timeouts and a smaller guard-only application also expired; final ledger and all three original function hashes prove no application. Stop repeating the same connector failure; resume with a fresh working request context, retaining this authorization.
- **Already complete:** signup fix `20261027220044`; do not reapply.

Preflight matched the three original function definitions/owners/ACLs, four policies, parent ACLs and empty taxonomy. Forward/rollback exact same-runtime catalog parity passed. Cross-engine raw ACL formatting was initially different (implicit versus explicit default/owner ACLs), so exact rollback was checked within the same disposable runtime; no API permission difference was ignored. Rollback artifacts below remain available.

This approval permits only the two reviewed schema-security changes, not season/config activation, publication, broader CBT/mock rollout, deployments, content deletion or provider costs. The owner described the account as test-only; no account was inspected or removed.

---

## Original reviewed scope (historical proposal paths/status)

### Original review

The signup fix is already applied and verified as `20261027220044`. Do not apply it again. This review concerns two additional **unapplied** source proposals in PR #10:

1. `supabase/proposals/fcb_01_syllabus_version_identity.sql`: allow the same topic name in different syllabus versions, preserve legacy uniqueness, enforce subject/version and parent/child consistency, and preserve child deletion behavior. No records are deleted or renamed.
2. `supabase/proposals/fcb_01_exam_config_security.sql`: require administrator approval for configurations/seasons, audit approvals/draft authoring, serialize competing approvals, protect active compositions, retain configuration identity, validate English plus any three optional subjects and require approved published taxonomy. Give authenticated users only the intended metadata reads, with drafts restricted to managers.

Applying these files does **not** activate a season/configuration, publish syllabus/questions, apply the broader CBT RPC/private-snapshot proposal, merge/deploy the frontend or enable a provider. Existing real records are not edited by either script. Each proposed DDL change requires a fresh live preflight and a tool-recorded migration; source filenames must then match the actual assigned ledger IDs.

The reviewed rollback artifacts are `docs/rollback/fcb-01-exam-config-before.sql` and `docs/rollback/fcb-01-syllabus-version-before.sql`. Disposable forward/rollback tests restore the complete original catalog and API privileges. They are metadata restoration, not data backups, and restore known limitations/authorization weaknesses. Once real content legitimately repeats topic names across versions, taxonomy rollback refuses the old global uniqueness constraint; it must never delete valid content automatically.

Read-only live preflight finds the original three function hashes, four policies and owner-only parent-table ACLs matching the rollback snapshot. Additional taxonomy validation is recorded in the current handoff. Approval for the earlier signup fix or snapshot publication does not authorize this separate bundle.

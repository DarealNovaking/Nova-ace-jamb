# FCB-02 draft-only import proposal — 28 October 2026

**Prepared, not applied.** [Review manifest](review.json) binds the generator, target snapshot, prospective IDs, exclusion and exact generated file hashes. This is a content-staging proposal, not a schema migration or publication approval.

## Concrete proposed change

- Create **25 new version-2 syllabus drafts** bound to the current 2027 candidate season and verified subject IDs. Preserve all **50 existing version-1 scaffolds**, including every 2026 record.
- Insert **214 inactive topics and 954 inactive subtopics** under those new drafts. Every version stays `status=draft`, `rights_status=pending`, `activated_at=null`. All topic/subtopic `active` values are false.
- Exclude `ENG-01-04`, the unnamed approved English reading-text placeholder. No novel, Arabic modern-period date, book text, questions, lessons, audio or AI material is selected or imported.
- Preserve current source URLs/hashes, source-page anchors, scoped year evidence and editorial warnings. PHE grouping remains a disclosed source-heading interpretation. This does not approve whole-subject 2027 applicability, rights or launch coverage.

Read-only target inspection found 25 subjects, 50 pending draft versions and zero topics/subtopics/questions. The target snapshot includes exact column/constraint definitions and every incoming FK to the three taxonomy tables. Production has not been changed by preparing or testing this package.

## Reproducible review files

```sh
python3 scripts/prepare-fcb02-import.py --output-dir /tmp/fcb02-import-proposal
```

The generator has no database/network execution path. It emits:

| File | Purpose |
|---|---|
| `proposal.json` | Exact prospective rows, IDs, source limits and preserved target bindings. |
| `preview.sql` | Full guarded staging transaction ending in ROLLBACK. |
| `apply.sql` | Same guarded staging transaction ending in COMMIT; unapplied. |
| `rollback.sql` | Owner-context guarded removal of unchanged, unused package rows only. |
| `review.json` | Digest, bindings, counts and exact hashes of the four files above. |

Generated SQL/data are retained as the **fcb02-draft-import-review** CI artifact, rather than duplicating several megabytes of reconstructible literals in Git. The committed generator, reviewed source draft, target snapshot and review manifest reproduce it byte for byte. CI compares the regenerated review manifest before exercising the scripts.

## Execution and authorization boundary

The source text is base64 data, never executable SQL. The SQL server recomputes SHA-256 of canonical decoded payload bytes, verifies it against the embedded reviewed digest, and requires an explicit matching transaction/session acknowledgment. The digest includes the generator source hash. Exact emitted SQL hashes must also match the reviewed manifest: a payload digest alone does not authenticate executable SQL body changes.

No script sets JWT claims, grants roles, changes RLS, creates a user, supplies a token or impersonates an administrator. Applying/previewing requires a real administrator identity already established by a trusted authenticated execution context. A normal identity-free connector SQL session is expected to refuse it. **No authenticated bulk executor is installed by this proposal.** Verify that execution context before requesting any live staging approval; do not spoof a user's UUID into a production SQL session to satisfy the guard.

Rollback additionally requires a trusted database owner/bypass-RLS context plus that verified administrator identity. An ordinary authenticated administrator can have an RLS-filtered view of student records; it cannot safely certify that all external references are absent. The guarded rollback therefore refuses that narrower context. No client table privilege or policy is widened.

Any later live data application still requires specific owner authorization under AGENTS.md. This proposal is not permission to execute, approve rights, activate the season/config/runtime, publish content, merge main or deploy the frontend.

## Failure and rollback behavior

- Refuse captured season, subject, existing-version or FK-contract drift before writing. Subject/season checks are observational preflight checks; no direct season UPDATE privilege or serialized season-approval guarantee is claimed.
- Serialize taxonomy writes; use stable prospective IDs; accept exact replay as a no-op. Do not overwrite partial imports or edited rows.
- Compare every package version/topic/subtopic with its expected data before undo. Refuse approval/publication changes, edits, additions or missing rows.
- Lock all imported version/topic/subtopic rows FOR UPDATE **before** external-reference inspection, so concurrent FK writers cannot slip through to an ON DELETE SET NULL/CASCADE action.
- Refuse all captured external FK references, including flashcards, questions, student learning progress and study-plan items. Unknown incoming FK changes require a fresh review. Never force deletion of referenced data.
- Preserve existing scaffolds and audit history. No blanket deletes or recovery-schema changes.

## Verification at preparation checkpoint

PASS locally: 8 Python unit cases; 21 real SQL scenarios on a disposable full51-table PGlite recovery, including literal dollar-delimiters/quotes/backslashes/SQL-looking text, payload tampering, authenticated-role refusal, draft invisibility, exact replay, drift and referenced/edited rollback refusal. Existing 21 Node parser/PWA contract tests also passed. Independent read-only code review found the fixed-delimiter input-safety defect; it was reproduced RED, corrected with encoded data/server hashing and re-reviewed with no remaining blocker.

Native PostgreSQL 17 verification, including the concurrent reference writer versus rollback race, is **PENDING** until CI results are recorded. No claim of production application or native acceptance is made from the local engine alone.

Next: inspect exact native CI and independent review results, resolve any failure, then establish a verified administrator execution path before requesting live draft-only staging approval. Rights, publication, final exam settings and launch coverage remain separate FCB-02 acceptance gates.

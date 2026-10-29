# Reviewable FCB-03 history release package

PR20: https://github.com/DarealNovaking/Nova-ace-jamb/pull/20

The deployed editor and CSV importer remain unchanged. The next release adds bounded version history and restores older text as a **new private draft**, preserving old snapshots and requiring review again. The two new server functions and UI are implemented and tested in the isolated branch; neither function is installed in production yet.

## Approval scope

Approve the exact `supabase/proposals/fcb03_question_history.sql` installation, then merge PR20 and deploy through the existing main→Cloudflare trigger. This adds two guarded authenticated RPCs; it changes no question content, role assignments, buckets, existing function bodies or direct table grants. This approval is separate from authorizing a question intake or publishing content. The repository's AGENTS.md states that “production database/content changes, deployments and billable provider actions still need specific approval.”

| Exact artifact | Identity |
| --- | --- |
| Proposal file SHA256 | 975e65e0cb544d8738a95e5d496e3919c6d6008b54e45122a6c60fc80c338b0d |
| Installation body SHA256 (outer BEGIN/COMMIT lines removed) | a93441092140bae8990d97f6a0e90c37dc6dffa3c6f68a1a83368faa392b20e1 |
| question_history body SHA256 | aa43866274ab500abb5fef9066b6fcfe59713e5ffb28c9f58f5a4299d52db4e4 |
| restore_question body SHA256 | b654db2a163e2bd3d9ed6a5acf6dd3aa2588794639109220e4b905b526574b6d |

Compiled owner is postgres; both functions use SECURITY DEFINER, explicit `pg_catalog, pg_temp` search_path and 3s lock timeout. Anonymous EXECUTE is revoked; authenticated users encounter actual admin/editor guards, locked roles and read-committed checks. Full compiled metadata and read-only live preflight are in `docs/evidence/fcb03-question-history-compiled-functions-2026-10-29.json` and `fcb03-question-history-live-preflight-2026-10-29.json`. The existing manage/review body MD5 fingerprints match the compiled source. New authenticated-definer advisor notices are expected and must be assessed against these tested guards, not hidden.

## Release sequence after approval

1. Recheck the target Primary Supabase project, absence of the new functions, existing manage/review fingerprints and content counts. Abort for unexplained drift.
2. Install only the exact two-function proposal with `apply_migration`, removing its outer transaction markers. Verify installed body fingerprints, owner, config, ACL and anonymous/student denial without impersonating a real account. Preserve current roles/content.
3. Merge the exact verified PR head after confirming runtime/test blob identity and CI evidence. Monitor the existing Cloudflare build; verify its source, active version and live history chunk.
4. Perform a genuine authorized private-draft/restoration acceptance only when an actual content intake is approved. A real independent reviewer is still required before publication; only one administrator currently exists.

## Recovery

The metadata-only emergency disable script is `docs/rollback/fcb03-question-history-disable.sql`. It revokes access to the two new RPCs and preserves all question/history/audit rows. It is unapplied and is not a data backup. The previous deployed source is ba347f808c34d637bc72692a44f8fcabe6049f3f, Worker version0ff49afc-eff5-4048-87c8-3c8928d92a61. Any production recovery needs the corresponding explicit incident authorization.

Both real saved profiles must remain signed in. Use their exact profile IDs; never sign out, clear sessions, read credentials or switch roles to simulate independent review. The $2 browser budget applies cumulatively; two completed ten-step runs used approximately $0.33 at the observed rates, with no further metered runs started. Provider-posted total charges were not supplied, so the wallet increase is not treated as a charge calculation.

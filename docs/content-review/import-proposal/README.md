# FCB-02 draft-only import proposal — 28 October 2026

**Helper installed after specific approval; content import remains unapplied.** [Review manifest](review.json) binds the generator, target snapshot, prospective IDs, exclusion and exact generated file hashes. This includes an unapplied administrator-helper installer and a content-staging proposal; neither grants publication approval.

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
| `install-executor.sql` | Create one fixed-package authenticated administrator RPC; stage no content. |
| `uninstall-executor.sql` | Remove only the unchanged helper, preserving staged rows. |
| `fcb02ReviewPayload.json` | Canonical fixed payload and digest for the lazy-loaded administrator panel. |
| `review.json` | Digest, bindings, counts and exact hashes of all generated files above. |

Generated SQL/data are retained as the **fcb02-draft-import-review** CI artifact, rather than duplicating several megabytes of reconstructible literals in Git. The committed generator, reviewed source draft, target snapshot and review manifest reproduce it byte for byte. CI compares the regenerated review manifest before exercising the scripts.

## Execution and authorization boundary

The source text is base64 data, never executable SQL. The SQL server recomputes SHA-256 of canonical decoded payload bytes, verifies it against the embedded reviewed digest, and requires an explicit matching transaction/session acknowledgment. The digest includes the generator source hash. Exact emitted SQL hashes must also match the reviewed manifest: a payload digest alone does not authenticate executable SQL body changes.

No script sets JWT claims, grants roles, changes RLS, creates a user, supplies a token or impersonates an administrator. Applying/previewing requires a real administrator identity already established by a trusted authenticated execution context. A normal identity-free connector SQL session is expected to refuse it. **No authenticated bulk executor has been installed.** The new source-only installer creates `ace.manage_fcb02_draft(text,text,text)`, called through the existing signed-in administrator session. Do not spoof a user's UUID into a production SQL session to satisfy the guard.

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

Native PostgreSQL 17 job `122758105973` executed **22 scenarios PASS**, including the concurrent reference writer versus rollback race; its logs were inspected. The 8 unit cases and exact regenerated review-manifest comparison also passed in CI. Exact tested source: `3f9ffc8066a1d0cd46ea378715779e3ef305c45d`. [Generated package and native test evidence](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40671198288/artifacts/12808182524). Browser run [40671198259](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40671198259) completed PASS, **164 tests**, with job `122758105471` log inspected. Overall [Verify run 40671198288](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40671198288) completed PASS, including typecheck/build, recovery/contracts, the new native job and cleanup. No production application is claimed.

Historical next action was to establish the administrator execution path; the source implementation below now addresses it. Exact native/browser CI and independent review are already verified; do not repeat them without a new change or failure. Rights, publication, final exam settings and launch coverage remain separate FCB-02 acceptance gates.


## Authenticated administrator staging entry point — source proposal

The existing academic workspace gains one administrator-only panel. On mount it requests `preview`; staging and removal each require a fresh explicit checkbox confirmation. Editors and students do not mount the panel or load its payload. A missing RPC leaves normal editing available. An uncertain write clears actions until a fresh preview succeeds; raw database errors are never displayed.

The installer creates, rather than replaces, one `SECURITY DEFINER` function owned by postgres. It grants execution to authenticated users, revokes PUBLIC/anon access, uses `pg_catalog, pg_temp` with temporary objects last and explicitly qualified catalog relations, validates `auth.uid()`/administrator status, and holds the real role row `FOR SHARE` through commit. It additionally requires a superuser/bypass-RLS execution owner. It pins the exact canonical payload byte length and SHA-256 before parsing; clients cannot substitute arbitrary content or select another package. Installation changes no content or user roles. The function itself sets a bounded lock timeout; caller/PostgREST statement deadlines remain caller configuration, not a claimed function-level deadline.

Actions are `preview`, `stage`, `undo`. Preview performs preflight checks and may take locks, but persists no content. Stage uses the same target/FK/row contract as the direct scripts. Exact replay is a no-op. Undo sees RLS-hidden references as the trusted owner, locks rows before inspecting them, and refuses changed or referenced drafts. Bulk audits are written only for actual changes. Uninstall verifies the exact function source hash, owner, definer setting and configuration, then drops only that helper without CASCADE; it never removes staged drafts.

The client payload is committed once as generated data and loaded dynamically only from the administrator panel. CI regenerates and compares both that payload and the review manifest. This adds a roughly 624 KB uncompressed / 97 KB gzip administrator asset; student entry size is unchanged. The asset contains review metadata and topic labels, no credentials, book text or private student data.

Current validation: 9 Python tests and local full-schema SQL scenarios PASS; typecheck/build PASS. Native concurrency and browser CI for this new entry point are pending. Local browser execution is BLOCKED: Chromium is absent and the browser download returned a truncated archive. The prior 164-test browser result above covers the earlier source only. Independent code review found no blocker; the suggested owner-bypass guard was added and tested. Production remains at the unchanged 50 scaffolds and zero taxonomy rows observed before implementation.

Next: complete native PostgreSQL and browser CI, inspect failures/evidence, then present the exact helper installation and deployment/staging boundaries for specific owner approval under AGENTS.md. Do not install, stage, merge or deploy merely because source tests pass. Rights, applicability, publication, launch coverage and final exam configuration remain separate FCB-02 gates.


Security closeout regression: native run40692683152 passed41 scenarios (including both demotion orderings and executor/reference race) before one additional locally reproduced catalog-shadow regression. Temporary `pg_constraint` could hide an added FK under an implicit temporary-first search path. Reproduced RED, then fixed with explicit `pg_catalog,pg_temp` ordering, qualified catalog relations and guarded standalone/uninstall paths. Current38 sequential SQL scenarios and9 units PASS locally; final native42-scenario run pending. Previous application browser run40674942702 passed172 desktop/mobile tests; screenshots inspected with no clipping/overflow. Final exact-source rerun pending.

Specific next approval, only after final checks: install the fixed helper (DDL only) against project `uokiqlgmzprqfbzmedaz` and verify its definition/owner/config/ACL, with no content staging. Frontend merge/deployment and any later authenticated stage action remain separate approvals. Installing the helper does not make the source panel live or approve rights/publication. Installer and helper-only uninstaller hashes are pinned by review.json.


## Terminal verification and next approval

Exact source **`319fb18bf795ec7244ddcfeaf66d87f2dd2c89f4`**: [Verify40693456640](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40693456640) completed PASS, including9 Python tests, deterministic manifest/client regeneration, **42 native PostgreSQL scenarios**, all existing security/recovery/race checks, Node/Deno, typecheck and build. Native job122833915258 logs inspected, including temp-catalog regression and both executor role-demotion orderings. [E2E40693456615](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40693456615) completed PASS, **172 desktop/mobile tests (3.9m)**; job122833915323 terminal log inspected. This supersedes pending statements above. Independent review verified the final search-path correction and generated hashes with no blocker.

[Exact reviewed scripts and test evidence](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/40693456640/artifacts/12817893123). Review digest `aa9340d4f81bdf5253c322b14a9a091f8b0cd638a6593fd3805b207ee1453ef3`; installer SHA256 `a07a244340fc414e4f8701cc75714cc6496b6e978842500e14e765837386f580`; helper-only uninstaller `a8dcdfdba3dbb938727b6c4202f177f7b26852dad040f7c63296a76d843fe3d0`.

Ready for specific approval of **helper installation only**. Proposed effect: create one fixed-package administrator RPC, revoke public/anonymous execution, grant authenticated execution (real administrator checks still apply), notify PostgREST, then verify owner/source/config/ACL. No content staging, user-role changes, rights approval, publication, main merge or frontend deployment is included. Uninstall removes only the verified unchanged helper. No live authenticated/PostgREST execution is claimed before installation and subsequent separately authorized integration acceptance. FCB-02 remains IN PROGRESS.


## Helper installation accepted —28 October2026

Owner approved helper-only installation. Migration **20261028133030_fcb02_fixed_review_admin_executor** is applied, with exact installer/body hashes,owner,definer,configuration and ACL verified. PUBLIC/anon execution denied; identity-free authenticated and anonymous live calls refused.50scaffold rows and role hashes unchanged;0topics/subtopics/questions/attempts and4audit events. All51RLS tables unchanged;40functions/ledger53. First expired connector request made no change; identical reviewed retry succeeded. [Evidence](../../evidence/fcb-02-helper-install-2026-10-28.json).

Security advisors added only the expected [authenticated SECURITY DEFINER exposure notice](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) for this deliberately callable API, protected internally by the verified real-administrator/role-lock checks. No unrelated advisory changed.

The helper is live; the new administrator panel is still source-only. Main merge/frontend deployment, signed-admin integration and content staging remain separately gated. Earlier unapplied-installer/approval-pending statements describe preparation history and are superseded by this installation record. Content import, publication and rights approval are still unapplied.


## Admin-panel release preparation

PR10 is source-prepared and now describes the final implementation. Source66e06c5 passed Verify40697812911,including42native scenarios and exact applied-migration comparison; E2E40697812905 passed172desktop/mobile tests. Both terminal logs inspected. Independent review of7runtime files against main found no blocker; PR is open,non-draft,mergeable and main is its ancestor. No application code changed during this preparation.

Cloudflare release remains **BLOCKED pending provider metadata**. Cloudflare Workers is the documented provider, but there is no deployment workflow/Wrangler config in this repository, plugin discovery returned no Cloudflare integration, and commit statuses supplied no provider deployment evidence. Actual build branch/trigger, deployed SHA/version, environment and rollback reference must be verified before merge; external build integration might deploy on a main update. No merge, deployment, authentication fallback or content staging performed. [Release-readiness evidence](../../evidence/fcb-02-admin-release-readiness-2026-10-28.json).


**Release blocker found in full GitHub check-runs:** the external Cloudflare integration does exist. Main17f29e1 succeeded (build99ddf614-8a81-41e6-b9fe-aa72d82edd2f,version809c6301-c4b1-41a4-ae7e-b6e054aacc46), but verified application source66e06c5 has FAILED Cloudflare check122849757177,build6f148286-5a67-4787-abf2-5ee544915c25. Legacy commit statuses did not expose these checks. The actual failed-build log is required before diagnosing; GitHub summary has no error/annotations and no Cloudflare log connector was found. Application tests passed, but release is BLOCKED. Historical successful version is not proof of current activation or rollback retention. Exact dashboard link and check provenance are recorded in release-readiness evidence. No merge/deploy/staging occurred.


## Cloudflare diagnosis resolved; preview fix prepared

Direct Cloudflare access now works. Failed build 6f148286 successfully builds the app,then Wrangler 4.154.0 rejects missingpreviews{}. Actual provider branch is security/fcb-01-contract-audit with npxwranglerpreview; auto-build enabled,otherbranch previews disabled. Activeproduction809c6301(version641) remains100%,linked tomain17f29e1; previousversion640 is retained. No provider changes made.

Source-only candidate `fix/fcb-02-cloudflare-preview-config` adds root wrangler.jsonc withpreviews{},./dist SPA assets,and currentWorkername/compatdate/observability. No extra app dependencies. Typecheck/build,Wranglerconfigreader/dryrun,and6local workerd route/filechecks PASS; independent configreview no blocker. Current connected branch is unchanged because applying the fix there creates an actualPreview. Specific approval for that preview run is next; main/prodrelease and contentstaging remain separate. [Direct diagnosis evidence](../../evidence/fcb-02-cloudflare-build-diagnosis-2026-10-28.json).


## Approved isolated Preview verified

Source **7b9ff4319924f415b594e0f20ac428f002952f84** is now on the connected review branch after specific owner approval. Cloudflare build02896185-963e-4062-a4a8-8f03ca0820de succeeded. [Stable Preview](https://security-fcb-01-contract-audit-nova-ace-jamb.novaking5002.workers.dev) · [Pinned deployment](https://7582fe37-nova-ace-jamb.novaking5002.workers.dev). Verify40726609816 PASS(42native scenarios/9units/alljobs); E2E40726609864 PASS(172tests),terminal logs inspected. Nine live GET route/asset/digest checks passed; no authenticated browser acceptance claimed.

Production version809c6301 remains100%traffic,unchanged. No mainmerge,productiondeploy,contentstaging,Supabase mutation orrights approval. Next is legitimate signed-admin acceptance using Check review package on Preview/admin-academic; staging remains separately gated. [Verification evidence](../../evidence/fcb-02-preview-verification-2026-10-28.json) is saved on separate evidence branch so the connectedPreview stays pinned to the tested source.

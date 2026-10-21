# ACE JAMB — Current Agent Checkpoint

> Refresh from verified repository/system state at the start and end of meaningful work. This is a navigation aid, not a substitute for source code or live evidence.

- **Updated at (UTC):** 2026-10-19 (exact time not asserted)
- **Repository:** `DarealNovaking/Nova-ace-jamb`
- **Branch / HEAD commit:** `main`; latest HEAD must be refreshed after the catalogue-independent onboarding commits.
- **Task / milestone:** Multi-agent continuity; Batch 2 catalogue pipeline remains the highest-value product milestone.
- **Status:** Continuity protocol and role-specific prompt pack committed; catalogue implementation is blocked on live DB inspection and official programme/UTME data validation.
- **Goal / acceptance criteria:** Agents can switch safely across providers/chats, know who owns integration, avoid duplicate investigations, make scoped changes, verify them, and keep handoff current.
- **Last verified repository facts:** `main` was observed at `0627479eb5f5ddf891c2f55b2a8325c1137f3ea1` before the new prompt-pack commit. Latest dated progress handoff is `docs/MASTER-HANDOFF-BATCH-2-IBASS-ENDPOINTS-2026-09-16.md`. Master handoff and catalogue import contract were read. Repo `supabase/functions/catalog-import/index.ts` differs materially from the deployed version 7.
- **Last verified deployed function facts:** `catalog-import` is ACTIVE, version 7, `verify_jwt=true`. Deployed code includes CORS OPTIONS handling, calls caller-JWT `can_manage_catalog`, and stages via `stage_catalog_import`; repository source instead queries `ace.roles`, loads/checks `catalog_sources` and `exam_seasons`, and inserts batches/rows directly. Do not redeploy until the drift is reconciled and the deployed code's source/contract is understood.
- **Database evidence / limitation:** Attempts to list Supabase migrations and inspect `ace` tables failed with PostgreSQL password-authentication errors (both postgres and read-only DB users). No DB writes were performed. Prior reports of 791 institution rows and zero programme/rule rows are stale until verified through a working live read path.
- **Official data notes:** `docs/MASTER-HANDOFF-BATCH-2-IBASS-ENDPOINTS-2026-09-16.md` records official JAMB IBASS endpoint discovery and says Batch 2 remains IN PROGRESS, Batch 3 LOCKED. Preserve alternatives/optional UTME subject groups; never guess institution IDs or course rules.
- **Changes made in this work:** Added `docs/AGENT-PROMPTS.md` with shared rules and role-specific prompts for integrator, Supabase security, catalogue data, frontend, QA, research, code review, and continuity. No app code or database rows changed.
- **Verification performed:** GitHub read/write tools accessed the private repository; repository metadata showed default branch `main`; read back master handoff, protocol, checkpoint, progress handoff, catalogue contract, UI importer and repository Edge Function source; fetched deployed `catalog-import` metadata/source. Prompt-pack creation returned commit `e8789b4a22869b97bd244eb3800954c9cadf31fc`. Supabase migration/table reads failed authentication. No build, tests, Playwright, data writes, or deployment were run.
- **Uncommitted work / open PRs:** Not verified. Check current HEAD and open PRs before implementation.
- **Blockers / required human action:** Restore/fix the Supabase connector's database authentication or provide a supported read-only path. Exact step: open ChatGPT Settings → Plugins/connected Supabase integration (where this connector is configured), reconnect/refresh authorization if offered, then ask the agent to rerun a read-only query. If it still fails, use the Supabase dashboard SQL Editor to run read-only counts for `ace.institutions`, `ace.programs`, and `ace.program_utme_rules`, and share only the results—not passwords, keys, or tokens. Do not change DB passwords or paste secrets into chat unless the integration's secure credential UI explicitly requires it.
- **Failed approaches:** Supabase `list_migrations` and `list_tables` via the connected tool failed with PostgreSQL password authentication. Do not keep repeating identical calls without reconnecting or using an alternate authorized read path.
- **Next action:** Restore read-only Supabase access and inspect the live schema/data; in parallel, use a read-only research agent to validate official JAMB programme and eligibility payload shapes. Then reconcile deployed/repo Edge Function drift before any importer code or deployment change.
- **Do not repeat / safety constraints:** Do not re-upload the institution workbook without evidence it is missing. Do not reopen the resolved admin/student routing issue without new evidence. Do not guess JAMB IDs or UTME combinations. Do not deploy the repository version of `catalog-import` blindly. Do not activate unverified records. Never store secrets or student PII in handoffs.
- **Definition of done:** Prompt pack exists and is readable; checkpoint reflects verified evidence and honest blockers; next agent has one concrete next action; future meaningful changes update checkpoint and master handoff.


## Anti-drift prompt update — 2026-10-18
- Added mandatory project-only scope and anti-drift rules to `docs/AGENT-PROMPTS.md`, including a dedicated Agent 9 prompt for the primary ChatGPT project partner.
- Rules cover truthful status labels, inspect-before-propose, single-owner integration, no scope drift, no repeated failed calls, production safety, evidence-based verification, handoff updates, and concise action reports.
- Prompt-pack commit: `261716c12f1df17c814302febf950166f7657d14`.
- No application code, database data, or deployment was changed. Prompt pack was written successfully; read-back verification is the next check.
- Next action remains restoring read-only Supabase inspection and reconciling the deployed/repository `catalog-import` function before implementation.


## Verified live-system and agent-continuity update — 2026-10-18
- Repository: DarealNovaking/Nova-ace-jamb, branch main. HEAD observed after master-handoff update: 420e3918b6f48ed59a27781aea69c4a750d93309.
- docs/AGENT-PROMPTS.md now makes one universal instruction canonical for every agent; role-specific sections are optional bounded task briefs. Commit: e79d863963d8c48d87cdb26b1ceff550cbc407c9.
- Supabase access is working for this inspection; do not call Supabase blocked. Read-only SQL, migration listing, table/schema listing, and deployed function retrieval succeeded.
- Live counts: ace.institutions=791, ace.programs=0, ace.program_utme_rules=0, ace.subjects=25.
- Deployed functions: catalog-import v7 and ibass-catalog-stage v4, both verify_jwt=true. No database writes or deployments performed.
- Catalogue remains Batch 2 in progress because programme and UTME-rule tables are empty. Do not re-upload the institution workbook without fresh evidence.
- Next action: compare both deployed function implementations with repository source, catalogue contract, migrations/RPCs, and AdminCatalogueImport caller. Validate official IBASS parsing on a bounded non-publishing sample, then implement and test the smallest safe correction. Batch 3 remains locked.


## Batch 2 investigation findings — 2026-10-18
- Live state: 791 institutions, all draft; 0 programs; 0 UTME rules; 25 subjects. Import batches: 3 published, 1 rejected. No data was changed.
- Active deployed ibass-catalog-stage v4 has no matching source file at supabase/functions/ibass-catalog-stage/index.ts on current main (404). Repo only lists catalog-import under supabase/functions. Treat deployed-only code as source-control drift; do not redeploy.
- AdminCatalogueImport is institution-workbook-only and never invokes ibass-catalog-stage. It expects catalog-import response property batch_id. Deployed catalog-import v7 delegates to ace.stage_catalog_import; verify actual RPC return shape and compatibility before touching code. Repository catalog-import has different CORS and response behavior.
- A previous expected migration filename was absent at the exact path. Enumerate actual repository migrations and map them to live migration ledger before making schema claims.
- Next action: reconcile the missing deployed function source and response contracts, then implement a safe, explicit admin action to stage programme/rule discovery only after official source payload and requirement parsing are validated on a bounded sample. Keep all new records unactivated until validation/approval/publication gates pass.


## Batch 2 continuation — 2026-10-18
- Recovered active deployed `ibass-catalog-stage` v4 source into `supabase/functions/ibass-catalog-stage/index.ts`; commit `50013989322b104ae3848e571508b64e925cf157`. Source recovery only; function not deployed.
- Added and applied `20261018120000_batch_2_resolve_ibass_program_external_keys`; GitHub commit `b1ac3ace8a954a503d06dd9f2e64be677e2f991c`. Live migration tool returned success. It extends the publication RPC programme lookup to match stable external keys stored in program provenance; it did not insert/update catalogue rows.
- Confirmed remaining blocking contract defects: IBASS parser emits `alternative_subject_groups`, live publication expects `alternative_groups`; alternative requirements are not represented safely by current parser; rule source status is `reviewed` while publication requires `approved`; deployed catalog-import v7 returns RPC-shaped JSON while repository implementation/UI expect `batch_id`.
- Current counts last verified: institutions 791 (all draft), programs 0, rules 0, subjects 25. No catalogue data rows staged/published. No build/typecheck/Playwright/parser integration tests performed.
- Exact next action: reconcile catalog-import contract and migration/RPC shapes, add non-publishing tests for official IBASS payloads and alternatives, fix the payload key and source approval gate, then add explicit admin staging UI and verify with Playwright. Do not deploy functions or import/publish programmes/rules until those checks pass. Batch 3 locked.


## Batch 2 continuation — 2026-10-18 (payload contract correction)
- Committed `de5cb5a103b949ef65fb6c8ccc49e2fc68bf5516`: IBASS function now emits `alternative_groups` to match the live publication RPC/contract. Source-only; no deployment.
- Alternative subject requirement handling remains conservative but incomplete: parser declines to stage text containing common alternative/choice terms; no real endpoint fixture/parser tests have run.
- An attempted `AdminCatalogueImport.tsx` UI patch was blocked by tool safety checks before the GitHub write; the UI remains institution-workbook-only. Do not document this as implemented.
- No catalogue data writes or function deployments. Last verified live counts: 791 institutions (draft), 0 programmes, 0 rules, 25 subjects.
- Next concrete action: add an isolated admin UI for selecting a valid season and up to 25 institutions, invoke the existing authenticated IBASS staging function, then test official payload parsing, RPC response contract, typecheck/build, and Playwright. Keep staging/review separate from approval/publication; Batch 3 remains locked.


## Batch 2 continuation — 2026-10-18 (admin staging UI added, verification pending)
- Created `src/components/AdminIbassStage.tsx` (commit `d46ef6975d2b74460cdeb5232847da05e31423c9`) and mounted it on `src/admin-import.tsx` (commit `ada5133419395b9d96aa980b72cfe3c64a7c565e`).
- UI checks session and `ace.is_admin()`, loads institution options via `get_catalog_institutions`, loads seasons from verified `ace.exam_seasons` columns, limits each action to 25 institutions, calls `ibass-catalog-stage`, and reports staged batches/unresolved items. It deliberately does not approve or publish.
- Supabase schema query verified current seasons: JAMB UTME 2027 (draft), JAMB UTME 2026 (closed). IBASS programme source status is approved; brochure-detail source is reviewed. Keep review/approval/publication separate.
- No data rows staged or published; no function deployment. Source writes succeeded, but no typecheck/build/Playwright/runtime staging verification has been run. The deployed/repository `catalog-import` response shape and official payload parsing remain unverified; alternative requirements are still conservatively unresolved rather than faithfully modeled.
- Exact next action: verify actual deployed response shape and stage response IDs without publishing; add parser fixtures/tests for official programme JSON and brochure HTML; run typecheck/build/Playwright; update this checkpoint and master handoff before any deployment. Batch 3 locked.


## Continuation attempt — 2026-10-18 (runtime verification blocked)
- Re-read the current checkpoint, master handoff, Batch 2 IBASS progress handoff, agent prompts, current admin staging UI, repository `catalog-import`, and recovered `ibass-catalog-stage` source.
- Current repository latest commit observed before this documentation update: `a31a070b5a60cd57eb166d16f03688db5f4090c4` (`docs: checkpoint IBASS UI verification pending`); default branch is `main`, repository remains private, and GitHub reports read/write permission.
- Static source confirmation: repository `supabase/functions/catalog-import/index.ts` returns `batch_id`, `status`, and `row_count` on successful staging and idempotent replay. The recovered `ibass-catalog-stage` source calls `catalog-import` for programme and rule batches and returns `program_import` / `utme_rule_import` payloads. This verifies repository source contracts only; it does not establish the currently deployed `catalog-import` response shape or prove runtime compatibility.
- Supabase live verification was attempted through the connected tools for deployed `catalog-import` source, edge-function listing, and read-only catalogue counts. All three calls returned MCP `-32600: You do not have permission to perform this action`. This differs from the earlier 2026-10-18 successful inspection recorded above; treat live deployment and current DB counts as presently UNVERIFIED, not as reverted or changed.
- No staging request was sent, no database rows were changed, and no Edge Function was deployed. No typecheck, build, parser fixture test, or Playwright test was run in this continuation.
- Blocker: current Supabase connector permission does not permit reading deployed function metadata/source or running read-only SQL. Required user action: restore/reauthorize the connected Supabase project access for `amswykapebeevhstmvii`, then rerun read-only source/count checks. Do not share service-role keys or passwords in chat.
- Next action: once read access is restored, compare deployed `catalog-import` response and `ace.stage_catalog_import` RPC contract against repository code; add isolated fixture tests for official programme JSON and brochure HTML (especially alternative/optional subject groups); run `npm run typecheck`, `npm run build`, and available Playwright coverage. Do not invoke production staging or deploy until these checks establish a safe contract. Batch 2 remains IN PROGRESS; Batch 3 remains LOCKED.


## Continuation — 2026-10-18 (live Supabase access recovered; project ref reconciled)
- Root cause of the previous connector denial was a stale/mismatched Supabase project reference in the checkpoint: `amswykapebeevhstmvii` is NOT the active project returned by the connected Supabase account. The actual active project is `nova-ace-jamb`, ref `uokiqlgmzprqfbzmedaz`, region `ca-central-1`, status `ACTIVE_HEALTHY`. Use this verified project ref going forward; do not use the older `amswykapebeevhstmvii` for ACE JAMB checks.
- Live Supabase read access is now confirmed against `uokiqlgmzprqfbzmedaz`: Edge Function list returned `catalog-import` ACTIVE v7 and `ibass-catalog-stage` ACTIVE v4; deployed `catalog-import` and `ibass-catalog-stage` source were retrieved successfully. `verify_jwt=true` on both functions.
- Live read-only counts: `ace.institutions=791`, `ace.programs=0`, `ace.program_utme_rules=0`, `ace.subjects=25`. Thus the institution import exists, but no programme or programme-UTME rows have been published/recorded in those tables at this point. Current seasons: JAMB UTME 2027 (`draft`) and JAMB UTME 2026 (`closed`). IBASS programme endpoint source is `approved`; brochure-detail source is `reviewed`.
- Live `information_schema.routines` check confirms `ace.stage_catalog_import` returns jsonb and is SECURITY DEFINER; `ace.can_manage_catalog`, `ace.get_catalog_institutions`, and `ace.is_admin` are also SECURITY DEFINER. Do not change these privilege boundaries without reviewing their function bodies/grants and verifying `auth.uid()` authorization. Routine argument introspection query was blocked by tool safety checks, so the exact live RPC argument signature remains unverified.
- Deployed `catalog-import` v7 uses the authenticated user's JWT for `ace.can_manage_catalog` and `ace.stage_catalog_import`, and returns the RPC JSON response directly (HTTP 200 for idempotent replay, 201 otherwise). Deployed `ibass-catalog-stage` v4 currently emits `alternative_groups: []` in its rule payload. It deliberately declines requirements containing alternatives/optional phrasing by marking them unresolved, but any parsed rule still has a conservative empty alternatives array. No staging call has been made.
- Important remaining risks before production staging: the deployed wrapper treats programme endpoint data as an array and expects each row to have `id` and `title`; official payload format has not been fixture-tested. Its brochure parser uses the first tbody row and normalizes programme titles exactly. Alternative/optional groups are not modeled. The live RPC payload contract and target schema must be checked against migration/source definitions before staging.
- A local clone/build attempt was blocked because this runtime cannot resolve `github.com`; no typecheck, build, parser fixtures, or Playwright tests ran. No production rows changed and no function was deployed.
- Next action: reconcile the current deployed wrapper/RPC contract with repository migrations/source; add deterministic parser fixtures/tests (including alternate/optional subject combinations); then run typecheck/build/Playwright in a network-enabled repository runtime. Only after checks pass, perform a small authenticated staging-only test with a confirmed admin session and a valid non-archived season; inspect batch IDs/row counts and leave all rows pending validation. Batch 2 remains IN PROGRESS; Batch 3 remains LOCKED.


## Exact continuation checkpoint — 2026-10-18 (latest)
- Repo: `DarealNovaking/Nova-ace-jamb`, branch `main`. Latest known source commits in this continuation: `098756ee127978d5811a0a89dada46f645e8980a`, `ff4c3ae83ea4f0caf6e79f597c8b66d9d87719bb`, `da7c96d06bbbe4151f011238ae555cccc228cd17`, `a6bc5aa65bbf0315dfc5fa58648049f9b3be881b`. Handoff update commit: `5fef75e0a0e79f98865112b56d65a96c0a0fcfe8`.
- Confirmed current official institution JSON is nested; parser now recursively visits `children` and removes a selected institution's state suffix before strict normalized name matching. Missing programme requirement text is explicitly listed as unresolved. If the batch produces programme records but zero parseable UTME rules, the function returns HTTP 422 before calling `catalog-import`, so no partial programme-only batch is staged.
- Live source investigation proves the current IBASS brochure page has changed to a React application; old modal/table selectors are absent. The legacy programme endpoint still returns `{id,title}` records. A read-only call to the newer API list endpoint returned a limited 3-row result for FUTA with empty UTME requirement fields, so it is not yet a validated replacement. Official requirements/alternatives endpoint remains to be identified.
- **No deployment, staging request, catalogue write, approval, publication, or database mutation was performed.** Source commits are un-deployed. Typecheck/build/Deno tests/Playwright remain unrun and unverified; no local clone is available because the container cannot resolve GitHub.
- **Exact next action:** inspect current IBASS app-bundle API calls and use read-only calls to identify the endpoint that supplies `programme_utme_subject_data`, `programme_utme_requirements_data`, and alternatives; capture representative official payload fixtures (including alternative/optional subject wording); implement/test a parser against those fixtures. Then run TypeScript/Deno checks, build, and Playwright in a network-enabled repository runtime. Do not deploy or stage until the tests pass. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## Verification follow-up — 2026-10-18
- Latest parser source commit: `5c4ce3b97ff3f0d3c0e976a8e4bd5fece579d4f5` (normalized state suffix matching no longer constructs a dynamic regex).
- Confirmed GitHub Actions passed on prior source commit `a6bc5aa65bbf0315dfc5fa58648049f9b3be881b`: `Verify` passed (TypeScript typecheck + production build) and `ACE JAMB E2E` passed (Playwright). This does not validate the subsequent `5c4ce3b` edit.
- At checkpoint time, `Verify` run `39132839357` and `ACE JAMB E2E` run `39132839355` for `5c4ce3b` were in progress; recheck these exact runs before claiming the latest source passes.
- No live staging/deployment/database write occurred. The live IBASS brochure's old DOM selectors are obsolete; identify the current official endpoint for detailed UTME requirements and alternatives before changing the importer further.


## Latest evidence — 2026-10-18
- CI verified successful: `Verify` and `ACE JAMB E2E` both passed for parser source commit `5c4ce3b97ff3f0d3c0e976a8e4bd5fece579d4f5`; both also passed on docs commit `f1a4395a4b91d79091be90cb1f4e0a455a1ece9f`. This validates frontend TypeScript/build and existing Playwright tests, not the Deno importer with real IBASS fixtures.
- Current official API `POST /ibass/institution/programmes/1306?page=1` returns only 3 FUTA programmes and all returned rows have empty `subjects`, `utme_requirements`, and `details`. Searching this API for Microbiology and Agricultural Engineering returns zero rows, while the legacy endpoint has many more. The current official app bundle only references `/inst-type`, `/inst-category`, `/ibass/institutions?page=`, `/ibass/institution/programmes/`, `/ibass/eligibility-checker/`, and `/ibass/eligibility-checker/submit`. A synthetic eligibility-checker submit probe returned HTTP 500, so no requirement details were recovered.
- This leaves the requirement source unresolved. The code now safely handles nested institution tree mapping and refuses to stage any batch if it parsed zero UTME rules. No live function deployment, catalogue staging, approval, publication, or database write occurred.
- **Next action:** inspect the official brochure's downloadable documents/alternative authoritative payloads and build fixtures before changing parser logic. Do not switch to the newer API list as source of truth until programme coverage and requirement completeness are confirmed. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## Post-investigation live recheck — 2026-10-18
- Reconfirmed live Supabase project `uokiqlgmzprqfbzmedaz`: `catalog-import` ACTIVE v7 and `ibass-catalog-stage` ACTIVE v4, both JWT verification enabled. Neither function was redeployed.
- Read-only database counts remain: 791 institutions, 0 programmes, 0 UTME rules, 4 import batches. No catalogue rows were added during this continuation.
- Latest source commit `5c4ce3b97ff3f0d3c0e976a8e4bd5fece579d4f5` passed Verify and Playwright. Current remaining blocker is authoritative programme requirement/alternative data access; keep importer fail-closed and do not stage/deploy until the current official source is parsed and fixture-tested.


## Exact continuation checkpoint — 2026-10-18 (official IBASS API parser)
- Repo `DarealNovaking/Nova-ace-jamb`, branch `main`. Current relevant commits: parser module `a26306cb27b8f80fe906edfc0238f437cd26747a`; parser fixtures `78be7993f0d3a8524e1043e6df1a961297c0d6bf`; Edge Function source `991bfd925ddbf9d8368b6e1b02330102281f13a4`; Verify workflow adds Node parser tests in `c154016fe1bf97766f8ab02f630af520d794ed94`.
- Official data source confirmed: GET `https://ibass-api.jamb.gov.ng/api/ibass/eligibility-checker/{institutionId}` gives institution-specific programme IDs/titles. POST `https://ibass-api.jamb.gov.ng/api/ibass/eligibility-checker/submit` returns `programme_utme_subject_data` with required/optional subject lists and choice title. FUTA Microbiology test confirmed Biology/Chemistry/English required, Mathematics/Physics optional with one-of semantics. Old brochure modal/table selectors are removed from the staging function.
- Parser currently fails closed for unknown labels, missing English, and unverified secondary optional groups. It emits alternative groups as `{subject_codes: string[], minimum_required: number}`; compatibility with any future evaluator remains unverified. Each request is capped at 150 programmes; larger selection returns before any staging. Up to four read-only official detail requests run concurrently.
- CI runs `39134452901` (Verify) and `39134452893` (ACE JAMB E2E) for commit `c154016fe1bf97766f8ab02f630af520d794ed94` were still in progress at checkpoint time. Recheck those runs before reporting tests passed. The Edge Function is not included in the current frontend typecheck, and no Deno test has been run yet.
- No live function deployment, staging request, approval, publication, or DB write. Supabase project `uokiqlgmzprqfbzmedaz` last verified with 791 institutions, 0 programs, 0 UTME rules, 4 existing import batches; deployed functions still `catalog-import` v7 and `ibass-catalog-stage` v4.
- **Next action:** check CI results; add Deno/runtime coverage for parser + source API response contracts; verify alternative group semantics on more official programmes and reconcile the target evaluator contract. Only after those checks, stage one institution as a review-only test; do not deploy or publish. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## CI follow-up — Deno type-check adjustment (2026-10-18)
- Verify run `39134557338` for commit `25e0d20cbc1e66c325131fc11c26871f14f0f912` passed all six Node parser tests, then failed at Deno check because the Supabase Edge Runtime remote declaration references missing `npm:openai@^4.52.5`. Frontend typecheck/build were skipped. This is a toolchain/declaration dependency issue requiring verification, not a passed Edge Function check.
- Verify workflow now runs `deno check --no-check=remote supabase/functions/ibass-catalog-stage/index.ts` at commit `26f381d6972848fc112fd732db7be75af0920b57`. Verify run `39134695379` and E2E run `39134695400` were still in progress at checkpoint time. Recheck both and read logs for any new errors.
- **Next action:** confirm the adjusted CI result; if local check still fails, use a dedicated Deno configuration or an isolated local syntax/typecheck that does not resolve the unrelated remote OpenAI declaration. Then continue evaluator-contract review before any staging trial. No deployment/staging/approval/publication or DB writes.


## Latest source adjustment — 2026-10-18
- Deno check still failed with `--no-check=remote` because the explicit Supabase Edge Runtime declaration imported an unrelated missing OpenAI npm type dependency. Removed `import "jsr:@supabase/functions-js/edge-runtime.d.ts";` from `supabase/functions/ibass-catalog-stage/index.ts` in commit `3ca00b5a831556090be41991d7545e4dda94e87e`. Verify and E2E for that commit were queued; check run outcomes. No deploy or database write.


## Exact continuation checkpoint — UTME alternatives + deployment guard (2026-10-18)
- Verified official API response shape: GET `/api/ibass/eligibility-checker/{institutionId}` returns a top-level `status` and `data` programme list; POST `/api/ibass/eligibility-checker/submit` returns structured `programme_utme_subject_data`. Four FUTA programme examples tested read-only: Microbiology, Biochemistry, Computer Science, Agricultural Engineering. Subject aliases used are present as active codes in live `ace.subjects`.
- Onboarding now renders official optional-subject checkboxes and sends four selected subject IDs to new RPC `ace.save_student_foundation_catalog_with_subjects`. New migration: `supabase/migrations/20261018143241_batch_2_utme_subject_choice.sql`; current final migration commit `30cc19001519ddc01215e9c523d6c92555e24846`. Do not apply until SQL is tested in a disposable database. Live Supabase still has no programs/rules; no stage request has been sent.
- Deno parser check, Node parser fixtures, frontend typecheck/build and E2E passed on earlier commits: Verify `91df16fab9360da38918007216ca6e4463ce4924` passed; E2E also passed for that commit. Verify for onboarding commit `ed85fca0c4d175a332ba90f9ef7eb5690f773775` passed. Recheck latest workflow-guard commit `1f2e3366f8dcaaef99f6ab8c844fedb7ad42bb2d` before claiming current checks pass.
- Important deployment finding: automatic push deploy ran as workflow `39135691876`, but Cloudflare API rejected the configured token (10000/9109) at the deploy step, so no Worker deploy succeeded. The workflow now has only `workflow_dispatch`; do not initiate it until credentials are repaired and the user explicitly authorizes production deployment.
- Exact next action: recheck latest Verify/E2E; test migration/RPC in a disposable database, including fixed, one-of, missing-required, wrong-option, duplicate, and inactive-subject cases; add/execute frontend onboarding test. Then review before applying migration. Afterwards stage one institution only into review batches and validate; do not approve or publish. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## SQL migration test checkpoint (2026-10-18)
- New isolated Postgres 16 integration test `tests/sql/utme_subject_choice.test.sql` is wired into `.github/workflows/verify.yml`. It executes migration `20261018143241_batch_2_utme_subject_choice.sql` against disposable fixture schemas and checks valid alternative selection plus invalid/missing/duplicate/inactive choices.
- First job `39136090924` failed because test calls used integer `300` while RPC argument is `smallint`. Fixture corrected to `300::smallint` in commit `024dd88295f49ab16aed85fcad65959c3a4f83dc`. Recheck latest CI; do not infer migration pass from the failed fixture run.
- No live migration deployment or Supabase writes. Deployment workflow is manual-only; prior Cloudflare deploy run failed at token authentication and did not deploy.


## PostgreSQL migration test result — 2026-10-18
- Corrected fixture commit `024dd88295f49ab16aed85fcad65959c3a4f83dc`: disposable PostgreSQL 16 migration test job passed (`39136190437`). The real migration applied in the isolated database; valid alternative selection and rejection cases for missing required subject, wrong option, duplicates and inactive subject all passed. English was asserted as primary subject.
- Full frontend Verify/E2E for the newest checkpoint commit may still be running; recheck before claiming all latest CI complete. Live migration not applied; no catalogue staging/publication.


## Live migration applied — 2026-10-18
- Applied migration `batch_2_utme_subject_choice` to Supabase project `uokiqlgmzprqfbzmedaz`; verified recorded version `20261018143241` and function privileges/signature by read-only SQL. Repository file is `supabase/migrations/20261018143241_batch_2_utme_subject_choice.sql` and the disposable SQL test points to that file.
- Verified live catalogue unchanged: 791 institutions, 0 programmes, 0 UTME rules, 4 pre-existing batches. No staging/approval/publication or Edge Function deployment.
- Confirm CI for the synchronized filename; then inspect security advisors and stage one institution into review-only batches with authenticated admin/editor access. Do not approve or publish. The 2027 season is still draft; no active season exists.


## Post-apply advisor verification (2026-10-18)
- Security advisors after applying the RPC migration reported only the pre-existing `auth_leaked_password_protection` warning; no new security lint was returned. The function remains intentionally SECURITY DEFINER, requires `auth.uid()`, and grants EXECUTE to authenticated only (anon/public denied).
- CI for latest filename/docs synchronization is still in progress; prior commit `024dd88295f49ab16aed85fcad65959c3a4f83dc` passed Verify, isolated PostgreSQL migration tests, and E2E. Confirm latest CI before closing the current action.

## Live student-account failure investigation — 2026-10-18

- User screenshot shows the deployed app's generic “We couldn’t prepare your account” screen at the Cloudflare Worker origin.
- Read-only Supabase logs correlate the failure with repeated authenticated POST /rest/v1/rpc/is_admin requests returning HTTP 406 and PostgREST PGRST106 (latest observed 2026-10-18 15:26:53 UTC). This occurs before device registration/profile/onboarding logic, so those later steps are not the present root cause.
- src/components/StudentFoundationGate.tsx and src/components/AdminFoundationGate.tsx invoke ace.rpc('is_admin'); src/lib/supabase.ts binds the client to custom schema ace. ace has USAGE granted to authenticated (verified read-only SQL), but the PostgREST error indicates the requested schema is not currently exposed by the Data API. SQL current_setting('pgrst.db_schemas', true) was null and authenticator has no pgrst.db_schemas role override; do not attempt to change API exposure through an unverified SQL workaround.
- Current repo HEAD observed: 4d165f57a2a348367f258a4998ef1091831606d9 (docs: record post-migration security advisor result). GitHub combined commit status returned no status records; CI outcome for latest main remains unverified. No application code, database rows, API settings, or deployment were changed during this investigation.
- Exact blocker / user action: in Supabase Dashboard for project nova-ace-jamb (uokiqlgmzprqfbzmedaz), open Project Settings → API (Data API / Exposed schemas), ensure custom schema ace is in the exposed schemas list, and save. Preserve least privilege: do not grant USAGE to anon; the live read-only check showed anon currently has no ace schema USAGE. Existing table/RPC grants and RLS must remain the authorization boundary.
- After the setting is saved, retry the app and recheck Supabase logs. Expected evidence is is_admin no longer returning PGRST106; then exercise admin/student routing, profile/preference reads, device registration and onboarding save. Do not treat the issue as fixed until the real flow passes.
- Next action: user enables ace in Supabase Data API exposed schemas, then integrator verifies API behavior and latest CI before proceeding with Batch 2 review-only staging. Do not stage, approve, publish, deploy functions, or deploy frontend as part of this fix without the required checks/authorization.


## Account preparation recovered; resume Batch 2 — 2026-10-18
- User reports the ACE app is back and working after adding custom schema `ace` to the Supabase Data API exposed schemas.
- Live log verification confirms recovery of the gate RPC: POST `/rest/v1/rpc/is_admin` returned HTTP 200 twice at 2026-10-18 15:53:18 and 15:53:23 UTC. In the 24-hour log summary, 8 requests returned 200 and the earlier 35 requests returned 406/PGRST106; latest 406 was at 15:26:53 UTC. The later successful requests support that schema exposure fixed the gate. Full student/admin route, preference read, device flow, and onboarding-save behavior are not independently verified by the available request logs; user reports the app is back.
- Live catalogue counts verified using actual schema/table names: 791 `ace.institutions`, 0 `ace.programs`, 0 `ace.program_utme_rules`, 4 `ace.catalog_import_batches`. No catalogue rows were modified. Existing counts for `profiles`, `student_preferences`, and `devices` were read only; do not treat counts as a user-specific onboarding test.
- CI remains UNVERIFIED: GitHub combined status for latest known main commit `2f902a3ef30812a023e254f8f131da6c3b5a8bdf` returned no status records, and the workflow-run connector only returned no PR-triggered runs. Prior commit `024dd88295f49ab16aed85fcad65959c3a4f83dc` passed Verify, disposable PostgreSQL migration integration, and ACE JAMB E2E; confirm current main CI through Actions before claiming latest checks pass.
- Next documented project action remains Batch 2: confirm current Verify/E2E and migration filename synchronization, then use an authenticated admin/editor session to stage one institution only into a review batch and validate it. Current database catalogue has no programs/rules, so do not invent official catalogue facts. Do not approve or publish. Batch 3 remains locked; 2027 season remains draft and no active season exists. Deployment workflow is manual-only and must not be run without repaired credentials and explicit production-deployment authorization.


## Batch 2 safety gate — existing admin importer is not review-only (2026-10-18)
- User confirmed they are signed in as administrator/editor. Their browser session is not accessible to this agent's connected browser; no authenticated admin action was performed.
- Inspected `src/components/AdminCatalogueImport.tsx` and `supabase/functions/catalog-import/index.ts`. The current admin importer is explicitly a bulk 791-row workflow: it requires exactly 791 workbook rows split NUC 328 / NBTE 199 / NCCE 264, stages three authority-specific batches, then automatically calls `validate_catalog_batch`, `approve_catalog_batch`, and `publish_catalog_batch`, finally asserting 791 institutions. It is NOT a safe path to stage one institution into review-only status. Do not ask user to upload a workbook or click Choose XLSX for this milestone; that could approve/publish data.
- Edge Function `catalog-import` itself stages supplied rows as `staged` and enforces authenticated admin/editor role and reviewed/approved source. However the current frontend immediately follows staging with validation, approval, and publication. No import request was sent; no catalogue rows were modified.
- Live `ace.catalog_import_batches` status summary: 3 published institution batches and 1 rejected institution batch. Live catalogue remains 791 institutions, 0 programs, 0 program UTME rules. No active exam season is present; 2027 season remains draft.
- Exact next action: implement a separate, explicit single-row review-only staging path in the admin UI (or use a documented existing review-only admin route if discovered), with a source that is already reviewed/approved, one selected institution, payload preview, and a strict stop after `catalog-import` returns `status=staged`; do not invoke validation/approval/publication from that path. Add tests proving only one row is submitted and no approve/publish RPC is called. Recheck latest CI first/alongside this change. Do not stage production data until this safe path is available and reviewed. Batch 2 remains in progress; Batch 3 locked.


## Review-only staging UI implementation — 2026-10-18
- Current verified main commits include review-only component `12c362b4c646de89b6d03d1792a9eebe5a2bc06b`, admin gate integration `60e5246ecc9e76801ab74c75f38c423404d42921`, static safety tests `2417607f97fb0efb02f88da932ecaa9f432986e5`, CI wiring `1af0d018830465c25b916ce71ed0278e303ae95b`, and progress handoff `7af02783293291d1ef800df1adc9229bacb8c675`.
- Added `src/components/AdminReviewOnlyStage.tsx`, mounted in `src/components/AdminFoundationGate.tsx` before the existing bulk importer. It selects one existing institution, requires a matching approved source and explicit confirmation, previews the payload, and calls only `catalog-import`. It requires response `status=staged`, `row_count=1`, and `batch_id`. It does not invoke validate/approve/publish RPCs.
- Added `tests/review-only-stage.test.mjs` and wired it into Verify. These are static source-contract tests; authenticated browser QA and real staging remain outstanding.
- Live Supabase read access verified: `catalog_sources` contains approved authority sources and reviewed/approved IBASS sources; live Edge Functions remain `catalog-import` v7 and `ibass-catalog-stage` v4 with JWT verification. No deployment or live staging request was made. No live data was changed.
- CI for the latest main HEAD has not yet been verified. Do not claim the new test, typecheck, build, SQL integration, or E2E passed until Actions evidence is inspected.
- Exact next action: check CI on latest `main`; if green, use the separate **Single-row review-only staging** UI in the authenticated admin dashboard (never the XLSX bulk importer), stage one selected institution, and verify one new pending row/batch via read-only SQL. Stop before validation, approval, or publication. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## Review-only staging live verification — 2026-10-18
- User screenshot showed the admin UI reporting batch `993bfb6c-b6d0-4ace-9e6e-4db48df064f7` staged with one row.
- Read-only SQL against live Supabase project `uokiqlgmzprqfbzmedaz` verified the batch exists with `dataset_type='institutions'`, `status='staged'`, recorded `row_count=1`, and exactly one associated `ace.catalog_import_rows` row. The row has `validation_status='pending'`, `published_id IS NULL`, `entity_type='institution'`, external key `COE0001`, and payload name A.D. Rufa'i College of Education, Legal and General Studies, Bauchi. The source is `NCCE accredited colleges of education` and source status is `approved`.
- The batch metadata records purpose `review-only safety verification`, importer `nova-ace-review-only-single-row`, and the institution ID. Current institution record remains `draft`. No validation, approval, publication, or data mutation was performed during this verification.
- Inspected deployed `catalog-import` Edge Function v7 source: it validates authenticated user and `ace.can_manage_catalog()`, then calls only `ace.stage_catalog_import` for this request and returns the staging result. This function itself does not call validation/approval/publication. Its request schema matches the UI's `source_id`, `dataset_type`, `rows`, and `metadata` shape. JWT verification is enabled.
- GitHub combined status for `76c7a04444b6250089b3c6617026167ffaa4d0df` returned no status records; latest CI remains UNVERIFIED. No successful test/build/E2E claim is made.
- **Next action:** inspect GitHub Actions directly or obtain a usable checkout/runtime to run the workflow checks; then inspect the deployed site’s actual browser flow and verify UI test/build results. Keep the current batch staged; do not validate, approve, or publish it. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## Latest CI verification — 2026-10-18
- GitHub Actions runs for current docs checkpoint commit `d4fbbccb1b238af22dbe81e6de32f6f77fd05f55` have completed successfully.
- Verify run `39171595079`: both `verify` and `utme-subject-choice-migration` jobs passed. Verified steps include Node parser + review-only staging tests, Deno check for `ibass-catalog-stage`, `npm run typecheck`, `npm run build`, and the disposable PostgreSQL migration integration test.
- ACE JAMB E2E run `39171595081`: job `e2e` passed, including typecheck, build, Playwright browser tests, and artifact upload.
- This is repository CI evidence, not a manual authenticated browser test of the deployed staging component. The previously verified live batch `993bfb6c-b6d0-4ace-9e6e-4db48df064f7` remains staged with exactly one pending row and no published ID.
- **Next action:** inspect the admin frontend gate for a safety issue: the review-only panel is mounted in the same admin view as the bulk importer, and source matching currently requires an existing institution's provenance to point to an approved source. Review whether the selector can accidentally create duplicate staging batches on repeated clicks and whether the function/RPC enforces duplicate-batch/idempotency safeguards. Do not validate, approve, or publish the current batch. After this review, continue authoritative catalogue ingestion only with verified source coverage and explicit safety gates. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## Authoritative IBASS pipeline review — 2026-10-18
- Inspected repository supabase/functions/ibass-catalog-stage/index.ts and parser.js, plus live ace.validate_catalog_batch, ace.publish_catalog_batch, and ace.stage_catalog_import definitions. No function calls or database mutations were performed.
- Live read-only query confirms catalogue remains 791 institutions, 0 programs, 0 programme UTME rules. Seasons: 2026 is closed; 2027 is draft. The programme endpoint source 16388e42-7bed-4541-89ff-8ffb0e648425 is approved; brochure detail source 9959f7d6-0071-4ab3-880c-a79f3c81e561 is reviewed.
- Pipeline safely refuses ambiguous institution mappings, missing official IDs, missing programme identifiers, mismatched IBASS requirement responses, unrecognized subject labels, and unsupported second optional-subject groups. Parser tests cover several cases. However, the function uses a hardcoded generic REQUIREMENTS_REQUEST (including fixed UTME subjects) when querying programme requirement details; this needs validation against official API semantics before a broad run.
- The Edge Function stages program and UTME-rule batches via two separate catalog-import requests. If the program staging request succeeds and the rule request fails, a partial staged result can remain; this is not a published-data mutation, but it requires operator reconciliation. The function also permits passing a draft season because it only rejects archived seasons. Live 2027 season is draft and 2026 is closed; do not run broad staging until season targeting is explicitly confirmed.
- The publication RPC can publish program/rule records only after separate validation and approval; program publication resolves institution by institution_external_key matching institution jamb_code or UUID, and UTME rules resolve the program by external key/provenance. Current code appears to use UUIDs consistently for institution lookup and shared external keys for program/rule linking.
- No official programme ingestion was triggered; no rows were staged, validated, approved, published, or otherwise changed in this investigation.
- Next action: verify official IBASS requirements endpoint behavior with a small read-only request/response fixture and ensure the generic request does not contaminate or constrain returned requirements; then implement an explicit dry-run/preview mode and partial-staging reconciliation reporting before invoking staging for the draft 2027 season. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## IBASS endpoint read-only probe — 2026-10-18
- Performed read-only fetches of the official JAMB legacy endpoints. `subjects_jamb.json?v=1` returned a subject list (e.g. Agriculture, Arabic, Art, Biology, Chemistry, CRS, Commerce, Economics, French, Geography, Government, Hausa, History, Home Economics, Igbo, Islamic Religious Studies, Literature in English, Mathematics, Music, Physics, Principles of Accounts, Yoruba). `load_programs.php?school=1` returned an empty JSON array; this single numeric ID is not sufficient to infer the endpoint is broken or determine the correct programme-request contract. Fetching `institution_data.json?v=1` through the read-only extraction provider returned `empty_content`, so its structure was not verified in this probe.
- A search for public documentation of `ibass-api.jamb.gov.ng/api/ibass/eligibility-checker/submit` did not yield an authoritative contract sufficient to confirm whether the fixed `REQUIREMENTS_REQUEST` fields influence `programme_utme_subject_data`. This remains unresolved; no POST was sent to the IBASS requirements endpoint and no catalogue ingestion was invoked.
- Current parser safely rejects unrecognized subject labels, missing English in required subjects, unclear optional-subject counts, and any populated `optional_subjects_by_group2`. The current alias map does not include some labels present in the official legacy subjects JSON, including Hausa Language, Igbo Language, Islamic Religious Studies, and possibly other source variants; this may cause safe false negatives until aliases are mapped to verified `ace.subjects` codes. Do not blindly add aliases until the actual database subject-code catalogue is inspected.
- No source code was changed in this investigation. Live programme and rule counts remain 0 as last observed; no new staging batches were created. The original single-row institution batch remains staged.
- **Next action:** inspect `ace.subjects` active codes and the full deployed IBASS endpoint response contract using one institution ID discovered from the official hierarchy, then create deterministic response fixtures/tests to establish request semantics and expand only verified aliases. After that, implement preview/dry-run and partial-staging reconciliation before any broad import. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## Catalogue replacement investigation — 2026-10-19
- Re-inspected current main files: `StudentOnboarding.tsx`, `StudentFoundationGate.tsx`, `studentService.ts`, `seasonService.ts`, current master handoff, IBASS progress handoff, and `ibass-catalog-stage` v4 source. Catalogue is a hard onboarding gate: active institutions → active programmes → active-season active UTME rule → exactly four selected subjects → `save_student_foundation_catalog_with_subjects`. Missing catalogue blocks course selection and onboarding completion.
- Official IBASS brochure-by-institution and eligibility pages are publicly accessible, but a stable documented API contract suitable for a live-only replacement is not verified. The old `load_programs.php?school=1` probe was not a valid basis to judge endpoint health; full institution hierarchy and deployed requirements POST semantics remain unverified. No POST, import, database write, or deployment occurred.
- Recommended direction: do not drop catalogue tables/records. Make preparation onboarding independent of catalogue completeness, with subject selection available and institution/course eligibility clearly unresolved until backed by a verified season-specific rule. Retain a small audited local catalogue/cache and an official JAMB checker fallback. Detailed investigation: `docs/CATALOGUE-REPLACEMENT-INVESTIGATION-2026-10-19.md`.
- No app code changed; no tests run. Main branch's historical `src/components/AdminIBASSProgrammeImport.tsx` path returns 404 and must not be assumed present.
- Next action: inspect SQL/RLS for `save_student_foundation_catalog_with_subjects` and onboarding completion, then implement the smallest additive preparation-only save path with tests. Batch 2 remains IN PROGRESS; Batch 3 remains LOCKED.


## Preparation onboarding decoupling — 2026-10-19
- **Decision approved by user:** keep the catalogue and decouple preparation onboarding from catalogue completeness.
- **Code added:** `supabase/migrations/20261019120000_preparation_onboarding_without_catalogue.sql`; new authenticated RPC validates 4 distinct active subjects, auth, score, display name and study minutes; unresolved institution/course text is not treated as verified structured catalogue data.
- **Frontend/service:** `src/lib/studentService.ts` now calls the new preparation RPC; `src/components/StudentOnboarding.tsx` selects four preparation subjects without institution/programme/rule dependencies and labels them as not an official combination; `src/components/StudentFoundationGate.tsx` no longer requires institution/course text to enter the app and requires exactly four saved subjects.
- **Tests:** extended `tests/sql/utme_subject_choice.test.sql` with preparation-only save assertions, unauthenticated-call rejection, and deletion of fixture catalogue rows before the prep-only save to prove the empty-catalogue path. This runs only in disposable CI PostgreSQL.
- **Live schema read:** profile institution/course text and structured institution/programme IDs are nullable; student preferences and student subjects tables are present. No production data changes or migration application performed.
- **Changes committed through multiple GitHub Contents API commits; latest HEAD and CI status still need verification.**
- **Not yet verified:** npm typecheck/build, SQL migration test, authenticated browser/E2E, production migration/deployment.
- **Exact next action:** fetch current `main` HEAD and latest Verify workflow runs; inspect logs for typecheck/build/SQL failures and fix before any production migration. Keep Batch 2 IN PROGRESS and Batch 3 LOCKED.


## Official subject inventory research and parser aliases — 2026-10-19
- Inspected JAMB eligibility subject endpoint `https://eligibility.jamb.gov.ng/subjects_jamb.json?v=1`, IBASS eligibility checker, e-syllabus and brochure pages.
- The observed endpoint returns 22 subject labels: Agriculture, Arabic, Art, Biology, Chemistry, Christian Religious Studies, Commerce, Economics, French, Geography, Government, Hausa Language, History, Home Economics, Igbo Language, Islamic Religious Studies, Literature in English, Mathematics, Music, Physics, Principles of Accounts, Yoruba Language. English is not in that JSON response, but IBASS eligibility checker explicitly says select 4 UTME subjects including English. Do not treat this endpoint payload as proven exhaustive; e-syllabus content is paginated and fetch extraction did not reveal every row.
- Updated parser aliases for Agriculture Science and exact labels Hausa Language, Igbo Language, Islamic Religious Studies, Yoruba Language; added parser test coverage for every observed label.
- Read-only production `ace.subjects` query returned 25 active rows, including Computer Studies, Use of English, and Physical and Health Education. IBASS e-syllabus search confirms Computer Studies appears in the official subject listing. The eligibility JSON omits Computer Studies, PHE, and English, so it is not an exhaustive inventory. PHE remains unverified from current official IBASS evidence; no production rows were changed.
- Latest parser/test commits: `74175a7f402977420132f95409ce7561414f29cc`, `7087af857d5e3394a3ca748f4841baf4c279b867`. Current CI for those commits still needs inspection.
- No live data, production migration or deployment changed.
- Next action: inspect CI for parser commits, then find complete current IBASS subject inventory and compare against `ace.subjects`; do not bulk-add unverified entries.


## CI verification and IBASS inventory follow-up — 2026-10-19
- Refreshed repository state: `main` HEAD `f489713e5ada29b3e06b750c2929644e1c587a26`.
- Verify workflow run `39177813651` passed on this HEAD: parser/review-only-stage Node tests, Deno type check for `ibass-catalog-stage`, `npm run typecheck`, `npm run build`, and disposable PostgreSQL `utme-subject-choice.test` migration job all succeeded.
- ACE JAMB E2E workflow run `39177813601` passed on this HEAD, including typecheck, build, Playwright browser tests and artifact upload. The exact official-label parser test also passed in Verify run `39177774340` for commit `7087af857d5e3394a3ca748f4841baf4c279b867`.
- Official IBASS e-syllabus page displays 12 entries and client-side pagination controls. Adding URL query parameters `?page=2` / `?page=3` did not change extracted results; this approach does not retrieve the remaining pages. Search results and visible first-page content confirm Computer Studies is included. No current official evidence for Physical and Health Education was found in these searches.
- Inventory conclusion unchanged: the official eligibility JSON's 22 rows are not exhaustive; ACE production has 25 active subject rows; PHE remains unverified and must not be deleted without evidence. No live subject rows, production migration, or deployment changed.
- **Next action:** inspect IBASS's actual pagination/data-loading mechanism or discover an authoritative full subject inventory endpoint, then compare each source label to `ace.subjects`. Do not bulk-add or delete subjects based on incomplete extraction. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## Official subject pagination probe retry — 2026-10-19
- Refreshed main HEAD: `55c102de9d68f21ccf765c559cbefb8b17189fb4`; read both handoff documents.
- Tried official IBASS structured HTML/JSON, `?page=2`, `?page=3`, and DataTables-like `draw/start/length` query parameters. The fetch provider still returned only first-page subject rows or no rows, and did not expose pagination targets or later-page contents. This route is blocked/inconclusive; do not retry identical URL query tricks without new evidence.
- Official eligibility endpoint still returns 22 subjects; read-only production ace.subjects query returns 25 active rows. Official e-syllabus first page confirms Computer Studies; official eligibility UI makes English a required selection despite its JSON omission. PHE remains unverified. No live subject writes, migrations, or deployment occurred.
- Next action: find the official page JavaScript/data endpoint or official syllabus download that yields the full subject list, then reconcile labels with production ace.subjects. If the connected fetch route cannot inspect scripts, use an alternative permitted public-source route or document the precise access limitation before asking the user for any needed access. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## Official JAMB bulletin cross-check — 2026-10-19
- Further official-source search found JAMB bulletin PDFs dated 2022 that explicitly mention Computer Studies or Physical and Health Education as selectable UTME subjects. This is historical corroboration, not proof of the complete current-season list.
- Current official eligibility homepage search text also includes Physical And Health Education, but the official `subjects_jamb.json` payload excludes both PHE and Computer Studies. The official e-syllabus first page confirms Computer Studies. Keep existing PHE row pending stronger current-season verification; do not delete or duplicate it.
- Official IBASS extraction still exposes only the first 12 e-syllabus cards and hides the app bundle/API references; pagination URL probes did not retrieve pages 2–3. `robots.txt` permits crawling, but `sitemap.xml` returned empty content through the extraction provider. This route remains inconclusive.
- No production subject changes, migrations, staging or deployments. Current inventory is still not certified complete.
- Next action: inspect the official frontend bundle or live eligibility UI's selectable subject list and compare against the current-season JAMB source; then make only evidence-backed catalogue changes with tests. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## Decision — stop subject-inventory investigation and proceed — 2026-10-19
- Subject inventory research is timeboxed and **closed for this workstream**. Do not repeat official IBASS pagination probes or keep catalogue completeness as a blocker.
- Use the existing 25 active production subject rows as the working baseline. Keep existing Computer Studies and Use of English entries and retain Physical and Health Education pending new authoritative current-season evidence. Do not bulk-add/delete rows or claim the inventory is fully certified.
- Known limitation: official eligibility JSON has 22 labels and is incomplete; IBASS e-syllabus confirms Computer Studies; English is required by the eligibility UI; current-season PHE status remains unresolved. This is deferred, not treated as verified.
- **Next concrete action:** refresh current main CI results and inspect catalogue-import deployed/source drift plus onboarding migration readiness. Continue implementation after verification; no production migration/deployment without passing checks and a confirmed safe path. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## Execution checkpoint — 2026-10-19
- Current main HEAD before this note: 3cae57fe9497fa5bb084c6474d8e4f0738c7723d.
- Verify run 39179042756 passed parser tests, Deno check, npm typecheck/build and disposable PostgreSQL subject-choice migration test. E2E run 39179042775 passed typecheck/build but Playwright browser installation/tests were still running at last check.
- Production migration history ends at 20261018143241_batch_2_utme_subject_choice. New migration 20261019120000_preparation_onboarding_without_catalogue.sql is not applied; read-only function lookup returned null. No migration/data writes performed.
- catalog-import repo source and deployed v7 differ materially. Repo checks source review/season state and writes batch/rows directly; deployed v7 uses can_manage_catalog and stage_catalog_import RPC, with CORS handling, but lacks the source-review/season checks visible in repo source. Do not redeploy before reconciling and testing both behavior and RPC privileges.
- Next: refresh E2E result, inspect stage_catalog_import migration/privileges and import tests, reconcile drift with regression coverage. Keep onboarding migration unapplied pending verification. Subject inventory research is closed/deferred. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## Catalogue importer reconciliation — 2026-10-19
- Repository function aligned to deployed `catalog-import` v7 RPC architecture in commit `de074f6f5acc97b1cffe9ad49b9342ba634da8c1`. It now handles OPTIONS/CORS, validates caller JWT and `can_manage_catalog`, enforces payload bounds, delegates staging to `stage_catalog_import`, and returns sanitized errors. Direct non-atomic table inserts were removed.
- Added `tests/catalog-import-contract.test.mjs` in commit `1b9053cb202e65ea3430e0aed0ecfa19d405ecf6`. It asserts the atomic RPC/auth/CORS contract and prevents accidental direct inserts or DB error leakage.
- Live read-only `pg_get_functiondef` confirmed `can_manage_catalog()` checks `ace.roles` against `auth.uid()`; `stage_catalog_import(...)` checks caller role, dataset/row bounds, source reviewed/approved state, season existence/archive state, snapshot idempotency, and stages batch+rows in one transaction. Function ACL lists `authenticated` execute. This resolves the earlier concern that the deployed RPC omitted source/season checks.
- New source/test commits occurred after the previous successful CI runs. Latest verified successful CI is still for pre-change HEAD `548fc58f516d796b42cd0d7363c5d799c36fe75f`; current commits need fresh Verify and E2E results.
- Source-control blocker: live migration ledger includes `20261006124552_add_catalog_manager_role_check`, `20261006125056_add_catalog_source_lookup`, `20261006125420_add_catalog_import_idempotency_check`, `20261006125836_add_atomic_catalog_import_staging`, and `20261006130820_add_ibass_institution_stage_lookup`, but corresponding migration files are absent from current main migration directory. Do not deploy or alter the live RPC until this migration drift is reconciled. No production migration/deployment or catalogue writes performed.
- Onboarding migration `20261019120000_preparation_onboarding_without_catalogue.sql` remains unapplied; live RPC lookup previously returned null.
- **Next action:** refresh CI for current main, then recover/reconcile missing migration source files from verified deployment/history; afterward continue onboarding migration readiness checks. Batch 2 IN PROGRESS; Batch 3 LOCKED.

## CI coverage correction — 2026-10-19
- Verify + E2E succeeded on `893fb9af417ca0a0e69746810f6e369935277aa0`, but Verify job inspection showed the new `tests/catalog-import-contract.test.mjs` was not included in the test command and `supabase/functions/catalog-import/index.ts` was not Deno-checked.
- Updated `.github/workflows/verify.yml` to run the new contract test and type-check the importer with Deno (`--no-check=remote`) in commit `3eefab18992c276794aac2323faa8f5672c6824b`. CI for this change is pending.
- Live deployed function v7 still has raw `detail` response fields for permission/staging errors and accepts array payloads as object payloads. Repository source sanitizes those errors and rejects arrays. Do not claim deployed/source parity or deploy before the missing historical migration source is reconciled and the new CI passes.
- **Next action:** verify the workflow run for the current main HEAD, then continue source recovery for the five production-only migration versions and onboarding migration readiness. No production writes/deployments.



### Migration-source recovery and onboarding test review — 2026-10-19
- GitHub file-history queries for three representative missing migration paths (20261006124552_add_catalog_manager_role_check.sql, 20261006125836_add_atomic_catalog_import_staging.sql, 20261006130820_add_ibass_institution_stage_lookup.sql) returned no commits. These five production-ledger migration source files cannot be recovered from those expected repository paths/history; do not fabricate their original historical contents.
- Read-only production schema inspection confirmed catalog staging functions, constraints and indexes exist, including unique partial index ace.uq_catalog_import_batches_snapshot_hash. Keep this source-control drift open and avoid deployment until a safe forward reconciliation is designed and tested.
- Existing disposable PostgreSQL test script tests/sql/utme_subject_choice.test.sql also applies 20261019120000_preparation_onboarding_without_catalogue.sql and checks prep-only save with empty goals, four active subjects, preference persistence, clearing unverified structured catalogue IDs, and unauthenticated rejection. Verify workflow runs this SQL script; the latest workflow rerun after importer test/Deno-check correction is still in progress at time of this note.
- The onboarding RPC remains absent from production (to_regprocedure(...) previously returned null); no migration has been applied.
- Next: confirm current Verify + E2E runs; if green, design a separate forward-only source reconciliation for missing catalog RPC/indexes using live definitions and disposable PostgreSQL tests, then review onboarding deployment safety. No production changes/deployments.



### Importer Deno check failure and correction — 2026-10-19
- First run with expanded Verify coverage: contract tests passed (14 total), disposable PostgreSQL onboarding/UTME migration test passed, but Deno check for catalog-import failed before checking the function because the optional edge-runtime.d.ts import triggered a missing npm:openai package resolution in the runner. The deployed function's sibling ibass-catalog-stage source does not use this type-only import.
- Removed the unnecessary edge-runtime.d.ts import from supabase/functions/catalog-import/index.ts in commit fe83e32501790e4139e6b8729b9cfe6be7cc83bb; Deno provides the runtime globals and the file still uses Deno.serve. Fresh Verify/E2E is pending. Do not count the importer Deno check as passed until a new run succeeds.
- Existing run 39180989334: contract tests PASS; disposable PostgreSQL migration test PASS (including prep-only onboarding assertions); importer Deno check FAIL due to package resolution; later steps skipped. Failure diagnosed from job logs, not inferred.
- Next action: confirm Deno check and full Verify/E2E on the current HEAD; if Deno still fails, adjust the type-check setup without adding unnecessary runtime dependencies. No production migration/deployment.

## Batch 2 execution checkpoint — 2026-10-19
- Latest verified main before this checkpoint update: e64a696e596cbf6a2f8e803ea755d1ddc23278b0. Master handoff has since been updated in commit 9b62b5a3a6d7de25920e543c1f1ab196d722cead.
- Verify run 39181108028: SUCCESS. Verified steps include the catalogue importer contract tests, Deno checks for both Edge Functions, app typecheck/build, and disposable PostgreSQL onboarding/UTME migration test. E2E run 39181108062: SUCCESS. The previous importer Deno resolution failure is resolved.
- Read-only live DB counts: 791 institutions; 0 programs; 0 program_utme_rules; 13 catalog_sources; 5 import batches; 793 import rows. All 791 institutions are draft and have no JAMB code. The three published institution batches have 328, 199, and 264 rows, but published here means imported to draft catalogue records, not launch-ready activation.
- A rejected incomplete 791-row batch has only one persisted row; do not retry it as canonical. Test-only staged batch 993bfb6c-b6d0-4ace-9e6e-4db48df064f7 is one review-only row and must not be approved/published.
- Active ibass-catalog-stage requires an authenticated admin/editor caller JWT and stages up to 25 institution IDs per request. No authenticated user session is exposed by the current connector tools. No production write, stage invocation, migration, or deployment was attempted. Do not bypass caller authorization with service-role direct inserts.
- Five production migration versions dated 2026-10-06 remain absent from source control; do not redeploy catalog-import until a safe forward-only source reconciliation is designed/tested. Onboarding migration 20261019120000_preparation_onboarding_without_catalogue.sql remains unapplied to production.
- Exact next action: use an authenticated admin/editor session in the application to stage official IBASS programme records for a small batch of verified institution mappings (maximum 25 institution IDs per request); review unresolved mappings and counts, then continue bounded batches. After programme validation/review/publication, stage UTME rules preserving alternatives. If no UI action exists, add/enable an authenticated invocation path rather than sharing tokens in chat. Batch 2 remains IN PROGRESS; Batch 3 LOCKED.

## Batch 2 implementation checkpoint — 2026-10-19
- **Settled decision:** existing 25-subject catalogue baseline remains fixed; subject-inventory research is closed. Do not re-open the 791-institution/catalogue discussion as a scope decision. Proceed with Batch 2 implementation.
- **Repo/branch/HEAD before this change:** `DarealNovaking/Nova-ace-jamb` / `main` / `dd3270fbcaa8be8e29b19cf3e6a25fc979752055`.
- **Bug identified:** active routing in `src/main.tsx` sends `/admin` and `/admin-import` to `AdminFoundationGate`, but that gate omitted `AdminIbassStage`; the component existed but was not exposed in the active authenticated admin dashboard.
- **Implementation:** `AdminFoundationGate` now imports and renders `AdminIbassStage` after existing review/import panels. Existing auth gate and component's session/admin checks remain in force. No production data was changed and no stage request/deployment was made.
- **Verification status:** code path inspected; commit CI is pending. Runtime admin flow and live staging are unverified because no authenticated admin browser session is available through connected tools.
- **Next concrete action:** check the implementation commit's CI results. If passing, perform a small controlled stage via the authenticated app, inspect staged programme/rule batches and unresolved items, and only then plan the review/approval path. Batch 3 remains locked.


## Verification follow-up — 2026-10-19
- GitHub Actions verified the admin-route change and its documentation commits: Verify run `39210980334` and E2E run `39210980315` both completed successfully on HEAD `90baf9e5e30f5a8ebaa78dde369096d4ec47430a`. Earlier code commit and docs commit workflows also passed.
- Read-only Supabase counts: institutions 791; programs 0; program UTME rules 0; subjects 25; import batches 5; import rows 793. No production writes were made. Do not interpret these counts as a reason to reopen the settled catalogue decision.
- Deployed `ibass-catalog-stage` is active v4 with JWT verification. It validates the user and catalog manager role, accepts 1–25 institution IDs, discovers IBASS programme/requirement data and stages through `catalog-import`; no approval/publication is invoked by this function.
- **Blocked only at live authenticated execution:** no signed-in admin browser session is exposed by connected tools. UI reachability and CI are verified, but real staging and batch inspection are not.
- Next: authenticated administrator visits `/admin`, selects exam season and small agreed institution subset, invokes staging once, and reports/inspects batch IDs and unresolved rows before any approval/publication. Batch 3 locked; 25-subject baseline fixed.


## Verified continuation checkpoint — English-default preparation onboarding (2026-10-19)
- **Current task:** preparation-first student journey. The catalogue is no longer the primary journey or a gate to learning/CBT. Follow `docs/CATALOGUE-REPLACEMENT-INVESTIGATION-2026-10-19.md`; this supersedes stale checkpoint lines that prioritize Batch 2 ingestion.
- **Repository:** `DarealNovaking/Nova-ace-jamb`, branch `main`. Latest code commit for this task: `a9d731604984a3de5c664023fada4fa4affc69e8`; migration source update: `28bf75b6d4f1699e46b625f85e710bd97fa27564`. Master-handoff update: `2801115b6241f7f2f642928198be1391d93848de`. Refresh HEAD before further edits.
- **UI change:** `src/components/StudentOnboarding.tsx` automatically selects and locks the active `ENG` subject; user chooses exactly three additional subjects. Existing saved selections are normalized to English plus up to three active alternatives. Display clarifies English is included and counts the three remaining choices.
- **Database change:** updated migration `20261019120000_preparation_onboarding_without_catalogue.sql` requires four distinct active subject IDs including active English. Supabase `apply_migration` returned success for `preparation_onboarding_without_catalogue` on project `uokiqlgmzprqfbzmedaz`. Immediately before apply, read-only query confirmed 1 active ENG subject, 25 active subjects, and no existing `save_student_preparation_foundation` RPC. Do not expose student records or PII.
- **Verification status:** GitHub writes returned commits successfully; Supabase migration tool returned `success: true`. Build, typecheck, Playwright, CI, live RPC signature/grants after migration, and full student runtime journey remain pending/unverified in this session.
- **Open risks:** Confirm the UI always receives `ENG` among active subjects; if absent, onboarding intentionally blocks saving with an explanatory message. Confirm no active onboarding call site still uses legacy catalogue-required RPCs. The migration keeps legacy catalogue tables intact.
- **Exact next action:** inspect latest HEAD and workflow runs; run `npm run typecheck`, `npm run build`, and Playwright onboarding tests. Add an E2E assertion that English is checked/disabled and exactly three other subjects are required. Then verify the deployed RPC definition and authenticated-only grants read-only. Update this checkpoint and master handoff with real results.


## Batch 2 scope reset — preparation-first gate (2026-10-19)
- Product decision: Batch 2 completion is not gated on bulk catalogue ingestion. Student preparation/onboarding/learning/CBT must work without institution/programme/UTME-rule rows. Catalogue verification remains separate optional capability; do not delete legacy data/schema/RPCs.
- Revised acceptance criteria are recorded in `docs/ACE-JAMB-MASTER-HANDOFF.md`: secure preparation RPC; English auto-included + three other active subjects; no catalogue hard gate; explicit season/source verification; RLS/grant checks; Playwright for empty catalogue, persistence/reload, auth/error paths; both handoffs updated with evidence.
- Current HEAD before this scope update was `f758b231a9eec2488c1ed62511fde5a0b67d2666`. English UI commit `a9d731604984a3de5c664023fada4fa4affc69e8`; migration-source commit `28bf75b6d4f1699e46b625f85e710bd97fa27564`; migration applied live and RPC signature/grants/English validation verified read-only.
- CI at `f758b231a9eec2488c1ed62511fde5a0b67d2666`: Verify passed; ACE JAMB E2E passed. Treat these as pipeline outcomes only, not proof that revised acceptance criteria are all covered.
- **Batch 2 remains OPEN** pending Playwright-spec audit and evidence for empty-catalogue onboarding, English plus three selection, persistence/reload and navigation to learning/CBT. Do not unlock/declare Batch 2 complete just because catalogue is optional.
- Next action: inspect current E2E specs and all onboarding save/gate call sites, add targeted regression coverage, run CI, and update both handoff documents with real results. Do not ask the user to re-upload catalogue data or require any manual action yet.


## Preparation-first validation hardening — 2026-10-19

- Latest test change: 54833febb635c2e45d0e2d17960e39940c7ce6c9 expands tests/sql/utme_subject_choice.test.sql with empty institution/programme/rule rows and server rejection checks for missing ENG, duplicate subjects and inactive subjects.
- Active onboarding call path uses saveStudentPreparationFoundation → save_student_preparation_foundation; legacy catalogue RPC wrappers remain in studentService.ts but have no call from the active onboarding component. The gate checks profile/preferences/four saved subjects, not institution/programme/rule records.
- Current Playwright tests are only smoke checks (entry surface and mobile body). No authenticated onboarding assertions yet for English disabled/preselected, exactly three additional subjects, persistence/reload, empty catalogue, error handling or Learning/CBT navigation.
- Read-only production SQL confirms preparation RPC signature, authenticated EXECUTE=true, anon EXECUTE=false and English validation. No production writes were performed in this step.
- Supabase Security Advisor flags authenticated-executable SECURITY DEFINER functions (including this RPC) and disabled leaked-password protection. Review RPC body/authorization deliberately; signed-in students must be able to save only their own profile through auth.uid().
- Verify run 39331339786 and E2E run 39331339916 were in progress at time of note, both targeting 54833febb635c2e45d0e2d17960e39940c7ce6c9. Do not record them as passed until final workflow result is fetched. Local checks were not run.
- Exact next action: fetch final workflow/job outcomes; resolve any SQL failure; add authenticated Playwright coverage for onboarding selection, persistence/reload and Learning/CBT navigation. Batch 2 remains OPEN; no user action required yet.


- **Failed investigation / correction:** Verify run 39331339786 failed in the disposable SQL test because request.jwt.claim.sub was cleared for the unauthenticated case and not restored before new English/duplicate/inactive assertions. Job logs proved the auth guard fired first; the assertions were not actually validating the target rules. Fixed by restoring the synthetic test user claim before those assertions in commit b95e72071995a2ce99a4a5b893be5efac90f9c92. Await fresh Verify/E2E results; do not count the earlier failed run as a pass.


## First-time onboarding defect found and corrected — 2026-10-19

- Previous corrected SQL Verify and E2E workflows passed on 89c0718db20c78513846f205b588bcdb066471ca. These runs did not include authenticated onboarding tests; existing browser specs are smoke tests only.
- Found that a missing profile causes StudentFoundationGate to show onboarding, while StudentOnboarding previously rejected PGRST116 from getStudentProfile/getStudentPreferences, leaving first-time users with a load error.
- Fixed in b0a003f63bc5d6c7ff97e605b784ae4bb0c50e19: PGRST116 is treated as an absent optional profile/preferences row and default values are used; unrelated errors still fail visibly. Active-subject loading remains required.
- Wait for CI on the fix, then add authenticated Playwright coverage for setup with absent profile/preferences and no catalogue rows, English locked + three additional subjects, save/reload, and Learning/CBT navigation. Batch 2 remains OPEN.


## Authenticated onboarding E2E added — 2026-10-19

- Commit `c25d7b95fa02aa839e37d463516bf903a443e6a8` updates `tests/e2e/smoke.spec.ts` with mocked authenticated first-time student setup. All calls to the Supabase project URL are intercepted; test user/session data is synthetic. Test covers absent profile/preferences, preparation UI without catalogue rows, ENG preselected/disabled, exactly three additional selections, selection count and button enablement/limit behavior.
- CI on this commit is pending and must be checked before treating the new spec as passed. The first-time onboarding code fix in `b0a003f63bc5d6c7ff97e605b784ae4bb0c50e19` has passed both Verify and E2E workflows on `a9f0485990ef5c3d2448bb2bda8933f97129691e`, but those E2E specs predated this regression test.
- Still missing: save/reload persistence and Learning/CBT navigation tests; review live SECURITY DEFINER RPC body/authorization and leaked-password protection warning. Batch 2 remains OPEN; no user action required.
- Exact next action: fetch workflow result for the latest test commit, correct any failure, then extend the mocked authenticated journey to cover save/reload and Learning/CBT navigation.


## Active continuity checkpoint — preparation-first onboarding (2026-10-19)

### Source of truth
- Repository: `DarealNovaking/Nova-ace-jamb`, branch `main`.
- Latest commit observed: `e912d5e5c0b7b0127ddddcf15c3fc6465c30e1be` — `docs: checkpoint onboarding browser test`.
- Product direction: **catalogue is no longer used as a prerequisite for student onboarding/preparation**. Do not make empty institutions/programmes/UTME-rule tables a blocker for the active core student journey. Institution/course are optional goals. Do not delete legacy catalogue infrastructure without dependency review.

### Current verified implementation
- `StudentFoundationGate.tsx` checks admin role, registers the current device, then reads the student profile and preferences/subjects. A missing profile is routed to onboarding.
- `StudentOnboarding.tsx` treats PGRST116 for absent profile/preferences as a first-time-user state, uses default preparation values, requires active subject loading, and saves through `saveStudentPreparationFoundation`.
- `b0a003f63bc5d6c7ff97e605b784ae4bb0c50e19` introduced the absent-row fix.
- `c25d7b95fa02aa839e37d463516bf903a443e6a8` adds mocked authenticated Playwright coverage for rendering onboarding without catalogue rows, English preselected/disabled, and three additional subject choices. The test intercepts Supabase requests and does not mutate production data.
- `e912d5e5c0b7b0127ddddcf15c3fc6465c30e1be` records that test and explicitly leaves its CI outcome pending.

### Current user-visible issue / evidence boundary
- Reported screen error: “Unable to prepare your ACE account. Please try again.”
- Root cause is **not verified**. In the gate, `registerCurrentDevice()` executes before profile/onboarding checks and can fail the entire initialization; inspect its implementation and relevant Supabase logs before changing it. Also verify `is_admin` RPC and profile/preferences/subjects requests. Do not present device registration as the confirmed cause.
- Current Verify/E2E workflow status for the latest commit has not been confirmed in this checkpoint. No claim that the latest browser regression passed.
- No production writes, privileged auth bypass, or deployment were performed during this checkpoint.

### Remaining acceptance criteria
1. Confirm current CI/Verify/E2E results for `main`; fix any failing run and rerun.
2. Identify the actual cause of the account-preparation error using implementation plus sanitized logs; fix safely and add regression coverage.
3. Extend the browser journey through save, persisted reload, and Learning/CBT navigation. Keep mocked tests clearly labelled; distinguish them from a real authenticated persistence check.
4. Review the preparation RPC's SECURITY DEFINER body/authorization and the existing leaked-password-protection warning.
5. Update master handoff, this checkpoint, and the historical Batch 2 blocker handoff to reflect the corrected product direction and evidence.
6. Batch 2 remains OPEN until the core student journey is verified. Do not deploy production unless explicitly authorized and deployment credentials are functional.

### Exact next action
Fetch the latest Verify and ACE JAMB E2E workflow results, then inspect `src/lib/deviceService.ts`, the `is_admin`/preparation RPC definitions, and recent relevant Supabase logs. Establish the actual failure before editing application code. No user action is currently required.


## Follow-up implementation — first-time profile save (2026-10-20)

- Commit `6f738122d631bf50943640a7ddc6f1ef4250217b`: `StudentFoundationGate.tsx` now extracts `message` from Supabase/PostgREST error objects as well as native Error instances, reducing generic error masking.
- Commit `622e35df07e2a18f02dc5f3f86df67dba782bf89`: added migration `supabase/migrations/20261020000100_first_time_preparation_profile.sql`.
- Applied the migration to live Supabase project `uokiqlgmzprqfbzmedaz`. Read-only verification confirmed the live `ace.save_student_preparation_foundation` definition includes a profile insert and checks `auth.uid()`. This migration is non-destructive and only creates the row for the authenticated user's own UUID if absent.
- Not verified: full CI/build; live authenticated save/reload; Learning/CBT navigation; exact source of the previously reported “Unable to prepare your ACE account” screen. The gate's improved error extraction should help identify the failing request on retest, but must not be represented as proof that the initialization error is fixed.
- No production deployment was run from this action; the database function migration was applied directly through Supabase migration tooling.

### Next action
Re-run Verify/E2E CI for the latest main commits, then reproduce sign-in with the affected account and record the now-visible error safely. If onboarding opens, complete setup and confirm persisted profile, preferences, four subject rows, and Learning/CBT navigation. Batch 2 remains OPEN.


## Batch 2 status update — CLOSED (2026-10-20)

- Project owner confirms student login works, preparation profile can be completed and saved, data persists after refresh, and Learning/CBT navigation works.
- **Batch 2 is CLOSED for the active preparation-first student journey**, based on this user-run verification. Catalogue population remains out of scope for this journey.
- Live Supabase migration `20261020000100_first_time_preparation_profile.sql` is applied; read-only verification confirmed the deployed save RPC creates a missing profile and checks `auth.uid()`.
- Verification distinction: the live user journey is reported as working by the project owner; the agent has not independently run a browser session. CI/build and automated authenticated persistence/navigation tests remain unverified and should be completed as follow-up QA. Do not misrepresent them as passing.
- No frontend deployment was performed in this closure step.
- **Exact next action:** resume the next milestone in the master handoff; schedule CI/build and strengthen automated authenticated journey coverage as QA follow-up. Reopen Batch 2 only if a reproducible regression appears.


## Active milestone — Batch 3 Academic Structure kickoff (2026-10-20)

- Repo `DarealNovaking/Nova-ace-jamb`, branch `main`; observed HEAD before this checkpoint write: `20c0910ccc551e06468bdd5b339b985fc67be764`. Master handoff updated in commit `3b938ef8b6abd4b8e891229e6b5373314fd1646c` with the detailed audit.
- Batch 2 remains closed for the student preparation journey. Batch 3 here means the next academic-structure milestone in the canonical roadmap, not catalogue ingestion as a prerequisite.
- Source audit confirms the syllabus/season schema migration and existing tables for subjects, topics, subtopics, syllabus versions, exam seasons/configs, questions, and learning progress. RLS is enabled on the listed academic tables. Do not duplicate existing schema or seed guessed official JAMB data.
- Supabase table-list tool returned approximate zero row counts for the core academic tables, but this conflicts with the owner's verified live onboarding journey and the tool did not establish exact SQL counts. Treat counts as unverified pending a supported read-only check.
- Important architecture warning: `src/App.tsx` appears to use `@appdeploy/client`, while the preparation-first onboarding implementation is in Supabase-backed components/libs. Must trace `src/main.tsx`, HTML entrypoint, Vite config and routes before changing UI, to avoid implementing against a dormant prototype.
- CI wrapper returned no workflow runs/statuses for current HEAD; latest typecheck/build/E2E are not verified. No application code, DB data, migration, or deployment changed during this audit.
- **Exact next action:** trace active build/route entrypoint; obtain exact read-only counts for subjects/topics/subtopics/seasons/configs/syllabus versions/questions; inspect existing academic services/admin controls; implement the smallest verified gap with RLS and review/publish safeguards; run typecheck/build/Playwright and update both handoff files.
- **Status: Batch 3 IN PROGRESS (audit only; implementation not yet started).**


## Legacy provider removal — 2026-10-20

- Removed unused legacy prototype/integration files: `src/App.tsx`, `src/providerBridge.ts`, `src/types/appdeploy-client.d.ts`, `appdeploy.auth-login.json`; removed `@appdeploy/client` alias from `vite.config.ts`.
- Actual entrypoint confirmed as `src/main.tsx`, using Supabase-backed student/admin gates and CBT component. No production DB or deployment changes.
- Code commits: `35fc382fd8ace91464c743973da332eadf196c21`, `216dc14e1d0859abb0d43e4651a8b48e6806b613`, `4c03678ed0dc9fd051c20f1d01b8bd9d5166e2e8`, `f3740d5712033263a651905d7cf94591b1fbca52`, `f253e249370e170f97eb0151422015513c2636a5`.
- Build/typecheck/E2E remain unverified after changes. Next: residual-reference scan, run typecheck/build and Playwright, resolve errors, then continue Batch 3.


## Active continuity checkpoint — post-legacy-removal CI regression (2026-10-20)

### Repository and evidence
- Repo: `DarealNovaking/Nova-ace-jamb`, branch `main`.
- Latest relevant commits: `9c585a6213b2943573abdb5601a3e5c2a2f1b19f`, `69404fe1fff598429b45ec8169162ffedbf7a6be`, `7c1c124e459b7a64816c4277dac59c750f9364eb`.
- The last completed workflows before the fix were Verify run `39339534465` and ACE JAMB E2E run `39339534495` on `84d36fbe87ad7b1c690a28187c0fe7be6967b3a2`; both failed at TypeScript check because `StudentFoundationGate.tsx` imported the deleted `../App`. Build and browser tests were skipped. The disposable PostgreSQL migration test and the static/Deno checks preceding typecheck passed.
- Corrected the active route to use new `src/components/StudentDashboard.tsx`; this avoids restoring the removed AppDeploy-based demo. Dashboard reads saved student profile/subjects from Supabase, loads only active subject rows, and displays topics only from active rights-approved syllabus versions. No invented syllabus content is shown.
- Corrected subject filtering to use the actual `subjects.active` column, matching `StudentOnboarding.tsx`.
- AppDeploy legacy-reference search returned no results before this route regression was fixed; source inspection then found the dangling `../App` import. The active student gate now points at the new dashboard. Re-run a residual-reference scan after current CI.
- No live database writes, migrations, deployments, or catalogue imports were performed.

### Current verification state
- CI runs triggered by the fix were queued at the last poll: Verify `39506323322` and ACE JAMB E2E `39506323321` (commit `69404fe1`), plus Verify `39506318882` and ACE JAMB E2E `39506318829` (commit `9c585a62`). A later code commit `7c1c124e` should have its own runs; fetch the latest runs rather than relying on queued historical entries.
- Dashboard build/typecheck/browser behavior remains **unverified** until the latest CI results finish. No Playwright browser test passed on the pre-fix commit because typecheck failed first.
- Batch 2 remains closed based on the owner's direct confirmation of student login, preparation save/persistence and Learning/CBT navigation. Automated follow-up QA is still required.
- Active milestone remains **Batch 3 — Academic Structure**.

### Exact next action
1. Fetch Verify and ACE JAMB E2E workflow outcomes for the latest `main` HEAD; inspect failed job logs if needed. Resolve any errors and wait for the rerun to finish.
2. Confirm the legacy-provider residual scan and add/adjust Playwright coverage for the post-onboarding dashboard and CBT navigation where feasible.
3. Continue Batch 3 with read-only inspection of academic table counts/records, subject/syllabus services, and admin/editor review/publish controls. Do not invent JAMB data, seed production rows, deploy, or re-open catalogue ingestion as an onboarding gate.
4. Update this checkpoint and master handoff with actual CI outcomes and the next verified gap.


## Batch 3 read-only data audit — 2026-10-20

- Live Supabase read-only SQL query succeeded after correcting one column-name assumption (`questions.active`, not `is_active`). Exact counts: `ace.subjects=25`, active subjects=25, topics=0, subtopics=0, seasons=2, exam configs=1, active configs=0, syllabus versions=50, active syllabus versions=0, questions=0, active questions=0.
- Season state: JAMB 2026 is closed; JAMB 2027 is draft. Sole config “2026 UTME official structure” is inactive (180 questions, 7200 seconds). All 50 syllabus versions are draft / rights pending. No official content should be invented or activated to make the UI look populated.
- Existing database controls found: activation/validation functions `activate_exam_config`, `activate_exam_season`, `activate_syllabus_version`, `validate_exam_config`; RLS policies allow editor/admin management for academic rows and constrain ordinary reads. Function bodies/grants still need a focused review before relying on them for the UI.
- Current component inventory contains catalogue staging/import admin panels but no academic-structure editor. The admin route checks `is_admin()`, so content-editor route access must be designed explicitly and must not confer full admin privileges.
- Verify run `39506340527` for commit `7c1c124e` **passed** all jobs, including typecheck/build and disposable SQL migration test. ACE JAMB E2E run `39506340498` was still in progress at the last poll. Search for `appdeploy` returned zero matches.
- The initial audit query failed because of the guessed `is_active` question column; corrected to `active`, after which the query succeeded. This was read-only and made no data changes.
- **Exact next action:** fetch final E2E outcome for `39506340498` and the latest `main` runs; then inspect the activation/validation RPC bodies and EXECUTE grants, design a separate least-privilege editor path, and implement the smallest draft academic authoring/review surface. Do not create guessed JAMB content, activate unverified seasons, deploy, or mutate production data without explicit authorization.


## Final verification follow-up — 2026-10-20

- E2E run `39506340498` for code commit `7c1c124e` completed successfully: 6 Playwright tests passed, after typecheck/build passed. Verify run `39506340527` also passed all jobs. Latest documentation-only main commits' Verify jobs passed; their E2E runs were still in progress at the last poll, so fetch current HEAD's final E2E result before calling all latest CI green.
- Read-only activation function review: `activate_exam_config`, `activate_exam_season`, and `activate_syllabus_version` enforce authenticated editor/admin role checks and fixed search paths; anon/public EXECUTE is false. `validate_exam_config` is validation-only and has no editor check, but anon/public EXECUTE is false.
- Security issue to fix before authoring UI: current public SELECT policies on `topics` and `subtopics` only check row `active`, not whether the linked syllabus version is active and rights-approved. Since syllabus activation requires active topics, draft topics could be exposed while the parent syllabus is still draft. No policy change was made in this audit.
- No live data/schema changes or deployments were performed. Search for `appdeploy` returns no matches. Dashboard code has successful Verify + E2E on commit `7c1c124e`.
- **Exact next action:** finish latest main E2E check; implement a migration to make public topic/subtopic reads require an active, rights-approved parent syllabus version, add disposable SQL regression coverage to CI, then build a separate least-privilege `/admin-academic` route for draft version/topic/subtopic authoring and provenance/rights review. Do not seed invented content or apply a production migration without a reviewed, verified change.


## Current continuation checkpoint — Batch 3 security + authoring (2026-10-20)

- Repo `DarealNovaking/Nova-ace-jamb`, branch `main`; last observed HEAD before this checkpoint commit: `566673fb72311d730686d31d126a66ed0acee255`.
- Implemented source-only migration `20261020120000_syllabus_publication_visibility.sql`: public topic/subtopic reads require active rows tied to active + rights-approved syllabus versions; subtopics additionally require an active matching parent topic. SECURITY DEFINER helper exposes only a boolean and uses fixed search path. Existing editor/admin review access is retained.
- Added SQL regression test `tests/sql/syllabus_publication_visibility.test.sql` and Verify workflow step. The disposable PostgreSQL test reported “syllabus publication visibility tests passed” in the latest observed Verify run for commit `566673fb`; TypeScript validation also passed. Verify production build and Playwright were still running at last poll, so overall latest HEAD is not yet fully verified.
- Added `AdminAcademicWorkspace.tsx`, `AcademicFoundationGate.tsx`, route `/admin-academic`, and student-session redirect for content editors. The workspace creates source-attributed draft versions, leaves rights pending by default, lets editors draft topics/subtopics inactive, supports rights review, and calls only the existing guarded activation RPC. No official content is seeded or invented.
- Added Playwright cases for authorized editor access and denial for a student. Latest E2E run `39507436232` remained in progress at last poll.
- Earlier CI failure on commit `94203c9f` was due to malformed SQL dollar delimiters in the test harness. Fixed with named `$fn$` delimiters; the subsequent Verify run `39507338409` passed. The current test job subsequently showed the SQL regression test passing.
- No production schema migration, database write, or deployment was performed. The migration is committed but unapplied to production.

### Exact next action
1. Fetch completion status and job logs for Verify `39507436241` and E2E `39507436232` (or newest runs on current HEAD after this documentation commit).
2. Fix any failures; ensure all latest Verify, build, disposable SQL, and Playwright checks pass.
3. Only after reviewing current live grants/policies and receiving explicit deployment/migration authorization, apply the visibility migration to production and verify its deployed policy definitions read-only.
4. Continue with source-verified syllabus content; never invent JAMB syllabus data or activate unverified season/configuration rows.


## Verification closeout (2026-10-20)
- Code commit `566673fb72311d730686d31d126a66ed0acee255` passed Verify run `39507436241`, including typecheck/build and both disposable PostgreSQL SQL suites. The syllabus visibility test passed.
- E2E run `39507436232` passed on that code commit: Playwright reports 10 passed (8.2s), including academic editor access/denial coverage.
- Docs commits `844424c0` and `e3920954` followed; their workflows were still in progress at the last poll. Recheck latest HEAD CI before declaring current HEAD fully green.
- The new migration is committed but has not been applied to the live database. Next: check latest HEAD workflows, then request explicit authorization before applying the reviewed migration. No production data changes or deployment occurred.


## Production migration closeout — 2026-10-20

- User authorized the syllabus visibility migration. Applied `syllabus_publication_visibility` to Supabase project `uokiqlgmzprqfbzmedaz`; recorded migration version: `20261020222636`.
- Read-only verification: current topic/subtopic SELECT policies match the reviewed migration; public reads require active rows tied to active + rights-approved syllabus versions, with subtopics additionally requiring an active matching parent topic. Admin/editor draft-review access remains in policy.
- Read-only verification: `ace.is_syllabus_version_public(uuid)` is SECURITY DEFINER with fixed `search_path=pg_catalog, ace`; EXECUTE granted to `anon` and `authenticated`, not PUBLIC.
- Latest current-HEAD workflows both passed: Verify `39507661501`, E2E `39507661518` for `e1f15d4bb99810b5fb04781c9095520aab41a33b`. Prior code commit E2E `39507436232` reported 10 Playwright tests passed.
- No syllabus rows were inserted or activated; no frontend deployment was run.
- Remaining verification: live anonymous API behavior and editor draft visibility have not yet been exercised through HTTP/authenticated UI. Next action: perform safe read-only API/UI smoke tests, then proceed with source-backed syllabus authoring and rights review.


### Follow-up smoke-test finding — anonymous schema access (2026-10-20)
- A read-only privilege check found `has_schema_privilege('anon','ace','USAGE') = false` while `authenticated` is true. Attempting a read-only query after `SET LOCAL ROLE anon` therefore failed at schema permission resolution before table RLS could be exercised; no data changed.
- Do not add `USAGE` for anon automatically: that expands API reachability for the entire `ace` schema, not just syllabus topics/subtopics. Review existing object/table/function grants and intended anonymous product requirements first. Authenticated access is not blocked by this schema privilege.
- Exact next action: inspect the existing schema-exposure migration and current anon grants on ACE objects; decide whether anonymous syllabus reads are actually required. If yes, make the smallest narrowly reviewed grant/policy adjustment and add a regression check; otherwise test the publication boundary under an authenticated non-editor role.


## Academic editor API privilege gap — 2026-10-20

- Read-only live grant audit found authenticated has table privileges on `ace.syllabus_versions` but no SELECT/INSERT/UPDATE grants on `ace.topics` or `ace.subtopics`. The existing editor component calls those tables through the authenticated Supabase Data API, so the workspace's topic/subtopic loading and authoring would fail despite RLS policies being correct.
- Added source migration `20261020230000_academic_topic_editor_api_privileges.sql` granting SELECT/INSERT/UPDATE on topics and subtopics to `authenticated`. These grants do not bypass RLS: the existing `topics_editor_manage` and `subtopics_editor_manage` policies still require `ace.is_admin_or_editor()` for writes; SELECT remains constrained by publication/editor policies. No DELETE grant was added because the current workspace does not delete rows.
- Updated the disposable visibility SQL test to apply the grant migration. CI for the latest commits must confirm the combined test passes.
- **Production status:** this new privileges migration is source-only and has NOT been applied to live Supabase. The earlier authorization covered the syllabus visibility migration specifically, not this additional table-privilege change. No production grant was changed by this audit.
- Next: verify CI for the source migration/test, then request explicit authorization to apply the topic/subtopic API privilege migration. After approval, apply it and read-only verify grants, RLS policies, and the live editor workflow. Anonymous schema access remains intentionally ungranted; the product currently exposes the ACE schema to authenticated users only.


## Academic topic/subtopic API privilege migration — applied and verified (2026-10-20)

- Project owner replied “proceed” to the explicit request to apply the separate topic/subtopic API privilege migration after CI passed; treated as authorization for this migration only.
- Confirmed main HEAD before this documentation update was 6178069dfa5bc13ddd28cf396d5c73b2353c8ec8.
- Current-HEAD CI passed before applying the migration: Verify run 39510386608 and ACE JAMB E2E run 39510386522, both on 6178069dfa5bc13ddd28cf396d5c73b2353c8ec8.
- Applied source migration supabase/migrations/20261020230000_academic_topic_editor_api_privileges.sql to live Supabase project uokiqlgmzprqfbzmedaz using migration name academic_topic_editor_api_privileges. Live migration history now records version 20261020224807.
- Read-only verification confirms both ace.topics and ace.subtopics grant authenticated SELECT, INSERT and UPDATE; DELETE remains false; RLS is enabled on both tables.
- Read-only policy verification confirms topics_editor_manage and subtopics_editor_manage still require ace.is_admin_or_editor() for writes. Publication SELECT policies remain in place, including active/right-approved syllabus-version checks and the active matching parent-topic check for subtopics. No anonymous schema usage was granted.
- No syllabus/topic/subtopic content was inserted, edited, or activated. No frontend deployment was performed. Database grants and policy definitions were verified; a real authenticated editor browser/API create-and-read smoke test is still pending.
- Next action: run a safe live editor workflow smoke test with an authorized editor session (draft-only; no activation of unverified content), confirm topic/subtopic reads and draft writes, then update both handoff files with the observed result. Keep anonymous schema access unchanged.


## Current continuation — frontend-first student journey QA (2026-10-20)

- Actual repository: `DarealNovaking/Nova-ace-jamb`, branch `main`; code/test commit `5893127760a7fac88871cc934544fb6cd77f61a6`.
- Inspected the current student entry gate, dashboard, student service, syllabus service, E2E smoke tests, package scripts, and latest CI. Main HEAD before the test change was `5047974f35ebbdffe712c9f663420f10506ed847`; its Verify run `39510772594` and E2E run `39510772622` both passed.
- Added a mocked Playwright regression test for a prepared student dashboard: profile/subjects render, unpublished syllabus content is not invented, reload retains the authenticated dashboard state, and the CBT CTA navigates to `?cbt=1`. All Supabase requests in this test are intercepted; no production records are touched.
- New CI is pending: Verify `39511826720`, ACE JAMB E2E `39511826534`, both on `5893127760a7fac88871cc934544fb6cd77f61a6`. New test is not yet verified.
- No UI implementation, production database, migration, deployment, or catalogue data changed in this step.
- Important remaining gap: the dashboard is a landing/overview, not a full lesson experience. Active rights-approved syllabus versions/topics were last audited as empty/unpublished; never manufacture JAMB content to fill the screen.
- Exact next action: poll both listed CI runs, inspect job logs and fix any failure. Once green, build the next student-facing frontend flow only after checking existing components/routes and actual available data; preserve the current Supabase authorization/RLS boundaries. Update both continuity documents after that change.


## Frontend batch checkpoint — preparation workspaces + admin milestone alignment (2026-10-20)

### Implemented on main
- `06b5b78672ee31db7e69dcc0f16ca73431685232`: new `src/components/StudentStudyWorkspace.tsx` with Learn, Practice, Quick Revision, Flashcards, Progress and Study Plan views.
- `1f7253c02325d6003bd1f3c395b0a236d69ebe43`: dashboard navigation and workspace state in `src/components/StudentDashboard.tsx`.
- `c18baf86e1482076aabea9cbb15f281fa348dc1c`: Playwright journey covering all six student tools and their empty states.
- `a02516bf0e308958c4564ea6960ee4fbeed4485b`: admin dashboard now reflects Batch 3 / Academic Structure and links directly to `/admin-academic`.

### Correctness boundary
- Workspaces show only saved subjects and verified active/rights-approved topics passed from the existing dashboard service.
- Lesson text, questions, flashcard facts and performance metrics are not fabricated. The latest live audit found no active questions and no active rights-approved syllabus versions/topics; confirm current live state before assuming this has changed.
- Practice opens the existing protected CBT implementation. No new backend schema or data path was added.
- No live data, migrations, production grants or deployment changed in this frontend batch. Existing catalogue import/review UI was retained.

### Verification state at checkpoint
- Verify run `39512223624` passed for component commit `06b5b78672ee31db7e69dcc0f16ca73431685232`.
- Remaining/newest runs were still running or queued: E2E `39512223597`; Verify `39512272979`; E2E `39512273077`; Verify `39512296427`; E2E `39512296132`; Verify `39512374477`; E2E `39512374470`. Latest code HEAD before this checkpoint documentation commit: `a02516bf0e308958c4564ea6960ee4fbeed4485b`. Full batch is not yet CI-verified.
- No deployment was performed.

### Exact next action
1. Poll Verify and ACE JAMB E2E for the latest frontend/admin code and documentation commits.
2. If any run fails, inspect job steps/logs and fix the smallest cause; rerun CI.
3. Update both handoff documents with the final run IDs/results.
4. Once green, continue frontend work dependent on actual lesson/question/attempt data only when those verified records exist; do not invent official JAMB material.


### Frontend E2E follow-up — strict locator fixed (2026-10-20)

- E2E `39512296132` failed on commit `c18baf86e1482076aabea9cbb15f281fa348dc1c`; TypeScript and build passed, 12 browser tests passed, and the workspace test failed on a duplicate heading match.
- The log showed Quick Revision had both a page `h1` and section `h2` with the same accessible name. Fixed Quick Revision and Study Plan test locators to require `level: 1`.
- Fix commit: `f096ffdbe3079fb933794a5ce158dc03135b9141`.
- Reruns for the fix and latest admin/frontend commits are pending. The frontend batch remains **not fully verified** until latest-main Verify and E2E pass.
- Exact next action: poll latest runs for commit `f096ffdbe3079fb933794a5ce158dc03135b9141` and the subsequent handoff commits; fix any further failure and then record final CI results in both docs.


## Current continuation — saved student study routine + CI follow-up (2026-10-21)

- Actual repository: `DarealNovaking/Nova-ace-jamb`, branch `main`. The previous frontend workspace batch is now CI-verified on commit `f74ab7e1f80e5a7859f66a5f68b15c953df753c9`: Verify `39512540188` and ACE JAMB E2E `39512540266` both passed.
- New code commits: `541cef132ce99222981e9632b7c4f7912f995ee5` adds `StudentStudyPlan.tsx`; `ba1b2445d90c86709cb9af607427f9c3bbb3cf6d` connects it to `StudentStudyWorkspace.tsx`; `d2aff7f9cedc6a16b14ef31febcf972d9bf1aeba` tests save behavior in `tests/e2e/smoke.spec.ts`.
- The study plan now lets an authenticated student edit daily study minutes and preferred study days, and saves through the existing student-preferences service. No migration/schema change was added. The page describes saved preferences, not a generated lesson timetable. Playwright Supabase traffic is mocked.
- Both handoff files are being kept current. No production data, migration, deployment, content publication or catalogue import was changed.
- New feature CI is pending: Verify `39513774609` and ACE JAMB E2E `39513774499` are queued on the study-plan test commit; earlier runs `39513749185`, `39513749121`, `39513734298` relate to preceding commits. Latest-main runs must be checked after the docs commits as well.
- Remaining: full lesson delivery, real question practice, flashcards and performance analytics depend on verified published learning content and/or real saved attempts. The last verified database audit found no active rights-approved syllabus versions/topics and no active questions; confirm live state before assuming it changed.
- **Exact next action:** poll Verify/E2E for current `main`, inspect logs for failures, fix the smallest cause, and update both handoffs with green results. Then continue the next frontend flow only where verified content and service contracts exist. Do not invent JAMB material, fake scores, or generated-schedule completion.


## Frontend completion batch — 2026-10-21
- User direction: batch all remaining frontend work into one coordinated frontend milestone; backend is not the focus for this batch. Existing service contracts may be used; missing backend capabilities must be called out, not simulated.
- Repository: `DarealNovaking/Nova-ace-jamb`, branch `main`. GitHub recursive tree retrieved with tree SHA `f14af8ea403854e264fb532cd5734f8723c7df9d` before the frontend batch document commit. Batch doc commit: `0a1cc22685d443ade2c9aec8165cd70b365008a4`.
- Added `docs/FRONTEND-COMPLETION-BATCH-2026-10-21.md` defining scope and acceptance gates. It explicitly marks implementation and tests as not yet verified.
- Entry routing verified from `src/main.tsx`: `/admin-academic` → `AcademicFoundationGate`; `/admin` and `/admin-import` → `AdminFoundationGate`; CBT query flag → `ProtectedCBT`; default → `StudentFoundationGate`. Preserve this behaviour unless source/test evidence identifies a regression.
- Existing frontend components identified: `StudentAuth`, `StudentOnboarding`, `StudentDashboard`, `StudentStudyPlan`, `StudentStudyWorkspace`, `ProtectedCBT`, `PersistentCBT`, plus admin/academic gates/workspaces. Package scripts include `npm run typecheck`, `npm run build`, and `npm run e2e`.
- Verification status: repository tree and selected docs/entry point/package scripts inspected. No application source changes, build, typecheck, Playwright, live DB query, or deployment performed in this batch setup step.
- Blockers: none identified for repository inspection at this point. Implementation status for individual features is not yet classified because component/service/test source review remains outstanding. Supabase is not being declared blocked.
- Exact next action: inspect full source for student auth/onboarding/dashboard/workspace/study plan/CBT, related service modules and tests; implement the highest-impact evidence-backed gaps; then run typecheck, build and Playwright and record outcomes.


## Whole-product frontend + channel integration scope correction — 2026-10-21

- Owner direction: all frontend work must reflect the complete product in the canonical handoff, and the channel integration must be explicitly included.
- Batch document updated in commit `adfd7e0dd7e8439b6e04abf5c4106a008635edee`: `docs/FRONTEND-COMPLETION-BATCH-2026-10-21.md`.
- Expanded scope: student identity/onboarding/dashboard; learning/practice/mistake/adaptive; CBT/mocks; revision/flashcards/audio; study plans/analytics/readiness; grounded AI/knowledge; channel/community gate; notifications/announcements/push; ACE Pass/payment/entitlement; referrals; admin command center; PWA/offline; accessibility/performance/security and full Playwright/CI verification.
- Channel flow placement: after onboarding/profile setup and before main dashboard. Group routing must use explicit reviewed institution mappings and a defined fallback for optional/unmapped institutions. Never invent group URLs.
- Critical canonical constraint: master handoff section 23 marks WhatsApp membership verification UNDECIDED. A client-side “I joined”, URL click, localStorage flag or route cannot prove membership. The UI may be prepared, but mandatory gate enforcement requires an independently verifiable server-side integration. No automatic WhatsApp posting/management.
- Existing frontend entry in `src/main.tsx` has only academic editor, admin/import, CBT query mode and default student gate. No dedicated UI component/route was found in the repository tree for channel verification, notifications, payment/referral, grounded AI, audio or the full command center. Existing student workspace shows explicit not-yet-published/empty states for lesson content, questions, flashcards and verified performance.
- No application code or production data changed in this scope correction. No build/typecheck/Playwright/live DB query/deployment was performed.
- Exact next action: inspect actual service/migration/test contracts and latest CI for community, notifications, payments/entitlements, referrals, AI/knowledge, audio, feature flags and admin operations; classify each UI domain against real contracts; implement evidence-backed gaps and run typecheck/build/Playwright. Supabase is connected and must not be described as blocked.


## Live frontend contract audit — 2026-10-21
- Supabase project `nova-ace-jamb` (`uokiqlgmzprqfbzmedaz`) read-only project check: ACTIVE_HEALTHY; connection works and is not blocked.
- Live schema includes domain tables for notifications/preferences, products/payments/payment providers/payment events/entitlements, referrals/campaigns/codes/rewards, AI providers/requests/usage, knowledge sources/chunks, flashcards/reviews, learning progress, study plans/items, devices, feature flags, audit events and product events. Audit-time counts: subjects 25; topics/subtopics/questions/flashcards/learning_progress/attempts/study_plans/notifications/payments/entitlements/referrals/referral campaigns/rewards/knowledge sources/chunks/AI requests all 0; notification preferences 4; products 1; referral codes 4; AI providers 2; devices 7. Counts are not feature readiness guarantees.
- Live Edge Function inventory listed `catalog-import` and `ibass-catalog-stage`; no dedicated channel verification, payment webhook, referral qualification, AI request or notification delivery function was listed.
- No dedicated community/channel membership or institution-group mapping table was found in the inspected live `ace` inventory. Channel verification remains UNDECIDED per master handoff; do not implement fake membership proof or claim an unbypassable gate. Intended UI position is after onboarding and before dashboard; group routing requires reviewed mappings and fallback.
- Current `src/lib` modules cover auth, CBT, data adapter, device, season/syllabus, student and Supabase. No dedicated UI/service modules for community/channel, notifications, payment/referral, AI/knowledge or audio were found in the source tree. Inspect RLS/RPC/provider contracts before connecting UI to the domain tables.
- Expanded batch document now includes the full product frontend: `docs/FRONTEND-COMPLETION-BATCH-2026-10-21.md`. The batch is not implementation-complete. No application source or production data/schema changed during this audit; Supabase reads were read-only.
- CI runs `39514640639` Verify and `39514640651` E2E passed on earlier docs-only baseline `bce60df163ee855ada622276d45488a53bc4ea6f`. Latest checked runs `39515107606` Verify and `39515107387` E2E on `ce737e1c2876cac9a18c0e8e1d74a5bd39ea1fa6` were in progress. Recheck the newest `main` runs before treating them as passed.
- Exact next action: inspect actual RLS/RPC/provider contracts for each existing domain, reconcile live database objects with migration source, classify every frontend domain against verified contracts, then implement highest-priority UI/service gaps and run typecheck/build/Playwright. Do not claim Supabase is blocked.


## RLS/service-boundary findings from live read-only audit — 2026-10-21
- Notifications: authenticated students can SELECT their own notifications and UPDATE their own rows for read state; admin has ALL. Notification preferences have a self-only ALL policy. This suggests an inbox/preferences UI can use these existing boundaries, but a delivery/scheduling service still needs verification.
- Products: active products are publicly readable. Payments are self-readable and admin-manageable; entitlements are self-readable and admin-manageable. Student payment creation/verification must use a server/provider flow, not direct client writes.
- Referral codes are self-readable; referrals are readable only to participants; referral rewards are self-readable. No student-write policy for qualification/reward was found, so a frontend must not calculate/award qualification client-side.
- Flashcard review and learning progress are self-scoped; study plans/items are owner-scoped; devices are self-scoped. Their corresponding tables were empty for content/activity in the audit (flashcards 0, learning progress 0, study plans 0), so screens need correct empty states until valid records exist.
- AI providers and knowledge sources/chunks are admin-only; AI requests are self-readable and AI usage is self/admin-readable. No dedicated AI request Edge Function was listed, and no student INSERT policy for AI requests appeared. Do not call provider secrets from the browser or build a fake tutor; establish a server-side request boundary first.
- Feature flags are readable by authenticated users and writable only by admins. Audit events are readable to actor/admin and inserts are constrained to self/null actor. Admin UI must respect these RLS boundaries.
- These findings are schema/policy observations only; no row was changed. See live schema/counts above. No channel verification/group mapping contract was found.


## Current continuation checkpoint — Phase 1 frontend (2026-10-21)

- **Current objective:** execute Phase 1 batches 1–5 (authentication/onboarding, dashboard/navigation, syllabus workspace, practice/questions, CBT).
- **Source changes committed:** `src/components/StudentFoundationGate.tsx` handles a missing first-use preferences row as onboarding and suppresses raw database/provider error details; `src/components/StudentDashboard.tsx` persists workspace state in `?view=`, restores on reload, and syncs back/forward; `src/main.tsx` no longer intercepts clicks by matching visible button text and preserves URL parameters when leaving CBT.
- **Commits:** `79d99942491507b0e8e7fc3d1a8f9d4862f7f9ea`, `66b0f606ec33f1061ae97f34c937a5b531c0e3ea`, `4e522f91ee686635dc725149bbac038ff02c9020`.
- **Tests:** not run in this slice. The combined-status API returned an empty status list, which is not evidence of passing CI. No typecheck, build, Playwright, authenticated browser run, database write, or deployment has been verified.
- **Important known state:** learning/practice/flashcard/progress screens currently contain explicit honest empty/placeholder states; live audit previously found no topic/question/flashcard/learning-progress rows. Do not fabricate content to make these screens look populated. CBT uses server RPCs in `src/lib/cbtService.ts`; keep attempts, timing and scoring server-authoritative.
- **Exact next action:** inspect current auth E2E test inventory and auth/session lifecycle; fix first-use/profile/preferences race and onboarding recovery, add/adjust Playwright coverage for auth/onboarding and dashboard URL history, then run typecheck/build/E2E. Continue with syllabus and CBT checks after these tests. Update this checkpoint and the master handoff after each meaningful slice.


### Phase 1 latest verified code slice — 2026-10-21
- Added first-use missing-preferences recovery, safe student-facing errors, auth callback deferral, initial-session handling, and sequence guards against stale role/profile lookups in `StudentFoundationGate`.
- Workspace route is query-backed and browser history-aware; CBT navigation preserves unrelated query state and no longer relies on global button-label interception.
- Syllabus subtopics are now passed from `seasonService` and rendered under the selected parent topic.
- Commits: `79d99942491507b0e8e7fc3d1a8f9d4862f7f9ea`, `66b0f606ec33f1061ae97f34c937a5b531c0e3ea`, `4e522f91ee686635dc725149bbac038ff02c9020`, `fc2b70c7733671d0e13a88265c9da7a95bef91a3`, `95cb90c4bf3f8f4f3f53e043aa95ae3496f459f1`, `a757f602f7d045d16ed53b511c2a5369a310a689`, `49c8949fdc9771876cc6e6150f96cb9fcc70cd6b`.
- **Verification:** not run. Combined commit status returned no status entries; associated workflow lookup returned no runs. No typecheck, build, Playwright, authenticated browser verification, DB writes, or deployment.
- **Next action:** inspect current auth and CBT test inventory via a runtime or GitHub Actions result path; run typecheck/build/E2E, fix discovered issues, then finish Phase 1 batches 3–5 against real content/server contracts. Do not mark Phase 1 complete yet.


### CI failure and correction — 2026-10-21
- GitHub Actions Verify and E2E both failed at typecheck with `src/components/StudentDashboard.tsx(128,200): TS1005 '}' expected`.
- Root cause: missing closing brace for the JSX `onClick` expression introduced in the workspace URL/history change.
- Fix commit: `23735a150ba0d142f29ec0919df69c33236a4f2f`.
- Latest post-fix CI status: not yet confirmed. Next action: poll `/actions/runs`, inspect Verify and ACE JAMB E2E runs whose `head_sha` is the fix commit or newer, then fix any remaining failures before continuing Phase 1.


## Canonical frontend execution batches (16-batch plan)

This is the single frontend batch plan for the project. The detailed scope and acceptance checklist live in [docs/FRONTEND-COMPLETION-BATCH-2026-10-21.md](FRONTEND-COMPLETION-BATCH-2026-10-21.md). These are execution groups, not claims of completion. Existing working features must be hardened rather than rebuilt; no batch is complete until its acceptance checks pass.

| Phase | Batch | Scope and acceptance target |
|---|---:|---|
| 1 — Core student experience | 1 | Authentication, sessions, account recovery, onboarding/profile, English auto-included + exactly three other subjects, route protection. |
| 1 — Core student experience | 2 | Dashboard, student navigation, account entry points, responsive states, URL/history restoration, recoverable errors. |
| 1 — Core student experience | 3 | Published syllabus tree, subjects/topics/subtopics, lesson view and honest unpublished-content states. |
| 1 — Core student experience | 4 | Practice, reviewed question data, answer/explanation flow, mistakes review and saved progress; never invent official questions. |
| 1 — Core student experience | 5 | CBT/mock setup, timer, navigation, answer persistence/recovery, submission and server-authoritative scoring/results. |
| 2 — Learning & intelligence | 6 | Quick revision and verified flashcard decks/reviews. |
| 2 — Learning & intelligence | 7 | Study-plan creation/schedule, saved learning stats and readiness derived from real activity. |
| 2 — Learning & intelligence | 8 | Audio lessons, accessible playback controls, progress persistence and unavailable/error states. |
| 2 — Learning & intelligence | 9 | Grounded AI tutor with provenance, usage limits and server-side provider boundary. |
| 3 — Community & student services | 10 | Community/channel entry and gate, real membership-status contract, institution-group mapping, return flow and anti-bypass tests. Mandatory verification stays off until provider/server verification and approved mappings exist. |
| 3 — Community & student services | 11 | Student notification inbox, read state/preferences, announcements and push only if delivery infrastructure exists. |
| 3 — Community & student services | 12 | ACE Pass purchase/status, payment provider verification, entitlements and referrals/rewards backed by server-side qualification. |
| 4 — Admin & production readiness | 13 | Admin command center for students, content, questions, audio, flashcards, notifications, payments, referrals, AI knowledge, moderation, analytics and audit. |
| 4 — Admin & production readiness | 14 | Academic administration, syllabus/content publication review, permissions and review-only safeguards. |
| 4 — Admin & production readiness | 15 | Shared design system, mobile responsiveness, accessibility, PWA/offline and safe caching. |
| 4 — Admin & production readiness | 16 | Full route/role regression, Playwright, typecheck/build, integration/security checks, performance and release readiness. |

**Execution order:** finish Phase 1 batches 1–5 first; do not skip ahead to disconnected features. Within each batch: inspect current implementation → smallest safe implementation/hardening → test → update this plan and both canonical handoffs. Independent tasks may run in parallel only when they do not conflict on source files or acceptance dependencies.


## Phase 1 execution status — 2026-10-21

| Batch | Current evidence-based state | Next acceptance work |
|---:|---|---|
| 1 — Authentication & onboarding | Hardened: missing first-use preferences now routes to onboarding; auth refresh sequence guards and initial-session handling added; onboarding errors sanitized. | Verify sign-up/sign-in/password recovery/session races and subject choice through Playwright. |
| 2 — Dashboard & navigation | Workspace state uses `?view=`; reload/back/forward E2E assertions added; CBT URL expectation tightened. | Await current GitHub Verify/E2E runs; test dashboard retry and relevant query-parameter combinations. |
| 3 — Syllabus workspace | Approved topic/subtopic records are passed to the workspace; empty/unpublished states remain honest. | Test with approved/published syllabus fixtures and empty/rights-filtered records. |
| 4 — Practice & questions | UI currently provides a clear placeholder; last live database audit found zero questions. No fake question bank added. | Inspect current question schema/RPC contracts and verified data. Implement only when question records and server contracts permit. |
| 5 — CBT & mock exams | Existing RPC-backed CBT has resume/load/save/submit/timer flow; added active-attempt guards, duplicate-submit guard and sanitized errors. | Verify RPC contracts, expiry/retry/recovery/answer persistence and score output through tests. |

Recent implementation commits: `23735a150ba0d142f29ec0919df69c33236a4f2f` (JSX correction after CI exposed syntax failure), `77c907b1fb548df3f0ca87204f1272137d41f85e` (workspace reload/history E2E coverage), `f886ad493d617e460fc1a34f92b5cd28edf81160` (CBT duplicate submission/error hardening), `3fd59568f9d5e965b78bc90d698afdaee1c6fc9d` (onboarding error hardening).

CI for commit `23735a1` and subsequent docs-only commit `13865f1` passed both Verify and ACE JAMB E2E. New runs for the added workspace test and CBT/onboarding changes are queued/in progress at time of this update; do not treat those latest changes as verified until their runs finish. No deployment or database writes were made.


## Phase 1 continuation — latest source work (2026-10-21)

### Additional implementation completed
- `tests/e2e/smoke.spec.ts`: added route-state assertions for `?view=learn`, reload restoration, browser back/forward, a mocked server-authoritative CBT answer/submission path, active-attempt recovery after reload, and a practice-mode request against an empty published question bank. The tests intercept Supabase; they do not write production data.
- `src/components/PersistentCBT.tsx`: added duplicate-submit protection, active-attempt-only answer writes, safe user-facing errors, completed-attempt result restoration without refetching question content, normalization of the legacy idempotent-submit response's missing `total_questions`, and local recovery-pointer support. It now accepts `mode` so practice calls the existing `start_attempt` RPC as `practice`, not `cbt`. Known empty-bank errors are mapped to an honest published-question message.
- `src/components/ProtectedCBT.tsx`: stores the current attempt pointer under the authenticated user's ID and attempt mode, so accounts and practice/CBT modes do not share recovery pointers.
- `src/components/StudentDashboard.tsx` and `src/components/StudentStudyWorkspace.tsx`: the Practice workspace now starts a real practice-mode server attempt; the normal CBT entry continues to start CBT mode.
- `src/components/StudentOnboarding.tsx`: load/save failures use recoverable messages instead of exposing raw database/provider errors.
- Source/test commits in this slice include `77c907b1fb548df3f0ca87204f1272137d41f85e`, `f886ad493d617e460fc1a34f92b5cd28edf81160`, `3fd59568f9d5e965b78bc90d698afdaee1c6fc9d`, `3ff92a04b6150a5aeac7f4223be1aac1f9e2180a`, `e82b0806a5e955f5ab29b3d790694e8fa5736b9b`, `07240ee8e9c8c87cd307bb3475076d56bdc4ee3e`, `8ae2c2932f0f6e035f0a151667cd329c82de1cb1`, `b9543ce8b629eaf8bd35c7e01360de6bcefd68f7`, `b17fcb169f7170474dc7e272966d4b5ceb74e55b`, `50422f3a2469ac071f260307c1f23eb432046930`, `90ddc88bb188be177925022f2c679cc61b577377`, `82e97c60c9a54fa1477e1a9cdf50b32871faeb3a`, `a093314e2a21ef4027cd704e2839f355ee2a46e0`, `7e7e5019ffebd7b7c28e60bd3e590812c1576979`, `3621f44ab444f6f89fd5c95bd42074cdcf7805bb`, `2877a28c905cab68f5742026092271b13e1b2f46`.

### Verification status — do not overstate
- Earlier GitHub Verify and ACE JAMB E2E runs passed on commit `23735a1` and the documentation successor `13865f1`.
- Verify and E2E passed for the earlier onboarding error-hardening commit `3fd5956` (confirmed from Actions).
- Latest navigation/CBT/practice test and source changes are still queued/in progress at this note; no pass is claimed for those commits yet. See [GitHub Actions](https://github.com/DarealNovaking/Nova-ace-jamb/actions).
- No production database writes, migrations, or deployment were performed.
- The live database audit found no published questions at that time. The practice flow is now wired to the real server RPC but must show the empty-bank state until verified questions are published.

### Exact next action
Poll Verify and ACE JAMB E2E for the latest source/test commits, fix any failing assertions or type/build errors, then inspect the published-question/attempt contracts again and finish Phase 1 acceptance for batches 1–5. Phase 1 remains in progress.


## Phase 1 follow-on — practice mode and recovery contract (2026-10-21)

- The Practice workspace now routes to `?cbt=1&mode=practice` and invokes the existing server-side `start_attempt` RPC with `p_mode: 'practice'`. Standard dashboard CBT explicitly uses `cbt` mode.
- CBT active-attempt pointers are stored locally by authenticated user ID and attempt mode, and are used to call the existing ownership-checked `resume_attempt` RPC after reload. This is a recovery pointer only; answers, timing and scores remain server-authoritative. Completed attempts restore their result without requiring question content to be fetched again. Practice and CBT pointers are isolated from each other.
- The Practice entry maps the known server error for an empty published question bank to a clear unavailable state. No synthetic questions were added.
- Added E2E cases for: practice mode + empty bank, active CBT resume after reload, and a mocked save/submit/result journey. Existing tests also cover dashboard workspace URL/history. All Supabase routes in these tests are intercepted; tests do not write production data.
- Commits after the prior log: `b17fcb169f7170474dc7e272966d4b5ceb74e55b`, `50422f3a2469ac071f260307c1f23eb432046930`, `90ddc88bb188be177925022f2c679cc61b577377`, `82e97c60c9a54fa1477e1a9cdf50b32871faeb3a`, `a093314e2a21ef4027cd704e2839f355ee2a46e0`, `3621f44ab444f6f89fd5c95bd42074cdcf7805bb`, `2877a28c905cab68f5742026092271b13e1b2f46`, `cba0c14efc6808af36be7d9616cae7f6f1b59da9`.
- GitHub CI caught intermediate type errors while the mode prop/callback were being introduced in separate commits. The final source fixes those errors: `PersistentCBT` declares the mode prop and the dashboard click handler explicitly calls `startCbt('cbt')`. CI for the final `cba0c14` commit is queued; no pass is claimed yet. Some earlier intermediate commits therefore correctly show failures and should not be treated as the final state.
- No DB migrations, production data writes, or deployment were performed.

### Current exact next action
Check Verify and ACE JAMB E2E on the latest main commit after `cba0c14` and this documentation update. Fix any remaining typecheck or Playwright failure before advancing Phase 1. Then continue batch 1 auth/onboarding E2E, batch 3 published-syllabus fixtures, and batch 5 CBT expiry/submit/recovery acceptance. Phase 1 is still in progress.


## Frontend Phase 1 continuation — 2026-10-21
- Current task: finish the coordinated frontend batches, starting with auth/onboarding/dashboard/syllabus/practice/CBT.
- Added E2E test `onboarding save contract` in `tests/e2e/smoke.spec.ts`; it verifies the mocked server RPC receives English + exactly three additional subject IDs and expected profile fields. Commit: `b8881491720d74832f7a18401b905b7967368567`.
- No production data writes, migrations, or deployment. Verify workflow for prior checkpoint SHA `a8c44efc5b5438d8b69c06fad8ca3f2f5b00911d` passed typecheck/build; E2E was still running and the new commit's checks remain to be inspected.
- Exact next action: inspect Actions for HEAD `b8881491720d74832f7a18401b905b7967368567`, resolve any failing E2E assertions, then add CBT expiry/completed-attempt recovery regression coverage. Keep empty/unpublished question states honest.


### Phase 1 continuation — mode-specific CBT recovery fix (2026-10-21)
- Found and fixed a fresh-sign-in inconsistency in `src/components/ProtectedCBT.tsx`: after sign-in, Practice was assigned the CBT local recovery key. Commit: `04ad0edae2bfa936997a0edfeb1d6138a87d03f7`. Recovery key now uses the validated route mode, keeping practice and CBT attempt pointers isolated.
- Verification: preceding Verify workflow passed typecheck/build at SHA `38a948349c6c732f5b8ae144051dff3650b089c7`; corresponding E2E and several older E2E runs were still in progress at last inspection. No E2E pass is claimed for this fix yet. No database writes, migrations, or deployment.
- Exact next action: poll Verify/E2E on the new fix SHA; add/verify a regression for signing into Practice and preserving its mode-specific key; then test CBT expiry, completed-attempt recovery and syllabus published/unpublished states. Phase 1 is still in progress.


### Latest Phase 1 test addition — completed CBT recovery (2026-10-21)
- Added mocked E2E coverage for restoring a completed attempt's server-authoritative score without fetching question rows. Test iterations: `4e8fc1c5c6c8493c20635d1651b19d0968ca03bf`, `ef6ec1e5478612d0cb1fa5bd6866c39ef330b6a9`, `bc616ee623ec88cefb524e4c5762901a0ef5e77f`.
- CI status: Verify previously passed at SHA `38a948349c6c732f5b8ae144051dff3650b089c7`; current source/test commit's E2E outcome is unverified because the observed workflow runs were queued/in progress at runner setup. Do not mark the new test passed.
- No production DB writes, migrations, or deployment. Exact next action: poll latest main runs; fix E2E failures, add practice sign-in recovery-key coverage, then verify CBT expiry/retry and syllabus published/unpublished states. Phase 1 remains in progress.


## Continuity refresh — 2026-10-21 (current inspection)
- Verified repository: private `DarealNovaking/Nova-ace-jamb`, default branch `main`; GitHub connector reports admin/push permission.
- Latest commit observed on main: `b0a31f07e90b001771880854162451ce64d55d2f` — docs-only update recording completed CBT recovery test coverage. Latest related source/test commits include `bc616ee623ec88cefb524e4c5762901a0ef5e77f` (dashboard recovery entry) and earlier recovery assertion commits.
- Current checkpoint's latest Phase 1 note says the next action is to inspect Verify and ACE JAMB E2E for latest source/test commits, fix failures, then add practice sign-in recovery-key coverage and verify CBT expiry/retry plus syllabus published/unpublished states. Phase 1 remains in progress; do not advance to disconnected feature batches.
- Read current `package.json`: scripts include `typecheck` (`tsc --noEmit`), `build` (`vite build`), and `e2e` (`playwright test`).
- Current source read-back confirms `ProtectedCBT.tsx` derives local recovery storage keys from validated route mode and user ID, and passes `mode` to `PersistentCBT`. Current E2E file contains workspace reload/history, onboarding RPC contract, and student workspace empty-state tests.
- CI limitation in this inspection: the GitHub combined-status endpoint returned an empty status list for latest main SHA `b0a31f07e90b001771880854162451ce64d55d2f`; this is not evidence of a pass or failure. No workflow run result could be confirmed from that endpoint. Therefore latest E2E outcome remains UNVERIFIED.
- No application code, production database, migration, or deployment changed during this inspection. The prior catalogue/Batch 2 status is historical and not the current execution focus: latest checkpoint explicitly tracks Phase 1 frontend batches 1–5. Do not restart the catalogue investigation without new evidence or a current handoff direction.
- Exact next action: obtain the latest GitHub Actions Verify and ACE JAMB E2E run results for current main/source commits; if run results are inaccessible through the available connector, use the repository Actions page as the alternate read path. Fix any reproducible failures, then add a regression for signing into Practice and preserving the practice-specific recovery key. After that, test CBT expiry/retry and syllabus published/unpublished states. Update both canonical handoffs after each meaningful change.


## Actions verification attempt — blocker (2026-10-21)
- Attempted the alternate GitHub Actions browser path at the repository Actions page. It returned 404 because the private repository requires GitHub sign-in; the available browser profile has no GitHub session. No workflows were modified or rerun.
- GitHub combined-status endpoint also returned an empty status list for the previously observed source/docs SHA, so current Verify/E2E status remains UNVERIFIED (not passed, not failed).
- Canonical handoff refresh commits created immediately before this note: checkpoint `993aacd1e5a61c8e9c451ba69b14395573117e8a`; master handoff `f6985461170a6400678130c45cac7c55904b952e`.
- Required user action to unblock browser-based Actions inspection: explicitly authorize a GitHub browser sign-in setup for the existing browser profile; no password should be sent in chat. Once the profile is signed in to an account with access to this private repository, repeat read-only Actions inspection. Meanwhile, continue only safe repository-backed work and do not claim CI success.

## Current Phase 1 acceptance checkpoint — 2026-10-21

- **This section supersedes older checkpoint instructions that make catalogue ingestion the immediate next action.** The current student journey is preparation-first and must function without institution/programme/UTME catalogue completeness. Keep legacy catalogue schema/data unless a separate approved decision explicitly requests destructive removal.
- **Repository / branch:** `DarealNovaking/Nova-ace-jamb` / `main`. The last code/test commit observed before this checkpoint update is `ee68f8d3df4447933c30aa5912f26673a01393ad`. Documentation commits that follow this note will advance HEAD; refresh main before editing.
- **Verified:** GitHub Actions Verify run `39530603871` on `ee68f8d3df4447933c30aa5912f26673a01393ad` completed successfully. The previous E2E run `39529889223` failed after typecheck/build/browser installation passed. Its four failures were two tests duplicated across desktop/mobile: practice empty-question error state not found, and the randomized-options submit test clicked the wrong displayed label.
- **Fix submitted:** `tests/e2e/smoke.spec.ts` changed in commit `ee68f8d3df4447933c30aa5912f26673a01393ad`: the practice RPC error mock now sets explicit JSON content type and the test waits for `p_mode=practice`; the submit test now clicks `B. First answer` because its mocked canonical option A is displayed second under option order `B, A`.
- **Current E2E run:** `39530604054` for the fix commit was still `in_progress` at last poll. Do not claim E2E pass until its final conclusion and logs are inspected.
- **Phase 1 decision:** OPEN; not verified complete. Current coverage includes student entry/onboarding, workspace route/history behavior, honest no-content states, practice-vs-CBT mode, active attempt resume, and completed-result restoration without refetching question content. Remaining acceptance work includes confirming the practice empty-state fix, practice sign-in recovery-key regression, CBT expiry/retry, and published/unpublished syllabus states.
- **No production action:** No production migration, database write, Edge Function deployment, or application deployment was performed during this review.
- **Exact next action:** inspect E2E run `39530604054`. If the practice empty-state assertion still fails, read the latest job log and artifact to establish the actual rendered state, then fix the underlying component/mock contract. Once E2E is green, add the remaining practice sign-in recovery, CBT expiry/retry, and syllabus publication-state tests, rerun Verify + E2E, and only then decide whether Phase 1 can close.

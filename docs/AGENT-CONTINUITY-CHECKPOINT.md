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

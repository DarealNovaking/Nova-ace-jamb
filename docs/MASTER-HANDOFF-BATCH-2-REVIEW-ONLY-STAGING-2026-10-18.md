# Batch 2 Review-Only Staging Handoff — 2026-10-18

## Verified repository state at start
- Repository: `DarealNovaking/Nova-ace-jamb`, default branch `main`.
- Latest observed starting HEAD: `38272af3fe12dda5a858b7ffbde3a6cc025186d0` (`docs: checkpoint review-only staging blocker`).
- Exact blocker: `src/components/AdminCatalogueImport.tsx` is a bulk 791-row importer that automatically validates, approves, and publishes. It is unsafe for a one-row review-only staging trial.
- Supabase project: `uokiqlgmzprqfbzmedaz`. Read-only connector access is now working.
- Live functions: `catalog-import` ACTIVE v7 and `ibass-catalog-stage` ACTIVE v4; both require JWT.
- Live catalogue previously rechecked at 791 institutions, 0 programs, 0 UTME rules, 4 existing batches. Approved source rows are available, but no new staging request was sent in this task.

## Changes committed
1. `12c362b4c646de89b6d03d1792a9eebe5a2bc06b` — added `src/components/AdminReviewOnlyStage.tsx`.
   - Loads catalogue institutions and approved sources through the `ace` schema.
   - Requires selecting one existing institution and explicit confirmation.
   - Previews a single-row payload and calls only the secured `catalog-import` Edge Function.
   - Requires response `status=staged`, `row_count=1`, and a batch ID before reporting success.
   - No validate, approve, or publish RPC call exists in this component.
2. `60e5246ecc9e76801ab74c75f38c423404d42921` — mounts the separate review-only component above the existing bulk importer in `src/components/AdminFoundationGate.tsx`.
3. `2417607f97fb0efb02f88da932ecaa9f432986e5` — adds `tests/review-only-stage.test.mjs`, checking one-row constraints, staging response guard, approved source, and absence of validation/approval/publication RPC calls.
4. `1af0d018830465c25b916ce71ed0278e303ae95b` — wires the safety test into `.github/workflows/verify.yml`.

## Safety and verification
- No live catalogue staging, approval, publication, function deployment, or database mutation was performed by these commits.
- No local clone/runtime is available through this connector workflow; local npm/typecheck/build/Playwright were not run here.
- GitHub Actions should run automatically from the latest `main` push. Check the latest Verify workflow outcome before using the UI. The test is static source-contract coverage; it does not replace authenticated browser QA.
- The live approved sources include official institution authority records (NUC/NBTE/NCCE), but a real staging trial still needs a human admin to select a row and confirm. Do not click the existing bulk XLSX importer for this trial.
- The single-row component only stages. It does not validate the batch. That is intentional for this safety step.

## Exact next action
1. Verify CI for latest `main` HEAD, including the new test, TypeScript typecheck, build, and existing SQL integration job.
2. Open the authenticated admin dashboard and use **Single-row review-only staging**, not the XLSX importer. Select one institution, inspect the payload/source, and confirm once.
3. Verify the returned batch ID and live row counts/status using read-only SQL. Confirm exactly one new row and batch remain `staged`/pending validation; do not approve or publish.
4. If CI or live response does not match expectations, stop and record the precise failure. Batch 2 remains IN PROGRESS; Batch 3 remains LOCKED.

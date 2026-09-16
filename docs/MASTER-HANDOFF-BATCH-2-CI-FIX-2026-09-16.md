# Batch 2 CI Fix — 2026-09-16

## Progress

- Re-checked the live Batch 2 state before continuing.
- `ace.institutions` currently contains 0 published institutions.
- The catalogue import tables are `ace.catalog_import_batches` and `ace.catalog_import_rows`.
- There is 1 historical institutions import batch and 1 persisted import row. The batch metadata declared 791 rows but the database contains only 1 persisted row, so the batch is correctly `rejected` as incomplete. It is not the 791-row production catalogue and must not be treated as completed ingestion.
- There are 5 approved catalogue sources in the live database.
- Re-checked `src/main.tsx` and confirmed the newly wired `/admin-import` route called `createRoot(...)` without importing it from `react-dom`.
- Fixed the compile blocker by adding `import { createRoot } from 'react-dom/client';`.
- Fix commit: `7c69d1e3179a54b680468478de367f303e0ab1d3` (`fix(batch-2): restore createRoot import`).

## Verification state — updated

- GitHub Actions was re-run on main commit `8a40b101fae4ea0046d856ba6c856c0a93152898`.
- `Verify` workflow run `35097937614` completed successfully.
- `ACE JAMB E2E` workflow run `35097937595` completed successfully.
- The E2E job completed typecheck, build, Playwright browser installation, and browser tests successfully.
- The current Playwright CI suite is a smoke suite covering the student entry surface and mobile overflow behavior. It does not authenticate an admin account or execute the catalogue import pipeline.
- Therefore CI/browser smoke health is green, but authenticated `/admin-import` verification and the real 791-row catalogue promotion gate remain open.
- No production catalogue data was inserted or promoted by the createRoot fix.

## Live database verification — corrected

Verified against Supabase project `nova-ace-jamb` (`uokiqlgmzprqfbzmedaz`):

- `ace.institutions`: 0
- `ace.catalog_import_batches`: 1
- `ace.catalog_import_rows`: 1
- approved `ace.catalog_sources`: 5
- latest institutions batch: `rejected`, declared `row_count=791`, persisted rows=1
- rejection reason: `incomplete_batch` because only 1 import row was persisted

This corrects the earlier handoff wording that described the 791-row batch as staged. The authoritative workbook itself remains a 791-record source artifact; the live database does not contain those 791 institutions yet.

## Import pipeline readiness

- `catalog-import` Edge Function is active at version 2 with JWT verification enabled.
- Approved source matching is available for NUC, NBTE and NCCE.
- The admin importer preflights exactly 791 workbook records and enforces the expected authority split: NUC 328, NBTE 199, NCCE 264.
- The importer is designed to stage through the secured Edge Function, then validate → approve → publish and verify a final database count of 791.
- The current CI smoke tests do not prove this authenticated pipeline; that remains a separate gate.

## Batch 2 gate

Batch 2 remains **IN PROGRESS**. Batch 3 remains locked.

## Next required gate

1. Obtain an authenticated browser session and verify `/admin-import` access control and admin UI behavior with Playwright/browser automation.
2. Run the authoritative 791-row workbook through the secured staging → validation → approval → publication pipeline.
3. Verify the final published `ace.institutions` count is exactly 791 and inspect authority/status counts.
4. Record complete import evidence in the master handoff before any Batch 2 gate closure.

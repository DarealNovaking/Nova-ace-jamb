# Batch 2 CI Fix — 2026-09-16

## Progress

- Re-checked the live Batch 2 state before continuing.
- `ace.institutions` currently contains 0 published institutions.
- The catalogue import tables are `ace.catalog_import_batches` and `ace.catalog_import_rows`; the live project currently has 1 batch and 1 staged row. This is not the 791-row production catalogue and must not be treated as completed ingestion.
- There are 5 approved catalogue sources in the live database.
- Re-checked `src/main.tsx` and confirmed the newly wired `/admin-import` route called `createRoot(...)` without importing it from `react-dom`.
- Fixed the compile blocker by adding `import { createRoot } from 'react-dom/client';`.
- Fix commit: `7c69d1e3179a54b680468478de367f303e0ab1d3` (`fix(batch-2): restore createRoot import`).

## Verification state — updated

- GitHub Actions was re-run on the corrected main branch commit `8a40b101fae4ea0046d856ba6c856c0a93152898`.
- `Verify` workflow run `35097937614` completed successfully.
- `ACE JAMB E2E` workflow run `35097937595` completed successfully.
- The E2E job completed typecheck, build, Playwright browser installation, and browser tests successfully.
- The current Playwright CI suite is a smoke suite covering the student entry surface and mobile overflow behavior. It does not authenticate an admin account or execute the catalogue import pipeline.
- Therefore CI/browser smoke health is green, but authenticated `/admin-import` verification and the real 791-row catalogue promotion gate remain open.
- No production catalogue data was inserted or promoted by this change.

## Live database verification

Verified against Supabase project `nova-ace-jamb` (`uokiqlgmzprqfbzmedaz`):

- `ace.institutions`: 0
- `ace.catalog_import_batches`: 1
- `ace.catalog_import_rows`: 1
- approved `ace.catalog_sources`: 5

The 1 staged row is not evidence of the 791-row production catalogue.

## Batch 2 gate

Batch 2 remains **IN PROGRESS**. Batch 3 remains locked.

## Next required gate

1. Obtain an authenticated browser session and verify `/admin-import` access control and admin UI behavior with Playwright/browser automation.
2. Exercise the secure staged → validated → approved → published pipeline using the authoritative 791-row workbook.
3. Verify the final published `ace.institutions` count is exactly 791 and inspect source-authority counts and validation status.
4. Record the complete import evidence in the master handoff before any Batch 2 gate closure.

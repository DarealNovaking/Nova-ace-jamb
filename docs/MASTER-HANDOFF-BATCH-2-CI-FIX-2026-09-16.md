# Batch 2 CI Fix — 2026-09-16

## Progress

- Re-checked the live Batch 2 state before continuing.
- `ace.institutions` currently contains 0 published institutions.
- The catalogue import tables are `ace.catalog_import_batches` and `ace.catalog_import_rows`; the live project currently has 1 batch and 1 staged row. This is not the 791-row production catalogue and must not be treated as completed ingestion.
- There are 5 approved catalogue sources in the live database.
- Re-checked `src/main.tsx` and confirmed the newly wired `/admin-import` route called `createRoot(...)` without importing it from `react-dom`.
- Fixed the compile blocker by adding `import { createRoot } from 'react-dom/client';`.
- Commit: `7c69d1e3179a54b680468478de367f303e0ab1d3` (`fix(batch-2): restore createRoot import`).

## Verification state

- The previous CI failure was a TypeScript error caused by the missing `createRoot` import; this fix addresses that exact error.
- A fresh CI run must still be observed before claiming typecheck/build/Playwright success.
- No production catalogue data was inserted or promoted by this change.

## Batch 2 gate

Batch 2 remains **IN PROGRESS**. Batch 3 remains locked.

## Next required gate

1. Confirm GitHub Actions runs against commit `7c69d1e...` and inspect typecheck/build results.
2. Run authenticated browser/Playwright verification of `/admin-import` when an authenticated browser session is available.
3. Exercise the secure staged → validated → approved → published pipeline using the authoritative 791-row workbook.
4. Verify the final published `ace.institutions` count is exactly 791 and document the result before any gate closure.

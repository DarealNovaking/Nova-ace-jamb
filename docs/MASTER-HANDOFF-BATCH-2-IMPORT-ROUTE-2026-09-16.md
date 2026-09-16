# Batch 2 Import Route Addendum — 2026-09-16

## Progress

- Re-checked the canonical master handoff and gated implementation plan before continuing Batch 2.
- Confirmed the secure `AdminCatalogueImport` component already implements the intended institution pipeline: authenticated admin check → workbook preflight → NUC/NBTE/NCCE grouping → secured `catalog-import` Edge Function → validation → approval → publication → final 791-row count verification.
- Confirmed the authoritative Phase 1 workbook contains 791 institution records split as NUC 328, NBTE 199 and NCCE 264.
- Found that `src/admin-import.tsx` existed as a standalone entry but was not wired to the repository's actual `src/main.tsx` application entry. This meant the importer could not be reached at a normal application path.
- Added `/admin-import` routing directly to `src/main.tsx`, preserving the existing student and protected-CBT flows and rendering the secure importer page at the application route.
- Commit: `9d52daf22abbcd094cbe951a565eaab82c21a4bb` (`feat(batch-2): expose secure admin catalogue importer route`).

## Verification state

- The route wiring is committed to `main`.
- GitHub Actions did not yet report a workflow run for this commit at the time of this addendum; no CI pass is claimed here.
- Real authenticated browser verification and production publication of the 791 institutions remain required. Batch 2 remains **IN PROGRESS** and Batch 3 remains locked.

## Next gate

Use the authenticated browser/Playwright workflow against `/admin-import` to exercise the real admin upload path, then verify the secure staged → validated → approved → published pipeline and the final database count of 791 institutions. Do not bypass the importer or manually promote unverified catalogue data.

# Batch 2 — Catalogue Import Hardening — 2026-09-16

## Progress

- Added a secure `ace.approve_catalog_batch(uuid)` database transition.
- Approval requires an authenticated admin, a `reviewing` batch, and zero rows that are pending/invalid. Approval changes every valid row to `approved`, changes the batch to `approved`, and records an audit event.
- Applied the migration live to Supabase project `nova-ace-jamb` and verified the function exists alongside validation and publication functions.
- Added `src/components/AdminCatalogueImport.tsx` as the operational importer.
- Added `admin-import.html` and `src/admin-import.tsx` as a dedicated admin import entrypoint.
- Added the `xlsx` dependency so the Phase 1 workbook can be parsed in-browser without bypassing the secured import path.

## Import safeguards

The importer:

1. Requires an authenticated admin session.
2. Requires the `INSTITUTIONS` sheet.
3. Requires exactly 791 rows.
4. Rejects missing IDs/names, duplicate IDs/names, unsupported institution types, and unknown authority labels before submission.
5. Requires the expected authority split: NUC 328, NBTE 199, NCCE 264.
6. Resolves only approved catalogue sources already registered in `ace.catalog_sources`.
7. Stages through the authenticated `catalog-import` Edge Function.
8. Validates server-side.
9. Approves server-side through the new guarded approval function.
10. Publishes through the existing publication boundary.
11. Verifies the final `ace.institutions` count is exactly 791.
12. Stops safely on any error and reports the stage that failed.
13. Checks request size before submission to stay below the Edge Function body limit.

## Data/provenance boundary

The workbook contains institution identity/category/ownership/state plus source and verification metadata. It does not contain JAMB institution codes or institution→programme mappings. Therefore the importer intentionally does not invent `jamb_code` values or programmes. Published institution rows retain source/provenance through the registered authoritative source and the workbook metadata is preserved in the staged payload.

## Verification status

- Live approval function: verified.
- GitHub implementation committed.
- GitHub `Verify` and `ACE JAMB E2E` workflows were triggered by the latest push and were observed running; final CI conclusion must be checked before declaring the frontend change verified.
- **Batch 2 remains IN PROGRESS.** The actual 791-row production import has not been claimed complete until the admin importer is executed with the workbook and the database count is verified.

## Commits

- `a671712536b86c706c9d663364471a3f31674018` — secure catalog approval migration
- `0043cc6adc10fa92264334715a9e43f073a78ec8` — hardened institution importer
- `82a5ed21fe4fff860a7133ce6246ec3ce00bdd62` — admin import entrypoint
- `dd5b131531a8b580b9817579a393e135c6d1a2f1` — admin importer page wiring
- `10d5f71923676b31147bbd30f5aaf149083812a8` — XLSX dependency

## Next gate

Execute the importer with `nigeria_tertiary_institutions_phase1.xlsx`, verify 791 institution rows in `ace.institutions`, then reconcile the institution catalogue against JAMB/IBASS and proceed to programme + UTME combination ingestion. Do not start Batch 3.

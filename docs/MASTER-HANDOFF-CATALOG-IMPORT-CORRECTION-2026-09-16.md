# ÑØVÃ ACE JAMB — Catalog Import Correction — 2026-09-16

## Batch 2 checkpoint correction

A live Supabase verification was performed before proceeding with the Batch 2 catalogue gate.

### Verified live state
- `ace.catalog_sources` contains the approved institutional authorities for NUC, NBTE and NCCE.
- The catalog approval, validation and publication functions exist in `ace`:
  - `validate_catalog_batch(uuid)`
  - `approve_catalog_batch(uuid)`
  - `publish_catalog_batch(uuid)`
- A previously created import batch `a563b370-de07-43fe-a29a-517d6036c685` declared `row_count=791`, but only **1** row actually existed in `ace.catalog_import_rows`.
- That single row was `UNI0001` / Amadeus University and had been marked approved.
- `ace.institutions` remains at **0** rows.

### Correction applied
The incomplete batch was rejected rather than approved or published. Its single row was also marked rejected with an explicit `incomplete_batch` validation reason.

This correction prevents the metadata mismatch (791 declared vs 1 persisted) from entering the publication boundary.

### Important project-state rule
The earlier statement that all 791 institutions had successfully been staged was incorrect. The authoritative live database state is the source of truth: **the 791-institution import has NOT yet completed**.

Batch 2 therefore remains **IN PROGRESS / OPEN**.

### Next required operation
Use the authenticated admin browser workflow to perform a clean import of the supplied 791-institution workbook through the intended `catalog-import` Edge Function, then:

**stage 791 → validate 791 → approve 791 → publish 791 → verify 791 institutions**

Do not bypass the secure import/publication boundary with direct production inserts merely to close the gate.

After the 791-institution gate is verified, continue with authoritative institution → programme → JAMB UTME subject-combination ingestion. Do not begin Batch 3.

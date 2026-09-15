# ACE JAMB — Batch 2 Handoff Addendum — 2026-09-16

## Phase 1 institution dataset

The project owner supplied `nigeria_tertiary_institutions_phase1.xlsx` for Batch 2 institution-layer work.

Verified workbook facts:
- 791 institution records total.
- 328 universities, 199 polytechnics, 264 colleges of education.
- 703 rows marked `Verified`.
- 88 rows marked `Needs Verification (Ownership/State)`.
- No institution→programme mappings or programme→UTME subject combinations are present.
- Workbook SHA-256: `37915a0ea43795849dd341b3413b348369740a5be13df802e3a418f99430fd60`.

## Safety/provenance decision

The workbook is treated as a **secondary compiled institution directory**, not as authoritative JAMB eligibility data. Only the 703 rows marked `Verified` are eligible for catalog staging. The 88 provisional rows are excluded until independently verified.

No JAMB codes, programmes, or UTME combinations are invented from this workbook. Programme availability and subject combinations remain gated behind authoritative JAMB/IBASS evidence.

## Durable implementation

Added `scripts/catalog/normalize_phase1_institutions.py` to the repository. It is stdlib-only, reads the `INSTITUTIONS` worksheet directly from XLSX, validates the expected columns, emits only `Verified` institution rows in the existing catalog-import shape, preserves provenance fields, and explicitly records that no JAMB codes/programmes/UTME combinations were invented.

The initial implementation had an XLSX relationship-path bug discovered during local verification and was corrected before further use. The correction is committed on `main`.

Added `docs/catalog/PHASE1-INSTITUTIONS-IMPORT-NOTE.md` documenting the dataset scope, SHA-256, authority separation, exclusion of provisional rows, and the Batch 2 gate impact.

## Supabase staging status

A temporary staging attempt was started to test the database boundary, but it was intentionally rolled back after only three rows were inserted; the temporary source and batch were deleted. This leaves **0 catalog import batches and 0 published institutions** from this workbook. No partial dataset remains in the live catalogue.

This was deliberate: the supported catalog-import Edge Function remains the intended authenticated ingestion path, and the full XLSX must not be partially promoted through ad-hoc SQL.

## Current Batch 2 gate impact

Batch 2 remains **OPEN / IN PROGRESS**.

Completed/verified direction:
- Season/config/syllabus schema and activation boundaries.
- Authoritative-source registration.
- Catalog import validation/publication boundaries.
- Catalog snapshot idempotency.
- Official JAMB/IBASS source registration.
- Safe empty-catalog onboarding behavior.
- Deterministic Phase 1 institution normalizer and provenance documentation.

Remaining blockers:
- Ingest the eligible institution directory through the authenticated catalog-import workflow and keep records draft until publication approval.
- Obtain/ingest authoritative JAMB/IBASS institution→programme mappings.
- Obtain/ingest authoritative programme→UTME subject combinations, preserving required/alternative groups rather than guessing.
- Populate and activate syllabus content only from verified/rights-approved evidence.
- Complete the formal Batch 2 verification/documentation gate. Batch 3 must not start early.

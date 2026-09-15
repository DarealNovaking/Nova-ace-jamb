# ÑØVÃ ACE JAMB — Batch 2 Handoff Addendum — 2026-09-16

## Phase 1 institution dataset
- User supplied `nigeria_tertiary_institutions_phase1.xlsx` for Batch 2 institution-layer work.
- Workbook contains 791 institution records across universities, polytechnics and colleges of education.
- 703 records are marked `Verified`; 88 are marked `need verification` and are excluded from automated promotion.
- The workbook contains no institution→programme mappings and no programme→JAMB UTME-combination mappings. Those datasets must therefore still come from JAMB/IBASS evidence.
- The workbook's row-level `Source Authority`, `Source / Reference`, verification date and notes are preserved by the repository normalizer.

## Ingestion tooling
- Added `scripts/catalog/normalize_phase1_institutions.py`.
- The normalizer reads the `INSTITUTIONS` worksheet directly from XLSX using the Python standard library, emits catalog-import JSON, keeps verified rows only, and explicitly records that JAMB codes, programmes and UTME combinations are never invented.
- No raw XLSX or generated catalogue snapshot has been committed to GitHub.
- A temporary invalid generated JSON file was created during tooling work and immediately deleted; it is not part of the repository or database.

## Live database state after reconciliation
- Supabase project `nova-ace-jamb` is `ACTIVE_HEALTHY`.
- Catalog state remains intentionally empty: 6 sources, 0 import batches, 0 import rows, 0 institutions, 0 programmes, 0 UTME rules.
- An attempted empty staging batch was rolled back and removed. No partial institution data remains in the database.
- The user-supplied Phase 1 workbook is **not** being represented as an authoritative JAMB/IBASS programme or UTME source.

## Batch 2 gate impact
- Batch 2 remains **IMPLEMENTATION IN PROGRESS**.
- Season/exam configuration, 25-subject 2026 catalogue, versioned syllabus ownership, structured institution/program/UTME-rule schema, source registry, validation pipeline, secure publication boundary and catalog-safe onboarding are implemented.
- The institution layer now has a deterministic normalization path, but publication is intentionally blocked until source review and appropriate authoritative reconciliation are complete.
- Programme mappings, authoritative JAMB UTME combinations/alternative groups, and syllabus topic/subtopic ingestion remain outstanding.
- Batch 1 formal E2E gate remains open; it will be executed once the product surface stabilizes. Batch 3 remains locked.

## Next execution target
1. Reconcile the 703 verified institution records against appropriate primary authority references and JAMB/IBASS identity where applicable.
2. Stage only reconciled institution records through the existing catalog-import boundary.
3. Review/approve valid rows before publication.
4. Build institution→programme mappings from JAMB/IBASS sources.
5. Build programme→season-specific UTME rules, preserving required subjects and explicit alternative groups without guessing.
6. Ingest/review syllabus taxonomy from authoritative JAMB material.
7. Run the required frontend/browser gate when structured onboarding changes are introduced.

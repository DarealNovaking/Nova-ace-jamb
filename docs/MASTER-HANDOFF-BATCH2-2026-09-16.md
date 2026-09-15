# ÑØVÃ ACE JAMB — Batch 2 Handoff Addendum — 2026-09-16

## Phase 1 institution dataset
- User supplied `nigeria_tertiary_institutions_phase1.xlsx` for Batch 2 institution-layer work.
- Workbook contains 791 institution records across universities, polytechnics and colleges of education.
- 703 records were initially marked `Verified`.
- The remaining 88 records are all polytechnics whose `Source Authority` is NBTE (National Board for Technical Education); their institution identity/accreditation is therefore regulator-confirmed. The original uncertainty was ownership/state corroboration, not institution existence.
- The 88 NBTE records are now eligible for Layer 1 normalization as regulator-confirmed institutions. Their ownership/state values remain source-preserved and are not represented as independently corroborated facts.
- The workbook contains no institution→programme mappings and no programme→JAMB UTME-combination mappings. Those datasets must still come from JAMB/IBASS evidence.
- The workbook's row-level `Source Authority`, `Source / Reference`, verification date and notes are preserved by the repository normalizer.

## Ingestion tooling
- Added `scripts/catalog/normalize_phase1_institutions.py`.
- Updated the normalizer to accept regulator-confirmed NBTE institution rows even when the workbook's verification status says `Needs Verification (Ownership/State)`.
- The normalizer now produces 791 eligible institution rows and excludes 0 rows from this workbook; it records the NBTE-specific provenance caveat instead of inventing corroboration.
- The normalizer explicitly never invents JAMB codes, programmes or UTME combinations.
- No raw XLSX or generated catalogue snapshot has been committed to GitHub.
- A temporary invalid generated JSON file was created during earlier tooling work and immediately deleted; it is not part of the repository or database.

## Authority verification
- Official NBTE currently identifies itself as the regulator for TVET institutions and provides an approved-institutions directory plus a current 2025 Directory of Accredited Programmes. The NBTE directory page explicitly directs users to the approved institution/programme lists.
- Official NBTE material confirms that institutional status and programme accreditation fall within its regulatory remit. The 88 records are therefore treated as NBTE-confirmed for institution identity/accreditation, while preserving the workbook's ownership/state caveat.
- JAMB/IBASS remains the authority for the later institution→programme→UTME-combination relationship; JAMB states that IBASS provides available programmes at institutions and UTME subject combinations for courses.

## Live database state after this reconciliation
- Supabase project `nova-ace-jamb` is `ACTIVE_HEALTHY`.
- Catalog state is still 0 import batches / 0 import rows / 0 institutions / 0 programmes / 0 UTME rules. No institution rows were silently promoted outside the publication boundary.
- The registered NBTE catalogue source is already approved, so Layer 1 staging can use the existing source registry and publication boundary.
- A malformed test query using a placeholder JSON token was rejected by Postgres before any write; it created no data.

## Batch 2 gate impact
- Batch 2 remains **IMPLEMENTATION IN PROGRESS**.
- Season/exam configuration, 25-subject 2026 catalogue, versioned syllabus ownership, structured institution/program/UTME-rule schema, source registry, validation pipeline, secure publication boundary and catalog-safe onboarding are implemented.
- Layer 1 authority reconciliation is no longer blocked by the 88 records. The institution-layer dataset is now 791 regulator/authority-backed records with explicit provenance.
- Programme mappings, authoritative JAMB UTME combinations/alternative groups, and syllabus topic/subtopic ingestion remain outstanding.
- Batch 1 formal E2E gate remains open; it will be executed once the product surface stabilizes. Batch 3 remains locked.

## Next execution target
1. Stage the 328 university, 264 college-of-education and 199 polytechnic records through the existing catalog-import boundary using their respective approved institutional authorities.
2. Validate and approve the staged rows without fabricating JAMB codes.
3. Publish institution records as draft catalogue entries through the existing publication boundary once an authorized admin/editor execution context is available.
4. Build institution→programme mappings from JAMB/IBASS sources.
5. Build programme→season-specific UTME rules, preserving required subjects and explicit alternative groups without guessing.
6. Ingest/review syllabus taxonomy from authoritative JAMB material.
7. Run the required frontend/browser gate when structured onboarding changes are introduced.

# Batch 2 Addendum — Authoritative Data Research

Date: 2026-09-14

## Verified authoritative sources

- JAMB IBASS Eligibility Checker: `https://eligibility.jamb.gov.ng/`
- JAMB FAQ: `https://jamb.gov.ng/FAQ`
- JAMB official site / IBASS access: `https://jamb.gov.ng/`
- JAMB Admissions Department: `https://www.jamb.gov.ng/Departments`
- JAMB CAPS/IBASS manual: official JAMB manual covering required, optional and alternative UTME subjects.
- JAMB IBASS degree brochures, including Engineering, Education, Sciences and Administration publications.

## Confirmed product/data rules

- IBASS models the selection flow as institution → programme → UTME subject combination.
- JAMB states that candidates should use IBASS to verify the correct UTME subject combination for each programme.
- English Language is selected by default in the IBASS UTME subject-combination workflow.
- JAMB's Admissions Department reviews/updates the UTME brochure and obtains approved/delisted programme data from the relevant regulatory bodies.
- JAMB's Test Development Department reviews and develops UTME syllabuses.
- Programme combinations must remain source-derived; ACE must not infer or guess them.

## Reconciliation milestone

Live Supabase migration `20260914215200_batch_2_catalog_fk_indexes` was verified in the migration history. The corresponding repository migration was missing and has now been reconciled on `main` in commit `0eb1ea1553ae31b423cbc4d7fceff9c4c654f845`.

The migration adds indexes for catalog batch source, programme UTME-rule programme, and syllabus-version subject foreign-key paths.

## Current live data state

The architecture is ready for authoritative imports, but the live catalogue remains:

- Institutions: 0
- Programmes: 0
- Programme UTME rules: 0
- Syllabus topics: 0
- Syllabus subtopics: 0

No fabricated catalogue data has been promoted.

## Remaining Batch 2 work

1. Acquire/parse the authoritative JAMB/IBASS institution and programme source datasets.
2. Transform them into deterministic staged batches using `CATALOG-IMPORT-CONTRACT.md`.
3. Validate, review and approve every batch before publication.
4. Import programme-specific UTME combinations from authoritative records.
5. Import the authoritative syllabus topic/subtopic taxonomy with rights/provenance metadata.
6. Activate only approved syllabus versions and the correct season configuration.
7. Finish structured onboarding integration so the final student flow is institution → programme → source-derived UTME combination.
8. Verify typecheck/build and commit all implementation changes.

## Gate

Batch 2 remains **IN PROGRESS**. Batch 1's deferred E2E gate remains open. Batch 3 is not authorized.

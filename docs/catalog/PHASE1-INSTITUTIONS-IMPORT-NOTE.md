# ACE JAMB — Phase 1 Institution Dataset Import Note

## Purpose

This note records the provenance and import boundary for the institution workbook supplied during Batch 2 implementation. It is a **secondary compiled institution directory**, not an authoritative JAMB programme/UTME-combination catalogue.

## Workbook

- File: `nigeria_tertiary_institutions_phase1.xlsx`
- SHA-256: `37915a0ea43795849dd341b3413b348369740a5be13df802e3a418f99430fd60`
- Records: 791
- Universities: 328
- Polytechnics: 199
- Colleges of Education: 264
- Verified records: 703
- Records needing verification: 88
- Source authorities represented: NUC (328), NCCE (264), NBTE (199)

## Import boundary

Only the 703 rows marked `Verified` are eligible for staging from this workbook. The 88 `Needs Verification (Ownership/State)` rows remain excluded until independently verified.

The workbook does not contain institution → programme mappings or programme → JAMB UTME subject combinations. Those must continue through the authoritative JAMB/IBASS catalogue workflow and must not be inferred from this directory.

Institution records staged from this workbook must remain `draft` and retain workbook provenance. They must not be treated as authoritative JAMB eligibility data merely because the institution directory entry is marked verified.

## Authoritative-source separation

For programme availability and UTME subject combinations, ACE must use JAMB/IBASS authoritative evidence. The Phase 1 workbook is an institution-directory input only.

## Batch 2 status

Staging this dataset advances the institution layer but does **not** close Batch 2. Batch 2 still requires authoritative programme and UTME-rule population, validation, approval/publication, syllabus population/activation as applicable, and the formal gate verification/documentation.

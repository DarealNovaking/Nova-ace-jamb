# Batch 2 Handoff Addendum — Catalog Import Contract

Date: 2026-09-14

## Milestone

Defined and committed the authoritative catalogue import contract for Batch 2.

The contract covers four staged dataset types:

- institutions
- programs
- utme_rules
- syllabus

It defines the row envelope, institution/programme payloads, programme-specific UTME-rule payloads, syllabus topic/subtopic payloads, provenance expectations, lifecycle boundaries, quality rules and operational limits.

## Hard rules

1. Only reviewed/approved authoritative sources may feed the import pipeline.
2. Staging is never publication.
3. Institution → programme → programme-specific UTME combination relationships must be source-derived.
4. JAMB/IBASS combinations must never be guessed or generated from generic assumptions.
5. Syllabus rows remain inactive until the syllabus activation gate is passed.
6. Archived seasons cannot receive imports.
7. Source/provenance metadata must survive publication.
8. Conflicting authoritative records must not be silently merged.
9. Large datasets must be split into deterministic, auditable batches.

## Repository artifact

`docs/CATALOG-IMPORT-CONTRACT.md`

Commit: `6c01ce278b780d02029840784a086ebbce323fb6`

## Current Batch 2 status

The import, validation and publication architecture is ready for real authoritative data. The live catalogue remains intentionally unpopulated until source material is verified and approved. No fabricated institution, programme, UTME combination or syllabus taxonomy has been promoted.

## Gate

Batch 2 remains **IN PROGRESS**. This milestone does not close Batch 1's deferred E2E gate and does not authorize Batch 3.

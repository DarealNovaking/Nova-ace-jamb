# ÑØVÃ ACE JAMB — Batch 2 Authoritative Ingestion Handoff

Date: 2026-09-14

## Purpose
This addendum records the authoritative-source ingestion work for Batch 2. It is supplemental to `docs/MASTER-HANDOFF-PROGRESS-2026-09-12.md` and must be retained with the project handoff.

## Authoritative source verification

Current source registry in Supabase contains four reviewed/approved sources:

- JAMB 2026 Training Manual — approved.
- JAMB IBASS Eligibility Checker — approved.
- JAMB IBASS Degree Brochure — reviewed.
- JAMB IBASS Education Brochure — reviewed.

External verification confirms the IBASS eligibility workflow explicitly uses institution details, programme selection and UTME subject combination, with English selected by default. JAMB's 2026 Training Manual also directs candidates to IBASS for matching requirements to programmes and alternatives. These are the authoritative foundations for the ACE institution → programme → UTME-rule flow.

## Current live catalog state

- 25 active subjects.
- 2 seasons: JAMB UTME 2026 (closed) and JAMB UTME 2027 (draft).
- 1 exam configuration with 25 subject rows for the 2026 structure.
- 50 syllabus-version records covering 25 subjects across 2026/2027, intentionally draft/pending-rights.
- No published institution/programme/UTME-rule dataset has been seeded.
- No fabricated syllabus topics/subtopics have been seeded.
- Import staging is currently empty until authoritative source rows are actually reviewed and submitted.

## Catalog staging API

Supabase Edge Function `catalog-import` is deployed and ACTIVE with JWT verification enabled.

It accepts authenticated admin/editor requests and stages validated-shaped rows into:

- `ace.catalog_import_batches`
- `ace.catalog_import_rows`

Supported datasets:

- institutions
- programs
- utme_rules
- syllabus

Supported staged entity types:

- institution
- program
- program_utme_rule
- syllabus_topic
- syllabus_subtopic

Safety boundaries:

- JWT required.
- Only admin/editor roles may import.
- Source must be reviewed or approved.
- Archived seasons cannot receive imports.
- Maximum 5,000 rows/request.
- Maximum request body 4 MB.
- Invalid entity types/payloads are rejected.
- Import only creates `staged` data; it does not publish or activate anything.

The same Edge Function source is committed at:
`supabase/functions/catalog-import/index.ts`
(commit `ee4e1cce178b9e81525126e242a6c15261a22e79`).

## Live migration reconciliation

Supabase migration history currently contains two Batch 2 migrations after the previously recorded activation-validation migration:

- `20260914211904 batch_2_authoritative_catalog_ingestion`
- `20260914211919 batch_2_register_authoritative_sources_v2`

These live migration versions were present in Supabase during this continuation check, while their corresponding SQL migration files were not present on the current GitHub `main` tree. This is a repository/backend synchronization gap and is recorded deliberately rather than pretending the files are committed. The live schema/state remains authoritative; the missing migration source files must be reconciled into GitHub before Batch 2 is considered fully documented/committable.

## Verification performed

- Re-checked the canonical master handoff, gated batch plan and final architecture before continuing.
- Re-checked live Supabase schema and migration history.
- Confirmed the source registry and live season/catalog counts.
- Confirmed `catalog-import` is ACTIVE with `verify_jwt=true`.
- Verified official JAMB/IBASS sources through current web evidence.
- No browser/manual E2E testing performed, per the project owner's testing pause.

## Remaining Batch 2 work

1. Reconcile the two live-but-uncommitted Supabase migrations into the repository.
2. Ingest the authoritative institution/program/UTME-rule dataset from IBASS/brochure sources into staging.
3. Ingest the actual subject → topic → subtopic syllabus taxonomy from authoritative JAMB syllabus sources, preserving provenance and rights state.
4. Validate staged rows.
5. Review and publish only approved rows.
6. Verify season-aware programme combinations and syllabus activation behavior.
7. Run Batch 2 verification, document evidence and commit the final Batch 2 state.

Batch 2 remains **IMPLEMENTATION IN PROGRESS**. No Batch 3 work has started.

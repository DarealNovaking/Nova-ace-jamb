# Batch 2 — Official IBASS source registration addendum — 2026-09-15

## Verified source set

The live `ace.catalog_sources` registry now includes the official JAMB/IBASS degree-list and brochure sources required for the authoritative catalogue pipeline. Existing duplicate source URLs were not inserted twice.

Registered/reconciled sources include:

- JAMB IBASS Degree List of Schools — institution directory/catchment reference
- JAMB IBASS Engineering Degree Brochure — programme/UTME requirement source
- JAMB IBASS Education Degree Brochure — programme/UTME requirement source
- JAMB IBASS Sciences Degree Brochure — programme/UTME requirement source
- Existing JAMB IBASS Eligibility Checker source
- Existing 2026 JAMB Training Manual source

All newly registered brochure/directory sources are `reviewed`, not `approved`. This is intentional: source discovery/registration must not be confused with publication authority.

## Idempotency migration reconciliation

The live migration history contains `20260915002014_batch_2_catalog_snapshot_idempotency`. The repository was missing its migration file, so the exact schema change was reconciled into:

`supabase/migrations/20260915002014_batch_2_catalog_snapshot_idempotency.sql`

The live schema was verified to contain:

- nullable `catalog_import_batches.snapshot_hash`
- unique partial index `uq_catalog_import_batches_snapshot_hash`

## Data integrity boundary

No institution, programme, UTME combination, topic, or subtopic was fabricated or promoted. Live published catalogue counts remain zero until source-derived rows can be transformed, validated, reviewed, approved, and published through the existing server-side pipeline.

## Verification

Supabase migration history and live `ace.catalog_sources` state were checked after the change. The official source URLs were independently verified against JAMB/IBASS web results.

Frontend code was not changed in this increment, so a Playwright browser run was not required for this backend/source-registry-only change. The next frontend-affecting Batch 2 increment must run the Playwright gate before being considered complete.

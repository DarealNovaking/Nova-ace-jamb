# Batch 2 Catalog Import — Snapshot Idempotency

Date: 2026-09-15

## Milestone

Hardened the authoritative catalog staging pipeline against accidental duplicate imports.

### Changes

- Added `ace.catalog_import_batches.snapshot_hash`.
- Added a unique partial index so non-null snapshot hashes cannot be staged twice.
- Updated the `catalog-import` Edge Function to compute a SHA-256 hash of the exact request body before staging.
- Repeated submission of the exact same catalog snapshot now returns the existing batch instead of creating duplicate staging rows.
- The function remains JWT-protected and admin/editor-only.
- The idempotency check happens before batch creation, while the database unique index remains the final concurrency guard.

## Live verification

- Supabase migration applied successfully as `batch_2_catalog_snapshot_idempotency`.
- `uq_catalog_import_batches_snapshot_hash` exists in the live database.
- `catalog-import` Edge Function is active at version 2 with JWT verification enabled.
- No catalog data was fabricated or published by this change.

## Source boundary

Authoritative acquisition remains unchanged: institution/programme/UTME-rule/syllabus data must come from verified JAMB/IBASS material. The public IBASS Eligibility Checker confirms the institution → programme → UTME-combination model, while JAMB's official FAQ directs candidates to IBASS for programme-specific combinations.

## Batch status

Batch 2 remains **IN PROGRESS**. The next substantive milestone is importing verified authoritative catalogue data through the staged → validate → approve → publish pipeline.

Batch 1 remains formally open; this work does not close its deferred browser E2E gate.

# ÑØVÃ ACE JAMB — Batch 2 Catalogue Import Progress — 2026-09-16

## Current state

- Batch 2 remains **IN PROGRESS**; Batch 3 must not start.
- The authoritative institution workbook contains **791 institutions**: 328 NUC universities, 199 NBTE polytechnics, and 264 NCCE colleges of education.
- The secure frontend importer is wired and the workbook reached the Supabase staging boundary as batch `a563b370-de07-43fe-a29a-517d6036c685`.
- Live batch state: `staged`, `row_count=791`, dataset type `institutions`.
- Snapshot hash: `5ce0bd0ca595c3773528ad1b0895bb1f2b184b9040f116eead44a3c3fc90d09d`.
- Approved authoritative institution sources are registered for NUC, NBTE and NCCE.
- Live `ace.institutions` remains at **0** because publication has not yet occurred.

## Verification boundary

The required institution-import server sequence remains:

**validate → approve → publish → verify 791**.

`ace.validate_catalog_batch` correctly rejects unauthenticated/service-level invocation with `Admin/editor access required`. The intended authenticated browser/admin flow remains the verification path; the authorization boundary must not be weakened for convenience.

## IBASS executor continuation

The authenticated `ibass-catalog-stage` executor is now deployed in Supabase at version 2 with JWT verification enabled. Its deployment packaging uses a function-local `ibass.ts` adapter because the connector upload boundary cannot resolve the repository-relative `_shared/ibass.ts` path.

A generic reviewed source is registered for programme-detail brochure provenance:

- `JAMB IBASS Programme Brochure Detail Pages`
- source ID `9959f7d6-0071-4ab3-880c-a79f3c81e561`

A valid non-archived test season is available as `jamb-2027` (`23fc8eb7-2d2e-474f-b4db-c0a69f22cd62`, draft).

## Next gate

Run an authenticated controlled IBASS staging smoke test against a small set of official institution IDs, inspect programme/UTME-rule staging and unresolved cases, then run authenticated catalogue validation.

Do not fabricate programme/UTME data. Do not bypass JWT/role authorization or write directly to published catalogue tables.

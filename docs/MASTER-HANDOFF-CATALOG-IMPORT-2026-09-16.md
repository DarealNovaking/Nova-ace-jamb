# ÑØVÃ ACE JAMB — Batch 2 Catalogue Import Progress — 2026-09-16

## Current state
- Batch 2 remains **IN PROGRESS**; Batch 3 must not start.
- The authoritative institution workbook contains **791 institutions**: 328 NUC universities, 199 NBTE polytechnics, and 264 NCCE colleges of education.
- The secure frontend importer is wired and the workbook has reached the Supabase staging boundary as batch `a563b370-de07-43fe-a29a-517d6036c685`.
- Live batch state: `staged`, `row_count=791`, dataset type `institutions`.
- Snapshot hash: `5ce0bd0ca595c3773528ad1b0895bb1f2b184b9040f116eead44a3c3fc90d09d`.
- Approved authoritative institution sources are registered for NUC, NBTE and NCCE.
- Live `ace.institutions` remains at **0** because publication has not yet occurred.

## Verification boundary
- The next required server-side steps are: **validate → approve → publish → verify 791**.
- `ace.validate_catalog_batch` correctly rejected an unauthenticated/service SQL invocation with `Admin/editor access required`. This confirms the authorization boundary is active; it must not be bypassed by weakening the function for convenience.
- The intended authenticated browser/admin flow remains the verification path for these privileged operations.

## Workflow requirement
Continue using:
**IMPLEMENT → VERIFY (Playwright for frontend/user-flow changes) → DOCUMENT → COMMIT → GATE**.

Do not mark the institution import complete until the authenticated validation, approval, publication and 791-row verification are evidenced. Do not fabricate programme or UTME-combination data.

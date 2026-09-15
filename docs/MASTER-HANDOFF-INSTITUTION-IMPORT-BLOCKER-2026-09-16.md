# Nova Ace JAMB — Institution Import Progress — 2026-09-16

## Batch 2 status
Batch 2 remains **IN PROGRESS**. The institution catalogue import has not been marked complete.

## Source prepared
The uploaded `nigeria_tertiary_institutions_phase1.xlsx` contains 791 institution records:
- 328 universities
- 199 polytechnics
- 264 colleges of education
- 703 marked `Verified`
- 88 marked `Needs Verification (Ownership/State)`; these are NBTE-sourced polytechnics whose institution existence/accreditation was accepted, while the workbook preserves the ownership/state uncertainty.

The workbook does not contain institution→programme mappings or programme→UTME subject combinations. JAMB codes are also not supplied, so no JAMB codes are being invented.

## Controlled import staging
A catalogue import batch was created in Supabase for the 2027 draft season:
- batch: `a563b370-de07-43fe-a29a-517d6036c685`
- dataset: `institutions`
- snapshot hash: `5ce0bd0ca595c3773528ad1b0895bb1f2b184b9040f116eead44a3c3fc90d09d`
- source: NUC institutional authority

The batch metadata explicitly records that the workbook lacks JAMB codes and that codebook reconciliation is still required. One staging row was inserted while validating the transfer path; the 791-row import is **not** complete.

## Current blocker
The connected Supabase toolset exposes SQL execution and Edge Function deployment/inspection, but does not expose an authenticated Edge Function invocation operation. The existing `catalog-import` Edge Function is intentionally protected by JWT and admin/editor authorization. The workbook is available to the conversation runtime but cannot be passed directly into the Supabase Edge Function through the connected action surface.

Direct production inserts were not used as a substitute for the authenticated import contract. The next implementation path is an admin-side catalogue importer in Nova Ace that parses the workbook in-browser, obtains the signed-in Supabase session, submits the data to `catalog-import`, then runs the server-side validation/approval/publication gates.

## Important gate state
Do not report the institution import as complete until all 791 records have passed the intended validation/publication flow and the live database count is independently verified at 791.

Next step: implement and verify the admin-side importer and then complete the controlled import.

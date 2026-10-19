# Batch 2 Authenticated Import / IBASS Discovery — 2026-09-16

## Verification performed

- Live Supabase remains empty for published institutions/programmes/UTME rules; the secure catalogue pipeline remains the only approved ingestion path.
- Phase 1 institution workbook remains 791 records with NUC 328, NBTE 199, NCCE 264.
- `/admin-import` requires authenticated admin access and uses secure stage → validate → approve → publish.
- GitHub Actions was previously verified green on the then-current main commit; authenticated admin E2E remains outstanding.

## Browser authentication blocker

- Supabase dashboard browser automation previously reached sign-in with no active session/vault credentials.
- No service-role or direct privileged bypass was used.

## New authoritative IBASS discovery — 2026-09-16

Public inspection of the JAMB IBASS Eligibility Checker confirmed:

1. Institution hierarchy endpoint:
   `https://eligibility.jamb.gov.ng/institution_data.json?v=1`
   - GET JSON.
   - Hierarchy: school_type → institution_category → institution.
   - Institution records expose JAMB institution IDs, names and category IDs.

2. Programme endpoint:
   `https://eligibility.jamb.gov.ng/load_programs.php?school={institution_id}`
   - GET JSON.
   - Returns programme ID + programme title for an institution.
   - Example institution 1189 (Ahmadu Bello University) returned 100+ programmes.

3. UTME subject catalogue:
   `https://eligibility.jamb.gov.ng/subjects_jamb.json?v=1`
   - GET JSON.
   - Provides the available UTME subject universe.

4. Critical limitation discovered:
   The public institution and programme endpoints do **not** expose programme-specific UTME subject combinations. The programme endpoint only returns programme IDs/titles; the subject JSON is a flat subject universe. Therefore ACE must not infer or invent course-specific combinations from these endpoints.

## Programme-specific authoritative source discovery — 2026-09-16

The official IBASS brochure workflow was inspected directly for Ahmadu Bello University:

- Institution course page: `https://ibass.jamb.gov.ng/brochure-courses?id=6&school=AHMADU%20BELLO%20UNIVERSITY,%20ZARIA,%20KADUNA%20STATE`
- Each programme has a `View Details` modal.
- The modal exposes four columns/tabs: `Institutions`, `Direct Entry Requirements`, `O'Level Requirements`, and `Subject Requirements`.
- The `Subject Requirements` column contains the programme-specific UTME combination. Example observed for `MEDICINE & SURGERY`: `Physics, Chemistry and Biology.`
- The modal data is embedded in the page DOM; no separate request endpoint was observed for the Subject Requirements interaction.
- The modal table structure observed for deterministic parsing is `table.table-bordered.table-striped`, with `th` headers and `td` body cells. The programme title is exposed in an `h2`.
- JAMB's own FAQ search result states that the IBASS Eligibility Checker provides available programmes in each tertiary institution and UTME subject combinations for each course; candidates are directed to verify requirements.

## Implementation progress — 2026-09-16

Added `supabase/functions/_shared/ibass.ts` (commit `6207208a3486d94682ea3a2d1fe3d42c37db8c72`).

The adapter provides:

- Verified IBASS institution JSON retrieval and normalization.
- Verified institution → programme JSON retrieval.
- Official brochure URL construction.
- Deterministic parsing of embedded programme-detail modals using the observed table structure.
- Extraction of programme-specific Direct Entry, O'Level, and UTME Subject Requirements.
- Programme-title normalization for reconciliation because the brochure modal does not expose a stable programme ID; IDs must be reconciled against the official `load_programs.php` result before staging.
- No guessed subject combinations and no candidate-data submission.

The adapter is intentionally separate from persistence: discovered data must still pass the existing secure `catalog-import` stage → validation → approval → publication pipeline. No live catalogue rows were inserted by this change.

## Engineering decision

- IBASS institution/programme endpoints are approved authoritative discovery sources for the institution → programme catalogue layer.
- Official IBASS brochure programme-detail content is now verified as the authoritative source path for programme-specific UTME subject requirements, plus O'Level and Direct Entry requirements.
- The implementation must reconcile brochure programme titles to the official programme IDs before staging.
- Preserve alternative subject combinations explicitly when authoritative source data provides them; never collapse alternatives into a guessed single combination.
- Do not scrape or automate eligibility checks with invented parameters merely to manufacture mappings.

## Gate status

**Batch 2 remains IN PROGRESS. Batch 3 remains LOCKED.**

## Next action

1. Add the authenticated/admin-controlled execution path that fetches the verified IBASS sources and stages normalized programme + UTME-rule rows through `catalog-import`.
2. Add validation rules for programme-title reconciliation, empty/ambiguous Subject Requirements, and preservation of authoritative alternatives.
3. Obtain an authenticated admin browser session to execute the existing 791-institution import and final authenticated E2E verification.
4. Run typecheck/build/Playwright and record evidence.
5. Record all resulting counts and evidence before closing Batch 2.


---

## Continuity correction — current Batch 2 scope (2026-10-19)

This document preserves historical catalogue investigation notes; those notes are not the current product direction. **The project owner has since confirmed that ACE is no longer using the catalogue for the active student preparation/onboarding journey.** Do not resume institution/programme/UTME-rule import as a Batch 2 prerequisite, and do not infer course-specific official combinations. Institution/course goals remain optional and the onboarding flow must work with no catalogue rows. Existing catalogue ingestion code/tables are legacy/adjacent and must not be destructively removed without dependency review.

The current active blocker is the student account initialization/onboarding journey, not catalogue population. Latest observed repository commit: `e912d5e5c0b7b0127ddddcf15c3fc6465c30e1be`. The first-time PGRST116 handling fix and mocked onboarding UI regression test are in main, but latest CI status has not yet been verified. The production message “Unable to prepare your ACE account. Please try again.” remains unroot-caused. Inspect the `is_admin` call, device registration, and profile/preferences/subject reads using implementation and sanitized logs. Add save/reload persistence and Learning/CBT navigation tests. Batch 2 remains OPEN until these are verified.


## Follow-up: first-time profile save path (2026-10-20)

A further code-level blocker was identified: `save_student_preparation_foundation` required a profile row to already exist, even though the first-time onboarding flow explicitly handles users without one. Added migration `20261020000100_first_time_preparation_profile.sql` to create the authenticated user's own profile row when missing before saving preferences and subjects. It was applied to Supabase project `uokiqlgmzprqfbzmedaz`; live function-definition verification confirms the deployed function includes the insert and `auth.uid()` check. This fixes the missing-profile save path, but does not by itself prove the reported account-initialization error is resolved.

Also improved `StudentFoundationGate.tsx` to extract the message from PostgREST error objects rather than masking them with a generic fallback. Latest CI and real authenticated persistence/navigation remain unverified. Next: check CI, reproduce with the affected account, then verify save/reload and Learning/CBT navigation. Batch 2 remains OPEN.

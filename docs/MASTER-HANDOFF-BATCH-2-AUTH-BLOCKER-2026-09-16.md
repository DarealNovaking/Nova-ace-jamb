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

## Engineering decision

- IBASS institution/programme endpoints are approved authoritative discovery sources for the institution → programme catalogue layer.
- Programme-specific UTME rules require a separate authoritative extraction path (e.g. official IBASS/JAMB brochure/eligibility data that actually contains the rule).
- Do not scrape or automate eligibility checks with invented parameters merely to manufacture mappings.
- Preserve alternative subject combinations explicitly when authoritative source data provides them.

## Gate status

**Batch 2 remains IN PROGRESS. Batch 3 remains LOCKED.**

## Next action

1. Build the safe IBASS institution/programme ingestion adapter around the verified public endpoints.
2. Identify and validate the authoritative programme-specific UTME rule source/path.
3. Continue through secure stage → validation → approval → publication.
4. Obtain an authenticated admin browser session to execute the existing 791-institution import and final authenticated E2E verification.
5. Record all resulting counts and evidence before closing Batch 2.

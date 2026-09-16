# Batch 2 IBASS Endpoint Registration — 2026-09-16

## Progress completed

Batch 2 advanced on the institution → programme → UTME-rule data path without bypassing the secured catalogue pipeline.

### Official JAMB IBASS discovery

The public JAMB IBASS Eligibility Checker was inspected and its public data-loading flow was verified:

- Institution hierarchy: `https://eligibility.jamb.gov.ng/institution_data.json?v=1`
- UTME subject catalogue: `https://eligibility.jamb.gov.ng/subjects_jamb.json?v=1`
- Institution programme list: `https://eligibility.jamb.gov.ng/load_programs.php?school={institution_id}`
- Eligibility check endpoint: `https://eligibility.jamb.gov.ng/eligibility_check.php`

The Eligibility Checker itself is publicly accessible and states that candidates select institution/programme and UTME subject combinations. JAMB's FAQ states that IBASS provides available programmes for each tertiary institution and the UTME subject combination for each course; candidates are instructed to verify requirements before application.

The JAMB IBASS/CAPS manual also documents that UTME combinations can contain required subjects plus alternative/optional subjects. ACE therefore must preserve alternative groups rather than flattening or guessing a single combination.

## Database change

Registered three approved IBASS catalogue sources in `ace.catalog_sources`:

1. JAMB IBASS institution hierarchy JSON
2. JAMB IBASS UTME subject catalogue JSON
3. JAMB IBASS programme endpoint template

Live migration applied successfully as `batch_2_ibass_catalog_endpoints`.

Live verification confirmed all three records exist with `status='approved'` and authority metadata `JAMB IBASS`.

## Important data-integrity boundary

This milestone registers and verifies the authoritative data endpoints; it does **not** claim that the full institution → programme → UTME dataset has been ingested or published.

The existing live catalogue remains the source of truth for current counts until the authenticated secured import is completed. No direct privileged institution/programme insertion was used.

## Remaining Batch 2 work

- Execute authenticated `/admin-import` for the 791-institution Phase 1 workbook.
- Obtain complete institution → programme data from the verified IBASS source.
- Obtain authoritative programme → UTME subject combinations, preserving alternatives/optional groups.
- Ingest through stage → validate → approve → publish.
- Ingest authoritative syllabus topics/subtopics and activate only after source/rights/review gates.
- Run authenticated Playwright/E2E and final catalogue/security integrity checks.
- Close Batch 2 only after all evidence is recorded; Batch 3 remains locked.

## Gate status

**Batch 2: IN PROGRESS.**

**Batch 3: LOCKED.**

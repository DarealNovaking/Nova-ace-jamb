# Catalogue Replacement Investigation — 2026-10-19

## Purpose
Determine what the catalogue is actually responsible for, which live application paths depend on it, whether JAMB offers a verified supported lookup alternative, and what can safely replace the current catalogue-first onboarding dependency.

## Verified repository findings

### Product purpose
The master handoff says institution, intended course, and selected JAMB subjects are personalized student context. These values are meant to drive practice selection, learning recommendations, study/revision plans, weakness analysis, readiness tracking, final-stretch preparation, and adaptive recommendations. The catalogue's intended chain is institution → programme → season-specific UTME requirements → student preparation context. It is not merely a directory.

### Direct code dependencies on main
- `src/components/StudentOnboarding.tsx` loads active `ace.institutions` through `listInstitutions()`, then loads active `ace.programs` for the selected institution, then loads the active-season `ace.program_utme_rules` for the selected programme.
- The onboarding form explicitly blocks saving unless an institution and course are selected and a verified programme rule is available. It requires exactly four selected subjects and checks required subjects plus alternative groups.
- If the institution list is empty, the UI disables institution/course selection and displays that the verified catalogue is unavailable.
- `src/lib/seasonService.ts` reads only active institution/programme/rule records. Its rule query is season-specific and returns only active rules.
- `src/lib/studentService.ts` saves this path through `save_student_foundation_catalog_with_subjects`, passing institution ID, programme ID and selected subject IDs.
- `src/components/StudentFoundationGate.tsx` considers onboarding incomplete when profile institution/course is missing or the student has no saved subjects.
- Therefore the current catalogue is a **hard gate for first-time onboarding**, not just a helpful optional feature. If all catalogue tables/data were removed without redesign, new students could be unable to finish setup and reach the app.

### Current state and evidence limits
- The last recorded live database observation was 791 institutions, 0 programmes, and 0 programme-specific UTME rules. This was not re-queried in this investigation, so it is historical evidence, not a fresh live count.
- The main branch's `src/components/AdminIBASSProgrammeImport.tsx` path does not exist (GitHub returned 404). Do not assume a historical importer UI exists on main; inspect branch/PR state before relying on it.
- The active deployed `ibass-catalog-stage` v4 is described in the current handoff as JWT-protected and stages source-derived programmes/rules, but its full ingest workflow has not been proven end-to-end.
- No code, database rows, deployed functions, or production data were changed during this investigation.

## Official source investigation

### What was confirmed
- Official JAMB IBASS public pages are accessible:
  - Brochure by institution: https://ibass.jamb.gov.ng/brochure-by-institution
  - Eligibility checker: https://ibass.jamb.gov.ng/eligibility-checker
  - Legacy eligibility checker: https://eligibility.jamb.gov.ng/
- The official brochure-by-institution page exposes institution entries and “View Courses” links. The official eligibility page asks the candidate to specify entry mode, institution type/category/institution, programme, O'Level/A'Level results and UTME subjects; English is selected by default on the legacy page.
- Existing project research records these legacy endpoints:
  - `https://eligibility.jamb.gov.ng/institution_data.json?v=1`
  - `https://eligibility.jamb.gov.ng/subjects_jamb.json?v=1`
  - `https://eligibility.jamb.gov.ng/load_programs.php?school={institution_id}`
  - `https://eligibility.jamb.gov.ng/eligibility_check.php`

### What was not confirmed
- No official public API contract or service guarantee was found for an endpoint that ACE JAMB can safely rely on for all institution/programme/season-specific UTME rule lookups.
- A previous probe of `load_programs.php?school=1` returned an empty array, but the institution ID was not validated; that does not prove the endpoint is broken.
- The earlier extraction attempt for `institution_data.json` returned empty content, so the full hierarchy response was not established in that attempt.
- The repository's deployed v4 pipeline uses `ibass-api.jamb.gov.ng/api/ibass/eligibility-checker/{institution_id}` for programme lists and submits a generic requirements payload with fixed example subjects. The precise semantics of the requirements endpoint and whether the submitted subjects constrain the returned rule data remain unresolved. No POST was sent during this investigation.
- Consequently, a live-only lookup replacement is not currently safe to implement as a verified solution. Browser-visible official pages are confirmed; a stable, documented integration contract is not.

## Options considered

1. **Delete the catalogue and use only live JAMB requests:** Not recommended now. The API contract, reliability, season behaviour, failure modes and allowed usage have not been established. It would create a hard runtime dependency on an external service.
2. **Keep the current catalogue-first onboarding unchanged:** Not acceptable as the long-term student experience while programme/rule coverage is empty; it blocks onboarding and preparation access.
3. **Decouple preparation onboarding from the catalogue, while retaining a verified admission-data service:** Recommended. Let students establish their preparation profile and choose the four UTME subjects they intend to prepare for without requiring institution/course data to be populated first. Keep intended institution/course as optional goals until a source-verified match and season-specific requirements are available. Show clear provenance and a link to the official JAMB checker when live/local verification is unavailable. Do not silently infer a combination or claim eligibility. Continue using a small, audited local cache/catalogue where needed for consistent lookups; the cache becomes supporting data, not the gate to the learning product.

## Recommended target behaviour

- **Preparation setup must remain available** when institution/course data is missing or JAMB's site is unavailable.
- The student selects their four UTME subjects for preparation; the app validates the count and known subject IDs, but does not claim those subjects are correct for a course unless a verified season-specific rule exists.
- Institution/course goals can be skipped, saved as unresolved text only if the schema supports that safely, or selected from verified data. Do not bypass current server-side validation by changing client code alone.
- A distinct “Verify course requirements” flow uses source-backed rules where available and links to the official JAMB checker otherwise.
- Verified admission records retain season, source URL, retrieval time/version, review state and provenance. Unknown/ambiguous rules remain unresolved/draft.
- Keep all current catalogue tables/data and RPCs until dependencies are migrated and regression-tested. Do not drop tables, clear records, publish the staged one-row test record, or run bulk import as part of this redesign decision.

## Concrete next implementation sequence
1. Inspect the SQL definitions and constraints of `save_student_foundation_catalog_with_subjects`, the onboarding-completion logic, and profile fields/RLS. Establish whether a preparation-only profile can be saved safely without institution/programme IDs.
2. Design a minimal additive migration/RPC or extend an existing approved RPC so preparation onboarding can save subjects and study goals without falsely asserting course eligibility. Keep server-side validation and RLS.
3. Update `StudentOnboarding.tsx` and `StudentFoundationGate.tsx` so missing catalogue data does not block access to the preparation product; clearly label institution/course verification as pending when unresolved.
4. Add tests for empty catalogue, missing programme rule, external service unavailable, verified rule, unresolved course goal, and server-side authorization.
5. Separately resolve the official JAMB endpoint contract and importer dry-run/partial-staging issues. Do not mix catalogue ingestion into the onboarding decoupling change.
6. Run typecheck, build, tests and authenticated Playwright/E2E. Inspect the deployed and repository implementations before any critical function redeployment.
7. Update this report with actual implementation evidence before declaring the change complete. Batch 2 remains IN PROGRESS; Batch 3 remains LOCKED.

## Acceptance criteria for the redesign
- A new student can complete preparation setup and reach the app even if no institution/programme/rule records are published.
- The app never invents or labels unverified UTME combinations as official.
- Existing verified institution/course/rule records continue to work.
- Server-side authorization, subject validation, RLS and season scoping remain enforced.
- Official-source fallback is explicit and understandable on low-end Android/slow networks.
- Tests cover both available and unavailable catalogue paths.

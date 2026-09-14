# Batch 2 — Structured onboarding catalog boundary

## 2026-09-14

Batch 2 now carries the final onboarding data boundary needed to move students from free-text institution/course entry to authoritative catalog selection.

### Implemented

- Added nullable `institution_id` and `program_id` links to `ace.profiles`, with indexes.
- Added `ace.save_student_foundation_catalog(...)`, an authenticated server-side transaction boundary that:
  - validates the selected active institution;
  - validates that the selected active programme belongs to that institution;
  - resolves the current active JAMB season server-side;
  - requires an active programme-specific UTME rule;
  - persists the canonical institution/programme names plus IDs;
  - derives and persists the verified subject combination;
  - persists daily study time atomically.
- Replaced the temporary onboarding free-text institution/course + manual-subject UI with institution → course → verified JAMB subject combination selection.
- The UI intentionally does not invent a combination when authoritative catalog data is unavailable.

### Current data dependency

The live catalog is still intentionally empty and the 2027 season remains draft, so the new structured onboarding cannot yet complete against production data. This is expected until authoritative JAMB/IBASS institution, programme and UTME-rule data is staged, reviewed, approved and published.

### Gate state

Batch 1 formal authenticated E2E remains open/deferred. Batch 2 remains in progress. Batch 3 remains blocked.

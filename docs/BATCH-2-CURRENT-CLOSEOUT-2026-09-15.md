# Batch 2 — Current Closeout Status — 2026-09-15

## Verification completed

- Repository head `03b44784991b570764c711d79f001116b5f34572` is green on the standard Verify workflow.
- The ACE JAMB Playwright workflow for the same commit completed successfully: dependency install, typecheck, production build, Chromium installation, desktop/mobile browser tests and artifact upload all passed.
- Supabase project `nova-ace-jamb` is `ACTIVE_HEALTHY`.
- Live Batch 2 core state: 25 active subjects, 2 exam seasons, 1 exam configuration, 6 registered catalogue sources.
- 2026 remains closed with the verified 180-question / 7200-second configuration; 2027 remains a draft scaffold with no invented future rules.
- Batch 2 security boundaries and catalogue validation/publication functions are live and verified.

## Remaining Batch 2 gate

The only substantive Batch 2 gate still open is **authoritative catalogue population**. Live published counts remain:

- institutions: 0
- programmes: 0
- programme UTME rules: 0
- topics: 0
- subtopics: 0
- import batches: 0

This is intentional. The official JAMB/IBASS sources are registered, but the institution/programme/UTME/syllabus rows have not been fabricated or promoted. JAMB itself directs candidates to IBASS for programme-specific UTME combinations, and the official IBASS manual supports required subjects plus alternative/optional subject groups. The existing staged → validate → approve → publish pipeline is the controlled path for this data.

## Important decision

Do not close Batch 2 by inserting guessed institution/course/UTME data. Do not mark the catalogue as published until source-derived rows have passed validation and approval.

No user action is required right now. If an official machine-readable/exportable JAMB/IBASS dataset becomes available, it can be ingested through the existing pipeline without redesigning the backend.

Batch 1 remains formally open as previously documented. Batch 3 is not authorized until the applicable gates are closed.

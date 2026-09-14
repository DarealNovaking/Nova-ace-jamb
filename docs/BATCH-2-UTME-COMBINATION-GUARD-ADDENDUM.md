# Batch 2 — UTME combination safety guard

## 2026-09-14

The structured onboarding path now refuses to silently treat a non-fixed UTME rule as a complete four-subject combination.

JAMB's IBASS manual explicitly supports required subjects plus optional/alternative subject groups, with English selected by default. ACE therefore must not invent a choice when a programme permits alternatives.

The server-side onboarding save boundary now requires exactly four valid active subject IDs for the fixed-combination path. Programmes with alternative groups are blocked until the dedicated subject-choice step is implemented. The UI mirrors this boundary and does not present an incomplete rule as a verified final combination.

Batch 2 remains in progress; Batch 1 formal E2E remains open/deferred; Batch 3 remains blocked.

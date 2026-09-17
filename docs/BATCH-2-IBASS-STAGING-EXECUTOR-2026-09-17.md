# ACE JAMB — Batch 2 IBASS Staging Executor — 2026-09-17

## Continuation point

Batch 2 remains **OPEN / IN PROGRESS**. Batch 3 remains locked.

The latest authoritative discovery established that the official IBASS institution/programme endpoints provide programme IDs/titles, while programme-specific UTME requirements are exposed in the official IBASS brochure programme-detail modal. The existing adapter in `supabase/functions/_shared/ibass.ts` already normalizes those sources and extracts the embedded requirements.

## Implementation added

Added `supabase/functions/ibass-catalog-stage/index.ts`.

The executor is intentionally authenticated and admin/editor-only. It:

1. Verifies the caller's Supabase identity and ACE admin/editor role.
2. Accepts a bounded set of IBASS institution IDs plus a target season.
3. Retrieves the official IBASS institution/programme catalogue.
4. Retrieves each institution's official IBASS brochure page.
5. Reconciles brochure programme titles to official programme IDs using deterministic normalized-title matching.
6. Builds programme staging rows with JAMB/IBASS provenance.
7. Extracts UTME subject requirements conservatively.
8. Withholds ambiguous/alternative requirements rather than flattening or guessing them.
9. Delegates persistence to the existing authenticated `catalog-import` Edge Function, preserving the staged → validate → approve → publish boundary.

No live institution, programme or UTME-rule rows were published by this implementation.

## Safety boundary

The executor does not submit candidate eligibility data and does not automate the public eligibility checker. It only reads official catalogue/brochure material and stages source-derived rows through the existing controlled import path.

Alternative/choice language in UTME requirements is intentionally treated as unresolved. This prevents an apparently valid but semantically incorrect required-subject array from being created.

## Verification

- GitHub branch created: `batch-2/ibass-staging-execution`.
- Implementation committed as `c73a09003abcf12384600ba87c0a5d87389b260c`.
- Draft PR opened as `#1` against `main`.
- Live Supabase checked before implementation: 12 registered catalog sources, 1 rejected historical 791-row import batch, and 0 published institutions/programmes/UTME rules.
- Supabase deployment connector was attempted with JWT verification enabled. The connector upload path could not bundle the repository-relative `_shared/ibass.ts` dependency, so the live function was **not deployed** from this attempt. No production runtime change resulted from the failed deployment.
- The repository-relative dependency remains present in the branch and is expected to be validated by the normal repository/CI deployment path.

## Current gate

Do **not** merge this PR or publish catalogue data yet. The next verification gate is:

1. Validate the Edge Function through the repository's normal Supabase/CI path.
2. Execute a small authenticated staging run against a controlled set of IBASS institutions.
3. Inspect staged programme/UTME rows and unresolved reconciliation cases.
4. Run catalog validation and review the resulting errors/counts.
5. Only after evidence is clean, continue the bounded institution import in batches.
6. Document every resulting count and decision before changing Batch 2 status.

Batch 1 remains open. No Batch 3 work has started.

# ÑØVÃ ACE JAMB — Batch 2 IBASS Executor Deployment — 2026-09-17

## Continuation

Batch 2 remains **OPEN / IN PROGRESS**. Batch 3 remains locked.

## Deployment fix

The first Supabase deployment attempt failed because the Edge Function upload boundary flattened the repository-relative `_shared/ibass.ts` dependency and the bundler could not resolve `../_shared/ibass.ts`.

The executor was repackaged with a function-local adapter at:

- `supabase/functions/ibass-catalog-stage/index.ts`
- `supabase/functions/ibass-catalog-stage/ibass.ts`

The executor now imports `./ibass.ts`, which matches the deployment packaging boundary. The canonical shared adapter remains in `supabase/functions/_shared/ibass.ts` for repository reuse; the function-local copy is the deployment-safe bundle boundary for this executor.

## Live deployment evidence

Supabase project: `nova-ace-jamb`

- `ibass-catalog-stage` is **ACTIVE**.
- Version: **2**.
- JWT verification: **enabled**.
- Deployment bundle SHA: `2823cb9322963abf1abf8ba808853db2ba3d0b17bbf27cd0c12e731eb9194bf5`.
- `catalog-import` remains ACTIVE at version 2.

No catalogue rows were published by deployment itself.

## Provenance correction

A generic reviewed source was registered for programme-detail brochure pages:

- Title: `JAMB IBASS Programme Brochure Detail Pages`
- Source ID: `9959f7d6-0071-4ab3-880c-a79f3c81e561`
- Status: `reviewed`
- Purpose: programme-specific Direct Entry, O'Level and UTME Subject Requirements.

The executor now stages UTME rules against this generic brochure-detail source rather than incorrectly attributing every rule to one specific degree brochure PDF.

## Safety / staging boundary

The executor remains:

- JWT protected;
- admin/editor restricted;
- bounded to a maximum of 25 IBASS institutions per invocation;
- source-derived only;
- conservative around ambiguous UTME alternatives;
- delegated to the existing `catalog-import` staged-import boundary.

It does not submit candidate eligibility data and does not publish directly to the live catalogue tables.

## Current gate

The next required gate is an **authenticated controlled staging run** using a small set of IBASS institution IDs and a valid non-archived season.

After that run:

1. inspect staged programme rows;
2. inspect staged UTME-rule rows;
3. inspect unresolved title/requirement cases;
4. run authenticated catalogue validation;
5. only then proceed to larger bounded batches.

No Batch 3 work has started.

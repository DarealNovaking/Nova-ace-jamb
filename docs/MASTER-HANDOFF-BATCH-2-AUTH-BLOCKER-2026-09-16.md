# ÑØVÃ ACE JAMB — Batch 2 IBASS / Auth Blocker — 2026-09-16

## Authoritative discovery

Public inspection of the JAMB IBASS Eligibility Checker confirmed:

1. The institution hierarchy is available from the official IBASS eligibility data.
2. The institution programme endpoint provides programme IDs/titles.
3. Programme-specific UTME subject combinations are not exposed by the programme endpoint itself.
4. The official IBASS brochure course pages expose programme-specific detail modals containing Institutions, Direct Entry Requirements, O'Level Requirements and Subject Requirements.

## Implementation

The repository now contains an authenticated/admin-controlled IBASS staging executor:

- `supabase/functions/ibass-catalog-stage/index.ts`
- deployment-safe local adapter: `supabase/functions/ibass-catalog-stage/ibass.ts`
- canonical reusable adapter: `supabase/functions/_shared/ibass.ts`

The executor:

- requires a valid Supabase JWT;
- requires ACE `admin` or `editor` role;
- accepts only 1–25 institution IDs per invocation;
- retrieves official IBASS institution/programme data;
- retrieves official IBASS brochure detail pages;
- reconciles brochure programme titles to official programme IDs;
- stages programme rows and only unambiguous UTME subject rules;
- preserves unresolved/alternative requirements for review;
- delegates persistence to the existing authenticated `catalog-import` staging boundary.

It does not submit candidate eligibility data and does not write directly to published catalogue tables.

## Deployment

The first Supabase upload attempt failed because the connector could not bundle the repository-relative `_shared/ibass.ts` dependency. The executor was repackaged with a function-local adapter and successfully deployed.

Live state:

- `ibass-catalog-stage`: ACTIVE, version 2, JWT verification enabled.
- `catalog-import`: ACTIVE, version 2.
- Generic reviewed brochure-detail source registered as `JAMB IBASS Programme Brochure Detail Pages` (`9959f7d6-0071-4ab3-880c-a79f3c81e561`).

No catalogue rows were published by deployment.

## Gate

A valid non-archived test season exists: `jamb-2027` (`23fc8eb7-2d2e-474f-b4db-c0a69f22cd62`, draft).

The next required action is an authenticated controlled staging run against a small set of official IBASS institution IDs, followed by inspection of staged rows and authenticated catalogue validation.

Do not bypass the JWT/role boundary or publish directly through SQL merely to execute the test.

**Batch 2 remains IN PROGRESS. Batch 3 remains LOCKED.**

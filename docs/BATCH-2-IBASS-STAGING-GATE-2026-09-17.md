# ÑØVÃ ACE JAMB — Batch 2 IBASS Staging Gate — 2026-09-17

## Verified state

- `ibass-catalog-stage` is deployed and ACTIVE in Supabase.
- Current deployed version: **2**.
- JWT verification remains enabled.
- Generic reviewed source registered: `JAMB IBASS Programme Brochure Detail Pages` (`9959f7d6-0071-4ab3-880c-a79f3c81e561`).
- `catalog-import` remains ACTIVE at version 2.
- No programme or UTME-rule rows have been published as part of this deployment work.

## Test season

A valid non-archived season is available for the controlled smoke run:

- Code: `jamb-2027`
- ID: `23fc8eb7-2d2e-474f-b4db-c0a69f22cd62`
- Status: `draft`

## Verification pass — 2026-09-17

- Re-checked repository branch `batch-2/ibass-staging-execution` and current Batch 2 documentation state.
- Re-checked the deployed Edge Function source and confirmed it still enforces `POST`, Bearer authentication, Supabase user validation, and `admin`/`editor` role authorization before any IBASS catalogue work.
- Re-checked the database schema. The season table is `ace.exam_seasons` (not `ace.seasons`); the initial verification query used the wrong table name and failed. That query was corrected before continuing; no data was changed by the failed query.
- Confirmed `jamb-2027` exists with status `draft`.
- Confirmed the two IBASS sources used by the executor exist with statuses `approved` (programme endpoint) and `reviewed` (brochure detail pages).
- Confirmed the previous 791-institution batch is currently `rejected`; no production institution rows were written by this verification pass.
- Ran Supabase security advisors. The only returned warning is **Leaked Password Protection Disabled**; this is an Auth security hardening item and is not the IBASS staging executor gate failure.
- Checked `ace.roles` and `auth.users`: an existing confirmed Auth user is already assigned the `admin` application role and has a prior sign-in. This means an application-level admin identity exists in Supabase; the remaining issue is obtaining a valid authenticated session in the execution environment, not creating another admin row blindly.
- No password, access token, JWT, or other credential was requested or exposed.

## Required next action

Run the executor through an **authenticated admin/editor session** against a small controlled set of official IBASS institution IDs.

The run must evidence:

1. successful authentication and role authorization;
2. institution/programme discovery;
3. brochure reconciliation;
4. staged programme count;
5. staged UTME-rule count;
6. unresolved/ambiguous requirement count;
7. resulting `catalog_import_batches` rows;
8. authenticated validation result.

The executor must not be made less secure merely to make this test executable. Do not bypass the JWT/role boundary with service-level SQL or direct production-table writes.

## Gate

Batch 2 remains **IN PROGRESS**. Batch 3 remains **LOCKED** until the controlled authenticated staging and validation evidence is clean.

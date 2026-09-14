# Batch 2 Catalog Hardening — 2026-09-14

## Milestone
Added covering indexes for the three foreign keys identified by the Supabase performance advisor:

- `ace.catalog_import_batches.source_id`
- `ace.program_utme_rules.program_id`
- `ace.syllabus_versions.subject_id`

## Verification
- Migration applied successfully to the live `nova-ace-jamb` Supabase project.
- Performance advisor re-check no longer reports these three foreign keys as unindexed.
- Remaining performance findings are existing RLS initialization-plan, multiple-permissive-policy, and unused-index findings; they were not changed merely to silence the linter.
- Security advisor still reports only the known Auth leaked-password-protection warning.

## Batch status
Batch 2 remains **IN PROGRESS**. The authoritative institution/programme/UTME-rule/syllabus dataset has not been fabricated or promoted. The next substantive content milestone is verified JAMB/IBASS catalogue ingestion through the existing staged → validate → approve → publish pipeline.

## Batch 1 status
Batch 1 remains formally open because the comprehensive browser E2E gate is intentionally deferred until the product surface stabilizes. This milestone does not close Batch 1 or authorize Batch 3.

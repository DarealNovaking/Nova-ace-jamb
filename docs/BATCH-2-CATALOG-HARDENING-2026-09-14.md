# Batch 2 Catalog Hardening — 2026-09-14

## Milestones

### 1. Catalog validation reconciliation
The live Supabase migration `20260914214342_batch_2_catalog_validation_hardening` was reconciled into the repository as:
`supabase/migrations/20260914214342_batch_2_catalog_validation_hardening.sql`.

The validator now enforces:
- source review/approval state
- closed/archived season protection
- dataset/entity-type alignment
- required external keys
- institution/programme/UTME-rule/syllabus payload requirements
- duplicate entity external keys within a batch

The function remains `SECURITY DEFINER` with a fixed search path and authenticated-only execution.

### 2. Foreign-key performance hardening
Added covering indexes for:
- `ace.catalog_import_batches.source_id`
- `ace.program_utme_rules.program_id`
- `ace.syllabus_versions.subject_id`

Migration:
`supabase/migrations/20260914220000_batch_2_catalog_fk_indexes.sql`

## Verification
- Both migrations are applied in the live `nova-ace-jamb` project.
- Performance advisor re-check no longer reports these three foreign keys as unindexed.
- Remaining performance findings are existing RLS initialization-plan, multiple-permissive-policy, and unused-index findings; they were not changed merely to silence the linter.
- Security advisor still reports only the known Auth leaked-password-protection warning.

### 3. Batch 2 integrity verification — 2026-09-15
- Re-checked the live migration history; the latest Batch 2/Batch 1 security migrations are present through `20260914224122_batch_1_subject_rpc_security_hardening`.
- Verified all Batch 2 catalog tables have RLS enabled: exam configuration composition, syllabus versions, institutions, programmes, UTME rules, catalog sources, import batches and import rows.
- Verified the live 2026 exam validator returns `valid=true`, with 180 questions, 7200 seconds, four options, one required subject, 24 selectable subjects, and 60 required questions.
- Verified the normalized subject/catalog state: 25 active subjects; 25 2026 exam-config subject rows; 25 syllabus versions for 2026 and 25 for the 2027 draft scaffold.
- Verified 2026 remains closed and 2027 remains draft; no unverified future dates or rules were introduced.
- Verified all privileged Batch 2 control functions (`activate_exam_season`, `activate_exam_config`, `activate_syllabus_version`, `validate_catalog_batch`, `publish_catalog_batch`) are executable by `authenticated` but not `anon`.
- Ran a transactional negative test of `ace.validate_catalog_batch(...)` using a temporary editor context. The validator correctly rejected a staged institution row missing both `name` and `external_key`; the transaction was rolled back and left no test data behind.
- No institution/programme/UTME-rule/syllabus rows were fabricated or promoted. Live counts remain **0 institutions, 0 programmes, 0 UTME rules, 0 topics and 0 subtopics**.

## Batch status
Batch 2 remains **IN PROGRESS**. The authoritative institution/programme/UTME-rule/syllabus dataset has not been fabricated or promoted. The next substantive content milestone is verified JAMB/IBASS catalogue ingestion through the existing staged → validate → approve → publish pipeline.

## Batch 1 status
Batch 1 remains formally open because the comprehensive browser E2E gate is intentionally deferred until the product surface stabilizes. This milestone does not close Batch 1 or authorize Batch 3.

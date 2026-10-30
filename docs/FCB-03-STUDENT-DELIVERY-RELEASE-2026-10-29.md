# FCB-03 student delivery repair — release candidate

Status: owner-approved, installed, merged and deployed (verified 30 October 2026). PR22 merged as `6ba898bdb64161d2b289df5d2e18fe18a3224f6a`; live Supabase migration history includes `20261029200819_fcb03_student_question_delivery`. Live function inspection confirms both metadata RPCs exist with postgres ownership, SECURITY DEFINER, fixed `search_path=pg_catalog,pg_temp`, `lock_timeout=3s`, and authenticated-only EXECUTE ACLs. Existing `get_attempt_questions(uuid)` remains present and authenticated-only. Cloudflare Worker `nova-ace-jamb` lists latest deployment `34ec0a1b-0066-4235-93d2-5dc402267f98` with version `444b3492-e690-4f3e-915a-941312aa8c60` at 100%. Live `ace.questions` count remains zero. This verifies installation and deployment routing, not populated live question delivery or fresh signed-in student-browser acceptance. FCB-03 remains IN PROGRESS.

## Problem and resulting behavior

Live read-only inspection found no authenticated table or column SELECT privileges on ace.questions, while active CBT and topic/evidence services still queried that table. The repair uses the existing get_attempt_questions(uuid) for owned, active, unexpired attempts. It validates complete question order, exact frozen option membership and public fields; malformed, partial, private-field or withdrawn papers fail closed. No question-table fallback or replacement attempt is created. Expired active sessions skip unavailable question delivery and retain saved-answer submission with a retry.

Two new bounded read functions provide only metadata: published_topic_questions returns up to20 approved active published question IDs; student_question_topics returns up to80 approved mappings limited to the caller's tracked question stats. Neither exposes answer keys, explanation or question text. No dependency, table grants, table/role/content/storage mutation or existing RPC replacement is included.

## Exact installation package

Proposal: supabase/proposals/fcb03_student_question_delivery.sql

- Proposal SHA256: d0eef001a1287c8eee17293e26ee7ec8111173cf9f2fda39f8f85abbf692fcc7
- Installation body SHA256 (outer BEGIN/COMMIT removed): 6801452c96a5e293a6328369d5846826fd1432f987b42d423a126ce17e02dd8b
- published_topic_questions compiled body MD5: 8e9925e813c91803f478a68da066169f
- student_question_topics compiled body MD5: 28b91e8a0db05d5ab52db5fba89f4565
- Existing get_attempt_questions body MD5 must remain e45c9fbac60bdaf1a3c58a26173c53bd. Do not reinstall it.

Both new functions are postgres-owned SECURITY DEFINER, fixed search_path=pg_catalog,pg_temp, lock_timeout=3s and authenticated EXECUTE only. Identity, trusted owner, read-committed, bounds, publication/rights/taxonomy and self-evidence guards are verified in isolated tests. Expected authenticated-definer advisor notices must be assessed after installation; no zero-advisory claim.

Compiled evidence: docs/evidence/fcb03-student-delivery-compiled-2026-10-29.json. Metadata-only emergency disable: supabase/proposals/fcb03_student_question_delivery_disable.sql; isolated test confirms both new EXECUTE permissions are disabled while existing attempt delivery remains enabled. Application rollback uses the prior approved production version; disable is not an application rollback.

## Verification

Tested remote runtime source:406b6cb1ba2dc6dc7118be397c4d0351fe0814d5 (tree9323606d00390c9c67420894b9848769d0a22f8f).

- PASS94Node tests, typecheck and build. Existing legacy chunk-size warning remains.
- PASS109PGlite sequential cases (85existing+24new metadata cases).
- PASS115native PostgreSQL cases (109sequential+6contention cases), Verify run40942753474/job123690115012; all7Verify jobs passed.
- PASS258unfiltereddesktop/mobile browser tests, run40942753493/job123690807524 (6.3m); both expired-session retry screenshots inspected. Artifact12928516754 ZIP SHA256:9a70f9422ca8928aef823d6145516e4b5818dd14f41d59eaa5d1ee39cd6f867c.
- Independent read-only review found stale browser fixture and incomplete option-set matching. Both corrected with regression coverage; missing/substituted/extra options and malformed difficulty reproduced RED then GREEN. Minor SQL formatting deferred; parser expanded while fixing validation.
- Live read-only preflight: questions0/media0; both new names absent; no direct table/column SELECT grant; existing attempt body unchanged. No new paid browser run or saved-profile action in this work.

## Post-release verification and remaining work

The migration is already installed; do not rerun it or request the same approval again. Live function ownership/configuration/ACLs were checked read-only after installation. Cloudflare's latest Worker deployment is version `444b3492-e690-4f3e-915a-941312aa8c60` at 100%. The production question count remains zero. The pre-merge tests listed above remain the available automated evidence; a new real student session was not verified, and an empty question bank cannot prove successful delivery of populated content.

No question intake/publication was authorized by this release. Forty drafts remain unreviewed/unpublished and require a genuinely different administrator. Formula/table/image contracts, private media/storage, reporting/moderation and genuine approved intake remain open. Preserve both saved profiles without signout or storage clearing.

**Next action:** implement and test the versioned accessible rich-content contract in isolation. Keep production behavior text-only until a separate reviewed migration/release package receives specific approval. Then implement private media/storage and dedicated reporting/moderation. FCB-01/02 remain closed.

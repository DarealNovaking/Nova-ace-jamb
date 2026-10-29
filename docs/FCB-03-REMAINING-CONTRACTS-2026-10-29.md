# Remaining FCB-03 contracts — implementation status

This records verified gaps under the canonical FCB-03 scope in the master handoff; it does not create a new batch system or mark FCB-03 complete.

| Area | Verified current state | Remaining acceptance |
| --- | --- | --- |
| Text authoring/import | Deployed guarded editor and CSV intake; real student/admin access checks passed | Genuine private save → different-admin review → publish/withdraw acceptance using an approved intake |
| History/restoration | Deployed in approved PR20 release cb6ef545; exact two-function migration20261029160300 installed and metadata/guards verified; preserved in PR21 dashboard release | Genuine authorized new-private-draft restoration acceptance using an approved intake; no reinstall or repeat release approval |
| First question intake | 40 original AI-assisted drafts in five topic CSVs; strict parser/checksums and technical content review passed | Genuine independent answer/language/difficulty/topic/rights review, authorized upload and publication; broader syllabus/question coverage remains |
| Reviewer identity | Read-only database count shows one administrator | A genuinely different authorized administrator must perform review; student/admin profiles are not two independent reviewers and must not be repurposed or elevated automatically |
| Rich content | Current contract accepts plain text/Unicode only and rejects unsupported media; historical restore also refuses media | Accessible structured formulas/tables/diagrams, validated server-side format, consistent rendering in question/editor/history/student paths and adversarial tests |
| Media storage | Existing question_media metadata table; zero media rows; no Storage bucket with question in its ID | Define and verify private upload/delivery authorization, MIME/byte/size validation, rights and alt text, lifecycle and history links, published-only student delivery, revocation and negative tests; no bucket/objects created in this work |
| Moderation/takedown | Admin withdrawal already exists with required reason and audit; no ace table named as a report queue found | Student reporting with ownership/publication checks and abuse limits, administrator report triage/resolution and audited takedown/recovery; no moderation feature claimed from table-name inspection alone |
| Browser sessions | Both saved profiles genuinely worked in earlier two10step runs; admin still authenticated; student post-PR21 read-only check now meets a sign-in wall and stopped without session changes; administrator post-release check PASS (overview and question workspace opened read-only,6steps/27seconds) | Preserve exact profiles; no signout or cookie/session clearing; restore through owner handoff only if needed. Do not claim a fresh signed-in UI acceptance from HTTP delivery alone |

The source catalogue recheck did not retrieve valid exact EPUB bytes. No external textbook extraction, mirror, licence approval, role change, production question insertion, publication or new storage resource was performed. FCB-02 remains complete; its syllabus/baseline work must not be repeated.


## After the approved dashboard release

Dashboard redesign PR21 is merged as8a107e3832b59f67c58ccdf1b649054e22cad66d and deployed through the existing main trigger. Resume the canonical FCB-03 sequence with a versioned rich-content contract, then private media/storage delivery and dedicated reporting/moderation. The40drafts remain unreviewed and unpublished; a genuinely different administrator is still required. Production content, new migrations/storage resources and future releases retain their specific authorization boundary.

## Student delivery prerequisite — PR22

Read-only live audit found direct student question reads blocked by deliberately revoked table/column grants. PR22 replaces those reads with existing sealed attempt delivery plus two bounded metadata-only RPC proposals, strict complete-paper/option validation and expired-session submit retry. Code/database checks pass; all258desktop/mobile browser tests pass and expired-session retry screenshots were inspected. See docs/FCB-03-STUDENT-DELIVERY-RELEASE-2026-10-29.md. No production install/deployment/content changes yet. This repair precedes the rich-content/media work and does not complete it.


## Rich-content v1 source-only candidate — 29 October 2026

A bounded v1 parser and accessible escaped React renderer were added to `feat/fcb03-rich-content-contract`; see `docs/FCB-03-RICH-CONTENT-V1-IMPLEMENTATION-2026-10-29.md`. These are not wired to the existing plain-text RPC/editor/CBT. Server-side validation, private media binding, storage, student signed delivery, retention, ownership/rights checks, and production release remain OPEN. CI pending; no live changes performed. The existing strict rejection of unsupported rich fields remains intentional.


## Rich content: isolated server validator now tested (29 October 2026)

### FCB-03 server-side rich-content validation and private-media contract — 29 October 2026
- PR23 branch `feat/fcb03-rich-content-contract` now also contains `supabase/proposals/fcb03_rich_content_validation.sql`, a **source-only, non-deployed** PostgreSQL validator with strict version, exact fallback, allowed shapes/bounds/control characters, private image UUID and explicit denial of public/anonymous/authenticated EXECUTE. It is deliberately not wired into question save/history/CBT; existing rich/media inputs remain rejected. Full private image lifecycle and storage authorization are specified in `docs/FCB-03-PRIVATE-MEDIA-LIFECYCLE-2026-10-29.md`; no Storage bucket/object or real upload endpoint was created.
- Fresh isolated PostgreSQL 17 CI tests `tests/sql/fcb03_rich_content.test.sql` PASS: one full rich-question payload, 23 hostile/refusal cases, 4 ACL-denial checks. All seven Verify jobs PASS on code SHA `7e48853c07a0920ac31b5c89e1024374a445a72d` in run `40959377728`, including existing question-workflow regression suites. Earlier full 258-browser E2E completed PASS for first corrected frontend-only candidate (run `40958014342`); browser E2E on new SQL/test source (`40959377355`) was still in progress at this checkpoint. New documentation-only commits do not change tested runtime code.
- FCB-03 remains OPEN. No merge, live migration, database/question/media/content mutation, storage resources, account/session changes or deployment performed. 40 draft questions remain unreviewed/unpublished; a genuinely distinct administrator remains a review prerequisite. FCB-01/02 remain complete.
- **Next:** confirm newest PR23 browser tests; then implement private upload intents and question/revision ownership/rights binding against disposable PostgreSQL plus mocked object storage. Production SQL, Storage creation and any deployment still require specific owner approval.

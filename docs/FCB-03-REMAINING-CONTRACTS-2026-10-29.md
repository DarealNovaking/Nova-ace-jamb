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

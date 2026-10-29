# Remaining FCB-03 contracts — implementation status

This records verified gaps under the canonical FCB-03 scope in the master handoff; it does not create a new batch system or mark FCB-03 complete.

| Area | Verified current state | Remaining acceptance |
| --- | --- | --- |
| Text authoring/import | Deployed guarded editor and CSV intake; real student/admin access checks passed | Genuine private save → different-admin review → publish/withdraw acceptance using an approved intake |
| History/restoration | Implemented in PR20; two guarded RPCs are proposal-only; existing manage/review body fingerprints match the isolated compiled source | Approve installing the exact two-function proposal and deploying the tested UI; inspect production grants/owner/config and actual new-draft restoration |
| First question intake | 40 original AI-assisted drafts in five topic CSVs; strict parser/checksums and technical content review passed | Genuine independent answer/language/difficulty/topic/rights review, authorized upload and publication; broader syllabus/question coverage remains |
| Reviewer identity | Read-only database count shows one administrator | A genuinely different authorized administrator must perform review; student/admin profiles are not two independent reviewers and must not be repurposed or elevated automatically |
| Rich content | Current contract accepts plain text/Unicode only and rejects unsupported media; historical restore also refuses media | Accessible structured formulas/tables/diagrams, validated server-side format, consistent rendering in question/editor/history/student paths and adversarial tests |
| Media storage | Existing question_media metadata table; zero media rows; no Storage bucket with question in its ID | Define and verify private upload/delivery authorization, MIME/byte/size validation, rights and alt text, lifecycle and history links, published-only student delivery, revocation and negative tests; no bucket/objects created in this work |
| Moderation/takedown | Admin withdrawal already exists with required reason and audit; no ace table named as a report queue found | Student reporting with ownership/publication checks and abuse limits, administrator report triage/resolution and audited takedown/recovery; no moderation feature claimed from table-name inspection alone |
| Browser sessions | Both saved profiles genuinely worked; two 10-step read-only runs completed | Preserve both logins; switch profiles only; no signout or cookie/session clearing. No further metered runs were started |

The source catalogue recheck did not retrieve valid exact EPUB bytes. No external textbook extraction, mirror, licence approval, role change, production question insertion, publication or new storage resource was performed. FCB-02 remains complete; its syllabus/baseline work must not be repeated.

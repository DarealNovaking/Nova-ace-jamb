# FCB-02 official-source verification — 28 October 2026

Status: **IN PROGRESS; activation/publication blocked**. FCB-01 remains DONE. This is source discovery and factual review, not an approved content import.

## Verified source identity

The public HTML at https://ibass.jamb.gov.ng/e-syllabus identifies https://ibass.jamb.gov.ng/static/js/main.221b9987.js. Its subject-card array contains 25 document-specific PDF links. All 25 returned HTTP 200, PDF magic bytes and successfully parsed pages. Their URLs, byte counts, SHA-256 hashes, page counts and PDF metadata are recorded in [the evidence manifest](evidence/fcb-02-official-syllabus-documents-2026-10-28.json). Subject labels were read from the public card array, not guessed from filenames. Four concurrent read-only downloads were used. PDFs were inspected temporarily; no syllabus corpus or extracted text is committed or published.

This resolves the earlier document-link discovery blocker. The legacy indexed `/assets/uploads/Use-of-English.pdf` and brochure-notice URL currently return HTML app-shell responses through web retrieval; search-index snippets are not the current document. Do not repeat portal-only retrieval or silently substitute those older indexed copies. The current linked English document specifies an unspecified approved reading text, unlike the indexed older copy naming a novel. Do not claim the 2027 English novel is confirmed.

The current Yoruba document explicitly assigns a poetry page range to 2027 (PDF page 3), alongside other yearly ranges. This is subject-specific applicability evidence; it does not prove an annual edition or 2027 applicability for every other document. English page 1 and Yoruba page 3 were visually checked in rendered PDF screenshots. PDF creation timestamps are metadata, not authoritative edition dates.

## Exam configuration evidence

| Claim | Primary source and retrieval result | Decision |
|---|---|---|
| Proposed UTME window: 15–25 March 2027 | Federal Ministry of Education statement, published 14 October, updated 20 October 2026: https://education.gov.ng/fg-harmonizes-2027-examination-timetable-targets-august-results-release/ . Direct page explicitly calls the timetable proposed. | Record as proposed only. Do not activate final dates/countdowns. |
| Current English syllabus specifies 60 questions | https://ibass.jamb.gov.ng/static/media/Use-of-English.885e843b1f51e6a3d062.pdf , PDF page 3 | Verified for this current document; not alone a complete approved 2027 configuration. |
| English compulsory plus three other subjects; 60/40/40/40 questions, four options, 180 total and two hours | Directly retrieved and parsed the 153-page official 2026 training manual, PDF page 8: https://jamb.gov.ng/PDFs/2026/2026%20TRAINING%20MANUAL%20%20final.pdf . Web retrieval size limit was overcome by direct HTTP/PDF parsing. | Verified 2026 baseline; do not promote to a final 2027 config. Existing English-plus-three product selection remains preserved. |
| Current Yoruba syllabus specifies 40 questions | Current linked Yoruba PDF, page 1; exact URL in manifest | Verified for this document; not a universal other-subject or 2027 format approval. |
| 2027 JAMB Test Manual | https://jamb.gov.ng/PDFs/2027/JAMB_TEST_User_Manual_V2.0.1.pdf , 31 pages; introduction describes network simulation and asset verification | Centre tooling; does not establish candidate examination dates/composition. |
| First 2027 session timing | Direct HTTP/PDF retrieval of https://jamb.gov.ng/Bulletin/2026/JAMBulletin_21-09-2026.pdf , 32 pages; page 18 reproduces a Leadership report describing arrival 07:30, examination 08:30–10:30 | Evidence appears in the official bulletin's press coverage section; preserve that distinction. Not a complete exam calendar/config. |
| Life-skills/critical-thinking review | Direct HTTP/PDF retrieval of https://jamb.gov.ng/Bulletin/2026/JAMBulletin_28-09-2026.pdf , 27 pages; page 8 describes commencement of the process | Evidence of a change process, not a finalized new composition or question distribution. The October 5 linked PDF returned 404 in web retrieval. |

The bounded primary-source checks did not establish final 2027 registration dates, an approved complete question composition/duration, or a confirmed English reading text. This is a retrieval limit, not proof that no official announcement exists anywhere.

## Rights and publication gate

No explicit commercial reuse authorization was established by this review. Public download access, absence of a copyright phrase, PDF dates and a subject's appearance on IBASS do not establish permission for ACE JAMB republication, transformation, question-bank reuse, audio or AI grounding. A keyword match for copyright in the Commerce document is part of its academic subject matter, not a licence. This report does not make a legal determination.

All 50 live version records retain the prior inventory's draft/rights-pending state; no fresh database inventory is claimed here and no database changes were made. The manifest is review evidence, not a live source registry update. Existing stored versions are not assigned new sources or rights automatically. No topics, questions, books, provider activation, runtime policy, frontend deployment or main merge was performed.

To clear the content gate, the owner must identify launch-subject coverage and supply or identify documented reuse authority for the selected source materials. Required review evidence: source owner and exact document/hash; permitted educational/commercial uses; whether adaptation, audio and AI use are allowed; attribution; scope/expiry; and an approval record. Separately authored original questions need their own quality/rights review; a syllabus link does not license past papers or recommended books. No outreach was sent.

## Verification and exact continuation

The September bulletin and 2026 manual web size/timeout limits were overcome by direct HTTP retrieval and PDF parsing. Do not repeat the failed web-only route. Only relevant factual paraphrases are retained; no bulletin/manual corpus or unrelated contact lists are committed.

PASS: actual remote main/review heads match the FCB-01 closeout checkpoint; 25/25 HTTP/PDF/parse checks; all hashes and metadata captured; English/Yoruba visual spot checks; current versus stale English source discrepancy recorded. Documentation-only work; code/build/Playwright/SQL suites were not rerun and no new runtime pass is claimed.

Next: obtain the selected launch subjects and source reuse authority, then prepare a review-only, version-specific taxonomy from the authorized documents. Keep final 2027 config inactive until directly supported and separately approved. Existing publication/version/takedown tests and FCB-01 controls must be reused; FCB-02 acceptance still requires actual authorized published records and tested student/admin selectors.


### Continuation — taxonomy review draft
The owner directed continuation using IBASS. Internal source review and draft preparation proceeded; publication is still gated. See [the review summary](content-review/README.md): 25 subjects, 213 page-backed root navigation candidates and 39 first-pass English/Mathematics subtopic candidates. No live import/activation occurred. The earlier instruction to obtain launch coverage/rights before preparing any draft is superseded for this internal review; those items still gate publication and final acceptance. Next: map child detail for the other 23 subjects and review granularity/applicability.


### Continuation — all-subject first-pass hierarchy
The previously pending 23 subjects now have child candidates. Current totals are 214 roots and 955 child candidates, with 1,169 checked page anchors and a draft-hash-bound validation record. Chemistry unit 18 was added after closer review. Of the child locators, 950 sit inside their parent source spans, three intentionally cross-reference English paper structure, and two PHE assignments remain explicitly pending source-layout review. All 25 PDFs were re-downloaded and matched recorded hashes/page counts. See `content-review/README.md`; older 213/39 counts and “23 subjects pending” statements are historical. Next: academic granularity/applicability review, beginning with PHE and prescribed texts. No publication/activation occurred.

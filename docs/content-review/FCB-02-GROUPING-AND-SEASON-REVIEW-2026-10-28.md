# FCB-02 source grouping and season applicability review — 28 October 2026

**Source review completed for this bounded draft pass; FCB-02 remains IN PROGRESS.** This is an engineering/editorial source check, not independent academic sign-off, proof of exhaustive syllabus coverage, a copyright determination, or production publication approval.

## Decisions now recorded

| Finding | Source evidence | Draft decision |
|---|---|---|
| PHE heading contradicts continued sports entries | Current PHE PDF pages 3–5; games continue as numbered sports entries on page 4; actual food/nutrition/drug units begin on page 5 | Retain ball/racket games under sports as an explicit editorial exception. Source heading is not silently corrected; no official erratum claimed. |
| Same short label can refer to different concepts | Two Physics resonance nodes belong to sound and AC circuits; two Accounting financial-position nodes belong to sole traders and non-profits | Qualified four display labels, preserving IDs, source anchors and parent mappings. No concepts merged. |
| Root/topic granularity differs across source formats | Sectioned subjects group numbered units; flat sources directly enumerate topics | Retain the existing two-level navigation draft. Counts do not represent equivalent syllabus weight or expected exam marks. No new schema hierarchy introduced. |
| Arabic modern-period dates disagree in the same document | PDF page 4: Arabic line starts 1798, adjacent English line starts 1978; both visually checked | Keep neutral modern-period label. Flag dates for clarification; do not generate date-dependent content by choosing a date silently. |

## Subject-specific year scope

[Machine-readable all-subject review](fcb-02-season-applicability-2026-10-28.json) records each of the 25 exact source URLs/hashes, PDF page counts, literal year-marker pages and the limits of any inferred applicability.

- **Hausa:** its current PDF page 8 explicitly labels the set-text list for UTME **2026–2030**, covering 2027 within that stated cycle. The written text list on page 7 was also checked against page 8. This approves no book copying and does not establish an annual edition for every syllabus unit. Source: https://ibass.jamb.gov.ng/static/media/Hausa.ca90bfcfca9f88527acf.pdf
- **Yoruba:** current PDF page 3 assigns **book pages 51–83 to 2027** for the specified poetry work. This page range must not be applied to the other works on the page. Source: https://ibass.jamb.gov.ng/static/media/Yoruba.c9f0848e61ff86f1349b.pdf
- **Other 23 subjects:** no year-specific scope covering 2027 was established from the extracted document text in this bounded review. They remain current official-portal documents, not automatically approved annual 2027 editions. This finding is not proof that they are inapplicable or that no official announcement exists elsewhere.
- **English:** the current PDF uses an unnamed approved reading-text reference. No novel was selected from old indexed PDFs or secondary sites.
- **Arabic, Igbo and Literature in English:** the current documents list works, but the checked sections do not establish a 2027-specific cycle. Source pages are recorded individually; bibliographic publication years are not exam-cycle dates.

## Historical notice excluded

JAMB's current homepage links a notice labelled “JAMB Introduces New Literature”. Its one-page PDF explicitly says the changes take effect from **2022 UTME**. It is recorded with a SHA-256 hash as historical evidence and excluded as a 2027 authority. A current navigation link does not make its linked announcement current-cycle evidence.

Source: https://jamb.gov.ng/pdfs/JAMB_INTRODUCES_NEW_LITERATURE.pdf . No title list from that notice replaces the current IBASS documents.

## Engineering fit and remaining gates

The existing `seasonService.ts` two-level, version-bound topic/subtopic service remains appropriate for a reviewed draft import. Inspection of `progressSummary.ts` shows evidence-based question/attempt summaries, and `studySchedule.ts` rotates selected subjects; neither reviewed function derives expected examination weighting from these raw topic counts. This is a source inspection, not a new runtime acceptance result or an exhaustive adaptive-planning audit. Preserve the existing UI and controls.

Current hierarchy remains **214 roots, 955 children, 1,169 page locators**. Every source hash/page count was rechecked during this review. Child checks remain 950 within parent spans, three documented English paper-structure references and two PHE editorial heading exceptions. Four labels were contextualized. No live subject/version UUID binding, source registry update, rights approval, season/config/runtime enablement, database mutation, deployment or main merge occurred. All publication flags remain false; independent academic approval remains false.

Next action: prepare a concrete **draft-only, version-bound import proposal** against the existing database contract, carrying these source/season limits and the unresolved English/Arabic exclusions. The proposal can be inspected without applying it. Authorized content use, final launch coverage, complete official exam configuration and separately approved live publication remain FCB-02 acceptance gates. Do not reopen completed PDF discovery or first-pass child expansion.

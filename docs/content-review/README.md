# FCB-02 syllabus hierarchy review — 28 October 2026

**First-pass hierarchy coverage across all 25 subjects. Draft only; FCB-02 remains IN PROGRESS.** The owner directed continuation using IBASS. This expands the earlier 213-root/39-child outline; it does not approve launch coverage, season applicability or publication.

[Structured draft](fcb-02-taxonomy-draft-2026-10-28.json) · [Validation record](fcb-02-validation-2026-10-28.json) · [Exact-source manifest](../evidence/fcb-02-official-syllabus-documents-2026-10-28.json)

The current draft contains **214 root navigation candidates and 955 subtopic candidates**. Every root now has children, including the previously pending 23 subjects. Each of the **1,169 entries** has a verified 1-based PDF-page locator and short source anchor. All 25 PDFs were re-downloaded and their SHA-256 hashes/page counts matched the existing manifest. The earlier root pass missed explicitly numbered Chemistry unit 18, Astronomical Chemistry; it is now included and was checked on rendered PDF page 15. Earlier 213-root counts are historical.

These are editorial navigation candidates, not a claim that every source objective, finer detail or prescribed text has been exhaustively mapped or independently academically approved. No full syllabus, lesson, book/novel, past-question or learning-objective corpus is included.

## Coverage

| Code | Source subject label | Root candidates | Subtopic candidates |
|---|---|---:|---:|
| AGR | Agriculture science | 5 | 45 |
| ARA | Arabic | 5 | 31 |
| ART | Art | 4 | 13 |
| BIO | Biology | 5 | 24 |
| CHE | Chemistry | 18 | 63 |
| CRS | Christian religious studies | 4 | 52 |
| COM | Commerce | 16 | 48 |
| CST | Computer studies | 9 | 36 |
| ECO | Economics | 23 | 68 |
| FRE | French | 4 | 18 |
| GEO | Geography | 4 | 24 |
| GOV | Government | 4 | 38 |
| HAU | Hausa | 3 | 24 |
| HIS | History | 7 | 42 |
| HEC | Home-Economics | 4 | 25 |
| IGB | Igbo | 4 | 40 |
| ISS | Islamic-Studies | 3 | 19 |
| LIT | Literature-In-English | 5 | 13 |
| MAT | Mathematics | 5 | 23 |
| MUS | Music | 5 | 25 |
| PHY | Physics | 41 | 149 |
| PHE | Physical and Health Education | 12 | 39 |
| POA | Principles of Accounts | 18 | 63 |
| ENG | Use of English | 3 | 16 |
| YOR | Yoruba | 3 | 17 |

Flat sources such as Physics use individual source topics as roots. Sectioned sources such as Mathematics use source sections as roots. Their child granularity therefore still requires academic consistency review. Physics has 41 roots because source item 2 is split into 2a/2b concepts; these are not examination question counts.

## Locator checks and unresolved source layout

A page-level keyword hit alone can match an adjacent topic or a repeated overview. The closer pass also checked child anchors between each parent heading and the next parent heading, retaining explicit cross-references and source exceptions:

| Check | Count | Meaning |
|---|---:|---|
| Child anchor within its parent heading span | 950 | Source-page plus parent-span location verified; semantic completeness/academic approval not implied. |
| English exam-structure cross-reference | 3 | Comprehension, summary and cloze candidates cite the later paper-structure section. |
| PHE source-heading ambiguity | 2 | Ball/racket games tentatively remain under sports; source page 4 puts the food heading before continued sports entries. Academic confirmation required. |

The draft records the check on every child. The validation record identifies all five exceptions. PHE page 4 was rendered and inspected again; neither ambiguous entry is treated as approved. The English reading-text title remains an explicit blocker; no novel was inferred.

Other preserved issues: Computer Studies' overview and detailed-body section groupings differ; the draft follows the detailed body. Art's descriptive section labels are editorial. History reuses section letters across parts, so its part context must remain intact. Hausa locators now point at detailed culture/literature sections rather than the first-page overview. French and Government locators were tightened to avoid repeated overview or adjacent-section matches. Yoruba's poetry selection varies by year and still needs prescribed-text applicability review.

## Existing architecture and publication boundary

`src/lib/seasonService.ts` already loads version-bound `ace.topics` and `ace.subtopics`. Preserve that two-level architecture and the existing academic editor, RLS and publication controls. Intended mapping after review is root → topic, child → subtopic; there is no app/schema rewrite here.

This is **not an import payload**: review IDs are not UUIDs; no live subject/version binding exists. All subjects retain unverified rights, publication disabled and academic review incomplete. These fields do not grant access or bypass server checks. No database data, season/config/runtime state, provider, frontend deployment or main merge changed.

## Verification and exact continuation

PASS: 25 existing subject codes; all 25 exact-source hashes/page counts; 1,169 page anchors; 214 nonempty root mappings; unique IDs and contiguous sibling ordering; 950 child matches inside parent spans; three documented English cross-references; two explicitly pending PHE exceptions; rights/publication flags withheld. The validation record is tied to the draft SHA-256. Visual spot checks: Chemistry page 15 and PHE page 4. No application/SQL/runtime files changed, so runtime suites were not rerun and no new runtime acceptance is claimed.

Next action: review hierarchy granularity and syllabus/season applicability, prioritizing the two flagged PHE parent assignments and subject-specific prescribed texts. First-pass expansion for the other 23 subjects is no longer pending. Documented reuse authority, launch coverage, final exam configuration and separately approved live publication still gate FCB-02 completion. No need to request the IBASS PDFs from the owner.

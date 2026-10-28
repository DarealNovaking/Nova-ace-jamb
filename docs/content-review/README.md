# FCB-02 syllabus structure review — 28 October 2026

**Draft for editorial review. FCB-02 remains IN PROGRESS.** The owner directed continuation using IBASS; source review and draft preparation can proceed while publication remains gated. All 25 existing subjects are included in this review; this does not select the launch subset.

[The structured draft](fcb-02-taxonomy-draft-2026-10-28.json) contains **213 root navigation candidates and 39 subtopic candidates**. Every one of the 252 entries has a 1-based PDF-page locator and a short anchor found in the exact hash-verified source document. Labels are editorial navigation proposals, not a claim of complete official taxonomy or academic approval. No learning-objective, lesson, novel/book, past-question or full-syllabus text is included.

## Coverage

| Code | Source subject label | Root candidates | Subtopic candidates |
|---|---|---:|---:|
| AGR | Agriculture science | 5 | 0 |
| ARA | Arabic | 5 | 0 |
| ART | Art | 4 | 0 |
| BIO | Biology | 5 | 0 |
| CHE | Chemistry | 17 | 0 |
| CRS | Christian religious studies | 4 | 0 |
| COM | Commerce | 16 | 0 |
| CST | Computer studies | 9 | 0 |
| ECO | Economics | 23 | 0 |
| FRE | French | 4 | 0 |
| GEO | Geography | 4 | 0 |
| GOV | Government | 4 | 0 |
| HAU | Hausa | 3 | 0 |
| HIS | History | 7 | 0 |
| HEC | Home-Economics | 4 | 0 |
| IGB | Igbo | 4 | 0 |
| ISS | Islamic-Studies | 3 | 0 |
| LIT | Literature-In-English | 5 | 0 |
| MAT | Mathematics | 5 | 23 |
| MUS | Music | 5 | 0 |
| PHY | Physics | 41 | 0 |
| PHE | Physical and Health Education | 12 | 0 |
| POA | Principles of Accounts | 18 | 0 |
| ENG | Use of English | 3 | 16 |
| YOR | Yoruba | 3 | 0 |

English and Mathematics have a first pass of subtopic candidates, not complete learning-objective or finer-grained coverage. The other 23 subjects currently have root structure only. Flat subject lists such as Physics and Chemistry use individual source topics as root candidates. Sectioned subjects such as Mathematics use source sections as roots. These are deliberate review choices, not a count of exam questions. Physics has 41 roots because item 2 is split into separate 2a/2b concepts in its source.

## Existing architecture fit

`src/lib/seasonService.ts` already loads `ace.topics` and `ace.subtopics` by `syllabus_version_id`, filtering for active rows. Retain this two-level model and existing academic editor/publication controls; no frontend rewrite or schema change is needed for this draft.

When reviewed, the intended mapping is a root to `topics` and a child to `subtopics`. It is **not ready to import**: review IDs are not UUIDs or database identities; there are no live subject/version bindings; all subjects retain `rights_status=unverified`, `publication_allowed=false` and `editorial_review_complete=false`. Final topic granularity still requires academic review, especially for flat sources with no child detail. No state in this file grants publication access or bypasses existing RLS/RPC checks.

## Source issues preserved

- Computer Studies page 1 calls its overview ten sections but lists A–K. The detailed body uses different A–I groupings. The draft follows the detailed body and flags the inconsistency for academic review.
- PHE page 4 visually places the food/nutrition heading above continued sports material. Do not automatically parent ball/racket games under food. Its leaf mapping is withheld. The rendered page was inspected, so this is present in the document layout rather than solely a text-extraction issue.
- Art's section descriptions are editorial labels because its source uses lettered section headings.
- History reuses section letters across parts. Preserve its part context when adding child detail.
- The current English source does not name its approved reading text. The corresponding candidate is explicitly blocked; no novel was inferred.
- Yoruba's poetry coverage varies by year. Retain the 2027-specific selection at later prescribed-text review; no book text is included here.

## Verification and continuation

PASS: 25 unique subject codes match the existing inventory; 25 source hashes/page counts rechecked; all 252 page anchors verified against local exact-source PDFs; unique review IDs and contiguous ordering; all publication/rights flags withheld. Visual spot checks: Computer Studies page 1 and PHE page 4. Draft shape remains outside application imports; no production or frontend files changed. No runtime tests were rerun for this review-data/documentation batch.

Next action: expand the remaining 23 subjects' child-level mapping, preserving the source issues above, then review all 25 for topic granularity and syllabus/season applicability. Launch coverage, documented reuse authority, final exam configuration and separately approved live publication remain gates for FCB-02 acceptance. No need to ask the owner to provide PDFs already retrieved from IBASS.

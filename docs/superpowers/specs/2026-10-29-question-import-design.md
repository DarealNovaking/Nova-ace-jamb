# CSV question intake

Owner direction: proceed with bulk upload so the bank does not require one-at-a-time entry. Routine format and implementation choices are delegated under Balanced Autonomy. Owner confirmed the deployed administrator question workspace opens; authoring/reviewer acceptance is not yet verified.

Use the existing React question workspace, approved syllabus services, draft validator and guarded manage_question RPC. No new dependencies, database functions, direct table writes or content publication. This implementation prepares private drafts only; source evidence still needs independent review.

## Approach

Builder choice: UTF-8 CSV, one subject/topic and optional subtopic per file, a downloadable header-only template, at most 100 nonempty question rows and 1 MiB. CSV is editable in common spreadsheet tools. JSON-only intake would be less accessible; PDF/OCR intake adds ambiguous extraction and is deferred. Every row contains question, four options, correct option, explanation, difficulty, attribution, exam year, source kind/title/author/URL and rights evidence. No inferred licences, official attribution or source years.

Parse quoted commas, double quotes, multiline cells, LF/CRLF and optional BOM. Reject malformed CSV, unsupported/duplicate headers, mismatched column counts and unsupported fields. Validate every row using the existing question contract. Report row numbers and errors without rendering HTML. Detect normalized duplicate stems within the upload. Validate syllabus ancestry before preview. Any invalid row blocks the entire save, with no silent partial acceptance.

The administrator previews each question/options/answer/explanation/source and explicitly confirms source evidence before starting. Save sequentially with generated stable IDs and revision zero through existing mutateQuestion('save', ...). Display confirmed, uncertain and unattempted counts and IDs. Stop immediately on first failed/ambiguous response; never retry automatically, submit, approve or publish. Previously confirmed rows remain saved (not an atomic batch). After a failure, freeze the intake and require closing and reconciling against the question queue before another attempt. Navigation/signout unmount cancels subsequent writes; an in-flight server transaction may complete. No browser storage of uploaded answers.

## UI and verification

Reuse established fields/buttons, responsive spacing and accessible labels/status/alerts. Disable other question mutations while intake is open. File/context changes invalidate preview. File selection race and StrictMode/unmount guards prevent stale preview or continued writes. Show honest empty/loading/error/success states; no fake production content. Test parser limits/quotes/duplicates/validation and sequential stop/cancel behavior, then desktop/mobile Playwright for upload/preview/save, invalid input, denied save, retained partial results, template and session clearing. Run typecheck/build, all Node tests and full browser suite before release. Production merge/deploy will be a concrete reviewable final step under repository approval rules.

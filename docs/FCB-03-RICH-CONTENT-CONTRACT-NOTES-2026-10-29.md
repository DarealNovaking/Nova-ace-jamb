# FCB-03 resumed: rich-content contract audit

Status: repository contract inspection only, after the approved PR21 dashboard release. This does not implement rich content, install SQL, create a bucket or publish a question.

## Verified integration points

- `src/lib/questionWorkflow.ts`: the draft validator allowlists plain stem/options/explanation and provenance. Four A–D choices are required. Adding arbitrary rich keys currently fails closed; keep that behavior until a versioned contract is installed.
- `supabase/proposals/fcb03_question_workflow.sql`: the live workflow validates the same payload, resets publication/reviewer/rights on save and explicitly rejects attached media. `question_versions` stores immutable full snapshots. Do not patch the UI around these server controls.
- `supabase/proposals/fcb03_question_history.sql`: restoration intentionally refuses historical/current/attached media. Extending it must retain immutable references and new-private-draft/independent-review semantics.
- `src/lib/cbtService.ts`: the student question projection requests only id/stem/options/subject/topic/difficulty; it does not expose answer keys/explanations during an active attempt. Any rich-content student projection must preserve that separation.
- `src/components/PersistentCBT.tsx`, the question editor, review queue and history panel currently render plain text. A single shared renderer/validator is preferable to separate HTML insertion paths.
- Existing CSV intake is a strict text contract. Keep its current templates/backward compatibility rather than silently treating CSV text as HTML or remote media.

## Next implementation boundary

Develop and test a versioned structured document contract for paragraphs, accessible equations, bounded tables and image/diagram references. Keep a meaningful text fallback for search and accessible errors. Render allowlisted data as React elements; raw HTML, script URLs and arbitrary external embeds must remain rejected. Formula renderer/library selection and exact representation remain to be verified before implementation; no new dependency has been chosen here.

Media needs a separate private staging/upload/delivery boundary, not public object URLs in draft text. Server-side validation must cover actual file bytes/type/size, ownership/question binding, rights evidence and alt text. Publication and withdrawal must control student delivery; signed URL lifetime/cache revocation must be specified and tested. History must refer to immutable reviewed assets, and cleanup must not break retained revisions.

Test the complete existing save → independent review → publication → student projection → withdrawal → restoration sequence in disposable PostgreSQL and mocked desktop/mobile browsers before preparing any production migration. Include author/editor/admin/student/anon denials, malformed/oversized/deep documents, unsafe URLs, cross-question assets, concurrent edits/reviews, audit rollback, withdrawal delivery denial and unavailable media/accessibility fallbacks.

Production installation/storage resources and a later release need a separate concrete approval package. The40original drafts remain unreviewed/unpublished; only one administrator was present in the last read-only DB preflight. Student browser sign-in restoration is needed for fresh real-student acceptance, but does not block isolated implementation. Preserve both exact saved profiles; never sign out or change roles to manufacture an independent reviewer.

# FCB-03: Rich question content v1 implementation (source-only)

Date: 29 October 2026. Status: **frontend parser/renderer and tests prepared on a feature branch; CI and server integration still pending.** This is not a production release or a rich question authoring enablement.

## Implemented files

- `src/lib/richContent.ts`: versioned, strictly allowlisted JSON document with paragraphs, Unicode equations (required spoken equivalent), bounded captioned tables, and private UUID diagram references (required alt/caption). Derives and compares an exact searchable/accessibility plain-text fallback. Limits: 24 blocks, 4 images, 3 tables, 20 table rows, 6 columns, 120 cells/table, 20k fallback characters, 32k normalized JSON characters. No HTML, arbitrary elements, styles, links, URLs, HTML embeds, raw LaTeX or generic media objects.
- `src/components/RichContentView.tsx`: text-node-only React presentation with semantic table captions/column headings, math role plus screen-reader equivalent and unavailable-diagram text/alt. Invalid documents show a safe unavailable message; no partial content displayed and no image URLs fetched. No new dependencies.
- `tests/rich-content.test.mjs` and Verify workflow: contract/refusal tests and server-rendered HTML assertions for escaping, oversize, malformed payloads and accessibility.

## Security and capability boundary

The **existing production question payload remains plain text**. The `manage_question` RPC, review, history/restore and student CBT delivery have **not been changed** to accept this document; submitted unknown fields continue to be rejected. No private Storage bucket, signed image delivery, external image provider, draft upload permission, SQL, student release, media publication or schema migration exists in this change. This standalone renderer is deliberately **not wired to production question records** until there is an authorized server-side contract. Any media reference displays only its accessible placeholder, not a remote object.

Server-side implementation must independently enforce version, bounds, exact fallback projection, accessible image metadata, MIME/byte constraints, rights, ownership, question revision binding, publication/withdrawal and reviewer independence. The authoritative public student projection must omit correct options, explanations, provenance and private storage URLs. History must retain immutable reviewed asset bindings, and restore to new private drafts. Later decide whether trusted typesetting (e.g. LaTeX via audited dependency) is justified; v1 chooses readable Unicode rather than unsafe raw rendering. Also test ownership, current session, signed URL expiry and unavailable media at integration time.

## Verification and next action

Source is committed to `feat/fcb03-rich-content-contract`; the repository's native Verify and E2E jobs must check the PR before any merge decision. **Tests are not claimed passed until GitHub Actions reports final results.** There are no production changes. Next: inspect completed PR checks and fix any regressions; then prepare isolated PostgreSQL server-side rich-content/media contract and adversarial tests without applying it live. A separate explicit owner authorization remains required for production SQL/storage changes and deployment.

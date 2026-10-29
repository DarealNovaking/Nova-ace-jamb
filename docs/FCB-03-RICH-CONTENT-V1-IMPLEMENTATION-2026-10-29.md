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

## Added PostgreSQL validation and private-media security design

### FCB-03 server-side rich-content validation and private-media contract — 29 October 2026
- PR23 branch `feat/fcb03-rich-content-contract` now also contains `supabase/proposals/fcb03_rich_content_validation.sql`, a **source-only, non-deployed** PostgreSQL validator with strict version, exact fallback, allowed shapes/bounds/control characters, private image UUID and explicit denial of public/anonymous/authenticated EXECUTE. It is deliberately not wired into question save/history/CBT; existing rich/media inputs remain rejected. Full private image lifecycle and storage authorization are specified in `docs/FCB-03-PRIVATE-MEDIA-LIFECYCLE-2026-10-29.md`; no Storage bucket/object or real upload endpoint was created.
- Fresh isolated PostgreSQL 17 CI tests `tests/sql/fcb03_rich_content.test.sql` PASS: one full rich-question payload, 23 hostile/refusal cases, 4 ACL-denial checks. All seven Verify jobs PASS on code SHA `7e48853c07a0920ac31b5c89e1024374a445a72d` in run `40959377728`, including existing question-workflow regression suites. Earlier full 258-browser E2E completed PASS for first corrected frontend-only candidate (run `40958014342`); browser E2E on new SQL/test source (`40959377355`) was still in progress at this checkpoint. New documentation-only commits do not change tested runtime code.
- FCB-03 remains OPEN. No merge, live migration, database/question/media/content mutation, storage resources, account/session changes or deployment performed. 40 draft questions remain unreviewed/unpublished; a genuinely distinct administrator remains a review prerequisite. FCB-01/02 remain complete.
- **Next:** confirm newest PR23 browser tests; then implement private upload intents and question/revision ownership/rights binding against disposable PostgreSQL plus mocked object storage. Production SQL, Storage creation and any deployment still require specific owner approval.

The validator exists only in `supabase/proposals/`; do not call this a production migration or working upload. It does not authenticate assets/bytes by itself and grants no API execution. See `docs/FCB-03-PRIVATE-MEDIA-LIFECYCLE-2026-10-29.md` for the separately gated implementation path.

## Final PR-head verification — 29 October 2026

Latest PR23 head `a3e83f5aa4d79fef8fcd2e5e78112a95028f4c5c` has **Verify SUCCESS** in GitHub Actions run `40959861758` and **ACE JAMB E2E SUCCESS** in run `40959861745`. The earlier SQL-source E2E run `40959377355` was superseded/cancelled; do not cite it as a pass. PR23 remains OPEN and mergeable at this checkpoint, not merged/deployed. Next implementation dependency is the private upload intent and metadata trust boundary with isolated concurrency/ownership tests, followed by mocked object processing/delivery. Neither production bucket nor SQL changes are authorized by this result.

# Coordinated CBT security — applied and live-verified (28 October 2026)

Owner approval is fulfilled. Do not request it again or reapply the bundle. Runtime access remains disabled: runtime/mode/usage tables are empty and creation is denied until separately approved policies exist.

The initial whole-core request expired without changing production. The exact approved core SQL was split into three independently safe migrations; delivery and mock followed. Actual source/ledger files:

- `supabase/migrations/20261028043526_fcb_01_cbt_private_runtime.sql`
- `supabase/migrations/20261028043550_fcb_01_cbt_start_boundary.sql`
- `supabase/migrations/20261028043607_fcb_01_cbt_mutation_boundaries.sql`
- `supabase/migrations/20261028043630_fcb_01_attempt_question_delivery.sql`
- `supabase/migrations/20261028043747_fcb_01_mock_contract.sql`

Full live catalog/ACL matches independently compiled reviewed SQL. Default-disabled runtime, owner isolation and private factory denial probes PASS. Locking permission probes used a rolled-back normal transaction after READ ONLY correctly rejected row-lock syntax; no account/attempt fixtures were created. Attempts/questions stay zero; content, seasons, providers and frontend deployment remain inactive/unchanged. The existing metadata rollback refuses captured papers and remains incident-only. Current recovery replay/native CI is a separate source-verification step, not permission to enable the product.

---

## Historical reviewed scope (approved and fulfilled)

### Original review

This source bundle is **not applied**. It requires specific production authorization. Source 0735891 passed Verify 40630042446 (14 SQL suites, native rollback, 21 races) and E2E 40630042678 (164 tests); actual logs inspected. Existing six approved fixes must not be reapplied.

Apply in dependency order: `supabase/proposals/fcb_01_cbt_mutation_contract.sql`, `supabase/proposals/fcb_01_attempt_question_delivery.sql`, then `supabase/proposals/fcb_01_mock_contract.sql`. A production preflight must still match the six-fix recovery snapshot and confirm no existing attempts require preserving/migrating old papers. Use the working Primary connection and tool-recorded migration IDs. No blind historical db push.

The bundle adds private immutable paper/config snapshots, owner-scoped secret-free APIs, authoritative scoring and idempotent completion, plus three private RLS-protected runtime/mode/usage tables and audited policy changes. Runtime and per-mode policies are **not seeded**. Missing/disabled policies deny creation. Limits/entitlement products in synthetic fixtures are tests only, not launch defaults or approved business decisions. No client can mutate counters/policy, choose a prepaid internal reservation or bypass mock configuration. Reservation runs before question selection and is shared across modes; failed creation rolls back its reservation.

Clock validity is checked after user and entitlement locks, so waiting cannot extend expired access. Native acceptance includes concurrent new/existing counters, active slots, cooldown and expiry during lock waits. Both administrator/editor users remain subject to the same attempt access policy; draft authoring privileges do not confer access.

This approval would not publish content, activate any season/config or runtime policy, change free/premium limits, enable paid providers, deploy/merge the frontend or grant whole-row question/answer/score access. The existing frontend remains disconnected until FCB-04 coordinated integration and real-content acceptance.

Rollback: `docs/rollback/fcb-01-cbt-resource-before.sql` restores the original four fail-closed RPC definitions/ACLs and removes only new objects. It refuses captured papers instead of deleting attempts, answers or progress. Exact forward/rollback catalog parity is tested against an empty disposable recovery, plus a synthetic captured-paper refusal. It is metadata restoration, not a production data backup; after actual attempts exist, use a reviewed data-preserving incident plan.

Remaining layered protection: these are transactional limits on successful attempt creation, not an HTTP/IP or invalid-request firewall. Gateway/auth-level brute-force protection and live-device/provider acceptance remain explicit FCB-11/release checks. Do not claim zero vulnerabilities or full-product completion from this bundle.

Final verification: source 7e58dce, Verify 40634326588 PASS and E2E 40634326572 PASS (164). Current recovery/native rollback-upgrade/refusal and all 21 concurrency cases pass. FCB-01 is closed for its security/baseline scope; runtime access remains disabled and later launch gates remain open.

# Coordinated CBT security application review

This source bundle is **not applied**. It requires specific production authorization after SHA-matched native checks. Existing six approved fixes must not be reapplied.

Apply in dependency order: `supabase/proposals/fcb_01_cbt_mutation_contract.sql`, `supabase/proposals/fcb_01_attempt_question_delivery.sql`, then `supabase/proposals/fcb_01_mock_contract.sql`. A production preflight must still match the six-fix recovery snapshot and confirm no existing attempts require preserving/migrating old papers. Use the working Primary connection and tool-recorded migration IDs. No blind historical db push.

The bundle adds private immutable paper/config snapshots, owner-scoped secret-free APIs, authoritative scoring and idempotent completion, plus three private RLS-protected runtime/mode/usage tables and audited policy changes. Runtime and per-mode policies are **not seeded**. Missing/disabled policies deny creation. Limits/entitlement products in synthetic fixtures are tests only, not launch defaults or approved business decisions. No client can mutate counters/policy, choose a prepaid internal reservation or bypass mock configuration. Reservation runs before question selection and is shared across modes; failed creation rolls back its reservation.

Clock validity is checked after user and entitlement locks, so waiting cannot extend expired access. Native acceptance includes concurrent new/existing counters, active slots, cooldown and expiry during lock waits. Both administrator/editor users remain subject to the same attempt access policy; draft authoring privileges do not confer access.

This approval would not publish content, activate any season/config or runtime policy, change free/premium limits, enable paid providers, deploy/merge the frontend or grant whole-row question/answer/score access. The existing frontend remains disconnected until FCB-04 coordinated integration and real-content acceptance.

Rollback: `docs/rollback/fcb-01-cbt-resource-before.sql` restores the original four fail-closed RPC definitions/ACLs and removes only new objects. It refuses captured papers instead of deleting attempts, answers or progress. Exact forward/rollback catalog parity is tested against an empty disposable recovery, plus a synthetic captured-paper refusal. It is metadata restoration, not a production data backup; after actual attempts exist, use a reviewed data-preserving incident plan.

Remaining layered protection: these are transactional limits on successful attempt creation, not an HTTP/IP or invalid-request firewall. Gateway/auth-level brute-force protection and live-device/provider acceptance remain explicit FCB-11/release checks. Do not claim zero vulnerabilities or full-product completion from this bundle.

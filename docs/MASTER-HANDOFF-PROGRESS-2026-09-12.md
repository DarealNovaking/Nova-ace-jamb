# ÑØVÃ ACE JAMB — Master Handoff Progress

## 2026-09-12 — Batch 1: Identity + Student Profile
- Added automatic Supabase `auth.users` onboarding trigger creating the ACE profile, default student role, student preferences, notification preferences and deterministic referral code.
- Added authenticated auth/session and student-profile service boundaries, onboarding UI, device continuity registration, and protected CBT entry.
- Hardened identity RLS and added atomic `ace.set_student_subjects(uuid[])` with authenticated-only execution, active-subject validation and 1–4 selection enforcement.
- Added repository typecheck/build verification through GitHub Actions.
- Tightened `StudentFoundationGate` so missing profiles route to onboarding while device/RLS/network/database failures surface as retryable account-preparation errors.
- Re-verified privileged identity function execution: `anon` cannot execute `is_admin`, `is_admin_or_editor` or `set_student_subjects`; `authenticated` can.

### Batch 1 continuation — gate hardening and verification
- Applied identity performance hardening migration `20260912195056_batch_1_identity_performance_hardening_v2` in Supabase and recorded the migration in the repository.
- GitHub Actions verification for commit `087853cdc69d56246cd86a3b28aa8fc46d79b98f` completed successfully: `npm install`, `npm run typecheck`, and `npm run build` passed.
- Hardened `StudentFoundationGate` in commit `5d0fca8b1032d485a1bcaeb6b4c54654a1381e67` so dashboard access requires a valid profile, persisted daily-study preference, and 1–4 selected subjects; retrieval failures cannot silently bypass the gate.
- Current Supabase state verified: **0 `auth.users`, 0 profiles, 0 preferences, 0 selected-subject rows, 0 devices, 0 roles; 4 active subjects**.

### Codespaces launch path — 2026-09-13
- Added `.devcontainer/devcontainer.json` in commit `732c3b09dcc99a13576da29e64623f3ac56fe36e` to provide a reproducible Node 20 Codespaces environment, automatically run `npm install`, forward Vite port 5173 and auto-open the forwarded app port.
- Added the `dev:codespaces` script in commit `844dd85ca0f127eb6a92cff4c75c2bc9cfdfec0e`, using `vite --host 0.0.0.0` so the app is reachable through the forwarded Codespaces port.
- These changes address the Android testing-environment problem without changing application architecture or bypassing authentication. They do **not** supply or commit Supabase credentials.

### Email-code authentication — 2026-09-13
- Replaced the student magic-link UI flow with a 6-digit email verification-code flow using Supabase `signInWithOtp` + `verifyOtp`, keeping authentication passwordless and session-backed.
- Updated protected CBT sign-in to use the same email-code flow so authentication behavior is consistent across entry points.
- This avoids dependence on a Codespaces/browser redirect URL for the student verification step and makes signup testing possible entirely in the current browser session.
- Supabase email delivery must use the OTP token template (`{{ .Token }}`) rather than a confirmation-link-only template for the code to be delivered as a usable 6-digit code. This configuration is external to the repository and must be set in Supabase Auth email templates before E2E testing.

### Password authentication decision — 2026-09-14
- Replaced the temporary passwordless email-code implementation with standard **email + password** authentication for student signup and sign-in.
- Added password validation (minimum 8 characters), password signup, password sign-in, password-reset email request, and password update/recovery handling.
- Updated the student auth UI to provide **Create account**, **Sign in**, **Forgot password**, and recovery/new-password states. Normal signup no longer depends on a confirmation email.
- Added recovery-session handling in `StudentFoundationGate` so Supabase password-reset sessions are routed to the in-app new-password screen before the normal student foundation gate.
- Product decision: keep Supabase's default email service for now; do **not** introduce custom SMTP solely for signup confirmation. Signup confirmation will be disabled after the repository flow is ready for E2E. Password-reset email remains the recovery mechanism.
- No payment, referral, WhatsApp/community, Batch 2+, or other later-batch implementation was started by this authentication change.

### Batch 1 continuation — password flow E2E readiness — 2026-09-14
- Verified the password-auth implementation is present on `main`, including `signUpWithPassword`, `signInWithPassword`, password reset/update handling, and recovery-session routing.
- Project owner disabled Supabase **Authentication → Providers → Email → Confirm email**, removing signup confirmation as a dependency for the password-based E2E flow.
- Supabase project `nova-ace-jamb` is healthy and now contains **1 auth user, 1 ACE profile, 1 student-preferences row, 1 notification-preferences row and 1 referral-code row**; the account has not yet completed student-device registration/onboarding because `ace.devices` and `ace.student_subjects` remain empty.
- Current security advisor has no RLS/security lint finding except the Supabase Auth warning that **Leaked Password Protection is disabled**. This is a dashboard-level security setting and remains a recommended pre-release hardening item.
- Current performance advisor reports RLS initialization-plan and multiple-permissive-policy warnings plus unused-index informational findings. These are optimization findings, not a Batch 1 correctness blocker; no unsafe schema change was made merely to silence them.
- Current Batch 1 blocker remains the real browser E2E: complete onboarding, verify persistence after reload, sign out/sign back in, verify cross-session continuity, protected-route behavior and final RLS isolation evidence. Batch 2 remains locked.

### Batch 1 continuation — white-screen build blocker — 2026-09-14
- Browser testing exposed a white screen because the repository still contained a stale `ProtectedCBT.tsx` import of the removed OTP functions `requestEmailCode` and `verifyEmailCode` from `authService.ts`.
- Replaced that protected-CBT email-code flow with the canonical password sign-in flow using `signInWithPassword`, aligned with the current student authentication architecture.
- Fix committed on `main` as `aa93ba3f8b9ac6e6a1a0128a658f4a136dffc816` (`fix(batch-1): align protected CBT with password auth`).
- Local build verification after this fix is still required before declaring the white-screen blocker closed.

### Batch 1 continuation — account-preparation API privilege blocker — 2026-09-14
- The exact browser error was confirmed as **“We couldn’t prepare your account / Unable to prepare your ACE account. Please try again.”** This is the `StudentFoundationGate` retry state, not the signup error itself.
- Supabase inspection showed the account creation trigger was succeeding: **2 auth users, 2 profiles, 2 roles, 2 preferences, 2 notification-preferences and 2 referral-code rows**, while `ace.devices` and `ace.student_subjects` remained at 0.
- Root cause identified: the `authenticated` PostgREST role had **no `USAGE` privilege on schema `ace` and no table privileges** for the student-facing tables. RLS policies existed, but RLS cannot be reached through the Data API without the required grants. This caused `registerCurrentDevice()` and subsequent student retrieval to fail before onboarding could render.
- Applied Supabase migration `batch_1_api_privileges` granting only the required authenticated access: schema `ace` usage; profile select/update; student-preferences select/update; student-subject select; device select/insert/update; and execution of `ace.set_student_subjects(uuid[])`.
- Recorded the same migration in GitHub as `supabase/migrations/20260914120000_batch_1_api_privileges.sql`, commit `709acd75f2fa37b9882ef019798e45880fd4b0c2`.
- Re-verified the database privileges after migration: authenticated schema usage and required table/function privileges are now **true**. RLS remains the row-level security boundary.

### Batch 1 continuation — onboarding subject catalog privilege blocker — 2026-09-14
- After the account-preparation grant fix, browser testing reached the student onboarding screen, but the required **1–4 JAMB subject selection controls were not visible**, leaving the student unable to satisfy the existing Batch 1 gate.
- Repository inspection confirmed `StudentOnboarding.tsx` correctly queries `ace.subjects` for active subjects and maps returned rows into selectable buttons. The existing `ace.set_student_subjects(uuid[])` service already enforces 1–4 selected active subjects server-side.
- Supabase inspection confirmed the subject catalog itself is present and healthy: **4 active subjects** (`Use of English`, `Mathematics`, `Physics`, `Chemistry`). The `ace.subjects` RLS policy permits active-subject reads, but the authenticated PostgREST role lacked the required table-level `SELECT` privilege.
- Root cause: the earlier Batch 1 API-privileges migration granted access to the student profile/preferences/device tables and subject-selection RPC, but omitted `SELECT` on `ace.subjects`. The onboarding query therefore could not render the subject options.
- Applied Supabase migration `batch_1_subject_catalog_api_privileges` granting `SELECT` on `ace.subjects` to `authenticated`, without changing the existing RLS policy.
- Verified `has_table_privilege('authenticated','ace.subjects','SELECT')` is now **true**.
- Recorded the applied migration in GitHub as `supabase/migrations/20260914120500_batch_1_subject_catalog_api_privileges.sql`, commit `93d536d5fe247677ad96676ec004dd41e32569e4`.
- This fixes the current Batch 1 onboarding blocker at the database/API privilege layer. The browser must now be refreshed/reloaded and the subject controls verified before the fix is considered E2E-complete.

### Batch 1 continuation — E2E pause until product completion — 2026-09-14
- During manual onboarding testing, the profile save action returned **“Cannot save your profile”**. This has **not** been diagnosed yet; no unsupported root cause is recorded.
- The project owner decided to **pause the full manual/E2E testing cycle until the ACE JAMB product implementation is substantially complete**, rather than repeatedly testing a moving onboarding surface while later product systems are still being built.
- The current onboarding screen is explicitly treated as a **Batch 1 foundation/testing surface, not the final production onboarding UX**. The intended final flow must use structured Nigerian institutions/courses and data-driven JAMB subject combinations rather than free-text institution/course entry and manual subject guessing.
- This pause does **not** mark Batch 1 complete and does **not** authorize skipping the batch gate. Batch 1 remains open; its required E2E evidence will be executed after the implementation surface stabilizes, and Batch 2 remains locked until the formal Batch 1 gate is satisfied.

### Current Batch 1 gate status
**NOT CLOSED YET.** Implementation and database hardening are in place. The account-preparation privilege blocker is fixed and verified at the database privilege level. The onboarding subject-catalog privilege blocker is also fixed and verified at the database privilege level. Manual E2E testing is now intentionally paused until the product implementation surface stabilizes. The unresolved profile-save failure remains undocumented beyond its exact user-facing error because its root cause has not been established. The remaining formal exit-gate work is the real browser E2E: confirm subject controls, complete onboarding with 1–4 subjects, verify persistence after reload, sign out/sign back in, verify cross-session/device continuity, protected-route behavior and final RLS isolation evidence. The white-screen build blocker was fixed in `ProtectedCBT.tsx`; the local build was subsequently reported as passing by the project owner, but the full authenticated E2E is still outstanding. Batch 2 remains locked.

## Important
This file records notable project progress only—milestones, architecture decisions, important blockers, security findings and verification results; do not log every command. Earlier architecture, CBT, Batch 0, monetization, AI, referral, notification and community milestones remain documented in the canonical handoff and prior project history.

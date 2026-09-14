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

### Current Batch 1 gate status
**NOT CLOSED YET.** Implementation and database hardening are in place. The remaining exit-gate blocker is a real authenticated E2E flow using a dedicated test account and suitable fixture data. The white-screen build blocker has been fixed in `ProtectedCBT.tsx`, but the fix still requires local build verification. Codespaces launch support and authentication implementation are committed to make browser testing reproducible. Supabase's **Confirm email** setting is now disabled, so password signup can be tested without confirmation email. No Batch 2 implementation has started.

## Important
This file records notable project progress only—milestones, architecture decisions, important blockers, security findings and verification results; do not log every command. Earlier architecture, CBT, Batch 0, monetization, AI, referral, notification and community milestones remain documented in the canonical handoff and prior project history.

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

### Current Batch 1 gate status
**NOT CLOSED YET.** Implementation and database hardening are in place. The latest gate-hardening commit still requires CI verification, and the remaining exit-gate blocker is a real authenticated E2E flow using a dedicated test account and suitable fixture data. No Batch 2 implementation has started.

## Important
This file records notable project progress only—milestones, architecture decisions, important blockers, and completed phases. Earlier architecture, CBT, Batch 0, monetization, AI, referral, notification and community milestones remain documented in the canonical handoff and prior project history.

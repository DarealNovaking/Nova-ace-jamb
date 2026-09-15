# ÑØVÃ ACE JAMB — Admin Role Handoff Addendum — 2026-09-16

## Batch 2 — Admin/Role Management

- Project owner chose to continue with the existing Supabase accounts rather than reset Auth users.
- Verified the live `ace.roles` table before changing access: both existing users were `student`; no `admin` or `editor` role existed.
- Promoted the project owner's existing authenticated account to `admin` in Supabase. No Auth user was deleted or recreated.
- Existing authorization architecture was preserved: `ace.is_admin()` and `ace.is_admin_or_editor()` remain the role gates; RLS policies continue to enforce least-privilege access.
- Added `ace.set_user_role(uuid,text)` as an admin-only `SECURITY DEFINER` function with a fixed search path. It accepts only `student`, `editor`, or `admin`; verifies the target Auth user exists; prevents removal of the last admin; updates `ace.roles`; and writes an auditable `role_changed` event to `ace.audit_events`.
- Revoked function execution from `public`/`anon` and granted it only to `authenticated`.
- Applied live Supabase migration `batch_2_admin_role_management`.
- Recorded the same migration in GitHub as `supabase/migrations/20260916090000_batch_2_admin_role_management.sql`, commit `58b20a0e1e5585152a1934ad9300885e74a3f953`.
- Live role verification confirms the project owner's account is now `admin`.

## Batch 2 state after this change

- Admin authorization prerequisite for the secure catalogue-import pipeline is now established.
- No catalogue data has been fabricated or bypassed.
- The next execution path is: stage the 791 authoritative institution records (328 NUC universities, 199 NBTE polytechnics, 264 NCCE colleges), validate, approve, publish as draft, then reconcile authoritative programme/UTME-combination data through the existing publication boundary.
- Batch 2 remains **IN PROGRESS** until catalogue, syllabus, onboarding integration, verification, and its formal gate are complete.

# ÑØVÃ ACE JAMB — Master Handoff Progress

## 2026-09-12 — Backend/Supabase audit

### Verified
- Repository: `DarealNovaking/Nova-ace-jamb`, private, `main` branch.
- Canonical project handoff: `docs/ACE-JAMB-MASTER-HANDOFF.md`.
- Existing backend: `backend/index.ts` uses `@appdeploy/sdk` and AppDeploy database routes.
- Existing backend currently contains health, admin bootstrap, profile, subject, topic, question creation/deletion routes.
- The existing admin mutation routes are not protected by `requireAuth()` and therefore require remediation before production use.
- Existing question model is too narrow for the master handoff: it lacks stable rich-content/provenance/rights/versioning/session metadata requirements.
- Existing backend does not implement the retained persistent CBT/attempt/scoring architecture.

### Supabase audit
- Supabase organization available: `czginzwjoomzlwwxniyl` (`petermayowa923@gmail.com's Org`).
- No Supabase projects currently exist in the connected account.
- Supabase project creation cost for this organization was checked: **$0/month**.
- Project creation therefore remains the immediate infrastructure step, but the Supabase tool requires explicit confirmation of the displayed cost before project creation.

### Architecture decision reinforced
- The master handoff's Supabase direction is current; the older Phase-0 Worker/D1/R2 proof architecture is legacy and should not be revived as the production backend.
- Supabase RLS must be enabled for exposed tables, with least-privilege grants and policies. Admin authorization must not rely on client-side state.
- Secrets/service-role credentials must remain server-side.

### Current blocker
- No Supabase project exists yet, so there is currently nowhere to deploy or inspect the intended database/auth/storage backend.
- Creation cost has been verified at $0/month; explicit confirmation is required before creating the project.

### Next actions after confirmation
1. Create the Supabase project in the existing organization.
2. Inspect migrations, tables, extensions, Edge Functions, advisors and API configuration.
3. Design/apply the initial ACE schema around profiles, roles, syllabus hierarchy, rich questions, attempts, answers, scoring/progress and audit/security foundations.
4. Replace the AppDeploy backend dependency behind service boundaries rather than coupling UI directly to Supabase.
5. Add/verify RLS and admin authorization.
6. Validate the frontend integration and preserve existing functionality.
7. Update the canonical master handoff with every completed milestone and unresolved decision.

## Important
This file is a durable progress record created during the audit. The canonical handoff remains `docs/ACE-JAMB-MASTER-HANDOFF.md` and must be synchronized with these findings as soon as the file can be updated safely without losing existing handoff content.

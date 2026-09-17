# ÑØVÃ ACE JAMB — MASTER HANDOFF

> **Canonical single-file project context.** This document contains the complete retained ACE JAMB product direction, architecture decisions, requirements, unresolved decisions, assets, QA rules, and implementation sequence for continuing the project in another ChatGPT account or development environment.
>
> **Critical separation rule:** ACE JAMB is a separate product from **Ñøvã CBT MAX** and **DROP**. Do not merge their roadmaps, databases, pricing, branding, or architecture.

---

## 1. PROJECT IDENTITY

- **Product:** ÑØVÃ ACE JAMB
- **Parent brand:** ÑØVÃ Academic Resource Series
- **Founder styling:** Ñøvã Kïñg
- **Tagline:** Students Resources Made Easy
- **Audience:** JAMB candidates broadly; not FUTA-only
- **Brand feel:** premium, futuristic, youthful, Nigerian-student-focused, practical, polished
- **Visual direction:** progressive 3D/futuristic UI where useful; 3D must never be required for core functionality or performance
- **Primary palette:** Royal Purple + Metallic Gold + White + Black
- **Primary constraint:** mobile-first, low-bandwidth, low-end-Android friendly
- **Product principle:** it should feel like a serious education platform, not a generic question-bank website or an AI wrapper.

---

## 2. PRODUCT VISION

ACE JAMB is intended to be a complete JAMB preparation platform combining:

1. JAMB season structure
2. JAMB syllabus structure
3. Personalized student onboarding/profile
4. Structured and quality-controlled past questions
5. Learning Mode
6. Practice Mode
7. Weakness/Speed/Mistake practice
8. CBT simulation and realistic full mocks
9. Quick Revision
10. Flashcards
11. Audio learning
12. Performance and mastery analytics
13. Mistake bank

---

## 3. DEADLINE / EXECUTION PRIORITY — UPDATED 2026-09-17

- **Hard target:** complete the usable ACE JAMB project by **2026-09-27**.
- Execution priority: **speed on the critical path without sacrificing reliability, security, or verification**.
- Avoid unnecessary discussion/detours; prefer direct implementation and verification.
- For frontend/user-flow/UI/auth/forms/routing/onboarding changes, use Playwright verification when the capability is available; never claim a Playwright run unless actually executed.
- Continue enforcing: **IMPLEMENT → VERIFY → DOCUMENT → COMMIT → GATE**.
- Do not skip security boundaries or fabricate data to meet the deadline.

### Admin account decision — 2026-09-17

- Existing Supabase Auth accounts were verified.
- `petermayowa923@gmail.com` is the designated ACE JAMB application admin account.
- `lamilakes@gmail.com` remains the student-role account.
- Current role count verified: 1 admin, 0 editors, 1 student.

---

## 4. PROJECT STATUS

- Batch 2 / IBASS staging execution remains **IN PROGRESS**.
- Batch 3 remains **LOCKED** until Batch 2 is genuinely gated.
- Supabase project: `nova-ace-jamb` (`uokiqlgmzprqfbzmedaz`).
- The application frontend is **not yet deployed**; do not confuse deployed Supabase backend functions with a deployed web application.

---

## 5. NEXT CRITICAL PATH

1. Authenticate as the designated admin (`petermayowa923@gmail.com`) through the application Auth flow.
2. Execute the controlled IBASS staging smoke test with real user JWT and approved/reviewed sources.
3. Verify staged programme and UTME-rule counts, unresolved/ambiguous handling, import-batch records, and role authorization.
4. Run frontend verification with Playwright when the frontend is available/deployed.
5. Document every meaningful result in the master handoff/progress log.
6. Commit and gate Batch 2 only after evidence supports the gate.
7. Proceed to Batch 3 and continue critical-path implementation toward the 2026-09-27 target.

---

## 6. SECURITY / INTEGRITY

- Never bypass JWT or role authorization with service-level SQL/direct production-table writes to simulate an authenticated user.
- Keep authoritative-source requirements intact.
- Do not publish fabricated institution/programme/UTME combinations.
- Supabase security warning previously observed: Leaked Password Protection Disabled; track separately as security hardening.

---

## 7. EXISTING IBASS STAGING NOTES

- `ibass-catalog-stage` ACTIVE v2, JWT verification enabled.
- `catalog-import` ACTIVE v2.
- Generic reviewed source: `JAMB IBASS Programme Detail Pages`, source ID `9959f7d6-0071-4ab3-880c-a79f3c81e561`.
- Test season: `jamb-2027`, ID `23fc8eb7-2d2e-474f-b4db-c0a69f22cd62`, status `draft`.
- Existing 791-institution staging batch `a563b370-de07-43fe-a29a-517d6036c685` is rejected and must not be treated as production-valid.

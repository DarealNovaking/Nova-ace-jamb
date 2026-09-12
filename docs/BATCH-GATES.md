# ÑØVÃ ACE JAMB — Gated Implementation Plan

## Operating rule

Work is strictly sequential. A batch is not complete until its implementation, verification, documentation and Git commit are complete. Do not begin the next batch early except for a dependency that is explicitly required by the current batch and recorded in the handoff.

The handoff is the source of truth. Record meaningful milestones, blockers, security findings and verification results; do not log every command.

## Batch sequence

0. Architecture & Build Lock — architecture, domains, boundaries, trust/security model, environment/config, module structure, migration/testing strategy.
1. Identity & Student Foundation — Auth, profiles, roles/RBAC, onboarding, preferences, sessions/devices, RLS and authorization.
2. JAMB Season + Syllabus Engine — seasons, versioned exam configuration, composition/rules, syllabus hierarchy and activation/archive.
3. Question Intelligence & Content Pipeline — canonical questions, versions, answer mapping, media, provenance/rights, review/publish workflow and validation.
4. Learning + Practice Engine — Learning Mode, standard practice, deterministic randomization, explanations and performance persistence.
5. Mistake + Adaptive Intelligence — mistake bank, mastery, readiness, weakness/speed/mistake/adaptive modes and recommendations.
6. Production CBT Engine — authenticated E2E, recovery, timer, navigation, scoring, analysis and configured mock composition; remove legacy CBT after verification.
7. Revision + Flashcards + Audio — quick revision, flashcard review state, personalized revision and resilient audio.
8. Study Plans + Final Stretch — adaptive daily/weekly plans, deadlines, weak-area prioritization and final-stretch behavior.
9. AI + Knowledge/RAG — provider adapter, grounded retrieval, Gemini adapter, quotas, provenance and generated-content validation.
10. Admin Command Center — least-privilege operational control over content, students, monetization, referrals, AI knowledge, notifications, moderation and audit.
11. ACE Pass + Payments — ₦899 seasonal product, provider abstraction, Paystack adapter, server verification, webhooks/idempotency, entitlements and refund/reversal handling.
12. Referral Growth Engine — attribution, 5 qualified referrals, meaningful-usage qualification and server-side anti-abuse controls.
13. Notifications + Community — preferences, scheduling/targeting, push-capable delivery and real WhatsApp verification only where platform capabilities support it.
14. Security + Anti-Abuse Hardening — RLS/RBAC, rate limits, payment/referral/CBT/AI/upload/session abuse controls, secret exposure and PII review.
15. Performance + Offline + Accessibility — low-end Android, poor networks, cache correctness, media/bundle optimization, accessibility and reduced-motion support.
16. Full Integration / Release Candidate — complete student lifecycle plus failure/abuse/multi-device/admin scenarios.
17. Production Deployment — production configuration, migrations, functions, domain/HTTPS, PWA, monitoring, backups/recovery, webhooks and smoke tests.

## Batch 0 exit gate

Batch 0 is complete only when:

- Final architecture is documented and consistent with the canonical master handoff.
- Core domains and trust boundaries are explicit.
- Supabase is the locked backend direction; provider adapters isolate replaceable external services.
- Client-authoritative security decisions are prohibited by architecture.
- Browser configuration uses public environment variables; server/provider secrets are never browser configuration.
- Migration and service-boundary strategy is documented.
- Verification strategy and sequential batch gates are documented.
- The handoff records Batch 0 completion and the exact next gate.
- All Batch 0 changes are committed to `main`.

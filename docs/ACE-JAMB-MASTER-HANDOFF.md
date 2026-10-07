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
14. Readiness estimation
15. Adaptive recommendations
16. Personalized study/revision plans
17. Grounded AI tutoring and generation
18. Textbook/reference knowledge
19. Carefully sourced Internet retrieval
20. Seasonal paid access
21. Qualified referrals
22. Ñøvã community/channel connection
23. Notifications and admin announcements
24. Admin command center
25. Security, anti-abuse, observability and graceful degradation
26. PWA/mobile-first delivery

The product must remain usable, fast and useful even when heavy visual effects, AI, media or other non-core services are unavailable.

---

## 3. PERSONALIZED STUDENT SYSTEM

ACE JAMB must not behave like a generic question bank. The retained onboarding/profile direction includes, where useful and with minimal friction:

- Target JAMB score
- Intended institution
- Intended course
- Selected JAMB subjects
- Relevant learning preferences/progress
- Available preparation time where useful
- Exam season/deadline context

These values must drive the student's preparation experience rather than exist as decorative profile fields.

They should feed:

- Practice selection
- Learning recommendations
- Study/revision plans
- Weakness analysis
- Readiness tracking
- Final-stretch preparation
- Adaptive recommendations

---

## 4. JAMB SEASON + SYLLABUS ENGINE

The platform should be season-aware and syllabus-aware.

The content hierarchy is:

**Subject → Topic → Subtopic → Question**

This hierarchy must support:

- Learning recommendations
- Practice selection
- Weakness detection
- Revision
- CBT composition
- Analytics
- AI retrieval
- Readiness calculations
- Study plans

Current official JAMB composition/rules must be verified before launch. Exam configuration should be data/configuration-driven rather than permanently hard-coded.

---

## 5. PAST-QUESTION CONTENT SYSTEM

Past questions are a core product workload, not an optional add-on. They should integrate into Learning, Practice and CBT.

The platform must use a verified/quality-controlled content pipeline. Imported raw questions are **not automatically trustworthy**.

Quality/provenance metadata should cover, as applicable:

- Source/provenance
- Year/exam metadata
- Subject/topic/subtopic mapping
- Correct answer verification
- Explanation quality
- Duplicate detection
- Formatting/media validation
- Rights/licensing status
- Publication/review status

The system should support versioning and stable question identity.

---

## 6. QUESTION MODEL — NON-NEGOTIABLE FROM DAY 1

The canonical question model must support rich educational content from the beginning rather than retrofitting media later.

Questions, options, explanations and learning content may contain:

- Text
- Formulas
- Tables
- Diagrams
- Images
- Other supported media
- Accessibility metadata such as alt text
- Source/provenance metadata
- Rights/licensing metadata

Supported image formats should include PNG, JPEG, WebP and SVG where safe.

The model should support:

- Stable question identity
- Canonical answer mapping
- Subject/topic/subtopic mapping
- Difficulty
- Syllabus mapping
- Content versioning
- Media metadata
- Source/provenance
- Rights/licensing state

The canonical stored question and answer mapping must never be mutated merely because the UI randomizes presentation.

---

## 7. RANDOMIZATION — NON-NEGOTIABLE

Every new attempt/session should be able to randomize:

- Question order
- Option order

This applies across:

- Practice
- CBT
- Past Questions
- Learning/Answer modes with multiple questions
- Quick Revision question cards
- AI-generated practice

When a session is resumable, preserve enough seed/mapping/state to reproduce the presentation safely.

Randomization must never corrupt the canonical answer key.

---

## 8. LEARNING MODE

Learning Mode should:

- Teach syllabus-aligned concepts
- Explain concepts clearly and progressively
- Connect learning to relevant past questions
- Support formulas, diagrams, tables and rich media
- Use grounded AI assistance where appropriate
- Track learning progress
- Feed mastery/recommendation systems

---
## 9. PRACTICE SYSTEM

### Standard Practice

Support subject/topic/subtopic practice with:

- Randomized question order
- Randomized option order
- Explanations according to the selected mode
- Progress tracking
- Mastery tracking

### Advanced practice modes

Retained specialized modes include:

- **Weakness Mode** — targets weak topics/subtopics
- **Speed Mode** — targets response speed without sacrificing correctness
- **Mistake Mode** — targets previously incorrect questions/content
- **Repeated-Mistake Mode** — prioritizes recurring errors
- **Target/Readiness Mode** — practice selected to improve preparation readiness
- **Final-Stretch Mode** — increasingly focused preparation as the exam approaches
- **Adaptive Practice** — dynamically selects useful questions from actual performance

These modes should be driven by real student performance, not arbitrary random selection.

---

## 10. MISTAKE BANK

ACE should build a personal mistake/review bank.

Useful classifications include:

- Incorrect answer
- Repeated incorrect answer
- Slow answer
- Weak topic/subtopic
- Recently improved
- Needs revision

Thresholds and scoring rules should remain configurable rather than prematurely hard-coded.

---

## 11. CBT + REALISTIC FULL MOCKS

CBT is a core product experience.

Requirements:

- Timed exams
- JAMB-like exam experience
- Exam navigation
- Review controls
- Question/option randomization
- Reliable answer persistence
- Resume/recovery where appropriate
- Accurate scoring
- Correct subject/question composition according to the configured exam
- Post-exam analysis
- Historical comparison against the student's own performance

The system must handle timer edge cases, reloads and interrupted sessions safely.

Current official JAMB composition/rules must be verified before launch and configured from authoritative/current information rather than permanently hard-coded.

---

## 12. QUICK REVISION + FLASHCARDS

### Quick Revision

Fast topic-focused revision using concise content, question cards and/or flashcards.

Question cards should still obey the randomization rules where multiple questions are presented.

### Flashcards

Flashcards are a mandatory roadmap feature and should support:

- Syllabus/topic mapping
- Progress tracking
- Review history
- Personalized revision
- Randomized presentation where appropriate

---

## 13. AUDIO LEARNING

Audio learning is a retained roadmap feature.

It must be:

- Bandwidth-conscious
- Mobile-friendly
- Lazy-loaded where possible
- Resilient to media failure
- Capable of graceful fallback when audio cannot load

---

## 14. PERFORMANCE, MASTERY + READINESS ENGINE

Performance must cover more than a simple percentage score.

Retained metrics/directions include:

- Overall performance
- Subject performance
- Topic/subtopic weakness
- Accuracy
- Speed
- Repeated mistakes
- Progress over time
- Practice history
- CBT/mock performance
- Mastery tracking
- Readiness estimation
- Adaptive recommendations
- Final-stretch preparation

The system should answer questions such as:

- What should this student study next?
- What are their weakest areas?
- What mistakes keep repeating?
- Are they improving?
- Are they ready for the exam?
- What should they revise before JAMB?

**Important:** readiness is an internal preparation metric, not a scientifically precise or guaranteed JAMB score prediction.

---

## 15. PERSONALIZED STUDY / REVISION PLANS

The platform should eventually use:

- Target score
- Available preparation time
- Exam season/deadline
- Subject performance
- Weak topics
- Mistake history
- Practice history
- CBT history

to recommend what the student should study or practise next.

Final-stretch preparation should become more focused as the exam approaches while continuing to respect actual weak areas.

---

## 16. AI TUTOR + GROUNDED KNOWLEDGE ARCHITECTURE

ACE's AI is **not just a chatbot** and must not be an unrestricted generator.

### Retained AI capabilities

- AI tutor
- Concept diagnosis
- Explanation of difficult questions
- Weakness diagnosis
- Personalized revision guidance
- Study/revision plans
- Question generation
- AI-generated practice
- Adaptive recommendations
- Grounded retrieval from approved knowledge

### Intended knowledge sources

1. JAMB syllabus
2. Approved/authorized textbook/reference material
3. Platform-authored educational content
4. Structured past-question knowledge
5. Carefully sourced Internet content

### Grounding requirements

- Retrieve relevant evidence before answering where appropriate
- Preserve source/provenance metadata
- Prefer grounded answers over unsupported generation
- Acknowledge uncertainty when evidence is insufficient
- Internet sources should retain source URL and relevant retrieval metadata
- AI provider/model must sit behind an adapter so it can be replaced later
- AI-generated questions/content require validation
- AI-generated content must not automatically be treated as authoritative JAMB material

---

## 17. TEXTBOOKS + COPYRIGHT / RIGHTS-AWARE KNOWLEDGE PIPELINE

Do **not** build ACE as a wholesale mirror of copyrighted textbooks.

The knowledge system must be rights-aware:

- Use material the project has permission/right to use- Use legally permissible excerpts or derived knowledge where appropriate
- Store provenance and rights/licensing metadata
- Index knowledge for retrieval rather than exposing entire copyrighted books as a free mirror
- Provide admin review/takedown controls
- Distinguish platform-authored explanations from source-derived content

Rights must be audited before content ingestion.

---

## 18. GAMIFICATION

Gamification remains part of the retained roadmap.

It should encourage useful study behavior rather than become decoration.

Potential mechanisms include:

- Progress feedback
- Streak-style motivation
- Achievement-style feedback

Exact mechanics are not yet locked and should be finalized during UX design.

Gamification must not interfere with:

- CBT accuracy
- Accessibility
- Performance
- Student focus

---

## 19. PWA + MOBILE-FIRST DELIVERY

ACE JAMB is intended to be a **PWA/mobile-first web product**.

The experience should support installation and app-like usage without making native app-store distribution a Day-1 dependency.

A future Play Store/native-wrapper path may be considered after the web/PWA product is stable.

---

## 20. ACCESS + MONETIZATION

### ACE Pass

- **Current price direction: ₦899**
- One-time seasonal access for the active JAMB season
- Expires after the relevant season while the account/history can remain
- Payment entitlement must be verified server-side
- Payment provider is **not finally locked**

The earlier exploratory **₦800** price is superseded and must not be revived unless explicitly changed by the project owner.

### Free tier

The free tier should remain genuinely useful and naturally encourage upgrading.

Advanced personalization, deeper analytics and/or some AI/revision capabilities may be restricted to paid access after final product decisions.

### Referral access

Alternative access route: **5 qualified real-user referrals**.

A referral should count only after the referred student completes the defined qualification event(s), such as registration plus meaningful website usage.

A share/click alone must not count.

Prevent:

- Self-referral
- Duplicate-account farming
- Device/account farming
- Bots/fake accounts
- Obvious abuse

Referral qualification rules must be configurable.

---

## 21. PAYMENT + ENTITLEMENT ARCHITECTURE

The payment flow must support:

- Transaction verification
- Provider reference storage
- Entitlement activation
- Entitlement expiry
- Payment history
- Failed payment handling
- Duplicate transaction handling
- Webhook replay/idempotency
- Refund/reversal handling
- Admin visibility
- Server-side verification

Never trust a browser-only success state as proof of payment.

Earlier planning discussed **Paystack** and **Flutterwave**. No final provider has been locked. Do not silently choose one until the provider is selected.

---

## 22. ACCOUNT + CLOUD PROGRESS CONTINUITY

Student progress should persist across sessions/devices where the account is used.

This includes, where applicable:

- Profile
- Learning progress
- Practice history
- Mistake bank
- Flashcard progress
- CBT attempts
- Performance analytics
- Entitlements
- Referral progress
- Study recommendations

The implementation direction is Supabase. Earlier Firebase planning is superseded and must not be revived merely because the original roadmap mentioned it.

---

## 23. NOTIFICATIONS + COMMUNITY

### Notifications

Retained notification capabilities include:

- In-app notifications
- Admin announcements
- Targeted notifications
- Scheduled notifications
- User notification preferences
- Important system/product notifications
- Push-capable notifications

Earlier planning included **FCM** as the push-notification direction. Exact implementation remains part of the integration audit.

### Ñøvã community/channel

A Ñøvã community/channel CTA/connection point remains part of the roadmap.

This does **not** mean ACE should automatically post to WhatsApp.

Do not assume automatic WhatsApp posting.

The actual WhatsApp membership-verification mechanism is **UNDECIDED** and must be based on real integration capabilities. Never use a client-side "I joined" button as fake verification.

---

## 24. ADMIN COMMAND CENTER

The admin side should become a command center rather than a simple question uploader.

It should eventually provide visibility/control over:

- Students/accounts
- Subjects/syllabus/topics
- Question banks
- Question creation/editing/review/publish/unpublish
- Question quality
- Multimedia
- Provenance/rights
- Explanations
- Flashcards
- Audio
- Payments/entitlements
- Referral activity
- Notifications/announcements
- AI knowledge sources
- Reports/moderation
- Copyright/takedown workflow
- Product/usage analytics
- Security/abuse events
- Audit trail

Use least-privilege roles. Content editors should not automatically have full system-admin privileges.

Admin actions should be permissioned and auditable.

---

## 25. SECURITY + ANTI-ABUSE

Required principles:

- Row Level Security on protected data
- Least-privilege admin access
- Server-side payment verification
- Rate limiting where appropriate
- Referral abuse prevention
- Upload validation
- Media size/type limits
- Protection of privileged AI/admin endpoints
- Never trust client-submitted scores or entitlement state
- Minimize sensitive data collection
- Log important security/business events without excessive PII
- Graceful degradation when external services fail
---

## 26. OBSERVABILITY

Monitor important operational flows such as:

- Authentication
- Question loading
- CBT start
- CBT submit
- Scoring
- Payment verification
- Referral qualification
- AI requests
- Critical errors

Keep operational telemetry separate from student-facing analytics.

Avoid unnecessary sensitive data.

---

## 27. PERFORMANCE + BROWSER-AWARE DESIGN

The platform must work on low-end Android devices and poor/expensive networks.

Rules:

- One clear LCP element
- Preload/size critical media
- Keep non-critical JavaScript off the critical path
- Treat CSS as critical infrastructure
- Prefer transform/opacity animation
- Avoid layout shift
- Lazy-load heavy/secondary content
- Optimize images/audio
- Cache carefully without corrupting live CBT/session state
- 3D effects must never block core functionality
- Test on a real low-end Android phone

### Progressive 3D principle

The product should use depth, motion, layered surfaces and 3D elements where they strengthen identity, but core navigation, learning, CBT and accessibility must remain functional when heavy effects are disabled or unavailable.

---

## 28. INTENDED PRODUCTION ARCHITECTURE

### Source control

- **GitHub** = source of truth/version control

### Frontend

- **Cloudflare Pages** = intended frontend hosting/CDN

### Backend

- **Supabase** = core backend/data platform:
  - PostgreSQL
  - Authentication
  - Storage
  - Row Level Security
  - Edge Functions
  - Realtime where justified

### Provider-adapter rule

Infrastructure-specific services should sit behind clean service boundaries/adapters where practical, especially:

- Database/data access
- Authentication
- Storage
- Payments
- AI
- Search/retrieval
- Notifications/push
- Analytics/observability

The objective is to start cheaply while retaining a migration path as ACE grows.

### Explicit architecture corrections

Do **not** automatically use:

- Firebase as ACE's backend
- Netlify as the intended production frontend
- Cloudflare D1 as ACE's primary database
- AppDeploy as ACE's production foundation

Those earlier choices are superseded or historical.

---

## 29. DEDICATED SUPABASE ENVIRONMENT

- **Organization:** The ace team
- **Plan:** Free
- **Planned project:** NOVA ACE JAMB
- **Planned region:** eu-west-1
- **Previously checked creation cost:** $0/month

The project must remain separate from unrelated Supabase projects such as DROP, `nova-anonymous-session`, and Ñøvã pre CBT.

### Current verified Supabase state

- **Project:** `nova-ace-jamb`
- **Project ref:** `uokiqlgmzprqfbzmedaz`
- **Organization:** `The ace team` (`czginzwjoomzlwwxniyl`)
- **Region:** `ca-central-1`
- **Status:** `ACTIVE_HEALTHY` (verified 2026-10-06 after restore)
- **PostgreSQL:** 17.6.1.166
- **Admin account:** `petermayowa923@gmail.com` verified through `ace.is_admin`
- **Student account:** `lamilakes@gmail.com` verified

The earlier `eu-west-1 planned` statement is superseded by the actual verified project region above.

### Current backend foundation

Batch 2 backend work is already implemented and must not be treated as merely planned. This includes the academic/catalogue schema, exam configuration, syllabus-version structures, catalogue staging/publication flow, RLS/security boundaries, and IBASS catalogue staging/executor work.

Do not recreate the project or blindly rebuild the schema. Inspect the existing migrations and live state first.

---

## 30. DATABASE PRINCIPLES

- PostgreSQL
- Migrations/version control
- RLS
- Never expose service-role secrets in the browser
- Environment variables/secrets management
- Separate canonical content from presentation/session state
- Separate user progress from public content
- Index based on actual query patterns
- Provenance/audit metadata for editable content
- Security/performance advisory checks after major changes

### Likely data domains — PLANNING ONLY

These are not yet the final schema:

- Users/profiles
- JAMB seasons
- Subjects
- Syllabus topics/subtopics
- Questions
- Options
- Question media
- Question sources/provenance/rights
- Explanations
- Past-question metadata
- Learning content
- Flashcards
- Audio resources
- Practice sets
- CBT exams
- CBT attempts
- Attempt answers/review state
- Mastery/performance records
- AI knowledge sources/documents/chunks
- AI retrieval metadata
- ACE Pass entitlements
- Payment transactions/events
- Referral codes/referrals/qualification events
- WhatsApp/community gate state
- Notifications
- Admin announcements
- Reports/moderation/takedown records
- Audit/security events

Do not create all of these blindly. Finalize the schema after the requirements/asset/rights audit.

---

## 31. AUTHENTICATION

Supabase Auth is the current preferred foundation unless a later requirement explicitly justifies another provider.

Requirements:

- Minimal onboarding data
- No unnecessary sensitive information
- Separate authentication/security data from public profile data
- Persistent sessions appropriate for a PWA
- Account recovery
- Abuse controls
- Proper authorization/RLS

---

## 32. QA + HARDENING

Every major feature must be tested beyond a single successful desktop run.

Test:

- Real Android devices
- Slow/poor networks- Interrupted sessions
- Reloads
- CBT timer edge cases
- Randomization and answer-key integrity
- Duplicate payment callbacks
- Referral abuse
- RLS/unauthorized access
- Media failures/fallbacks
- AI with missing or contradictory evidence
- Accessibility basics
- Low-end performance

Run security/performance checks after significant database changes.

### Required development philosophy

Build sequentially:

1. Build a coherent feature group.
2. Test it.
3. Test it on a real phone.
4. Test edge cases.
5. Harden it.
6. Only then move to the next dependent phase.

Do not attempt to build all 50+ planned capabilities at once.

The system should remain usable throughout development.

---

## 33. EXISTING GITHUB REPOSITORY / BASELINE

Repository:

**`DarealNovaking/Nova-ace-jamb`**

The existing repository contains an earlier prototype baseline including AppDeploy-related work, authentication/profile foundation, subjects/topics/questions CMS, and a planned next phase around persistent CBT attempts, answers, scores and progress.

That prototype is historical/useful work and should not be discarded unnecessarily.

However, the current production architecture in this document takes precedence where it explicitly supersedes prototype infrastructure assumptions.

---

## 34. CURRENT PROJECT STATUS

| Area | Status |
|---|---|
| Product concept | Strongly defined |
| ACE vs Ñøvã CBT MAX separation | Confirmed |
| ACE vs DROP separation | Confirmed |
| Brand direction | Defined |
| PWA/mobile-first direction | Confirmed |
| Progressive 3D direction | Confirmed |
| Personalization direction | Confirmed |
| Past-question quality pipeline | Confirmed |
| Rich multimedia question model | Confirmed |
| Advanced practice modes | Confirmed |
| Mistake bank | Confirmed |
| Readiness engine | Confirmed |
| AI/RAG direction | Confirmed |
| Textbook/rights-aware pipeline | Confirmed |
| Gamification | Retained; exact mechanics open |
| ₦899 seasonal ACE Pass | Direction confirmed |
| 5-qualified-referral route | Direction confirmed |
| Supabase organization | The ace team |
| Supabase project | **Verified active:** `nova-ace-jamb` (`uokiqlgmzprqfbzmedaz`) |
| Supabase region | **Verified:** `ca-central-1` |
| GitHub repo | Exists: `DarealNovaking/Nova-ace-jamb` |
| Frontend hosting | **Cloudflare Workers/Pages pipeline verified; live preview deployed** |
| Database schema | Not final; audit first |
| Payment provider | **UNDECIDED** |
| WhatsApp verification mechanism | **UNDECIDED** |
| Exact AI provider/model | **UNDECIDED** |
| Retrieval/search provider | **UNDECIDED** |
| Embedding strategy | **UNDECIDED** |
| Final content/licensing inventory | **UNDECIDED** |
| Exact free-tier limits | **UNDECIDED** |
| Exact paid-tier limits | **UNDECIDED** |
| Exact ACE Pass expiry implementation | **UNDECIDED** |
| Exact referral qualification event | **UNDECIDED** |

---

## 35. CURRENT IMPLEMENTATION + BATCH 2 HANDOFF

**Last verified:** 2026-10-06

### Repository

- Repository: `DarealNovaking/Nova-ace-jamb`
- Main branch: `main`
- Active fix branch: `fix/admin-role-routing`
- Current PR: **#2 — `fix: route administrators to protected admin dashboard`**
- PR #2 is intentionally **not merged yet**.

### Batch 2 execution state

Batch 2 is being executed as:

1. **Kill 1 — Institutions**
2. **Kill 2 — Programmes + UTME combinations**
3. **Kill 3 — Syllabus**
4. **Final Batch 2 gate**

**Kill 1 — Institutions: COMPLETE and live-verified.** The live `ace.institutions` table is now **791 records**, matching the authoritative workbook exactly: 328 universities + 199 polytechnics + 264 colleges of education. No institutions were counted from the rejected staging batch. The final importer flow completed successfully and the database count was independently verified at 791.

### Institution source workbook

Verified source workbook: `nigeria_tertiary_institutions_phase1.xlsx`

- `INSTITUTIONS`: 791 rows × 10 columns
- Universities: 328
- Polytechnics: 199
- Colleges of Education: 264
- Authority groups: NUC 328 / NBTE 199 / NCCE 264
- Verification status: 703 Verified / 88 Needs Verification (Ownership/State)
- Missing values: 0 across the 10 columns
- Institution IDs unique: yes
- Institution names unique: yes

The workbook is the source of truth for Kill 1 and is **not committed to GitHub** unless explicitly requested.



### Kill 2 — Programme + UTME ingestion started (2026-10-06)

- Live baseline before Kill 2: `ace.programs` = **0**; `ace.program_utme_rules` = **0**.
- Official JAMB/IBASS public sources were re-verified: IBASS brochure-by-institution pages expose institution programme lists; the JAMB Eligibility Checker states English is selected by default and exposes the approved UTME subject set. Programme/subject data will remain source-derived; ambiguous alternatives are withheld rather than inferred. 
- Existing approved catalogue sources verified live: `JAMB IBASS programme endpoint` and `JAMB IBASS Programme Brochure Detail Pages`.
- Added secure RPC `ace.get_catalog_institutions()` to expose the imported institution catalogue to the authenticated Kill 2 executor without direct custom-schema PostgREST table access.
- Upgraded live `ibass-catalog-stage` to **v4**, JWT protected, bundle SHA **`360be6111d432648d1babbaf03f1f004f5c37f817b39a4cde478e844044a0524`**.
- v4 accepts **1–25 database institution UUIDs per run**, deterministically maps them to official IBASS institutions by normalized exact institution name, fetches IBASS programme data and brochure detail pages, stages programme records, and stages only unambiguous UTME subject rules through the hardened `catalog-import` v7 path. Unmatched/ambiguous institutions and subject requirements are returned as unresolved instead of guessed.
- A dedicated Git branch `feat/batch2-kill2-ibass-programmes` was created for Kill 2 work; no production merge has been made.
- **Kill 2 is NOT COMPLETE yet.** No programme/rule rows are counted until a real staging run is executed and the resulting records pass validate → approve → publish and live count verification.

**Next verification:** execute the v4 IBASS stage against a first 1–25-institution batch, inspect mapped/unresolved results, then proceed in batches only after the first batch is validated. Do not infer or fabricate unmatched IBASS mappings or UTME combinations.

### Current Batch 2 gate

- **Kill 1 Institutions:** COMPLETE — live count **791/791** verified on 2026-10-06.
- **Kill 2 Programmes + UTME combinations:** NOT STARTED. Live counts currently verified: `ace.programs` = **0**, `ace.program_utme_rules` = **0**.
- **Kill 3 Syllabus:** BLOCKED until Kill 2 is gated.
- **Batch 2 final gate:** BLOCKED until Kills 2 and 3 pass their verification gates.

**Next execution:** begin Kill 2 by inspecting the existing IBASS staging/executor path and importing authoritative programme records institution-by-institution, then stage only source-derived/unambiguous UTME subject rules. Do not infer programme combinations.

### Current importer

`src/components/AdminCatalogueImport.tsx` performs:

- admin session check
- `ace.rpc('is_admin')`
- XLSX parsing
- exact 791-row preflight
- unique ID/name validation
- NUC/NBTE/NCCE grouping
- approved `catalog_sources` lookup
- secured `catalog-import` Edge Function staging
- batch validation
- approval
- publication
- final exact 791-row database verification

The importer is intentionally fail-safe and stops before publication on validation errors.

### Admin routing / Cloudflare deployment

PR #2 fixes the admin-routing blocker discovered after the first Cloudflare deployment:

- `src/components/AdminFoundationGate.tsx` protects `/admin` and `/admin-import`.
- `StudentFoundationGate.tsx` routes authenticated administrators to `/admin`.
- Normal students remain in the student flow.
- Admin authorization uses `ace.rpc('is_admin')`.

Cloudflare first failed because `npx wrangler preview` required a `previews` block. This was fixed by adding `wrangler.jsonc` with the required `"previews": {}` configuration and SPA asset handling.

Cloudflare then reported **Build: Success** and **Deployment: Success** for commit `5d02b19`.

A second issue was discovered during mobile XLSX selection: Android file-picker interaction caused the admin gate to re-run because it listened to every auth-state event. The gate was changed to re-check only on `SIGNED_IN`/`SIGNED_OUT` events. Latest commit: **`dd42002`**.

Cloudflare verified for `dd42002`:

- **Build:** Success
- **Deployment:** Success
- Preview URL: `https://fix-admin-role-routing-nova-ace-jamb.novaking5002.workers.dev`

### Current XLSX importer test state

The user can reach the Admin Dashboard, but selecting the XLSX workbook on Android was still causing the page to return to the administrator-access validation state after the previous auth-event fix.

The previous mitigation (dd42002) was therefore **not sufficient** and Kill 1 remains blocked.

A stronger follow-up fix was implemented on the active admin-routing branch:

- Admin authorization in AdminFoundationGate is now intended to run once on mount rather than subscribe to Supabase auth-state lifecycle events.
- The gate includes protection against updating state after unmount.
- Latest follow-up fix commit: **42acb021d7345b2ec67a4999d43aeefcc65fb31d**.
- This fix still requires Cloudflare deployment and live Android XLSX end-to-end verification.- Expected successful flow: Admin Dashboard → Choose XLSX → Android file picker → select workbook → importer remains on the importer screen and proceeds to workbook reading/validation.

**New verified blocker — Edge Function request/CORS failure (2026-10-06):**

- After the Android XLSX flow progressed past the previous admin-routing loop, the importer reached the first NUC staging request.
- The live UI reported: **“NUC staging failed: Failed to send a request to the Edge Function.”**
- Inspection of the deployed `catalog-import` v2 showed that its browser-facing response path had **no CORS headers and no OPTIONS preflight handler**.
- This is consistent with Supabase's documented browser-side Edge Function fetch failure mode when CORS/preflight handling is missing.
- `catalog-import` was redeployed with CORS headers and an `OPTIONS` handler as **version 3**:
  - bundle SHA: **26571842ffcfff3bd55824e93f2ac4ddd81dc5fec528174ffc32ff6461da00fc**
- `ibass-catalog-stage` was also proactively redeployed with the same browser CORS/preflight handling as **version 3**:
  - bundle SHA: **0ba846b63d099b54152665b9ce7332fb45e24907a028cdb0c3d05415b0886709**
- Both functions remain **ACTIVE** with JWT verification enabled.
- Live `ace.institutions` count remains **0** after this failed attempt.
- The importer has **not** been marked complete.
- The next verification gate is a fresh live Android XLSX run. Do not retry blindly or count Kill 1 complete until the NUC staging request succeeds and the final database count reaches exactly 791.

**Do not claim the XLSX loop is fixed until that live test succeeds.**
**Do not claim the 791 institutions were imported until the database verification reports exactly 791 records.**
**New verified diagnostic blocker — non-2xx staging response (2026-10-06):**

- After the CORS/preflight fix, the Android XLSX flow no longer fails with the generic browser transport error.
- The live importer now reaches `catalog-import`, but the function returns a **non-2xx HTTP response** during the NUC staging request.
- This confirms the workbook is being read/preflighted successfully and the failure is now inside the staging request path or its server-side authorization/data checks.
- The uploaded workbook was re-verified: 791 `INSTITUTIONS` rows; NUC 328 / NBTE 199 / NCCE 264; no missing cells; unique institution IDs and names.
- The live `ace.catalog_sources` table was also verified to contain the approved NUC institutional authority source.
- No new institution rows were published; `ace.institutions` remains unverified for import completion and Kill 1 remains blocked.
- The importer previously exposed only `error.message`. A diagnostic UI change was committed on the active branch as **`b6575b39aac277b24de747eeff3ab87131cbd79d`**.
- The diagnostic change now reads the Edge Function HTTP status and response body from the Supabase Functions error context, so the next test should reveal the actual server-side error instead of the generic non-2xx message.
- Next gate: deploy/verify the diagnostic frontend, run the NUC import once, capture the exact HTTP status/body, fix the underlying server-side cause, then re-run the complete 791-row import and verify the final database count is exactly 791.

**Do not replace/recreate the workbook based on the current error. Current evidence does not indicate a workbook defect.**

**Root cause isolated and backend fix deployed (2026-10-06):**

- The diagnostic run exposed the exact failure: **HTTP 500 `{"error":"Unable to verify permissions"}`** during NUC staging.
- The failing path was the Edge Function's server-side PostgREST lookup of `ace.roles` through the service-role client. The database itself is correct: the admin account has an `ace.roles` row with role `admin`.
- To remove this custom-schema permission drift from the authorization path, a new security-definer RPC was added:
  - `ace.can_manage_catalog()`
  - returns true only when `auth.uid()` has role `admin` or `editor`
  - executable by `authenticated` only
  - `search_path` is pinned to `ace, public`
- `catalog-import` now performs its permission decision through the authenticated caller's JWT context using `userClient.schema("ace").rpc("can_manage_catalog")`, while retaining the service-role client only for privileged catalog writes/reads.
- CORS/preflight handling remains enabled.
- Live deployment: **catalog-import v4**, bundle SHA **`0a41d6b16c59c6fc5960c62be578e730296d43ec2d76b8d7161bfe9fd48f4a20`**.
- Repository commits on the active branch:
  - importer fix: **`173506568c89ddb31a8fa01ab4f9cd227ec4e50a`**
  - migration record: **`ad2ea8949a5ec34cca35574acb1460025c083655`**
- The workbook remains verified and unchanged.
- No institutions have been published; Kill 1 remains blocked until a fresh live import completes and the final database count is exactly **791**.

**Next verification:** run the same XLSX import once against the newly deployed `catalog-import v4`. If NUC staging succeeds, continue through NBTE/NCCE and the existing validate → approve → publish → exact-count gate. If another error appears, capture its exact status/body before changing the workbook or data.
**Follow-up root cause isolation — catalog source lookup (2026-10-06):**

- The next live diagnostic reached permission verification successfully but then failed at the Edge Function's catalog-source lookup with **HTTP 500 `{"error":"Unable to load catalog source"}`**.
- Live database verification confirms the required NUC institutional source exists and is `approved`.
- The importer was changed again to resolve the source through a security-definer RPC, `ace.get_catalog_source(uuid)`, using the authenticated caller's JWT context instead of the failing direct custom-schema PostgREST lookup.
- Live `catalog-import` deployment is now **v5**, bundle SHA **`3231374c414b83912fce6b96c731ae90e80c4c9bea3981c14b37db6f741a3978`**.
- Repository commits: importer fix **`73ba928e4c88c672b719f5243d0a91a8bec69c93`**; migration record **`75367dd71de8b332e4f22914b7220b2e01ba95b9`**.
- Workbook remains unchanged and verified. No institutions have been published; Kill 1 remains blocked.

**Next verification:** run the same workbook once against `catalog-import` v5. If NUC staging succeeds, continue the existing validation → approval → publication → exact-count gate. Do not recreate the workbook.
**Follow-up root cause isolation — import idempotency lookup (2026-10-06):**

- The next live diagnostic reached catalog-source loading successfully but failed at the following server-side step with **HTTP 500 `{"error":"Unable to check import idempotency"}`**.
- Database inspection showed the custom `ace` tables did not expose explicit `service_role` table grants in `information_schema.role_table_grants`; the Edge Function's direct service-role PostgREST lookup of `ace.catalog_import_batches` was therefore another fragile custom-schema access path.
- Added security-definer RPC `ace.check_catalog_import_idempotency(text)` for authenticated callers. It checks `ace.catalog_import_batches` by `snapshot_hash` without relying on direct PostgREST table access from the Edge Function.
- `catalog-import` now uses this RPC for idempotency checking.
- Live deployment: **catalog-import v6**, bundle SHA **`5f5b09f40abd8d3f7a437a07cd04b9394b7280aa13220c33d7e8f76ce19e92c2`**.
- Repository commits: importer fix **`944ab1c4e4fe81843ba52f96c910f8290b5cc35a`**; migration record **`9c1931961ae5abe172676a5577b0d7393f065381`**.
- Workbook remains verified and unchanged. No institutions have been published; Kill 1 remains blocked.

**Next verification:** run the same workbook once against `catalog-import` v6. If idempotency succeeds, the next gate is batch creation/row staging; capture any further exact status/body before changing the workbook.
**Follow-up root cause isolation — import batch creation (2026-10-06):**

- The next live diagnostic reached idempotency successfully but failed when the Edge Function attempted to create `ace.catalog_import_batches`: **HTTP 500 `{"error":"Unable to create import batch"}`**.
- The staging Edge Function previously mixed authenticated-RPC checks with direct service-role PostgREST writes into the custom `ace` schema. The latter is fragile because the custom schema's API privileges are intentionally restricted.
- Reworked staging into one transactional security-definer RPC: `ace.stage_catalog_import(...)`.
- The RPC now performs, atomically: admin/editor authorization, dataset/row-count validation, approved-source validation, season validation, snapshot idempotency, batch creation, and all catalog-row inserts.
- `catalog-import` v7 now calls only the secure staging RPC for batch/row creation; direct service-role table writes were removed from this staging path.
- Live deployment: **catalog-import v7**, bundle SHA **`1375dfc3a777e6376516851dee00e3ae564a7b082063bd52f7bfb7e2b13dfd47`**.
- Repository commits: importer refactor **`a6d5a7b0cd1cbdb520c89eb87973c698cf2d19c7`**; migration record **`d7904b93964d0ac936be3311bf14d10b810e183c`**.
- The workbook remains verified and unchanged. No institutions have been published; Kill 1 remains blocked.

**Next verification:** run the same workbook against `catalog-import` v7. If staging succeeds, the existing `validate_catalog_batch` → `approve_catalog_batch` → `publish_catalog_batch` sequence is already implemented as security-definer database functions. Capture any new exact status/body if a later gate fails.
**Kill 1 institution import — VERIFIED COMPLETE (2026-10-06):**

- Live `ace.institutions` count is **791**.
- Composition matches the verified Phase 1 workbook exactly: **328 universities + 199 polytechnics + 264 colleges of education = 791**.
- Published institution import batches are all complete: NUC **328/328**, NBTE **199/199**, NCCE **264/264**.
- Data-quality verification: **0 missing names, 0 missing institution types, 0 missing ownership values, 0 missing states, 791 distinct institution names**.
- The previously rejected 791-row batch remains rejected and was not counted. The three successful authority batches are the ones that produced the live 791-record dataset.
- Kill 1 is therefore **gated as complete**. Batch 2 may proceed to Kill 2 (programmes + UTME combinations).
### Supabase Edge Functions

Verified functions include:

- `ibass-catalog-stage` — ACTIVE, **version 3**, JWT verification enabled; latest bundle SHA `0ba846b63d099b54152665b9ce7332fb45e24907a028cdb0c3d05415b0886709`
- `catalog-import` — ACTIVE, **version 3**, JWT verification enabled; latest bundle SHA `26571842ffcfff3bd55824e93f2ac4ddd81dc5fec528174ffc32ff6461da00fc`

The browser-facing staging boundary now explicitly handles CORS preflight and returns the required CORS headers.

The institution importer uses `catalog-import`; IBASS programme ingestion uses the separate IBASS staging executor.

### IBASS / academic catalogue work already completed

Batch 2 backend work includes:

- verified IBASS endpoint registration
- deterministic IBASS brochure adapter
- packaged IBASS staging adapter/executor
- staging only unambiguous programme/UTME rules
- preservation of unresolved/alternative requirements
- delegation through `catalog-import`

Do not start programme ingestion until Kill 1 is actually gated as complete.

### Batch 2 gate rule

**IMPLEMENT → VERIFY → DOCUMENT → COMMIT → GATE**

Do not begin Kill 2 until Kill 1 is verified and documented. Do not begin Batch 3 until the complete Batch 2 gate is passed.

## 36. PRE-BUILD GAP AUDIT — MUST HAPPEN BEFORE SCHEMA IMPLEMENTATION

Before writing production code or creating the final database schema, identify every genuinely missing decision, asset, content source, integration choice, rights issue and requirement.

### Product decisions

- Launch subjects
- Launch scope vs post-launch scope
- Free-tier limits
- Paid-tier limits
- Exact ACE Pass expiry behavior
- Exact referral qualification event
- Student-facing analytics
- Admin-facing analytics
- Exact gamification mechanics if needed for launch

### Content

- Which years of past questions are available?
- Which past questions are legally usable?
- Where does the first question bank come from?
- What syllabus/reference files are available?
- What explanations already exist?
- What flashcard content exists?
- What audio content exists?
- What diagrams/images already exist?

### AI

- First AI provider/model
- AI budget/free-tier strategy
- Retrieval/search provider
- Embedding strategy
- Knowledge refresh strategy
- Citation/source display behavior
- Fallback behavior when AI/search is unavailable
- Validation workflow for generated questions/content

### Integrations

- Payment provider
- WhatsApp/community destination
- WhatsApp verification approach
- Email/push/in-app notification approach
- Analytics/observability provider if needed

### Admin

- Initial admin accounts/roles
- Content-review workflow
- Copyright/takedown workflow
- Moderation/reporting requirements

### Legal/rights

- Rights/permission status for each supplied textbook/content source
- Rights for question-bank sources
- Rights for images/diagrams/audio

**Do not guess unresolved decisions.** Mark them undecided and ask only the questions needed to lock them.

---

## 37. ASSET + MEDIA CHECKLIST

Ask the project owner to provide existing assets that are actually available:

- Final ACE JAMB logo — preferably SVG + transparent PNG
- Favicon/app icon
- Exact HEX palette if already fixed
- Font choices/licensing information
- Existing 3D/background assets
- Past-question CSV/XLSX/PDF/DOCX files
- Syllabus/reference files
- Authorized textbook/reference files
- Formula sheets
- Question diagrams/images- Audio lessons/recordings
- Existing explanations
- Existing flashcards
- Existing prototype/source files
- Existing content spreadsheets
- Licensing/permission notes

**Never ask for passwords, payment-card numbers, private API keys or other secrets.** Those belong in secure secret-management systems.

---

## 38. RECOMMENDED IMPLEMENTATION SEQUENCE

### Phase 0 — Requirements / assets / rights

1. Complete product gap audit.
2. Collect available assets.
3. Audit content sources and rights/licensing.
4. Lock launch scope and free/paid boundaries.

### Phase 1 — Infrastructure foundation

5. Create/verify the dedicated Supabase project.
6. Confirm GitHub repository/branch strategy.
7. Lock architecture/service boundaries.
8. Set up environments/secrets safely.
9. Design and review the final data model.

### Phase 2 — Database / security foundation

10. Implement migrations.
11. Implement RLS.
12. Add required indexes/constraints.
13. Add audit/provenance structures.
14. Run security/performance checks.

### Phase 3 — Student foundation

15. Build authentication.
16. Build onboarding/profile.
17. Build target score/institution/course/subject context.
18. Build account/cloud continuity.

### Phase 4 — Academic structure

19. Build JAMB season engine.
20. Build subjects.
21. Build syllabus topics/subtopics.
22. Build question taxonomy/intelligence.

### Phase 5 — Content engine

23. Build canonical rich question model.
24. Build media support.
25. Build provenance/rights metadata.
26. Build review/publish workflow.
27. Import and validate the first legal question dataset.
28. Validate explanations and content quality.

### Phase 6 — Learning / practice

29. Build Learning Mode.
30. Build standard Practice Mode.
31. Build question/option randomization.
32. Build weakness/speed/mistake practice.
33. Build mistake bank.
34. Build mastery/performance tracking.

### Phase 7 — CBT

35. Build CBT engine.
36. Build persistent attempt state.
37. Build timer/navigation/review.
38. Build scoring.
39. Build realistic full mocks.
40. Build post-exam analysis.

### Phase 8 — Revision / media learning

41. Build Quick Revision.
42. Build Flashcards.
43. Build Audio learning.

### Phase 9 — AI / knowledge

44. Select AI provider/model.
45. Select retrieval/search provider.
46. Implement knowledge ingestion/indexing.
47. Implement grounded retrieval.
48. Build AI tutor/explanations.
49. Build diagnosis/revision plans.
50. Build AI-generated practice/question generation with validation.
51. Implement graceful AI/search fallback.

### Phase 10 — Admin / operations

52. Build admin command center.
53. Build content management/review.
54. Build provenance/rights/takedown workflow.
55. Build moderation/reporting.
56. Build admin analytics.
57. Build audit/security-event visibility.

### Phase 11 — Monetization / community / notifications

58. Select and integrate payment provider.
59. Implement server-side transaction verification.
60. Implement ₦899 seasonal ACE Pass entitlement lifecycle.
61. Implement referral codes/qualification/anti-abuse.
62. Implement community/channel CTA.
63. Implement honest WhatsApp verification only if technically supported.
64. Implement in-app/admin/targeted/scheduled notifications.
65. Implement push notification path if selected.

### Phase 12 — Hardening / launch

66. Security hardening.
67. Anti-abuse hardening.
68. Performance optimization.
69. Low-bandwidth testing.
70. Low-end Android testing.
71. Accessibility checks.
72. Interrupted-session/CBT edge-case testing.
73. Payment/referral abuse testing.
74. AI retrieval failure testing.
75. Real-device QA.
76. Beta release.
77. Monitor and iterate.

---

## 39. FREE-FIRST ECONOMICS + SCALING

Strategic principle:

**Start at ₦0 infrastructure cost where practical, use free tiers aggressively without underbuilding the architecture, then use revenue to fund better infrastructure/features.**

However, production architecture must not assume every provider remains free forever.

Known future cost areas include:

- AI usage
- Search/retrieval
- Payment transaction fees
- Higher infrastructure usage
- Custom domain/paid services
- Large-scale media/storage/bandwidth
- App-store distribution if a native wrapper is later pursued

Provider adapters/service boundaries are therefore important from the beginning.

---

## 40. EXPLICITLY DROPPED / SUPERSEDED — DO NOT REVIVE

### Firebase as ACE backend

**Dropped/superseded.** Current backend direction is Supabase.

### Netlify as ACE production frontend

**Superseded.** Current direction is GitHub → Cloudflare Pages → Supabase.

### Cloudflare D1 as ACE primary database

**Not current.** D1/Workers experimentation belongs to separate context and must not replace Supabase for ACE unless explicitly reconsidered.

### AppDeploy as ACE production foundation

**Not current production infrastructure.** The AppDeploy prototype is historical/useful work and should not be treated as the final backend/hosting decision.

### Automatic WhatsApp posting

**Not retained.** Community CTA remains; automatic posting must not be assumed.

### ₦800 price

**Superseded by ₦899 seasonal ACE Pass.**

### Anything specifically belonging to Ñøvã CBT MAX or DROP

**Excluded.** Their product-specific implementation decisions, pricing, databases, branding and roadmaps must not be imported into ACE JAMB.

---

## 41. FINAL RETAINED ACE JAMB CAPABILITY MAP

The complete retained capability set is:

- PWA/mobile-first experience
- Premium futuristic/progressive-3D UI
- JAMB season engine
- JAMB syllabus engine
- Personalized onboarding/profile
- Target score/institution/course/subject context
- Subject → topic → subtopic → question intelligence
- Verified/quality-controlled past-question bank
- Rich multimedia question model
- Learning Mode
- Practice Mode- Weakness practice
- Speed practice
- Mistake/repeated-mistake practice
- CBT mode
- Realistic full mocks
- Quick Revision
- Flashcards
- Audio learning
- Performance analytics
- Mastery tracking
- Mistake bank
- Speed/accuracy analytics
- Readiness estimation
- Adaptive recommendations
- Final-stretch preparation
- Personalized study/revision plans
- Grounded AI tutor
- AI diagnosis
- AI explanations
- AI question generation
- AI-generated practice
- Textbook/reference knowledge system
- Internet-source retrieval
- Copyright/rights-aware knowledge pipeline
- Account/cloud progress continuity
- ₦899 seasonal ACE Pass
- Payment verification and entitlement history
- 5 qualified real-user referral route
- Ñøvã community/channel CTA
- Push/in-app/targeted/scheduled notifications
- Admin announcements
- Admin command center
- Security
- Anti-abuse
- Observability
- Graceful degradation
- Provider adapters
- Sequential QA/hardening
- Low-bandwidth/low-end-device optimization

---

## 42. IMMEDIATE HANDOFF INSTRUCTION FOR A NEW CHATGPT ACCOUNT

Use this instruction when moving ACE JAMB to another account:

> **I am continuing my project ÑØVÃ ACE JAMB. The attached/pasted document is the canonical master handoff from my previous ChatGPT account. Read it as the current project context. ACE JAMB is separate from Ñøvã CBT MAX and DROP. Before writing code or creating database tables, perform a complete pre-build gap audit: identify every missing decision, asset, media file, content source, licensing issue, integration choice and requirement. Do not guess unresolved decisions. Do not claim external resources were created unless verified. After the audit, give me the final locked architecture and implementation sequence.**

---

## 43. CANONICAL RULE

**This file is the single source of truth for the retained ACE JAMB plan.**

If another ACE JAMB planning document conflicts with this file, use this file as the starting context and resolve any genuinely newer decision explicitly rather than silently reviving superseded choices.

When this file is updated, update this file rather than creating another parallel ACE JAMB handoff/addendum unless a separate document has a genuinely different purpose.


### Kill 2 continuation — verified execution prerequisites and admin runner (2026-10-06)

- Re-verified live Supabase season state before programme ingestion:
  - **JAMB UTME 2026** (`jamb-2026`) is closed.
  - **JAMB UTME 2027** (`jamb-2027`) is draft and is the current target season for the Kill 2 catalogue ingestion.
  - Target season ID: `23fc8eb7-2d2e-474f-b4db-c0a69f22cd62`.
- Re-verified the approved IBASS catalogue sources:
  - Programme endpoint source: `16388e42-7bed-4541-89ff-8ffb0e648425`.
  - Programme brochure detail source: `9959f7d6-0071-4ab3-880c-a79f3c81e561`.
  - Institution hierarchy source: `a92b9d45-a123-4daf-9350-7b362fb72e32`.
  - IBASS eligibility source: `5fecefe2-fdbc-4b91-9b0d-494846888505`.
- Re-verified the secure catalogue RPC surface:
  - `ace.get_catalog_institutions()`
  - `ace.stage_catalog_import(...)`
  - `ace.validate_catalog_batch(uuid)`
  - `ace.approve_catalog_batch(uuid)`
  - `ace.publish_catalog_batch(uuid)`
- Live `ibass-catalog-stage` is **v4**, JWT-protected, bundle SHA `360be6111d432648d1babbaf03f1f004f5c37f817b39a4cde478e844044a0524`.
- Created the guarded admin runner on branch `feat/batch2-kill2-ibass-programmes`:
  - `src/components/AdminIBASSProgrammeImport.tsx`
  - processes at most 25 institutions per user-triggered batch
  - invokes `ibass-catalog-stage` with the authenticated admin session
  - validates → approves → publishes both programme and UTME-rule batches
  - stops safely on errors
  - does not infer ambiguous UTME combinations
  - branch commits: `ca320c179416692fa088b69ac3c82bf7c05c7c04` and `4fe72ef0cc9e54e7fb1384237ccb720ccd0cd0ef`
- The runner is exposed from `/admin-import` on the Kill 2 branch.
- **Kill 2 is NOT yet gated complete.** No programme/rule publication is claimed yet. The next verified action is to deploy/open the Kill 2 branch and run the first 1–25 institution batch while authenticated as the admin account, then inspect the exact returned mapped/unresolved/programme/rule counts and live database counts.
- Local build verification could not be performed in this environment because outbound GitHub DNS/network access is unavailable; do not mark the branch build verified until CI or a local/Codespaces build succeeds.


### Kill 2 continuation — live execution gate preparation (2026-10-07)

- Re-inspected the canonical handoff and current repository state before continuing Kill 2.
- Confirmed branch `feat/batch2-kill2-ibass-programmes` contains the guarded `AdminIBASSProgrammeImport` runner and exposes it at `/admin-import`.
- Created PR #3: `feat(batch-2): add guarded IBASS programme and UTME ingestion runner` targeting `main`.
- PR #3 was intentionally created as draft first, then marked ready for review so repository verification workflows would execute.
- Current head commit: `4fe72ef0cc9e54e7fb1384237ccb720ccd0cd0ef`.
- GitHub Actions verification is currently running for both **Verify** and **ACE JAMB E2E**. At the latest check, dependency installation was still in progress; no success/failure is claimed yet.
- No production merge has been made and no programme/UTME-rule rows have been claimed as published.
- **Next gate:** wait for CI/E2E results; if green, proceed to the live authenticated admin execution path for the first 1–25 institution batch. If CI fails, fix the exact failure before any merge or catalogue publication.

### Authentication routing fix — admin role redirect (2026-10-07)

- Root cause confirmed in `main`: `src/main.tsx` was hard-wired to render `StudentFoundationGate`, so every authenticated user entered the student flow regardless of role.
- Supabase role RPC `ace.is_admin()` exists and returns boolean; the live admin account `petermayowa923@gmail.com` is already assigned the `admin` role.
- Implemented the smallest role-aware routing fix on branch `fix/admin-routing-main`:
  - Added `src/components/AdminFoundationGate.tsx` with authenticated-session verification and server-side `ace.is_admin()` authorization.
  - Updated `src/components/StudentFoundationGate.tsx` to check `ace.is_admin()` immediately after authentication and redirect administrators to `/admin` before student device registration/onboarding.
  - Updated `src/main.tsx` so both `/admin` and `/admin-import` use the protected admin gate instead of exposing the importer directly.
- This preserves student onboarding for non-admin users and keeps admin/importer access behind the database role check.
- Branch commits: `51412011ebe8aaec7b5a67631614cd41a7fe4726`, `f4cae2cf800fc0fa2d116b9a5596b7e3baa1efc0`, `010667f37411daac7a8f60407a297d4b814e8a46`.
- Verification performed: repository source inspection confirmed the previous hard-wired student root; Supabase inspection confirmed `ace.is_admin()` exists; branch source now contains the role check and protected admin route. CI/browser verification is still required before merging/deployment.
- **Required user action:** after the branch preview is deployed, sign in once with the admin account and confirm that the app automatically lands on `/admin` and shows **Admin Dashboard / Administrator**. Do not start Kill 2 publication until this auth-routing gate passes.
- **Next step:** run GitHub Verify + E2E on the fix branch, then perform authenticated browser verification before merge.


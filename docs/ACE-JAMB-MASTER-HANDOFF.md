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

- Use material the project has permission/right to use
- Use legally permissible excerpts or derived knowledge where appropriate
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
- Slow/poor networks
- Interrupted sessions
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
- This fix still requires Cloudflare deployment and live Android XLSX end-to-end verification.
- Expected successful flow: Admin Dashboard → Choose XLSX → Android file picker → select workbook → importer remains on the importer screen and proceeds to workbook reading/validation.

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
- Question diagrams/images
- Audio lessons/recordings
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
- Practice Mode
- Weakness practice
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



## 2026-10-12 — Admin routing fix merged; live verification pending

- **Root cause confirmed:** `main` routed the default application to `StudentFoundationGate` and had no dedicated routing for `/admin` or `/admin-import`, so an authenticated administrator could fall into the student flow.
- **Change merged:** PR [#4](https://github.com/DarealNovaking/Nova-ace-jamb/pull/4), squash commit `1c013517a7ad818f33ea5f987e00df4d22c772c2`. It adds `AdminFoundationGate`, checks the admin role through `ace.rpc('is_admin')`, routes `/admin` and `/admin-import` through the protected gate, and checks admin role before student onboarding.
- **Files in PR:** `src/main.tsx`, `src/components/AdminFoundationGate.tsx`, `src/components/StudentFoundationGate.tsx`, and this handoff.
- **Verification:** Before merge, GitHub Verify run 178 and ACE JAMB E2E run 107 passed on PR head `6841f3968ea8e84bf7e9820fd02e9245cc6dcbb1`. After merge, main-branch Verify run 179 and ACE JAMB E2E run 112 started on merge commit `1c013517a7ad818f33ea5f987e00df4d22c772c2`; final results were not yet available at the time of this note.
- **Security/data integrity:** Supabase `ace.is_admin()` exists and is executable by authenticated users; it is a `SECURITY DEFINER` function checking `ace.roles` against `auth.uid()`. The SQL inspection connection does not carry the administrator's JWT, so it cannot confirm the current browser user's role.
- **Not yet verified:** authenticated browser login/redirect on the live Cloudflare deployment, direct access to `/admin` and `/admin-import`, and deployed commit/version. No importer was run and no catalogue data was written.
- **Next actions:** wait for the post-merge Verify/E2E runs to finish; confirm Cloudflare deploys the merge commit; then test using the existing admin account: sign in, confirm redirect to `/admin`, open `/admin-import`, and confirm a non-admin cannot access either admin route. Keep Kill 2 import blocked until these checks pass.


## 2026-10-12 — Root cause of persistent admin-routing failure confirmed from live Supabase logs

- **Confirmed root cause:** The user tested the production Worker at `https://nova-ace-jamb.novaking5002.workers.dev` after the routing code had been merged to GitHub `main`, but the Worker was still serving the older frontend bundle. Supabase edge logs for the production Worker show successful password login (`/auth/v1/token`, HTTP 200), then student-flow requests (`/rest/v1/devices`, `/rest/v1/profiles`, `/rest/v1/student_preferences`, `/rest/v1/student_subjects`) and no `/rest/v1/rpc/is_admin` call for that root Worker. By contrast, the branch preview at `https://fix-admin-role-routing-nova-ace-jamb.novaking5002.workers.dev` did call `/rest/v1/rpc/is_admin` and received HTTP 200. This is direct evidence of a stale production deployment, not a missing admin row in the inspected database.
- **Database identity check:** the intended admin email maps to exactly one active Supabase Auth user, and that exact user's UUID has one `admin` role row. The `ace.is_admin()` function exists and authenticated execution is permitted. No role/account reset or SQL data change was made.
- **Why the previous merge did not resolve the live site:** `main` did not contain `wrangler.jsonc`, and the only GitHub Actions workflows were Verify and E2E—there is no main-branch Cloudflare deploy workflow. Merging source code alone did not publish the new Worker bundle.
- **Changes now committed on `main`:** added `wrangler.jsonc` for Worker `nova-ace-jamb`, static assets from `./dist`, SPA fallback, and preview configuration (commit `adce107718801672071a74848e4b93e20d1c05fe`); changed `StudentFoundationGate` to re-run auth routing only on `SIGNED_IN`, `SIGNED_OUT`, and `PASSWORD_RECOVERY` instead of every auth lifecycle event (commit `4d6fe2f1993630cbbb16b8acb99a90c546425bae`).
- **Verification:** The prior merge commit's Verify and E2E passed. New Verify and E2E runs are in progress for both commits from these follow-up changes. Source/config presence was re-read from `main`. Live production still needs a fresh deployment and post-deploy authenticated verification.
- **Required deployment action:** There is no Cloudflare deployment connector or GitHub deploy workflow available in this repository. After the latest `main` checks pass, build the app with the correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` environment, then run `npx wrangler deploy` from the repository root while authenticated to the Cloudflare account. The Wrangler config targets the production Worker name `nova-ace-jamb`; do not deploy the branch-preview Worker as the final fix.
- **Post-deploy acceptance criteria:** production root sign-in must trigger `POST /rest/v1/rpc/is_admin`; for the admin session it must return true and navigate to `/admin`; direct `/admin` and `/admin-import` must allow the admin and deny a non-admin. Verify on `nova-ace-jamb.novaking5002.workers.dev`, not only the `fix-admin-role-routing` preview URL. Keep all catalogue import work blocked until this passes.
- **Known failed approach:** repeatedly merging/changing routing source without checking the deployed Worker left the production Worker on stale code. Future admin-routing investigations must compare production Supabase logs against branch preview and verify the deployed commit/bundle before changing role data.

## 2026-10-12 — Follow-up after user's latest production retest

- **CI verification:** the main-branch Verify run (38199712420) and ACE JAMB E2E run (38199712440) both completed successfully. Verify passed typecheck and build; E2E passed its Playwright browser tests.
- **Production remains unresolved:** fresh Supabase edge logs show successful password-auth responses from the production Worker at 03:38 and 03:40 UTC, but no corresponding `/rest/v1/rpc/is_admin` request from that production origin. The branch-preview origin called `/rest/v1/rpc/is_admin` repeatedly and received HTTP 200. This reinforces that production is still serving a bundle/configuration that does not perform the new admin check; it is not evidence of a broken admin role row.
- **Blocker:** no production deployment has been verified. The repo contains the Wrangler static-assets config, but there is no GitHub Actions deployment workflow and no direct Cloudflare deployment connector available through the current repository tools.
- **Next action:** inspect the existing Cloudflare account's Worker deployment/build settings through the user's authenticated browser session, then publish the verified `main` build to the production Worker `nova-ace-jamb`. Do not ask for or handle the user's password in chat. Do not deploy the preview Worker as production.
- **Acceptance test:** after deployment, sign-in from the production origin must produce a successful `/rest/v1/rpc/is_admin` request and route the admin to `/admin`; `/admin-import` must recognize the admin session. Also verify non-admin denial. Keep Kill 2 importer paused until live acceptance passes.


## 2026-10-12 — Added a guarded GitHub Actions production deploy path

- **Change:** added `.github/workflows/deploy-production.yml`. It runs for relevant pushes to `main` and can be manually dispatched. It checks out the repository, validates required deployment secrets, installs dependencies, runs typecheck/build, and deploys using the existing `wrangler.jsonc` target (`nova-ace-jamb`).
- **Required GitHub Actions secrets:** `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_PUBLISHABLE_KEY`. These must be configured in the repository's Actions secrets or the `production` environment secrets. Do not put values in source code or chat.
- **Security guardrails:** workflow runs only on `main` pushes touching app/deploy files or via manual dispatch; pull requests do not deploy. It uses the existing production Worker name and does not target the preview Worker. No admin credentials, role data, or importer data are changed.
- **Verification status:** workflow source was committed, but no deployment success is claimed yet. The first run must be checked for missing secrets, Cloudflare authorization, build success, and deployed Worker target. After deployment, verify production `/rest/v1/rpc/is_admin` traffic and authenticated admin/non-admin routing before resuming Kill 2.
- **Required user action if first run fails:** open the failed `Deploy production Worker` GitHub Actions run and inspect the named missing secret or deployment error. Add only the required values under repository Settings → Secrets and variables → Actions (or the `production` environment secrets), then rerun the workflow. Never share token/key values in chat.
- **Next step:** inspect the workflow run triggered by this commit. If it deploys successfully, immediately run the production acceptance checks; if it fails, use the precise failure message to unblock it rather than returning to TinyFish setup links.


## 2026-10-12 — First production deploy workflow run blocked by missing GitHub secrets

- **Observed run:** Deploy production Worker run [38201626777](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/38201626777), commit `c6cf164000233697511a45071d7f5ce44a2ef3ca`.
- **Verified result:** workflow started correctly, checked out `main`, and stopped at the deliberate configuration guard before dependency installation/build/deploy. Its logs show all four required environment values are absent from the `production` environment/repository secret context: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_PUBLISHABLE_KEY`. No deployment was attempted and production remains unchanged.
- **Required user action:** in GitHub, open repository Settings → Secrets and variables → Actions. Add the four values as repository secrets, or add them to the `production` environment used by the workflow. For Cloudflare, use an API token scoped to deploy/edit Workers and the account ID for the account owning `nova-ace-jamb`. Use the same Supabase URL and publishable/anon client key used by the working app build. Never commit or send these values in chat.
- **Rerun:** open the Deploy production Worker workflow run and choose Re-run jobs, or open Actions → Deploy production Worker → Run workflow after adding secrets.
- **Acceptance remains mandatory:** a green workflow/deploy alone is not proof of correct admin routing. Confirm the production Worker calls `/rest/v1/rpc/is_admin` after admin sign-in, routes the admin to `/admin`, allows `/admin-import`, and denies non-admin access. Keep Kill 2 importer paused until those live checks pass.


## 2026-10-12 — Diagnose and fix production deployment workflow failure

- **Observed run:** [Deploy production Worker run 38201626777, attempt 3](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/38201626777).
- **Verified:** all four GitHub Actions secrets are now present in the workflow environment; validation passed, dependency installation passed, typecheck passed, and Vite production build passed. Deployment failed inside `cloudflare/wrangler-action@v3` with `Missing entry-point` because the action selected Wrangler 3.90.0, which does not understand this repository's Workers static-assets-only `wrangler.jsonc` configuration as configured.
- **Fix committed:** updated `.github/workflows/deploy-production.yml` to pin the action's Wrangler version to `4.x`, matching the static-assets Worker configuration. Commit: `06e3b6c56419179fa5d352f15bf759dd3041bba0`.
- **Affected files:** `.github/workflows/deploy-production.yml`; this handoff.
- **Verification:** the failure was diagnosed from the actual GitHub Actions job logs. The workflow edit is committed; the new run triggered by this commit must still be checked. No successful production deployment is claimed.
- **Blockers / required user action:** none expected for this specific Wrangler-version fix; watch the next run. If Cloudflare returns a permissions error, review the exact error and adjust the token's least-privilege permissions only as required. Do not share secret values.
- **Next step:** inspect the run triggered by commit `06e3b6c`. If deploy succeeds, verify the production Worker `nova-ace-jamb`, then test admin login redirect, `/admin-import`, session persistence, non-admin denial, and production Supabase `is_admin` RPC traffic. Keep Kill 2 IBASS importer paused until all acceptance checks pass.


## 2026-10-12 — Diagnose second Cloudflare deployment failure

- **Observed run:** [Deploy production Worker run 38206807033](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/38206807033), commit `06e3b6c56419179fa5d352f15bf759dd3041bba0`.
- **Verified:** all four secrets are present; install, typecheck, and Vite build passed. Wrangler v4 started, then failed with `Headers.set: ... is an invalid header value`. The failure occurs while Wrangler constructs an HTTP header from the Cloudflare credential. Logs redact the credential, so do not infer the exact secret content; embedded line breaks or surrounding whitespace from copy/paste are a plausible cause. Do not print or request the secret value.
- **Fix committed:** `.github/workflows/deploy-production.yml` now normalizes CR/LF and surrounding whitespace for the Cloudflare API token and account ID inside the runner without logging them, then runs `npx --yes wrangler@4 deploy` directly. Commit: `2ee1415c501556228a8cc41a808b4879352ddc74`.
- **Affected files:** `.github/workflows/deploy-production.yml`; this handoff.
- **Verification:** actual logs confirmed validation/install/typecheck/build success and identified the failure at the Wrangler HTTP-header stage. The normalization fix is committed; the new run triggered by this commit must still be checked. No production deployment success is claimed.
- **Security:** secret values were not exposed. Normalization only removes line breaks and surrounding whitespace; it does not change token contents otherwise. If the next run reports authentication/authorization failure, verify that the Cloudflare token is valid, not revoked/expired, and scoped to the account owning Worker `nova-ace-jamb`; rotate/recreate it in Cloudflare if necessary and replace the GitHub secret without sharing it in chat.
- **Next step:** inspect the run triggered by this commit. If deploy succeeds, test the live production Worker and administrator routing/access controls. Keep Kill 2 IBASS importer paused until acceptance passes.


## 2026-10-12 — Root cause of repeated Wrangler header failures (security action required)

- **Observed run:** [Deploy production Worker run 38281670020](https://github.com/DarealNovaking/Nova-ace-jamb/actions/runs/38281670020), commit `2ee1415c501556228a8cc41a808b4879352ddc74`.
- **Deep diagnosis:** secrets validation, dependency install, TypeScript, and Vite build all pass. Wrangler 4 fails before deployment while constructing the Cloudflare API request. The unmasked/redacted-incompletely error text contains a malformed API endpoint/authorization-header shape, not merely a line-ending error. This means the stored `CLOUDFLARE_API_TOKEN` value is malformed, not a valid token copied from the official Cloudflare dashboard, or otherwise contains unexpected text. The previous whitespace-normalization change did not fix it. Do not repeat deployment attempts using this credential.
- **Security incident:** the CI error output appears to expose part of the malformed credential because GitHub's masking did not fully redact it. Treat the current token as compromised regardless of whether it is valid. **Required user action:** immediately revoke/delete that token in the official Cloudflare dashboard, create a replacement at `https://dash.cloudflare.com/profile/api-tokens`, and replace the GitHub Actions secret `CLOUDFLARE_API_TOKEN` directly. Do not paste the token into chat, issues, commits, screenshots, or logs. Use only `https://dash.cloudflare.com`; do not use any other page that asks for Cloudflare credentials. Verify the dashboard's domain before entering credentials.
- **Affected files:** deployment workflow has secret normalization from commit `2ee1415c501556228a8cc41a808b4879352ddc74`; this handoff.
- **Verification:** latest logs prove build stages pass and deployment fails at Wrangler request/header construction. No deployment occurred. No production success is claimed.
- **Next step:** after the user rotates the credential and updates the secret, rerun the workflow once and inspect the result. If it fails, diagnose the new error without emitting credential values. Keep Kill 2 IBASS importer paused until production deployment and admin-access acceptance tests pass.


## 2026-10-14 — Live catalogue publication audit (read-only)

- **Scope inspected:** live Supabase definitions for `ace.publish_catalog_batch(uuid)`, `ace.validate_catalog_batch(uuid)`, `ace.approve_catalog_batch(uuid)`; table columns and constraints; RLS policies; source status; batch-to-row linkage; institution status counts; and current programme/UTME-rule counts. Also re-read `docs/CATALOG-IMPORT-CONTRACT.md`.
- **Confirmed live data:** the three successful institution batches are published and approved at source level: NUC 328, NBTE 199, NCCE 264. Each batch has exactly its declared number of import rows, every row is approved and has a non-null `published_id`; total 791. The older September batch with one persisted row is rejected and separate from these three successful batches.
- **Root cause of the apparent publication mismatch:** `ace.publish_catalog_batch` explicitly inserts institutions with `status='draft'`. The `published` batch status means rows were materialized into the catalogue's review/draft layer; it does **not** activate the institutions for student use. This is consistent with `ace.get_catalog_institutions()` returning draft institutions for admin catalogue review, while the student foundation save function requires an institution with `status='active'`. RLS also only exposes institutions to ordinary authenticated users when status is active.
- **Current readiness gap:** all 791 institutions remain draft; there are 0 programme records and 0 UTME rules. Therefore the student institution/course/subject-combination journey is not ready, despite successful ingestion of the institution workbook.
- **Safety decision:** no database rows or statuses were changed. Do not mass-activate all 791 institutions just to make the student UI populate: publication/activation are separate lifecycle steps, and the imported workbook's authoritative accuracy, duplicates, institution codes, and approved activation criteria must be checked first. Programme and UTME-rule ingestion must follow the catalogue contract and authoritative sources; do not fabricate course combinations.
- **Affected files:** this handoff only; no application source or database schema/data changed.
- **Verification:** read-only SQL confirmed 791 institution records, status `draft` for all 791, 791 approved import rows linked to published IDs across the three batches, 0 programmes, 0 UTME rules; inspected the actual publication function body and the contract's lifecycle (`source registered → source approved → import staged → validation → row approval → batch approval → publication → activation`).
- **Blockers / user action:** no re-upload is needed. Before activation, verify the 791 imported institutions against their source snapshots and confirm the product's policy for activating institution records. The next engineering step is to audit the importer/edge-function payload mapping and design a reviewed activation gate, then ingest authoritative programmes and UTME combinations.
- **Next step:** continue the read-only audit of `catalog-import` Edge Function and repository importer mapping, then implement/document the smallest safe reviewed activation path only after data-quality criteria are clear. Keep course/UTME onboarding blocked until programmes and valid season-specific rules exist.


## 2026-10-14 — Importer and deployed Edge Function consistency check

- **Inspected:** repository `src/components/AdminCatalogueImport.tsx`, repository `supabase/functions/catalog-import/index.ts`, and live deployed Supabase Edge Function `catalog-import` (ACTIVE, version 7, JWT verification enabled).
- **Confirmed importer mapping:** it requires the 791-row workbook and the expected NUC/NBTE/NCCE split, rejects duplicate source IDs/names, sends three authority-specific batches, then validates, approves, publishes, and checks the total institution count. It deliberately supplies `jamb_code: null` because the workbook does not provide verified JAMB institution codes. It carries additional workbook metadata (verification status, source reference, last verified, notes) in the row payload, but the current publication function only persists the core institution fields and provenance; those extra fields are not promoted to first-class institution columns.
- **Deployment/source drift found:** the live Edge Function version 7 does not match the current repository source. Live code calls the security-definer `ace.can_manage_catalog()` RPC and stages via `ace.stage_catalog_import()`; repository source uses a service-role role-table query, direct batch/row inserts, and extra source/season prechecks. Both perform caller JWT validation and an admin/editor gate, but their implementation and transactional/idempotency behavior differ. Do not redeploy either version as a drive-by fix; first reconcile the intended implementation and test its authorization and rollback behavior.
- **Risk/quality implication:** current importer success verifies row counts and linkage, not that every institution is approved for student-facing use or that its official JAMB code is verified. The null JAMB codes also mean the publication function's code-conflict upsert path is not the primary identity mechanism; its fallback is name/type matching.
- **Changes:** handoff documentation only. No live Edge Function deployment, database mutation, source edit, or institution activation was performed.
- **Verification:** retrieved live function metadata/content and compared it with the repository file; queried institution/import-row counts and the publication function in the preceding audit.
- **Next step:** reconcile deployed Edge Function and repository source as a separate controlled change; add a reviewed institution activation workflow and explicit preservation/review of workbook provenance fields; then load authoritative programmes and season-specific UTME rules. Keep all 791 institutions draft until the activation gate is defined and passed.


## 2026-10-14 — Student catalogue completion: authoritative programme discovery

- **Official sources rechecked live:** JAMB IBASS institution hierarchy JSON (`institution_data.json?v=1`), UTME subject catalogue (`subjects_jamb.json?v=1`), and programme endpoint template (`load_programs.php?school={institution_id}`). The endpoints responded successfully through a live fetch. Example programme endpoint returns a list of programme IDs/titles for a JAMB institution ID.
- **Existing DB prerequisites:** current ACE subjects table already contains 25 active subjects (including Use of English); the 2027 exam season exists but is `draft`, and 2026 is `closed`. No active programmes or UTME rules exist. All 791 imported institutions remain drafts with null JAMB codes.
- **Critical mapping constraint:** the official programme endpoint requires JAMB's institution ID. Current institution workbook import has no verified JAMB code, and the institution publisher stores its external workbook key only in provenance. The official hierarchy must therefore be reconciled against existing institution names before attaching programmes. Name-only fuzzy joins or assigning arbitrary institution IDs would risk courses being linked to the wrong school.
- **Critical rule constraint:** the programme-list endpoint gives programme identifiers/titles, not by itself a complete, verified season-specific UTME rule for each programme. Rules must preserve JAMB's alternatives/optional groups and be sourced from the relevant programme detail/eligibility data; do not infer combinations from course names.
- **No live data changed in this discovery step.** No programme/rule records were inserted and no institution/season was activated.
- **Completion sequence:** (1) exact/ambiguous institution reconciliation against official JAMB hierarchy; (2) persist verified JAMB institution IDs and reviewed institution activation; (3) ingest programmes for matched schools through stage → validate → approve → publish; (4) ingest source-backed UTME rules preserving alternatives for the draft 2027 season; (5) review/activate only after integrity checks; (6) test student onboarding end-to-end. Keep unmatched/ambiguous records in draft and report coverage.
- **Verification:** live endpoint examples returned authoritative hierarchy, subject catalogue, and programme list; database query confirmed current subject list and season states. Student catalogue remains incomplete, and no completion is claimed.



---

## 36. MULTI-AGENT CONTINUITY

Cross-agent continuation is now standardized in:

- `docs/AGENT-CONTINUITY-PROTOCOL.md` — mandatory startup, safety, delegation, verification, and handoff rules; includes a reusable prompt for any new agent/chat.
- `docs/AGENT-CONTINUITY-CHECKPOINT.md` — concise current checkpoint with evidence, blockers, safety constraints, and one concrete next action. Refresh it from verified repository/live-system state; stale checkpoint data must not override current evidence.

Use this workflow across AI providers and chats. GitHub remains the durable shared source; this does not automatically grant another agent access to GitHub/Supabase or share credentials. Every agent must independently verify access, current HEAD, live data when relevant, and tests. See the protocol for exact rules.


---

## 36. MULTI-AGENT CONTINUITY + CURRENT VERIFIED BLOCKERS (2026-10-18)

This section supersedes any older checkpoint wording where the two conflict. The full product vision and architecture above remain authoritative.

### Continuity documents
- Multi-agent rules: `docs/AGENT-CONTINUITY-PROTOCOL.md`
- Current agent checkpoint: `docs/AGENT-CONTINUITY-CHECKPOINT.md`
- Reusable role-specific prompts: `docs/AGENT-PROMPTS.md`
- Latest known Batch 2 data-source handoff: `docs/MASTER-HANDOFF-BATCH-2-IBASS-ENDPOINTS-2026-09-16.md`

Use one integrator to own `main`, resolve competing agent recommendations, approve production changes, run final verification, and update this master handoff plus the checkpoint. Other agents must have bounded scopes and must not edit the same files or mutate production data concurrently.

### Fresh repository evidence
- On 2026-10-18, GitHub read access succeeded for the private repository. The `main` branch was observed at commit `0627479eb5f5ddf891c2f55b2a8325c1137f3ea1` before the role prompt pack/checkpoint refresh commits.
- The catalogue import contract, admin catalogue importer, repository `supabase/functions/catalog-import/index.ts`, continuity protocol, and Batch 2 progress handoff were read.
- New role prompt pack was committed as `e8789b4a22869b97bd244eb3800954c9cadf31fc`; checkpoint refresh commit: `03309a30c2c05774ca86be94e24b0268a77ac1af`. Re-check latest HEAD before the next change.

### Catalogue and Edge Function safety warning
The live Supabase Edge Function `catalog-import` was fetched and observed ACTIVE at version 7 with `verify_jwt=true`. Its implementation differs materially from repository source:
- Deployed version handles CORS `OPTIONS`, checks caller permission through `ace.can_manage_catalog`, and stages through `ace.stage_catalog_import`.
- Repository version checks `ace.roles`, queries `catalog_sources` and `exam_seasons`, and inserts import batches/rows directly.
- **Do not deploy either version blindly.** First inspect migrations, RPC definitions, grants, RLS, deployed function, repository function, and frontend request contract. Decide which behavior is intended, reconcile code safely, then run authenticated smoke tests before deployment.

### Live database access blocker
Read-only Supabase migration and table inspection attempts on 2026-10-18 failed with PostgreSQL password-authentication errors for the configured database users. No database writes were performed. Previously reported counts (791 institutions, zero programs, zero UTME rules) are historical and must not be presented as freshly verified until a read-only live query succeeds through a working authorized connection.

**Human action if connector keeps failing:** reconnect/refresh the Supabase integration through its supported connection settings, then request the agent to retry read-only inspection. If it still fails, use Supabase Dashboard → SQL Editor to run read-only counts on `ace.institutions`, `ace.programs`, and `ace.program_utme_rules`, and share only result counts/errors. Never share DB passwords, service-role keys, access tokens, or student PII in chat.

### Current Batch 2 next steps
1. Restore a working read-only Supabase inspection path and capture current catalogue counts/schema/migrations/RPCs.
2. Independently verify official JAMB/IBASS programme and eligibility response shapes, including alternatives/optional UTME subjects and stable institution identifiers.
3. Reconcile deployed/repository `catalog-import` drift and review authorization, RLS, idempotency, CORS and source/season validation.
4. Only then implement the smallest safe importer fix, run typecheck/build and authenticated Playwright/E2E plus security/integrity checks where available.
5. Stage → validate → approve → publish only source-verified catalogue data. Keep uncertain records inactive/draft. Batch 3 remains locked until Batch 2 acceptance evidence is recorded.

No institution workbook re-upload is requested at this point. The existing admin/student routing issue should not be reopened without new evidence.


### Agent anti-drift controls added — 2026-10-18

The prompt pack `docs/AGENT-PROMPTS.md` now includes mandatory anti-drift rules and **Agent 9 — Primary ChatGPT / Project Partner**. These rules apply to every AI agent, including the primary assistant: project-only scope; inspect actual GitHub/handoffs/live evidence; distinguish verified implementation from historical notes and plans; one accountable integrator; no unapproved scope changes or unsafe production writes; no repeated failed calls without a new approach; truthful test/deployment claims; Playwright for user-facing changes when available; update both handoff documents after meaningful work; and end with concrete status, blockers, human action and next step.

Prompt pack commit: `261716c12f1df17c814302febf950166f7657d14`. This was documentation-only; no app code, database rows, or deployment changed. The immediate blocker remains live Supabase read access, followed by safe reconciliation of deployed/repository `catalog-import` behavior.


## Verified continuity update — 2026-10-18

### Agent coordination
- Canonical instruction: docs/AGENT-PROMPTS.md now begins with one universal instruction intended to be pasted unchanged into every agent. Specialist prompts are optional bounded task briefs, not separate objectives or mandatory prompt combinations.
- The primary integrator remains the sole accountable owner for milestone selection, main-branch integration, verification, and continuity documentation.

### Live Supabase state (verified read-only on 2026-10-18)
- Project: uokiqlgmzprqfbzmedaz.
- Read-only SQL succeeded. Current row counts: ace.institutions = 791; ace.programs = 0; ace.program_utme_rules = 0; ace.subjects = 25.
- Migration listing succeeded and includes the Batch 2 catalogue migrations through add_ibass_institution_stage_lookup (2026-10-06).
- Active deployed Edge Functions: catalog-import version 7 and ibass-catalog-stage version 4; both have verify_jwt=true.
- Deployed catalog-import checks the authenticated user, calls ace.can_manage_catalog using the caller JWT, and stages rows through ace.stage_catalog_import. ibass-catalog-stage also authenticates and checks catalog-management permission, matches institution names against official IBASS catalogue data, fetches programme listings and parses brochure subject requirements, and stages discovered programmes/rules through catalog-import.
- This evidence confirms the institution rows exist but programme and UTME-rule catalogues are still empty. Do not ask the user to re-upload the institution workbook without new evidence.
- No database writes, Edge Function deployments, catalogue activations, or production data changes were performed in this update.

### Exact next action
Inspect the repository versions of both Edge Functions, the catalogue import contract, current migrations/RPC definitions, and AdminCatalogueImport request/response behavior together. Identify whether the deployed IBASS staging path is actually invokable from the UI and whether its payload/mapping can populate program records and rules safely. Then test the official endpoints and matching/parsing logic on a bounded sample without publishing records. Only after that evidence, make the smallest safe implementation change and run authenticated staging tests. Batch 3 remains locked until Batch 2 acceptance criteria are met.


## Batch 2 investigation update — 2026-10-18
- Live read-only query confirms all 791 institution rows have status draft; no rows exist in ace.programs or ace.program_utme_rules. There are 3 published import batches and 1 rejected batch. The institution workbook is not missing; do not ask for re-upload.
- Repository has supabase/functions/catalog-import/index.ts but no supabase/functions/ibass-catalog-stage/index.ts at the current main ref (GitHub contents API returned 404 for that exact path). Supabase has an active deployed ibass-catalog-stage v4, so this is a real deployment/source-of-truth gap requiring reconciliation before deployment or further code changes.
- AdminCatalogueImport currently implements only the institution workbook path. It checks session/admin role, preflights 791 rows and NUC/NBTE/NCCE counts, stages batches, validates, approves, publishes, and verifies the institution count. It does not invoke ibass-catalog-stage; therefore programme/rule discovery is not connected to the visible importer UI.
- Repository source for catalog-import differs from deployed version 7: repository code lacks the deployed CORS OPTIONS handling and uses a different response shape (UI expects staged.batch_id, while deployed function returns the stage_catalog_import RPC result). Do not redeploy until response-contract compatibility is explicitly resolved.
- A requested migration path from the previous checkpoint was not present at that exact filename; use the actual repository migration directory/index rather than assuming local filenames match migration ledger names.
- No production data was changed. No function was deployed. Next: enumerate actual migration filenames, inspect the full deployed/repository response contracts and RPC return shapes, and decide whether to recover the missing deployed function source into version control (from verified deployed content) and add a bounded UI-triggered stage flow or an explicitly separate admin action. Validate official payload parsing before any publication.


## Batch 2 continuation — 2026-10-18 (verified actions)
- Recovered the currently deployed Supabase Edge Function source into version control at `supabase/functions/ibass-catalog-stage/index.ts` from active deployment v4 (deployed `verify_jwt=true`). GitHub commit: `50013989322b104ae3848e571508b64e925cf157`. This is source recovery only; no Edge Function deployment was performed.
- Live schema review found the deployed staging parser emits `alternative_subject_groups`, while `ace.publish_catalog_batch` consumes `alternative_groups`. It also creates stable programme external keys in provenance, but the live publication RPC looked up rule-to-program only by programme JAMB code or UUID, so UTME rules could not resolve the staged external key.
- Added migration `supabase/migrations/20261018120000_batch_2_resolve_ibass_program_external_keys.sql` to extend the live `ace.publish_catalog_batch(uuid)` programme lookup to also resolve `ace.programs.provenance->>'external_key'`. GitHub commit `b1ac3ace8a954a503d06dd9f2e64be677e2f991c`; Supabase `apply_migration` returned success. This changed a database function definition, not catalogue rows.
- Still unsafe to connect/run the importer end-to-end: parser intentionally rejects whole strings containing common alternative words and otherwise guesses codes from text; it does not faithfully model IBASS alternatives. It emits `alternative_subject_groups` instead of the live RPC's `alternative_groups`. Rule source is currently `reviewed`, whereas publication requires an `approved` source. These require explicit fixes and review; do not stage or publish programme/rule batches yet.
- Repository/deployed `catalog-import` still differ: repo implementation inserts rows directly and returns `batch_id`; deployed v7 uses `ace.stage_catalog_import` and returns its RPC JSON shape. UI currently expects `batch_id`. Reconcile this contract before deploying the repository version.
- Latest verified live counts remain institutions 791 (all draft), programs 0, UTME rules 0, subjects 25; import batches previously observed: 3 published, 1 rejected. No catalogue data rows were inserted, approved, or published in this continuation. No frontend build, typecheck, Playwright, or official live payload parsing tests have been run.
- Next: inspect/reconcile RPC return shape and actual IBASS JSON/brochure formats with bounded non-publishing tests; fix alternatives representation and rule-source approval workflow; add an explicit admin action for staging in chunks only after parser tests; run typecheck/build/Playwright; update handoff before any deployment. Batch 3 remains locked.


## Batch 2 continuation — 2026-10-18 (payload contract correction)
- Updated `supabase/functions/ibass-catalog-stage/index.ts` so emitted UTME-rule payloads use `alternative_groups`, matching the live publication RPC and `docs/CATALOG-IMPORT-CONTRACT.md`. GitHub commit: `de5cb5a103b949ef65fb6c8ccc49e2fc68bf5516`. This is source-only; no Edge Function deployment occurred.
- The recovered parser still deliberately rejects requirement text containing words such as “either”, “or”, “any”, “one of”, or “choose” rather than staging a guessed combination. This is conservative but does not yet model alternative groups. Parser tests against actual official brochure HTML and programme JSON have not been run.
- Attempted to add an explicit admin UI staging panel in `src/components/AdminCatalogueImport.tsx`, but the GitHub write operation was blocked by tool safety checks before any file was changed. No claim of UI implementation. Retry with a smaller patch or create a separate component using the repository write tools, then run typecheck/build and Playwright.
- No production function deployed, no catalogue data written. Previously verified counts: 791 institutions (draft), 0 programs, 0 UTME rules, 25 subjects. Batch 2 remains in progress; Batch 3 locked.
- Next action: implement the explicit admin staging UI as a small isolated component, load institutions and seasons via existing authorized ACE client calls, cap each request at 25 institutions, and invoke `ibass-catalog-stage`. Then reconcile `catalog-import` RPC response shape and test the source/season approval lifecycle before attempting staging.


## Batch 2 continuation — 2026-10-18 (admin staging UI added, not yet runtime-verified)
- Added `src/components/AdminIbassStage.tsx` and integrated it into `src/admin-import.tsx`. Commits: component `d46ef6975d2b74460cdeb5232847da05e31423c9`; page integration `ada5133419395b9d96aa980b72cfe3c64a7c565e`.
- The panel rechecks the Supabase session and `ace.is_admin()`, loads institution options from `ace.get_catalog_institutions()`, loads non-archived seasons using the verified `ace.exam_seasons` schema, caps selection at 25 institutions, and calls `ibass-catalog-stage`. It displays staging counts/batch IDs and unresolved requirements; it does not validate, approve, publish, or activate data.
- Live schema verified: seasons have `id, code, name, exam_year, status`; current seasons include JAMB UTME 2027 (draft) and JAMB UTME 2026 (closed). The programme source is approved; the brochure detail source remains reviewed. Staging is not publication; publication must remain blocked until the rule source's approval gate is explicitly satisfied.
- Current repo HEAD before docs update was `ada5133419395b9d96aa980b72cfe3c64a7c565e`. No catalogue rows were staged by this UI change and no Edge Function was deployed.
- Verification status: GitHub source writes succeeded and schema/RPC signatures were read from Supabase. No typecheck, build, Playwright, or live staging call has yet been run. The UI and function response contract remain unverified at runtime; parser alternative-group handling remains incomplete. Do not deploy or run a staging batch until static checks and a non-publishing test pass.
- Next action: inspect actual deployed `catalog-import`/RPC response payload and verify both batches return usable batch IDs; add non-publishing fixtures/tests for official IBASS programme JSON and brochure HTML; run typecheck/build/Playwright; then update both handoff documents before considering any deployment. Batch 3 remains locked.


## Continuity update — 2026-10-18 (latest verification attempt)

- Current repository state observed before this documentation update: `DarealNovaking/Nova-ace-jamb`, branch `main`, latest commit `a31a070b5a60cd57eb166d16f03688db5f4090c4`; GitHub metadata confirms the connected account has repository push/admin permission.
- Batch 2's guarded IBASS staging panel is present in `src/components/AdminIbassStage.tsx` and mounted from `src/admin-import.tsx`. The recovered `supabase/functions/ibass-catalog-stage/index.ts` is source recovery only; it has not been deployed.
- Static repository inspection confirms `supabase/functions/catalog-import/index.ts` returns `batch_id`, `status`, and `row_count` for successful and idempotent staging responses. The IBASS wrapper consumes that endpoint and returns nested `program_import` and `utme_rule_import` objects. This is not evidence of the deployed function's live response shape.
- The current Supabase connector denied deployed-function retrieval, function listing, and a read-only catalogue count query with MCP error `-32600: You do not have permission to perform this action`. An earlier 2026-10-18 inspection had succeeded; do not silently assume either the earlier live state or the current live deployment is unchanged. Live counts and deployed function behavior are currently UNVERIFIED.
- No live staging request, catalogue row write, migration, or deployment was performed during this attempt. Typecheck, build, parser fixtures, and Playwright remain unrun.
- Required next action: restore/reauthorize Supabase read access for project `amswykapebeevhstmvii`; read the deployed `catalog-import` source/metadata and `ace.stage_catalog_import` RPC contract; then add non-publishing fixtures for official IBASS programme JSON and brochure HTML, including alternative/optional subject requirements. Run typecheck/build/Playwright before any production staging/deployment. Keep all records behind stage → validate → review → approve → publish gates. Batch 2 remains IN PROGRESS; Batch 3 remains LOCKED.


## Live-state reconciliation — 2026-10-18

- **Correct Supabase project reference:** the connected Supabase account lists the active ACE JAMB project as `nova-ace-jamb`, ref `uokiqlgmzprqfbzmedaz`, region `ca-central-1`, status `ACTIVE_HEALTHY`. The earlier checkpoint's reference `amswykapebeevhstmvii` was stale/mismatched and returned permission errors. Use `uokiqlgmzprqfbzmedaz` for future Supabase checks.
- Live Edge Function inventory: `catalog-import` ACTIVE v7, `ibass-catalog-stage` ACTIVE v4, both `verify_jwt=true`. Both deployed sources were retrieved. The live importer uses the authenticated caller JWT for `ace.can_manage_catalog` and `ace.stage_catalog_import`; it returns the RPC JSON payload directly, with idempotent responses at HTTP 200 and new staging at HTTP 201.
- Live database counts at the latest read: 791 institutions, 0 programmes, 0 programme UTME rules, 25 subjects. JAMB UTME 2027 is draft; JAMB UTME 2026 is closed. The IBASS programme endpoint source is approved and brochure-detail source reviewed. No rows were staged in this continuation.
- The live routine metadata confirms `ace.stage_catalog_import` returns jsonb and runs SECURITY DEFINER. Exact argument signature/body/grants are not yet verified; review before changing this function or relying on unverified payload keys.
- Deployed `ibass-catalog-stage` v4 uses `alternative_groups: []` in parsed rule payloads and sends alternative/optional wording to unresolved review rather than parsing it. Its source parser assumes programme endpoint JSON is an array of `{id,title}` records and exact-normalized brochure titles. These assumptions still need fixtures against official source samples. No live staging, deployment, or destructive operation occurred.
- The previous GitHub clone/build attempt could not resolve `github.com` from the runtime. Typecheck/build/Playwright are still unrun. Next: inspect repository migrations and schema contract, implement fixture-based parser tests for programme JSON and brochure HTML (especially alternatives), run typecheck/build/Playwright in a network-enabled environment, then perform only a small authenticated staging-only check and verify pending batch IDs/counts. Keep validate/review/approve/publish separate. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## Batch 2 continuation — 2026-10-18 (live IBASS format investigation and fail-closed parser fix)
- Verified official live IBASS sources using read-only requests: `https://eligibility.jamb.gov.ng/institution_data.json?v=1` returns a nested school-type/category/institution tree, not the shallow structure the previous parser traversed. The official tree lists Federal University of Technology, Akure as IBASS institution ID `1306`; ACE currently has the institution as `Federal University of Technology, Akure`, state `Ondo`. The legacy programme endpoint `load_programs.php?school=1306` returns an array of `{id,title}` programme records.
- Live brochure page `https://ibass.jamb.gov.ng/brochure-courses?id=1306&school=...` now serves a React application shell; the old `div.modal-dialog` / `table.table-bordered.table-striped` selectors are absent in the returned HTML. Therefore the current legacy brochure parser does not extract requirements from the live page. A read-only request to the newer official API `https://ibass-api.jamb.gov.ng/api/ibass/institution/programmes/1306?page=1` returned a different, small list of 3 programmes with empty UTME requirement fields for this sample; do not switch to it without reconciling coverage and the detailed requirements API.
- Source-only fixes committed to `supabase/functions/ibass-catalog-stage/index.ts`: `098756ee127978d5811a0a89dada46f645e8980a` adds recursive traversal of the nested institution tree and state-suffix normalization; `ff4c3ae83ea4f0caf6e79f597c8b66d9d87719bb` corrected mapping syntax; `da7c96d06bbbe4151f011238ae555cccc228cd17` simplified state normalization; `a6bc5aa65bbf0315dfc5fa58648049f9b3be881b` adds a fail-closed guard so zero parsed UTME-rule rows means no programme batch is staged. Missing per-programme requirement text is now surfaced as unresolved rather than silently omitted.
- **No live staging request, catalogue/database write, function deployment, or publication occurred.** The current deployed Edge Function is unchanged; these are GitHub source commits only. The source changes have not yet passed TypeScript/Deno checks, build, fixture tests, or Playwright because a network-enabled repository runtime is not available here.
- Remaining blocker: the parser still needs to consume the current authoritative IBASS programme-detail/requirements response (including alternatives) with real fixtures. The new API's list endpoint alone is insufficient and the legacy brochure DOM parser is obsolete. Next action: inspect the official app bundle/API contracts and perform read-only requests to identify the endpoint carrying `programme_utme_subject_data`, `programme_utme_requirements_data`, and alternatives; add representative sanitized fixtures/tests for nested institution trees, programme lists, normal requirements, alternatives, optional subjects, and missing requirements. Then run typecheck/build/Playwright before any deployment or staging. Batch 2 remains IN PROGRESS; Batch 3 remains LOCKED.


## Verification follow-up — 2026-10-18
- Simplified state-suffix matching to use normalized string suffixes rather than a dynamically constructed regular expression. Source commit: `5c4ce3b97ff3f0d3c0e976a8e4bd5fece579d4f5`.
- GitHub Actions for source commit `a6bc5aa65bbf0315dfc5fa58648049f9b3be881b` completed successfully for both `Verify` (typecheck + production build) and `ACE JAMB E2E` (Playwright). These results validate the code at that commit, not the later state-suffix simplification.
- CI for `5c4ce3b97ff3f0d3c0e976a8e4bd5fece579d4f5` was still queued/in progress at this checkpoint. Do not report its checks as passed until GitHub Actions returns a completed successful result. The official IBASS requirement endpoint/format remains unresolved; no function deployment or live staging is authorized by these code changes.


## IBASS API endpoint probe — 2026-10-18
- Read-only POST probes against the current official app API `/ibass/institution/programmes/1306?page=1` confirmed `total=3` for FUTA; the returned rows are Early Childhood Education, Library and Information Science, and Guidance and Counselling, with `subjects`, `utme_requirements`, and `details` empty. Searches for `microbiology` and `agricultural engineering` returned zero rows, while the legacy `load_programs.php?school=1306` returns a substantially larger programme list. This API endpoint is not a safe replacement for the legacy programme list without reconciling its coverage.
- Enumerated API routes referenced in the current official frontend bundle: `/inst-type`, `/inst-category`, `/ibass/institutions?page=`, `/ibass/institution/programmes/`, `/ibass/eligibility-checker/`, and `/ibass/eligibility-checker/submit`. A read-only synthetic eligibility-checker submit returned HTTP 500 with a generic error; no valid detail response was recovered. No attempt was made to use credentials or mutate JAMB records.
- CI now passed on latest parser source commit `5c4ce3b97ff3f0d3c0e976a8e4bd5fece579d4f5`: GitHub Actions `Verify` and `ACE JAMB E2E` both succeeded. CI also passed for docs commit `f1a4395a4b91d79091be90cb1f4e0a455a1ece9f`. This confirms TypeScript typecheck/build and existing Playwright suite, but does not test the Deno Edge Function against official payload fixtures.
- Next action: do not deploy or stage yet. Continue read-only endpoint/source investigation or use official brochure documents as reviewed fixtures; only implement a detailed-requirements parser once a source response is confirmed to contain authoritative UTME requirements and alternatives. Batch 2 remains IN PROGRESS; Batch 3 remains LOCKED.


## Live-state recheck — 2026-10-18
- Rechecked active Supabase project `uokiqlgmzprqfbzmedaz` after the source-only changes: `catalog-import` remains ACTIVE v7 and `ibass-catalog-stage` remains ACTIVE v4, both `verify_jwt=true`. No function deployment occurred.
- Current read-only counts: 791 institutions, 0 programmes, 0 UTME rules, 4 catalog import batches. This confirms the current work did not add catalogue rows; existing batches predate this check.


## Batch 2 continuation — official IBASS requirements API and parser implementation (2026-10-18)
- Found and read the current official IBASS frontend bundle. Its eligibility checker calls `GET https://ibass-api.jamb.gov.ng/api/ibass/eligibility-checker/{institutionId}` for the institution's programme list and `POST https://ibass-api.jamb.gov.ng/api/ibass/eligibility-checker/submit` for institution-specific programme requirements. The POST response contains `programme_utme_subject_data` including `title`, `required_subjects`, `optional_subjects`, `optional_subjects_by_group2`, and `subject_count`. A read-only FUTA Microbiology probe returned required Biology/Chemistry/English and optional Mathematics/Physics with the title specifying “any of” the latter two. The API requires a valid eligibility-checker request body; only response catalogue fields are used by the importer, not the synthetic candidate's eligibility result.
- Replaced the obsolete modal/table DOM parser in `supabase/functions/ibass-catalog-stage/index.ts` with the official eligibility-checker endpoints. It verifies the returned institution/programme IDs, uses the institution's actual IBASS school-type/category IDs, limits one staging request to at most 150 discovered programmes, and uses a four-worker request pool. It stages unresolved programmes for review but does not guess their UTME rules. The existing zero-safe-rules guard still returns before staging. Source commit: `991bfd925ddbf9d8368b6e1b02330102281f13a4`.
- Added pure parser module `supabase/functions/ibass-catalog-stage/parser.js` and six Node fixture tests in `tests/catalog-parser.test.mjs` covering FUTA Microbiology alternatives, explicit subject counts, fixed combinations, secondary optional-group ambiguity, compound/unknown labels, and missing English Language. Parser commit: `a26306cb27b8f80fe906edfc0238f437cd26747a`; tests commit: `78be7993f0d3a8524e1043e6df1a961297c0d6bf`.
- Updated `.github/workflows/verify.yml` to run the parser fixture tests before typecheck/build (commit `c154016fe1bf97766f8ab02f630af520d794ed94`). At documentation time, Verify and Playwright workflows for that commit were still running; their outcomes must be checked before claiming validation passed. Edge Function source is not part of the existing frontend TypeScript check, so successful Node parser tests do not replace Deno syntax/runtime verification.
- The parser currently represents an alternative group as `{subject_codes: [...], minimum_required: n}` in the JSONB `alternative_groups` field, and sets `minimum_optional_subjects` to the sum of group minima. The database accepts JSONB without a shape constraint and no current frontend consumer was found; downstream evaluator compatibility remains unverified and must be checked before publication.
- No function deployment, import staging, approval, publication, or live database mutation occurred. Live functions remain `catalog-import` v7 and `ibass-catalog-stage` v4. The 791 institutions / 0 programs / 0 UTME rules / 4 pre-existing batches state is unchanged at last live recheck.
- Next: wait for the new CI run; add/execute Deno-compatible tests for the Edge Function's endpoint orchestration and parser import; inspect the eligibility response fields across additional official programmes to confirm optional-group semantics; then perform a single-institution staging-only trial with an admin session and review batch IDs/counts. Do not deploy or publish yet. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## Verification follow-up — Deno check dependency resolution (2026-10-18)
- The six parser fixture tests passed in Verify run `39134557338` before the Deno step. That run failed at `deno check supabase/functions/ibass-catalog-stage/index.ts` because the imported Supabase Edge Runtime type declaration references `npm:openai@^4.52.5`, which is not a project dependency; this is an unrelated remote declaration dependency, not yet evidence of an importer source syntax defect. Frontend typecheck/build were skipped after the Deno step failed.
- Updated Verify to use `deno check --no-check=remote supabase/functions/ibass-catalog-stage/index.ts` to keep local Edge Function checking while avoiding unrelated remote declaration type resolution (workflow commit `26f381d6972848fc112fd732db7be75af0920b57`). The Verify and E2E runs for that commit were still in progress at this note. Do not claim them passed until refreshed.
- Previous source/docs commits `991bfd925ddbf9d8368b6e1b02330102281f13a4` and `4daa28da241182a0ad50daad2b73a83307c26ed8` have successful Verify/E2E workflow runs, but those predate the added Deno check. No production deployment or database writes were performed.


## Deno check adjustment follow-up — 2026-10-18
- The `--no-check=remote` attempt still failed because Deno resolved the explicit `jsr:@supabase/functions-js/edge-runtime.d.ts` import and hit its undeclared `npm:openai@^4.52.5` type dependency. Removed that redundant type-declaration import from `supabase/functions/ibass-catalog-stage/index.ts` (commit `3ca00b5a831556090be41991d7545e4dda94e87e`); Deno provides its runtime globals, and the function already imports Supabase client separately. Verify/E2E for this source commit were queued at the time of this note. Confirm Deno check and frontend build results before proceeding.


## Batch 2 continuation — subject-choice support and deployment guard (2026-10-18)
- Confirmed the current official IBASS API contract read-only: `GET /api/ibass/eligibility-checker/{institutionId}` returns `{status:true,data:[{id,title}]}` programme records; POST `/api/ibass/eligibility-checker/submit` returns `programme_utme_subject_data`. FUTA examples verified: Microbiology requires Biology/Chemistry/English and any one of Mathematics/Physics; Biochemistry explicitly says one of Mathematics/Physics; Computer Science requires English/Mathematics/Physics plus one of Agricultural Science/Biology/Chemistry/Economics/Geography; Agricultural Engineering has a fixed four-subject requirement. No candidate records or JAMB data were modified.
- Verified all parser subject codes against live `ace.subjects` rows. The aliases used by the examples map to existing active codes: AGR, BIO, CHE, ECO, ENG, GEO, MAT, PHY. Added the Computer Science five-option group fixture; parser fixtures and Deno check passed on earlier commit `91df16fab9360da38918007216ca6e4463ce4924` (Verify passed; E2E also passed for that commit).
- Found a real student journey gap: current onboarding displayed only required subjects and intentionally blocked rules with fewer than four required subjects; `ace.save_student_foundation_catalog` rejects non-fixed combinations. Implemented a UI choice step in `src/components/StudentOnboarding.tsx`, sends the four selected subject IDs through `src/lib/studentService.ts`, and added migration `supabase/migrations/20261018143100_batch_2_utme_subject_choice.sql` with a new authenticated SECURITY DEFINER RPC. Server validation checks user auth, active institution/program/season/rule, exactly four distinct active subjects, inclusion of every required subject, every alternative group's minimum, no unallowed subject, and active exam config. The migration is source-only and has NOT been applied to live Supabase. Source commits include UI `505296c53f3a73ba1808714fc006225b6ff0ebf9`, service `21294557004c1c2b18ddda553390f328550b777c`, migration `8efcec9963ff78f52adc6048b5a07e2707f804b5` (later hardened through `30cc19001519ddc01215e9c523d6c92555e24846)), and onboarding stale-rule fix `ed85fca0c4d175a332ba90f9ef7eb5690f773775`.
- Production deployment guard: discovered `.github/workflows/deploy-production.yml` automatically attempted a Cloudflare deployment on source pushes. Removed the push trigger; production deployment now requires an explicit `workflow_dispatch` (commit `1f2e3366f8dcaaef99f6ab8c844fedb7ad42bb2d`). The already-started run `39135691876` failed before deployment because Cloudflare rejected the configured API token (Wrangler error 10000 / 9109). Therefore no Worker deployment was made by that run. Never repeat production deploy until Cloudflare credentials are repaired and user explicitly authorizes it.
- Verify for `ed85fca0c4d175a332ba90f9ef7eb5690f773775` passed, and earlier parser Deno/typecheck/build passed. Latest Verify/E2E for workflow-guard commit `1f2e3366f8dcaaef99f6ab8c844fedb7ad42bb2d` were in progress at note time; recheck them. Migration syntax and live RPC behavior remain unverified because the migration has not been applied or executed. No catalog staging, approval, publication, or live DB writes occurred; live catalogue last observed remains 791 institutions, 0 programs, 0 UTME rules, 4 prior batches.
- Next: verify the latest CI; validate the migration in a disposable/local PostgreSQL/Supabase test database and add RPC tests for valid/invalid subject selections; review frontend E2E around onboarding; then apply the migration only through the established reviewed deployment procedure. After that, stage one institution into review-only import batches, validate both batches, and stop before approval/publication. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## Disposable PostgreSQL verification follow-up (2026-10-18)
- Added `tests/sql/utme_subject_choice.test.sql` and a dedicated PostgreSQL 16 service job in `.github/workflows/verify.yml` to execute the actual migration against isolated throwaway tables and test valid Microbiology alternative selection, missing required subjects, invalid optional subject, duplicate IDs, inactive subjects, and English-first subject order. No live Supabase changes are involved.
- First CI run `39136090924` failed at the first RPC invocation because the SQL fixture passed integer literal `300` to the RPC's `smallint` argument; PostgreSQL does not resolve that function call implicitly. Corrected all fixture calls to use `300::smallint` in commit `024dd88295f49ab16aed85fcad65959c3a4f83dc`. This failure is a test-fixture type mismatch; the migration function was created in the disposable DB before the call. Re-run CI and inspect any subsequent migration/assertion failures before concluding the migration is valid.
- Verify for migration commit `30cc19001519ddc01215e9c523d6c92555e24846` passed Node parser fixtures, Deno check, frontend typecheck, and build. E2E passed on commit `ed3e587d477e43d9301224bc2c860533d66a37e0`; the PostgreSQL integration job is now the remaining new check.


## PostgreSQL integration test result (2026-10-18)
- The corrected disposable PostgreSQL 16 migration job passed on commit `024dd88295f49ab16aed85fcad65959c3a4f83dc`. It successfully applied the actual subject-choice migration and passed valid Microbiology alternative selection, missing-required rejection, unallowed-option rejection, duplicate-ID rejection, inactive-subject rejection, and English-first primary subject assertion. CI run: `39136190437` (migration job success). The same run's frontend Verify steps were still finishing at the time of this note; refresh full Verify/E2E for the newest checkpoint commit before final completion.
- This is isolated database evidence only. The migration remains unapplied to live Supabase, and no import batches were staged or published.

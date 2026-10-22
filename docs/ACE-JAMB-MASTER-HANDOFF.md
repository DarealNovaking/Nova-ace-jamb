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
- Found a real student journey gap: current onboarding displayed only required subjects and intentionally blocked rules with fewer than four required subjects; `ace.save_student_foundation_catalog` rejects non-fixed combinations. Implemented a UI choice step in `src/components/StudentOnboarding.tsx`, sends the four selected subject IDs through `src/lib/studentService.ts`, and added migration `supabase/migrations/20261018143241_batch_2_utme_subject_choice.sql` with a new authenticated SECURITY DEFINER RPC. Server validation checks user auth, active institution/program/season/rule, exactly four distinct active subjects, inclusion of every required subject, every alternative group's minimum, no unallowed subject, and active exam config. The migration is source-only and has NOT been applied to live Supabase. Source commits include UI `505296c53f3a73ba1808714fc006225b6ff0ebf9`, service `21294557004c1c2b18ddda553390f328550b777c`, migration `8efcec9963ff78f52adc6048b5a07e2707f804b5` (later hardened through `30cc19001519ddc01215e9c523d6c92555e24846)), and onboarding stale-rule fix `ed85fca0c4d175a332ba90f9ef7eb5690f773775`.
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


## Live migration application verified (2026-10-18)
- Applied `batch_2_utme_subject_choice` to the correct live Supabase project `uokiqlgmzprqfbzmedaz` only after the isolated PostgreSQL migration test passed. Supabase recorded migration version `20261018143241`; the repository migration file and SQL test include path are now aligned to `supabase/migrations/20261018143241_batch_2_utme_subject_choice.sql`.
- Read-only verification confirmed the function signature `save_student_foundation_catalog_with_subjects(text, smallint, uuid, uuid, integer, uuid[])`, owner `postgres`, `SECURITY DEFINER`, authenticated EXECUTE granted, anon/public EXECUTE denied. The function checks `auth.uid()` and scopes writes to that user's profile/preferences/subjects. The SECURITY DEFINER + authenticated grant is intentional for this per-user atomic foundation-save RPC and should remain covered by tests/advisor review.
- Live catalogue counts remain 791 institutions, 0 programmes, 0 UTME rules, and 4 existing import batches. No data import, staging, approval, publication, or edge-function deployment occurred. Latest CI after migration filename synchronization is pending; previous full Verify plus PostgreSQL integration job passed on commit `024dd88295f49ab16aed85fcad65959c3a4f83dc`, and E2E passed on that commit too.
- Next: confirm CI for the synchronized migration filename; review the latest Supabase security advisor results; then stage one institution only through the authenticated review-only path once an admin/editor session is available. Do not approve/publish; 2027 season remains draft and no active season exists. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## Post-apply security advisor check (2026-10-18)
- Re-ran Supabase security advisors after applying `batch_2_utme_subject_choice`. The only security lint returned was the pre-existing `auth_leaked_password_protection` warning (leaked-password protection disabled). No new security advisor finding was reported for the new RPC. This does not replace review of the function's intentional SECURITY DEFINER exposure; read-only privilege checks confirm authenticated EXECUTE=true and anon/public EXECUTE=false.
- Current latest CI runs for repository filename synchronization (`eff70bd6efe454b8ccff68c04f8d797b90c6fc16`) remain in progress. The preceding commit `024dd88295f49ab16aed85fcad65959c3a4f83dc` passed Verify, PostgreSQL migration integration tests, and ACE JAMB E2E; the current change since that successful run is migration file version/path synchronization plus docs.

## Live student-account failure investigation — 2026-10-18

- User screenshot shows the deployed app's generic “We couldn’t prepare your account” screen at the Cloudflare Worker origin.
- Read-only Supabase logs correlate the failure with repeated authenticated POST /rest/v1/rpc/is_admin requests returning HTTP 406 and PostgREST PGRST106 (latest observed 2026-10-18 15:26:53 UTC). This occurs before device registration/profile/onboarding logic, so those later steps are not the present root cause.
- src/components/StudentFoundationGate.tsx and src/components/AdminFoundationGate.tsx invoke ace.rpc('is_admin'); src/lib/supabase.ts binds the client to custom schema ace. ace has USAGE granted to authenticated (verified read-only SQL), but the PostgREST error indicates the requested schema is not currently exposed by the Data API. SQL current_setting('pgrst.db_schemas', true) was null and authenticator has no pgrst.db_schemas role override; do not attempt to change API exposure through an unverified SQL workaround.
- Current repo HEAD observed: 4d165f57a2a348367f258a4998ef1091831606d9 (docs: record post-migration security advisor result). GitHub combined commit status returned no status records; CI outcome for latest main remains unverified. No application code, database rows, API settings, or deployment were changed during this investigation.
- Exact blocker / user action: in Supabase Dashboard for project nova-ace-jamb (uokiqlgmzprqfbzmedaz), open Project Settings → API (Data API / Exposed schemas), ensure custom schema ace is in the exposed schemas list, and save. Preserve least privilege: do not grant USAGE to anon; the live read-only check showed anon currently has no ace schema USAGE. Existing table/RPC grants and RLS must remain the authorization boundary.
- After the setting is saved, retry the app and recheck Supabase logs. Expected evidence is is_admin no longer returning PGRST106; then exercise admin/student routing, profile/preference reads, device registration and onboarding save. Do not treat the issue as fixed until the real flow passes.
- Next action: user enables ace in Supabase Data API exposed schemas, then integrator verifies API behavior and latest CI before proceeding with Batch 2 review-only staging. Do not stage, approve, publish, deploy functions, or deploy frontend as part of this fix without the required checks/authorization.


## Account preparation recovered; Batch 2 resumes — 2026-10-18
- User reports the ACE app is back and working after adding custom schema `ace` to Supabase Data API exposed schemas.
- Live logs confirm POST `/rest/v1/rpc/is_admin` returned HTTP 200 at 2026-10-18 15:53:18 and 15:53:23 UTC. Across the 24-hour query, 8 requests returned 200 and 35 earlier requests returned 406/PGRST106; the latest failure was at 15:26:53 UTC. This supports recovery of the account gate. Available logs do not independently verify every subsequent route, preference read, device flow or onboarding save; user reports the app is back.
- Read-only catalogue counts using actual live table names: 791 `ace.institutions`, 0 `ace.programs`, 0 `ace.program_utme_rules`, 4 `ace.catalog_import_batches`. No catalogue data was changed.
- Latest main CI is still unverified: combined status for `2f902a3ef30812a023e254f8f131da6c3b5a8bdf` had no status records; workflow-run connector returned no PR-triggered runs. Earlier commit `024dd88295f49ab16aed85fcad65959c3a4f83dc` passed Verify, disposable PostgreSQL migration tests and ACE JAMB E2E. Confirm latest main checks via GitHub Actions before claiming full verification.
- Next action: resume Batch 2, confirm Verify/E2E and migration path synchronization, then use an authenticated admin/editor session to stage one institution only into a review batch and validate it. Do not invent official programme/UTME facts, approve or publish. Batch 3 remains locked; 2027 season remains draft and no active season exists. The deployment workflow is manual-only and must not run until Cloudflare credentials are repaired and production deployment is explicitly authorized.


## Batch 2 safety gate — existing admin importer is not review-only (2026-10-18)
- User confirmed they are signed in as administrator/editor. Their browser session is not accessible to this agent's connected browser; no authenticated admin action was performed.
- Inspected `src/components/AdminCatalogueImport.tsx` and `supabase/functions/catalog-import/index.ts`. The current admin importer is explicitly a bulk 791-row workflow: it requires exactly 791 workbook rows split NUC 328 / NBTE 199 / NCCE 264, stages three authority-specific batches, then automatically calls `validate_catalog_batch`, `approve_catalog_batch`, and `publish_catalog_batch`, finally asserting 791 institutions. It is NOT a safe path to stage one institution into review-only status. Do not ask user to upload a workbook or click Choose XLSX for this milestone; that could approve/publish data.
- Edge Function `catalog-import` itself stages supplied rows as `staged` and enforces authenticated admin/editor role and reviewed/approved source. However the current frontend immediately follows staging with validation, approval, and publication. No import request was sent; no catalogue rows were modified.
- Live `ace.catalog_import_batches` status summary: 3 published institution batches and 1 rejected institution batch. Live catalogue remains 791 institutions, 0 programs, 0 program UTME rules. No active exam season is present; 2027 season remains draft.
- Exact next action: implement a separate, explicit single-row review-only staging path in the admin UI (or use a documented existing review-only admin route if discovered), with a source that is already reviewed/approved, one selected institution, payload preview, and a strict stop after `catalog-import` returns `status=staged`; do not invoke validation/approval/publication from that path. Add tests proving only one row is submitted and no approve/publish RPC is called. Recheck latest CI first/alongside this change. Do not stage production data until this safe path is available and reviewed. Batch 2 remains in progress; Batch 3 locked.


## Review-only staging UI implementation — 2026-10-18
- Current verified main commits include review-only component `12c362b4c646de89b6d03d1792a9eebe5a2bc06b`, admin gate integration `60e5246ecc9e76801ab74c75f38c423404d42921`, static safety tests `2417607f97fb0efb02f88da932ecaa9f432986e5`, CI wiring `1af0d018830465c25b916ce71ed0278e303ae95b`, and progress handoff `7af02783293291d1ef800df1adc9229bacb8c675`.
- Added `src/components/AdminReviewOnlyStage.tsx`, mounted in `src/components/AdminFoundationGate.tsx` before the existing bulk importer. It selects one existing institution, requires a matching approved source and explicit confirmation, previews the payload, and calls only `catalog-import`. It requires response `status=staged`, `row_count=1`, and `batch_id`. It does not invoke validate/approve/publish RPCs.
- Added `tests/review-only-stage.test.mjs` and wired it into Verify. These are static source-contract tests; authenticated browser QA and real staging remain outstanding.
- Live Supabase read access verified: `catalog_sources` contains approved authority sources and reviewed/approved IBASS sources; live Edge Functions remain `catalog-import` v7 and `ibass-catalog-stage` v4 with JWT verification. No deployment or live staging request was made. No live data was changed.
- CI for the latest main HEAD has not yet been verified. Do not claim the new test, typecheck, build, SQL integration, or E2E passed until Actions evidence is inspected.
- Exact next action: check CI on latest `main`; if green, use the separate **Single-row review-only staging** UI in the authenticated admin dashboard (never the XLSX bulk importer), stage one selected institution, and verify one new pending row/batch via read-only SQL. Stop before validation, approval, or publication. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## Review-only staging live verification — 2026-10-18
- User screenshot showed the admin UI reporting batch `993bfb6c-b6d0-4ace-9e6e-4db48df064f7` staged with one row.
- Read-only SQL against live Supabase project `uokiqlgmzprqfbzmedaz` verified the batch exists with `dataset_type='institutions'`, `status='staged'`, recorded `row_count=1`, and exactly one associated `ace.catalog_import_rows` row. The row has `validation_status='pending'`, `published_id IS NULL`, `entity_type='institution'`, external key `COE0001`, and payload name A.D. Rufa'i College of Education, Legal and General Studies, Bauchi. The source is `NCCE accredited colleges of education` and source status is `approved`.
- The batch metadata records purpose `review-only safety verification`, importer `nova-ace-review-only-single-row`, and the institution ID. Current institution record remains `draft`. No validation, approval, publication, or data mutation was performed during this verification.
- Inspected deployed `catalog-import` Edge Function v7 source: it validates authenticated user and `ace.can_manage_catalog()`, then calls only `ace.stage_catalog_import` for this request and returns the staging result. This function itself does not call validation/approval/publication. Its request schema matches the UI's `source_id`, `dataset_type`, `rows`, and `metadata` shape. JWT verification is enabled.
- GitHub combined status for `76c7a04444b6250089b3c6617026167ffaa4d0df` returned no status records; latest CI remains UNVERIFIED. No successful test/build/E2E claim is made.
- **Next action:** inspect GitHub Actions directly or obtain a usable checkout/runtime to run the workflow checks; then inspect the deployed site’s actual browser flow and verify UI test/build results. Keep the current batch staged; do not validate, approve, or publish it. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## Latest CI verification — 2026-10-18
- GitHub Actions runs for current docs checkpoint commit `d4fbbccb1b238af22dbe81e6de32f6f77fd05f55` have completed successfully.
- Verify run `39171595079`: both `verify` and `utme-subject-choice-migration` jobs passed. Verified steps include Node parser + review-only staging tests, Deno check for `ibass-catalog-stage`, `npm run typecheck`, `npm run build`, and the disposable PostgreSQL migration integration test.
- ACE JAMB E2E run `39171595081`: job `e2e` passed, including typecheck, build, Playwright browser tests, and artifact upload.
- This is repository CI evidence, not a manual authenticated browser test of the deployed staging component. The previously verified live batch `993bfb6c-b6d0-4ace-9e6e-4db48df064f7` remains staged with exactly one pending row and no published ID.
- **Next action:** inspect the admin frontend gate for a safety issue: the review-only panel is mounted in the same admin view as the bulk importer, and source matching currently requires an existing institution's provenance to point to an approved source. Review whether the selector can accidentally create duplicate staging batches on repeated clicks and whether the function/RPC enforces duplicate-batch/idempotency safeguards. Do not validate, approve, or publish the current batch. After this review, continue authoritative catalogue ingestion only with verified source coverage and explicit safety gates. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## Authoritative IBASS pipeline review — 2026-10-18
- Inspected repository supabase/functions/ibass-catalog-stage/index.ts and parser.js, plus live ace.validate_catalog_batch, ace.publish_catalog_batch, and ace.stage_catalog_import definitions. No function calls or database mutations were performed.
- Live read-only query confirms catalogue remains 791 institutions, 0 programs, 0 programme UTME rules. Seasons: 2026 is closed; 2027 is draft. The programme endpoint source 16388e42-7bed-4541-89ff-8ffb0e648425 is approved; brochure detail source 9959f7d6-0071-4ab3-880c-a79f3c81e561 is reviewed.
- Pipeline safely refuses ambiguous institution mappings, missing official IDs, missing programme identifiers, mismatched IBASS requirement responses, unrecognized subject labels, and unsupported second optional-subject groups. Parser tests cover several cases. However, the function uses a hardcoded generic REQUIREMENTS_REQUEST (including fixed UTME subjects) when querying programme requirement details; this needs validation against official API semantics before a broad run.
- The Edge Function stages program and UTME-rule batches via two separate catalog-import requests. If the program staging request succeeds and the rule request fails, a partial staged result can remain; this is not a published-data mutation, but it requires operator reconciliation. The function also permits passing a draft season because it only rejects archived seasons. Live 2027 season is draft and 2026 is closed; do not run broad staging until season targeting is explicitly confirmed.
- The publication RPC can publish program/rule records only after separate validation and approval; program publication resolves institution by institution_external_key matching institution jamb_code or UUID, and UTME rules resolve the program by external key/provenance. Current code appears to use UUIDs consistently for institution lookup and shared external keys for program/rule linking.
- No official programme ingestion was triggered; no rows were staged, validated, approved, published, or otherwise changed in this investigation.
- Next action: verify official IBASS requirements endpoint behavior with a small read-only request/response fixture and ensure the generic request does not contaminate or constrain returned requirements; then implement an explicit dry-run/preview mode and partial-staging reconciliation reporting before invoking staging for the draft 2027 season. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## IBASS endpoint read-only probe — 2026-10-18
- Performed read-only fetches of the official JAMB legacy endpoints. `subjects_jamb.json?v=1` returned a subject list (e.g. Agriculture, Arabic, Art, Biology, Chemistry, CRS, Commerce, Economics, French, Geography, Government, Hausa, History, Home Economics, Igbo, Islamic Religious Studies, Literature in English, Mathematics, Music, Physics, Principles of Accounts, Yoruba). `load_programs.php?school=1` returned an empty JSON array; this single numeric ID is not sufficient to infer the endpoint is broken or determine the correct programme-request contract. Fetching `institution_data.json?v=1` through the read-only extraction provider returned `empty_content`, so its structure was not verified in this probe.
- A search for public documentation of `ibass-api.jamb.gov.ng/api/ibass/eligibility-checker/submit` did not yield an authoritative contract sufficient to confirm whether the fixed `REQUIREMENTS_REQUEST` fields influence `programme_utme_subject_data`. This remains unresolved; no POST was sent to the IBASS requirements endpoint and no catalogue ingestion was invoked.
- Current parser safely rejects unrecognized subject labels, missing English in required subjects, unclear optional-subject counts, and any populated `optional_subjects_by_group2`. The current alias map does not include some labels present in the official legacy subjects JSON, including Hausa Language, Igbo Language, Islamic Religious Studies, and possibly other source variants; this may cause safe false negatives until aliases are mapped to verified `ace.subjects` codes. Do not blindly add aliases until the actual database subject-code catalogue is inspected.
- No source code was changed in this investigation. Live programme and rule counts remain 0 as last observed; no new staging batches were created. The original single-row institution batch remains staged.
- **Next action:** inspect `ace.subjects` active codes and the full deployed IBASS endpoint response contract using one institution ID discovered from the official hierarchy, then create deterministic response fixtures/tests to establish request semantics and expand only verified aliases. After that, implement preview/dry-run and partial-staging reconciliation before any broad import. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## Official subject-label mapping follow-up — 2026-10-19
- Re-fetched the official `subjects_jamb.json?v=1` payload. It explicitly uses `Hausa Language`, `Igbo Language`, `Islamic Religious Studies`, and `Yoruba Language`. The parser currently maps `hausa`, `igbo`, `islamic studies`/`islamic religion`, and `yoruba`, so these exact official variants are currently rejected unless they happen to match another alias. No live `ace.subjects` read was possible in this attempt because the SQL connector rejected the query at its safety layer; therefore codes HAU/IGB/ISS/YOR are only existing parser alias targets, not independently re-verified against live subject rows.
- Attempted a narrow source-and-test update to add those exact aliases and regression tests, but the GitHub write operation was blocked by tool safety checks before a commit was created. No code change was made. Do not claim this fix is implemented or tested.
- Official `institution_data.json` still returns `empty_content` through the extraction provider, and `load_programs.php?school=1` returned an empty array in the earlier probe. A valid institution ID and live requirements request contract remain unverified. No POST was sent to IBASS; no catalogue rows were staged or mutated.
- **Next action:** obtain a permitted read path for live `ace.subjects` and official institution hierarchy (e.g. direct source access via an authorized connected browser/profile or existing function logs), then apply the narrow alias+tests patch via an allowed repository edit path and run GitHub Actions. Do not run broad ingestion until endpoint semantics are verified. Batch 2 IN PROGRESS; Batch 3 LOCKED.


## Catalogue replacement investigation — 2026-10-19
- Read the current master handoff and checkpoint, `StudentOnboarding.tsx`, `StudentFoundationGate.tsx`, `studentService.ts`, `seasonService.ts`, the IBASS endpoint handoff, and the current `ibass-catalog-stage/index.ts` and parser. Confirmed the catalogue is currently a hard gate for onboarding: institution, programme and active season-specific rule must load, and the form requires a four-subject combination before saving. If the catalogue remains empty, new students can be blocked from reaching preparation features.
- Read-only inspection of official JAMB/IBASS pages confirmed public institution brochure and eligibility-checker pages, including “View Courses” links and institution/programme/UTME selection flow. It did **not** establish a stable, documented API contract suitable for a live-only replacement. Legacy endpoint IDs/response contract and the deployed requirements POST semantics remain unresolved; no POST was sent.
- Recommendation: do not delete catalogue tables/data. Decouple preparation onboarding from admission catalogue completeness; let students save a preparation subject profile and access learning, while course eligibility remains explicitly unverified until source-backed season-specific rules exist. Keep a verified local cache as a supporting service and official JAMB checker as a transparent fallback. Do not claim selected subjects match a course without a verified rule.
- Detailed evidence, options, safety boundaries, and acceptance criteria: `docs/CATALOGUE-REPLACEMENT-INVESTIGATION-2026-10-19.md`.
- No application code, database data, Edge Functions or deployment changed in this investigation. Main branch lacks `src/components/AdminIBASSProgrammeImport.tsx` (404), so do not assume that historical importer UI is present on main.
- Next action: inspect SQL definitions and RLS/constraints for `save_student_foundation_catalog_with_subjects` and onboarding completion, then implement a minimal additive preparation-only onboarding path with tests. Keep Batch 2 IN PROGRESS and Batch 3 LOCKED.


---

## Catalogue-independent preparation onboarding — 2026-10-19

### Implemented on `main`
- Added `supabase/migrations/20261019120000_preparation_onboarding_without_catalogue.sql`, defining authenticated RPC `ace.save_student_preparation_foundation`. It validates authentication, profile fields, daily minutes, four distinct active subject IDs, and updates profile/preferences/subjects atomically without requiring institution/programme/rule records.
- Student institution/course inputs are optional intended goals. The RPC stores them as text only and clears structured institution/programme IDs unless both goals still match the existing linked catalogue records; this avoids representing free-text goals as verified catalogue links.
- Updated `src/lib/studentService.ts` with `saveStudentPreparationFoundation`.
- Reworked `src/components/StudentOnboarding.tsx` to load active subjects and let students choose four preparation subjects regardless of catalogue coverage. It explicitly says subject choices are not a verified course combination and links to the official JAMB IBASS eligibility checker.
- Updated `src/components/StudentFoundationGate.tsx` so missing institution/course no longer blocks app access; onboarding completion requires profile basics, daily study time, and exactly four saved subjects.
- Added SQL integration assertions to `tests/sql/utme_subject_choice.test.sql` for preparation-only saves, null/unverified goals, four saved subjects, daily study minutes, and unauthenticated rejection. The existing CI migration job runs this SQL test.
- The schema/data/catalogue tables and existing catalogue RPC remain intact. No production migration was applied manually, no catalogue rows were changed, and no deployment was initiated by the agent.

### Verification status

- SQL coverage was tightened to delete the test fixture's institution, programme and programme-rule rows before invoking the new preparation RPC, so the isolated test exercises a genuinely empty catalogue. This only affects the disposable CI schema, never production.
- Read-only live schema inspection confirmed `ace.profiles.institution`, `course`, `institution_id`, and `program_id` are nullable; `student_preferences.daily_minutes` and `student_subjects` are present.
- GitHub writes succeeded for migration, frontend, service, gate, and SQL-test changes. Latest commit must be rechecked before relying on this record.
- Typecheck/build and the disposable PostgreSQL migration test have not yet been observed passing for these changes. Await GitHub Actions and inspect failures before calling this complete.
- Remaining risks: production migration has not been applied; live onboarding/E2E is not verified; official course requirements remain unresolved until a verified season-specific catalogue rule exists.

### Next action
Fetch latest `main` HEAD and GitHub Actions runs. Fix any type/build/SQL failures, rerun relevant checks, then update both handoff documents with the actual run result. Do not manually apply the migration to production until CI is green and the normal migration/deployment path is confirmed.


## Official JAMB UTME subject inventory research — 2026-10-19

### Official source inspected
- JAMB eligibility subject data endpoint: `https://eligibility.jamb.gov.ng/subjects_jamb.json?v=1`
- Current IBASS eligibility checker: `https://ibass.jamb.gov.ng/eligibility-checker`
- Current IBASS e-syllabus: `https://ibass.jamb.gov.ng/e-syllabus`
- IBASS brochure by institution: `https://ibass.jamb.gov.ng/brochure-by-institution`

The official eligibility endpoint returned 22 subject records: Agriculture, Arabic, Art, Biology, Chemistry, Christian Religious Studies, Commerce, Economics, French, Geography, Government, Hausa Language, History, Home Economics, Igbo Language, Islamic Religious Studies, Literature in English, Mathematics, Music, Physics, Principles of Accounts, and Yoruba Language. English Language was not included in that JSON payload; the IBASS eligibility checker explicitly instructs candidates to select four UTME subjects including English, so English remains a required/default subject in the product's combination logic. The endpoint is official and reachable but its returned list should not be assumed to prove an exhaustive list of every current JAMB subject: IBASS e-syllabus page extraction is paginated and did not expose the complete row list in the fetched text.

### Live ACE subject-table comparison
- Read-only query of production `ace.subjects` returned 25 active rows: Agriculture, Arabic, Art, Biology, Chemistry, Christian Religious Studies, Commerce, Computer Studies, Economics, French, Geography, Government, Hausa, History, Home Economics, Igbo, Islamic Studies, Literature-in-English, Mathematics, Music, Physics, Principles of Account, Use of English, Yoruba, Physical and Health Education.
- Current IBASS e-syllabus search confirms Computer Studies appears in its official subject listing. The official eligibility JSON endpoint omits Computer Studies and Physical and Health Education and also omits English (which is separately required/default in the eligibility UI). Therefore the JSON endpoint alone is not the complete subject inventory. No live rows were changed. PHE needs stronger current official confirmation before being labelled verified as a current UTME subject; retain existing row pending evidence rather than deleting it.

### Code correction
- Updated `supabase/functions/ibass-catalog-stage/parser.js` to accept exact source labels `Hausa Language`, `Igbo Language`, `Islamic Religious Studies`, `Yoruba Language`, and `Agriculture Science` in addition to existing aliases.
- Extended `tests/catalog-parser.test.mjs` to assert parser acceptance for every subject label returned by the observed official eligibility JSON payload.
- This corrects a known import rejection risk; it does not certify that the endpoint lists every subject in current 2027 UTME.

### Verification
- **Verified 2026-10-19:** latest `main` HEAD is `f489713e5ada29b3e06b750c2929644e1c587a26`. Verify run `39177813651` passed, including parser tests, Deno check, `npm run typecheck`, `npm run build`, and the disposable PostgreSQL migration test. ACE JAMB E2E run `39177813601` also passed, including typecheck, build and Playwright browser tests. Parser-label tests at commit `7087af857d5e3394a3ca748f4841baf4c279b867` passed in Verify run `39177774340`.
- No live catalogue data was changed and no production migration/deployment was initiated.
- Further official inventory inspection on 2026-10-19 confirmed the IBASS e-syllabus UI displays 12 entries per page and shows three client-side pagination controls. Adding `?page=2` or `?page=3` to the URL did not change extracted results, so this fetch method does not retrieve later rows; the complete inventory remains unresolved. Search results and the visible first page confirm Computer Studies is an IBASS subject. No official evidence for Physical and Health Education was found in the current searches. Do not claim the 25-row production table is complete or delete PHE based on this inconclusive result.
- No production migration/deployment or live catalogue writes occurred during verification.
- **Next action:** inspect the IBASS page's actual pagination/data-loading mechanism or identify an official full inventory endpoint; compare all returned labels against `ace.subjects` and only then make evidence-backed changes. Batch 2 remains IN PROGRESS; Batch 3 remains LOCKED.


### Follow-up pagination probe — 2026-10-19
- Refreshed repository main: HEAD `55c102de9d68f21ccf765c559cbefb8b17189fb4`; both continuity docs were read before continuing.
- Re-fetched official IBASS e-syllabus HTML/structured extraction and official eligibility JSON. The e-syllabus shows 12 subject rows plus page controls 1/2/3/Next, but the extraction provider omits the page-control targets and page 2/3 rows. Tested `?page=2`, `?page=3`, and common server-side pagination parameters `?draw=2&start=12&length=12` / `?draw=3&start=24&length=12`; none returned the remaining subject rows. This is a failed retrieval approach, not evidence that those pages are empty.
- Official eligibility JSON again returned 22 labels. Production ace.subjects read-only query returned 25 active rows. Computer Studies is confirmed by the official e-syllabus first page/search index; Use of English is required by the official eligibility UI despite its absence from the JSON. Physical and Health Education remains unverified against a complete current official list.
- No source code or live data changed; no migration, staging, or deployment performed. Existing inventory should not be bulk-modified from this incomplete extraction.
- Next action: discover the actual official page JavaScript/DataTables endpoint or official syllabus PDF/download links that expose all pages, then reconcile each label to the live table. If that route cannot be accessed through authorized connectors, record the precise evidence gap and use official JAMB-published syllabus documents as the next source; do not invent a complete inventory. Batch 2 IN PROGRESS; Batch 3 LOCKED.


### Official-source follow-up — JAMB bulletin cross-check — 2026-10-19
- Continued subject-inventory investigation using official JAMB search-indexed bulletins and the eligibility interface. Official JAMB bulletin PDFs from 2022 explicitly refer to candidates selecting Computer Studies or Physical and Health Education, supporting that both were accepted UTME subject options at that time. This is historical evidence only; it does not establish the complete/current 2027 inventory.
- Current official eligibility homepage search result includes “Physical And Health Education” among its indexed subject/course text, but the extracted official eligibility JSON still omits PHE and Computer Studies. This supports retaining PHE rather than deleting it, while keeping its current season status unverified until the complete current list is obtained.
- The official IBASS e-syllabus app HTML extraction exposes the first 12 subject cards but not its script bundle/API references or pagination link targets. The page’s search index also confirms Computer Studies. Robots.txt allows crawling; sitemap.xml extraction returned empty content. Attempts to obtain later rows through URL pagination and DataTables-like query parameters failed.
- Conclusion: no safe catalogue mutation is justified yet. Production ACE has 25 active subject rows. The official JSON is incomplete; current full inventory remains unresolved. No production rows, migrations, staging batches, or deployment were changed.
- Next action: obtain the official frontend JavaScript bundle or use the live eligibility UI to inspect its selectable subject list, then cross-check all subjects against the current-season JAMB registration/bulletin source. Only then make a narrow evidence-backed subject-table correction and add regression tests. Batch 2 IN PROGRESS; Batch 3 LOCKED.


### Decision: timebox and close subject-inventory investigation — 2026-10-19
- **Decision:** stop spending implementation time trying to extract every page of the official subject inventory. This investigation is closed for the current workstream, with a known evidence limitation; it must not block the next milestone.
- **Working baseline:** retain the existing 25 active production subject records. Keep the existing aliases/parser tests. Do not bulk-add syllabus subjects, delete Physical and Health Education, or mutate production based on incomplete sources.
- **Known gap:** the official eligibility JSON returns 22 labels and is not exhaustive; official IBASS evidence confirms Computer Studies and the eligibility UI requires English. The current-season status/completeness of Physical and Health Education is not fully certified. This is explicitly deferred, not falsely marked verified.
- **Reopen rule:** revisit only if a new authoritative, current-season JAMB source becomes available during normal catalogue work. Do not repeat pagination query experiments, scrape investigations, or historical-bulletin searches without new evidence.
- **Next action:** move on to the next implementation/verification task: refresh current main CI and inspect the existing catalogue import/deployed-function drift and onboarding migration status. Make no production migration or deployment until the relevant checks and deployment path are verified. Batch 2 remains IN PROGRESS; Batch 3 remains LOCKED.


### Catalogue import drift reconciliation — 2026-10-19
- Refreshed production `catalog-import` Edge Function: ACTIVE v7, `verify_jwt=true`. The deployed handler's `can_manage_catalog` and `stage_catalog_import` calls are backed by live database functions. Read-only `pg_get_functiondef` inspection confirmed `stage_catalog_import` rechecks caller identity/role, validates dataset and row-count bounds, requires source status reviewed/approved, rejects missing/archived seasons, performs snapshot idempotency, and inserts batch + rows within one PostgreSQL function transaction. Execute ACL observed for `authenticated`; no production writes performed.
- Reconciled repository `supabase/functions/catalog-import/index.ts` to the deployed RPC-based implementation: browser OPTIONS/CORS, caller-JWT permission check, stricter object payload validation, bounded body/rows, atomic staging RPC, consistent `batch_id` response, and sanitized staging errors. The previous repository implementation's direct batch/row inserts and compensating delete were removed.
- Added `tests/catalog-import-contract.test.mjs` to guard CORS/body limits, caller authorization, atomic RPC usage, row payload validation, and no direct table inserts/raw database-error leakage.
- Source commits: `de074f6f5acc97b1cffe9ad49b9342ba634da8c1` (function) and `1b9053cb202e65ea3430e0aed0ecfa19d405ecf6` (contract tests). GitHub Verify and E2E runs for the latest docs-only HEAD `548fc58f516d796b42cd0d7363c5d799c36fe75f` both completed successfully, but those runs predate the function/test commits; rerun CI for current HEAD before claiming the new changes pass.
- Important source-control gap remains: live migration ledger contains `20261006124552` through `20261006130820` catalog-manager/source/idempotency/atomic-staging migrations that are not present under `supabase/migrations` on `main`. Do not redeploy or alter the RPC until migration history is recovered/reconciled into source control. No function deployment, DB migration, or catalogue writes performed.
- Next action: inspect/reconcile missing migration sources and confirm latest CI for the new importer contract. Then resume the pending onboarding migration readiness review; Batch 2 IN PROGRESS, Batch 3 LOCKED.


### CI coverage correction — 2026-10-19

- Follow-up verification correction (2026-10-19): Verify and E2E both passed at checkpoint commit `893fb9af417ca0a0e69746810f6e369935277aa0`. Inspection of Verify job steps revealed the new `tests/catalog-import-contract.test.mjs` was not included in the workflow test command, and `catalog-import/index.ts` was not included in Deno checks. Updated `.github/workflows/verify.yml` in commit `3eefab18992c276794aac2323faa8f5672c6824b` to include both. CI for this workflow correction is pending and must pass before treating the importer regression test/typecheck as verified.
- Current deployed function v7 still contains raw `detail` fields for permission/staging errors and does not reject array payloads; repository version now sanitizes errors and rejects array payloads. This remaining deployed/source difference is intentional pending safe deployment after migration-source reconciliation; do not claim deployed code matches repository.



### Migration-source recovery and onboarding test review — 2026-10-19
- GitHub file-history queries for three representative missing migration paths (20261006124552_add_catalog_manager_role_check.sql, 20261006125836_add_atomic_catalog_import_staging.sql, 20261006130820_add_ibass_institution_stage_lookup.sql) returned no commits. These five production-ledger migration source files cannot be recovered from those expected repository paths/history; do not fabricate their original historical contents.
- Read-only production schema inspection confirmed catalog staging functions, constraints and indexes exist, including unique partial index ace.uq_catalog_import_batches_snapshot_hash. Keep this source-control drift open and avoid deployment until a safe forward reconciliation is designed and tested.
- Existing disposable PostgreSQL test script tests/sql/utme_subject_choice.test.sql also applies 20261019120000_preparation_onboarding_without_catalogue.sql and checks prep-only save with empty goals, four active subjects, preference persistence, clearing unverified structured catalogue IDs, and unauthenticated rejection. Verify workflow runs this SQL script; the latest workflow rerun after importer test/Deno-check correction is still in progress at time of this note.
- The onboarding RPC remains absent from production (to_regprocedure(...) previously returned null); no migration has been applied.
- Next: confirm current Verify + E2E runs; if green, design a separate forward-only source reconciliation for missing catalog RPC/indexes using live definitions and disposable PostgreSQL tests, then review onboarding deployment safety. No production changes/deployments.



### Importer Deno check failure and correction — 2026-10-19
- First run with expanded Verify coverage: contract tests passed (14 total), disposable PostgreSQL onboarding/UTME migration test passed, but Deno check for catalog-import failed before checking the function because the optional edge-runtime.d.ts import triggered a missing npm:openai package resolution in the runner. The deployed function's sibling ibass-catalog-stage source does not use this type-only import.
- Removed the unnecessary edge-runtime.d.ts import from supabase/functions/catalog-import/index.ts in commit fe83e32501790e4139e6b8729b9cfe6be7cc83bb; Deno provides the runtime globals and the file still uses Deno.serve. Fresh Verify/E2E is pending. Do not count the importer Deno check as passed until a new run succeeds.
- Existing run 39180989334: contract tests PASS; disposable PostgreSQL migration test PASS (including prep-only onboarding assertions); importer Deno check FAIL due to package resolution; later steps skipped. Failure diagnosed from job logs, not inferred.
- Next action: confirm Deno check and full Verify/E2E on the current HEAD; if Deno still fails, adjust the type-check setup without adding unnecessary runtime dependencies. No production migration/deployment.

### Batch 2 execution checkpoint — 2026-10-19 (verified current run)
- Current main HEAD before this note: e64a696e596cbf6a2f8e803ea755d1ddc23278b0.
- CI is green on that exact HEAD: Verify run 39181108028 succeeded, including Node contract tests, both Deno checks (IBASS stage + catalog importer), app typecheck/build, and disposable PostgreSQL migration test. E2E run 39181108062 also succeeded. This resolves the importer CI blocker.
- Read-only live database inspection (project uokiqlgmzprqfbzmedaz) confirms: 791 institution rows, 0 programme rows, 0 programme UTME-rule rows, 13 catalogue sources, 5 import batches, 793 import rows. All 791 institution rows currently have status='draft' and null jamb_code; the three published institution batches contain 328 + 199 + 264 rows. The 791 records are present but are not launch-ready/active. One rejected incomplete 791-row batch has only one persisted row; do not retry or treat it as the canonical import.
- The recent test-only staged batch 993bfb6c-b6d0-4ace-9e6e-4db48df064f7 contains one review-only row and must remain unapproved/unpublished.
- Critical remaining Batch 2 work is data execution, not further catalogue research: map database institutions to official IBASS institution identifiers, stage official programme records in batches of 1–25 institution IDs through active ibass-catalog-stage, validate/review/publish only source-backed records, then ingest UTME rules while preserving alternatives. The deployed stage function requires a real authenticated admin/editor caller JWT; no such session/token is available through this GitHub/Supabase connector session, so no invocation or data mutation was attempted. Do not bypass this gate with service-role direct inserts.
- The live source list contains approved JAMB IBASS programme endpoint and Eligibility Checker records. Existing importer/staging functions are active. Historical production migration-source drift for five 2026-10-06 versions remains unresolved; do not redeploy catalog-import until a safe forward-only reconciliation is tested.
- The onboarding RPC migration 20261019120000_preparation_onboarding_without_catalogue.sql is not applied to production. Keep this separate from catalogue ingestion; no production migration/deployment or catalogue writes were made in this run.
- Next action: with an authenticated admin/editor session, run the existing IBASS stage workflow for the first small batch of verified institution mappings, inspect unresolved mappings and returned counts, then continue in bounded batches. If the UI does not expose the workflow, provide an authenticated invocation path from the app/admin browser (never paste JWTs/secrets into chat). After programme staging, validate and publish, then stage/review/publish UTME rules. Batch 2 remains IN PROGRESS; Batch 3 remains LOCKED.

## Batch 2 implementation continuity — 2026-10-19
- **Settled catalogue decision preserved:** close subject-inventory research and retain the existing 25-subject working baseline. Do not reopen institution-count/catalogue scope or start another subject inventory pass absent new authoritative current-season evidence. Batch 2 stays focused on implementation and validated programme/UTME-rule staging.
- **Repository state verified:** `DarealNovaking/Nova-ace-jamb`, branch `main`, HEAD `dd3270fbcaa8be8e29b19cf3e6a25fc979752055` before this change.
- **Implementation defect found:** `src/components/AdminIbassStage.tsx` existed and the separate `src/admin-import.tsx` rendered it, but production app entry `src/main.tsx` routes both `/admin` and `/admin-import` through `AdminFoundationGate`. That gate rendered `AdminReviewOnlyStage` and `AdminCatalogueImport` only, so the IBASS programme/UTME staging UI was not reachable through the active route.
- **Change made:** imported and rendered `AdminIbassStage` inside the already authenticated `AdminFoundationGate` dashboard. This reuses the existing administrator gate and component-level session/role checks; no auth bypass, database write, migration, or deployment was introduced.
- **Safety/behavior:** the UI stages records for review; it does not approve or publish. No live staging request was invoked because no signed-in admin browser session is available through the connected repository tools.
- **Verification:** source-level route/component wiring inspected; CI/build/typecheck for this new commit are pending. Do not claim this change is runtime-verified until GitHub Actions completes.
- **Next action:** inspect CI for the implementation commit; if green, use a real authenticated admin/editor session in the app to stage a small, previously selected institution set for the configured exam season, then inspect staged rows and unresolved programme/UTME requirements before approval. Keep Batch 3 locked until Batch 2 acceptance evidence is recorded.


## Batch 2 admin-route verification — 2026-10-19
- **CI result verified:** implementation commit `dc4e7407d15553971f6ae9140983b0923c608e1d` passed Verify run `39210957352` and E2E run `39210957350`. Documentation commits `4e11b9e732533bcb8ebe1d77b7bfcb6dd3219c20` passed Verify `39210971414` and E2E `39210971577`. Latest checkpoint commit `90baf9e5e30f5a8ebaa78dde369096d4ec47430a` passed Verify `39210980334` and E2E `39210980315`; both latest runs concluded success.
- **Read-only live DB check repeated:** `ace.institutions=791`, `ace.programs=0`, `ace.program_utme_rules=0`, `ace.subjects=25`, `ace.catalog_import_batches=5`, `ace.catalog_import_rows=793`. No DB mutation performed. These counts are operational context only; they do not reopen the settled catalogue decision.
- **Deployed staging function confirmed:** `ibass-catalog-stage` is ACTIVE version 4 with JWT verification enabled. Its code checks the caller's user identity and `ace.can_manage_catalog()`, limits each request to 1–25 institution IDs, resolves IBASS institution names, discovers programme data, and stages programme/rule rows through `catalog-import`. It does not approve or publish those rows itself. It does rely on the currently deployed `catalog-import` endpoint, whose repository/deployment drift is already documented; do not redeploy that endpoint as part of this step.
- **Access limitation remains:** connected tools provide no signed-in administrator browser session, so no live staging request was submitted. UI route wiring and CI are verified; end-to-end authenticated staging and resulting batch contents remain unverified.
- **Next action:** open the deployed app in a signed-in administrator session, visit `/admin`, choose the intended exam season and a small previously agreed institution subset, stage once, then inspect the returned batch IDs, row counts, unresolved requirements and database batch statuses. Do not approve/publish until source requirements are reviewed. Keep Batch 3 locked. The existing 25-subject baseline remains fixed.


## Product direction correction — preparation-first onboarding (2026-10-19)

The authoritative direction is now `docs/CATALOGUE-REPLACEMENT-INVESTIGATION-2026-10-19.md`: the admissions catalogue is not the primary student journey and must not block preparation access. Do not resume bulk catalogue ingestion as the next product task. Retain legacy catalogue infrastructure until a safe deprecation plan is verified; admission eligibility must never be inferred from unverified data.

### Student subject selection rule
- English (subject code `ENG`) is automatically included and visibly marked as included in onboarding.
- Students choose exactly three additional active subjects; the persisted preparation set remains four subjects total.
- The server RPC validates that the four distinct active subject IDs include active English. Client-only enforcement is insufficient.
- Preparation setup remains separate from official course eligibility. Institution/course are optional goals until verified by season-specific source-backed rules.

### Implementation and verification — 2026-10-19
- Updated `src/components/StudentOnboarding.tsx` to preselect English, lock its checkbox, initialize saved selections with English plus up to three other valid subjects, and display the “English included + N of 3” count.
- Updated `supabase/migrations/20261019120000_preparation_onboarding_without_catalogue.sql` to reject a submitted set that omits active English.
- Applied the migration to the connected Supabase project successfully. Before application, read-only checks showed one active ENG subject, 25 active subjects, and the preparation RPC absent. This confirms the RPC was not previously deployed and the required English record exists.
- UI build/typecheck and browser E2E have not yet been run in this session. Confirm current GitHub Actions for the resulting commits; do not call the user journey end-to-end verified until runtime tests pass.
- Next: run build/typecheck and Playwright onboarding coverage, then inspect CI and verify live RPC signature/grants after migration. Do not make production catalogue changes as part of this work.


## Batch 2 scope reset — preparation-first release gate (2026-10-19)

**Decision:** Batch 2 must no longer be held hostage by catalogue population. The catalogue replacement investigation is authoritative for the student journey: preparation onboarding, learning, practice and CBT must function without institution/programme/UTME-rule records. Catalogue/eligibility verification remains a separate deferred capability; never delete the schema or claim eligibility from unverified records.

### Batch 2 completion criteria (revised)
1. **Preparation foundation:** student can save profile/study goals and exactly four preparation subjects, with English auto-included plus three student-selected subjects. Server RPC validates authentication, active distinct subjects, English inclusion, profile ownership and study-time/score bounds.
2. **No catalogue hard gate:** onboarding and the foundation gate do not require published institutions, programmes or UTME rules. Missing catalogue or unavailable JAMB service cannot block entry to the preparation product.
3. **Season/syllabus integrity:** active season handling is explicit; syllabus/topic data is not fabricated; no unverified course-subject combination is shown as official. Any exam composition shown as official must be season-scoped and source-verified.
4. **Security and regression:** authenticated-only RPC grants, RLS and authorization are verified; legacy catalogue RPCs remain intact until all call sites are audited. No destructive catalogue cleanup or publication of unverified rows.
5. **User-flow QA:** CI typecheck/build and Playwright cover first-time onboarding with empty catalogue, English locked/preselected, exactly three additional subjects, persistence/reload, and the learning/CBT destination. Include error cases for missing ENG, inactive/duplicate subjects, RPC failure and auth failure.
6. **Evidence and handoff:** record actual live schema/RPC/grants, workflow outcomes and browser results in both canonical handoff documents. Batch 2 may be marked complete only when all applicable criteria pass; otherwise keep it open with specific blockers.

### Explicitly separated / not a Batch 2 release blocker
- Bulk IBASS catalogue population, external endpoint contract reverse engineering, and publication of programme/UTME rules are no longer prerequisites for student preparation access. Keep this as a separate optional admissions-verification capability with its own evidence and safety gates.
- Do not delete catalogue tables, migrations, RPCs, importer functions, or existing records just because onboarding is decoupled.

### Current verified evidence at scope reset
- UI change commit `a9d731604984a3de5c664023fada4fa4affc69e8`: English is preselected/locked and three other subjects are selected by the student.
- Database migration source commit `28bf75b6d4f1699e46b625f85e710bd97fa27564`; live migration `preparation_onboarding_without_catalogue` applied successfully. Read-only SQL verified RPC arguments, authenticated execute=true, anon execute=false, and English enforcement=true.
- GitHub `Verify` and `ACE JAMB E2E` workflow runs on HEAD `f758b231a9eec2488c1ed62511fde5a0b67d2666` both completed successfully. This is CI evidence only; inspect E2E coverage before treating each revised criterion as covered. A real authenticated student journey and empty-catalogue scenario are not yet manually verified in this record.
- Next concrete action: inspect current Playwright specs and StudentFoundationGate/onboarding call sites, add the missing revised acceptance tests, run workflows, verify persisted student setup with a test account without exposing PII, and only then decide whether Batch 2 passes. Refresh HEAD before editing.


## Preparation-first validation hardening — 2026-10-19

- Repository test change: commit 54833febb635c2e45d0e2d17960e39940c7ce6c9.
- Active call-site audit: StudentOnboarding.tsx calls saveStudentPreparationFoundation, which calls ace.save_student_preparation_foundation. Legacy catalogue-dependent save functions remain defined in studentService.ts but are not called by the active onboarding component. StudentFoundationGate.tsx checks profile, preferences and exactly four saved subjects; it does not query institutions, programmes or UTME rules as a gate.
- Test gap confirmed: current Playwright spec only checks entry-surface rendering and mobile body visibility. It does not authenticate a student or assert English locking, subject-count validation, persistence/reload, empty-catalogue onboarding or Learning/CBT navigation. Do not claim those browser scenarios are covered.
- Change made: expanded tests/sql/utme_subject_choice.test.sql to remove institution/programme/rule rows before preparation-only save assertions and add server rejection checks for missing English, duplicate IDs and inactive subjects. This is isolated disposable PostgreSQL test data; no production catalogue rows were deleted.
- Live DB verification: ace.save_student_preparation_foundation(text, smallint, text, text, integer, uuid[]) exists; authenticated EXECUTE=true, anon EXECUTE=false, English validation present. Read-only only.
- Security Advisor reports a broad existing warning for authenticated-executable SECURITY DEFINER functions, including this preparation RPC, plus leaked-password protection disabled. The RPC is intentionally callable by signed-in students but needs explicit function-level authorization review; do not blindly revoke all authenticated access. Record this as an open security review, not a proven exploit.
- Verification status at documentation time: GitHub Verify run 39331339786 and ACE JAMB E2E run 39331339916 were in progress on commit 54833febb635c2e45d0e2d17960e39940c7ce6c9. Await final outcomes before considering the SQL change verified. Local build/typecheck/browser tests were not run in this session.
- Batch 2 remains OPEN. Next: confirm both workflow results; fix any SQL/CI failure; then implement authenticated Playwright coverage for actual onboarding UI and verify persistence + Learning/CBT navigation. Do not mark the batch complete while those browser checks are absent.


- **CI failure investigated and fixed (2026-10-19):** the first expanded disposable SQL run failed because the test had intentionally cleared request.jwt.claim.sub for the unauthenticated test and did not restore it before the new English/duplicate/inactive validation cases. Logs confirmed the function rejected those cases at the authentication guard, so those assertions had not tested their intended branches. Updated test commit b95e72071995a2ce99a4a5b893be5efac90f9c92 restores the test user claim before the new validation cases. Fresh workflows must pass before these checks are considered verified.


## First-time onboarding defect found and corrected — 2026-10-19

- Verified previous corrected SQL and E2E workflows both passed on commit 89c0718db20c78513846f205b588bcdb066471ca. Verify included npm typecheck, build, catalogue/parser tests, Deno checks and disposable PostgreSQL migration test; E2E included Playwright, but the existing Playwright specs remain only smoke tests.
- New code inspection found a real first-time setup defect: StudentFoundationGate routes a missing profile to StudentOnboarding, but StudentOnboarding previously loaded profile and preferences with Promise.all and treated PGRST116 (no row yet) as a fatal load error. This prevented the intended first-time student setup from loading.
- Fixed src/components/StudentOnboarding.tsx in commit b0a003f63bc5d6c7ff97e605b784ae4bb0c50e19. Missing profile/preferences rows now default to blank/default preparation values; other errors still surface rather than being swallowed. The active-subject query remains required.
- Verification of this new fix is pending the workflows triggered by this commit. Authenticated Playwright coverage for the complete onboarding journey is still absent; do not mark Batch 2 complete until that gap is addressed.


## Authenticated first-time onboarding regression coverage — 2026-10-19

- Current main before docs update: `c25d7b95fa02aa839e37d463516bf903a443e6a8`; prior first-time onboarding fix is `b0a003f63bc5d6c7ff97e605b784ae4bb0c50e19`. Branch `main`.
- Added a Playwright case to `tests/e2e/smoke.spec.ts` that seeds a synthetic authenticated student session and intercepts every Supabase request. It models no profile/preferences rows, an empty saved-subject list, and active subjects including ENG; it asserts onboarding renders without catalogue records, English is checked and disabled, three additional subjects are selectable, the count updates, Continue remains disabled before three choices and enabled after, and unselected subjects are disabled at the limit.
- The browser test intercepts all requests to the configured Supabase project URL; it must not access or mutate production data. This is UI-contract coverage with mocked API responses, not a live authenticated-user persistence test.
- CI results for the new test commit are pending at documentation time. Do not claim this regression test passed until the E2E workflow for the commit is complete. Previous Verify and E2E workflows both passed on `a9f0485990ef5c3d2448bb2bda8933f97129691e`; that E2E run used only the prior smoke specs.
- Remaining gaps: save/reload persistence and Learning/CBT navigation are not yet covered by authenticated Playwright; security advisor warnings (SECURITY DEFINER review and leaked-password protection) remain open. Batch 2 remains OPEN. No user action required yet.
- Next action: check CI for the Playwright regression commit; fix any test issue, then add mocked save/reload and Learning/CBT journey assertions before considering this acceptance criterion covered.


## Continuity reconciliation — preparation-first onboarding (2026-10-19)

**Current product direction correction:** The catalogue is no longer part of the active student onboarding/core preparation journey. Do not treat institution/programme/rule ingestion, catalogue row counts, or catalogue publication as Batch 2 blockers. Institution and course goals are optional profile fields; students can select preparation subjects without catalogue records. Existing catalogue/import code and data are legacy/adjacent infrastructure and must not be deleted without a dependency/security review.

**Verified repository state at this checkpoint:** branch `main`; latest commit observed is `e912d5e5c0b7b0127ddddcf15c3fc6465c30e1be` (`docs: checkpoint onboarding browser test`). The code fix in `b0a003f63bc5d6c7ff97e605b784ae4bb0c50e19` treats absent first-time profile/preferences rows (PGRST116) as optional during onboarding load. Commit `c25d7b95fa02aa839e37d463516bf903a443e6a8` added mocked authenticated Playwright coverage for the first-time setup screen, English locked/preselected, and three additional subject choices. This is mocked UI coverage, not live persistence or a real authenticated end-to-end test.

**Unverified / still open:** the current workflow result for the latest E2E test commit was not established in this checkpoint. Save/reload persistence and post-setup Learning/CBT navigation coverage are still missing. The current reported production error, “Unable to prepare your ACE account. Please try again.”, is not yet root-caused. `StudentFoundationGate.tsx` calls `ace.rpc('is_admin')`, then `registerCurrentDevice()`, before profile lookup; the device-registration path is a lead to inspect, not a confirmed cause. No production write or deployment was performed as part of this checkpoint.

**Security review:** prior evidence reported Security Advisor warnings for authenticated-executable SECURITY DEFINER functions (including the preparation RPC) and disabled leaked-password protection. Review the function body and ownership/authorization checks using `auth.uid()`; do not blindly revoke legitimate student access or bypass authentication. Leaked-password protection remains a separate hardening item.

**Next action:** fetch current Verify/E2E workflow status for the latest `main` commit and inspect the device-registration/RPC error path against logs. Add/finish mocked save-and-reload plus Learning/CBT navigation coverage; where feasible, perform a controlled authenticated persistence test without privileged bypass. Then update this handoff and the continuity checkpoint with exact evidence. Batch 2 remains OPEN until the core onboarding journey and checks pass.


## First-time profile creation fix — 2026-10-20

- Added `src/components/StudentFoundationGate.tsx` error extraction so Supabase/PostgREST errors that are plain objects can expose their message instead of always collapsing to the generic fallback.
- Added migration `supabase/migrations/20261020000100_first_time_preparation_profile.sql` and applied it to Supabase project `uokiqlgmzprqfbzmedaz`. The preparation-save RPC now inserts a profile row for the currently authenticated user if missing, using `auth.uid()` and the JWT email, with `ON CONFLICT (id) DO NOTHING`; it then updates that user's profile/preferences/subjects as before. No catalogue dependency was introduced.
- Live verification: queried `pg_get_functiondef` and confirmed the deployed RPC contains both the profile insert and `auth.uid()` authorization. This verifies deployed function definition only; no real student save/reload browser journey was run.
- The generic account-initialization error remains not fully diagnosed: error extraction is now better, but the actual failing request from the affected student's session has not been captured. Do not claim the login/initialization screen is fixed until retested.
- CI/build/E2E after these commits has not been verified. Batch 2 remains OPEN.


## Batch 2 closure — student journey confirmed by project owner (2026-10-20)

- The project owner reports successfully logging into a student account and confirms all three acceptance checks work: login, preparation setup/save, and persistence after refresh plus Learning/CBT navigation.
- Based on this live user verification, **Batch 2 is CLOSED for the active preparation-first student journey**. The empty institution/programme/UTME-rule catalogue is not a blocker and is not part of this batch's acceptance criteria.
- Code/database evidence already recorded above: first-time profile-save migration is applied to live Supabase project `uokiqlgmzprqfbzmedaz`; read-only function-definition check confirmed profile creation and `auth.uid()` usage. This was not a synthetic auth bypass.
- Evidence boundary: the end-to-end journey is user-confirmed, not independently observed by the agent. Current CI/build results and automated authenticated persistence/navigation coverage remain unverified. These are follow-up QA tasks, not reasons to keep the user-confirmed Batch 2 student journey open unless a regression is found.
- No frontend deployment was performed as part of this closure.
- **Next action:** proceed to the next project milestone from the canonical roadmap; keep CI/build and automated end-to-end coverage in the QA queue.


## Batch 3 kickoff — Academic Structure audit (2026-10-20)

### Scope and continuity
- Batch 2 is closed for the active preparation-first student journey based on the project owner's direct confirmation. This kickoff follows the canonical roadmap's **Phase 4 — Academic structure** (JAMB season engine, subjects, syllabus topics/subtopics, question taxonomy); it does not revive catalogue ingestion as a student onboarding prerequisite.
- Repository checked: `DarealNovaking/Nova-ace-jamb`, default branch `main`, observed HEAD `20c0910ccc551e06468bdd5b339b985fc67be764` (commit message: `docs: close Batch 2 after student journey confirmation`).

### Existing structure confirmed in source
- Migration `supabase/migrations/20260914210000_batch_2_jamb_season_syllabus_engine.sql` already defines exam configuration subjects, versioned syllabi, syllabus-version links on topics/subtopics, and season/config scaffolding; it also contains historical 2026 exam configuration and a 2027 draft season. Do not create duplicate tables or blindly reapply/rewrite this migration.
- Existing schema also has `ace.subjects`, `ace.topics`, `ace.subtopics`, `ace.questions`, `ace.exam_seasons`, `ace.exam_configs`, `ace.syllabus_versions`, and `ace.learning_progress`, all reported by the connected Supabase schema listing with RLS enabled.
- Existing question rows support subject/topic/subtopic mapping, difficulty, year, media/provenance/rights metadata, content version, review state, and active status. Persistent CBT RPCs use published questions and stable stored answer keys.
- Current `src/components/StudentOnboarding.tsx` loads active subjects and intentionally does not require institution/programme/UTME catalogue records.

### Verification boundaries / risks found
- The connected Supabase table-list tool reported approximate row counts of zero for `ace.subjects`, `ace.topics`, `ace.subtopics`, `ace.questions`, `ace.exam_seasons`, `ace.exam_configs`, and `ace.syllabus_versions`, while it reported eight rows for `ace.student_subjects`. These are tool-reported counts, not independently confirmed SQL counts; because the owner has verified the live onboarding journey, treat the apparent mismatch as **requiring a targeted read-path/count check**, not proof that the live subject catalogue is empty or broken.
- CI status for current HEAD is not established by the commit-workflow wrapper (it returned no workflow runs/statuses). Do not claim the latest build/typecheck/E2E is green.
- The current main `src/App.tsx` appears to be a separate AppDeploy-style prototype (`@appdeploy/client`), while the preparation-first Supabase onboarding lives in components and libraries. Before adding academic-structure UI, trace the actual entrypoint/router/build path so changes land in the active application rather than a dormant prototype.
- No code, database rows, migrations, or deployment were changed during this kickoff audit.

### Next concrete action
1. Trace `src/main.tsx`, `index.html`, Vite config, and the actual routing/entrypoint to establish which UI is built and deployed.
2. Reconcile the live academic table counts through a supported read-only path, and inspect current subject/season/config records without writing data.
3. Inventory the actual subject/topic/subtopic read/write services, question taxonomy and admin/editor workflows. Then implement the smallest missing academic-structure capability with RLS and review/publish gates; do not seed invented JAMB syllabus data or activate unverified seasons/configuration.
4. Run typecheck/build and relevant Playwright checks, then update this handoff and the continuity checkpoint with exact results.

### Status
**Batch 3 / Academic Structure: IN PROGRESS — audit only; implementation has not yet started.** No production changes made.


## Legacy provider removal — 2026-10-20

- Owner instruction: remove every AppDeploy-related integration from the ACE JAMB repository.
- Deleted `src/App.tsx` (unused prototype not imported by the actual Vite entrypoint `src/main.tsx`), `src/providerBridge.ts`, `src/types/appdeploy-client.d.ts`, and `appdeploy.auth-login.json`.
- Removed the `@appdeploy/client` Vite alias from `vite.config.ts`. The actual app entrypoint remains `src/main.tsx`, which uses Supabase-backed student/admin gates and persistent CBT components.
- Sequential GitHub commits: `35fc382fd8ace91464c743973da332eadf196c21`, `216dc14e1d0859abb0d43e4651a8b48e6806b613`, `4c03678ed0dc9fd051c20f1d01b8bd9d5166e2e8`, `f3740d5712033263a651905d7cf94591b1fbca52`, `f253e249370e170f97eb0151422015513c2636a5`.
- No database changes or deployment were performed. Build/typecheck/tests have not yet been run after these removals. Next action: search the repository for residual provider references, run typecheck/build and relevant Playwright tests, fix breakages, then continue Batch 3 academic-structure implementation.


## Continuation checkpoint — legacy removal regression and active student dashboard (2026-10-20)

- Repository verified on `main`; latest observed code commits: `9c585a6213b2943573abdb5601a3e5c2a2f1b19f` (new Supabase-backed student dashboard), `69404fe1fff598429b45ec8169162ffedbf7a6be` (gate uses dashboard instead of deleted legacy App), and `7c1c124e459b7a64816c4277dac59c750f9364eb` (align subject filter to canonical `active` column).
- CI on the pre-fix HEAD `84d36fbe87ad7b1c690a28187c0fe7be6967b3a2` failed in both Verify and ACE JAMB E2E at TypeScript check: `src/components/StudentFoundationGate.tsx(13,17): error TS2307: Cannot find module '../App'`. Build and Playwright steps were skipped because typecheck failed. Disposable PostgreSQL UTME subject-choice migration test passed; static parser/import tests and Deno function checks passed.
- Root cause: the deleted `src/App.tsx` was not unused; `StudentFoundationGate.tsx` still imported it and rendered it for prepared students. The old component used the removed `@appdeploy/client` integration and mock/demo questions, so restoring it would reintroduce the prohibited legacy provider.
- Fix: added `src/components/StudentDashboard.tsx`, a Supabase-backed student landing surface that loads the student's saved profile and subjects, shows only active subject records, displays syllabus topics only from active syllabus versions marked rights-approved, and provides navigation into the existing persistent CBT route. Empty/unpublished syllabus content has an explicit safe empty state. Updated `StudentFoundationGate.tsx` to render this dashboard.
- No Supabase production data, migrations, privileged functions, or deployment were changed. No catalogue data was re-uploaded or required.
- Verification boundary: CI runs for commits `9c585a62`, `69404fe1`, and `7c1c124e` were queued when recorded; do not claim the fix passes until final workflow results are fetched. The failed pre-fix E2E did not run browser tests. The new dashboard's authenticated live behavior is not independently verified yet.
- **Next action:** fetch the latest Verify and ACE JAMB E2E runs for HEAD `7c1c124e459b7a64816c4277dac59c750f9364eb`; fix any TypeScript/build/test failures and rerun. Once green, continue Batch 3 Academic Structure: perform supported read-only SQL counts/inspection for subjects, topics, subtopics, seasons, configs, syllabus versions and questions; inspect current admin/editor workflows; implement only the verified gap with RLS and review/publish gates. Batch 2 remains closed for preparation-first onboarding; catalogue ingestion is not a student onboarding prerequisite.


## Batch 3 academic data audit + dashboard CI result (2026-10-20)

- Latest completed Verify run for code commit `7c1c124e459b7a64816c4277dac59c750f9364eb` succeeded: static tests, both Deno Edge Function checks, TypeScript typecheck, Vite production build, and disposable PostgreSQL UTME migration test all passed. ACE JAMB E2E for that commit was still running at the time of this note; browser-test result must be fetched separately.
- A repository search for `appdeploy` returned no matches after the dashboard/gate correction.
- Read-only SQL audit against live Supabase project `uokiqlgmzprqfbzmedaz` (schema `ace`) returned exact counts: subjects 25 (all active); topics 0; subtopics 0; exam seasons 2; exam configs 1 (0 active); syllabus versions 50 (0 active, all 50 draft with rights_status=pending); questions 0. The 2026 season is closed; 2027 is draft. The only exam config is the inactive “2026 UTME official structure” with 180 questions and 7200 seconds. No data was written.
- The first count query failed because it guessed `questions.is_active`; PostgreSQL identified the actual column as `questions.active`. The corrected read-only query succeeded. No schema changes were needed.
- Existing database controls include editor/admin policies for subjects, topics, subtopics, exam_config_subjects, syllabus_versions and questions, plus SECURITY DEFINER activation/validation RPCs: `activate_exam_config`, `activate_exam_season`, `activate_syllabus_version`, `validate_exam_config`. The current admin UI has catalogue import/staging panels only; no academic-structure editor was found in the current component inventory. Existing policy definitions are evidence of database-side boundaries, not proof of complete function-body/grant security review.
- Current verified gap: there is no approved syllabus/topic/question content and no active season/config in live data. Do not invent syllabus rows, activate the draft 2027 season, or seed unofficial JAMB content. The next implementation should provide least-privilege academic authoring/review UI that uses the existing schema and publication/activation gates, after reviewing the RPC bodies/grants and the role gate.
- **Next action:** finish checking the latest ACE JAMB E2E run; then review activation/validation RPC definitions and grants read-only and trace how editor roles are routed. Build the smallest secure admin/editor academic-structure workflow for managing draft syllabus/topic content with provenance and rights status; keep publish/activation behind existing server-side validation. Run typecheck/build/Playwright and update both handoffs with evidence.


## Verification follow-up — E2E and academic publication boundary (2026-10-20)

- ACE JAMB E2E run `39506340498` on code commit `7c1c124e` passed: TypeScript check, production build, Playwright browser tests; job log reports **6 passed (4.3s)**. Verify run `39506340527` also passed all jobs. These results cover the code state through the active-subject-column fix; latest main documentation-only commits also have Verify passed, while their E2E browser jobs were still running at the last poll.
- Read-only review of activation RPCs confirms `activate_exam_config`, `activate_exam_season`, and `activate_syllabus_version` check `auth.uid()` and `ace.is_admin_or_editor()`, use fixed `pg_catalog, ace` search paths, and are executable by authenticated but not anon/public. `validate_exam_config` is read-only and executable by authenticated, not anon/public; it does not itself require editor role, so keep it as validation-only.
- **Security/correctness finding for next implementation:** current public SELECT policies on `ace.topics` and `ace.subtopics` permit reads based on the row's `active=true` without requiring its linked syllabus version to be active and rights-approved. The syllabus activation RPC requires at least one active topic, so an editor could mark a topic active while its syllabus version is still draft, exposing draft material before syllabus activation. Before adding authoring controls, harden public read policies so student/anon visibility requires an active, rights-approved syllabus version; editors/admins retain review access. Add disposable PostgreSQL policy regression tests and do not apply a production migration until the migration is reviewed and verified.
- **Next action:** implement and test the syllabus-version-aware public read boundary, then add a separate `/admin-academic` editor/admin route for draft syllabus/version/topic/subtopic authoring with source/provenance and rights state. Keep activation through existing guarded RPCs; do not invent JAMB content or activate the current 2027 draft.


## Batch 3 implementation — syllabus visibility and academic authoring (2026-10-20)

- Added repository migration `supabase/migrations/20261020120000_syllabus_publication_visibility.sql`. It replaces the broad topic/subtopic public-read rules with a requirement that rows be active and associated with a parent syllabus version that is both active and rights-approved. Subtopics must also match an active parent topic in the same syllabus version. Admins/editors retain draft review access via the existing `ace.is_admin_or_editor()` policies.
- Added narrow SECURITY DEFINER boolean helper `ace.is_syllabus_version_public(uuid)` with fixed `pg_catalog, ace` search path; it exposes only whether a given version is active and rights-approved, not the version row or metadata. EXECUTE is revoked from PUBLIC and explicitly granted to anon/authenticated for RLS evaluation.
- Added disposable PostgreSQL regression coverage in `tests/sql/syllabus_publication_visibility.test.sql` and wired it into `.github/workflows/verify.yml`. The test checks anonymous visibility for active approved topics only, prevents subtopic visibility for draft/mismatched/inactive-parent cases, and confirms editor review can still see draft rows. The SQL policy test passed in Verify run `39507436241` for commit `566673fb` at the last poll; that run's overall build was still in progress.
- Added `src/components/AdminAcademicWorkspace.tsx` and role-gated `src/components/AcademicFoundationGate.tsx`, routed `/admin-academic` from `src/main.tsx`, and updated `StudentFoundationGate.tsx` to route non-admin content editors to this scoped workspace while preserving the full admin route for administrators. The workspace supports source-backed draft version creation, rights-state review, draft topic/subtopic authoring, active/inactive review flags, and activation only through the existing guarded `activate_syllabus_version` RPC. New topics/subtopics start inactive. It does not create or invent official syllabus content.
- Added Playwright coverage for authorized editor access and student denial in `tests/e2e/smoke.spec.ts`. The latest E2E run `39507436232` for commit `566673fb` was still running at the last poll; fetch final result before claiming complete.
- All work is committed to `main`; latest observed commit at this update is `566673fb72311d730686d31d126a66ed0acee255`. No production migration was applied, no live database data was changed, and no deployment was initiated.
- **Next action:** fetch final Verify and E2E results for latest `main`; inspect/fix any failures. If green, review the migration once more against live policy grants, then obtain explicit authorization before applying it to production. After application, re-run read-only policy checks and continue academic authoring with source-verified syllabus material only.


## Verification closeout — academic editor (2026-10-20)
- Verify run `39507436241` passed on code commit `566673fb72311d730686d31d126a66ed0acee255`, including TypeScript, production build, Deno checks and both disposable PostgreSQL test scripts. The syllabus visibility regression test passed.
- E2E run `39507436232` passed on that same code commit; Playwright reports 10 passed (8.2s), including authorized-editor and student-denial coverage.
- Documentation commits followed the verified code commit; the workflows for the newest docs-only HEAD were still running at the last poll. Check latest HEAD before claiming every workflow is green.
- The migration is committed but unapplied to production. Next: verify latest HEAD workflows, then request explicit authorization before applying the migration and checking live policies. No production data changes or deployment occurred.


## Production migration applied — syllabus publication visibility (2026-10-20)

- Project owner explicitly authorized applying the reviewed syllabus visibility migration.
- Applied migration `syllabus_publication_visibility` to live Supabase project `uokiqlgmzprqfbzmedaz`; Supabase migration history records version `20261020222636`.
- Read-only post-apply verification confirms the `topics_public_read` policy requires active topics plus an active, rights-approved syllabus version; `subtopics_public_read` additionally requires an active parent topic with matching topic/version IDs. Both retain the existing `ace.is_admin_or_editor()` review path.
- Read-only function/grant verification confirms `ace.is_syllabus_version_public(uuid)` is SECURITY DEFINER with fixed `search_path=pg_catalog, ace`; EXECUTE is true for `anon` and `authenticated`, false for `PUBLIC`.
- No syllabus content was inserted/activated, and no frontend deployment was performed.
- Current main HEAD `e1f15d4bb99810b5fb04781c9095520aab41a33b` has successful Verify run `39507661501` and ACE JAMB E2E run `39507661518`. Earlier code commit `566673fb` also passed Verify and 10 Playwright tests.
- Next: smoke-test public topic/subtopic reads against the live API with anonymous access and editor draft access (without modifying content), then continue source-verified syllabus authoring/review. Do not activate unverified official JAMB content.


### Follow-up security note — anonymous API visibility check (2026-10-20)
- Read-only role privilege check found `anon` lacks `USAGE` on schema `ace`, while `authenticated` has it. A read-only `SET LOCAL ROLE anon` query failed at schema resolution before table RLS; no data changed.
- The migration's table policies are installed and verified, but anonymous HTTP/schema-level access is **not yet proven**. Do not grant schema-wide anonymous access without reviewing other ACE object grants and intended public API scope.
- Next: inspect the original schema-exposure migration and object privileges; determine whether anonymous syllabus reads are required. If not, validate visibility with a non-editor authenticated role; if yes, apply the narrowest safe grant and regression test.


## Academic editor API privilege gap — 2026-10-20

- Read-only live grant audit found authenticated has table privileges on `ace.syllabus_versions` but no SELECT/INSERT/UPDATE grants on `ace.topics` or `ace.subtopics`. The existing editor component calls those tables through the authenticated Supabase Data API, so the workspace's topic/subtopic loading and authoring would fail despite RLS policies being correct.
- Added source migration `20261020230000_academic_topic_editor_api_privileges.sql` granting SELECT/INSERT/UPDATE on topics and subtopics to `authenticated`. These grants do not bypass RLS: the existing `topics_editor_manage` and `subtopics_editor_manage` policies still require `ace.is_admin_or_editor()` for writes; SELECT remains constrained by publication/editor policies. No DELETE grant was added because the current workspace does not delete rows.
- Updated the disposable visibility SQL test to apply the grant migration. CI for the latest commits must confirm the combined test passes.
- **Production status:** this new privileges migration is source-only and has NOT been applied to live Supabase. The earlier authorization covered the syllabus visibility migration specifically, not this additional table-privilege change. No production grant was changed by this audit.
- Next: verify CI for the source migration/test, then request explicit authorization to apply the topic/subtopic API privilege migration. After approval, apply it and read-only verify grants, RLS policies, and the live editor workflow. Anonymous schema access remains intentionally ungranted; the product currently exposes the ACE schema to authenticated users only.


## Academic topic/subtopic API privilege migration — applied and verified (2026-10-20)

- Project owner replied “proceed” to the explicit request to apply the separate topic/subtopic API privilege migration after CI passed; treated as authorization for this migration only.
- Confirmed main HEAD before this documentation update was 6178069dfa5bc13ddd28cf396d5c73b2353c8ec8.
- Current-HEAD CI passed before applying the migration: Verify run 39510386608 and ACE JAMB E2E run 39510386522, both on 6178069dfa5bc13ddd28cf396d5c73b2353c8ec8.
- Applied source migration supabase/migrations/20261020230000_academic_topic_editor_api_privileges.sql to live Supabase project uokiqlgmzprqfbzmedaz using migration name academic_topic_editor_api_privileges. Live migration history now records version 20261020224807.
- Read-only verification confirms both ace.topics and ace.subtopics grant authenticated SELECT, INSERT and UPDATE; DELETE remains false; RLS is enabled on both tables.
- Read-only policy verification confirms topics_editor_manage and subtopics_editor_manage still require ace.is_admin_or_editor() for writes. Publication SELECT policies remain in place, including active/right-approved syllabus-version checks and the active matching parent-topic check for subtopics. No anonymous schema usage was granted.
- No syllabus/topic/subtopic content was inserted, edited, or activated. No frontend deployment was performed. Database grants and policy definitions were verified; a real authenticated editor browser/API create-and-read smoke test is still pending.
- Next action: run a safe live editor workflow smoke test with an authorized editor session (draft-only; no activation of unverified content), confirm topic/subtopic reads and draft writes, then update both handoff files with the observed result. Keep anonymous schema access unchanged.


## Frontend-first continuation — prepared student journey coverage (2026-10-20)

- Repository: `main`; implementation commit `5893127760a7fac88871cc934544fb6cd77f61a6`.
- Confirmed latest pre-change HEAD `5047974f35ebbdffe712c9f663420f10506ed847`; latest Verify and ACE JAMB E2E runs on that HEAD both passed (`39510772594`, `39510772622`). The prior documentation commits' Verify/E2E runs also passed.
- Added a fully mocked Playwright journey in `tests/e2e/smoke.spec.ts` for an already-prepared student: dashboard renders the persisted profile/subjects, explicitly reports the unpublished syllabus state without inventing topics, survives a reload, and enters CBT route (`?cbt=1`) with a back-to-dashboard control. Supabase HTTP calls are intercepted, so this test does not read or write production data.
- No application UI logic, live database data, migration, deployment, or catalogue import was changed in this step.
- Verification status for implementation commit `5893127760a7fac88871cc934544fb6cd77f61a6`: Verify run `39511826720` and ACE JAMB E2E run `39511826534` were queued immediately after the test commit. Do not claim the new test passed until those runs complete.
- Current frontend gap remains: the student dashboard exposes approved syllabus topics when available, but there is no distinct lesson/content-reading flow yet; live syllabus versions/topics remain unpublished/empty according to the last verified database audit. Keep the empty state honest and do not fabricate official content.
- Next action: fetch both workflow results for `5893127760a7fac88871cc934544fb6cd77f61a6`; fix any test/typecheck/build failures. Then continue frontend-first by tracing existing Learning/Practice/CBT components and implement the next usable student-facing flow against available verified data, while keeping Supabase/RLS integration boundaries intact. Update this handoff and the continuity checkpoint after each meaningful change.


## Frontend batch — student preparation workspaces + admin milestone alignment (2026-10-20)

- Scope delivered on `main` after the previous prepared-dashboard regression test:
  - `06b5b78672ee31db7e69dcc0f16ca73431685232` adds `src/components/StudentStudyWorkspace.tsx`, with dedicated Learn, Practice, Quick Revision, Flashcards, Progress and Study Plan views.
  - `1f7253c02325d6003bd1f3c395b0a236d69ebe43` connects the student dashboard to those views and adds responsive navigation.
  - `c18baf86e1482076aabea9cbb15f281fa348dc1c` adds Playwright coverage for workspace navigation and honest empty states.
  - `a02516bf0e308958c4564ea6960ee4fbeed4485b` aligns the administrator dashboard with the current Batch 3 academic-structure milestone and adds a direct Academic Structure link.
- The student UI now exposes the preparation areas together. The views use only saved subjects and active/approved topic data passed from the dashboard. Empty states explicitly distinguish unpublished lesson, question, flashcard and performance data; no fake official JAMB topics, questions, scores or completed schedules are generated.
- Practice links to the existing protected CBT route to check availability; the existing persistent CBT engine remains the session implementation. Full lesson content, question authoring/review, flashcard facts and real analytics still depend on reviewed content and/or actual saved attempt data.
- Admin dashboard copy no longer presents Batch 2 as the current milestone. Existing secure catalogue import/review surfaces were preserved; no catalogue records, student records, Supabase schema, production data or deployment were changed.
- Automated coverage added in `tests/e2e/smoke.spec.ts`. Verify run `39512223624` passed for the workspace component commit `06b5b78672ee31db7e69dcc0f16ca73431685232`. E2E and subsequent Verify/E2E runs for dashboard navigation, new Playwright test, and admin alignment were still running/queued at the time of this handoff update: `39512223597`, `39512272979`, `39512273077`, `39512296427`, `39512296132`, `39512374477`, `39512374470`. Do not call the full frontend batch CI-verified until the latest-main runs complete successfully.
- No deployment performed. No production database changes performed.
- Next action: poll the newest Verify and ACE JAMB E2E runs on `a02516bf0e308958c4564ea6960ee4fbeed4485b`; inspect and fix any typecheck/build/Playwright failure, then update this handoff and the continuity checkpoint with final results. After green CI, continue the remaining real-data-dependent frontend work only against verified published content and actual saved attempt data.


### Frontend batch QA follow-up — Playwright locator failure corrected (2026-10-20)

- E2E run `39512296132` on test commit `c18baf86e1482076aabea9cbb15f281fa348dc1c` failed in the new workspace journey test; typecheck and build passed and 12 other browser tests passed.
- Failure cause from the job log: the exact-name heading locator for Quick revision matched both the page-level `h1` and section `h2`, triggering Playwright strict-mode ambiguity. This was a test locator defect, not a UI navigation or build failure.
- Fixed the Quick Revision and Study Plan assertions to target the page-level heading (`level: 1`) in `tests/e2e/smoke.spec.ts`. Fix commit: `f096ffdbe3079fb933794a5ce158dc03135b9141`.
- CI reruns for the locator fix and the latest admin/dashboard changes are pending. Do not mark the whole batch verified until the latest-main Verify and E2E runs pass.
- Next: poll workflows for `f096ffdbe3079fb933794a5ce158dc03135b9141` and subsequent documentation commits; inspect logs and correct any further failures, then update both handoffs with final green run IDs.


## Frontend continuation — saved student study routine (2026-10-21)

- Refreshed actual `main`: frontend batch locator fix was verified green on HEAD `f74ab7e1f80e5a7859f66a5f68b15c953df753c9`: Verify run `39512540188` and ACE JAMB E2E run `39512540266` both completed successfully. This closes the previous frontend batch's CI follow-up.
- Added `src/components/StudentStudyPlan.tsx`: students can edit daily study minutes and preferred weekdays, see their saved preparation subjects, and save preferences to their authenticated account using existing `getStudentPreferences` / `updateStudentPreferences` service functions and `student_preferences` table. No migration or new backend schema was added. The UI explicitly says it stores preferences and does not claim to generate a personalized lesson schedule.
- Connected the component to `src/components/StudentStudyWorkspace.tsx`; expanded `tests/e2e/smoke.spec.ts` to edit the daily minutes, select a study day and assert the saved-status message. Supabase calls remain intercepted in Playwright; this test does not modify production data.
- Commits: `541cef132ce99222981e9632b7c4f7912f995ee5` (new study-plan component), `ba1b2445d90c86709cb9af607427f9c3bbb3cf6d` (workspace connection), `d2aff7f9cedc6a16b14ef31febcf972d9bf1aeba` (Playwright coverage).
- Current verification for the new feature is **pending**: Verify run `39513774609` and ACE JAMB E2E run `39513774499` on `d2aff7f9cedc6a16b14ef31febcf972d9bf1aeba` are queued; preceding runs `39513749185`, `39513749121`, and `39513734298` are/were running on earlier commits. Do not claim this feature is verified until latest-main runs finish green.
- No production data, migration, deployment, catalogue import, or content publication changed.
- Remaining frontend limitation: Learn/Practice/Revision/Flashcards and analytics still need reviewed lesson/question content or real saved attempts before their substantive learning/assessment behavior can be completed. Do not invent official JAMB content or sample performance.
- Exact next action: inspect the latest-main Verify and E2E outcomes, fix any typecheck/build/Playwright failure, and update both handoffs with the final run IDs. Then continue frontend work against existing verified data and services.


## Frontend completion batch — 2026-10-21
- User authorized batching all remaining frontend work into one coordinated workstream rather than splitting it into repeated small frontend tasks.
- Added `docs/FRONTEND-COMPLETION-BATCH-2026-10-21.md` (commit `0a1cc22685d443ade2c9aec8165cd70b365008a4`) defining scope, acceptance criteria, verification gates, and the exact next action. This is a work definition, not a claim that frontend implementation is complete.
- Verified current app entry in `src/main.tsx`: `/admin-academic` routes to `AcademicFoundationGate`; `/admin` and `/admin-import` route to `AdminFoundationGate`; CBT query state routes to `ProtectedCBT`; default route routes to `StudentFoundationGate`.
- Confirmed existing components include `StudentAuth`, `StudentOnboarding`, `StudentDashboard`, `StudentStudyPlan`, `StudentStudyWorkspace`, `ProtectedCBT`, and `PersistentCBT`. Package scripts include `typecheck`, `build`, and `e2e`.
- No application source was changed in this task. No typecheck/build/Playwright run, live Supabase query, or deployment was performed. Do not represent these as passed.
- Next action: inspect the full source of the existing student journey, study workspace/plan, CBT components, service modules and tests; implement evidence-backed gaps, then run typecheck/build and Playwright and update this handoff/checkpoint with actual results.


## Whole-product frontend scope correction — 2026-10-21

- The project owner explicitly asked where channel integration belongs and directed that the entire project—not only student study screens—be included in the frontend batch.
- Expanded `docs/FRONTEND-COMPLETION-BATCH-2026-10-21.md` in commit `adfd7e0dd7e8439b6e04abf5c4106a008635edee`. The batch now includes the full product UI scope: student identity/onboarding/dashboard, learning/practice/mistake/adaptive flows, CBT, revision/flashcards/audio, study plans/analytics, grounded AI/knowledge UI, community/channel gate, notifications/push, ACE Pass/payments/entitlements, referrals, admin command center, PWA/accessibility/performance, and whole-product QA.
- Canonical handoff section 23 remains authoritative for channel scope: a Ñøvã community/channel CTA is retained; automatic WhatsApp posting is not retained; the actual WhatsApp membership-verification mechanism is UNDECIDED; never treat a client-side “I joined” button as proof.
- Intended student UX placement for the Channel Gate: after successful onboarding/profile setup and before the main dashboard. Institution-specific group routing must use an explicit reviewed mapping; institution/course are optional in the current preparation-first onboarding, so unmapped students need a documented general-community fallback or optional institution choice. Never invent group URLs.
- Implementation order and release gate are distinct: channel UI/flow is now explicitly in the frontend batch, while mandatory membership enforcement must wait for a genuine server-verifiable integration contract. Do not block core preparation by faking membership verification. No automatic channel posting or management.
- Current source inventory shows `src/main.tsx` only routes to the academic editor, admin workspace, CBT, or student gate; existing components cover the student foundation/study workspace and catalogue/academic admin. The tree has no dedicated frontend component/route for community verification, notifications, payments/referrals, grounded AI, audio learning, or the full admin command center. This is an initial UI inventory, not a claim that no underlying database/service contracts exist.
- Existing student workspace source explicitly displays not-yet-published/empty states for lessons, question practice, flashcards, and verified performance. These are unfinished product experiences, not complete features.
- No application source was changed by this scope correction; no build, typecheck, Playwright, live Supabase query, or deployment was run.
- Exact next action: inspect existing migration/service/test contracts and latest CI for community gate, notifications, payment/entitlement, referral, AI/knowledge, audio, feature flags and admin operations; produce an evidence-backed status matrix; then implement the highest-impact missing UI/service integrations and verify with typecheck/build/Playwright.


## Live frontend contract audit — 2026-10-21
- Read-only Supabase inspection confirmed project `nova-ace-jamb` (`uokiqlgmzprqfbzmedaz`) is ACTIVE_HEALTHY and accessible. Do not describe Supabase as blocked.
- Live `ace` schema contains tables for notifications/preferences, products/payments/payment events/providers/entitlements, referral codes/referrals/campaigns/rewards, AI providers/requests/usage, knowledge sources/chunks, flashcards/reviews, learning progress, study plans/items, devices, feature flags, audit events and product events. At audit time, content/activity counts were: 25 subjects; 0 topics/subtopics/questions/flashcards/learning_progress/attempts/study_plans/notifications/payments/entitlements/referrals/referral campaigns/rewards/knowledge sources/chunks/AI requests; 4 notification preference rows; 1 product; 4 referral codes; 2 AI providers; 7 devices. These are time-sensitive counts, not feature readiness claims.
- Live Edge Function inventory returned only `catalog-import` and `ibass-catalog-stage`; no dedicated channel verification, payment webhook, referral qualification, AI request or notification delivery function was listed.
- No community/channel membership or institution-group mapping table appeared in the inspected live `ace` table inventory. The WhatsApp verification decision in section 23 remains UNDECIDED. The frontend must not claim membership verification or unbypassable gating without a real server-verifiable integration. Channel Gate UI placement is after onboarding and before the dashboard; group routing requires an explicit approved mapping and safe fallback.
- Current frontend `src/lib` has auth, CBT, data adapter, device, season/syllabus, student and Supabase modules only; dedicated UI/service modules for channel, notifications, payments/referrals, AI/knowledge and audio were not found in the source tree. Existing DB tables alone do not prove the provider/RPC/service behavior is operational.
- Full-product frontend scope is recorded in `docs/FRONTEND-COMPLETION-BATCH-2026-10-21.md`; latest addition commit: pending/recheck current main. No app source, production data or schema was changed by this audit; Supabase inspection was read-only.
- CI baseline runs `39514640639` (Verify) and `39514640651` (ACE JAMB E2E) passed on earlier docs-only commit `bce60df163ee855ada622276d45488a53bc4ea6f`. Newer runs `39515107606` and `39515107387` were still in progress at query time; recheck latest-main workflows before claiming green status.
- Next action: inspect live RLS/RPC/provider configuration for each existing domain and reconcile DB-only architecture with repository migrations. Then implement UI/service boundaries for the highest-priority real capabilities; channel mandatory verification waits for an independently verifiable contract. Run typecheck/build/Playwright and update this handoff/checkpoint with actual results.


## RLS/service-boundary findings from live read-only audit — 2026-10-21
- Notifications: authenticated students can SELECT their own notifications and UPDATE their own rows for read state; admin has ALL. Notification preferences have a self-only ALL policy. This suggests an inbox/preferences UI can use these existing boundaries, but a delivery/scheduling service still needs verification.
- Products: active products are publicly readable. Payments are self-readable and admin-manageable; entitlements are self-readable and admin-manageable. Student payment creation/verification must use a server/provider flow, not direct client writes.
- Referral codes are self-readable; referrals are readable only to participants; referral rewards are self-readable. No student-write policy for qualification/reward was found, so a frontend must not calculate/award qualification client-side.
- Flashcard review and learning progress are self-scoped; study plans/items are owner-scoped; devices are self-scoped. Their corresponding tables were empty for content/activity in the audit (flashcards 0, learning progress 0, study plans 0), so screens need correct empty states until valid records exist.
- AI providers and knowledge sources/chunks are admin-only; AI requests are self-readable and AI usage is self/admin-readable. No dedicated AI request Edge Function was listed, and no student INSERT policy for AI requests appeared. Do not call provider secrets from the browser or build a fake tutor; establish a server-side request boundary first.
- Feature flags are readable by authenticated users and writable only by admins. Audit events are readable to actor/admin and inserts are constrained to self/null actor. Admin UI must respect these RLS boundaries.
- These findings are schema/policy observations only; no row was changed. See live schema/counts above. No channel verification/group mapping contract was found.


## Phase 1 frontend execution update — 2026-10-21

The first Phase 1 implementation slice is committed; Phase 1 is **in progress**, not complete.

- Student foundation gate now treats a missing first-use preferences row (`PGRST116`) as an onboarding condition, while non-missing-row failures still show a recoverable error. Student UI no longer prints raw database/provider exception text.
- Student workspace navigation now persists valid workspace selection in the `view` query parameter, restores it after reload, and synchronizes with browser history. CBT navigation removes only its own query parameter.
- Removed document-wide button-label interception from `src/main.tsx`; CBT back navigation preserves unrelated query state.
- Source commits: `79d99942491507b0e8e7fc3d1a8f9d4862f7f9ea`, `66b0f606ec33f1061ae97f34c937a5b531c0e3ea`, `4e522f91ee686635dc725149bbac038ff02c9020`.
- Verification status: source was read before modification. GitHub combined status returned no status entries; that is not a CI pass. Typecheck/build/Playwright and authenticated browser verification remain unrun. No database writes or deployment.
- Next action: continue Phase 1 by hardening auth/session transitions and onboarding recovery, then test/harden dashboard routes, learning workspace and CBT. Keep practice tied to verified question records and server-authoritative attempt RPCs. Update the batch tracker and continuity checkpoint after each meaningful slice.


### Phase 1 continuation — auth lifecycle and syllabus tree hardening (2026-10-21)
- Student auth/session gate now recognizes initial session events, defers Supabase requests outside the auth callback, and uses a refresh sequence to prevent stale asynchronous profile/role requests from overwriting newer session state. Missing first-use preferences rows lead to onboarding; raw backend errors are not displayed to students.
- Dashboard workspace state is query-backed and browser-history aware. CBT routing no longer depends on global button text matching and preserves unrelated URL parameters.
- The learning workspace now renders approved subtopics attached to their actual parent topics.
- Commits: `a757f602f7d045d16ed53b511c2a5369a310a689`, `49c8949fdc9771876cc6e6150f96cb9fcc70cd6b`, `fc2b70c7733671d0e13a88265c9da7a95bef91a3`, `95cb90c4bf3f8f4f3f53e043aa95ae3496f459f1`.
- No typecheck/build/Playwright results are claimed. GitHub combined status returned an empty list and commit-associated workflow lookup returned no runs. Continue with Phase 1 batch acceptance tests and CBT hardening.


### CI feedback and correction — 2026-10-21
GitHub Actions exposed a TypeScript parse error at `src/components/StudentDashboard.tsx(128,200)` (`TS1005: '}' expected`) in the workspace navigation click handler. The missing JSX expression brace was fixed in `23735a150ba0d142f29ec0919df69c33236a4f2f`. This is a correction commit, not yet a verified pass; inspect the latest Verify and ACE JAMB E2E runs for this commit before proceeding or claiming tests pass.


## Canonical frontend execution batches (16-batch plan)

This is the single frontend batch plan for the project. The detailed scope and acceptance checklist live in [docs/FRONTEND-COMPLETION-BATCH-2026-10-21.md](FRONTEND-COMPLETION-BATCH-2026-10-21.md). These are execution groups, not claims of completion. Existing working features must be hardened rather than rebuilt; no batch is complete until its acceptance checks pass.

| Phase | Batch | Scope and acceptance target |
|---|---:|---|
| 1 — Core student experience | 1 | Authentication, sessions, account recovery, onboarding/profile, English auto-included + exactly three other subjects, route protection. |
| 1 — Core student experience | 2 | Dashboard, student navigation, account entry points, responsive states, URL/history restoration, recoverable errors. |
| 1 — Core student experience | 3 | Published syllabus tree, subjects/topics/subtopics, lesson view and honest unpublished-content states. |
| 1 — Core student experience | 4 | Practice, reviewed question data, answer/explanation flow, mistakes review and saved progress; never invent official questions. |
| 1 — Core student experience | 5 | CBT/mock setup, timer, navigation, answer persistence/recovery, submission and server-authoritative scoring/results. |
| 2 — Learning & intelligence | 6 | Quick revision and verified flashcard decks/reviews. |
| 2 — Learning & intelligence | 7 | Study-plan creation/schedule, saved learning stats and readiness derived from real activity. |
| 2 — Learning & intelligence | 8 | Audio lessons, accessible playback controls, progress persistence and unavailable/error states. |
| 2 — Learning & intelligence | 9 | Grounded AI tutor with provenance, usage limits and server-side provider boundary. |
| 3 — Community & student services | 10 | Community/channel entry and gate, real membership-status contract, institution-group mapping, return flow and anti-bypass tests. Mandatory verification stays off until provider/server verification and approved mappings exist. |
| 3 — Community & student services | 11 | Student notification inbox, read state/preferences, announcements and push only if delivery infrastructure exists. |
| 3 — Community & student services | 12 | ACE Pass purchase/status, payment provider verification, entitlements and referrals/rewards backed by server-side qualification. |
| 4 — Admin & production readiness | 13 | Admin command center for students, content, questions, audio, flashcards, notifications, payments, referrals, AI knowledge, moderation, analytics and audit. |
| 4 — Admin & production readiness | 14 | Academic administration, syllabus/content publication review, permissions and review-only safeguards. |
| 4 — Admin & production readiness | 15 | Shared design system, mobile responsiveness, accessibility, PWA/offline and safe caching. |
| 4 — Admin & production readiness | 16 | Full route/role regression, Playwright, typecheck/build, integration/security checks, performance and release readiness. |

**Execution order:** finish Phase 1 batches 1–5 first; do not skip ahead to disconnected features. Within each batch: inspect current implementation → smallest safe implementation/hardening → test → update this plan and both canonical handoffs. Independent tasks may run in parallel only when they do not conflict on source files or acceptance dependencies.


## Phase 1 execution status — 2026-10-21

| Batch | Current evidence-based state | Next acceptance work |
|---:|---|---|
| 1 — Authentication & onboarding | Hardened: missing first-use preferences now routes to onboarding; auth refresh sequence guards and initial-session handling added; onboarding errors sanitized. | Verify sign-up/sign-in/password recovery/session races and subject choice through Playwright. |
| 2 — Dashboard & navigation | Workspace state uses `?view=`; reload/back/forward E2E assertions added; CBT URL expectation tightened. | Await current GitHub Verify/E2E runs; test dashboard retry and relevant query-parameter combinations. |
| 3 — Syllabus workspace | Approved topic/subtopic records are passed to the workspace; empty/unpublished states remain honest. | Test with approved/published syllabus fixtures and empty/rights-filtered records. |
| 4 — Practice & questions | UI currently provides a clear placeholder; last live database audit found zero questions. No fake question bank added. | Inspect current question schema/RPC contracts and verified data. Implement only when question records and server contracts permit. |
| 5 — CBT & mock exams | Existing RPC-backed CBT has resume/load/save/submit/timer flow; added active-attempt guards, duplicate-submit guard and sanitized errors. | Verify RPC contracts, expiry/retry/recovery/answer persistence and score output through tests. |

Recent implementation commits: `23735a150ba0d142f29ec0919df69c33236a4f2f` (JSX correction after CI exposed syntax failure), `77c907b1fb548df3f0ca87204f1272137d41f85e` (workspace reload/history E2E coverage), `f886ad493d617e460fc1a34f92b5cd28edf81160` (CBT duplicate submission/error hardening), `3fd59568f9d5e965b78bc90d698afdaee1c6fc9d` (onboarding error hardening).

CI for commit `23735a1` and subsequent docs-only commit `13865f1` passed both Verify and ACE JAMB E2E. New runs for the added workspace test and CBT/onboarding changes are queued/in progress at time of this update; do not treat those latest changes as verified until their runs finish. No deployment or database writes were made.


## Phase 1 continuation — latest source work (2026-10-21)

### Additional implementation completed
- `tests/e2e/smoke.spec.ts`: added route-state assertions for `?view=learn`, reload restoration, browser back/forward, a mocked server-authoritative CBT answer/submission path, active-attempt recovery after reload, and a practice-mode request against an empty published question bank. The tests intercept Supabase; they do not write production data.
- `src/components/PersistentCBT.tsx`: added duplicate-submit protection, active-attempt-only answer writes, safe user-facing errors, completed-attempt result restoration without refetching question content, normalization of the legacy idempotent-submit response's missing `total_questions`, and local recovery-pointer support. It now accepts `mode` so practice calls the existing `start_attempt` RPC as `practice`, not `cbt`. Known empty-bank errors are mapped to an honest published-question message.
- `src/components/ProtectedCBT.tsx`: stores the current attempt pointer under the authenticated user's ID and attempt mode, so accounts and practice/CBT modes do not share recovery pointers.
- `src/components/StudentDashboard.tsx` and `src/components/StudentStudyWorkspace.tsx`: the Practice workspace now starts a real practice-mode server attempt; the normal CBT entry continues to start CBT mode.
- `src/components/StudentOnboarding.tsx`: load/save failures use recoverable messages instead of exposing raw database/provider errors.
- Source/test commits in this slice include `77c907b1fb548df3f0ca87204f1272137d41f85e`, `f886ad493d617e460fc1a34f92b5cd28edf81160`, `3fd59568f9d5e965b78bc90d698afdaee1c6fc9d`, `3ff92a04b6150a5aeac7f4223be1aac1f9e2180a`, `e82b0806a5e955f5ab29b3d790694e8fa5736b9b`, `07240ee8e9c8c87cd307bb3475076d56bdc4ee3e`, `8ae2c2932f0f6e035f0a151667cd329c82de1cb1`, `b9543ce8b629eaf8bd35c7e01360de6bcefd68f7`, `b17fcb169f7170474dc7e272966d4b5ceb74e55b`, `50422f3a2469ac071f260307c1f23eb432046930`, `90ddc88bb188be177925022f2c679cc61b577377`, `82e97c60c9a54fa1477e1a9cdf50b32871faeb3a`, `a093314e2a21ef4027cd704e2839f355ee2a46e0`, `7e7e5019ffebd7b7c28e60bd3e590812c1576979`, `3621f44ab444f6f89fd5c95bd42074cdcf7805bb`, `2877a28c905cab68f5742026092271b13e1b2f46`.

### Verification status — do not overstate
- Earlier GitHub Verify and ACE JAMB E2E runs passed on commit `23735a1` and the documentation successor `13865f1`.
- Verify and E2E passed for the earlier onboarding error-hardening commit `3fd5956` (confirmed from Actions).
- Latest navigation/CBT/practice test and source changes are still queued/in progress at this note; no pass is claimed for those commits yet. See [GitHub Actions](https://github.com/DarealNovaking/Nova-ace-jamb/actions).
- No production database writes, migrations, or deployment were performed.
- The live database audit found no published questions at that time. The practice flow is now wired to the real server RPC but must show the empty-bank state until verified questions are published.

### Exact next action
Poll Verify and ACE JAMB E2E for the latest source/test commits, fix any failing assertions or type/build errors, then inspect the published-question/attempt contracts again and finish Phase 1 acceptance for batches 1–5. Phase 1 remains in progress.


## Phase 1 follow-on — practice mode and recovery contract (2026-10-21)

- The Practice workspace now routes to `?cbt=1&mode=practice` and invokes the existing server-side `start_attempt` RPC with `p_mode: 'practice'`. Standard dashboard CBT explicitly uses `cbt` mode.
- CBT active-attempt pointers are stored locally by authenticated user ID and attempt mode, and are used to call the existing ownership-checked `resume_attempt` RPC after reload. This is a recovery pointer only; answers, timing and scores remain server-authoritative. Completed attempts restore their result without requiring question content to be fetched again. Practice and CBT pointers are isolated from each other.
- The Practice entry maps the known server error for an empty published question bank to a clear unavailable state. No synthetic questions were added.
- Added E2E cases for: practice mode + empty bank, active CBT resume after reload, and a mocked save/submit/result journey. Existing tests also cover dashboard workspace URL/history. All Supabase routes in these tests are intercepted; tests do not write production data.
- Commits after the prior log: `b17fcb169f7170474dc7e272966d4b5ceb74e55b`, `50422f3a2469ac071f260307c1f23eb432046930`, `90ddc88bb188be177925022f2c679cc61b577377`, `82e97c60c9a54fa1477e1a9cdf50b32871faeb3a`, `a093314e2a21ef4027cd704e2839f355ee2a46e0`, `3621f44ab444f6f89fd5c95bd42074cdcf7805bb`, `2877a28c905cab68f5742026092271b13e1b2f46`, `cba0c14efc6808af36be7d9616cae7f6f1b59da9`.
- GitHub CI caught intermediate type errors while the mode prop/callback were being introduced in separate commits. The final source fixes those errors: `PersistentCBT` declares the mode prop and the dashboard click handler explicitly calls `startCbt('cbt')`. CI for the final `cba0c14` commit is queued; no pass is claimed yet. Some earlier intermediate commits therefore correctly show failures and should not be treated as the final state.
- No DB migrations, production data writes, or deployment were performed.

### Current exact next action
Check Verify and ACE JAMB E2E on the latest main commit after `cba0c14` and this documentation update. Fix any remaining typecheck or Playwright failure before advancing Phase 1. Then continue batch 1 auth/onboarding E2E, batch 3 published-syllabus fixtures, and batch 5 CBT expiry/submit/recovery acceptance. Phase 1 is still in progress.


## Frontend Phase 1 continuation — 2026-10-21
- Added Playwright regression coverage for the onboarding save contract in `tests/e2e/smoke.spec.ts`. It intercepts Supabase and checks that the server RPC receives English plus exactly three additional selected subjects, alongside the validated profile fields.
- Source/test commit: `b8881491720d74832f7a18401b905b7967368567`. No production DB writes, migrations, or deployment.
- Verification: Verify workflow for prior checkpoint SHA `a8c44efc5b5438d8b69c06fad8ca3f2f5b00911d` passed. E2E was still in progress at the time of the last check; the run triggered by the new test must be inspected before marking the test verified.
- Continue frontend Phase 1 by checking latest CI, then add CBT expiry/completed-attempt regression coverage. Do not generate or invent official question content while the live question bank remains empty in the last recorded audit.


## Phase 1 continuation — CBT recovery-key correction (2026-10-21)
- Current source inspection found that `ProtectedCBT.tsx` selected a mode-specific recovery key for existing sessions but hard-coded the CBT key after a fresh sign-in. Practice users signing in from `mode=practice` could therefore get the wrong local attempt pointer.
- Fixed in commit `04ad0edae2bfa936997a0edfeb1d6138a87d03f7`: sign-in now uses the route's validated `mode` for the authenticated user's recovery key. No database writes, migrations, or deployment.
- Latest Verify run checked before this fix passed at `38a948349c6c732f5b8ae144051dff3650b089c7`; its corresponding E2E workflow remained in progress, as did several earlier E2E runs. Do not treat browser acceptance as passed based on typecheck/build alone.
- Phase 1 remains incomplete. Exact next action: inspect CI for `04ad0ed`, add/verify sign-in-to-practice recovery coverage, then complete CBT expiry/completed-result recovery and published/unpublished syllabus fixture checks. No official question content may be invented.


## Phase 1 continuation — completed-attempt recovery test (2026-10-21)
- Added a mocked Playwright regression in `tests/e2e/smoke.spec.ts` for restoring a completed CBT result from the ownership-checked `resume_attempt` response without fetching question rows. All Supabase traffic is mocked; no production data is written.
- Test iterations: `4e8fc1c5c6c8493c20635d1651b19d0968ca03bf`, `ef6ec1e5478612d0cb1fa5bd6866c39ef330b6a9`, `bc616ee623ec88cefb524e4c5762901a0ef5e77f`. These are not yet verified by a completed E2E run.
- The fresh-sign-in practice recovery-key defect was fixed in `04ad0edae2bfa936997a0edfeb1d6138a87d03f7`. Latest observed workflow runs were queued/in progress around runner setup, so the browser regression outcome remains unverified. No deployment or DB changes.
- Exact next action: poll the newest E2E/Verify runs; repair actual test failures, then finish CBT expiry/retry and syllabus published/unpublished tests. Phase 1 is not complete until those checks pass.


## Verified continuity update — 2026-10-21

Current repository inspection supersedes older milestone notes where they conflict:
- Repository is private `DarealNovaking/Nova-ace-jamb`, default branch `main`; current latest observed commit before this documentation update was `b0a31f07e90b001771880854162451ce64d55d2f`.
- Current work is Phase 1 core student journey, batches 1–5, not a restart of the earlier catalogue investigation. The latest checkpoint documents auth/onboarding, dashboard/navigation, syllabus workspace, practice/questions, and CBT/mock exams as the current ordered acceptance work.
- Latest source work includes practice-vs-CBT mode-specific attempt recovery, user-and-mode-specific local recovery pointers, completed-attempt result restoration without question refetch, and mocked E2E coverage for workspace URL/history, onboarding payload, empty question bank, active recovery and completed recovery.
- Latest source/test workflow outcome is not verified in this inspection: the GitHub combined-status endpoint returned no status contexts for latest main commit `b0a31f07e90b001771880854162451ce64d55d2f`. Empty status contexts must not be treated as a CI pass. No application code, database write, migration, or deployment was performed during this inspection.
- Next action: inspect the actual Verify and ACE JAMB E2E workflow runs for latest source/test commits, fix failures, add practice sign-in recovery-key regression coverage, then verify CBT expiry/retry and published/unpublished syllabus states. Keep Phase 1 open until evidence supports closure.


## CI verification blocker — 2026-10-21
A read-only browser inspection of the private repository's GitHub Actions page returned 404 because the browser profile is not signed in to GitHub. The combined-status endpoint exposed no status contexts for the observed SHA. Consequently, the latest Verify/E2E results are UNVERIFIED. No workflow was rerun, and no app code, database, or deployment was changed. To unblock this path, the project owner must authorize GitHub sign-in setup in the browser profile (never share credentials in chat). Then inspect current main's Verify and ACE JAMB E2E runs, fix any failures, add the Practice sign-in recovery-key regression, and test CBT expiry/retry plus published/unpublished syllabus states. Checkpoint blocker record is in `docs/AGENT-CONTINUITY-CHECKPOINT.md`.

## Phase 1 acceptance review — 2026-10-21

- **Current objective:** close the core student journey (authentication/onboarding, dashboard/navigation, syllabus workspace, practice/question availability, and CBT/mock recovery) on evidence. Do not restart catalogue ingestion as the student's preparation journey has been decoupled from catalogue completeness. Legacy catalogue tables/functions are retained; they are not the Phase 1 student-entry gate.
- **Repository state:** private repository `DarealNovaking/Nova-ace-jamb`, branch `main`. Latest implementation/test commit at this checkpoint: `ee68f8d3df4447933c30aa5912f26673a01393ad` (`test(cbt): fix practice error and randomized option assertions`). No production migration, data write, or deployment was performed for this review.
- **Verified CI:** Verify workflow run `39530603871` passed on `ee68f8d3df4447933c30aa5912f26673a01393ad`; typecheck/build and the configured unit/SQL verification steps passed in the workflow.
- **Verified E2E failure on prior source SHA:** run `39529889223` failed after typecheck, build, and browser installation passed. 20 tests passed; four failures were two cases in both Chromium and mobile Chromium: (1) practice empty-question error state was not found, and (2) the submit-answer test clicked label `A. First answer` although the mocked randomized option order was `B, A`, so canonical option A is displayed with label B.
- **Test correction committed:** `tests/e2e/smoke.spec.ts` now explicitly mocks the start-attempt RPC error with a JSON content type, waits for confirmation that practice mode reached the RPC, and clicks `B. First answer` for the deliberately randomized `B, A` order. The resulting E2E run is `39530604054` and was still in progress at the time of this note; no pass is claimed yet.
- **Phase 1 status:** OPEN / NOT VERIFIED COMPLETE. Auth/onboarding, workspace navigation, empty-state handling, active-attempt recovery, and completed-result restoration have source/test coverage, but latest E2E must pass and the remaining expiry/retry, practice sign-in recovery, and syllabus publication-state acceptance checks still need completion. A green typecheck/build is not enough to close Phase 1.
- **Exact next action:** inspect E2E run `39530604054`. If the practice error-state test still fails, use the run's logs/artifact to identify the actual rendered state and fix the underlying issue rather than weakening the assertion. Once green, add the practice sign-in recovery-key regression and CBT expiry/retry plus published/unpublished syllabus-state tests; rerun Verify and E2E, then make a closure decision from those results.

## Phase 1 E2E root-cause fixes — 2026-10-21
- The follow-up E2E run `39530604054` still failed with the same four desktop/mobile test failures, but its Playwright error-context artifacts exposed the concrete causes: (1) the practice screen rendered the generic fallback `We could not load this CBT session...` instead of the specific empty-question state because the error-message helper only accepted native `Error` instances; (2) the answer buttons' accessible names were concatenated without a space (snapshot showed `B.First answer`), so the locator with `B. First answer` could not find the control.
- Corrective code commits: `59c9b8c4963e3f568aea492f3374945253541b38` makes `safeCbtMessage` read a string `message` from structured Supabase/PostgREST errors as well as native Error instances; `e9c38e41e15c68c76336efe35dc810541d6feffd` adds explicit accessible labels to randomized option buttons and hides the visual option-letter span from duplicate accessible-name composition. The practice test also explicitly verifies its RPC receives `p_mode=practice`.
- **Verification pending:** Verify and E2E were queued/in progress for these fixes when recorded. Do not claim they pass until the latest-main workflow results complete. The previous run confirms 20/24 tests passed and the two failing scenarios reproduce in desktop and mobile Chromium.
- **Next action:** inspect Verify and E2E for latest main after `e9c38e4`; fix any new failure from actual logs. If green, proceed to the remaining Phase 1 tests (practice sign-in recovery key, CBT expiry/retry, published/unpublished syllabus states), then decide closure.

## Phase 1 acceptance review — verified regression coverage, content gate remains open (2026-10-21)

- **Latest verified code/test HEAD:** c0094f44134e8a334d67c1499ac08f97df3e80a8. Verify run 39532411416 passed; ACE JAMB E2E run 39532411391 passed with **36 tests passed** across Chromium and mobile Chromium. This run includes the new password-reset request test, recovery-session password update test, practice-mode sign-in recovery-key test, expired CBT auto-submit + retry after a transient submission error, active-attempt reload, completed-result restoration, randomized option selection, and active approved-vs-pending-rights syllabus fixtures.
- The password-reset test initially failed because the mock only intercepted PATCH while Supabase Auth's update-user request used a different non-GET method. The test was corrected to intercept non-GET /auth/v1/user requests; latest Verify and E2E now pass. No product defect was inferred from that mock mismatch.
- Fixed application defects uncovered by earlier Playwright artifacts: structured PostgREST errors now preserve the specific empty-question-bank message, and CBT answer buttons expose explicit accessible names while keeping the visible option label. These are in commits 59c9b8c4963e3f568aea492f3374945253541b38, e9c38e41e15c68c76336efe35dc810541d6feffd, and syntax correction 26867a75ff9425151af690cead7306096a485b0d.
- **Read-only live Supabase counts refreshed 2026-10-21:** 25 subjects; 2 exam seasons; 0 active+approved syllabus versions; 0 topics; 0 subtopics; 0 questions; 0 flashcards; 0 attempts. The table-metadata row estimate for subjects was stale; exact SQL count confirmed 25. No live data writes were made.
- **Phase 1 is NOT COMPLETE.** Automated core-flow coverage is now green, but Batch 3 has no live approved syllabus tree, and Batch 4 still lacks real reviewed question records and the actual answer/explanation, mistakes-review and saved-practice-progress journey. The empty states are correct and no official questions/content were fabricated. Mocked fixtures prove UI contracts, not production content readiness. Batch 1 is improved but sign-up and auth/session race/password-reset-link callback behavior still need broader acceptance coverage.
- **Next action:** stay in Phase 1. Inspect the existing question authoring/review/publication path and the start_attempt/question-read server contract, then identify a lawful, reviewable way to supply actual question and syllabus content. Do not write fake questions or jump to Phase 2 while Batches 3–4 remain content-blocked. In parallel, finish auth session/recovery and dashboard retry/query-state acceptance tests. No deployment or migration was performed.

## Latest Phase 1 status — 2026-10-21 (verified CI refresh)
- **Latest main HEAD observed:** `74c9594a33053e16bb713e547d731282e1851ec4` — `test(auth): isolate retry coverage at device registration`.
- **Verify:** run `39533078821` completed successfully on this SHA.
- **E2E:** run `39533078809` completed successfully on this SHA; job log reports **40 passed (38.7s)** using the configured Playwright project matrix (Chromium + mobile Chromium).
- A later intermediate E2E run `39532771958` failed because the test expected a heading that did not match the rendered retry state; the latest commit isolates retry coverage at device registration and the newer E2E run is green. Do not use the old failure as current status.
- **Phase 1 still open despite green automated checks.** Live Supabase read-only audit last recorded: 25 subjects, 2 exam seasons, 0 active approved syllabus versions, 0 topics, 0 subtopics, 0 questions, 0 flashcards, 0 attempts. Therefore production syllabus/question content, real answer/explanation behavior, mistakes review and saved practice progress cannot yet be accepted end-to-end. No official JAMB content has been fabricated; no production data writes, migrations or deployments were performed.
- **Next action:** inspect the existing syllabus/question authoring, review and publication path plus the `start_attempt`/question-read contract. Establish a lawful, reviewable way to populate actual syllabus/question content, without writing fake content or making production changes without approval. Keep Phase 1 open until Batches 3–4 are genuinely usable with approved content. In parallel, continue remaining auth/session-race and dashboard retry/query-state acceptance coverage. Do not restart catalogue ingestion as a prerequisite and do not advance to Phase 2 yet.

## Question rights publication boundary — 2026-10-21

- **Verified live security gap (read-only inspection):** the deployed ace.questions RLS policy questions_public_read allowed active + review_status='published' questions without checking rights_status. The live start_attempt and save_attempt_answer implementations also lacked explicit rights_status filters. Both RPCs are SECURITY INVOKER, but the policy's OR ace.is_admin_or_editor() branch means an editor invoking an RPC could still select restricted/unknown-rights rows. The table currently has zero questions, so there are no existing rows exposed, but this is a publication-boundary defect before content is added.
- **Repository fix committed:** migration supabase/migrations/20261021100000_question_rights_publication_gate.sql now limits public reads and server-side attempt selection/answer saves to rights_status in ('owned','licensed','permitted'), while preserving direct admin/editor review access. Existing start_attempt/save_attempt_answer behavior, signatures, and authenticated grants are retained.
- **Regression test added:** tests/sql/question_rights_publication_gate.test.sql verifies public reads expose only rights-approved rows, editor access can still review all fixture rows, start_attempt excludes restricted/unknown rights even for editors and explicit IDs cannot bypass the gate, and save_attempt_answer rejects restricted content. Verify run 39533469598 passed the new disposable-PostgreSQL test. ACE JAMB E2E run 39533470537 also passed on commit f2d7e0ade4a2607fae8f05c1802dbce267a13e84; the suite contains 40 tests.
- **Production migration NOT applied.** Only the migration source and disposable test were committed; no live schema/data change, deployment, or content write occurred. Because the project batch rules require separate review/authorization for production schema mutation, live Supabase still has the old policy/function definitions until explicit approval and controlled application.
- **Phase 1 remains OPEN.** Current exact live counts remain 25 subjects, 2 exam seasons, 0 active approved syllabus versions, 0 topics, 0 subtopics, 0 questions, 0 flashcards and 0 attempts. Batch 3–4 cannot be fully accepted until reviewed content exists and the content gate is applied to production.
- **Next action:** obtain explicit authorization to apply the reviewed, non-destructive question-rights migration to live Supabase; then verify the deployed policy and function definitions read-only. In parallel, continue the remaining safe auth/session and dashboard acceptance work and identify a lawful, reviewable question/syllabus content source. Do not fabricate content or deploy the app.

## Content source discovery — 2026-10-21

- Located the official JAMB IBASS E-syllabus portal at https://ibass.jamb.gov.ng/e-syllabus; the official JAMB homepage links to IBASS. This is a candidate provenance source for syllabus review, not permission to republish or set rights_status='approved'. The source's reuse/licensing terms remain unverified, so any imported syllabus must remain draft/pending until reviewed.
- No official, reusable question-bank source was verified in this investigation. Do not seed example or generated questions as if they were official JAMB questions. The question-rights migration remains unapplied to production pending explicit authorization.

## Legacy AppDeploy / app deployment removal — 2026-10-21

- Following the user's instruction to remove app-deploy-related assets, deleted .github/workflows/deploy-production.yml, wrangler.jsonc, and the legacy AppDeploy SDK backend/index.ts. Rewrote README.md to remove AppDeploy-provider references and old deployment instructions. No deploy-related filenames remain in the recursive main tree scan, and package.json contains no deploy script.
- No application deployment was initiated. The remaining GitHub Actions workflows are verification/E2E only. Older Cloudflare/AppDeploy deployment notes elsewhere in this master handoff are historical records only and are superseded; do not execute them or recreate deployment assets unless the user explicitly reverses this instruction.
- The student-facing app remains sourced from the React/Vite frontend and Supabase services. The question-rights migration remains source-only and is not applied to live Supabase.

## Scope correction — 2026-10-21

- User reaffirmed the active task boundary: **frontend only**. Do not make Supabase schema/RPC/policy changes, apply production migrations, write production data, or pursue backend/security migration work as the next milestone. The previous question-rights migration and SQL regression test were removed because they were out of scope; the corresponding Verify workflow step was removed. No live Supabase change was made.
- Treat any earlier paragraph in this handoff that recommends applying migration `20261021100000_question_rights_publication_gate.sql` as superseded/out-of-scope. Do not recreate it unless the user explicitly expands scope.
- Current frontend-only next action: continue the Phase 1 acceptance work identified in the latest checkpoint: sign-up/auth session-race and recovery-link callback coverage, dashboard retry/query-state coverage, and front-end syllabus/practice/CBT states using mocked contracts only. Do not fabricate official content; keep empty states honest. No app deployment.


## Phase 1 frontend acceptance — 2026-10-21

- Resumed from verified `main` HEAD `10cc1e4a83182a866128bd8d64a7cfe70e83f10b`. The latest ACE JAMB E2E workflow on that exact HEAD completed successfully (`39536781903`).
- Frontend-only change prepared: dashboard loads now ignore stale overlapping responses using a request sequence guard, and student-facing dashboard failures use a generic recovery message rather than exposing raw provider/database error text.
- Added mocked Playwright coverage for dashboard query failure, non-disclosure of internal error details, retry recovery, and successful empty-state rendering. No Supabase schema/RPC/policy changes, production writes, or app deployment.
- Phase 1 remains OPEN until the updated commit passes CI and the content-dependent student journey can be verified against real reviewed/published content. Existing handoff evidence reports no active approved syllabus/topics/questions; do not invent content or mark this gate passed based on fixtures.
- Next action after this commit: inspect CI on the new HEAD, fix any failing frontend test, and continue auth/session-race coverage using mocked auth callbacks. Keep backend and deployment work out of scope.



## CI failure investigation and correction — 2026-10-21

- Verify passed on commit `2d95ea0b3970fa2da1e3361e6b84f211cc3f251d`; E2E had 40 passing and 2 failing. The failures were both browser projects running the newly added dashboard retry test; it failed before the expected dashboard heading because the fixture injected the failure into the profile endpoint during auth/bootstrap, not into a dashboard-only query.
- Corrected the test to fail the first syllabus-version query instead, leaving mocked auth/profile bootstrap intact, then allow retry to fall through to the fixture. This is test isolation correction, not a production backend change.
- Commits: `c34f9f97246c95e4d6d2fc493c515cb3e5c892ac` (first targeted attempt, superseded by better isolation) and `1054617f37aa84f12ed2f9686ace11de3f5ca0ae` (isolates failure to syllabus-version query).
- Current verification for `1054617f37aa84f12ed2f9686ace11de3f5ca0ae`: Verify and ACE JAMB E2E queued at last check. Do not claim the correction passed until those runs finish.
- Continue frontend only. No Supabase schema/RPC/policy changes, production writes, or app deployment. Phase 1 remains open pending auth/session-race coverage and real reviewed/published syllabus/question content acceptance.


## Dashboard retry fixture target correction — 2026-10-21

- Further source inspection showed syllabus-version lookup is skipped when the active exam blueprint is absent in the standard fixture. The retry test now fails the dashboard-only `rpc/get_active_exam_blueprint` request once and then falls back to the prepared student's mocked `null` response, so the failure is guaranteed to occur in dashboard loading without breaking authentication.
- Latest test fixture commit: `1c7709664b961c3f0019b1fd9d2cb8769b51601c`. Prior CI runs do not include this exact test target yet; await CI on current HEAD before declaring the test green.
- Scope unchanged: frontend-only, no production data writes, no schema/RPC/policy edits, no deployment. Phase 1 remains open pending CI and auth/session-race acceptance plus real reviewed/published content.


## Frontend Phase 1 continuation — latest verified state (2026-10-21)

- Active scope is **complete frontend Phase 1 only**. Backend/database readiness and real published JAMB content are not frontend completion gates. Use mocked API contracts for acceptance and keep empty states honest. No production data writes, Supabase schema/RPC/policy changes, migrations, or app deployment.
- Latest source HEAD at this note: `c119e0e6af1a52da1811e6fa66d102cf1d2fdced` (`test(frontend): correct syllabus and dashboard retry routes`). The previous E2E run on `450b22d33ac6ebe321183b1606df571d2202636f` failed with 38 passed / 4 failed. Two test defects repeated across desktop and mobile: the syllabus fixture accidentally registered its syllabus-version response on the active-exam RPC path, and the dashboard retry test intercepted `syllabus_versions` even though the mocked flow fails at `rpc/get_active_exam_blueprint`.
- Corrected both Playwright route matchers in `tests/e2e/smoke.spec.ts` in commit `c119e0e6af1a52da1811e6fa66d102cf1d2fdced`. Verify run `39607769410` and E2E run `39607769274` were in progress at the time of this note; do not call the fix passed until both runs complete successfully.
- Phase 1 is still **OPEN**. Next: inspect both CI conclusions for exact HEAD; fix any failure; then continue remaining frontend acceptance (auth/session race/recovery callbacks, dashboard query/retry states, syllabus approved/pending states, learning/practice/revision/flashcards/progress/study-plan, CBT expiry/submit/resume/result recovery). Run desktop and mobile Playwright. Close Phase 1 only when the frontend acceptance checklist is satisfied and CI is green; no live content dependency.


## Frontend Phase 1 continuation update — 2026-10-21

- Current scope: **finish frontend Phase 1 only**. Backend readiness and live academic content are not frontend completion gates. Use mocked contracts and truthful empty states. No production writes, backend/schema/RPC/policy changes, migrations, or app deployment.
- Test-fixture correction in `tests/e2e/smoke.spec.ts`: syllabus fixture now routes `syllabus_versions` to its own endpoint (not `get_active_exam_blueprint`); dashboard retry now fails `rpc/get_active_exam_blueprint`, the actual request used by dashboard loading. Source commit: `c119e0e6af1a52da1811e6fa66d102cf1d2fdced`.
- Frontend error handling improvement: study-plan load/save now shows generic recovery messages rather than raw provider/database error text. Added a mocked E2E test asserting save failure does not expose internal provider details. Source commits: `4d6d341ad52d906fe63e1c1aabf76c2cda87ee75`, `593cbd446ecb1e24df05629c5cb4659e0645fafb`.
- CI on the route correction and prior docs commits was still running at the time of this update; the latest source commits need their own final Verify and E2E results. Do not claim the changes passed until completed workflows confirm it.
- Phase 1 remains **OPEN**. Next: poll CI on current main HEAD; fix any failures; then complete remaining frontend acceptance for auth/session race and recovery callback, dashboard retry/query states, workspace states, and CBT expiry/submit/resume/result recovery. No live-content dependency.


## Frontend Phase 1 active continuation — auth race and safe errors (2026-10-21)

- Current milestone remains frontend-only Phase 1. No backend/database changes, production writes, migrations, or deployment; mock API contracts and honest empty states are expected.
- Fixed the test-fixture route mismatches: approved syllabus fixture now intercepts `/rest/v1/syllabus_versions`, while dashboard failure/retry targets `/rest/v1/rpc/get_active_exam_blueprint`. On source commit `c119e0e6af1a52da1811e6fa66d102cf1d2fdced`, Verify and Playwright E2E passed; the E2E suite reported **42/42 passing** on desktop and mobile Chromium.
- Sanitized student study-plan preference load/save errors to generic recovery copy and added a mocked save-failure test that asserts provider details are not rendered. Typecheck/build passed on source commit `593cbd446ecb1e24df05629c5cb4659e0645fafb`; E2E for the expanded suite was still running when this note was written.
- Fixed an initial-session race in `StudentFoundationGate.tsx`: once a recognized Supabase auth-state callback arrives, a slower initial `getCurrentUser()` probe can no longer overwrite the callback's newer user/session state. Auth-probe failures now use generic student-facing copy. Commit `96a0f601f8fd976221f2aa98354702cd94315b1e`.
- Latest HEAD at this note is `96a0f601f8fd976221f2aa98354702cd94315b1e`. Relevant CI runs were still in progress: Verify/E2E must be polled for the latest HEAD before claiming this work passed. Older E2E runs on the expanded test suite were also still running; do not treat those as successful until their final conclusions are available.
- Phase 1 remains **OPEN**. Next: verify current HEAD in CI; resolve any E2E failures or hanging tests; then finish the remaining frontend acceptance list for authentication/recovery, dashboard/query states, workspace states, and CBT expiry/submit/resume/results. No live academic content prerequisite.


## Frontend Phase 1 CI failure investigation (2026-10-21)

- After adding the study-plan save-failure E2E, Verify passed but Playwright E2E failed on both desktop and mobile. The failing step was clicking `Save study preferences`; the button remained unavailable while saved preferences were still loading. The failure is a test synchronization issue so far, not proof of a product defect.
- Updated `tests/e2e/smoke.spec.ts` to explicitly wait for `Loading your saved preferences…` to disappear and the save button to become enabled before clicking. Commit `aea5436978e43530a28a899da12ba4e1843de2c0`.
- Confirmed `Verify` passed on docs HEAD `11ccb9e343686da335f576e245993c5b1b452840`; the E2E job failed on earlier commit `e5163cc26c4cebec562fe8f83474426f686d1333` with the above timeout. E2E on `11ccb9e3` was still in progress during this investigation. A separate Playwright browser-install step also logged DNS resolution failures for `playwright.download.prss.microsoft.com`; it must be distinguished from test failures in the newest run.
- Phase 1 remains **OPEN**. Next: wait for current-main Verify and E2E results after `aea5436`; if green, continue remaining frontend acceptance checks for auth/recovery, dashboard/query states, workspace states, and CBT expiry/submit/resume/results. Frontend-only scope; no production backend, database, or deployment changes.


## Continuation verification — 2026-10-21 (current-main CI lookup limitation)

- Re-inspected the live GitHub repository via the connected GitHub integration. Repository is private, default branch `main`, and this integration has read/write permissions. The newest repository-scoped commit returned by the commit search is `fa4ebb1aa5d7530d691c25196bb735f24d160671` (`docs: record frontend e2e failure and test synchronization fix`); it changes only the master handoff, continuity checkpoint, and `docs/FRONTEND-COMPLETION-BATCH-2026-10-21.md`.
- Read the latest frontend completion batch, current `tests/e2e/smoke.spec.ts`, `src/components/StudentFoundationGate.tsx`, and `.github/workflows/verify.yml`. Current scope remains frontend-only Phase 1. The auth initial-session race fix and recovery-link tests exist in source; more acceptance coverage is still required for auth/session races, dashboard retry/query states, workspace states, and CBT expiry/submit/resume/results.
- Verification lookup attempted on the latest repository commit: GitHub combined commit status returned no status entries. The connected workflow-run lookup explicitly returns only pull-request-triggered runs and returned no runs for the inspected commits, so it cannot establish the current push-triggered Verify/E2E conclusions. No local clone/browser execution was possible through the available tools in this session. **Current-main Verify/E2E is UNVERIFIED**, not green or failed.
- No application code, production data, Supabase schema/RPC/policies, migrations, or deployment were changed in this continuation.
- Exact next action: obtain current `main` push-triggered Verify and ACE JAMB E2E conclusions using a workflow-run listing/log path that includes push events; fix any failures on the exact tested SHA. Then add/verify the remaining mocked frontend acceptance coverage, starting with the initial auth-session probe race and recovery callback, and keep Phase 1 open until the acceptance matrix is green.

## CI lookup follow-up — 2026-10-21

- Followed up on the previously pending run IDs rather than treating them as unknown: GitHub Actions run `39607769410` completed successfully for Verify, including `npm run typecheck`, `npm run build`, parser/contract tests, Deno checks, and the disposable PostgreSQL tests. ACE JAMB E2E run `39607769274` also completed successfully; its Playwright browser-test step and browser installation both concluded success.
- Important SHA boundary: these run IDs correspond to the earlier `c119e0e6af1a52da1811e6fa66d102cf1d2fdced` fixture-correction checkpoint, not the later source change `aea5436978e43530a28a899da12ba4e1843de2c0` (study-preference test synchronization) or current docs HEAD `54ec1c62c95d3782c88890159bc64f2b58aebd5d`. Therefore they verify that earlier baseline only; they do not prove latest-main E2E is green.
- Rechecked commit status and commit-associated workflow lookup for `aea5436` and current docs HEAD: combined statuses remain empty and the workflow lookup exposes only pull-request-triggered runs, with no matching runs. Current latest-main acceptance remains UNVERIFIED for the later source changes.
- Next: continue the existing frontend Phase 1 acceptance list, then use a workflow-run listing path that includes push events to verify the exact latest source SHA. Do not restart completed baseline work. No production/backend changes or deployment.

## Auth-session race acceptance test — 2026-10-21

- Added a mocked Playwright regression test in `tests/e2e/smoke.spec.ts` (commit `7a9d91515f86ed474fd905ab1c89fbac7746ec5a`). It delays the initial `/auth/v1/user` probe, returns a stale unauthenticated response, and asserts that the newer persisted auth-state session still reaches the prepared student dashboard instead of falling back to sign-in. All other requests use the existing isolated mocked fixture.
- GitHub read-back confirms the test exists on `main`. This is source-level verification only; the new test has NOT yet run in Playwright/CI. Do not mark it passing until a run against commit `7a9d91515f86ed474fd905ab1c89fbac7746ec5a` completes successfully.
- Scope stayed frontend-only: no backend/database changes, migrations, production writes, or deployment. Phase 1 remains OPEN.
- Exact next action: retrieve the push-triggered Verify and ACE JAMB E2E runs for this commit, fix any failing assertion/fixture, then continue the remaining dashboard query-state, workspace, and CBT recovery acceptance coverage.


## Current-main verification — 2026-10-21 (auth race test)

- Repository HEAD at inspection: `869a00d8d21243a978a5cb7b580e85c54992e6e1` on `main`.
- Verify push run `39610640949` completed successfully on this exact SHA. Typecheck, production build, parser/contract tests, Deno checks, and disposable PostgreSQL migration/policy tests passed.
- ACE JAMB E2E push run `39610640807` targets the same SHA. Its typecheck/build steps passed; Playwright browser tests were still running at the last poll. E2E must remain PENDING until the run's final conclusion is retrieved.
- The added auth-session race test is present on main but has not yet been confirmed by a completed Playwright run. No production data, Supabase schema, or deployment changes.
- Next: poll run `39610640807`; if successful, continue remaining frontend acceptance gaps including password-recovery callback and CBT resume/results recovery where not covered, with E2E after source changes. Phase 1 remains OPEN.


## Auth/session race and mobile E2E correction — 2026-10-21

- Exact tested SHA `869a00d8d21243a978a5cb7b580e85c54992e6e1`: Verify run `39610640949` passed, including typecheck/build and repository contract checks. ACE JAMB E2E run `39610640807` failed: 42 passed, 4 failed (two distinct tests on desktop + mobile).
- Failure 1: the new race test intercepted `/auth/v1/user` with a 401, which caused the Supabase client to lose its seeded session before the student dashboard rendered. Root cause: the gate was starting `getCurrentUser()` before subscribing to auth-state changes, so the network probe competed with persisted-session initialization. Source fix committed as `74fde7dd9944cc5e4ce387d0ef6bbde622904d7e`: removed the competing initial network probe and now initializes student UI from Supabase auth-state events (server-side RLS/RPC authorization remains authoritative).
- Failure 2: the mobile study-plan test used exact accessible-name matching, but the dashboard button's accessible name also includes its descriptive text. Corrected the locator to match `/Study plan/`.
- Test corrections committed as `6a50545b23a9d4ae77d5b12cb9f4ff5b3cb04ddc`. The race test now asserts that the persisted session renders the dashboard without issuing a competing `/auth/v1/user` probe. This is a deterministic regression assertion, not yet verified by CI.
- Current next action: wait for Verify and ACE JAMB E2E on `6a50545b23a9d4ae77d5b12cb9f4ff5b3cb04ddc`; fix any remaining failures. Keep Phase 1 OPEN until current-main Playwright is green and acceptance coverage is reviewed. No backend/schema changes, production data writes, or deployment.


## Phase 1 frontend acceptance — verified closure — 2026-10-21

- Exact application/test commit: `455456890bac3aba584c54a1cbfe8dff0af8868c` on `main`. GitHub Verify run `39612545662` completed `success`; ACE JAMB E2E run `39612545462` completed `success` on that same SHA.
- E2E evidence: Playwright ran **46 tests, all 46 passed** on the configured desktop and mobile Chromium projects. The run covers account creation/email normalization, password-reset request and recovery password update, persisted student auth state, onboarding with English automatically included plus exactly three chosen subjects, dashboard query failure/retry and safe error copy, workspace navigation/reload/back-forward/empty states, syllabus approved/pending visibility, study-plan save/error recovery, CBT practice start, active-attempt resume, completed-result recovery, answer submission and result rendering, expiry auto-submit and transient submission retry, and editor/student access states.
- Verify evidence: typecheck, production build, parser/contract tests, Deno checks for both catalogue functions, and disposable PostgreSQL migration/policy tests all passed. These are CI checks on the listed commit; no claim is made about live content availability.
- Regression fixes included: removed the competing initial `getCurrentUser()` network probe from `StudentFoundationGate`; initial UI session is now driven by Supabase auth-state events. Corrected Playwright accessible-name matching for the Study plan navigation button on desktop/mobile.
- **Phase 1 (frontend acceptance batches 1–5) is CLOSED for the current mocked-contract acceptance scope.** This does not mean the entire whole-product frontend batch is complete. Keep the larger batch OPEN for the remaining workstreams, including community/channel gate UI and institution routing (without pretending client-side clicks verify membership), notifications/announcements, ACE Pass/payments, referrals, grounded AI/audio, and remaining admin command-center UX. No live academic content, production database changes, migrations, or deployment were part of this Phase 1 closure.
- Exact next action: continue the integrated whole-product frontend batch from its current status matrix, beginning with the remaining workstream/service-contract audit and the safe community/channel gate UI placement after onboarding. Preserve the documented rule that mandatory WhatsApp membership enforcement waits for a genuine server-verifiable contract; do not invent channel URLs, institution group mappings, payment status, notification delivery, or provider capabilities.


## Frontend Phase 2 — community welcome slice started — 2026-10-21

- Phase 1 remains closed on its verified mocked-contract acceptance commit. The active milestone is now the integrated whole-product frontend batch, starting with the documented community/channel flow after onboarding.
- Added `src/components/CommunityChannelWelcome.tsx` and wired it into `src/components/StudentFoundationGate.tsx`. Students completing onboarding see a responsive, keyboard-accessible community welcome page before the dashboard, can optionally open a configured official WhatsApp destination, and can continue without joining. The UI explicitly states membership is not verified here.
- Destination is read only from `VITE_NOVA_WHATSAPP_CHANNEL_URL`; it is rendered only for HTTPS URLs on the allowlisted WhatsApp hosts. No channel/group URL is invented. If unset/invalid, the UI shows an honest “link coming soon” state.
- Extended `tests/e2e/smoke.spec.ts` onboarding flow to assert the welcome page, unconfigured-link empty state, and continuation path. CI must confirm this exact test on the latest main commit before this slice is called verified.
- No backend, Supabase schema/RPC/RLS, production data, or deployment changes. This is an optional community connection point, not secure membership enforcement; institution-specific group routing and verified membership remain out of scope until backed by approved mappings and a server-verifiable contract.
- Exact next action: poll Verify and ACE JAMB E2E for commit `87147e8b90c5bd42167bf3c5305a7ddd73136707`; fix actual failures from logs. Once green, proceed through the existing whole-product frontend status matrix, prioritizing channel-link configuration/documentation and then notification/announcement UI only after checking existing contracts. Do not mark the whole frontend batch complete.


## Frontend Phase 2 community welcome — CI verification result — 2026-10-21

- Verified source/test HEAD before this documentation-only update: `b7867d0c329f787ca3e3913d736bfa301787aa0d`. Verify run `39614886069` passed. ACE JAMB E2E run `39614885727` passed on the exact same SHA; Playwright reported **46 passed (34.9s)** across the configured desktop/mobile projects.
- The existing onboarding E2E now covers the community welcome screen, honest unconfigured-channel state, and continuing to the student dashboard after the saved foundation is loaded. This verifies the optional UI journey against mocked Supabase contracts, not a live WhatsApp destination or membership check.
- Phase 2 is **IN PROGRESS**. The community welcome slice is implemented and CI-verified; no real channel URL has been supplied/configured. No backend, Supabase schema/RPC/RLS, production data, or deployment changes were made.
- Next action: continue the integrated frontend Phase 2 matrix. Confirm the official WhatsApp channel URL/configuration from a trusted project source before configuring `VITE_NOVA_WHATSAPP_CHANNEL_URL`; then inspect existing notification/announcement contracts and implement only supported UI states. Do not invent institution group URLs or claim membership verification.


## Frontend Phase 2 — official community channel configured and notification contract audit — 2026-10-21

- User supplied the official community destination: `https://whatsapp.com/channel/0029VbCW3b1Gk1FtAtO7Qv1N`. The welcome component now uses this as its safe default while still allowing `VITE_NOVA_WHATSAPP_CHANNEL_URL` to override it. URL validation remains HTTPS-only and restricted to approved WhatsApp hosts; the external link opens in a new tab with `noopener noreferrer`.
- Updated `tests/e2e/smoke.spec.ts` to assert the official URL, external target, and safe rel attributes on the onboarding-to-community journey. CI on the resulting HEAD is required before claiming the new assertion passed.
- Notification/announcement contract audit: recursive repository tree and GitHub code searches for notification/announcement files and identifiers found no dedicated frontend component/service, migration, or documented delivery contract in the inspected main branch. This is a bounded source search, not proof no related capability exists in every external provider. Do not invent notifications or pretend delivery exists; next inspect schema/service definitions more broadly, then decide whether to build an honest empty state or a contract-backed UI.
- No backend/Supabase schema/RPC/RLS, production data, deployment, or membership verification changes. The community connection remains optional.
- Exact next action: verify the latest source/test commit with both Verify and ACE JAMB E2E workflows; then continue the Phase 2 service-contract audit and implement the next supported frontend slice.


## Frontend Phase 2 — student notification inbox and preferences — 2026-10-21

- Added `src/components/StudentNotifications.tsx` and mounted it in `src/components/StudentDashboard.tsx`. The inbox reads only the signed-in student's sent notification rows, orders newest first, caps the list at 30, supports per-row mark-as-read, and uses generic retryable error copy. Read-state updates rely on the existing self-only RLS policy; no client-side broadcast/notification creation is implemented.
- Added account-scoped notification preference controls for in-app, email and optional product announcements. Preferences are upserted for the authenticated user under the existing self-only RLS policy. Push preference is shown disabled with explicit copy because a saved preference alone does not configure push delivery. Empty inbox says no sent notifications are available rather than inventing announcements.
- Added Playwright coverage for the honest empty state, disabled push control and saving preferences using mocked Supabase requests. The test does not read/write production student data.
- Read-only Supabase audit confirmed live `ace.notifications` and `ace.notification_preferences` columns and policies: students can select their own notifications, update their own read state, and manage their own preferences; admin has the notification ALL policy. No delivery/scheduling Edge Function is currently listed, so admin broadcast/scheduling and actual email/push delivery are still not claimed as implemented.
- Further read-only check: ACE Pass product is active at 89,900 minor units NGN (= ₦899); Paystack provider is present but disabled; no active referral campaign rows were returned. Student checkout and qualified-referral rewards must remain unavailable/authoritative until the provider and qualification service are genuinely enabled. No live rows were mutated.
- Commits: `6349ed25ec4e5d15bf788080995b21d26edb58cb` (inbox component), `9371a945acfba8d962d9c866674ad01f22e11e53` (RLS-scoped read update correction), `6cb1d82d47cd973ac7f410559d9f1bc14ed3d799` (dashboard integration), `53972edc2d41e5c796b31675b7071b102ef161b4` (Playwright coverage).
- Verification status at this checkpoint: latest main HEAD is `53972edc2d41e5c796b31675b7071b102ef161b4`. GitHub Verify run `39616992052` and ACE JAMB E2E run `39616992180` are queued for this exact SHA; do not claim either passed until final conclusions are retrieved.
- No schema/migration/RPC/RLS changes, production data writes, or deployment. Phase 2 remains in progress; notifications inbox/preferences UI is implemented, while delivery, admin announcements, payment checkout, referral qualification, grounded AI request boundary, audio content, and broader admin command center remain dependent on real service/provider contracts.
- Exact next action: verify CI on this latest HEAD; then continue the remaining Phase 2 UI work only against verified contracts and keep unavailable server-side capabilities clearly disabled/unavailable.


## Frontend Phase 2 — ACE Pass and referral account surfaces — 2026-10-21

- Added `src/components/StudentAccountAccess.tsx` and mounted it on the student dashboard. It reads active products, the signed-in student's own entitlements and payment history, own referral codes, referrals where they are the referrer, and own reward records using existing `ace` schema/RLS boundaries. No direct payment, entitlement, referral qualification, or reward writes are performed.
- ACE Pass panel shows current active entitlement if the server has one, recent payment history, and a disabled checkout control with explicit unavailable copy. Read-only live audit found the ACE Pass product at ₦899 and Paystack provider disabled; no checkout initiation/webhook service was listed. The component does not claim payment completion or enable checkout.
- Referral panel shows only a code already issued by the backend, allows copying it, and counts rows with a server-populated `qualified_at`. It does not generate codes, issue rewards, or show a made-up campaign target; no active referral campaign row was found in the read-only audit.
- Added Playwright coverage for no-entitlement/no-code/no-campaign empty states and disabled checkout, using mocked requests only. This complements the notification inbox/preferences E2E added in the same Phase 2 sequence.
- Latest application/test HEAD at this checkpoint: `5c276b5fd8d6f2a980fcf917e4bf417fb6fd63b7`. Verify run `39617273249` and ACE JAMB E2E run `39617273391` are queued for this exact SHA; do not claim success until they finish.
- No schema/migration/RPC/RLS changes, production data writes, or deployment. Phase 2 remains IN PROGRESS: community CTA, notification inbox/preferences, and read-only ACE Pass/referral status surfaces exist; real notification delivery/admin scheduling, checkout/payment verification, referral qualification/campaigns, grounded AI request boundary, audio content, and remaining admin command-center UI still require verified service/provider contracts and further implementation.
- Exact next action: poll Verify/E2E for the latest SHA, fix any real failures, then continue the remaining service audit and frontend slices. Do not close Phase 2 while the AI/audio/admin/settings/PWA acceptance items remain incomplete or contract-blocked.


## Frontend Phase 2 — learning-support availability and account settings — 2026-10-21

- Added `src/components/LearningSupportStatus.tsx` to the student dashboard. It explicitly reports the grounded AI tutor as not enabled for students until approved knowledge sources and a secure server-side request boundary exist, and audio learning as unavailable until rights-cleared audio/transcripts and a delivery path are published. Read-only live audit found one configured AI provider but zero active rights-cleared knowledge sources, zero knowledge chunks, and no audio table in the inspected `ace` schema; the frontend does not call providers directly or fabricate lessons.
- Added `src/components/StudentAccountSettings.tsx` using existing `getStudentProfile`, `updateStudentProfile`, `getStudentPreferences`, and `updateStudentPreferences` services. It lets the authenticated student edit display name, target score, optional institution/course, and daily study time with range validation and generic save/load errors. Added mocked Playwright coverage for loading and saving those fields; no live student data was modified.
- Updated `tests/e2e/smoke.spec.ts` with checks for AI/audio unavailable states and account settings persistence contracts, in addition to notification preferences and ACE Pass/referral empty states. Test-fixture response for preference upsert was corrected to return the row required by the existing service's `.select().single()` contract.
- Current source/test HEAD: `329206b2a593e64e3c471aed2546c2623482b103`. Its Verify run `39617877703` and E2E run `39617878043` were queued at the last check. Earlier E2E run `39617831967` for the account-settings source/test commit `75c643ec81a75203c6d22fdc3798b1d1a4a5fa23` was in progress; it is not proof of the latest fixture correction. Do not claim tests passed until the exact current HEAD is verified.
- A local Git clone was attempted for direct npm/typecheck/Playwright verification, but this environment could not resolve `github.com`; no local checkout or local test run was produced. CI remains the verification path.
- No Supabase schema/RPC/RLS changes, production data writes, or deployment. Phase 2 is still IN PROGRESS. The student UI now includes community channel, notification inbox/preferences, read-only ACE Pass/referral status, account settings, and truthful AI/audio availability states. Admin announcement delivery/scheduling, payment checkout/provider verification, referral campaign/qualification, secure AI request/retrieval, audio content/player, expanded admin command center, and PWA/offline work remain incomplete or service-dependent.
- Exact next action: poll Verify and E2E for current HEAD `329206b2a593e64e3c471aed2546c2623482b103`, fix any failures, then continue the remaining frontend matrix. Do not declare Phase 2 complete while these listed surfaces remain unfinished or blocked by absent verified contracts.


## Phase 2 Playwright failure investigation and selector correction — 2026-10-21

- Retrieved full GitHub Actions logs for ACE JAMB E2E run `39617989320` (tested SHA `cd8243a49ae7977621c14a403d6ffd485c7a089d`). Result: 48 passed, 6 failed across desktop/mobile; all six were in three newly added tests and were locator/semantic collisions, not failed service assertions.
- Root causes from logs: the account settings and notification preference tests used `getByRole('status')` after adding static AI/audio availability badges with the same role, making the locator non-unique; the ACE Pass heading locator matched both the panel heading and product heading. Corrected by removing live-status semantics from static availability badges and targeting exact confirmation text / the panel's `#account-access-title` id.
- Fix commits: `5ee8fed95ac7a615add09496888827a471e33caa` (static badge semantics), `abea253c3afe4b8b35f37857fb49af3eb2a1b73c` (specific E2E locators). These fixes require a fresh CI run on the latest main HEAD; they are not yet verified by a completed run.
- The same failed run's Verify workflow completed successfully on the prior docs HEAD `cd8243a49ae7977621c14a403d6ffd485c7a089d`; its E2E result remains failed for the test-fixture locator issue described above. No production data or schema was changed.
- Exact next action: run/poll Verify and ACE JAMB E2E on the latest source/test HEAD and fix any remaining actual failures before continuing the Phase 2 matrix.


## Phase 2 current-main verification — 2026-10-21

- After correcting the locator/semantics failures, GitHub Verify run `39618718288` and ACE JAMB E2E run `39618718305` both completed successfully on exact current main HEAD `472f2fdbaf51d92fb21f83ab9c21dd5bdd861d76`.
- Verify workflow passed, including typecheck and production build plus repository contract/Deno/disposable-PostgreSQL checks. Playwright E2E reported **54 passed (34.0s)** across desktop and mobile Chromium projects.
- The previously failing six test cases were resolved by changing only test locators and static badge semantics. No remaining E2E failures are reported for this HEAD.
- This is verification of the current mocked-contract frontend states, not proof of live notification delivery, payment checkout, referral rewards, AI responses, audio playback, production deployment, or whole-product frontend completion.
- Phase 2 remains IN PROGRESS. Next workstream: inspect and extend the existing admin/academic frontend into a truthful operations command center without introducing unsupported broadcast/payment/AI actions; then review PWA/offline readiness and remaining frontend acceptance matrix.


## Phase 2 — admin operations readiness overview — 2026-10-21

- Added `src/components/AdminOperationsOverview.tsx` to the existing admin-only `AdminFoundationGate`. It displays read-only counts for active products, enabled payment providers, pending payments, notification records, active referral campaigns, rights-cleared knowledge sources, enabled AI providers, active flashcards, and registered devices, with explicit caveats that counts do not perform delivery/verification/qualification or enable AI. It contains no student PII and no write actions.
- The overview uses existing admin-authorized `ace` table policies and only count/head queries; it does not mutate live rows. Existing catalogue review/import and academic workspace flows remain in place.
- Added mocked Playwright admin-route coverage asserting the operations overview and honest unsupported-service indicators. No live administrator session or production row was used by the test.
- Source/test commit: `ca4b025c94ff41629d9d59b4c284fa6ef0ba7c6c` (admin integration), `b6002c1d089658cf8cb99955957247d7dbf2c499` (E2E test). Verification is pending for the current source/test HEAD.
- Phase 2 remains IN PROGRESS. This adds operational visibility only; it does not implement admin announcement delivery/scheduling, payment checkout/webhooks, referral qualification, secure AI requests, audio playback, or PWA/offline behavior.
- Exact next action: run/poll Verify and ACE JAMB E2E on the latest main HEAD; fix any failures. Then assess PWA/offline readiness and the remaining admin/account acceptance gaps without adding unsupported write actions.



## Phase 2 — safe PWA shell and offline boundary — 2026-10-21

- Repository audit found no manifest or service worker. Added `public/manifest.webmanifest`, `public/nova-ace-icon.svg`, and `public/sw.js`; linked the manifest/theme/icon in `index.html` and registered the worker only in production from `src/main.tsx`. Installation failures are non-fatal.
- The worker caches only the app shell and Vite content-hashed static assets. It is same-origin GET only, excludes `/rest/`, `/auth/`, `/functions/`, `/storage/`, `/realtime/`, `/api/` and `/sw.js`, and uses network-first navigation with the static root as offline fallback. It does not cache API/auth/payment/CBT response data or claim offline CBT operation.
- Added Playwright coverage for manifest metadata, service-worker asset, explicit API/auth cache exclusions and registration. Verification remains pending; CI attempts on the admin-overview commits failed before any runner was assigned (runner ID 0, no steps/logs). A generic typing correction for count queries was committed as `fcb23495b4399451177e1e7f1f7eef0eb07e0e48`; do not claim admin/PWA verification until CI executes normally.
- Current Phase 2 source/test scope includes community link, notification inbox/preferences, read-only ACE Pass/referral status, account settings, truthful AI/audio states, admin readiness counts, and the PWA shell. Delivery/payment/referral/AI/audio server capabilities remain absent or disabled and are not simulated.
- Exact next action: obtain a real runner-backed Verify and Playwright E2E result for the latest main SHA; fix any source/test failures, then complete the remaining admin command-center review and close only after the acceptance matrix is satisfied.


## Phase 2 CI execution blocker — latest main — 2026-10-21

- Latest source/test/docs HEAD: `ae7f9705feb2b7ac2851e093523be1bd2db01a94` (`feat: add safe installable PWA shell and phase two handoff`). Verify run `39620272686` and ACE JAMB E2E run `39620272651` both concluded failure, but the associated jobs have `runner_id: 0`, zero steps, and no retrievable job logs. Re-running the preceding failed workflow also produced runner-less failures. This is not evidence of a TypeScript or Playwright assertion failure; the jobs did not execute.
- The last runner-backed E2E result before adding the admin command center and PWA was 54/54 passing on `472f2fdbaf51d92fb21f83ab9c21dd5bdd861d76`. It does not verify the later admin/PWA changes. Local verification is also unavailable because this environment cannot resolve `github.com` for a clone.
- No production deployment, Supabase schema change, or live data write was made. Do not mark current HEAD verified or Phase 2 complete until Verify and Playwright execute on a real runner.
- Exact next action: restore runner-backed CI execution (or retry when GitHub Actions can assign runners), inspect actual typecheck/build/test results on `ae7f9705feb2b7ac2851e093523be1bd2db01a94`, fix any real failures, then continue the remaining admin/announcement and PWA acceptance gates. Phase 2 remains IN PROGRESS.


## Phase 2 closeout attempt — CI retry and final blockers — 2026-10-21

- Re-inspected the private repository metadata and current `main` files through the connected GitHub integration. The current main HEAD observed before this note was `6104fc1ffa4c825972baffdfef0693ee82c03456` (`docs: record phase two CI runner blocker`).
- Verified `src/components/CommunityChannelWelcome.tsx` now contains the user-provided official channel URL as a safe HTTPS fallback: `https://whatsapp.com/channel/0029VbCW3b1Gk1FtAtO7Qv1N`. Membership is explicitly optional and not claimed as verified.
- Re-ran the latest Verify run `39620456709` and E2E run `39620456629` (attempt 2) for the current main SHA. Both again concluded failure before useful job evidence was available. The GitHub connector reports null job logs/steps and a log fetch returned BlobNotFound; therefore this is **not** evidence of a source/test assertion failure, and neither build nor Playwright was verified on this SHA.
- Previous known runner-backed baseline remains Verify passed and Playwright 54/54 passed on `472f2fdbaf51d92fb21f83ab9c21dd5bdd861d76`, before the newer admin operations overview and PWA shell. That older result does not verify current main.
- Manual source review confirmed the student settings flow relies on a preferences row existing (`getStudentPreferences().single()`); this is an acceptance risk for accounts without a row and should be covered once runner-backed tests can execute. The admin operations overview uses read-only count/head queries and reports unsupported services honestly. The service worker is same-origin GET only and excludes known API/auth/storage/function/realtime prefixes; its real browser behavior still requires Playwright verification.
- No production deployment, database mutation, schema change, or student-data write was performed in this closeout attempt.
- **Status: Phase 2 is NOT closed.** The batch still has unverified source/test changes and unfinished backend-dependent surfaces: admin announcement delivery/scheduling, payment checkout/provider verification, referral qualification/rewards, secure AI request/retrieval, audio content/playback, and meaningful offline/CBT acceptance. These must not be represented as implemented just because their UI reports status.
- **Exact next action:** open the repository's GitHub Actions page and inspect why both jobs fail without steps/logs; restore a functioning GitHub-hosted runner or resolve the Actions service/runner/account restriction, then rerun Verify and ACE JAMB E2E on the latest main SHA. Fix any actual code failures from those runs, add a regression test for missing student preferences, and continue only the remaining acceptance gates supported by real service contracts. Do not call Phase 2 complete until the exact latest source/test SHA passes the required checks and remaining scope is either implemented and verified or explicitly removed from the phase's acceptance criteria by the project owner.

## Frontend Phase 2 continuation — 2026-10-21

- Current repository `main` was inspected at start of this continuation (`444c3a6eb856ddd33a4211709ce677cd3bb9e072`). Existing Phase 2 notes accurately state that runner-backed Verify/E2E did not execute and Phase 2 is not closed.
- Fixed `src/lib/studentService.ts` so `getStudentPreferences()` handles an authenticated user's missing `student_preferences` row as a first-use state, returning safe defaults via `maybeSingle()`. The existing save path uses `upsert`, avoiding a schema migration.
- Verification is limited to successful GitHub source write. Typecheck, production build, and Playwright are unverified in this environment. No live DB/data changes or deployment occurred.
- Outstanding: add a Playwright regression for missing preferences; execute typecheck/build/E2E once a runner or local checkout is available; do not close Phase 2 until acceptance gates and backend-dependent limitations are reconciled.
- Next concrete action: add the targeted Playwright regression, then verify the latest `main` SHA with real test execution.

## Phase 2 continuation — missing-preferences regression coverage added (2026-10-21)

- Added a mocked Playwright regression in `tests/e2e/smoke.spec.ts` that exercises a prepared student's Account Settings when the `student_preferences` GET returns PostgREST's no-row response, then attempts to save daily study time through the existing preferences upsert path.
- All Supabase API traffic in this test is intercepted; it does not access production rows or credentials.
- Source and test writes were accepted by GitHub. The test has NOT been executed, and its behavior is not yet verified by Playwright. Typecheck/build/E2E remain unverified while runner-backed Actions execution is unavailable.
- Next action: run the targeted test and the full typecheck/build/E2E suite in a local checkout or when Actions runner capacity is restored; fix any real failures before closing Phase 2.

## Phase 2 continuation — admin authorization error sanitization (2026-10-21)

- Hardened `src/components/AdminFoundationGate.tsx`: failed admin authorization/RPC checks now show `Unable to verify administrator access. Please try again.` instead of leaking raw auth/database exception messages.
- Added a mocked Playwright regression to `tests/e2e/smoke.spec.ts` for an `is_admin` RPC error containing synthetic internal details; the UI must not expose those details.
- Commits: source `19f79805873f9e35218534a729bb536ceae08647`; regression `2e5947e85690c603cf9a0fc3024cd226f265480d`.
- Verification boundary: GitHub writes/read-back only. No typecheck/build/Playwright run is claimed because runner capacity is exhausted per user report and there is no local checkout in this session. No production data/schema change or deployment.
- Phase 2 remains open. The frontend's honest unavailable states do not constitute operational payment, notification delivery, referral qualification, grounded AI, or audio capabilities; these require verified backend/provider contracts.
- Next action: run `npm run typecheck`, `npm run build`, and `npm run e2e` on current `main` when a local checkout or Actions capacity is available, fix actual failures, then complete and reconcile the remaining Phase 2 acceptance matrix.


## Phase 2 continuation — live catalogue state reconciled (2026-10-21)

- Read-only inspection confirmed current GitHub `main` HEAD at start of this investigation: `709c1b6fde957f631c9ca8420c2ece7727ecdda5`. No application source or production data was changed in this investigation.
- Supabase connector access is working for project `nova-ace-jamb` (`uokiqlgmzprqfbzmedaz`). This corrects older checkpoint notes that described the database as inaccessible; those notes reflect a prior failed access attempt and should not be treated as current status.
- Live read-only SQL counts: `ace.institutions` = 791; `ace.programs` = 0; `ace.program_utme_rules` = 0; `ace.subjects` = 25; `ace.topics` = 0; `ace.questions` = 0; `ace.exam_seasons` = 2; `ace.catalog_sources` = 13; `ace.catalog_import_batches` = 5; `ace.catalog_import_rows` = 793.
- Import-batch status query: institution batches include 3 published batches totaling 791 rows, 1 rejected batch totaling 791 rows, and 1 staged batch with 1 row. Therefore, the 791-institution catalogue is already published; do not ask the user to re-upload the workbook without new evidence.
- The verified next catalogue gap is institution → programme → UTME-rule ingestion: live `ace.programs` and `ace.program_utme_rules` are both empty. The existing `ibass-catalog-stage` function is ACTIVE version 4 and `catalog-import` is ACTIVE version 7 with `verify_jwt=true`. Repository and deployed function implementations must be compared before any deployment; do not blindly redeploy repository copies.
- The admin UI already exposes IBASS staging for 1–25 institutions and a selected exam season. Executing it requires a real authenticated administrator session; no session token was available to this investigation. No import was started and no production rows were modified.
- User instruction: defer the full typecheck/build/Playwright/deployed acceptance suite until the end of Phase 2. This investigation used read-only database queries only; no tests were run.
- Phase 2 is still OPEN. Backend-dependent notification delivery/scheduling, payments, referral qualification/rewards, grounded AI retrieval, audio delivery, and PWA/browser acceptance are not proven complete by their status UI.
- Exact next action: continue implementation without re-uploading the institution workbook; reconcile the deployed IBASS/catalog-import contracts and use the authenticated admin staging flow to ingest official programme and UTME-rule data, preserving unresolved/alternative subject requirements. Record batch IDs/statuses and verify only through read-only counts. Perform the agreed full test matrix at the end.


## Frontend Phase 2 continuation — design-system hardening (2026-10-21)

- User explicitly authorized proceeding to finish Frontend Phase 2. Scope remains the existing ACE JAMB application on `main`; do not reopen the settled 791-institution/catalogue decision or trigger unnecessary Actions runs while included minutes are exhausted.
- Inspected current `src/main.tsx`, `src/index.css`, `StudentFoundationGate.tsx`, `StudentOnboarding.tsx`, `StudentDashboard.tsx`, `StudentStudyWorkspace.tsx`, `ProtectedCBT.tsx`, `StudentAccountSettings.tsx`, `StudentNotifications.tsx`, `CommunityChannelWelcome.tsx`, and `AdminOperationsOverview.tsx` through GitHub read access.
- Implemented a focused frontend foundation improvement in `src/index.css`: consolidated duplicated field/card/gradient rules; introduced ACE design tokens for the dark surface, purple, gold, borders and muted text; added visible keyboard focus, reduced-motion support, 44px minimum field target height, disabled-button state, selection styling, and mobile-aware orb sizing/pointer behavior. Existing component class names are retained.
- Commit: `6959ea4e055ece0cb7b768704556a399307a5bf4` (`style: consolidate mobile-first ACE design tokens and accessibility`). This is a source-level improvement only; it does not close Phase 2.
- Verification status: GitHub accepted the source update. No local checkout is available in this session; typecheck, production build, browser rendering and Playwright have NOT been run. Do not describe these checks as passed.
- Existing observed concerns remain: student dashboard content depends on active/rights-approved syllabus records; payment/referral/AI/audio/notification delivery and PWA behavior need actual backend contracts and end-to-end evidence, not merely status UI. Current source needs a complete component-by-component audit before any final acceptance claim.
- Exact next action: continue inspecting and implementing the remaining frontend acceptance gaps in the current app architecture, make the smallest safe source changes, and only then run the agreed typecheck/build/full Playwright suite when local execution or Actions capacity is available. Keep Phase 2 OPEN until the current source SHA is verified and every acceptance gate is implemented or explicitly documented as blocked/out of scope.


## Phase 2 frontend audit continuation (2026-10-21, follow-up)

- Continued the source audit across existing Playwright smoke coverage, student auth, onboarding, dashboard, study workspaces, study plan, learning-support status, and account flows. Existing E2E suite already covers auth/recovery, mobile entry, onboarding, dashboard retry, CBT persistence/empty bank, syllabus rights states, workspace navigation, account settings, support availability, payment/referral honest states, notifications, study-plan recovery, PWA shell, and admin authorization/readiness.
- Found a stale statement in `src/components/StudentStudyWorkspace.tsx` practice empty-state UI that claimed the last database audit found no active questions. This could become inaccurate as content changes. Replaced it with a current-safe explanation that question availability is checked when a session starts and ACE must not invent questions or fake attempts.
- Commit: `5db968b85207444f83415ac53e7db825e2a3d1c8`. No database, secrets, or deployment changed.
- Verification: GitHub accepted the source update; E2E specs were inspected read-only. No typecheck/build/Playwright run has occurred because this session has no local checkout and GitHub Actions minutes are exhausted. The change is not considered runtime-tested.
- Phase 2 remains OPEN. Main unresolved acceptance item is executable verification of the complete current source (typecheck, build, desktop/mobile Playwright). The workspace intentionally presents honest empty states where question/rights-cleared content or backend services are not available; do not manufacture official JAMB content to make screens look populated.
- Exact next action: continue targeted review for stale claims and broken navigation in current student/admin frontend, then run the existing E2E suite and build/typecheck in a local execution environment when available. Close Phase 2 only against observed results.


## Final Phase 2 frontend review — 2026-10-21

- User requested one final frontend review before closing Phase 2. Re-inspected current `main` source for routing, navigation, mobile semantics, current empty states, existing Playwright coverage, and verification workflow.
- Confirmed the dashboard and study workspace both use the `ace-workspace-navigate` event; dashboard also synchronizes workspace state from URL on `popstate`. Existing Playwright smoke tests cover mobile student entry, persisted dashboard/CBT navigation, workspace navigation and honest empty states. This is source inspection only, not execution evidence.
- Confirmed both files referenced by the current verification workflow now exist: `supabase/functions/ibass-catalog-stage/index.ts` and `supabase/functions/catalog-import/index.ts`. Earlier notes describing the first file as missing are stale and should not be treated as current state.
- Latest workflow run inspected: run `39648461718`, commit `0b7e0bf6e35da56b70bd20862f4da1260252efc1`; both jobs ended in failure without step summaries. Attempt to retrieve job logs returned a 404 BlobNotFound response, so the exact cause cannot be established from logs. User's billing screenshot shows 2,000/2,000 included Actions minutes used; avoid triggering additional Actions runs before reset.
- No additional source change was justified by this read-only review. Do not invent defects or expand scope. Existing code continues to honestly disclose unavailable question-bank, rights-reviewed content, AI tutor/audio delivery, payment/referral fulfillment and push notification capabilities rather than pretending backend services are complete.
- Phase 2 status: implementation review is substantially complete, but formal closure remains blocked by required verification evidence: `npm run typecheck`, `npm run build`, and Playwright E2E desktop/mobile. None was executed in this session; no local checkout/runtime is available. GitHub source/document reads and prior accepted commits do not substitute for those checks.
- Exact next action: when local execution or Actions capacity is available, run `npm install`, `npm run typecheck`, `npm run build`, and `npm run e2e`; fix any reproducible failures, then record outputs and close Phase 2 only if the checks pass or any explicitly approved exceptions are documented. Do not revisit the settled catalogue/institution decision.


## Phase 3 readiness audit — 2026-10-22

- **Repository state verified:** `main` HEAD is `78af176d91d596e260d995c2ef53a6ae0a4080c7` (`docs: checkpoint phase two closure verification blocker`). No application source files, database rows, migrations, or deployments were changed during this audit.
- **Scope guard:** The user confirmed the current task is to keep Phase 2 frontend scope limited to final verification/closeout and explicitly said not to switch to catalogue work. This audit did not start catalogue implementation.
- **Roadmap reconciliation needed:** The canonical master handoff does not define a formal milestone named “Phase 3 — Student Foundation.” It contains the broader product implementation sequence, while the frontend completion batch tracks whole-product frontend work. Do not present the “Phase 3” label or a new roadmap as canonical without reconciling the current milestone plan.
- **Student foundation source inspected:** `src/lib/authService.ts`, `src/lib/studentService.ts`, `src/components/StudentFoundationGate.tsx`, `src/components/StudentOnboarding.tsx`, `src/components/StudentDashboard.tsx`, and `src/components/StudentStudyWorkspace.tsx` exist. The gate includes admin/editor routing, auth-state refresh sequencing, profile/preferences/subject checks, recovery handling, and community-gate state. Onboarding saves through `save_student_preparation_foundation` and requires English plus three distinct additional subjects. This is source inspection, not live end-to-end verification.
- **Live Supabase read-only evidence** (project `nova-ace-jamb`, ref `uokiqlgmzprqfbzmedaz`): profiles 4; student_preferences 4; student_subjects 8; subjects 25; exam_seasons 2; syllabus_versions 50; topics 0; subtopics 0; questions 0; attempts 0. These counts are point-in-time and can change.
- **RLS evidence:** `profiles` SELECT/UPDATE policies are scoped to `auth.uid()`; `student_preferences` and `student_subjects` ALL policies are scoped to the authenticated owner in both USING and WITH CHECK; `roles` has a self-select policy. Function signatures for `save_student_preparation_foundation`, `is_admin`, `is_admin_or_editor`, and `set_student_subjects` were read. Function bodies/grants were not audited in this pass.
- **Phase 2 closeout remains separate:** `npm run typecheck`, `npm run build`, `npm run e2e`, and deployed-flow checks remain pending on current HEAD as recorded by the Phase 2 closure checkpoint. No tests were run in this audit.
- **Next action:** Keep Phase 2 verification deferred as already agreed; reconcile the exact Phase 3 scope against the current owner-approved milestone plan before making implementation changes. Do not infer that the student foundation is the formal Phase 3 or start unrelated catalogue work.

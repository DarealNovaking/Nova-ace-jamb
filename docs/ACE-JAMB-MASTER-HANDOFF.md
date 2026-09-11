# ÑØVÃ ACE JAMB — MASTER HANDOFF

> **Purpose:** Canonical project-context handoff for continuing ÑØVÃ ACE JAMB in another ChatGPT account or development environment.
>
> **Critical separation rule:** ACE JAMB is a separate product from **Ñøvã CBT MAX** and **DROP**. Do not merge their roadmaps, databases, pricing, branding, or architecture.

---

## 1. Project identity

- **Product:** ÑØVÃ ACE JAMB
- **Parent brand:** ÑØVÃ Academic Resource Series
- **Founder styling:** Ñøvã Kïñg
- **Tagline:** Students Resources Made Easy
- **Audience:** JAMB candidates broadly; not FUTA-only
- **Brand feel:** premium, futuristic, youthful, Nigerian-student-focused, practical
- **Visual direction:** progressive 3D/futuristic UI where useful; 3D must never be required for core functionality or performance
- **Primary palette:** Royal Purple / Metallic Gold / White / Black
- **Primary constraint:** mobile-first, low-bandwidth, low-end-Android friendly

---

## 2. Product vision

ACE JAMB is intended to be a serious JAMB preparation platform combining:

1. JAMB syllabus structure
2. Structured past questions
3. Learning Mode
4. Practice Mode
5. CBT simulation
6. Quick Revision
7. Flashcards
8. Audio learning
9. Performance/mastery analytics
10. Grounded AI tutoring
11. Textbook/reference knowledge
12. Internet-source retrieval
13. Seasonal paid access
14. Qualified referrals
15. WhatsApp/community integration
16. Notifications/admin operations
17. Security, anti-abuse, observability and graceful degradation

The product should feel like a polished education platform rather than a generic AI wrapper.

---

## 3. Access and monetization

### ACE Pass

- Target price: **₦899**
- Model: one-time seasonal access for the active JAMB season
- The pass should expire after the relevant season while the user's account/history can remain
- Payment entitlement must be verified server-side
- Payment provider is **not finally locked** in this handoff

### Referral access

- Alternative access route: **5 qualified referrals**
- A referral should count only when the referred student completes the defined qualification event(s), such as registration plus meaningful website usage
- A share/click alone must not count
- Prevent self-referral, duplicate-account farming and obvious abuse
- Qualification rules should be configurable rather than permanently hard-coded

### Free tier

The free tier should remain genuinely useful and should naturally encourage upgrading. Advanced personalization, deeper analytics and/or some AI/revision capabilities may be restricted to paid access after final product decisions.

---

## 4. Core learning experiences

### Learning Mode

- Teach syllabus-aligned concepts
- Break explanations into useful steps
- Link learning content to relevant past questions
- Support formulas, diagrams, tables and rich media
- Use grounded AI assistance where appropriate

### Practice Mode

- Subject/topic-based practice
- Question and option order randomized on every new attempt/session
- Explanations after answers or according to the chosen mode
- Progress and mastery tracking

### CBT Mode

- JAMB-like timed experience
- Reliable start/submit flow
- Review/navigation controls
- Randomized question and option order
- Persistent attempt state
- Resume support where appropriate
- Correct scoring even after presentation randomization

### Past Questions

Past questions are a core workload, not an optional add-on. They should integrate into Learning, Practice and CBT.

### Quick Revision

Fast topic-focused revision using concise content, question cards and/or flashcards.

### Flashcards

Flashcards are a mandatory roadmap feature. They should support syllabus/topic mapping and progress tracking.

### Audio learning

Audio learning is a mandatory roadmap feature. Playback must be bandwidth-conscious and fail gracefully when media cannot load.

---

## 5. Question-system requirements — NON-NEGOTIABLE

The content model must support rich questions from Day 1 rather than retrofitting media later.

Questions/options/explanations/learning content may contain:

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

### Canonical-data rule

The stored canonical question and answer mapping must never be mutated merely because the UI randomizes presentation.

Every question needs a stable identity. Presentation order is separate from canonical content.

---

## 6. Randomization rules

Every new attempt/session must be capable of randomizing:

- Question order
- Option order

This applies across:

- Practice
- CBT
- Past Questions
- Learning/Answer modes where multiple questions are presented
- Quick Revision question cards
- AI-generated practice

When a session must be resumed, preserve enough state/seed/mapping information to reproduce the same presentation safely without corrupting the canonical answer key.

---

## 7. AI Tutor / knowledge architecture

ACE's AI must be **grounded/RAG-based**, not an unrestricted chatbot.

### Intended knowledge sources

1. JAMB syllabus
2. Approved/authorized textbook and reference material
3. Platform-authored educational content
4. Structured past-question knowledge
5. Carefully sourced Internet content

### Requirements

- Retrieve relevant evidence before answering where appropriate
- Preserve source/provenance metadata
- Prefer grounded answers over unsupported generation
- Clearly acknowledge uncertainty when evidence is insufficient
- Internet sources should retain source URL and relevant retrieval metadata
- AI provider/model should sit behind an adapter so it can be replaced later

---

## 8. Textbooks and copyright

Do **not** build ACE as a wholesale mirror of copyrighted textbooks.

The knowledge system must be rights-aware:

- Use material the project has permission/right to use
- Use legally permissible excerpts or derived knowledge where appropriate
- Store provenance and rights/licensing metadata
- Index knowledge for retrieval instead of exposing entire copyrighted books as a free mirror
- Provide admin review/takedown controls
- Distinguish platform-authored explanations from source-derived content

---

## 9. Intended architecture

### Current intended production direction

- **GitHub:** source of truth and version control
- **Cloudflare Pages:** frontend hosting/CDN
- **Supabase:** core backend/data platform
  - PostgreSQL
  - Authentication
  - Storage
  - Row Level Security
  - Edge Functions
  - Realtime where justified

### Architecture rule

UI code must not be tightly coupled to a single infrastructure provider. Database, authentication, storage, payments, AI and notifications should sit behind service boundaries/adapters where practical.

This makes it possible to replace providers later without rebuilding ACE.

### Important correction

Do not automatically use Cloudflare D1/Workers as ACE JAMB's primary database. Earlier Cloudflare backend discussion belonged to another context. The current ACE JAMB backend direction is **Supabase**.

---

## 10. Dedicated Supabase environment

- **Organization:** The ace team
- **Plan:** Free
- **Planned project:** NOVA ACE JAMB
- **Planned region:** eu-west-1
- **Creation cost previously checked:** $0/month

The project must remain separate from unrelated Supabase projects such as DROP, nova-anonymous-session and Ñøvã pre CBT.

### Status at handoff

Project creation was **not safely confirmed** at the point this handoff was prepared. Do not claim the project exists until the Supabase dashboard/API confirms it.

### Next Supabase action

1. Confirm the organization is **The ace team**
2. Create **NOVA ACE JAMB** in **eu-west-1**
3. Verify that the project becomes healthy/ready
4. Only then proceed with the pre-build requirements audit and schema work
5. Do not blindly create the entire production schema before requirements are locked

---

## 11. Database principles

- PostgreSQL as the core relational database
- Use migrations/version control for schema changes
- RLS for protected user-facing data
- Never expose service-role secrets to the browser
- Use environment variables/secrets management
- Separate canonical content from presentation/session state
- Separate user progress from public content
- Add indexes based on actual query patterns
- Keep provenance/audit metadata for editable content
- Review security/performance advisories after major schema changes

### Likely data domains

These are planning domains, **not yet a final schema**:

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
- CBT exams/attempts
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

Do not create all of these blindly. Finalize the schema after the requirements/asset audit.

---

## 12. Authentication

Supabase Auth is the current preferred foundation unless a later requirement justifies another provider.

Requirements:

- Minimize onboarding data
- Do not collect unnecessary sensitive information
- Separate authentication/security data from public profile data
- Persistent sessions appropriate for a PWA
- Account recovery
- Abuse controls
- Proper authorization/RLS

---

## 13. Admin / content operations

ACE needs an admin/content-management layer capable of:

- Subjects
- Syllabus topics
- Question banks
- Question creation/editing/review/publish/unpublish
- Multimedia
- Source/provenance/rights metadata
- Explanations
- Flashcards
- Audio resources
- Announcements
- Notifications
- Reports
- Copyright/takedown requests
- Payment/referral monitoring
- User/account moderation
- Audit trail

Use least-privilege admin roles where practical. Content editors should not automatically need full system-admin privileges.

---

## 14. WhatsApp/community integration

Community/channel integration is part of the roadmap.

However, do not assume that a client-side button saying "I joined" is secure verification.

The exact verification mechanism remains **UNDECIDED** and must be designed against the actual capabilities of the chosen WhatsApp integration. If true membership verification is not technically available, use an honest alternative rather than fake verification.

---

## 15. Payments

The payment flow must handle:

- Server-side verification
- Provider reference storage
- Duplicate callbacks
- Webhook replay/idempotency
- Failed payments
- Successful payment without client confirmation
- Refund handling
- Entitlement activation/expiry

Never trust a browser-only success state as proof of payment.

---

## 16. Security / anti-abuse

Required principles:

- RLS on protected data
- Least-privilege admin access
- Server-side payment verification
- Rate limiting where appropriate
- Referral abuse prevention
- Upload validation
- Media size/type limits
- Protection of privileged AI/admin endpoints
- Do not trust client-submitted scores or entitlement state
- Avoid unnecessary sensitive-data collection
- Log important security/business events without excessive personal data
- Graceful degradation when external services fail

---

## 17. Performance and browser-aware design

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

---

## 18. Observability

Monitor important flows such as:

- Authentication
- Question loading
- CBT start
- CBT submit
- Scoring
- Payment verification
- Referral qualification
- AI requests
- Critical errors

Keep operational telemetry separate from student-facing analytics. Avoid unnecessary sensitive data.

---

## 19. QA / hardening requirements

Every major feature must be tested beyond a single successful desktop run.

Test:

- Real Android devices
- Slow networks
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
- Performance under low-end conditions

Run security/performance checks after significant database changes.

---

## 20. Existing GitHub baseline

The repository is:

**`DarealNovaking/Nova-ace-jamb`**

The repository's existing README describes an earlier prototype baseline including an AppDeploy prototype, authentication/profile foundation, subjects/topics/questions CMS, and a next phase around persistent CBT attempts, answers, scores and progress.

For the new production direction, the architecture decisions in this handoff take precedence where they explicitly supersede prototype infrastructure assumptions. The prototype should be treated as existing work/context, not as permission to discard useful work unnecessarily.

---

## 21. Current project status

| Area | Status |
|---|---|
| Product concept | Strongly defined |
| ACE vs CBT MAX separation | Confirmed |
| ACE vs DROP separation | Confirmed |
| Brand direction | Defined |
| ₦899 seasonal ACE Pass | Direction confirmed |
| 5-qualified-referral route | Direction confirmed |
| Supabase organization | The ace team |
| Supabase project | Planned; creation not yet safely confirmed |
| Supabase region | eu-west-1 planned |
| GitHub repo | Exists: `DarealNovaking/Nova-ace-jamb` |
| Cloudflare Pages | Intended frontend hosting/CDN |
| Database schema | Not final; audit first |
| Payment provider | UNDECIDED |
| WhatsApp verification mechanism | UNDECIDED |
| Exact AI provider/model | UNDECIDED |
| Final content/licensing inventory | UNDECIDED |

---

## 22. Pre-build gap audit — MUST happen before schema implementation

The new ChatGPT/developer should ask for everything genuinely missing before implementation.

### Product decisions

- Launch subjects
- Launch scope vs post-launch scope
- Free-tier limits
- Paid-tier limits
- Exact ACE Pass expiry behavior
- Exact referral qualification event
- Student-facing analytics
- Admin-facing analytics

### Content

- Which years of past questions are available?
- Which past questions are legally usable?
- Where does the first question bank come from?
- What syllabus/reference files are available?
- What explanations already exist?
- What flashcard content exists?
- What audio content exists?

### AI

- First AI provider/model
- AI budget/free-tier strategy
- Retrieval/search provider
- Embedding strategy
- Knowledge refresh strategy
- Citation/source display behavior
- Fallback behavior when AI/search is unavailable

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

---

## 23. Asset/media checklist

Ask the project owner to provide any existing assets that are actually available:

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

## 24. Recommended implementation sequence

1. Complete the requirements + asset + rights audit.
2. Create/verify the dedicated Supabase project.
3. Confirm GitHub repository/branch strategy.
4. Lock architecture and service boundaries.
5. Design the final data model.
6. Set up migrations, RLS and environments.
7. Build authentication/profile foundation.
8. Build subjects/syllabus/topics.
9. Build canonical rich question/content model.
10. Import and validate the first legal question dataset.
11. Build Learning + Practice foundations.
12. Build CBT engine and robust attempt state.
13. Build scoring, explanations and mastery analytics.
14. Build Flashcards + Quick Revision.
15. Build Audio learning.
16. Build grounded AI/RAG.
17. Build admin/content management.
18. Build referrals + ACE Pass/payment entitlement.
19. Build notifications/community integration.
20. Harden security, anti-abuse, performance and observability.
21. Run real-device/low-bandwidth QA.
22. Launch a controlled beta.

---

## 25. First useful milestone

Do not attempt to build the entire platform at once.

The first meaningful milestone should prove the core learning loop:

1. Student signs in.
2. Student chooses a subject/topic.
3. Student sees syllabus-aligned content/questions.
4. Question and option randomization works correctly.
5. Student answers and receives a reliable explanation.
6. Progress is saved.
7. Basic performance is reported.
8. The architecture remains ready for CBT, AI, flashcards, audio and monetization.

---

## 26. Rules for future development

- **Do not confuse ACE JAMB with Ñøvã CBT MAX.**
- **Do not confuse ACE JAMB with DROP.**
- Do not silently change the ₦899 seasonal model.
- Do not silently replace Supabase with D1.
- Do not build a giant schema before the requirements audit.
- Do not assume supplied content is copyright-free.
- Do not fake WhatsApp membership verification.
- Do not expose secrets in code or chat.
- Do not optimize desktop-first.
- Do not let 3D effects damage performance.
- Do not claim an external resource was created unless it has actually been verified.
- When something is unresolved, label it **UNDECIDED** and ask the owner.
- Prefer incremental changes over unnecessary architecture rewrites.

---

## 27. Startup prompt for a new ChatGPT account

Paste this after providing this document:

> I am continuing my project **ÑØVÃ ACE JAMB**. This document is the master handoff from my previous ChatGPT account. Treat it as the current project context.
>
> **ACE JAMB is separate from Ñøvã CBT MAX and DROP.** Do not merge them.
>
> Before writing code or creating database tables, perform a complete **PRE-BUILD GAP AUDIT**. Identify what is already decided, what is unresolved, and what assets/media/content/rights/integration information is genuinely required from me. Do not guess unresolved decisions.
>
> The intended architecture is GitHub + Cloudflare Pages + Supabase, with provider adapters so infrastructure can change later. Do not substitute Cloudflare D1 as the ACE database unless I explicitly change the decision.
>
> After the audit, produce the final locked architecture and implementation sequence. Only then begin implementation.

---

## 28. Compact project identity

```text
NAME: ÑØVÃ ACE JAMB
TARGET: JAMB students broadly
PARENT BRAND: ÑØVÃ Academic Resource Series
FOUNDER STYLE: Ñøvã Kïñg
TAGLINE: Students Resources Made Easy
PRICE DIRECTION: ₦899 seasonal ACE Pass
ALTERNATIVE ACCESS: 5 qualified referrals
BACKEND: Supabase
FRONTEND HOSTING/CDN: Cloudflare Pages
SOURCE CONTROL: GitHub
STYLE: premium futuristic / progressive 3D
COLORS: Royal Purple / Metallic Gold / White / Black
CORE: Syllabus + Past Questions + Learning + Practice + CBT + Quick Revision + Flashcards + Audio + AI Tutor + Analytics
NON-NEGOTIABLE: rich multimedia questions + question/option randomization + copyright-conscious knowledge system + low-bandwidth/mobile performance
SEPARATE FROM: Ñøvã CBT MAX and DROP
```

---

**End of ACE JAMB Master Handoff.**

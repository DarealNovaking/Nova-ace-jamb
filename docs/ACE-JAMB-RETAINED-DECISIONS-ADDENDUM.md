# ÑØVÃ ACE JAMB — RETAINED DECISIONS ADDENDUM

> This document supplements `docs/ACE-JAMB-MASTER-HANDOFF.md`.
>
> Purpose: preserve retained ACE JAMB decisions from earlier planning that were not fully represented in the first handoff. Only decisions/features that remain part of ACE JAMB are listed here. Explicitly dropped infrastructure choices are documented as dropped so they are not accidentally revived.

## 1. Important project boundary

ACE JAMB is its own product.

It must NOT inherit unrelated implementation details, pricing, databases, branding or roadmaps from:

- Ñøvã CBT MAX
- DROP / `nova-anonymous-session`

Those projects remain separate.

---

## 2. Retained personalization/onboarding system

ACE JAMB should not behave like a generic question-bank website. The retained product direction includes a personalized student profile and learning context.

The onboarding/profile model should be capable of capturing, where useful and with minimal friction:

- Target JAMB score
- Intended institution
- Intended course
- Selected JAMB subjects
- Relevant learning preferences/progress

These values should feed recommendations and the student's preparation strategy rather than exist as decorative profile fields.

---

## 3. Retained syllabus/question intelligence

The question system should understand the hierarchy:

**Subject → Topic → Subtopic → Question**

Questions should have structured metadata and verified/quality-controlled content rather than being stored as an unstructured list.

The platform should be able to use this structure for:

- Learning recommendations
- Practice selection
- Weakness detection
- Revision
- CBT composition
- Analytics
- AI retrieval
- Readiness calculations

---

## 4. Retained verified past-question quality pipeline

Past questions are a major product asset.

The platform should have a content-quality process covering, as applicable:

- Source/provenance
- Year/exam metadata
- Subject/topic/subtopic mapping
- Correct answer verification
- Explanation quality
- Duplicate detection
- Formatting/media validation
- Rights/licensing status
- Publication/review status

Do not treat imported raw questions as automatically trustworthy.

---

## 5. Retained advanced practice modes

Beyond basic Practice Mode, the earlier ACE roadmap retained specialized practice experiences built from student performance data.

These include:

- Weakness-focused practice
- Speed-focused practice
- Mistake/repeated-mistake practice
- Adaptive recommendations
- Target/readiness-oriented practice
- Final-stretch preparation mode

These should ultimately be driven by the student's actual performance rather than arbitrary random question selection.

---

## 6. Retained mistake bank

ACE should be able to build a student's personal mistake/review bank from questions they repeatedly get wrong or struggle with.

The system should support useful distinctions such as:

- Incorrect answer
- Repeated incorrect answer
- Slow answer
- Weak topic/subtopic
- Recently improved
- Needs revision

The exact scoring thresholds should be configurable rather than hard-coded prematurely.

---

## 7. Retained performance and readiness engine

The performance system is broader than a simple percentage score.

The retained direction includes:

- Overall performance
- Subject performance
- Topic/subtopic weakness
- Accuracy
- Speed
- Repeated mistakes
- Progress over time
- Practice history
- CBT/mock performance
- Readiness estimation
- Adaptive recommendations
- Final-stretch preparation

The goal is to answer questions such as:

- What should this student study next?
- What are their weakest areas?
- What mistakes keep repeating?
- Are they improving?
- Are they ready for the exam?
- What should they revise before JAMB?

Do not claim a prediction is scientifically precise; present readiness as an internal preparation metric, not a guaranteed JAMB score.

---

## 8. Retained realistic CBT/full-mock direction

CBT should eventually support realistic full JAMB-style mock experiences, not only small practice quizzes.

Retained requirements include:

- Timed exams
- Exam navigation/review
- Question/option randomization
- Reliable answer persistence
- Resume/recovery where appropriate
- Accurate scoring
- Subject/question composition appropriate to the configured exam
- Post-exam analysis
- Historical comparison against the student's own performance

The exact official JAMB composition/rules must be verified against current official information before launch and should be configuration-driven rather than permanently hard-coded.

---

## 9. Retained AI capabilities beyond basic tutoring

The AI roadmap includes more than a chat box.

Retained capabilities include:

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

All generated questions/content still need validation and should not automatically be treated as authoritative JAMB material.

---

## 10. Retained study-plan/personalization direction

The platform should eventually be able to use a student's:

- Target score
- Available preparation time
- Exam season/deadline
- Subject performance
- Weak topics
- Mistake history
- Practice/CBT history

to recommend what to study or practise next.

The final-stretch mode should become more focused as the exam approaches, while respecting the student's actual weak areas.

---

## 11. Retained gamification

Gamification was part of the retained ACE JAMB roadmap.

It should encourage useful study behavior rather than become meaningless decoration.

Potential product mechanisms already retained in the roadmap include progress/streak-style motivation and achievement-oriented feedback, but exact mechanics should be finalized during UX design.

Do not allow gamification to interfere with CBT accuracy, accessibility or performance.

---

## 12. Retained account/cloud continuity

The product requirement is that student progress should persist across sessions/devices where the account is used.

This includes, where applicable:

- Profile
- Learning progress
- Practice history
- Mistake bank
- Flashcards/progress
- CBT attempts
- Performance analytics
- Entitlements
- Referral progress
- Study recommendations

The implementation has since moved toward **Supabase** as the backend, so the earlier Firebase implementation is NOT to be revived merely because the original roadmap called for cloud sync.

The requirement is retained; the provider decision changed.

---

## 13. Retained payment/entitlement architecture

Earlier planning explicitly included payment verification, premium entitlement states, payment history and admin controls.

These remain required.

The current price direction is **₦899**, which supersedes the earlier exploratory ₦800 figure.

Payment design should support:

- Transaction verification
- Entitlement activation
- Entitlement expiry
- Payment history
- Failed/duplicate transaction handling
- Admin visibility
- Refund/reversal handling
- Server-side verification

### Provider note

Earlier planning discussed **Paystack and Flutterwave** for transaction verification. No final provider has been locked in this handoff. Do not silently assume one until the provider is selected.

---

## 14. Retained notification system

Notifications are broader than a single announcement banner.

The retained roadmap includes:

- In-app notifications
- Admin announcements
- Targeted notifications
- Scheduled notifications
- User notification preferences
- Important system/product notifications

Earlier planning also included **FCM push notifications** as the push-notification direction.

The exact push implementation should be finalized during the integration audit, but the product requirement for push-capable notifications remains.

---

## 15. Retained Ñøvã community/channel CTA

Earlier planning included Ñøvã community/channel linking and CTA behavior.

The retained requirement is a community/channel connection point, not an assumption that ACE JAMB should automatically post messages to WhatsApp.

Do not revive an assumption of automated WhatsApp posting unless it is separately decided and technically justified.

The actual WhatsApp membership-verification mechanism remains undecided and must be based on real integration capabilities.

---

## 16. Retained admin command center direction

The admin side is intended to become a command center, not just a question uploader.

It should eventually provide visibility/control over:

- Students/accounts
- Content/questions
- Syllabus mappings
- Question quality/review
- Payments/entitlements
- Referral activity
- Notifications/announcements
- AI/content sources
- Reports/moderation
- Copyright/takedown workflow
- Product/usage analytics
- Security/abuse events

Admin actions should be permissioned and auditable.

---

## 17. Retained free-first economics

The original strategic principle remains:

**Start at ₦0 infrastructure cost where practical, use free tiers aggressively without underbuilding the architecture, then use revenue to fund better infrastructure/features.**

However, the product must be architected so that paid providers can be introduced later without a rewrite.

Known examples of future cost areas include:

- AI usage
- Search/retrieval
- Payment transaction fees
- Higher infrastructure usage
- Custom domain/other paid services
- Large-scale media/storage/bandwidth
- App-store distribution if a native wrapper is later pursued

Do not design the production architecture around the assumption that every service will remain free forever.

---

## 18. Retained scalable provider-adapter principle

The application should isolate infrastructure-specific services behind clean interfaces/adapters where practical.

This applies especially to:

- Database/data access
- Authentication
- Storage
- Payments
- AI
- Search/retrieval
- Notifications/push
- Analytics/observability

The objective is to start cheaply while retaining a migration path as ACE grows.

---

## 19. Retained sequential build/testing philosophy

The project should be built in phases and tested continuously.

Do not attempt to build all 50+ planned capabilities at once.

Each major phase should:

1. Build a coherent feature group.
2. Test it.
3. Test it on a real phone.
4. Test edge cases.
5. Harden it.
6. Only then move to the next dependent phase.

The system should remain usable throughout development.

---

## 20. Retained PWA direction

ACE JAMB is intended to be a **PWA/mobile-first web product**.

The experience should support installation and app-like usage without making native app-store distribution a Day-1 dependency.

A future Play Store/native-wrapper path may be considered after the web/PWA product is stable; it is not a prerequisite for the initial build.

---

## 21. Retained progressive 3D direction

The earlier product direction was not simply "make a 3D website."

The retained design principle is:

**Progressive 3D/futuristic visual depth without sacrificing usability or performance.**

Use depth, motion, layered surfaces and 3D elements where they strengthen the product identity. Core navigation, learning, CBT and accessibility must remain functional if heavy visual effects are disabled or unavailable.

---

## 22. Decisions that are explicitly NOT to be revived

These items appeared in earlier planning but were later superseded or belong to another project/context:

### Firebase as ACE's backend

**Dropped/superseded.**

Earlier roadmap planning used Firebase for auth/data/cloud sync. The current ACE backend decision is **Supabase**.

Do not create a new ACE Firebase backend unless the project owner explicitly reverses this decision.

### Netlify as ACE's intended production frontend

**Superseded for the current production direction.**

Current direction: **GitHub → Cloudflare Pages → Supabase**.

### Cloudflare D1 as ACE's primary database

**Not the current ACE decision.**

D1/Workers belonged to separate experimentation/context and must not replace Supabase for ACE unless explicitly reconsidered.

### AppDeploy as ACE's production foundation

The existing AppDeploy ACE prototype is retained as historical/prototype work and may contain useful functionality, but it is **not the production infrastructure decision**.

Do not treat the prototype's AppDeploy backend as the final ACE backend.

### Automatic WhatsApp posting

Not part of the retained community CTA requirement. Do not assume ACE should automatically post to WhatsApp.

### ₦800 price

Superseded by the later **₦899 seasonal ACE Pass** direction.

### Anything belonging specifically to Ñøvã CBT MAX or DROP

Do not import their product-specific implementation decisions into ACE JAMB.

---

## 23. Final retained ACE JAMB capability map

The complete retained capability set should now be understood as:

- PWA/mobile-first experience
- Premium futuristic/progressive-3D UI
- JAMB season engine
- JAMB syllabus engine
- Personalized onboarding/profile
- Target score/institution/course/subject context
- Subject → topic → subtopic question intelligence
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

This is the retained ACE JAMB direction after separating later architecture decisions from earlier exploratory infrastructure choices.

# ÑØVÃ ACE JAMB

Scalable, mobile-first JAMB preparation platform.

## Source of truth
GitHub is the canonical version-controlled source. The current AppDeploy application is the deployment/prototype environment, not the only copy of the project.

### Current baseline
- AppDeploy project: ÑØVÃ ACE JAMB Prototype
- App ID: `n-va-ace-jamb-prototype-y0u6ww`
- Captured baseline: Phase 2.1 authentication/profile foundation
- Authentication: Google, Apple and X via AppDeploy auth
- Backend: AppDeploy API/database routes
- Admin: subjects, topics and questions CMS

## Product pillars
- JAMB syllabus engine
- Learning Mode
- Past-question engine
- Practice and CBT
- Flashcards and audio learning
- Quick Revision
- Performance/mastery engine
- Grounded AI Tutor
- Textbook/reference knowledge system
- Internet-source retrieval
- Seasonal ACE Pass
- Referral path
- WhatsApp Channel integration
- Notifications and admin command center
- Security and anti-abuse
- Progressive 3D interface
- PWA and low-end-device performance

## Architecture rule
UI must not directly depend on a specific infrastructure provider. Database, auth, storage, payments, AI and notifications should sit behind service boundaries/adapters so hosting can be changed without rebuilding ACE.

## Question-system requirements
- Shuffle presentation without changing canonical question/answer data.
- Preserve enough session state to recover an active CBT.
- Support diagrams, images, tables, formulas and media metadata.
- Track source/rights metadata and accessibility information.

## Phase tracking
- Phase 0 — infrastructure proof: documented
- Phase 1 — content/database foundation: validated in prototype
- Phase 2.1 — student authentication/profile: deployed for testing
- Phase 2.2 — persistent CBT attempts, answers, scores and progress: next

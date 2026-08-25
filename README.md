# ÑØVÃ ACE JAMB

Scalable, mobile-first JAMB preparation platform.

## Project rule

**₦0-first, scalable architecture.** We use legitimate free infrastructure at launch, but we do not design disposable or crippled architecture. Providers are isolated so capacity and vendors can be upgraded later without rebuilding ACE.

## Phase 0 — Zero-Cost Proof

Before feature development, prove the core infrastructure path:

```text
Browser → ACE API → Database → Response
```

Required validation:

- GitHub repository and version control
- Cloudflare Pages deployment
- Cloudflare Worker API
- Cloudflare D1 database
- Cloudflare R2 storage path
- Cloudflare Turnstile anti-bot protection
- Authentication path with no mandatory paid SMS
- Payment-provider feasibility for ₦899 ACE Pass
- AI/free-tier strategy and usage controls
- WhatsApp Channel verification feasibility
- Content rights/source strategy for textbooks, past questions and web sources

## Product pillars

- JAMB syllabus engine
- Learning Mode
- Past-question engine
- Practice
- CBT
- Flashcards
- Audio learning
- Quick Revision
- Performance/mastery engine
- Grounded AI Tutor
- Textbook/reference knowledge system
- Internet-source retrieval
- ₦899 seasonal ACE Pass
- 5-qualified-referral path
- WhatsApp Channel integration
- Notifications and admin announcements
- Admin command center
- Security and anti-abuse
- Progressive 3D interface
- PWA and low-end-device performance

## Question-system requirements

- Questions and options can be shuffled on every new presentation.
- Shuffling must never alter canonical question/answer data.
- Active CBT sessions store enough state to recover the same presentation when required.
- Questions support diagrams, images, tables, formulas and media metadata.
- Media supports source/rights metadata and accessibility information.

## Architecture rule

UI must not directly depend on a specific infrastructure provider. Use service boundaries/adapters for database, auth, storage, payments, AI and notifications.

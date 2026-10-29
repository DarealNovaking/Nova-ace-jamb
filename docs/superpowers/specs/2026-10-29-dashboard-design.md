# Student and administrator dashboard redesign

Owner requested this before resuming FCB-03 and delegated routine design decisions. Preserve React19/Vite/Tailwind, purple/gold ACE branding, all services, authorization and existing capabilities. No dependency, SQL, content, role or real-session changes. Production release remains a separate specific approval.

## Direction
Use a restrained dark workspace: charcoal surfaces, lavender primary actions, readable muted text, consistent spacing/radii, compact desktop sidebar and touch-friendly horizontally scrolling navigation on mobile. Avoid invented performance charts, scores, streaks or readiness claims. Native controls and visible keyboard focus; no modal menu or focus trap.

Student: keep authenticated greeting and URL-backed study modes; one primary CBT action; an actionable learning link; actual subject/topic counts; four saved subjects; six-topic home preview linking to full searchable learning workspace. Account, notifications and learning support remain accessible below with stable sidebar anchors. Existing account/service safety states and all forms remain intact. Apply the same shell to all six study modes while preserving heading focus/back/URL behavior.

Administrator: same shell with clearly distinct Administration identity and overview/academic/question routes; remove obsolete Batch3 milestone; concise workspace shortcuts and publication guidance; group operational counts and retain honest unavailable/zero states. Keep the existing protected review queue and editorial tools. Authorized editors see academic/question links, no admin overview link. Guards remain outside shell; no protected requests before authorization.

## Alternatives considered
A cosmetic-only pass would leave duplicated navigation and unbounded topic lists. A new router/design library would expand risk and dependencies. Chosen implementation: shared presentational shell, existing route/event architecture, scoped dashboard styles, and focused markup improvements.

## Acceptance
Both desktop and mobile screenshots reviewed; no document overflow at320/393/1440 widths; nav targets >=44px; active destination announced; keyboard skips/focus and reduced-motion honored. Existing role denial, retry, form, study, CBT, review/import/history tests remain green. Test URL navigation/back and preview/full-topic access; do not expose private content. Both real profiles remain signed in. FCB03 stays in progress and resumes after this UI task.

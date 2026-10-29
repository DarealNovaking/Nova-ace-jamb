# Dashboard design implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Organize and polish student/admin dashboards and their navigation while preserving existing behavior.
**Architecture:** Shared presentational DashboardShell; existing gates/services remain authority. Scoped CSS and existing URL/event navigation.
**Tech Stack:** React19, TypeScript, Tailwind, lucide-react, existing Playwright.
**Spec:** docs/superpowers/specs/2026-10-29-dashboard-design.md

## Global Constraints
No new dependencies, SQL, real-profile signouts or role/content changes. Separate production release approval. Preserve branding and honest empty states.

## Review Focus
- Long names and320px widths must wrap without document overflow.
- Mobile navigation must expose all destinations and active state without a focus trap.
- Study navigation/back retains query parameters and heading focus.
- Editors must never see full-admin overview navigation; students must never request protected data.
- Existing account forms, pending mutations and source-review gates stay intact.

### Task1: Shared shell and role dashboards
**Files:** Create src/components/DashboardShell.tsx, tests/dashboard-shell-render.test.mjs; modify StudentDashboard.tsx, StudentStudyWorkspace.tsx, AdminFoundationGate.tsx, AcademicFoundationGate.tsx, AdminOperationsOverview.tsx, src/index.css.
**Interfaces:** DashboardShell consumes area, activeId, displayName?, onStudentNavigate?, children; renders navigation with existing URLs/events and no data requests.
- [x] Add shell render regressions for named navigation, active links, editor isolation and escaped long identity. Observe missing-navigation RED against inert shell.
- [x] Implement shell, dashboard structure and shared styling; preserve existing accessible action names/controls.
- [x] Run shell tests and all Node/typecheck/build checks.

### Task2: Browser verification and handoff
**Files:** tests/e2e/smoke.spec.ts; .github/workflows/verify.yml; both canonical handoffs and UI evidence.
**Interfaces:** Uses Task1 shell; existing synthetic auth/mockPreparedStudent fixture only.
- [x] Add student/admin navigation, mobile overflow, bounded home topic preview, keyboard/back, screenshots and editor isolation tests.
- [x] Run complete desktop/mobile Playwright in CI; diagnose/fix actual failures and inspect screenshots.
- [x] Independent whole-branch review, fix material findings, update handoff/checkpoint; open reviewable PR and request exact deployment approval only when ready.

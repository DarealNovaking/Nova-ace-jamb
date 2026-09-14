# Batch 2 — Browser Testing Infrastructure Addendum

## 2026-09-14

The ACE JAMB repository now has a first-class Playwright browser-testing layer so future implementation work can be verified through an actual Chromium browser instead of relying only on source inspection or manual phone testing.

### Added

- `playwright.config.ts`
  - Chromium desktop project
  - Pixel 5 mobile project
  - Vite preview web server integration
  - screenshots and traces retained on failure
  - CI-aware retries/workers
- `tests/e2e/smoke.spec.ts`
  - student entry-surface smoke test
  - mobile browser smoke test
- `package.json` scripts:
  - `npm run e2e`
  - `npm run e2e:install`
- `.github/workflows/e2e.yml`
  - installs dependencies
  - runs typecheck
  - builds the production bundle
  - installs Chromium
  - runs Playwright desktop + mobile tests
  - uploads browser reports/artifacts on failure

### Verification state

The new GitHub Actions E2E workflow was triggered by the push to `main` and is running against commit `a67dc1e85b464818c748f063bf9d108024f3e3e9`. At the time this addendum was written, dependency installation was still in progress, so no success is claimed yet.

The workflow uses a non-secret placeholder publishable key only to allow the frontend bundle/test server to boot in CI. It does not expose a service-role key or any privileged credential. Real authenticated E2E scenarios will use a dedicated test identity and will be added once the corresponding product flows stabilize.

### Operating rule going forward

Browser automation is now part of the ACE JAMB verification strategy. A feature that materially changes a user flow should receive an appropriate Playwright test before its batch is considered verified. Tests must exercise real UI behavior and must not fake backend authorization or payment success.

Batch 1 remains formally open because its deferred comprehensive authenticated E2E evidence has not yet been completed. Batch 2 remains in progress. Batch 3 is not authorized.

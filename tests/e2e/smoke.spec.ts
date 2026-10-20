import { test, expect } from '@playwright/test'

const projectUrl = 'https://uokiqlgmzprqfbzmedaz.supabase.co'
const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const subjects = [
  { id: '10000000-0000-4000-8000-000000000001', name: 'Use of English', code: 'ENG' },
  { id: '10000000-0000-4000-8000-000000000002', name: 'Mathematics', code: 'MTH' },
  { id: '10000000-0000-4000-8000-000000000003', name: 'Physics', code: 'PHY' },
  { id: '10000000-0000-4000-8000-000000000004', name: 'Chemistry', code: 'CHM' },
  { id: '10000000-0000-4000-8000-000000000005', name: 'Biology', code: 'BIO' },
]

async function mockFirstTimeStudent(page: import('@playwright/test').Page) {
  // Every Supabase request is intercepted; tests cannot read or write production data.
  await page.route(`${projectUrl}/**`, async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname
    if (path === '/auth/v1/user') {
      await route.fulfill({ json: { id: userId, aud: 'authenticated', role: 'authenticated', email: 'student@example.test', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, created_at: '2026-01-01T00:00:00.000Z' } })
      return
    }
    if (path.includes('/rest/v1/rpc/is_admin')) {
      await route.fulfill({ json: false })
      return
    }
    if (path.includes('/rest/v1/devices')) {
      await route.fulfill({ status: 201, json: { id: '20000000-0000-4000-8000-000000000001', user_id: userId, device_hash: 'test-device-hash', platform: 'Playwright', app_version: null, last_seen_at: '2026-01-01T00:00:00.000Z' } })
      return
    }
    if (path.endsWith('/rest/v1/profiles') || path.endsWith('/rest/v1/student_preferences')) {
      await route.fulfill({ status: 406, contentType: 'application/json', json: { code: 'PGRST116', message: 'JSON object requested, no rows returned', details: 'The result contains 0 rows', hint: null } })
      return
    }
    if (path.endsWith('/rest/v1/subjects')) {
      await route.fulfill({ json: subjects })
      return
    }
    if (path.endsWith('/rest/v1/student_subjects')) {
      await route.fulfill({ json: [] })
      return
    }
    await route.fulfill({ status: 200, json: [] })
  })

  await page.addInitScript(({ uid }) => {
    const projectRef = 'uokiqlgmzprqfbzmedaz'
    const session = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: uid, aud: 'authenticated', role: 'authenticated', email: 'student@example.test', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {} },
    }
    localStorage.setItem(`sb-${projectRef}-auth-token`, JSON.stringify(session))
  }, { uid: userId })
}

test.describe('ACE JAMB student entry and preparation onboarding', () => {
  test('student entry surface renders', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('body')).toContainText(/ACE JAMB|Preparing your ACE account|Create account|Sign in/i)
  })

  test('student entry surface remains usable on mobile', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('body')).toBeVisible()
    await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll')
  })

  test('first-time student can load preparation setup without catalogue rows', async ({ page }) => {
    await mockFirstTimeStudent(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Build your preparation profile.' })).toBeVisible()
    await expect(page.getByLabel(/Use of English/)).toBeChecked()
    await expect(page.getByLabel(/Use of English/)).toBeDisabled()
    await expect(page.getByText(/English included \+ 0 of 3 additional subjects selected/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continue to ACE' })).toBeDisabled()

    await page.getByLabel(/Mathematics/).check()
    await page.getByLabel(/Physics/).check()
    await page.getByLabel(/Chemistry/).check()
    await expect(page.getByText(/English included \+ 3 of 3 additional subjects selected/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continue to ACE' })).toBeEnabled()
    await expect(page.getByLabel(/Biology/)).toBeDisabled()
  })
})

test.describe('ACE JAMB academic editor access', () => {
  test('authorized content editor reaches the separate academic workspace', async ({ page }) => {
    await mockFirstTimeStudent(page)
    await page.route(`${projectUrl}/rest/v1/rpc/is_admin_or_editor`, async (route) => {
      await route.fulfill({ json: true })
    })
    await page.goto('/admin-academic')
    await expect(page.getByRole('heading', { name: 'Academic Structure' })).toBeVisible()
    await expect(page.getByText('No syllabus versions found')).toBeVisible()
  })

  test('student without editor permission cannot see academic authoring tools', async ({ page }) => {
    await mockFirstTimeStudent(page)
    await page.route(`${projectUrl}/rest/v1/rpc/is_admin_or_editor`, async (route) => {
      await route.fulfill({ json: false })
    })
    await page.goto('/admin-academic')
    await expect(page.getByRole('heading', { name: 'Academic editor access required' })).toBeVisible()
    await expect(page.getByText('Create a draft syllabus version')).toHaveCount(0)
  })
})

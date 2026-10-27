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

test.describe('ACE JAMB account recovery', () => {
  test('sign-up normalizes the email and reports successful account creation', async ({ page }) => {
    let signupPayload: Record<string, unknown> | null = null
    await page.route(`${projectUrl}/**`, async (route) => {
      const url = new URL(route.request().url())
      if (url.pathname === '/auth/v1/user') {
        await route.fulfill({ status: 401, contentType: 'application/json', json: { code: 'session_not_found', message: 'Auth session missing!' } })
      } else if (url.pathname === '/auth/v1/signup') {
        signupPayload = route.request().postDataJSON()
        await route.fulfill({ status: 200, contentType: 'application/json', json: {
          user: { id: userId, email: 'student@example.test', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, created_at: '2026-01-01T00:00:00.000Z' },
          session: null,
        } })
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', json: [] })
      }
    })

    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible()
    await page.getByRole('button', { name: 'Create an account' }).click()
    await expect(page.getByRole('heading', { name: 'Create your ACE account.' })).toBeVisible()
    await page.getByLabel('Email address').fill('Student@Example.Test')
    await page.getByLabel('New password').fill('valid-test-password')
    await page.getByLabel('Confirm password').fill('valid-test-password')
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page.getByRole('status')).toContainText('Account created')
    await expect.poll(() => signupPayload).not.toBeNull()
    expect(signupPayload?.email).toBe('student@example.test')
    expect(signupPayload?.password).toBe('valid-test-password')
  })

  test('forgot-password flow requests a reset email with a same-origin redirect', async ({ page }) => {
    let resetRedirect = ''
    await page.route(`${projectUrl}/**`, async (route) => {
      const url = new URL(route.request().url())
      if (url.pathname === '/auth/v1/user') {
        await route.fulfill({ status: 401, contentType: 'application/json', json: { code: 'session_not_found', message: 'Auth session missing!' } })
      } else if (url.pathname === '/auth/v1/recover') {
        resetRedirect = url.searchParams.get('redirect_to') ?? ''
        await route.fulfill({ status: 200, contentType: 'application/json', json: {} })
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', json: [] })
      }
    })

    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible()
    await page.getByRole('button', { name: 'Forgot password?' }).click()
    await expect(page.getByRole('heading', { name: 'Reset your password.' })).toBeVisible()
    await page.getByLabel('Email address').fill('student@example.test')
    await page.getByRole('button', { name: 'Send reset email' }).click()
    await expect(page.getByRole('status')).toContainText('If an account exists for that email')
    await expect.poll(() => resetRedirect).toBe('http://127.0.0.1:4173')
  })

  test('recovery session can update the account password', async ({ page }) => {
    await mockPreparedStudent(page)
    let updateCalls = 0
    let updatedPassword = ''

    await page.route((url) => new URL(url).pathname === '/auth/v1/user' && url.toString().startsWith('http'), async (route) => {
      if (route.request().method() === 'GET') {
        await route.fallback()
        return
      }
      updateCalls += 1
      updatedPassword = route.request().postDataJSON().password
      await route.fulfill({ status: 200, contentType: 'application/json', json: {
        id: userId, aud: 'authenticated', role: 'authenticated', email: 'student@example.test',
        app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {},
      } })
    })

    await page.goto('/#access_token=recovery-test-access-token&refresh_token=recovery-test-refresh-token&type=recovery')
    await expect(page.getByRole('heading', { name: 'Set a new password.' })).toBeVisible()
    await page.getByLabel('New password').fill('new-test-password-123')
    await page.getByLabel('Confirm password').fill('new-test-password-123')
    await page.getByRole('button', { name: 'Update password' }).click()
    await expect(page.getByRole('status')).toContainText('Password updated successfully')
    expect(updateCalls).toBe(1)
    expect(updatedPassword).toBe('new-test-password-123')
  })
})

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

  test('renders the student dashboard from the persisted Supabase auth state', async ({ page }) => {
    await mockPreparedStudent(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Welcome back.' })).not.toBeVisible()
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


async function mockPreparedStudent(page: import('@playwright/test').Page) {
  // Fully mocked Supabase responses keep this authenticated journey isolated from production.
  await page.route(`${projectUrl}/**`, async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path === '/auth/v1/user') {
      await route.fulfill({ json: { id: userId, aud: 'authenticated', role: 'authenticated', email: 'student@example.test', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, created_at: '2026-01-01T00:00:00.000Z' } })
      return
    }
    if (path.includes('/rest/v1/rpc/is_admin') || path.includes('/rest/v1/rpc/is_admin_or_editor')) {
      await route.fulfill({ json: false })
      return
    }
    if (path.includes('/rest/v1/rpc/get_active_exam_blueprint')) {
      await route.fulfill({ json: null })
      return
    }
    if (path.includes('/rest/v1/devices')) {
      await route.fulfill({ status: 201, json: { id: '20000000-0000-4000-8000-000000000001', user_id: userId, device_hash: 'test-device-hash', platform: 'Playwright', app_version: null, last_seen_at: '2026-01-01T00:00:00.000Z' } })
      return
    }
    if (path.endsWith('/rest/v1/profiles')) {
      await route.fulfill({ json: { id: userId, email: 'student@example.test', display_name: 'Test Futarian', target_score: 300, institution: null, course: null, institution_id: null, program_id: null, prep_time_minutes: null, exam_season: null, created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z' } })
      return
    }
    if (path.endsWith('/rest/v1/student_preferences')) {
      await route.fulfill({ json: { user_id: userId, learning_style: null, daily_minutes: 60, preferred_study_days: [], timezone: null, preferences: {}, updated_at: '2026-01-01T00:00:00.000Z' } })
      return
    }
    if (path.endsWith('/rest/v1/student_subjects')) {
      await route.fulfill({ json: subjects.slice(0, 4).map((subject, index) => ({ subject_id: subject.id, is_primary: index === 0, sort_order: index })) })
      return
    }
    if (path.endsWith('/rest/v1/subjects')) {
      await route.fulfill({ json: subjects.slice(0, 4) })
      return
    }
    await route.fulfill({ status: 200, json: [] })
  })

  await page.addInitScript(({ uid }) => {
    const projectRef = 'uokiqlgmzprqfbzmedaz'
    localStorage.setItem(`sb-${projectRef}-auth-token`, JSON.stringify({
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: uid, aud: 'authenticated', role: 'authenticated', email: 'student@example.test', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {} },
    }))
  }, { uid: userId })
}



async function mockSyllabusPublicationState(page: import('@playwright/test').Page, rightsStatus: 'approved' | 'pending') {
  await mockPreparedStudent(page)
  const seasonId = '50000000-0000-4000-8000-000000000001'
  const versionId = '60000000-0000-4000-8000-000000000001'
  const topicId = '70000000-0000-4000-8000-000000000001'
  let topicFetches = 0

  await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/get_active_exam_blueprint'), async (route) => {
    await route.fulfill({ json: {
      season: { id: seasonId, code: 'JAMB-2027', name: 'JAMB 2027', starts_at: null, ends_at: null, exam_year: 2027, status: 'active', metadata: {} },
      config: null,
      subjects: [],
    } })
  })
  await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/syllabus_versions'), async (route) => {
    await route.fulfill({ json: [{
      id: versionId, season_id: seasonId, subject_id: subjects[0].id, version: 1,
      title: 'Use of English syllabus', source_url: 'https://example.test/syllabus',
      source_title: 'Test syllabus fixture', rights_status: rightsStatus,
      provenance: { fixture: true }, status: 'active', activated_at: '2026-10-01T00:00:00.000Z',
    }] })
  })
  await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/topics'), async (route) => {
    topicFetches += 1
    await route.fulfill({ json: [{
      id: topicId, subject_id: subjects[0].id, syllabus_version_id: versionId,
      name: 'Verified comprehension fixture', description: 'Test-only approved syllabus topic.',
      sort_order: 1, active: true,
    }] })
  })
  await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/subtopics'), async (route) => {
    await route.fulfill({ json: [] })
  })
  return { topicFetches: () => topicFetches }
}

test.describe('ACE JAMB dashboard recovery', () => {
  test('retries a transient device-registration failure without exposing backend details', async ({ page }) => {
    await mockPreparedStudent(page)
    let allowDeviceSuccess = false
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/devices') && url.toString().startsWith('http'), async (route) => {
      if (!allowDeviceSuccess && route.request().method() !== 'GET') {
        await route.fulfill({ status: 503, contentType: 'application/json', json: { code: 'temporary_outage', message: 'raw provider detail should not be shown' } })
        return
      }
      await route.fallback()
    })

    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'We couldn’t prepare your account' })).toBeVisible()
    await expect(page.getByText('raw provider detail should not be shown', { exact: true })).toHaveCount(0)
    allowDeviceSuccess = true
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()
  })
})

test.describe('ACE JAMB prepared student dashboard', () => {
  test('announces initial account preparation while authentication resolves', async ({ page }) => {
    await mockPreparedStudent(page)
    let releaseAuthRequest!: () => void
    const authRequestGate = new Promise<void>((resolve) => { releaseAuthRequest = resolve })
    await page.route((url) => new URL(url).pathname === '/auth/v1/user', async (route) => {
      await authRequestGate
      await route.fallback()
    })

    await page.goto('/')
    await expect(page.getByRole('status')).toContainText('Preparing your ACE account')
    releaseAuthRequest()
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()
  })

  test('announces dashboard loading state to assistive technology', async ({ page }) => {
    await mockPreparedStudent(page)
    let releaseProfileRequest!: () => void
    const profileRequestGate = new Promise<void>((resolve) => { releaseProfileRequest = resolve })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/get_active_exam_blueprint'), async (route) => {
      await profileRequestGate
      await route.fallback()
    })

    await page.goto('/')
    await expect(page.getByRole('status')).toContainText('Loading your preparation dashboard')
    releaseProfileRequest()
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()
  })

  test('dashboard skip link moves keyboard focus to the main preparation content', async ({ page }) => {
    await mockPreparedStudent(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()

    const skipLink = page.getByRole('link', { name: 'Skip to dashboard content' })
    await expect(skipLink).toBeVisible()
    await skipLink.focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('#dashboard-content')).toBeFocused()
  })

  test('saved preparation profile survives reload and dashboard offers CBT navigation', async ({ page }) => {
    await mockPreparedStudent(page)
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'My subjects' })).toBeVisible()
    await expect(page.getByText('Use of English')).toBeVisible()
    await expect(page.getByText(/Verified learning content is not published yet/)).toBeVisible()

    await page.getByRole('button', { name: /Learn Approved syllabus topics/ }).click()
    await expect(page.getByRole('heading', { name: 'Learn', exact: true })).toBeFocused()
    await page.getByRole('button', { name: 'Dashboard' }).click()
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeFocused()

    await page.reload()
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()
    await page.getByRole('button', { name: /CBT Practice/ }).click()
    await expect(page).toHaveURL(/[?&]cbt=1(?:&|$)/)
    const backButton = page.getByRole('button', { name: /Back to ACE JAMB/ })
    await expect(backButton).toBeVisible()
    await expect(backButton).toHaveAttribute('type', 'button')
    await backButton.click()
    await expect(page).not.toHaveURL(/[?&]cbt=1(?:&|$)/)
    const dashboardHeading = page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })
    await expect(dashboardHeading).toBeVisible()
    await expect(dashboardHeading).toBeFocused()
  })
})

test.describe('ACE JAMB persistent CBT', () => {
  test('skip link moves keyboard focus past the CBT shell controls', async ({ page }) => {
    await mockPreparedStudent(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()
    await page.getByRole('button', { name: /CBT Practice/ }).click()

    const skipLink = page.getByRole('link', { name: 'Skip to CBT content' })
    await expect(skipLink).toBeVisible()
    await skipLink.focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('#cbt-content')).toBeFocused()
  })

  test('practice workspace starts a practice-mode attempt and reports an empty question bank honestly', async ({ page }) => {
    await mockPreparedStudent(page)
    let requestedMode = ''
    await page.route(`${projectUrl}/rest/v1/rpc/start_attempt`, async (route) => {
      requestedMode = route.request().postDataJSON().p_mode
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'P0001', message: 'No published questions available for this attempt', details: '', hint: '' }),
      })
    })

    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()
    await page.getByRole('button', { name: /Practice Verified question sets/ }).click()
    await expect(page.getByRole('heading', { name: 'Practice', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Start a practice session' }).click()
    await expect(page).toHaveURL(/[?&]mode=practice(?:&|$)/)
    await expect.poll(() => requestedMode).toBe('practice')
    await expect(page.getByRole('alert')).toContainText(/No reviewed questions are published for this session yet/)
  })

  test('restores the same active attempt after reload instead of starting another', async ({ page }) => {
    await mockPreparedStudent(page)
    const questionId = '30000000-0000-4000-8000-000000000002'
    const attemptId = '40000000-0000-4000-8000-000000000002'
    const startedAt = new Date().toISOString()
    let startCalls = 0
    let resumeCalls = 0

    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/start_attempt'), async (route) => {
      startCalls += 1
      await route.fulfill({ json: {
        attempt_id: attemptId, status: 'active', started_at: startedAt,
        duration_seconds: 1800, random_seed: 2, question_order: [questionId],
        option_order: { [questionId]: ['A'] }, question_count: 1,
      } })
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/resume_attempt'), async (route) => {
      resumeCalls += 1
      await route.fulfill({ json: {
        attempt_id: attemptId, status: 'active', mode: 'cbt', subject_id: null,
        started_at: startedAt, completed_at: null, duration_seconds: 1800,
        remaining_seconds: 1790, random_seed: 2, question_order: [questionId],
        option_order: { [questionId]: ['A'] }, answers: [], score: null,
        correct_count: 0, answered_count: 0,
      } })
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/questions'), async (route) => {
      await route.fulfill({ json: [{
        id: questionId, question_text: 'Recovery test question',
        options: [{ key: 'A', text: 'Answer A' }],
        subject_id: null, topic_id: null, difficulty: 'easy',
      }] })
    })

    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()
    await page.getByRole('button', { name: /CBT Practice/ }).click()
    await expect(page.getByRole('heading', { name: 'JAMB simulation' })).toBeVisible()
    await expect.poll(() => startCalls).toBe(1)
    await page.reload()
    await expect(page.getByRole('heading', { name: 'JAMB simulation' })).toBeVisible()
    await expect.poll(() => resumeCalls).toBe(2)
    expect(startCalls).toBe(1)
  })

  test('temporary resume failure retains the saved attempt and retry restores it without creating another', async ({ page }) => {
    await mockPreparedStudent(page)
    const attemptId = '40000000-0000-4000-8000-000000000041'
    const questionId = '30000000-0000-4000-8000-000000000041'
    const startedAt = new Date().toISOString()
    let permitResume = false
    let startCalls = 0
    let resumeCalls = 0
    await page.addInitScript(({ id, uid }) => {
      localStorage.setItem('ace-cbt-active-attempt:' + uid, id)
    }, { id: attemptId, uid: userId })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/start_attempt'), async (route) => {
      startCalls += 1
      await route.fulfill({ status: 400, json: { code: 'P0001', message: 'A fresh attempt must not start during recovery' } })
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/resume_attempt'), async (route) => {
      resumeCalls += 1
      if (!permitResume) {
        await route.fulfill({ status: 400, contentType: 'application/json', json: {
          code: 'temporarily_unavailable', message: 'private server details are not for display',
        } })
        return
      }
      await route.fulfill({ json: {
        attempt_id: attemptId, status: 'active', mode: 'cbt', subject_id: null,
        started_at: startedAt, completed_at: null, duration_seconds: 1800,
        remaining_seconds: 1700, random_seed: 41, question_order: [questionId],
        option_order: { [questionId]: ['A'] }, answers: [], score: null,
        correct_count: 0, answered_count: 0,
      } })
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/questions'), async (route) => {
      await route.fulfill({ json: [{
        id: questionId, question_text: 'Recovered original CBT question',
        options: [{ key: 'A', text: 'Answer A' }], subject_id: null, topic_id: null, difficulty: 'easy',
      }] })
    })
    await page.goto('/?cbt=1')
    await expect(page.getByText('CBT unavailable', { exact: true })).toBeVisible()
    await expect(page.getByRole('alert')).toContainText('We could not load this CBT session')
    await expect(page.getByText('private server details are not for display')).toHaveCount(0)
    expect(startCalls).toBe(0)
    expect(await page.evaluate((uid) => localStorage.getItem('ace-cbt-active-attempt:' + uid), userId)).toBe(attemptId)
    permitResume = true
    await page.getByRole('button', { name: 'Retry' }).click()
    await expect(page.getByRole('heading', { name: 'Recovered original CBT question' })).toBeVisible()
    expect(resumeCalls).toBeGreaterThanOrEqual(2)
    expect(startCalls).toBe(0)
    expect(await page.evaluate((uid) => localStorage.getItem('ace-cbt-active-attempt:' + uid), userId)).toBe(attemptId)
  })

  test('only a definitive missing-attempt response replaces an obsolete recovery pointer', async ({ page }) => {
    await mockPreparedStudent(page)
    const oldId = '40000000-0000-4000-8000-000000000042'
    const newId = '40000000-0000-4000-8000-000000000043'
    const questionId = '30000000-0000-4000-8000-000000000042'
    const startedAt = new Date().toISOString()
    let startCalls = 0
    await page.addInitScript(({ id, uid }) => {
      localStorage.setItem('ace-cbt-active-attempt:' + uid, id)
    }, { id: oldId, uid: userId })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/resume_attempt'), async (route) => {
      const body = route.request().postDataJSON()
      if (body.p_attempt_id === oldId) {
        await route.fulfill({ status: 404, contentType: 'application/json', json: {
          code: 'P0002', message: 'Attempt not found',
        } })
        return
      }
      await route.fulfill({ json: {
        attempt_id: newId, status: 'active', mode: 'cbt', subject_id: null,
        started_at: startedAt, completed_at: null, duration_seconds: 1800,
        remaining_seconds: 1750, random_seed: 42, question_order: [questionId],
        option_order: { [questionId]: ['A'] }, answers: [], score: null,
        correct_count: 0, answered_count: 0,
      } })
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/start_attempt'), async (route) => {
      startCalls += 1
      await route.fulfill({ json: {
        attempt_id: newId, status: 'active', started_at: startedAt,
        duration_seconds: 1800, random_seed: 42, question_order: [questionId],
        option_order: { [questionId]: ['A'] }, question_count: 1,
      } })
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/questions'), async (route) => {
      await route.fulfill({ json: [{
        id: questionId, question_text: 'Newly started CBT after obsolete pointer',
        options: [{ key: 'A', text: 'Answer A' }], subject_id: null, topic_id: null, difficulty: 'easy',
      }] })
    })
    await page.goto('/?cbt=1')
    await expect(page.getByRole('heading', { name: 'Newly started CBT after obsolete pointer' })).toBeVisible()
    expect(startCalls).toBe(1)
    expect(await page.evaluate((uid) => localStorage.getItem('ace-cbt-active-attempt:' + uid), userId)).toBe(newId)
  })

  test('CBT countdown respects server remaining time even when device wall time is skewed', async ({ page }) => {
    await mockPreparedStudent(page)
    const attemptId = '40000000-0000-4000-8000-000000000044'
    const questionId = '30000000-0000-4000-8000-000000000044'
    const deviceSkewedStart = '2024-01-01T00:00:00.000Z'
    let submissionCalls = 0
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/start_attempt'), async (route) => {
      await route.fulfill({ json: {
        attempt_id: attemptId, status: 'active', started_at: deviceSkewedStart,
        duration_seconds: 1800, random_seed: 44, question_order: [questionId],
        option_order: { [questionId]: ['A'] }, question_count: 1,
      } })
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/resume_attempt'), async (route) => {
      await route.fulfill({ json: {
        attempt_id: attemptId, status: 'active', mode: 'cbt', subject_id: null,
        started_at: deviceSkewedStart, completed_at: null, duration_seconds: 1800,
        remaining_seconds: 90, random_seed: 44, question_order: [questionId],
        option_order: { [questionId]: ['A'] }, answers: [], score: null,
        correct_count: 0, answered_count: 0,
      } })
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/questions'), async (route) => {
      await route.fulfill({ json: [{
        id: questionId, question_text: 'Monotonic countdown test question',
        options: [{ key: 'A', text: 'Answer A' }], subject_id: null, topic_id: null, difficulty: 'easy',
      }] })
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/submit_attempt'), async (route) => {
      submissionCalls += 1
      await route.fulfill({ status: 400, json: { code: 'timer_test', message: 'Unexpected automatic submission' } })
    })
    await page.goto('/?cbt=1')
    await expect(page.getByRole('heading', { name: 'Monotonic countdown test question' })).toBeVisible()
    await expect(page.getByRole('timer')).toContainText(/00:01:(29|30)/)
    await page.waitForTimeout(1200)
    expect(submissionCalls).toBe(0)
    await expect(page.getByRole('heading', { name: 'Monotonic countdown test question' })).toBeVisible()
  })

  test('review marks survive CBT reload and clear after submission without changing answers', async ({ page }) => {
    await mockPreparedStudent(page)
    const questionIds = ['30000000-0000-4000-8000-000000000021', '30000000-0000-4000-8000-000000000022']
    const attemptId = '40000000-0000-4000-8000-000000000021'
    const startedAt = new Date().toISOString()
    let submitted = 0
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/start_attempt'), async (route) => {
      await route.fulfill({ json: {
        attempt_id: attemptId, status: 'active', started_at: startedAt, duration_seconds: 1800,
        random_seed: 2, question_order: questionIds,
        option_order: Object.fromEntries(questionIds.map((id) => [id, ['A']])), question_count: 2,
      } })
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/resume_attempt'), async (route) => {
      await route.fulfill({ json: {
        attempt_id: attemptId, status: 'active', mode: 'cbt', subject_id: null,
        started_at: startedAt, completed_at: null, duration_seconds: 1800, remaining_seconds: 1800,
        random_seed: 2, question_order: questionIds,
        option_order: Object.fromEntries(questionIds.map((id) => [id, ['A']])),
        answers: [], score: null, correct_count: 0, answered_count: 0,
      } })
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/questions'), async (route) => {
      await route.fulfill({ json: questionIds.map((id, index) => ({
        id, question_text: 'Reviewed question ' + (index + 1),
        options: [{ key: 'A', text: 'Option A' }], subject_id: null, topic_id: null, difficulty: 'easy',
      })) })
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/submit_attempt'), async (route) => {
      submitted += 1
      await route.fulfill({ json: {
        attempt_id: attemptId, status: 'completed', score: 0, correct_count: 0, answered_count: 0,
        total_questions: 2, completed_at: new Date().toISOString(),
      } })
    })
    await page.goto('/?cbt=1')
    await expect(page.getByRole('heading', { name: 'JAMB simulation' })).toBeVisible()
    await page.getByRole('button', { name: 'Mark for review' }).click()
    await expect(page.getByRole('button', { name: 'Go to question 1, unanswered, marked for review' })).toBeVisible()
    await expect(page.getByText('0 answered · 2 unanswered · 1 marked for review')).toBeVisible()
    await page.reload()
    await expect(page.getByRole('button', { name: 'Remove review mark' })).toBeVisible()
    await page.getByRole('button', { name: 'Next unanswered' }).click()
    await expect(page.getByRole('heading', { name: 'Reviewed question 2' })).toBeVisible()
    await expect.poll(() => page.evaluate((id) => JSON.parse(localStorage.getItem('ace-cbt-review-flags:' + id) ?? '[]'), attemptId)).toEqual([questionIds[0]])
    await page.getByRole('button', { name: 'Submit CBT' }).click()
    await expect(page.getByRole('heading', { name: 'Review before submitting' })).toBeVisible()
    expect(submitted).toBe(0)
    await page.getByRole('button', { name: 'Submit anyway' }).click()
    await expect(page.getByText('0/2 correct')).toBeVisible()
    await expect(page.getByText('0 answered · 2 unanswered')).toBeVisible()
    await expect(page.getByRole('link', { name: 'View progress history' })).toHaveAttribute('href', '/?view=progress')
    expect(submitted).toBe(1)
    expect(await page.evaluate((id) => localStorage.getItem('ace-cbt-review-flags:' + id), attemptId)).toBeNull()
  })

  test('restores a completed attempt result without requiring question content', async ({ page }) => {
    await mockPreparedStudent(page)
    const attemptId = '40000000-0000-4000-8000-000000000003'
    let questionFetches = 0
    await page.addInitScript(({ id }) => {
      localStorage.setItem(`ace-cbt-active-attempt:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa`, id)
    }, { id: attemptId })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/resume_attempt'), async (route) => {
      await route.fulfill({ json: {
        attempt_id: attemptId, status: 'completed', mode: 'cbt', subject_id: null,
        started_at: '2026-10-20T10:00:00.000Z', completed_at: '2026-10-20T10:20:00.000Z',
        duration_seconds: 1200, remaining_seconds: 0, random_seed: 3,
        question_order: ['30000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000007'],
        option_order: {}, answers: [], score: 80, correct_count: 4, answered_count: 5,
      } })
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/questions'), async (route) => {
      questionFetches += 1
      await route.fulfill({ json: [] })
    })

    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()
    await page.getByRole('button', { name: /CBT Practice/ }).click()
    await expect(page.getByText('80%', { exact: true })).toBeVisible()
    await expect(page.getByText('4/5 correct')).toBeVisible()
    expect(questionFetches).toBe(0)
  })

  test('saves an answer and renders the server-submitted result', async ({ page }) => {
    await mockPreparedStudent(page)
    const questionId = '30000000-0000-4000-8000-000000000001'
    const attemptId = '40000000-0000-4000-8000-000000000001'
    const startedAt = new Date().toISOString()
    let observedResponseMs: number | null = null
    let questionSelection: string[] = []

    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/start_attempt'), async (route) => {
      await route.fulfill({ json: {
        attempt_id: attemptId, status: 'active', started_at: startedAt,
        duration_seconds: 1800, random_seed: 1, question_order: [questionId],
        option_order: { [questionId]: ['B', 'A'] }, question_count: 1,
      } })
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/resume_attempt'), async (route) => {
      await route.fulfill({ json: {
        attempt_id: attemptId, status: 'active', mode: 'cbt', subject_id: null,
        started_at: startedAt, completed_at: null, duration_seconds: 1800,
        remaining_seconds: 1800, random_seed: 1, question_order: [questionId],
        option_order: { [questionId]: ['B', 'A'] }, answers: [], score: null,
        correct_count: 0, answered_count: 0,
      } })
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/questions'), async (route) => {
      questionSelection = (new URL(route.request().url()).searchParams.get('select') ?? '').split(',')
      // The deployed schema stores the prompt as stem; PostgREST supplies the client alias.
      // A permissive fixture would otherwise hide a request for the nonexistent question_text column.
      if (!questionSelection.includes('question_text:stem')) {
        await route.fulfill({ status: 400, json: { code: '42703', message: 'column questions.question_text does not exist' } })
        return
      }
      await route.fulfill({ json: [{
        id: questionId, question_text: 'Which option is correct?',
        options: [{ key: 'A', text: 'First answer' }, { key: 'B', text: 'Second answer' }],
        subject_id: null, topic_id: null, difficulty: 'easy',
      }] })
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/save_attempt_answer'), async (route) => {
      observedResponseMs = route.request().postDataJSON().p_response_ms
      await new Promise((resolve) => setTimeout(resolve, 250))
      await route.fulfill({ json: {
        attempt_id: attemptId, question_id: questionId, selected_option_key: 'A',
        is_correct: true, answered_at: new Date().toISOString(), answered_count: 1,
      } })
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/submit_attempt'), async (route) => {
      await route.fulfill({ json: {
        attempt_id: attemptId, status: 'completed', score: 100, correct_count: 1,
        answered_count: 1, total_questions: 1, completed_at: new Date().toISOString(),
      } })
    })

    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()
    await page.getByRole('button', { name: /CBT Practice/ }).click()
    await expect(page.getByRole('heading', { name: 'JAMB simulation' })).toBeVisible()
    await expect(page.getByRole('timer', { name: 'Time remaining 00:30:00' })).toBeVisible()
    await expect(page.getByRole('group', { name: 'Which option is correct?' })).toBeVisible()
    expect(questionSelection).toEqual(['id', 'question_text:stem', 'options', 'subject_id', 'topic_id', 'difficulty'])
    await expect(page.locator('#cbt-question-title')).toHaveCSS('white-space', 'pre-wrap')
    await expect(page.getByRole('button', { name: 'B. First answer' }).locator('span').last()).toHaveCSS('white-space', 'pre-wrap')
    await expect(page.getByRole('button', { name: 'Go to question 1, unanswered' })).toHaveAttribute('aria-current', 'step')
    // The server-provided option order is B, A, so canonical option A is displayed second.
    const firstAnswer = page.getByRole('button', { name: 'B. First answer' })
    await firstAnswer.focus()
    await expect(firstAnswer).toBeFocused()
    await firstAnswer.press('Enter')
    await expect(page.getByRole('status')).toContainText('Saving your answer…')
    await expect(page.getByRole('button', { name: 'B. First answer' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('status')).toHaveText('')
    await expect(page.getByRole('button', { name: 'Go to question 1, answered' })).toHaveAttribute('aria-current', 'step')
    expect(typeof observedResponseMs).toBe('number')
    expect(observedResponseMs).toBeGreaterThan(0)
    await page.getByRole('button', { name: 'Submit CBT' }).click()
    await expect(page.getByText('100%', { exact: true })).toBeVisible()
    await expect(page.getByText('1/1 correct')).toBeVisible()
  })
})


test.describe('ACE JAMB CBT sign-in and expiry recovery', () => {
  test('practice sign-in stores recovery pointer under the practice-specific key', async ({ page }) => {
    const attemptId = '40000000-0000-4000-8000-000000000004'
    const questionId = '30000000-0000-4000-8000-000000000004'
    let requestedMode = ''

    await page.route(`${projectUrl}/**`, async (route) => {
      const url = new URL(route.request().url())
      if (url.pathname === '/auth/v1/user') {
        await route.fulfill({ status: 401, contentType: 'application/json', json: { code: 'session_not_found', message: 'Auth session missing!' } })
      } else if (url.pathname === '/auth/v1/token') {
        await route.fulfill({ status: 200, contentType: 'application/json', json: {
          access_token: 'signed-in-test-access-token', refresh_token: 'signed-in-test-refresh-token',
          token_type: 'bearer', expires_in: 3600,
          user: { id: userId, aud: 'authenticated', role: 'authenticated', email: 'student@example.test', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {} },
        } })
      } else if (url.pathname.endsWith('/rest/v1/rpc/start_attempt')) {
        requestedMode = route.request().postDataJSON().p_mode
        await route.fulfill({ json: {
          attempt_id: attemptId, status: 'active', started_at: new Date().toISOString(),
          duration_seconds: 1800, random_seed: 4, question_order: [questionId],
          option_order: { [questionId]: ['A'] }, question_count: 1,
        } })
      } else if (url.pathname.endsWith('/rest/v1/rpc/resume_attempt')) {
        await route.fulfill({ json: {
          attempt_id: attemptId, status: 'active', mode: 'practice', subject_id: null,
          started_at: new Date().toISOString(), completed_at: null, duration_seconds: 1800,
          remaining_seconds: 1800, random_seed: 4, question_order: [questionId],
          option_order: { [questionId]: ['A'] }, answers: [], score: null,
          correct_count: 0, answered_count: 0,
        } })
      } else if (url.pathname.endsWith('/rest/v1/questions')) {
        await route.fulfill({ json: [{ id: questionId, question_text: 'Practice sign-in fixture', options: [{ key: 'A', text: 'Answer A' }], subject_id: null, topic_id: null, difficulty: 'easy' }] })
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', json: [] })
      }
    })

    await page.goto('/?cbt=1&mode=practice')
    await expect(page.getByRole('heading', { name: 'Sign in to continue.' })).toBeVisible()
    await page.getByPlaceholder('you@example.com').fill('student@example.test')
    await page.getByPlaceholder('Password').fill('valid-test-password')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByRole('heading', { name: 'JAMB simulation' })).toBeVisible()
    await expect.poll(() => requestedMode).toBe('practice')
    await expect.poll(() => page.evaluate(() => localStorage.getItem('ace-practice-active-attempt:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'))).toBe(attemptId)
    expect(await page.evaluate(() => localStorage.getItem('ace-cbt-active-attempt:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'))).toBeNull()
  })

  test('expired CBT auto-submits and a transient submit failure can be retried', async ({ page }) => {
    await mockPreparedStudent(page)
    const questionId = '30000000-0000-4000-8000-000000000006'
    const attemptId = '40000000-0000-4000-8000-000000000006'
    const expiredAt = new Date(Date.now() - 10000).toISOString()
    let submitCalls = 0

    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/start_attempt'), async (route) => {
      await route.fulfill({ json: {
        attempt_id: attemptId, status: 'active', started_at: expiredAt,
        duration_seconds: 1, random_seed: 6, question_order: [questionId],
        option_order: { [questionId]: ['A'] }, question_count: 1,
      } })
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/resume_attempt'), async (route) => {
      await route.fulfill({ json: {
        attempt_id: attemptId, status: 'active', mode: 'cbt', subject_id: null,
        started_at: expiredAt, completed_at: null, duration_seconds: 1,
        remaining_seconds: 0, random_seed: 6, question_order: [questionId],
        option_order: { [questionId]: ['A'] }, answers: [], score: null,
        correct_count: 0, answered_count: 0,
      } })
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/questions'), async (route) => {
      await route.fulfill({ json: [{ id: questionId, question_text: 'Expired CBT fixture', options: [{ key: 'A', text: 'Answer A' }], subject_id: null, topic_id: null, difficulty: 'easy' }] })
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/submit_attempt'), async (route) => {
      submitCalls += 1
      if (submitCalls === 1) {
        await route.fulfill({ status: 500, contentType: 'application/json', json: { code: 'temporary_failure', message: 'Temporary submit failure' } })
      } else {
        await route.fulfill({ json: {
          attempt_id: attemptId, status: 'completed', score: 0, correct_count: 0,
          answered_count: 0, total_questions: 1, completed_at: new Date().toISOString(),
        } })
      }
    })

    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()
    await page.getByRole('button', { name: /CBT Practice/ }).click()
    await expect(page.getByRole('heading', { name: 'JAMB simulation' })).toBeVisible()
    await expect.poll(() => submitCalls).toBe(1)
    await expect(page.getByText(/Your saved answers have been kept; please retry/)).toBeVisible()
    await page.getByRole('button', { name: 'Submit CBT' }).click()
    await expect(page.getByText('0%', { exact: true })).toBeVisible()
    await expect(page.getByText('0/1 correct')).toBeVisible()
    expect(submitCalls).toBe(2)
  })
})

test.describe('ACE JAMB syllabus publication states', () => {
  test('renders topics from an active approved syllabus', async ({ page }) => {
    await mockSyllabusPublicationState(page, 'approved')
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()
    await expect(page.getByText('Verified comprehension fixture')).toBeVisible()
    await page.getByRole('button', { name: /Learn Approved syllabus topics/ }).click()
    await expect(page.getByRole('heading', { name: 'Learn', exact: true })).toBeVisible()
    await expect(page.getByText('Verified comprehension fixture')).toBeVisible()
    await expect(page.getByText('No approved topics available yet')).toHaveCount(0)
  })

  test('searches approved subtopics and opens scoped practice without fake lessons', async ({ page }) => {
    await mockSyllabusPublicationState(page, 'approved')
    const subtopicId = '80000000-0000-4000-8000-000000000017'
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/subtopics'), async (route) => {
      await route.fulfill({ json: [{ id: subtopicId, topic_id: '70000000-0000-4000-8000-000000000001',
        name: 'Inference', description: 'Draw conclusions from a given passage.', sort_order: 1, active: true }] })
    })
    let starts = 0
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/start_attempt'), async (route) => {
      starts += 1
      await route.fulfill({ status: 400, json: { code: 'P0001', message: 'No published questions available' } })
    })
    await page.goto('/')
    await page.getByRole('button', { name: /Learn Approved syllabus topics/ }).click()
    const search = page.getByRole('searchbox', { name: 'Search approved topics or subtopics' })
    await search.fill('absent-topic-fixture')
    await expect(page.getByText('No topics match your search')).toBeVisible()
    await expect(page.getByText('No approved topics available yet')).toHaveCount(0)
    await page.getByRole('button', { name: 'Clear topic filters' }).click()
    await search.fill('inference')
    await expect(page.getByText('1 approved topic found')).toBeVisible()
    await page.getByRole('button', { name: /Verified comprehension fixture/ }).click()
    await expect(page.getByText(/This approved outline is not a full lesson/)).toBeVisible()
    await page.getByRole('button', { name: 'Inference' }).click()
    await expect(page.getByText('Draw conclusions from a given passage.')).toBeVisible()
    await page.getByRole('button', { name: 'Practise this subtopic' }).click()
    await expect(page).toHaveURL(/[?&]focus=subtopic/)
    await expect(page).toHaveURL(/[?&]subtopic=80000000-0000-4000-8000-000000000017/)
    await expect(page.getByRole('heading', { name: 'No reviewed questions published for this topic yet' })).toBeVisible()
    expect(starts).toBe(0)
  })

  test('quick revision filters approved subtopics and opens scoped practice without inventing notes', async ({ page }) => {
    await mockSyllabusPublicationState(page, 'approved')
    const subtopicId = '80000000-0000-4000-8000-000000000018'
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/subtopics'), async (route) => {
      await route.fulfill({ json: [{ id: subtopicId, topic_id: '70000000-0000-4000-8000-000000000001',
        name: 'Context clues', description: 'Approved outline only.', sort_order: 1, active: true }] })
    })
    await page.goto('/?view=revision')
    const search = page.getByRole('searchbox', { name: 'Search revision outlines' })
    await search.fill('no-matching-syllabus-topic')
    await expect(page.getByText('No revision topics match your search')).toBeVisible()
    await page.getByRole('button', { name: 'Clear revision filters' }).click()
    await search.fill('context clues')
    await expect(page.getByText('1 approved revision topic found')).toBeVisible()
    await page.getByRole('button', { name: /Verified comprehension fixture/ }).click()
    await page.getByRole('button', { name: 'Context clues' }).click()
    await expect(page.getByText('Approved outline only.')).toBeVisible()
    await page.getByRole('button', { name: 'Practise selected revision subtopic' }).click()
    await expect(page).toHaveURL(/[?&]focus=subtopic/)
    await expect(page).toHaveURL(/[?&]subtopic=80000000-0000-4000-8000-000000000018/)
    await expect(page.getByRole('heading', { name: 'No reviewed questions published for this topic yet' })).toBeVisible()
  })

  test('does not expose syllabus topics while rights review is pending', async ({ page }) => {
    const fixture = await mockSyllabusPublicationState(page, 'pending')
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()
    await expect(page.getByText(/Verified learning content is not published yet/)).toBeVisible()
    expect(fixture.topicFetches()).toBe(0)
    await page.getByRole('button', { name: /Learn Approved syllabus topics/ }).click()
    await expect(page.getByText('No approved topics available yet')).toBeVisible()
    await expect(page.getByText('Verified comprehension fixture')).toHaveCount(0)
  })
})


test.describe('ACE JAMB admin operations command center', () => {
  test('admin sees read-only readiness counts without enabling unsupported operations', async ({ page }) => {
    await page.route(`${projectUrl}/**`, async (route) => {
      const url = new URL(route.request().url())
      if (url.pathname === '/auth/v1/user') {
        await route.fulfill({ json: { id: userId, aud: 'authenticated', role: 'authenticated', email: 'admin@example.test', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, created_at: '2026-01-01T00:00:00.000Z' } })
        return
      }
      if (url.pathname.endsWith('/rest/v1/rpc/is_admin')) {
        await route.fulfill({ json: true })
        return
      }
      if (route.request().method() === 'HEAD') {
        await route.fulfill({
          status: 200,
          headers: {
            'content-range': '*/0',
            'access-control-expose-headers': 'content-range, x-total-count',
          },
          body: '',
        })
        return
      }
      await route.fulfill({ status: 200, contentType: 'application/json', json: [] })
    })
    await page.addInitScript(({ uid }) => {
      const projectRef = 'uokiqlgmzprqfbzmedaz'
      localStorage.setItem(`sb-${projectRef}-auth-token`, JSON.stringify({
        access_token: 'test-access-token', refresh_token: 'test-refresh-token', token_type: 'bearer',
        expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: { id: uid, aud: 'authenticated', role: 'authenticated', email: 'admin@example.test', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {} },
      }))
    }, { uid: userId })

    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Operations command center' })).toBeVisible()
    await expect(page.getByRole('status')).toContainText('Operational readiness check finished.')
    await expect(page.locator('section[aria-labelledby="admin-operations-title"]')).toHaveAttribute('aria-busy', 'false')
    // Catalogue ingestion was retired from the active frontend; Batch 3 uses the academic workspace.
    await expect(page.getByRole('heading', { name: 'Admin Catalogue Import' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Single-row review-only staging' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Stage programmes & UTME requirements' })).toHaveCount(0)
    // Wait until asynchronous count queries settle before asserting their dynamic detail text.
    await expect(page.getByRole('button', { name: 'Refresh status' })).toBeEnabled()
    await expect(page.getByText('No delivery worker is currently listed')).toBeVisible()
    await expect(page.getByText('Grounded student AI stays disabled')).toBeVisible()
    await expect(page.getByText(/Audio content has no dedicated table or delivery service/)).toBeVisible()

    // The retired legacy URL must resolve only to the normal admin dashboard, never a catalogue importer.
    await page.goto('/admin-import')
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Admin Catalogue Import' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Stage programmes & UTME requirements' })).toHaveCount(0)
  })
})


test.describe('ACE JAMB administrator question review visibility', () => {
  test('only the verified administrator sees review statuses without publishing actions', async ({ page }) => {
    await mockPreparedStudent(page)
    const reviewedId = '98000000-0000-4000-8000-000000000018'
    let questionReads = 0
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/is_admin'), async (route) => {
      await route.fulfill({ json: true })
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/questions'), async (route) => {
      questionReads += 1
      await route.fulfill({ json: [{ id: reviewedId, question_text: 'Rights review sample', review_status: 'draft', active: false, subject_id: subjects[0].id, topic_id: null }] })
    })
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Question publication review' })).toBeVisible()
    await expect(page.getByText('Rights review sample')).toBeVisible()
    await expect(page.getByText('Inactive record')).toBeVisible()
    await expect(page.getByRole('button', { name: /Publish question/ })).toHaveCount(0)
    expect(questionReads).toBeGreaterThan(0)
  })

  test('non-admin students never request the protected question review queue', async ({ page }) => {
    await mockPreparedStudent(page)
    let questionReads = 0
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/questions'), async (route) => {
      questionReads += 1
      await route.fulfill({ json: [] })
    })
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: 'Admin access required' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Question publication review' })).toHaveCount(0)
    expect(questionReads).toBe(0)
  })
})

test.describe('ACE JAMB admin question review pagination', () => {
  test('navigates server-backed 30-question pages without exposing publish actions', async ({ page }) => {
    await mockPreparedStudent(page)
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/is_admin'), async (route) => {
      await route.fulfill({ json: true })
    })
    const requestedOffsets: number[] = []
    const records = Array.from({ length: 32 }, (_, index) => ({
      id: `98000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
      question_text: `Review item ${index + 1}`,
      review_status: index % 2 === 0 ? 'draft' : 'pending',
      active: false, subject_id: subjects[0].id, topic_id: null,
    }))
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/questions'), async (route) => {
      if (route.request().method() === 'HEAD') return route.fallback()
      const search = new URL(route.request().url()).searchParams
      const projection = search.get('select')
      if (projection !== 'id,question_text:stem,review_status,active,subject_id,topic_id') {
        await route.fulfill({ status: 400, json: { code: '42703', message: 'Invalid question review projection; prompt column is stem' } })
        return
      }
      const offset = Number(search.get('offset') ?? 0)
      const limit = Number(search.get('limit') ?? 30)
      requestedOffsets.push(offset)
      await route.fulfill({ json: records.slice(offset, offset + limit) })
    })
    await page.goto('/admin')
    const review = page.locator('section[aria-labelledby="admin-review-questions-heading"]')
    await expect(review.getByText('Review item 1', { exact: true })).toBeVisible()
    await expect(review.getByText('Review item 30', { exact: true })).toBeVisible()
    await expect(review.getByText('Review item 31', { exact: true })).toHaveCount(0)
    await expect(review.getByText('30 of 30 records on page 1 shown.')).toBeVisible()
    await review.getByLabel('Filter review status').selectOption('draft')
    await expect(review.getByText('15 of 30 records on page 1 shown.')).toBeVisible()
    await review.getByRole('button', { name: 'Next questions' }).click()
    await expect(review.getByText('Review item 31', { exact: true })).toBeVisible()
    await expect(review.getByText('Review item 32', { exact: true })).toBeVisible()
    await expect(review.getByText('2 of 2 records on page 2 shown.')).toBeVisible()
    await expect(review.getByRole('button', { name: 'Next questions' })).toBeDisabled()
    await review.getByRole('button', { name: 'Previous questions' }).click()
    await expect(review.getByText('Review item 1', { exact: true })).toBeVisible()
    await expect(review.getByRole('button', { name: /Publish question/ })).toHaveCount(0)
    // React StrictMode can repeat the initial effect; verify pagination transitions instead of call count.
    expect(requestedOffsets[0]).toBe(0)
    expect(requestedOffsets).toContain(30)
    expect(requestedOffsets.at(-1)).toBe(0)
  })
})

test.describe('ACE JAMB admin operations count recovery', () => {
  test('does not report unavailable counts as zero and recovers on refresh', async ({ page }) => {
    await mockPreparedStudent(page)
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/is_admin'), async (route) => {
      await route.fulfill({ json: true })
    })
    await page.goto('/admin')
    const operations = page.locator('section[aria-labelledby="admin-operations-title"]')
    await expect(operations.getByRole('button', { name: 'Refresh status' })).toBeEnabled()
    let allowRead = false
    let metricReads = 0
    await page.route((url) => new URL(url).pathname.startsWith('/rest/v1/'), async (route) => {
      if (route.request().method() !== 'HEAD') return route.fallback()
      metricReads += 1
      if (!allowRead) {
        await route.fulfill({ status: 400, body: '' })
      } else {
        await route.fulfill({ status: 200, headers: { 'content-range': '*/0', 'access-control-expose-headers': 'content-range' }, body: '' })
      }
    })
    await operations.getByRole('button', { name: 'Refresh status' }).click()
    await expect.poll(() => metricReads).toBeGreaterThan(0)
    await expect(operations.getByRole('alert')).toContainText('Operational counts could not be loaded')
    await expect(operations.getByText('Unavailable', { exact: true })).toHaveCount(9)
    await expect(operations.getByText('Last checked', { exact: false })).toHaveCount(0)
    expect(metricReads).toBeGreaterThan(0)
    allowRead = true
    await operations.getByRole('button', { name: 'Refresh status' }).click()
    await expect(operations.getByRole('alert')).toHaveCount(0)
    await expect(operations.getByText('Unavailable', { exact: true })).toHaveCount(0)
    await expect(operations.getByText(/Last checked/)).toBeVisible()
  })
})

test.describe('ACE JAMB administrator review full text', () => {
  test('offers accessible full-question disclosure without publication actions', async ({ page }) => {
    await mockPreparedStudent(page)
    const fullQuestion = 'Verified question context. '.repeat(20) + 'Important final source detail.'
    let questionProjection = ''
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/is_admin'), async (route) => {
      await route.fulfill({ json: true })
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/questions'), async (route) => {
      if (route.request().method() === 'HEAD') return route.fallback()
      questionProjection = new URL(route.request().url()).searchParams.get('select') ?? ''
      if (questionProjection !== 'id,question_text:stem,review_status,active,subject_id,topic_id') {
        await route.fulfill({ status: 400, json: { code: '42703', message: 'Invalid question review projection; prompt column is stem' } })
        return
      }
      await route.fulfill({ json: [{
        id: '98000000-0000-4000-8000-000000000098',
        question_text: fullQuestion, review_status: 'draft', active: false,
        subject_id: subjects[0].id, topic_id: null,
      }] })
    })
    await page.goto('/admin')
    const review = page.locator('section[aria-labelledby="admin-review-questions-heading"]')
    await expect(review.getByText('Read full question text')).toBeVisible()
    await expect(review.getByText(fullQuestion, { exact: true })).not.toBeVisible()
    await review.getByText('Read full question text').click()
    await expect(review.getByText(fullQuestion, { exact: true })).toBeVisible()
    expect(questionProjection).toBe('id,question_text:stem,review_status,active,subject_id,topic_id')
    await expect(review.getByRole('button', { name: /Publish question/ })).toHaveCount(0)
  })
})

async function mockAcademicReview(page: import('@playwright/test').Page, isAdmin: boolean) {
  await mockFirstTimeStudent(page)
  const seasonId = 'a0000000-0000-4000-8000-000000000010'
  const states = ['pending', 'approved', 'restricted', 'rejected'] as const
  const versions = states.map((rights, index) => ({
    id: `a0000000-0000-4000-8000-00000000002${index}`, season_id: seasonId,
    subject_id: subjects[0].id, version: index + 1, title: `${rights} review fixture`,
    status: 'draft', rights_status: rights, source_title: 'Authorized test fixture',
    source_url: 'https://example.test/syllabus', provenance: {},
  }))
  const writes: Array<{ path: string; payload: Record<string, unknown> }> = []
  await page.route(`${projectUrl}/rest/v1/rpc/is_admin_or_editor`, (route) => route.fulfill({ json: true }))
  await page.route(`${projectUrl}/rest/v1/rpc/is_admin`, (route) => route.fulfill({ json: isAdmin }))
  await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/exam_seasons'), (route) => route.fulfill({ json: [{ id: seasonId, code: 'fixture', name: 'Fixture season', exam_year: 2027, status: 'draft' }] }))
  await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/syllabus_versions'), async (route) => {
    if (route.request().method() !== 'GET') {
      const payload = route.request().postDataJSON()
      writes.push({ path: 'syllabus_versions', payload })
      const selectedId = new URL(route.request().url()).searchParams.get('id')?.replace('eq.', '')
      const version = versions.find((item) => item.id === selectedId)
      if (version && payload.rights_status) version.rights_status = payload.rights_status
      await route.fulfill({ status: 204 })
    } else await route.fulfill({ json: versions })
  })
  await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/topics'), async (route) => {
    if (route.request().method() === 'GET') {
      const selectedId = new URL(route.request().url()).searchParams.get('syllabus_version_id')?.replace('eq.', '')
      await route.fulfill({ json: [{ id: 'b0000000-0000-4000-8000-000000000010', subject_id: subjects[0].id, syllabus_version_id: selectedId, name: 'Existing review topic', active: true, sort_order: 10, description: null }] })
    } else {
      writes.push({ path: 'topics', payload: route.request().postDataJSON() })
      await route.fulfill({ status: 201, json: [] })
    }
  })
  await page.route(`${projectUrl}/rest/v1/rpc/activate_syllabus_version`, async (route) => {
    writes.push({ path: 'activate_syllabus_version', payload: route.request().postDataJSON() })
    await route.fulfill({ json: null })
  })
  return { versions, writes }
}

test.describe('ACE JAMB academic editor access', () => {
  test('editor authors pending drafts but cannot review rights, activate or edit reviewed drafts', async ({ page }) => {
    const { versions, writes } = await mockAcademicReview(page, false)
    await page.goto('/admin-academic')
    await expect(page.getByRole('heading', { name: 'Academic Structure' })).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Rights review', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Activate version' })).toHaveCount(0)
    await page.getByLabel('Topic name', { exact: true }).fill('Source-backed draft topic')
    await page.getByRole('button', { name: 'Add inactive topic' }).click()
    await expect(page.getByRole('status')).toContainText('Topic saved as inactive draft content')
    expect(writes).toEqual([{ path: 'topics', payload: expect.objectContaining({ name: 'Source-backed draft topic', active: false, syllabus_version_id: versions[0].id }) }])
    for (const version of versions.slice(1)) {
      await page.getByLabel('Syllabus version').selectOption(version.id)
      await expect(page.getByText('Existing review topic', { exact: true })).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'Add inactive topic' })).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'Add inactive subtopic' })).toHaveCount(0)
      await expect(page.getByRole('combobox', { name: 'Rights review', exact: true })).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'Activate version' })).toHaveCount(0)
    }
    expect(writes).toHaveLength(1)
  })

  test('administrator can review rights and activate approved draft content', async ({ page }) => {
    const { versions, writes } = await mockAcademicReview(page, true)
    await page.goto('/admin-academic')
    await expect(page.getByRole('combobox', { name: 'Rights review', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Activate version' })).toBeDisabled()
    page.on('dialog', (dialog) => dialog.accept())
    await page.getByRole('combobox', { name: 'Rights review', exact: true }).selectOption('approved')
    await expect(page.getByRole('status')).toContainText('Rights status updated to approved')
    expect(writes[0]).toEqual({ path: 'syllabus_versions', payload: expect.objectContaining({ rights_status: 'approved' }) })
    await page.getByLabel('Syllabus version').selectOption(versions[1].id)
    await expect(page.getByRole('button', { name: 'Activate version' })).toBeEnabled()
    await expect(page.getByRole('button', { name: 'Add inactive topic' })).toBeEnabled()
    await page.getByRole('button', { name: 'Activate version' }).click()
    await expect(page.getByRole('status')).toContainText('Syllabus version activated through the server-side validation function')
    expect(writes[1]).toEqual({ path: 'activate_syllabus_version', payload: { p_syllabus_version_id: versions[1].id } })
    expect(writes).toHaveLength(2)
  })

  test('administrator role lookup failure blocks all tools until a verified retry', async ({ page }) => {
    await mockAcademicReview(page, false)
    let failAdminCheck = true
    await page.route(`${projectUrl}/rest/v1/rpc/is_admin`, async (route) => {
      if (failAdminCheck) await route.fulfill({ status: 400, json: { message: 'private role lookup error' } })
      else await route.fulfill({ json: false })
    })
    await page.goto('/admin-academic')
    await expect(page.getByText('Unable to verify academic editor access. Please try again.')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Academic Structure' })).toHaveCount(0)
    await expect(page.getByText('private role lookup error')).toHaveCount(0)
    failAdminCheck = false
    await page.getByRole('button', { name: 'Retry academic editor verification' }).click()
    await expect(page.getByRole('heading', { name: 'Academic Structure' })).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Rights review', exact: true })).toHaveCount(0)
  })

  test('announces academic workspace loading while the season list resolves', async ({ page }) => {
    await mockFirstTimeStudent(page)
    let releaseSeasonRequest!: () => void
    const seasonRequestGate = new Promise<void>((resolve) => { releaseSeasonRequest = resolve })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/exam_seasons'), async (route) => {
      await seasonRequestGate
      await route.fallback()
    })

    await page.route(`${projectUrl}/rest/v1/rpc/is_admin_or_editor`, async (route) => {
      await route.fulfill({ json: true })
    })
    await page.goto('/admin-academic')
    await expect(page.getByRole('status')).toContainText('Loading academic workspace')
    releaseSeasonRequest()
    await expect(page.getByText('No syllabus versions found')).toBeVisible()
  })

  test('failed academic version read blocks authoring until retry succeeds without leaking errors', async ({ page }) => {
    await mockFirstTimeStudent(page)
    await page.route(`${projectUrl}/rest/v1/rpc/is_admin_or_editor`, async (route) => {
      await route.fulfill({ json: true })
    })
    await page.goto('/admin-academic')
    await expect(page.getByText('No syllabus versions found')).toBeVisible()
    let allowRead = false
    let versionReads = 0
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/syllabus_versions'), async (route) => {
      versionReads += 1
      if (!allowRead) {
        await route.fulfill({ status: 400, contentType: 'application/json', json: {
          code: 'private_database_code', message: 'private database host and rights information',
        } })
      } else {
        await route.fulfill({ json: [] })
      }
    })
    await page.getByRole('button', { name: 'Refresh', exact: true }).click()
    await expect.poll(() => versionReads).toBeGreaterThan(0)
    await expect(page.getByRole('alert')).toContainText('Academic structure could not be loaded')
    await expect(page.getByText('Create a draft syllabus version')).toHaveCount(0)
    await expect(page.getByText(/private database host|private_database_code/)).toHaveCount(0)
    allowRead = true
    await page.getByRole('button', { name: 'Retry loading academic structure' }).click()
    await expect(page.getByText('No syllabus versions found')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Create a draft syllabus version' })).toBeVisible()
    expect(versionReads).toBeGreaterThan(1)
  })

  test('temporary role-check failure can be retried without bypassing denied roles', async ({ page }) => {
    await mockFirstTimeStudent(page)
    let allowRole = false
    let checks = 0
    await page.route(`${projectUrl}/rest/v1/rpc/is_admin_or_editor`, async (route) => {
      checks += 1
      if (!allowRole) {
        await route.fulfill({ status: 503, contentType: 'application/json', json: {
          code: 'temporary_database_error', message: 'private database host',
        } })
      } else {
        await route.fulfill({ json: true })
      }
    })
    await page.goto('/admin-academic')
    await expect(page.getByRole('heading', { name: 'Academic editor access required' })).toBeVisible()
    await expect(page.getByText('private database host')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Academic Structure' })).toHaveCount(0)
    allowRole = true
    await page.getByRole('button', { name: 'Retry academic editor verification' }).click()
    await expect(page.getByRole('heading', { name: 'Academic Structure' })).toBeVisible()
    expect(checks).toBeGreaterThan(1)
  })

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
    await expect(page.getByRole('button', { name: 'Back to ACE JAMB' })).toHaveAttribute('type', 'button')
    await expect(page.getByText('Create a draft syllabus version')).toHaveCount(0)
  })

  test('does not expose raw authorization errors when academic editor verification fails', async ({ page }) => {
    await mockFirstTimeStudent(page)
    await page.route(`${projectUrl}/rest/v1/rpc/is_admin_or_editor`, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        json: { code: 'internal_database_error', message: 'private database host and query details' },
      })
    })
    await page.goto('/admin-academic')
    await expect(page.getByRole('heading', { name: 'Academic editor access required' })).toBeVisible()
    await expect(page.getByText('Unable to verify academic editor access. Please try again.')).toBeVisible()
    await expect(page.getByText(/private database host|internal_database_error/)).toHaveCount(0)
  })
})


test.describe('ACE JAMB academic syllabus-version race safety', () => {
  test('late response for another version cannot replace the selected version tree', async ({ page }) => {
    await mockFirstTimeStudent(page)
    const versionA = 'a0000000-0000-4000-8000-000000000001'
    const versionB = 'a0000000-0000-4000-8000-000000000002'
    const seasonId = 'a0000000-0000-4000-8000-000000000003'
    const subjectId = subjects[0].id
    const versionRow = (id: string, title: string, version: number) => ({
      id, title, version, season_id: seasonId, subject_id: subjectId, status: 'draft',
      rights_status: 'pending', source_title: 'Official syllabus', source_url: 'https://example.test/syllabus',
      provenance: {}, updated_at: '2026-10-27T00:00:00.000Z',
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/syllabus_versions'), async (route) => {
      await route.fulfill({ json: [versionRow(versionA, 'Version A', 1), versionRow(versionB, 'Version B', 2)] })
    })
    let releaseB: () => void = () => undefined
    let finishB: () => void = () => undefined
    const bGate = new Promise<void>((resolve) => { releaseB = resolve })
    const bDone = new Promise<void>((resolve) => { finishB = resolve })
    let bStarted = 0
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/topics'), async (route) => {
      const requested = new URL(route.request().url()).searchParams.get('syllabus_version_id') ?? ''
      const isB = requested.endsWith(versionB)
      if (isB) {
        bStarted += 1
        await bGate
      }
      try {
        await route.fulfill({ json: [{
          id: isB ? 'b0000000-0000-4000-8000-000000000002' : 'b0000000-0000-4000-8000-000000000001',
          subject_id: subjectId, syllabus_version_id: isB ? versionB : versionA,
          name: isB ? 'Topic from B' : 'Topic from A', description: null, sort_order: 10, active: false,
        }] })
      } finally {
        if (isB) finishB()
      }
    })
    await page.route(`${projectUrl}/rest/v1/rpc/is_admin_or_editor`, async (route) => {
      await route.fulfill({ json: true })
    })
    await page.goto('/admin-academic')
    await expect(page.getByRole('button', { name: /^Topic from A/ })).toBeVisible()
    const selector = page.getByLabel('Syllabus version')
    await selector.selectOption(versionB)
    await expect.poll(() => bStarted).toBe(1)
    await expect(page.getByText('Loading selected syllabus topics…')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add inactive topic' })).toBeDisabled()
    await expect(page.getByRole('button', { name: /^Topic from A/ })).toHaveCount(0)
    await selector.selectOption(versionA)
    await expect(page.getByRole('button', { name: /^Topic from A/ })).toBeVisible()
    releaseB()
    await bDone
    await expect(page.getByRole('button', { name: /^Topic from A/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Topic from B/ })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Add inactive topic' })).toBeEnabled()
  })
})

test.describe('ACE JAMB preparation workspaces', () => {
  test('student tools navigate and show honest empty states without inventing content', async ({ page }) => {
    await mockPreparedStudent(page)
    await page.goto('/')

    await page.getByRole('button', { name: /Learn Approved syllabus topics/ }).click()
    await expect(page).toHaveURL(/[?&]view=learn(?:&|$)/)
    await expect(page.getByRole('heading', { name: 'Learn', exact: true })).toBeVisible()

    const skipLink = page.getByRole('link', { name: 'Skip to workspace content' })
    await skipLink.focus()
    await expect(skipLink).toBeVisible()
    await skipLink.press('Enter')
    await expect(page.locator('#workspace-content')).toBeFocused()

    await expect(page.getByText('No approved topics available yet')).toBeVisible()

    // Workspace selection is route state: reload and browser history must restore it.
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Learn', exact: true })).toBeVisible()
    // Native skip-link fragment navigation adds a same-route history entry.
    // Back first removes that fragment, then returns to the dashboard.
    await page.goBack()
    await expect(page.getByRole('heading', { name: 'Learn', exact: true })).toBeVisible()
    await page.goBack()
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()
    await page.goForward()
    await expect(page.getByRole('heading', { name: 'Learn', exact: true })).toBeVisible()
    await page.goForward()
    await expect(page.getByRole('heading', { name: 'Learn', exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'Practice', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Practice', exact: true })).toBeVisible()
    await expect(page.getByText('Practice sessions require reviewed questions with verified answers.')).toBeVisible()

    await page.getByRole('button', { name: 'Quick revision', exact: true }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Quick revision', exact: true })).toBeVisible()
    await expect(page.getByText('No published revision topics yet')).toBeVisible()

    await page.getByRole('button', { name: 'Flashcards', exact: true }).click()
    await expect(page.getByText('No approved flashcards are available for your selected subjects yet.')).toBeVisible()

    await page.getByRole('button', { name: 'Progress', exact: true }).click()
    await expect(page.getByText('Verified performance')).toBeVisible()
    await expect(page.getByText('Not available yet')).toBeVisible()

    await page.getByRole('button', { name: /Study plan/ }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Study plan', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Build your study routine' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Your next two weeks — suggested routine' })).toBeVisible()
    await expect(page.getByText('Select a study day, valid daily study time and preparation subjects to preview a routine.')).toBeVisible()
    await page.getByLabel('Daily study time').fill('90')
    await page.getByLabel('Tue', { exact: true }).check()
    await expect(page.getByText('90 min').first()).toBeVisible()
    await page.getByRole('button', { name: 'Save study preferences' }).click()
    await expect(page.getByRole('status')).toContainText('saved to your account')

    await page.getByRole('button', { name: 'Dashboard', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()
  })

  test('mistake review uses only saved student stats and passes IDs to the published-question RPC', async ({ page }) => {
    await mockPreparedStudent(page)
    const missedQuestionId = '90000000-0000-4000-8000-000000000001'
    const repeatedQuestionId = '90000000-0000-4000-8000-000000000002'
    let requestBody: Record<string, unknown> | null = null
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/student_question_stats'), async (route) => {
      await route.fulfill({ json: [
        { question_id: missedQuestionId, attempts: 3, correct_count: 1, incorrect_count: 2, last_answered_at: '2026-10-25T12:00:00Z' },
        { question_id: repeatedQuestionId, attempts: 1, correct_count: 0, incorrect_count: 1, last_answered_at: '2026-10-24T12:00:00Z' },
      ] })
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/start_attempt'), async (route) => {
      requestBody = route.request().postDataJSON()
      await route.fulfill({ status: 400, contentType: 'application/json', json: {
        code: 'P0001', message: 'No published questions available for this attempt',
      } })
    })

    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()
    await page.getByRole('button', { name: /Quick revision/ }).click()
    await expect(page.getByText('Missed repeatedly')).toBeVisible()
    await expect(page.getByText('No published revision topics yet')).toBeVisible()
    await page.getByRole('button', { name: 'Practise missed questions' }).click()
    await expect(page).toHaveURL(/[?&]cbt=1/)
    await expect(page).toHaveURL(/[?&]focus=mistakes/)
    await expect.poll(() => requestBody).not.toBeNull()
    expect(requestBody).toMatchObject({
      p_mode: 'practice', p_question_count: 2,
      p_question_ids: [missedQuestionId, repeatedQuestionId],
    })
    await expect(page.getByText('No reviewed questions are published for this session yet.', { exact: false })).toBeVisible()
  })

  test('a new student cannot start targeted practice without any saved mistakes', async ({ page }) => {
    await mockPreparedStudent(page)
    let startCount = 0
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/start_attempt'), async (route) => {
      startCount += 1
      await route.fulfill({ status: 400, json: { message: 'No published questions available' } })
    })
    await page.goto('/?cbt=1&mode=practice&focus=mistakes')
    await expect(page.getByRole('heading', { name: 'No mistakes to practise yet' })).toBeVisible()
    expect(startCount).toBe(0)
  })

  test('progress compares only saved completed sessions and does not invent readiness', async ({ page }) => {
    await mockPreparedStudent(page)
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/attempts'), async (route) => {
      await route.fulfill({ json: [
        { id: '93000000-0000-4000-8000-000000000001', mode: 'practice', status: 'completed', started_at: '2026-10-25T09:00:00Z', completed_at: '2026-10-25T10:00:00Z', score: 80, correct_count: 8, answered_count: 10, subject_id: subjects[0].id },
        { id: '93000000-0000-4000-8000-000000000002', mode: 'cbt', status: 'completed', started_at: '2026-10-24T09:00:00Z', completed_at: '2026-10-24T10:00:00Z', score: 40, correct_count: 4, answered_count: 10, subject_id: subjects[0].id },
        { id: '93000000-0000-4000-8000-000000000003', mode: 'cbt', status: 'active', started_at: '2026-10-26T09:00:00Z', completed_at: null, score: null, correct_count: 9, answered_count: 10, subject_id: subjects[0].id },
      ] })
    })
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()
    await page.getByRole('button', { name: 'My progress', exact: false }).click()
    await expect(page.getByText('80% correct')).toHaveCount(0)
    await expect(page.getByText('60% correct')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Recent session accuracy' })).toBeVisible()
    await expect(page.getByText('+40 percentage points compared with your previous session.')).toBeVisible()
    await expect(page.getByText('predicted JAMB score', { exact: false })).toBeVisible()
  })

  test('performance-based subject practice requests only the observed subject', async ({ page }) => {
    await mockPreparedStudent(page)
    let payload: Record<string, unknown> | null = null
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/attempts'), async (route) => {
      await route.fulfill({ json: [
        { id: '97000000-0000-4000-8000-000000000001', mode: 'practice', status: 'completed', started_at: '2026-10-24T10:00:00Z', completed_at: '2026-10-24T10:30:00Z', score: 30, correct_count: 3, answered_count: 10, subject_id: subjects[0].id },
        { id: '97000000-0000-4000-8000-000000000002', mode: 'practice', status: 'completed', started_at: '2026-10-24T10:00:00Z', completed_at: '2026-10-24T10:30:00Z', score: 80, correct_count: 8, answered_count: 10, subject_id: subjects[1].id },
      ] })
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/start_attempt'), async (route) => {
      payload = route.request().postDataJSON()
      await route.fulfill({ status: 400, contentType: 'application/json', json: { code: 'P0001', message: 'No published questions available for this attempt' } })
    })
    await page.goto('/?view=progress')
    await expect(page.getByRole('heading', { name: 'Practice your observed lower-accuracy subject' })).toBeVisible()
    await page.getByRole('button', { name: 'Practise Use of English' }).click()
    await expect.poll(() => payload).not.toBeNull()
    expect(payload).toMatchObject({ p_mode: 'practice', p_subject_id: subjects[0].id })
    await expect(page).toHaveURL(/[?&]focus=subject/)
  })

  test('study plan suggests a subject only from real saved subject-tagged attempts', async ({ page }) => {
    await mockPreparedStudent(page)
    let ownerScoped = false
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/attempts'), async (route) => {
      ownerScoped = new URL(route.request().url()).searchParams.get('user_id') === 'eq.' + userId
      await route.fulfill({ json: [
        { id: '94000000-0000-4000-8000-000000000001', mode: 'practice', status: 'completed', started_at: '2026-10-24T09:00:00Z', completed_at: '2026-10-24T10:00:00Z', score: 30, correct_count: 3, answered_count: 10, subject_id: subjects[0].id },
        { id: '94000000-0000-4000-8000-000000000002', mode: 'practice', status: 'completed', started_at: '2026-10-24T09:00:00Z', completed_at: '2026-10-24T10:00:00Z', score: 80, correct_count: 8, answered_count: 10, subject_id: subjects[1].id },
      ] })
    })
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()
    await page.getByRole('button', { name: /Study plan/ }).click()
    const panel = page.locator('section[aria-labelledby="study-focus-heading"]')
    await expect(panel).toContainText('Use of English')
    await expect(panel).toContainText('30% correct across 10 saved')
    expect(ownerScoped).toBe(true)
    await expect(panel).toContainText('does not predict your JAMB score')
  })

  test('speed practice sends an authoritative ten-question ten-minute configuration', async ({ page }) => {
    await mockPreparedStudent(page)
    let request: Record<string, unknown> | null = null
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/start_attempt'), async (route) => {
      request = route.request().postDataJSON()
      await route.fulfill({ status: 400, contentType: 'application/json', json: { code: 'P0001', message: 'No published questions available for this attempt' } })
    })
    await page.goto('/?view=practice')
    await expect(page.getByRole('heading', { level: 1, name: 'Practice', exact: true })).toBeVisible()
    await page.getByRole('button', { name: /Start speed practice/ }).click()
    await expect(page).toHaveURL(/[?&]focus=speed/)
    await expect.poll(() => request).not.toBeNull()
    expect(request).toMatchObject({ p_mode: 'practice', p_question_count: 10, p_duration_seconds: 600, p_question_ids: null })
    await expect(page.getByText('No reviewed questions are published for this session yet.', { exact: false })).toBeVisible()
  })

  test('subject practice passes the chosen saved subject to the published-question RPC', async ({ page }) => {
    await mockPreparedStudent(page)
    let started: Record<string, unknown> | null = null
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/start_attempt'), async (route) => {
      started = route.request().postDataJSON()
      await route.fulfill({ status: 400, contentType: 'application/json', json: { code: 'P0001', message: 'No published questions available for this attempt' } })
    })
    await page.goto('/?view=practice')
    await expect(page.getByRole('heading', { level: 1, name: 'Practice', exact: true })).toBeVisible()
    await page.getByLabel('Practice subject').selectOption(subjects[2].id)
    await page.getByRole('button', { name: 'Start subject practice' }).click()
    await expect(page).toHaveURL(/[?&]focus=subject/)
    await expect(page).toHaveURL(new RegExp('subject=' + subjects[2].id))
    await expect.poll(() => started).not.toBeNull()
    expect(started).toMatchObject({ p_mode: 'practice', p_subject_id: subjects[2].id, p_question_count: 20 })
    await expect(page.getByText('No reviewed questions are published for this session yet.', { exact: false })).toBeVisible()
  })

  test('repeated mistake practice excludes questions missed only once', async ({ page }) => {
    await mockPreparedStudent(page)
    const repeatedId = '96000000-0000-4000-8000-000000000001'
    const onceId = '96000000-0000-4000-8000-000000000002'
    let startPayload: Record<string, unknown> | null = null
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/student_question_stats'), async (route) => {
      await route.fulfill({ json: [
        { question_id: repeatedId, attempts: 3, correct_count: 1, incorrect_count: 2, last_answered_at: '2026-10-25T12:00:00Z' },
        { question_id: onceId, attempts: 1, correct_count: 0, incorrect_count: 1, last_answered_at: '2026-10-24T12:00:00Z' },
      ] })
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/start_attempt'), async (route) => {
      startPayload = route.request().postDataJSON()
      await route.fulfill({ status: 400, contentType: 'application/json', json: { code: 'P0001', message: 'No published questions available for this attempt' } })
    })
    await page.goto('/?view=revision')
    await expect(page.getByRole('heading', { level: 1, name: 'Quick revision', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Practise repeated mistakes' }).click()
    await expect(page).toHaveURL(/[?&]focus=repeated/)
    await expect.poll(() => startPayload).not.toBeNull()
    expect(startPayload).toMatchObject({ p_mode: 'practice', p_question_ids: [repeatedId], p_question_count: 1 })
    await expect(page.getByText('No reviewed questions are published for this session yet.', { exact: false })).toBeVisible()
  })

  test('topic practice only requests reviewed question IDs for the approved topic', async ({ page }) => {
    await mockSyllabusPublicationState(page, 'approved')
    const topicId = '70000000-0000-4000-8000-000000000001'
    const questionId = '98000000-0000-4000-8000-000000000001'
    let questionQuery = ''
    let payload: Record<string, unknown> | null = null
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/questions'), async (route) => {
      questionQuery = new URL(route.request().url()).search
      await route.fulfill({ json: [{ id: questionId }] })
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/start_attempt'), async (route) => {
      payload = route.request().postDataJSON()
      await route.fulfill({ status: 400, contentType: 'application/json', json: { code: 'P0001', message: 'No published questions available for this attempt' } })
    })

    await page.goto('/?view=practice')
    await expect(page.getByRole('heading', { level: 1, name: 'Practice', exact: true })).toBeVisible()
    await page.getByLabel('Practice topic').selectOption(topicId)
    await page.getByRole('button', { name: 'Start topic practice' }).click()
    await expect(page).toHaveURL(/[?&]focus=topic/)
    await expect(page).toHaveURL(new RegExp('topic=' + topicId))
    await expect.poll(() => payload).not.toBeNull()
    const params = new URLSearchParams(questionQuery)
    expect(params.get('subject_id')).toBe('eq.' + subjects[0].id)
    expect(params.get('topic_id')).toBe('eq.' + topicId)
    expect(params.get('active')).toBe('eq.true')
    expect(params.get('review_status')).toBe('eq.published')
    expect(payload).toMatchObject({
      p_mode: 'practice', p_subject_id: subjects[0].id,
      p_question_count: 1, p_question_ids: [questionId],
    })
    await expect(page.getByText('No reviewed questions are published for this session yet.', { exact: false })).toBeVisible()
  })

  test('subtopic practice does not substitute random questions when no reviewed questions exist', async ({ page }) => {
    await mockSyllabusPublicationState(page, 'approved')
    const topicId = '70000000-0000-4000-8000-000000000001'
    const subtopicId = '79000000-0000-4000-8000-000000000001'
    let questionQuery = ''
    let attemptsStarted = 0
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/subtopics'), async (route) => {
      await route.fulfill({ json: [{
        id: subtopicId, topic_id: topicId,
        syllabus_version_id: '60000000-0000-4000-8000-000000000001',
        name: 'Reading details', description: 'Test-only', sort_order: 1, active: true,
      }] })
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/questions'), async (route) => {
      questionQuery = new URL(route.request().url()).search
      await route.fulfill({ json: [] })
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/start_attempt'), async (route) => {
      attemptsStarted += 1
      await route.fulfill({ json: {} })
    })

    await page.goto('/?view=practice')
    await expect(page.getByRole('heading', { level: 1, name: 'Practice', exact: true })).toBeVisible()
    await page.getByLabel('Practice topic').selectOption(topicId)
    await page.getByLabel('Practice subtopic').selectOption(subtopicId)
    await page.getByRole('button', { name: 'Start subtopic practice' }).click()
    await expect(page).toHaveURL(/[?&]focus=subtopic/)
    await expect(page.getByRole('heading', { name: 'No reviewed questions published for this topic yet' })).toBeVisible()
    expect(attemptsStarted).toBe(0)
    const params = new URLSearchParams(questionQuery)
    expect(params.get('topic_id')).toBe('eq.' + topicId)
    expect(params.get('subtopic_id')).toBe('eq.' + subtopicId)
  })

  test('approved topic insight uses saved question history and starts topic-specific practice', async ({ page }) => {
    await mockSyllabusPublicationState(page, 'approved')
    const topicId = '70000000-0000-4000-8000-000000000001'
    const questionId = '99000000-0000-4000-8000-000000000001'
    let statsScoped = false
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/student_question_stats'), async (route) => {
      statsScoped = new URL(route.request().url()).searchParams.get('user_id') === 'eq.' + userId
      await route.fulfill({ json: [
        { question_id: questionId, attempts: 10, correct_count: 3, incorrect_count: 7, last_answered_at: '2026-10-26T08:00:00Z' },
      ] })
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/questions'), async (route) => {
      const url = new URL(route.request().url())
      await route.fulfill({ json: url.searchParams.has('topic_id') ? [] : [{ id: questionId, subject_id: subjects[0].id, topic_id: topicId }] })
    })
    await page.goto('/?view=progress')
    await expect(page.getByRole('heading', { name: 'Observed topic review priorities' })).toBeVisible()
    await expect(page.getByText('30% correct across 10 saved answers on 1 tracked question.')).toBeVisible()
    expect(statsScoped).toBe(true)
    await page.getByRole('button', { name: 'Practise Verified comprehension fixture' }).click()
    await expect(page).toHaveURL(/[?&]focus=topic/)
    await expect(page).toHaveURL(new RegExp('topic=' + topicId))
    await expect(page.getByRole('heading', { name: 'No reviewed questions published for this topic yet' })).toBeVisible()
  })

  test('approved subtopic insight is backed by saved answers and routes only to matching practice', async ({ page }) => {
    await mockSyllabusPublicationState(page, 'approved')
    const topic = '70000000-0000-4000-8000-000000000001'
    const subtopic = '79000000-0000-4000-8000-000000000001'
    const question = '99000000-0000-4000-8000-000000000021'
    let requestedSubtopic = ''
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/subtopics'), async (route) => {
      await route.fulfill({ json: [{
        id: subtopic, topic_id: topic, syllabus_version_id: '60000000-0000-4000-8000-000000000001',
        name: 'Reading details', description: 'Test-only approved subtopic', sort_order: 1, active: true,
      }] })
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/student_question_stats'), async (route) => {
      await route.fulfill({ json: [{
        question_id: question, attempts: 10, correct_count: 3, incorrect_count: 7, last_answered_at: '2026-10-27T00:00:00Z',
      }] })
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/questions'), async (route) => {
      const params = new URL(route.request().url()).searchParams
      if (params.has('subtopic_id')) {
        requestedSubtopic = params.get('subtopic_id') ?? ''
        await route.fulfill({ json: [] })
        return
      }
      await route.fulfill({ json: [{ id: question, subject_id: subjects[0].id, topic_id: topic, subtopic_id: subtopic }] })
    })
    await page.goto('/?view=progress')
    await expect(page.getByRole('heading', { name: 'Observed subtopic review priorities' })).toBeVisible()
    await expect(page.getByText('30% correct across 10 recorded answers on 1 tracked question.')).toBeVisible()
    await page.getByRole('button', { name: 'Practise Reading details' }).click()
    await expect(page).toHaveURL(/[?&]focus=subtopic/)
    await expect(page).toHaveURL(new RegExp('subtopic=' + subtopic))
    await expect(page.getByRole('heading', { name: 'No reviewed questions published for this topic yet' })).toBeVisible()
    expect(requestedSubtopic).toBe('eq.' + subtopic)
  })

  test('study plan recommends only a qualifying approved subtopic and links to focused practice', async ({ page }) => {
    await mockSyllabusPublicationState(page, 'approved')
    const topic = '70000000-0000-4000-8000-000000000001'
    const subtopic = '79000000-0000-4000-8000-000000000001'
    const question = '99000000-0000-4000-8000-000000000031'
    let filtered = false
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/subtopics'), async (route) => {
      await route.fulfill({ json: [{
        id: subtopic, topic_id: topic, syllabus_version_id: '60000000-0000-4000-8000-000000000001',
        name: 'Reading details', description: 'Test-only approved subtopic', sort_order: 1, active: true,
      }] })
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/student_question_stats'), async (route) => {
      await route.fulfill({ json: [{
        question_id: question, attempts: 10, correct_count: 2, incorrect_count: 8, last_answered_at: '2026-10-27T00:00:00Z',
      }] })
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/questions'), async (route) => {
      const params = new URL(route.request().url()).searchParams
      if (params.has('subtopic_id')) {
        filtered = params.get('subtopic_id') === 'eq.' + subtopic
        await route.fulfill({ json: [] })
        return
      }
      await route.fulfill({ json: [{ id: question, subject_id: subjects[0].id, topic_id: topic, subtopic_id: subtopic }] })
    })
    await page.goto('/?view=plan')
    await expect(page.getByRole('heading', { name: 'Build your study routine' })).toBeVisible()
    await expect(page.getByText('Suggested approved subtopic to revisit')).toBeVisible()
    await expect(page.getByText('20% correct across 10 recorded answers.')).toBeVisible()
    await page.getByRole('button', { name: 'Practise suggested subtopic' }).click()
    await expect(page).toHaveURL(/[?&]focus=subtopic/)
    await expect(page.getByRole('heading', { name: 'No reviewed questions published for this topic yet' })).toBeVisible()
    expect(filtered).toBe(true)
  })

  test('flashcard review reveals verified content and persists a self-scoped review', async ({ page }) => {
    await mockPreparedStudent(page)
    let savedReview: Record<string, unknown> | null = null
    const cardId = '50000000-0000-4000-8000-000000000001'

    await page.route((requestUrl) => new URL(requestUrl).pathname.endsWith('/rest/v1/flashcards'), async (route) => {
      const url = new URL(route.request().url())
      const subjectFilter = url.searchParams.get('subject_id') ?? ''
      if (subjectFilter.startsWith('in.')) {
        await route.fulfill({ json: [{
          id: cardId,
          subject_id: subjects[0].id,
          topic_id: null,
          subtopic_id: null,
          front: 'What does a flashcard review test?',
          back: 'Recall of a reviewed learning fact.',
          source_type: 'platform',
          source_metadata: { review_status: 'approved' },
          content_version: 1,
          created_at: '2026-01-01T00:00:00.000Z',
        }] })
      } else {
        await route.fulfill({ json: [] })
      }
    })
    await page.route((requestUrl) => new URL(requestUrl).pathname.endsWith('/rest/v1/flashcard_reviews'), async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ json: [] })
        return
      }
      savedReview = route.request().postDataJSON() as Record<string, unknown>
      await route.fulfill({ status: 201, contentType: 'application/json', json: savedReview })
    })

    await page.goto('/?view=flashcards')
    await expect(page.getByRole('heading', { level: 1, name: 'Flashcards', exact: true })).toBeVisible()
    await expect(page.getByText('What does a flashcard review test?')).toBeVisible()
    await page.getByRole('button', { name: 'Show answer' }).click()
    await expect(page.getByText('Recall of a reviewed learning fact.')).toBeVisible()
    await page.getByRole('button', { name: 'I knew it' }).click()
    await expect(page.getByRole('status')).toContainText('Review saved')
    await expect(page.getByRole('heading', { name: 'Deck complete' })).toBeVisible()
    await expect.poll(() => savedReview).not.toBeNull()
    expect(savedReview?.user_id).toBe(userId)
    expect(savedReview?.flashcard_id).toBe(cardId)
    expect(savedReview?.review_count).toBe(1)
    expect(savedReview?.correct_count).toBe(1)
  })

  test('flashcards prioritize due cards, show syllabus mapping and saved review history', async ({ page }) => {
    await mockSyllabusPublicationState(page, 'approved')
    const topicId = '70000000-0000-4000-8000-000000000001'
    const dueCardId = '50000000-0000-4000-8000-000000000011'
    const scheduledCardId = '50000000-0000-4000-8000-000000000012'
    const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/flashcards'), async (route) => {
      const url = new URL(route.request().url())
      if ((url.searchParams.get('subject_id') ?? '').startsWith('in.')) {
        await route.fulfill({ json: [
          { id: scheduledCardId, subject_id: subjects[0].id, topic_id: null, subtopic_id: null, front: 'Scheduled card prompt', back: 'Scheduled card answer', source_type: 'platform', source_metadata: { review_status: 'approved' }, content_version: 1, created_at: '2026-01-02T00:00:00.000Z' },
          { id: dueCardId, subject_id: subjects[0].id, topic_id: topicId, subtopic_id: null, front: 'Due card prompt', back: 'Due card answer', source_type: 'platform', source_metadata: { review_status: 'approved' }, content_version: 1, created_at: '2026-01-01T00:00:00.000Z' },
        ] })
      } else {
        await route.fulfill({ json: [] })
      }
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/flashcard_reviews'), async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ json: [{
          user_id: userId, flashcard_id: scheduledCardId, review_count: 2, correct_count: 1,
          last_reviewed_at: new Date().toISOString(), next_review_at: futureDate, ease: 2.5, interval_days: 10,
        }] })
        return
      }
      await route.fulfill({ status: 201, contentType: 'application/json', json: route.request().postDataJSON() })
    })

    await page.goto('/?view=flashcards')
    await expect(page.getByText('Due card prompt')).toBeVisible()
    await expect(page.getByText(/Verified comprehension fixture/)).toBeVisible()
    await expect(page.getByText('Due for review')).toBeVisible()
    await page.getByRole('button', { name: 'Show answer' }).click()
    await page.getByRole('button', { name: 'Needs more practice' }).click()
    await expect(page.getByText('Scheduled card prompt')).toBeVisible()
    await expect(page.getByText('Scheduled for later')).toBeVisible()
    await expect(page.getByText('Reviewed 2 times · 1 recalled')).toBeVisible()
    await expect(page.getByRole('progressbar', { name: 'Flashcard deck progress' })).toHaveAttribute('aria-valuenow', '2')
  })

  test('flashcards show a recoverable error and retry to an honest empty state', async ({ page }) => {
    await mockPreparedStudent(page)
    let allowFlashcardSuccess = true
    let flashcardRequests = 0
    let failedFlashcardRequests = 0
    await page.route((requestUrl) => new URL(requestUrl).pathname.endsWith('/rest/v1/flashcards'), async (route) => {
      flashcardRequests += 1
      if (!allowFlashcardSuccess) {
        failedFlashcardRequests += 1
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          json: { code: 'flashcards_unavailable', details: '', hint: '', message: 'private database host should not be shown' },
        })
        return
      }
      await route.fulfill({ json: [] })
    })

    // First load a stable empty deck. Then force a failure on the explicit Refresh
    // action so startup/profile hydration cannot race the error-state assertion.
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()
    await page.getByRole('button', { name: /Learn Approved syllabus topics/ }).click()
    await expect(page.getByRole('heading', { name: 'Learn', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Flashcards', exact: true }).click()
    await expect(page.getByText('No approved flashcards are available for your selected subjects yet.')).toBeVisible()
    await expect.poll(() => flashcardRequests).toBeGreaterThan(0)

    allowFlashcardSuccess = false
    await page.getByRole('button', { name: 'Refresh deck' }).click()
    await expect.poll(() => failedFlashcardRequests).toBeGreaterThan(0)
    await expect(page.getByRole('alert')).toContainText('We could not load your flashcards.')
    await expect(page.getByText(/private database host/)).toHaveCount(0)

    allowFlashcardSuccess = true
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(page.getByText('No approved flashcards are available for your selected subjects yet.')).toBeVisible()
  })
})






test.describe('ACE JAMB account settings', () => {
  test('loads and saves preparation profile fields through existing account services', async ({ page }) => {
    await mockPreparedStudent(page)
    let profilePayload: Record<string, unknown> | null = null
    let preferencesPayload: Record<string, unknown> | null = null
    await page.route((url) => {
      const path = new URL(url).pathname
      return path.endsWith('/rest/v1/profiles') || path.endsWith('/rest/v1/student_preferences')
    }, async (route) => {
      const path = new URL(route.request().url()).pathname
      if (path.endsWith('/rest/v1/profiles') && route.request().method() === 'PATCH') {
        profilePayload = route.request().postDataJSON()
        await route.fulfill({ status: 200, contentType: 'application/json', json: { id: userId, email: 'student@example.test', display_name: 'Updated Futarian', target_score: 320, institution: 'Test University', course: 'Computer Science', institution_id: null, program_id: null, prep_time_minutes: null, exam_season: null, created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-02T00:00:00.000Z' } })
        return
      }
      if (path.endsWith('/rest/v1/student_preferences') && route.request().method() === 'POST') {
        preferencesPayload = route.request().postDataJSON()
        await route.fulfill({ status: 200, contentType: 'application/json', json: { user_id: userId, learning_style: null, daily_minutes: 90, preferred_study_days: [], timezone: null, preferences: {}, updated_at: '2026-01-02T00:00:00.000Z' } })
        return
      }
      await route.fallback()
    })

    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()
    await page.getByRole('button', { name: 'Edit settings' }).click()
    await expect(page.getByLabel('Display name')).toHaveValue('Test Futarian')
    await page.getByLabel('Display name').fill('Updated Futarian')
    await page.getByLabel('Target JAMB score').fill('320')
    await page.getByLabel('Intended institution (optional)').fill('Test University')
    await page.getByLabel('Intended course (optional)').fill('Computer Science')
    await page.getByLabel('Daily study time (minutes)').fill('90')
    await page.getByRole('button', { name: 'Save account settings' }).click()
    await expect(page.getByText('Your account settings were saved.', { exact: true })).toBeVisible()
    expect(profilePayload).toMatchObject({ display_name: 'Updated Futarian', target_score: 320, institution: 'Test University', course: 'Computer Science' })
    expect(preferencesPayload).toMatchObject({ user_id: userId, daily_minutes: 90 })
  })
})


test.describe('ACE JAMB learning support availability', () => {
  test('does not expose an ungrounded tutor or unpublished audio as usable features', async ({ page }) => {
    await mockPreparedStudent(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Learning support' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Grounded AI tutor' })).toBeVisible()
    await expect(page.getByText('Not enabled for students')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Audio learning' })).toBeVisible()
    await expect(page.getByText('No published audio lessons')).toBeVisible()
  })
})


test.describe('ACE JAMB account access surfaces', () => {
  test('shows payment and referral empty states without implying checkout or rewards work', async ({ page }) => {
    await mockPreparedStudent(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()
    await expect(page.locator('#account-access-title')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Checkout unavailable' })).toBeDisabled()
    await expect(page.getByText('No active ACE Pass entitlement found.')).toBeVisible()
    await expect(page.getByText('A referral code has not been issued to your account yet.')).toBeVisible()
    await expect(page.getByText('Recent referrals (up to 100)')).toBeVisible()
    await expect(page.getByText('Qualified in recent 100')).toBeVisible()
    await expect(page.getByText(/No active referral campaign is configured/)).toBeVisible()
  })
})


test.describe('ACE JAMB access recovery', () => {
  test('failed product reads do not impersonate empty payment or referral histories', async ({ page }) => {
    await mockPreparedStudent(page)
    let allow = false
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/products'), async (route) => {
      if (!allow) {
        await route.fulfill({ status: 400, contentType: 'application/json', json: { code: 'error', message: 'private provider details' } })
        return
      }
      await route.fulfill({ json: [] })
    })
    await page.goto('/')
    await expect(page.getByRole('alert')).toContainText('We could not load your ACE Pass and referral details')
    await expect(page.getByText('A referral code has not been issued to your account yet.')).toHaveCount(0)
    await expect(page.getByText('No active ACE Pass entitlement found.')).toHaveCount(0)
    await expect(page.getByText('private provider details')).toHaveCount(0)
    allow = true
    await page.getByRole('button', { name: 'Retry access details' }).click()
    await expect(page.getByText('No active ACE Pass entitlement found.')).toBeVisible()
    await expect(page.getByText('A referral code has not been issued to your account yet.')).toBeVisible()
  })
})

test.describe('ACE JAMB notification inbox', () => {
  test('shows an honest empty inbox and saves account-scoped preferences', async ({ page }) => {
    await mockPreparedStudent(page)
    let savedPreferences: Record<string, unknown> | null = null
    await page.route((url) => {
      const path = new URL(url).pathname
      return path.endsWith('/rest/v1/notifications') || path.endsWith('/rest/v1/notification_preferences')
    }, async (route) => {
      const path = new URL(route.request().url()).pathname
      if (path.endsWith('/rest/v1/notification_preferences') && route.request().method() === 'POST') {
        savedPreferences = route.request().postDataJSON()
        await route.fulfill({ status: 204, body: '' })
        return
      }
      await route.fulfill({ status: 200, contentType: 'application/json', json: [] })
    })

    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Notifications', exact: true })).toBeVisible()
    await expect(page.getByText('No sent notifications are available for your account yet.')).toBeVisible()
    await page.getByRole('button', { name: 'Preferences' }).click()
    await expect(page.getByRole('heading', { name: 'Notification preferences' })).toBeVisible()
    await expect(page.getByRole('checkbox', { name: 'Push notifications unavailable' })).toBeDisabled()
    await page.getByRole('checkbox', { name: /Product announcements/ }).check()
    await page.getByRole('button', { name: 'Save preferences' }).click()
    await expect(page.getByText('Your notification preferences were saved.', { exact: true })).toBeVisible()
    await expect.poll(() => savedPreferences).not.toBeNull()
    expect(savedPreferences).toMatchObject({ user_id: userId, marketing: true, in_app: true, email: true })
  })
})


test.describe('ACE JAMB notification recovery and ownership', () => {
  test('failed inbox reads do not report an empty inbox and can be retried', async ({ page }) => {
    await mockPreparedStudent(page)
    let allowSuccess = false
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/notifications'), async (route) => {
      if (!allowSuccess) {
        await route.fulfill({ status: 400, contentType: 'application/json', json: { code: 'unavailable', message: 'private database details' } })
        return
      }
      await route.fulfill({ json: [] })
    })
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Notifications', exact: true })).toBeVisible()
    await expect(page.getByRole('alert')).toContainText('We could not load your notifications')
    await expect(page.getByText('No sent notifications are available for your account yet.')).toHaveCount(0)
    await expect(page.getByText('private database details')).toHaveCount(0)
    allowSuccess = true
    await page.getByRole('button', { name: 'Retry notifications' }).click()
    await expect(page.getByText('No sent notifications are available for your account yet.')).toBeVisible()
  })

  test('failed preference read prevents default overwrite until retry restores saved settings', async ({ page }) => {
    await mockPreparedStudent(page)
    // Finish core student onboarding and the first inbox load before injecting
    // a preference-only failure. Otherwise unrelated startup calls can mask
    // which read this test is exercising.
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()
    await expect(page.getByText('No sent notifications are available for your account yet.')).toBeVisible()
    let allowRead = false
    let preferenceReads = 0
    let writes = 0
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/notification_preferences'), async (route) => {
      if (route.request().method() === 'POST') {
        writes += 1
        await route.fulfill({ status: 204, body: '' })
        return
      }
      preferenceReads += 1
      if (!allowRead) {
        await route.fulfill({ status: 400, contentType: 'application/json', json: { code: 'unavailable', message: 'private settings error' } })
        return
      }
      await route.fulfill({ status: 200, contentType: 'application/json', json: {
        in_app: false, push: false, email: false, marketing: true, categories: {},
      } })
    })
    await page.getByRole('button', { name: 'Preferences', exact: true }).click()
    await page.locator('section[aria-labelledby="notifications-title"]').getByRole('button', { name: 'Refresh', exact: true }).click()
    await expect.poll(() => preferenceReads).toBeGreaterThan(0)
    await expect(page.getByRole('alert')).toContainText('We could not load your notifications')
    await expect(page.getByText('Saved preferences are unavailable. Retry notifications before editing.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Save preferences' })).toBeDisabled()
    await expect(page.getByRole('checkbox', { name: /Product announcements/ })).toBeDisabled()
    expect(writes).toBe(0)
    allowRead = true
    await page.getByRole('button', { name: 'Retry notifications' }).click()
    await expect(page.getByRole('checkbox', { name: /Product announcements/ })).toBeChecked()
    await expect(page.getByRole('checkbox', { name: /Email notifications/ })).not.toBeChecked()
    await expect(page.getByRole('button', { name: 'Save preferences' })).toBeEnabled()
    expect(writes).toBe(0)
  })

  test('mark-read failure keeps the sent inbox visible and allows a retry', async ({ page }) => {
    await mockPreparedStudent(page)
    const notificationId = '95000000-0000-4000-8000-000000000004'
    let updates = 0
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/notifications'), async (route) => {
      if (route.request().method() === 'PATCH') {
        updates += 1
        if (updates === 1) {
          await route.fulfill({ status: 400, contentType: 'application/json', json: { code: 'retryable_error', message: 'private row details' } })
        } else {
          await route.fulfill({ status: 204, body: '' })
        }
        return
      }
      await route.fulfill({ json: [{
        id: notificationId, type: 'account', title: 'Your notification', body: 'Keep this notice visible',
        data: {}, scheduled_at: null, sent_at: '2026-10-27T00:00:00Z', read_at: null, created_at: '2026-10-27T00:00:00Z',
      }] })
    })
    await page.goto('/')
    await expect(page.getByText('Keep this notice visible')).toBeVisible()
    await page.getByRole('button', { name: 'Mark read' }).click()
    await expect(page.getByRole('alert')).toContainText('We could not mark that notification as read')
    await expect(page.getByText('Keep this notice visible')).toBeVisible()
    await expect(page.getByText('private row details')).toHaveCount(0)
    await page.getByRole('button', { name: 'Mark read' }).click()
    await expect(page.getByRole('alert')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Mark read' })).toHaveCount(0)
    expect(updates).toBe(2)
  })

  test('mark read constrains updates to the authenticated user', async ({ page }) => {
    await mockPreparedStudent(page)
    const notificationId = '95000000-0000-4000-8000-000000000001'
    let patchQuery = ''
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/notifications'), async (route) => {
      if (route.request().method() === 'PATCH') {
        patchQuery = new URL(route.request().url()).search
        await route.fulfill({ status: 204, body: '' })
        return
      }
      await route.fulfill({ json: [{
        id: notificationId, type: 'account', title: 'Account update', body: 'Verified test notice',
        data: {}, scheduled_at: null, sent_at: '2026-10-27T00:00:00Z', read_at: null, created_at: '2026-10-27T00:00:00Z',
      }] })
    })
    await page.goto('/')
    await expect(page.getByText('Verified test notice')).toBeVisible()
    await page.getByRole('button', { name: 'Mark read' }).click()
    await expect.poll(() => patchQuery).not.toBe('')
    expect(new URLSearchParams(patchQuery).get('user_id')).toBe('eq.' + userId)
    expect(new URLSearchParams(patchQuery).get('id')).toBe('eq.' + notificationId)
    await expect(page.getByRole('button', { name: 'Mark read' })).toHaveCount(0)
  })
})

test.describe('ACE JAMB onboarding save contract', () => {
  test('saves English plus exactly three selected subjects and can continue past the optional community welcome', async ({ page }) => {
    await mockFirstTimeStudent(page)
    let savedPayload: Record<string, unknown> | null = null
    let foundationSaved = false
    await page.route(`${projectUrl}/**`, async (route) => {
      const path = new URL(route.request().url()).pathname
      if (foundationSaved && path.endsWith('/rest/v1/profiles')) {
        await route.fulfill({ json: { id: userId, email: 'student@example.test', display_name: 'Test Futarian', target_score: 300, institution: null, course: null, institution_id: null, program_id: null, prep_time_minutes: null, exam_season: null, created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z' } })
        return
      }
      if (foundationSaved && path.endsWith('/rest/v1/student_preferences')) {
        await route.fulfill({ json: { user_id: userId, daily_minutes: 60, learning_style: null, preferred_study_days: [], timezone: null, preferences: {}, updated_at: '2026-01-01T00:00:00.000Z' } })
        return
      }
      if (foundationSaved && path.endsWith('/rest/v1/student_subjects')) {
        await route.fulfill({ json: subjects.slice(0, 4).map((subject) => ({ subject_id: subject.id })) })
        return
      }
      await route.fallback()
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/save_student_preparation_foundation'), async (route) => {
      savedPayload = route.request().postDataJSON()
      foundationSaved = true
      await route.fulfill({ status: 204, body: '' })
    })

    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Build your preparation profile.' })).toBeVisible()
    await page.getByLabel('Display name').fill('Test Futarian')
    await page.getByLabel(/Mathematics/).check()
    await page.getByLabel(/Physics/).check()
    await page.getByLabel(/Chemistry/).check()
    await page.getByRole('button', { name: 'Continue to ACE' }).click()

    await expect.poll(() => savedPayload).not.toBeNull()
    expect(savedPayload).toMatchObject({
      p_display_name: 'Test Futarian',
      p_target_score: 300,
      p_institution_goal: '',
      p_course_goal: '',
      p_daily_minutes: 60,
    })
    expect(savedPayload?.p_subject_ids).toEqual(subjects.slice(0, 4).map((subject) => subject.id))
    await expect(page.getByRole('alert')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'You’re not preparing alone.' })).toBeVisible()
    const communityLink = page.getByRole('link', { name: /Open official WhatsApp channel/ })
    await expect(communityLink).toBeVisible()
    await expect(communityLink).toHaveAttribute('href', 'https://whatsapp.com/channel/0029VbCW3b1Gk1FtAtO7Qv1N')
    await expect(communityLink).toHaveAttribute('target', '_blank')
    await expect(communityLink).toHaveAttribute('rel', 'noopener noreferrer')
    await page.getByRole('button', { name: 'Continue to your dashboard' }).click()
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()
  })
})


test.describe('ACE JAMB dashboard recovery states', () => {
  test('hides provider details and retries a failed dashboard query', async ({ page }) => {
    await mockPreparedStudent(page)
    let syllabusRequests = 0
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/get_active_exam_blueprint'), async (route) => {
      syllabusRequests += 1
      // Fail the dashboard's active-exam lookup once, then allow the mocked contract on retry.
      if (syllabusRequests === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          json: { code: 'internal_database_error', message: 'private database host and query details' },
        })
        return
      }
      await route.fallback()
    })

    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()
    await expect(page.getByRole('alert')).toContainText('We could not load your preparation dashboard')
    await expect(page.getByRole('alert')).not.toContainText('private database host')
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(page.getByRole('alert')).toHaveCount(0)
    await expect(page.getByText('Verified learning content is not published yet.')).toBeVisible()
    expect(syllabusRequests).toBeGreaterThanOrEqual(2)
  })
})

test.describe('ACE JAMB study-preference loading safety', () => {
  test('does not save default preferences after a failed account read; retry restores real saved choices', async ({ page }) => {
    await mockPreparedStudent(page)
    let allowRead = false
    let writes = 0
    // Let foundational onboarding/profile reads complete before injecting a failure
    // restricted to this component's study-preferences request.
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/student_preferences'), async (route) => {
      if (route.request().method() === 'POST') {
        writes += 1
        await route.fulfill({ status: 201, json: [] })
        return
      }
      if (!allowRead) {
        await route.fulfill({ status: 400, contentType: 'application/json', json: {
          code: 'temporary_database_error', message: 'private user preferences details',
        } })
        return
      }
      await route.fulfill({ json: {
        user_id: userId, daily_minutes: 75, preferred_study_days: ['friday'],
        learning_style: null, timezone: null, preferences: {},
      } })
    })
    await page.getByRole('button', { name: /Study plan/ }).click()
    await expect(page.getByRole('heading', { name: 'Build your study routine' })).toBeVisible()
    await expect(page.getByRole('alert')).toContainText('We could not load your saved study preferences')
    await expect(page.getByText('private user preferences details')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Save study preferences' })).toBeDisabled()
    await expect(page.getByText('Reload your saved preferences to see an accurate routine.')).toBeVisible()
    await expect(page.getByText('75 min')).toHaveCount(0)
    expect(writes).toBe(0)

    allowRead = true
    await page.getByRole('button', { name: 'Retry loading study preferences' }).click()
    await expect(page.getByLabel('Daily study time')).toHaveValue('75')
    await expect(page.getByText('Reload your saved preferences to see an accurate routine.')).toHaveCount(0)
    await expect(page.getByLabel('Fri', { exact: true })).toBeChecked()
    await expect(page.getByLabel('Mon', { exact: true })).not.toBeChecked()
    await expect(page.getByRole('alert')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Save study preferences' })).toBeEnabled()
    expect(writes).toBe(0)
  })
})

test.describe('ACE JAMB study-plan recovery', () => {
  test('does not expose provider details when saving study preferences fails', async ({ page }) => {
    await mockPreparedStudent(page)
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/student_preferences'), async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          json: { code: 'internal_database_error', message: 'private database host and query details' },
        })
        return
      }
      await route.fallback()
    })

    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()
    await page.getByRole('button', { name: /Study plan/ }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Study plan', exact: true })).toBeVisible()
    await expect(page.getByText('Loading your saved preferences…')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Save study preferences' })).toBeEnabled()
    await page.getByRole('button', { name: 'Save study preferences' }).click()
    await expect(page.getByRole('alert')).toContainText('We could not save your study preferences')
    await expect(page.getByRole('alert')).not.toContainText('private database host')
  })
})


test.describe('ACE JAMB installable shell', () => {
  test('serves its manifest and limits service-worker caching to the static shell', async ({ page }) => {
    await mockPreparedStudent(page)
    await page.goto('/')
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest')

    const manifestResponse = await page.evaluate(async () => {
      const response = await fetch('/manifest.webmanifest')
      return { ok: response.ok, manifest: await response.json() }
    })
    expect(manifestResponse.ok).toBeTruthy()
    expect(manifestResponse.manifest.name).toBe('ÑØVÃ ACE JAMB')
    expect(manifestResponse.manifest.display).toBe('standalone')
    expect(manifestResponse.manifest.icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ src: '/nova-ace-icon.svg', type: 'image/svg+xml' }),
    ]))

    const workerText = await page.evaluate(async () => (await fetch('/sw.js')).text())
    expect(workerText).toContain("url.origin !== self.location.origin")
    expect(workerText).toContain("'/rest/'")
    expect(workerText).toContain("'/auth/'")
    expect(workerText).toContain("request.method !== 'GET'")
    expect(workerText).toContain("request.mode === 'navigate'")
    await expect.poll(() => page.evaluate(async () => Boolean(await navigator.serviceWorker.getRegistration('/')))).toBe(true)
  })
})

test.describe('ACE JAMB account settings recovery safety', () => {
  test('a failed account read disables edits until saved fields are restored', async ({ page }) => {
    await mockPreparedStudent(page)
    let allowRead = false
    let writes = 0
    // Startup itself reads student preferences; inject the failure only after
    // a valid dashboard session exists so the component-specific retry is tested.
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/student_preferences'), async (route) => {
      if (route.request().method() !== 'GET') {
        writes += 1
        await route.fulfill({ status: 200, json: [] })
        return
      }
      if (!allowRead) {
        await route.fulfill({ status: 400, contentType: 'application/json', json: {
          code: 'temporary_unavailable', message: 'private provider account details',
        } })
        return
      }
      await route.fulfill({ json: {
        user_id: userId, daily_minutes: 75, preferred_study_days: ['friday'],
        learning_style: null, timezone: null, preferences: {},
      } })
    })
    await page.getByRole('button', { name: 'Edit settings' }).click()
    await expect(page.getByRole('alert')).toContainText('We could not load your account settings')
    await expect(page.getByText('private provider account details')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Save account settings' })).toHaveCount(0)
    expect(writes).toBe(0)

    allowRead = true
    await page.getByRole('button', { name: 'Retry loading account settings' }).click()
    await expect(page.getByLabel('Display name')).toHaveValue('Test Futarian')
    await expect(page.getByLabel('Daily study time (minutes)')).toHaveValue('75')
    await expect(page.getByRole('button', { name: 'Save account settings' })).toBeEnabled()
    expect(writes).toBe(0)
  })
})

test.describe('ACE JAMB account settings stale-load safety', () => {
  test('closing and reopening settings ignores an earlier unfinished profile read', async ({ page }) => {
    await mockPreparedStudent(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()

    let reads = 0
    let releaseOldRead: () => void = () => undefined
    let oldReadCompleted: () => void = () => undefined
    const oldReadGate = new Promise<void>((resolve) => { releaseOldRead = resolve })
    const oldReadDone = new Promise<void>((resolve) => { oldReadCompleted = resolve })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/profiles'), async (route) => {
      if (route.request().method() !== 'GET') {
        await route.fallback()
        return
      }
      const readIndex = ++reads
      if (readIndex === 1) await oldReadGate
      try {
        await route.fulfill({ json: {
          id: userId, email: 'student@example.test',
          display_name: readIndex === 1 ? 'Outdated Futarian' : 'Latest Futarian',
          target_score: 300, institution: null, course: null, institution_id: null,
          program_id: null, prep_time_minutes: null, exam_season: null,
          created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-10-27T00:00:00.000Z',
        } })
      } finally {
        if (readIndex === 1) oldReadCompleted()
      }
    })
    await page.getByRole('button', { name: 'Edit settings' }).click()
    await expect.poll(() => reads).toBe(1)
    await page.getByRole('button', { name: 'Close settings' }).click()
    await page.getByRole('button', { name: 'Edit settings' }).click()
    await expect.poll(() => reads).toBe(2)
    await expect(page.getByLabel('Display name')).toHaveValue('Latest Futarian')
    releaseOldRead()
    await oldReadDone
    await expect(page.getByLabel('Display name')).toHaveValue('Latest Futarian')
  })
})

test.describe('ACE JAMB account settings partial-update recovery', () => {
  test('a failed second write never claims the combined save succeeded and requires a refresh', async ({ page }) => {
    await mockPreparedStudent(page)
    let savedName = 'Test Futarian'
    let profilePatches = 0
    let preferenceWrites = 0
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/profiles'), async (route) => {
      const method = route.request().method()
      if (method === 'PATCH') {
        profilePatches += 1
        savedName = route.request().postDataJSON().display_name
      }
      await route.fulfill({ json: {
        id: userId, email: 'student@example.test', display_name: savedName, target_score: 300,
        institution: null, course: null, institution_id: null, program_id: null, prep_time_minutes: null,
        exam_season: null, created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-10-27T00:00:00.000Z',
      } })
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/student_preferences'), async (route) => {
      if (route.request().method() === 'POST') {
        preferenceWrites += 1
        await route.fulfill({ status: 400, contentType: 'application/json', json: {
          code: 'temporary_error', message: 'private failed write details',
        } })
        return
      }
      await route.fulfill({ json: {
        user_id: userId, learning_style: null, daily_minutes: 60,
        preferred_study_days: [], timezone: null, preferences: {},
      } })
    })
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()
    await page.getByRole('button', { name: 'Edit settings' }).click()
    await expect(page.getByLabel('Display name')).toHaveValue('Test Futarian')
    await page.getByLabel('Display name').fill('Profile was saved')
    await page.getByRole('button', { name: 'Save account settings' }).click()
    await expect(page.getByRole('alert')).toContainText('Your profile may have saved')
    await expect(page.getByText('private failed write details')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Save account settings' })).toHaveCount(0)
    expect(profilePatches).toBe(1)
    expect(preferenceWrites).toBe(1)

    await page.getByRole('button', { name: 'Retry loading account settings' }).click()
    await expect(page.getByLabel('Display name')).toHaveValue('Profile was saved')
    await expect(page.getByLabel('Daily study time (minutes)')).toHaveValue('60')
    expect(profilePatches).toBe(1)
    expect(preferenceWrites).toBe(1)
  })
})

test.describe('ACE JAMB account settings first-use regression', () => {
  test('settings load and save when the student preferences row does not exist yet', async ({ page }) => {
    await mockPreparedStudent(page)
    let preferencesUpserted = false
    let preferencesReads = 0

    // Keep the gate's preparation record complete, then model a missing preferences
    // row when Account Settings loads. All API calls stay mocked.
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/student_preferences'), async (route) => {
      if (route.request().method() === 'GET') {
        preferencesReads += 1
        if (preferencesReads === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            json: { user_id: userId, learning_style: null, daily_minutes: 60, preferred_study_days: [], timezone: null, preferences: {}, updated_at: '2026-10-21T00:00:00.000Z' },
          })
        } else {
          // Empty representation models no preference row for the settings component.
          await route.fulfill({ status: 200, contentType: 'application/json', json: [] })
        }
        return
      }
      if (['POST', 'PATCH', 'PUT'].includes(route.request().method())) {
        preferencesUpserted = true
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          json: { user_id: userId, learning_style: null, daily_minutes: 60, preferred_study_days: [], timezone: null, preferences: {}, updated_at: '2026-10-21T00:00:00.000Z' },
        })
        return
      }
      await route.fallback()
    })

    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/profiles'), async (route) => {
      if (route.request().method() === 'PATCH' || route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: { id: userId, email: 'student@example.test', display_name: 'Test Futarian', target_score: 300, institution: null, course: null, institution_id: null, program_id: null, prep_time_minutes: null, exam_season: null, created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-10-21T00:00:00.000Z' },
        })
        return
      }
      await route.fallback()
    })

    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()
    await page.getByRole('button', { name: 'Edit settings' }).click()
    await expect(page.getByLabel('Display name')).toHaveValue('Test Futarian')
    await expect(page.getByLabel('Daily study time (minutes)')).toHaveValue('')
    await page.getByLabel('Daily study time (minutes)').fill('60')
    await page.getByRole('button', { name: 'Save account settings' }).click()
    await expect(page.getByRole('status')).toContainText('Your account settings were saved.')
    expect(preferencesUpserted).toBe(true)
  })
})

test.describe('ACE JAMB admin authorization recovery', () => {
  test('does not expose raw authorization or database errors when the admin check fails', async ({ page }) => {
    await mockPreparedStudent(page)
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/is_admin'), async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        json: { code: 'internal_database_error', message: 'private database host and query details' },
      })
    })

    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: 'Admin access required' })).toBeVisible()
    await expect(page.getByText('Unable to verify administrator access. Please try again.')).toBeVisible()
    await expect(page.getByText(/private database host/)).toHaveCount(0)
  })
})

test.describe('ACE JAMB admin verification retry', () => {
  test('recovers from temporary role service failure without bypassing admin authorization', async ({ page }) => {
    await mockPreparedStudent(page)
    let checks = 0
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/is_admin'), async (route) => {
      checks += 1
      if (checks === 1) {
        await route.fulfill({ status: 503, contentType: 'application/json', json: {
          code: 'temporary_service_error', message: 'private database details',
        } })
      } else {
        await route.fulfill({ json: true })
      }
    })
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: 'Admin access required' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toHaveCount(0)
    await expect(page.getByText('private database details')).toHaveCount(0)
    await page.getByRole('button', { name: 'Retry administrator verification' }).click()
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible()
    expect(checks).toBe(2)
  })

  test('role rejection never provides a client-only retry bypass', async ({ page }) => {
    await mockPreparedStudent(page)
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: 'Admin access required' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Retry administrator verification' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toHaveCount(0)
  })
})

test.describe('ACE JAMB reduced-motion accessibility', () => {
  test('respects the operating system reduced-motion preference', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await mockPreparedStudent(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()

    const motionStyles = await page.evaluate(() => {
      const probe = document.createElement('button')
      probe.className = 'field'
      document.body.append(probe)
      const parseMilliseconds = (value: string) => {
        const trimmed = value.trim()
        return trimmed.endsWith('ms')
          ? Number.parseFloat(trimmed)
          : Number.parseFloat(trimmed) * 1000
      }
      const styles = window.getComputedStyle(probe)
      const transitionMilliseconds = Math.max(...styles.transitionDuration.split(',').map(parseMilliseconds))
      const animationMilliseconds = Math.max(...styles.animationDuration.split(',').map(parseMilliseconds))
      probe.remove()
      return {
        scrollBehavior: window.getComputedStyle(document.documentElement).scrollBehavior,
        transitionMilliseconds,
        animationMilliseconds,
      }
    })

    expect(motionStyles.scrollBehavior).toBe('auto')
    expect(motionStyles.transitionMilliseconds).toBeLessThanOrEqual(0.1)
    expect(motionStyles.animationMilliseconds).toBeLessThanOrEqual(0.1)
  })
})

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
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()
  })
})

test.describe('ACE JAMB persistent CBT', () => {
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
      await route.fulfill({ json: [{
        id: questionId, question_text: 'Which option is correct?',
        options: [{ key: 'A', text: 'First answer' }, { key: 'B', text: 'Second answer' }],
        subject_id: null, topic_id: null, difficulty: 'easy',
      }] })
    })
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/save_attempt_answer'), async (route) => {
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


test.describe('ACE JAMB academic editor access', () => {
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
    await expect(page.getByText('Revision materials are not published yet')).toBeVisible()

    await page.getByRole('button', { name: 'Flashcards', exact: true }).click()
    await expect(page.getByText('No verified flashcard deck yet')).toBeVisible()

    await page.getByRole('button', { name: 'Progress', exact: true }).click()
    await expect(page.getByText('Verified performance')).toBeVisible()
    await expect(page.getByText('Not available yet')).toBeVisible()

    await page.getByRole('button', { name: /Study plan/ }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Study plan', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Build your study routine' })).toBeVisible()
    await page.getByLabel('Daily study time').fill('90')
    await page.getByLabel('Tue', { exact: true }).check()
    await page.getByRole('button', { name: 'Save study preferences' }).click()
    await expect(page.getByRole('status')).toContainText('saved to your account')

    await page.getByRole('button', { name: 'Dashboard', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()
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
    await expect(page.getByText(/No active referral campaign is configured/)).toBeVisible()
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


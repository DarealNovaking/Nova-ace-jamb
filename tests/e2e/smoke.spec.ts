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
  test('saved preparation profile survives reload and dashboard offers CBT navigation', async ({ page }) => {
    await mockPreparedStudent(page)
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'My subjects' })).toBeVisible()
    await expect(page.getByText('Use of English')).toBeVisible()
    await expect(page.getByText(/Verified learning content is not published yet/)).toBeVisible()

    await page.reload()
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()
    await page.getByRole('button', { name: /CBT Practice/ }).click()
    await expect(page).toHaveURL(/[?&]cbt=1(?:&|$)/)
    await expect(page.getByRole('button', { name: /Back to ACE JAMB/ })).toBeVisible()
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
    await expect(page.getByText(/No reviewed questions are published for this session yet/)).toBeVisible()
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
    // The server-provided option order is B, A, so canonical option A is displayed second.
    await page.getByRole('button', { name: 'B. First answer' }).click()
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


test.describe('ACE JAMB preparation workspaces', () => {
  test('student tools navigate and show honest empty states without inventing content', async ({ page }) => {
    await mockPreparedStudent(page)
    await page.goto('/')

    await page.getByRole('button', { name: /Learn Approved syllabus topics/ }).click()
    await expect(page).toHaveURL(/[?&]view=learn(?:&|$)/)
    await expect(page.getByRole('heading', { name: 'Learn', exact: true })).toBeVisible()
    await expect(page.getByText('No approved topics available yet')).toBeVisible()

    // Workspace selection is route state: reload and browser history must restore it.
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Learn', exact: true })).toBeVisible()
    await page.goBack()
    await expect(page.getByRole('heading', { name: 'Welcome back, Test Futarian.' })).toBeVisible()
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

    await page.getByRole('button', { name: 'Study plan', exact: true }).click()
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


test.describe('ACE JAMB onboarding save contract', () => {
  test('saves English plus exactly three selected subjects through the server RPC', async ({ page }) => {
    await mockFirstTimeStudent(page)
    let savedPayload: Record<string, unknown> | null = null
    await page.route((url) => new URL(url).pathname.endsWith('/rest/v1/rpc/save_student_preparation_foundation'), async (route) => {
      savedPayload = route.request().postDataJSON()
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
  })
})

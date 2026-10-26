// Run with: node --experimental-strip-types --test tests/progress-summary.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { summarizeAttempts } from '../src/lib/progressSummary.ts'

const base = { id: 'a', mode: 'cbt', started_at: '2026-10-01T10:00:00Z', completed_at: '2026-10-01T11:00:00Z', score: null }

test('no attempts gives no accuracy (nothing is invented)', () => {
  const s = summarizeAttempts([])
  assert.equal(s.sessions, 0)
  assert.equal(s.accuracy, null)
  assert.deepEqual(s.bySubject, [])
})

test('only completed attempts with answers are counted', () => {
  const s = summarizeAttempts([
    { ...base, id: '1', status: 'completed', correct_count: 30, answered_count: 40, subject_id: 'eng' },
    { ...base, id: '2', status: 'in_progress', correct_count: 5, answered_count: 5, subject_id: 'eng' },
    { ...base, id: '3', status: 'completed', correct_count: 0, answered_count: 0, subject_id: 'eng' },
    { ...base, id: '4', status: 'completed', correct_count: 10, answered_count: 20, subject_id: 'mth' },
  ])
  assert.equal(s.sessions, 2)
  assert.equal(s.answered, 60)
  assert.equal(s.correct, 40)
  assert.equal(s.accuracy, 67)
  assert.deepEqual(s.bySubject.map((x) => [x.subjectId, x.accuracy]), [['eng', 75], ['mth', 50]])
})

test('corrupt counts are clamped, never produce more than 100%', () => {
  const s = summarizeAttempts([{ ...base, status: 'completed', correct_count: 99, answered_count: 10, subject_id: null }])
  assert.equal(s.accuracy, 100)
  assert.deepEqual(s.bySubject, [])
})

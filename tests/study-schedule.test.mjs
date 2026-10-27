// Run with: node --experimental-strip-types --test tests/study-schedule.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { buildStudySchedule } from '../src/lib/studySchedule.ts'

const subjects = [{ id: 'eng', name: 'English' }, { id: 'mat', name: 'Mathematics' }, { id: 'phy', name: 'Physics' }]
const monday = new Date(2026, 9, 26, 8)

test('rotates subjects only on selected weekdays, without invented lessons', () => {
  const sessions = buildStudySchedule(subjects, ['monday', 'wednesday'], 45, monday, 8)
  assert.deepEqual(sessions.map(({ date, subjectId, minutes }) => [date, subjectId, minutes]), [
    ['2026-10-26', 'eng', 45],
    ['2026-10-28', 'mat', 45],
    ['2026-11-02', 'phy', 45],
  ])
})

test('avoids a fake plan without valid subjects, weekdays or time', () => {
  assert.deepEqual(buildStudySchedule([], ['monday'], 45, monday), [])
  assert.deepEqual(buildStudySchedule(subjects, [], 45, monday), [])
  assert.deepEqual(buildStudySchedule(subjects, ['monday'], 0, monday), [])
  assert.deepEqual(buildStudySchedule(subjects, ['monday'], 1441, monday), [])
  assert.deepEqual(buildStudySchedule(subjects, ['invalid'], 45, monday), [])
})

test('preserves saved subjects and preferences without mutation', () => {
  const before = JSON.stringify(subjects)
  const days = ['monday', 'friday']
  buildStudySchedule(subjects, days, 60, monday)
  assert.equal(JSON.stringify(subjects), before)
  assert.deepEqual(days, ['monday', 'friday'])
})

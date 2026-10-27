// Run with: node --experimental-strip-types --test tests/progress-summary.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { summarizeAttempts, summarizeAccuracyTrend, suggestStudyFocus, summarizeTopicEvidence, summarizeSubtopicEvidence } from '../src/lib/progressSummary.ts'

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

test('recent accuracy uses completed genuine answers and compares latest two chronologically', () => {
  const t = summarizeAccuracyTrend([
    { ...base, id: 'older', status: 'completed', correct_count: 3, answered_count: 10, completed_at: '2026-10-01T11:00:00Z' },
    { ...base, id: 'new', status: 'completed', correct_count: 8, answered_count: 10, completed_at: '2026-10-09T11:00:00Z' },
    { ...base, id: 'partial', status: 'active', correct_count: 9, answered_count: 10, completed_at: '2026-10-20T11:00:00Z' },
    { ...base, id: 'corrupt', status: 'completed', correct_count: 100, answered_count: 0, completed_at: '2026-10-30T11:00:00Z' },
  ])
  assert.equal(t.changePoints, 50)
  assert.deepEqual(t.recent.map((item) => item.id), ['new', 'older'])
})

test('accuracy trend is unavailable with fewer than two valid sessions', () => {
  assert.equal(summarizeAccuracyTrend([]).changePoints, null)
  assert.equal(summarizeAccuracyTrend([{ ...base, status: 'completed', correct_count: 1, answered_count: 2 }]).changePoints, null)
})

test('subject focus prioritizes lower observed accuracy and respects minimum evidence', () => {
  const actual = suggestStudyFocus([
    { ...base, id: 'math', status: 'completed', correct_count: 8, answered_count: 10, subject_id: 'math' },
    { ...base, id: 'english', status: 'completed', correct_count: 3, answered_count: 10, subject_id: 'eng' },
    { ...base, id: 'ongoing', status: 'active', correct_count: 0, answered_count: 20, subject_id: 'math' },
  ], [{ id: 'math', name: 'Mathematics' }, { id: 'eng', name: 'Use of English' }])
  assert.deepEqual(actual, { subjectId: 'eng', subjectName: 'Use of English', answered: 10, accuracy: 30 })
  assert.equal(suggestStudyFocus([], [{ id: 'eng', name: 'Use of English' }]), null)
  assert.equal(suggestStudyFocus([
    { ...base, status: 'completed', correct_count: 1, answered_count: 2, subject_id: 'eng' },
  ], [{ id: 'eng', name: 'Use of English' }]), null)
})

test('topic evidence combines observed answers only for approved, published matching topics', () => {
  const topic = { id: 'topic-a', name: 'Comprehension', subject_id: 'english' }
  const values = summarizeTopicEvidence([
    { question_id: 'a', attempts: 8, correct_count: 2, incorrect_count: 6, last_answered_at: '2026-10-22' },
    { question_id: 'b', attempts: 5, correct_count: 4, incorrect_count: 1, last_answered_at: '2026-10-23' },
    { question_id: 'c', attempts: 100, correct_count: 0, incorrect_count: 100, last_answered_at: '2026-10-24' },
  ], [
    { id: 'a', subject_id: 'english', topic_id: 'topic-a' },
    { id: 'b', subject_id: 'english', topic_id: 'topic-a' },
  ], [topic])
  assert.deepEqual(values, [{
    topicId: 'topic-a', topicName: 'Comprehension', subjectId: 'english',
    answers: 13, correct: 6, accuracy: 46, trackedQuestions: 2,
  }])
})

test('topic suggestions omit small, unpublished and mismatched subject evidence', () => {
  const rows = [{ question_id: 'a', attempts: 4, correct_count: 1, incorrect_count: 3, last_answered_at: '2026-10-22' }]
  const topics = [{ id: 't', name: 'Topic', subject_id: 'eng' }]
  assert.deepEqual(summarizeTopicEvidence(rows, [{ id: 'a', topic_id: 't', subject_id: 'eng' }], topics), [])
  assert.deepEqual(summarizeTopicEvidence(rows, [{ id: 'a', topic_id: 't', subject_id: 'math' }], topics, 1), [])
  assert.deepEqual(summarizeTopicEvidence(rows, [], topics, 1), [])
})

test('subtopic insights use only linked approved subtopics and qualifying saved answer history', () => {
  const approved = [{ id: 't', name: 'Comprehension', subject_id: 'eng', subtopics: [{ id: 's', name: 'Reading details' }] }]
  const records = [
    { question_id: 'a', attempts: 5, correct_count: 2, incorrect_count: 3, last_answered_at: '2026-10-27' },
    { question_id: 'b', attempts: 10, correct_count: 0, incorrect_count: 10, last_answered_at: '2026-10-27' },
    { question_id: 'c', attempts: 10, correct_count: 0, incorrect_count: 10, last_answered_at: '2026-10-27' },
  ]
  const published = [
    { id: 'a', subject_id: 'eng', topic_id: 't', subtopic_id: 's' },
    { id: 'b', subject_id: 'eng', topic_id: 't', subtopic_id: 'unapproved' },
    { id: 'c', subject_id: 'math', topic_id: 't', subtopic_id: 's' },
  ]
  assert.deepEqual(summarizeSubtopicEvidence(records, published, approved), [{
    subtopicId: 's', subtopicName: 'Reading details', topicId: 't', topicName: 'Comprehension',
    subjectId: 'eng', answers: 5, correct: 2, accuracy: 40, trackedQuestions: 1,
  }])
  assert.deepEqual(summarizeSubtopicEvidence(records.slice(0, 1).map((x) => ({ ...x, correct_count: 1, incorrect_count: 2 })), published, approved), [])
  assert.deepEqual(summarizeSubtopicEvidence(records, [], approved), [])
})

export type PastAttempt = {
  id: string
  mode: string
  status: string
  started_at: string
  completed_at: string | null
  score: number | null
  correct_count: number
  answered_count: number
  subject_id: string | null
}

export type StudentQuestionMistake = {
  question_id: string
  attempts: number
  correct_count: number
  incorrect_count: number
  last_answered_at: string
}

export type SubjectProgress = {
  subjectId: string
  sessions: number
  answered: number
  correct: number
  accuracy: number
}

export type ProgressSummary = {
  sessions: number
  answered: number
  correct: number
  accuracy: number | null
  bySubject: SubjectProgress[]
}

const asCount = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0)

// Only completed attempts that answered at least one question count. Nothing is estimated or projected.
export function summarizeAttempts(attempts: PastAttempt[]): ProgressSummary {
  const subjects = new Map<string, { sessions: number; answered: number; correct: number }>()
  let sessions = 0
  let answered = 0
  let correct = 0

  for (const attempt of attempts) {
    if (attempt.status !== 'completed') continue
    const attemptAnswered = asCount(attempt.answered_count)
    if (attemptAnswered === 0) continue
    const attemptCorrect = Math.min(asCount(attempt.correct_count), attemptAnswered)
    sessions += 1
    answered += attemptAnswered
    correct += attemptCorrect
    if (attempt.subject_id) {
      const entry = subjects.get(attempt.subject_id) ?? { sessions: 0, answered: 0, correct: 0 }
      entry.sessions += 1
      entry.answered += attemptAnswered
      entry.correct += attemptCorrect
      subjects.set(attempt.subject_id, entry)
    }
  }

  return {
    sessions,
    answered,
    correct,
    accuracy: answered > 0 ? Math.round((correct / answered) * 100) : null,
    bySubject: [...subjects.entries()].map(([subjectId, entry]) => ({
      subjectId,
      ...entry,
      accuracy: Math.round((entry.correct / entry.answered) * 100),
    })),
  }
}

export type AttemptAccuracyPoint = {
  id: string
  when: string
  mode: string
  correct: number
  answered: number
  accuracy: number
}

export type AccuracyTrend = {
  recent: AttemptAccuracyPoint[]
  // Difference between the two most recent valid completed attempts, in percentage points.
  changePoints: number | null
}

// Recent accuracy is descriptive, not a prediction of the student's JAMB score.
// Ignore invalid dates/counts and do not mutate caller-owned attempt records.
export function summarizeAccuracyTrend(attempts: PastAttempt[], maxSessions = 5): AccuracyTrend {
  const points = attempts.flatMap((attempt) => {
    if (attempt.status !== 'completed' || !Number.isFinite(attempt.answered_count) || attempt.answered_count <= 0) return []
    const answered = Math.floor(attempt.answered_count)
    const correct = Math.min(Math.max(0, Math.floor(Number.isFinite(attempt.correct_count) ? attempt.correct_count : 0)), answered)
    const when = attempt.completed_at || attempt.started_at
    const timestamp = Date.parse(when)
    if (!Number.isFinite(timestamp)) return []
    return [{
      id: attempt.id, when, mode: attempt.mode, answered, correct,
      accuracy: Math.round((correct / answered) * 100),
    }]
  }).sort((a, b) => Date.parse(b.when) - Date.parse(a.when))
  const recent = points.slice(0, Math.max(0, Math.min(20, Math.floor(maxSessions))))
  return { recent, changePoints: recent.length < 2 ? null : recent[0].accuracy - recent[1].accuracy }
}

export type StudyFocus = {
  subjectId: string
  subjectName: string
  answered: number
  accuracy: number
}

// Recommendation only from completed subject-tagged work, never a JAMB score forecast.
// The minimum observation count is caller-configurable for product governance.
export function suggestStudyFocus(
  attempts: PastAttempt[],
  subjects: Array<{ id: string; name: string }>,
  minAnswered = 5,
): StudyFocus | null {
  const minimum = Math.max(1, Math.floor(minAnswered))
  const bySubject = summarizeAttempts(attempts).bySubject
  const candidates = bySubject.filter((row) => row.answered >= minimum).flatMap((row) => {
    const subject = subjects.find((item) => item.id === row.subjectId)
    return subject ? [{ subjectId: row.subjectId, subjectName: subject.name, answered: row.answered, accuracy: row.accuracy }] : []
  })
  candidates.sort((a,b)=>a.accuracy-b.accuracy || b.answered-a.answered || a.subjectName.localeCompare(b.subjectName))
  return candidates[0] ?? null
}

export type QuestionReviewEvidence = {
  question_id: string
  attempts: number
  correct_count: number
  incorrect_count: number
  last_answered_at: string
}
export type PublishedTopicMapping = { id: string; subject_id: string | null; topic_id: string | null }
export type ApprovedTopicRef = { id: string; name: string; subject_id?: string }
export type TopicEvidence = { topicId: string; topicName: string; subjectId: string; answers: number; correct: number; accuracy: number; trackedQuestions: number }

// Only surface topic observations with sufficient correct/incorrect decisions.
// Unpublished questions, unapproved topics and unsafely small samples are excluded.
export function summarizeTopicEvidence(
  records: QuestionReviewEvidence[],
  published: PublishedTopicMapping[],
  approved: ApprovedTopicRef[],
  minAnswers = 5,
): TopicEvidence[] {
  const eligible = new Map(approved.filter((topic) => Boolean(topic.subject_id)).map((topic) => [topic.id, topic]))
  const questionTopics = new Map(published.filter((row) => row.id && row.topic_id && row.subject_id).map((row) => [row.id, row]))
  const results = new Map<string, { topicName: string; subjectId: string; answers: number; correct: number; trackedQuestions: number }>()
  const seenQuestions = new Set<string>()
  for (const record of records) {
    if (seenQuestions.has(record.question_id)) continue
    seenQuestions.add(record.question_id)
    const mapped = questionTopics.get(record.question_id)
    if (!mapped?.topic_id || !mapped.subject_id) continue
    const topic = eligible.get(mapped.topic_id)
    if (!topic || topic.subject_id !== mapped.subject_id) continue
    const correct = Math.max(0, Math.floor(Number.isFinite(record.correct_count) ? record.correct_count : 0))
    const incorrect = Math.max(0, Math.floor(Number.isFinite(record.incorrect_count) ? record.incorrect_count : 0))
    const answers = correct + incorrect
    if (!answers) continue
    const previous = results.get(topic.id) ?? { topicName: topic.name, subjectId: mapped.subject_id, answers: 0, correct: 0, trackedQuestions: 0 }
    previous.answers += answers
    previous.correct += correct
    previous.trackedQuestions += 1
    results.set(topic.id, previous)
  }
  const threshold = Number.isFinite(minAnswers) ? Math.max(1, Math.floor(minAnswers)) : 5
  return [...results.entries()].filter(([, entry]) => entry.answers >= threshold).map(([topicId, entry]) => ({
    topicId, topicName: entry.topicName, subjectId: entry.subjectId, answers: entry.answers, correct: entry.correct,
    accuracy: Math.round((entry.correct / entry.answers) * 100), trackedQuestions: entry.trackedQuestions,
  })).sort((a,b)=>a.accuracy-b.accuracy || b.answers-a.answers || a.topicName.localeCompare(b.topicName))
}

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

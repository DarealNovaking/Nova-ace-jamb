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

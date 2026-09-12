import { ace } from './supabase'

export type CbtMode = 'practice' | 'cbt' | 'mock' | 'learning' | 'revision' | 'ai_practice'

export type CbtAttemptState = {
  attempt_id: string
  status: 'active' | 'paused' | 'completed' | 'abandoned'
  mode: CbtMode
  subject_id: string | null
  started_at: string
  completed_at: string | null
  duration_seconds: number
  remaining_seconds: number
  random_seed: number | null
  question_order: string[]
  option_order: Record<string, string[]>
  answers: Array<{
    question_id: string
    selected_option_key: string | null
    response_ms: number | null
    answered_at: string | null
  }>
  score: number | null
  correct_count: number
  answered_count: number
}

export type CbtStartOptions = {
  mode: CbtMode
  subjectId?: string | null
  questionCount?: number
  durationSeconds?: number
  questionIds?: string[]
}

export async function startCbt(options: CbtStartOptions) {
  const { data, error } = await ace.rpc('start_attempt', {
    p_mode: options.mode,
    p_subject_id: options.subjectId ?? null,
    p_question_count: options.questionCount ?? 20,
    p_duration_seconds: options.durationSeconds ?? 1800,
    p_question_ids: options.questionIds ?? null,
  })
  if (error) throw error
  return data as {
    attempt_id: string
    status: 'active'
    started_at: string
    duration_seconds: number
    random_seed: number
    question_order: string[]
    option_order: Record<string, string[]>
    question_count: number
  }
}

export async function resumeCbt(attemptId: string) {
  const { data, error } = await ace.rpc('resume_attempt', { p_attempt_id: attemptId })
  if (error) throw error
  return data as CbtAttemptState
}

export async function saveCbtAnswer(
  attemptId: string,
  questionId: string,
  selectedOptionKey: string | null,
  responseMs?: number | null,
) {
  const { data, error } = await ace.rpc('save_attempt_answer', {
    p_attempt_id: attemptId,
    p_question_id: questionId,
    p_selected_option_key: selectedOptionKey,
    p_response_ms: responseMs ?? null,
  })
  if (error) throw error
  return data as {
    attempt_id: string
    question_id: string
    selected_option_key: string | null
    is_correct: boolean
    answered_at: string
    answered_count: number
  }
}

export async function submitCbt(attemptId: string) {
  const { data, error } = await ace.rpc('submit_attempt', { p_attempt_id: attemptId })
  if (error) throw error
  return data as {
    attempt_id: string
    status: 'completed'
    score: number
    correct_count: number
    answered_count: number
    total_questions: number
    completed_at: string
  }
}

export function getRemainingSeconds(startedAt: string, durationSeconds: number, now = Date.now()) {
  const elapsed = Math.floor((now - new Date(startedAt).getTime()) / 1000)
  return Math.max(0, durationSeconds - elapsed)
}

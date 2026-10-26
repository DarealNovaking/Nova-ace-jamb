import { ace, supabase } from './supabase'

export type PastAttempt = {
  id: string
  mode: string
  status: string
  started_at: string
  completed_at: string | null
  duration_seconds: number
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

export async function listPastAttempts(limit = 20): Promise<PastAttempt[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user) return []

  const { data, error } = await ace
    .from('attempts')
    .select('id,mode,status,started_at,completed_at,duration_seconds,score,correct_count,answered_count,subject_id')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(Math.max(1, Math.min(limit, 100)))

  if (error) throw error
  return (data ?? []) as PastAttempt[]
}

export async function listStudentMistakes(limit = 20): Promise<StudentQuestionMistake[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user) return []

  const { data, error } = await ace
    .from('student_question_stats')
    .select('question_id,attempts,correct_count,incorrect_count,last_answered_at')
    .eq('user_id', user.id)
    .gt('incorrect_count', 0)
    .order('incorrect_count', { ascending: false })
    .limit(Math.max(1, Math.min(limit, 100)))

  if (error) throw error
  return (data ?? []) as StudentQuestionMistake[]
}

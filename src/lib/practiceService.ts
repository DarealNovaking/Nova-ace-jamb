import { ace, supabase } from './supabase'
import type { PastAttempt, StudentQuestionMistake } from './progressSummary'

export type { PastAttempt, StudentQuestionMistake } from './progressSummary'

// Read-only helpers for the student's own saved attempts and missed-question stats.
// Both fail safe: if the table is unreadable (permissions, offline, no data) they return an empty list,
// and the Progress screen then shows "not available yet" instead of invented numbers.
export async function listPastAttempts(limit = 20): Promise<PastAttempt[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    const { data, error } = await ace
      .from('attempts')
      .select('id,mode,status,started_at,completed_at,score,correct_count,answered_count,subject_id')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(limit)
    if (error) return []
    return Array.isArray(data) ? (data as PastAttempt[]) : []
  } catch {
    return []
  }
}

export async function listStudentMistakes(limit = 20): Promise<StudentQuestionMistake[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    const { data, error } = await ace
      .from('student_question_stats')
      .select('question_id,attempts,correct_count,incorrect_count,last_answered_at')
      .eq('user_id', user.id)
      .gt('incorrect_count', 0)
      .order('incorrect_count', { ascending: false })
      .limit(limit)
    if (error) return []
    return Array.isArray(data) ? (data as StudentQuestionMistake[]) : []
  } catch {
    return []
  }
}

// Revision history must distinguish truly empty data from a failed request.
// Progress retains its older best-effort helper for backward compatibility.
export async function fetchStudentMistakes(limit = 20): Promise<StudentQuestionMistake[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user) throw new Error('Sign in required')
  const { data, error } = await ace
    .from('student_question_stats')
    .select('question_id,attempts,correct_count,incorrect_count,last_answered_at')
    .eq('user_id', user.id)
    .gt('incorrect_count', 0)
    .order('incorrect_count', { ascending: false })
    .limit(Math.max(1, Math.min(20, limit)))
  if (error) throw error
  return Array.isArray(data) ? (data as StudentQuestionMistake[]) : []
}

// Strict version for progress: do not mislabel network/permission failures as empty history.
export async function fetchStudentAttempts(limit = 20): Promise<PastAttempt[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user) throw new Error('Sign in required')
  const { data, error } = await ace
    .from('attempts')
    .select('id,mode,status,started_at,completed_at,score,correct_count,answered_count,subject_id')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(Math.max(1, Math.min(20, limit)))
  if (error) throw error
  return Array.isArray(data) ? (data as PastAttempt[]) : []
}

import { ace, supabase } from './supabase'
import { parsePublishedQuestionIds, parseStudentQuestionTopics, validateQuestionIds } from './studentQuestionDelivery'
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

// Returns identifiers only: correct answers never enter this pre-flight query.
// The server start_attempt RPC independently validates active published questions.
export async function listPublishedTopicQuestionIds(subjectId: string, topicId: string, subtopicId?: string | null, limit = 20): Promise<string[]> {
  const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
  if (!isUuid(subjectId) || !isUuid(topicId) || (subtopicId != null && !isUuid(subtopicId))) return []
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user) throw new Error('Sign in required')
  if (!Number.isFinite(limit)) throw new Error('Invalid question limit')
  const boundedLimit = Math.max(1, Math.min(20, Math.floor(limit)))
  const { data, error } = await ace.rpc('published_topic_questions', {
    p_subject_id: subjectId, p_topic_id: topicId, p_subtopic_id: subtopicId ?? null, p_limit: boundedLimit,
  })
  if (error) throw error
  return parsePublishedQuestionIds(data, boundedLimit)
}

// Read-only and self-scoped; only active published question metadata is joined.
// Bounded requests protect low-bandwidth devices; this is an observation, not a full-life mastery score.
export async function fetchStudentTopicEvidence(limit = 80): Promise<{ records: import('./progressSummary').QuestionReviewEvidence[]; published: import('./progressSummary').PublishedTopicMapping[] }> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user) throw new Error('Sign in required')
  const { data, error } = await ace.from('student_question_stats')
    .select('question_id,attempts,correct_count,incorrect_count,last_answered_at')
    .eq('user_id', user.id)
    .order('last_answered_at', { ascending: false })
    .limit(Math.max(1, Math.min(80, Math.floor(limit))))
  if (error) throw error
  const records = (data ?? []) as import('./progressSummary').QuestionReviewEvidence[]
  const ids = [...new Set(records.map((item) => item.question_id))].filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))
  if (!ids.length) return { records, published: [] }
  const requested = validateQuestionIds(ids, 80)
  const { data: questions, error: questionError } = await ace.rpc('student_question_topics', { p_question_ids: requested })
  if (questionError) throw questionError
  return { records, published: parseStudentQuestionTopics(questions, requested) }
}

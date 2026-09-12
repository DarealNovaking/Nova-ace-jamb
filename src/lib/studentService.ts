import { ace, supabase } from './supabase'

export type StudentProfile = {
  id: string
  email: string | null
  display_name: string | null
  target_score: number | null
  institution: string | null
  course: string | null
  prep_time_minutes: number | null
  exam_season: string | null
  created_at: string
  updated_at: string
}

export type StudentPreferences = {
  user_id: string
  learning_style: string | null
  daily_minutes: number | null
  preferred_study_days: string[]
  timezone: string | null
  preferences: Record<string, unknown>
  updated_at: string
}

export async function getStudentProfile() {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('Authentication required')
  const { data, error } = await ace.from('profiles').select('*').eq('id', user.id).single()
  if (error) throw error
  return data as StudentProfile
}

export async function updateStudentProfile(input: Partial<Pick<StudentProfile, 'display_name' | 'target_score' | 'institution' | 'course' | 'prep_time_minutes' | 'exam_season'>>) {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('Authentication required')
  const patch = {
    ...(input.display_name !== undefined ? { display_name: input.display_name.trim() || null } : {}),
    ...(input.target_score !== undefined ? { target_score: input.target_score } : {}),
    ...(input.institution !== undefined ? { institution: input.institution?.trim() || null } : {}),
    ...(input.course !== undefined ? { course: input.course?.trim() || null } : {}),
    ...(input.prep_time_minutes !== undefined ? { prep_time_minutes: input.prep_time_minutes } : {}),
    ...(input.exam_season !== undefined ? { exam_season: input.exam_season?.trim() || null } : {}),
  }
  const { data, error } = await ace.from('profiles').update(patch).eq('id', user.id).select('*').single()
  if (error) throw error
  return data as StudentProfile
}

export async function getStudentPreferences() {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('Authentication required')
  const { data, error } = await ace.from('student_preferences').select('*').eq('user_id', user.id).single()
  if (error) throw error
  return data as StudentPreferences
}

export async function updateStudentPreferences(input: Partial<Omit<StudentPreferences, 'user_id' | 'updated_at'>>) {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('Authentication required')
  const { data, error } = await ace.from('student_preferences').upsert({ user_id: user.id, ...input }).select('*').single()
  if (error) throw error
  return data as StudentPreferences
}

export async function setStudentSubjects(subjectIds: string[]) {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('Authentication required')
  const unique = [...new Set(subjectIds)]
  if (unique.length < 1 || unique.length > 4) throw new Error('Select between 1 and 4 subjects.')
  const rows = unique.map((subject_id, index) => ({ user_id: user.id, subject_id, is_primary: index === 0, sort_order: index }))
  const { error: deleteError } = await ace.from('student_subjects').delete().eq('user_id', user.id)
  if (deleteError) throw deleteError
  const { data, error } = await ace.from('student_subjects').insert(rows).select('*')
  if (error) throw error
  return data
}

export async function getStudentSubjects() {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('Authentication required')
  const { data, error } = await ace.from('student_subjects').select('subject_id,is_primary,sort_order').eq('user_id', user.id).order('sort_order')
  if (error) throw error
  return data ?? []
}

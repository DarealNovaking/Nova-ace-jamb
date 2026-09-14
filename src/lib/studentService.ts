import { ace, supabase } from './supabase'

export type StudentProfile = {
  id: string
  email: string | null
  display_name: string | null
  target_score: number | null
  institution: string | null
  course: string | null
  institution_id: string | null
  program_id: string | null
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

async function requireUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!data.user) throw new Error('Authentication required')
  return data.user
}

export async function getStudentProfile() {
  const user = await requireUser()
  const { data, error } = await ace.from('profiles').select('*').eq('id', user.id).single()
  if (error) throw error
  return data as StudentProfile
}

export async function updateStudentProfile(input: Partial<Pick<StudentProfile, 'display_name' | 'target_score' | 'institution' | 'course' | 'prep_time_minutes' | 'exam_season'>>) {
  const user = await requireUser()
  const patch: Record<string, unknown> = {}
  if (input.display_name !== undefined) {
    const value = input.display_name?.trim() ?? ''
    if (!value || value.length > 80) throw new Error('Display name must be 1–80 characters.')
    patch.display_name = value
  }
  if (input.target_score !== undefined) {
    if (input.target_score !== null && (!Number.isInteger(input.target_score) || input.target_score < 0 || input.target_score > 400)) throw new Error('Target score must be between 0 and 400.')
    patch.target_score = input.target_score
  }
  if (input.institution !== undefined) patch.institution = input.institution?.trim().slice(0, 160) || null
  if (input.course !== undefined) patch.course = input.course?.trim().slice(0, 160) || null
  if (input.prep_time_minutes !== undefined) {
    if (input.prep_time_minutes !== null && (!Number.isInteger(input.prep_time_minutes) || input.prep_time_minutes <= 0 || input.prep_time_minutes > 1440)) throw new Error('Preparation time must be between 1 and 1440 minutes.')
    patch.prep_time_minutes = input.prep_time_minutes
  }
  if (input.exam_season !== undefined) patch.exam_season = input.exam_season?.trim().slice(0, 80) || null
  const { data, error } = await ace.from('profiles').update(patch).eq('id', user.id).select('*').single()
  if (error) throw error
  return data as StudentProfile
}

export async function getStudentPreferences() {
  const user = await requireUser()
  const { data, error } = await ace.from('student_preferences').select('*').eq('user_id', user.id).single()
  if (error) throw error
  return data as StudentPreferences
}

export async function updateStudentPreferences(input: Partial<Omit<StudentPreferences, 'user_id' | 'updated_at'>>) {
  const user = await requireUser()
  const { data, error } = await ace.from('student_preferences').upsert({ user_id: user.id, ...input }).select('*').single()
  if (error) throw error
  return data as StudentPreferences
}

export async function setStudentSubjects(subjectIds: string[]) {
  await requireUser()
  const unique = [...new Set(subjectIds)]
  if (unique.length < 1 || unique.length > 4) throw new Error('Select between 1 and 4 subjects.')
  const { data, error } = await ace.rpc('set_student_subjects', { p_subject_ids: unique })
  if (error) throw error
  return data ?? []
}

export async function saveStudentFoundation(input: {
  display_name: string
  target_score: number
  institution: string
  course: string
  daily_minutes: number
  subject_ids: string[]
}) {
  await requireUser()
  const displayName = input.display_name.trim()
  const institution = input.institution.trim()
  const course = input.course.trim()
  const uniqueSubjects = [...new Set(input.subject_ids)]

  if (!displayName || displayName.length > 80) throw new Error('Display name must be 1–80 characters.')
  if (!Number.isInteger(input.target_score) || input.target_score < 0 || input.target_score > 400) throw new Error('Target score must be between 0 and 400.')
  if (!institution || institution.length > 160) throw new Error('Intended institution must be 1–160 characters.')
  if (!course || course.length > 160) throw new Error('Intended course must be 1–160 characters.')
  if (!Number.isInteger(input.daily_minutes) || input.daily_minutes < 1 || input.daily_minutes > 1440) throw new Error('Study time must be between 1 and 1440 minutes.')
  if (uniqueSubjects.length < 1 || uniqueSubjects.length > 4) throw new Error('Select between 1 and 4 subjects.')

  const { error } = await ace.rpc('save_student_foundation', {
    p_display_name: displayName,
    p_target_score: input.target_score,
    p_institution: institution,
    p_course: course,
    p_daily_minutes: input.daily_minutes,
    p_subject_ids: uniqueSubjects,
  })
  if (error) throw error
}

export async function saveStudentFoundationFromCatalog(input: {
  display_name: string
  target_score: number
  institution_id: string
  program_id: string
  daily_minutes: number
}) {
  await requireUser()
  const displayName = input.display_name.trim()
  if (!displayName || displayName.length > 80) throw new Error('Display name must be 1–80 characters.')
  if (!Number.isInteger(input.target_score) || input.target_score < 0 || input.target_score > 400) throw new Error('Target score must be between 0 and 400.')
  if (!input.institution_id || !input.program_id) throw new Error('Select an institution and course.')
  if (!Number.isInteger(input.daily_minutes) || input.daily_minutes < 1 || input.daily_minutes > 1440) throw new Error('Study time must be between 1 and 1440 minutes.')

  const { error } = await ace.rpc('save_student_foundation_catalog', {
    p_display_name: displayName,
    p_target_score: input.target_score,
    p_institution_id: input.institution_id,
    p_program_id: input.program_id,
    p_daily_minutes: input.daily_minutes,
  })
  if (error) throw error
}

export async function getStudentSubjects() {
  const user = await requireUser()
  const { data, error } = await ace.from('student_subjects').select('subject_id,is_primary,sort_order').eq('user_id', user.id).order('sort_order')
  if (error) throw error
  return data ?? []
}

import { ace } from './supabase'
import { studentSyllabusRows } from './studentSyllabus'

export type ExamSeason = {
  id: string
  code: string
  name: string
  starts_at: string | null
  ends_at: string | null
  exam_year: number
  status: 'draft' | 'active' | 'closed' | 'archived'
  metadata: Record<string, unknown>
}

export type ExamConfig = {
  id: string
  season_id: string
  name: string
  duration_seconds: number
  total_questions: number
  option_count: number
  composition: Record<string, unknown>
  rules: Record<string, unknown>
  version: number
  active: boolean
}

export type ExamConfigSubject = {
  exam_config_id: string
  subject_id: string
  required: boolean
  question_count: number
  sort_order: number
  metadata: Record<string, unknown>
}

export type SyllabusVersion = {
  id: string
  season_id: string
  subject_id: string
  version: number
  title: string
  source_url: string | null
  source_title: string | null
  rights_status: 'pending' | 'approved' | 'restricted' | 'rejected'
  provenance: Record<string, unknown>
  status: 'draft' | 'active' | 'archived'
  activated_at: string | null
}

export type SyllabusTopic = {
  id: string
  subject_id: string
  syllabus_version_id: string | null
  name: string
  description: string | null
  sort_order: number
  active: boolean
}

export type SyllabusSubtopic = {
  id: string
  topic_id: string
  syllabus_version_id: string | null
  name: string
  description: string | null
  sort_order: number
  active: boolean
}

export type Institution = {
  id: string
  jamb_code: string | null
  name: string
  institution_type: 'university' | 'polytechnic' | 'college_of_education' | 'other'
  ownership: 'federal' | 'state' | 'private' | 'other' | null
  state: string | null
  status: 'draft' | 'active' | 'suspended' | 'archived'
  source_url: string | null
  provenance: Record<string, unknown>
}

export type Program = {
  id: string
  institution_id: string
  jamb_code: string | null
  name: string
  award_level: string
  duration_years: number | null
  status: 'draft' | 'active' | 'suspended' | 'archived'
  source_url: string | null
  provenance: Record<string, unknown>
}

export type ProgramUtmeRule = {
  id: string
  season_id: string
  program_id: string
  required_subject_ids: string[]
  alternative_groups: Array<Record<string, unknown>>
  minimum_optional_subjects: number
  notes: string | null
  source_url: string | null
  provenance: Record<string, unknown>
  status: 'draft' | 'active' | 'archived'
  version: number
}

export async function getActiveExamBlueprint() {
  const { data, error } = await ace.rpc('get_active_exam_blueprint')
  if (error) throw error
  return data as {
    season?: ExamSeason
    config?: ExamConfig
    subjects?: ExamConfigSubject[]
  }
}

export async function listSeasons() {
  const { data, error } = await ace
    .from('exam_seasons')
    .select('*')
    .in('status', ['draft', 'active', 'closed'])
    .order('exam_year', { ascending: false })
  if (error) throw error
  return (data ?? []) as ExamSeason[]
}

export async function listActiveSyllabusVersions(seasonId: string) {
  const { data, error } = await ace
    .from('syllabus_versions')
    .select('*')
    .eq('season_id', seasonId)
    .eq('status', 'active')
    .order('subject_id')
  if (error) throw error
  return (data ?? []) as SyllabusVersion[]
}

export async function getSyllabusTree(syllabusVersionId: string) {
  const [{ data: topics, error: topicsError }, { data: subtopics, error: subtopicsError }] = await Promise.all([
    ace.from('topics').select('id,subject_id,syllabus_version_id,name,description,sort_order,active').eq('syllabus_version_id', syllabusVersionId).eq('active', true).order('sort_order'),
    ace.from('subtopics').select('id,topic_id,syllabus_version_id,name,description,sort_order,active').eq('syllabus_version_id', syllabusVersionId).eq('active', true).order('sort_order'),
  ])
  if (topicsError) throw topicsError
  if (subtopicsError) throw subtopicsError
  return {
    topics: studentSyllabusRows((topics ?? []) as SyllabusTopic[]),
    subtopics: studentSyllabusRows((subtopics ?? []) as SyllabusSubtopic[]),
  }
}

export async function listInstitutions() {
  const { data, error } = await ace
    .from('institutions')
    .select('*')
    .eq('status', 'active')
    .order('name')
  if (error) throw error
  return (data ?? []) as Institution[]
}

export async function listPrograms(institutionId: string) {
  const { data, error } = await ace
    .from('programs')
    .select('*')
    .eq('institution_id', institutionId)
    .eq('status', 'active')
    .order('name')
  if (error) throw error
  return (data ?? []) as Program[]
}

export async function getProgramUtmeRule(seasonId: string, programId: string) {
  const { data, error } = await ace
    .from('program_utme_rules')
    .select('*')
    .eq('season_id', seasonId)
    .eq('program_id', programId)
    .eq('status', 'active')
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data as ProgramUtmeRule | null
}

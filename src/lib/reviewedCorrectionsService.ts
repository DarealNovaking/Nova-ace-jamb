import { ace } from './supabase'
import data from '../data/fcb02RemainingCorrections.json'
import { executeReviewedCorrections, planReviewedCorrections, type CorrectionSnapshot, type CorrectionStore, type ReviewedCorrection } from './reviewedCorrectionPlan'

export const reviewedCorrections: readonly ReviewedCorrection[] = data
const versionIds = [...new Set(reviewedCorrections.map((p) => p.expected.syllabus_version_id))]
const rowIds = reviewedCorrections.map((p) => p.expected.id)
const store: CorrectionStore = {
  async read() {
    const [versions, rows] = await Promise.all([
      ace.from('syllabus_versions').select('id,status,rights_status').in('id', versionIds),
      ace.from('subtopics').select('id,topic_id,syllabus_version_id,name,description,sort_order,active').in('id', rowIds),
    ])
    if (versions.error) throw versions.error
    if (rows.error) throw rows.error
    return { versions: versions.data ?? [], rows: rows.data ?? [] } as CorrectionSnapshot
  },
  async update(patch) {
    const row = patch.expected
    let request = ace.from('subtopics').update(patch.changes).eq('id', row.id)
      .eq('syllabus_version_id', row.syllabus_version_id).eq('topic_id', row.topic_id)
      .eq('name', row.name).eq('sort_order', row.sort_order).eq('active', false)
    request = row.description === null ? request.is('description', null) : request.eq('description', row.description)
    const { data: saved, error } = await request.select('id').single()
    if (error) throw error
    return typeof saved?.id === 'string' ? saved.id : null
  },
}

export async function checkReviewedCorrections() {
  return planReviewedCorrections(reviewedCorrections, await store.read())
}
export async function applyReviewedCorrections() {
  // Fresh preflight, sequential conditional writes, then independent read-back.
  // This is resumable; separate REST requests are not an atomic transaction.
  return executeReviewedCorrections(reviewedCorrections, store)
}

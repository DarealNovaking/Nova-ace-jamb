import { ace } from './supabase'

export type ReviewAction = 'preview' | 'stage' | 'undo'
export type ReviewPackageState = {
  state: 'not_staged' | 'staged'
  can_stage: boolean
  can_undo: boolean
  changed: boolean
  versions: number
  topics: number
  subtopics: number
  target_year: 2027
  publication_allowed: false
  rights_status: 'pending'
}

export async function manageSyllabusReview(action: ReviewAction): Promise<ReviewPackageState> {
  // Only requested after the administrator panel mounts; never bundled into student pages.
  const { default: fixedPackage } = await import('../data/fcb02ReviewPayload.json')
  const { data, error } = await ace.rpc('manage_fcb02_draft', {
    p_action: action,
    p_review_digest: fixedPackage.digest,
    p_package: fixedPackage.payload,
  })
  if (error) {
    if (error.code === 'PGRST202' || error.code === '42883') throw new Error('REVIEW_HELPER_UNAVAILABLE')
    throw new Error('REVIEW_ACTION_UNCONFIRMED')
  }
  const staged = data?.state === 'staged'
  if (!data || (!staged && data.state !== 'not_staged') || data.target_year !== 2027 ||
    data.publication_allowed !== false || data.rights_status !== 'pending' ||
    data.versions !== (staged ? 25 : 0) || data.topics !== (staged ? 214 : 0) || data.subtopics !== (staged ? 954 : 0) ||
    data.can_stage !== !staged || typeof data.can_undo !== 'boolean' || (!staged && data.can_undo) || typeof data.changed !== 'boolean') {
    throw new Error('REVIEW_ACTION_UNCONFIRMED')
  }
  return data as ReviewPackageState
}

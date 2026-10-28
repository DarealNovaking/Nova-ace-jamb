export type CorrectionRow = {
  id: string; topic_id: string; syllabus_version_id: string; name: string
  description: string | null; sort_order: number; active: boolean
}
export type ReviewedCorrection = {
  review_id: string; label: string; expected: CorrectionRow
  changes: Partial<Pick<CorrectionRow, 'name' | 'description'>>
}
export type CorrectionSnapshot = {
  versions: Array<{ id: string; status: string; rights_status: string }>
  rows: CorrectionRow[]
}
export type CorrectionPlan = { total: number; completed: number; remaining: ReviewedCorrection[] }
export type CorrectionStore = {
  read: () => Promise<CorrectionSnapshot>
  update: (patch: ReviewedCorrection) => Promise<string | null>
}
const fields = ['id', 'topic_id', 'syllabus_version_id', 'name', 'description', 'sort_order', 'active'] as const
const matches = (a: CorrectionRow, b: CorrectionRow) => fields.every((key) => a[key] === b[key])

export function planReviewedCorrections(patches: readonly ReviewedCorrection[], snapshot: CorrectionSnapshot): CorrectionPlan {
  if (new Set(patches.map((p) => p.expected.id)).size !== patches.length
    || new Set(snapshot.rows.map((r) => r.id)).size !== snapshot.rows.length
    || new Set(snapshot.versions.map((v) => v.id)).size !== snapshot.versions.length) throw new Error('CORRECTION_DRIFT')
  const remaining: ReviewedCorrection[] = []
  let completed = 0
  for (const patch of patches) {
    const keys = Object.keys(patch.changes)
    if (!keys.length || keys.some((key) => key !== 'name' && key !== 'description') || patch.expected.active !== false) throw new Error('CORRECTION_SCOPE')
    if ('name' in patch.changes && (typeof patch.changes.name !== 'string' || !patch.changes.name.trim() || patch.changes.name.length > 200)) throw new Error('CORRECTION_SCOPE')
    if ('description' in patch.changes && patch.changes.description !== null && (typeof patch.changes.description !== 'string' || patch.changes.description.length > 2000)) throw new Error('CORRECTION_SCOPE')
    const version = snapshot.versions.find((v) => v.id === patch.expected.syllabus_version_id)
    const row = snapshot.rows.find((r) => r.id === patch.expected.id)
    if (!version || version.status !== 'draft' || version.rights_status !== 'pending' || !row) throw new Error('CORRECTION_DRIFT')
    if (matches(row, { ...patch.expected, ...patch.changes })) completed += 1
    else if (matches(row, patch.expected)) remaining.push(patch)
    else throw new Error('CORRECTION_DRIFT')
  }
  return { total: patches.length, completed, remaining }
}

export async function executeReviewedCorrections(patches: readonly ReviewedCorrection[], store: CorrectionStore): Promise<CorrectionPlan> {
  const plan = planReviewedCorrections(patches, await store.read())
  if (!plan.remaining.length) return plan
  for (const patch of plan.remaining) {
    if (await store.update(patch) !== patch.expected.id) throw new Error('CORRECTION_UNCONFIRMED')
  }
  const verified = planReviewedCorrections(patches, await store.read())
  if (verified.remaining.length) throw new Error('CORRECTION_UNCONFIRMED')
  return verified
}

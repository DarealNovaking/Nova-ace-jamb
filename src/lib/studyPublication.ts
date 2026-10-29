export type StudyAction = 'check' | 'publish' | 'withdraw'
export type StudyState = 'absent' | 'published' | 'withdrawn'
export type StudyResult = { state: StudyState; changed: boolean; digest: string; versions: number; topics: number; concepts: number; source_year: 2026 }
export const studyDigest = '77045759503d5b89be336dad2942bebc9eb67540c1c63c81d75db5324370ba7f'

export function parseStudyResult(value: unknown): StudyResult {
  const v = value as Partial<StudyResult> | null
  if (!v || !['absent','published','withdrawn'].includes(v.state ?? '') || typeof v.changed !== 'boolean' || v.digest !== studyDigest || v.source_year !== 2026 || v.versions !== (v.state === 'absent' ? 0 : 25) || (v.state === 'withdrawn' ? !Number.isInteger(v.topics) || (v.topics ?? -1) < 0 || !Number.isInteger(v.concepts) || (v.concepts ?? -1) < 0 : v.topics !== (v.state === 'absent' ? 0 : 108) || v.concepts !== (v.state === 'absent' ? 0 : 1167))) throw new Error('Unexpected study-index state')
  return v as StudyResult
}

export async function changeStudyIndex(action: Exclude<StudyAction, 'check'>, request: (action: StudyAction) => Promise<unknown>): Promise<StudyResult> {
  const result = parseStudyResult(await request(action))
  const expected = action === 'publish' ? 'published' : 'withdrawn'
  if (result.state !== expected) throw new Error('Study-index change was not confirmed')
  const checked = parseStudyResult(await request('check'))
  if (checked.state !== expected) throw new Error('Study-index readback was not confirmed')
  return checked
}

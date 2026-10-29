export type PracticeBaselineState = {
  state: 'ready' | 'created' | 'exists'
  config_id: string
  source_year: 2026
  subject_count: 25
  active: false
}
export type BaselineAction = 'check' | 'create'
export function parsePracticeBaseline(data: unknown, action: BaselineAction): PracticeBaselineState {
  const row = data as Partial<PracticeBaselineState> | null
  if (!row || row.config_id !== '396d1910-d458-5d5f-8484-380bc8c71919' || row.source_year !== 2026 ||
      row.subject_count !== 25 || row.active !== false ||
      !(action === 'check' ? ['ready', 'exists'] : ['created', 'exists']).includes(row.state ?? '')) {
    throw new Error('Practice draft could not be confirmed')
  }
  return row as PracticeBaselineState
}
export async function createPracticeBaseline(run: (action: BaselineAction) => Promise<unknown>): Promise<PracticeBaselineState> {
  parsePracticeBaseline(await run('create'), 'create')
  const persisted = parsePracticeBaseline(await run('check'), 'check')
  if (persisted.state !== 'exists') throw new Error('Practice draft could not be confirmed')
  return persisted
}

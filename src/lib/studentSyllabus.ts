/** Preserve metadata while keeping reserved administrative notes out of study text. */
export function studentSyllabusRows<T extends { description: string | null }>(rows: readonly T[]): T[] {
  return rows.map(row => ({ ...row, description: /^\s*EDITORIAL REVIEW DRAFT\b/.test(row.description ?? '') ? null : row.description }))
}


export function studyIndexReference(version: { source_url: string | null; provenance: Record<string, unknown> }) {
  if (version.provenance.package !== 'fcb-02-original-study-index') return {}
  let sourceUrl: string | null = null
  try {
    const url = new URL(version.source_url ?? '')
    if (url.protocol === 'https:' && url.hostname === 'ibass.jamb.gov.ng' && !url.username && !url.password && !url.port && /^\/static\/media\/[^/]+\.pdf$/.test(url.pathname)) sourceUrl = url.href
  } catch { /* Invalid source links are omitted. */ }
  return { independentStudyIndex: true, sourceUrl }
}

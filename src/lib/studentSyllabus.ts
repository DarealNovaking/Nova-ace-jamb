/** Preserve metadata while keeping reserved administrative notes out of study text. */
export function studentSyllabusRows<T extends { description: string | null }>(rows: readonly T[]): T[] {
  return rows.map(row => ({ ...row, description: /^\s*EDITORIAL REVIEW DRAFT\b/.test(row.description ?? '') ? null : row.description }))
}

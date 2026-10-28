export function normalizeSubtopicEdit(name: string, order: string): { name: string; sort_order: number } {
  const trimmed = name.trim()
  const sortOrder = Number(order)
  if (!trimmed || trimmed.length > 200) throw new Error('Invalid subtopic name')
  if (!/^\d+$/.test(order) || !Number.isInteger(sortOrder) || sortOrder > 2147483647) {
    throw new Error('Invalid subtopic order')
  }
  return { name: trimmed, sort_order: sortOrder }
}

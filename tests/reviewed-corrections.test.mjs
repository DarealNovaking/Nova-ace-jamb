import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
const source = readFileSync(new URL('../src/lib/reviewedCorrectionPlan.ts', import.meta.url), 'utf8')
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const { planReviewedCorrections, executeReviewedCorrections } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
const row = { id: 'row-1', topic_id: 'topic-1', syllabus_version_id: 'version-1', name: 'Old label', description: null, sort_order: 40, active: false }
const patch = { review_id: 'test-1', label: 'Reviewed correction', expected: row, changes: { name: 'Correct source label' } }
const version = { id: 'version-1', status: 'draft', rights_status: 'pending' }
const snapshot = () => ({ versions: [structuredClone(version)], rows: [structuredClone(row)] })

test('plans an exact pending draft update without mutating snapshots', () => {
 const s = snapshot(); const before = JSON.stringify(s); const p = planReviewedCorrections([patch], s)
 assert.equal(p.completed, 0); assert.equal(p.remaining.length, 1); assert.equal(p.remaining[0].changes.name, 'Correct source label'); assert.equal(JSON.stringify(s), before)
})
test('an already-corrected draft needs no second write', async () => {
 const s = snapshot(); s.rows[0].name = 'Correct source label'
 const p = await executeReviewedCorrections([patch], { read: async () => s, update: async () => { throw new Error('Duplicate write') } })
 assert.equal(p.completed, 1); assert.equal(p.remaining.length, 0)
})
test('refuses changed content, publication state, missing rows and extra mutation fields', () => {
 for (const change of [{ name: 'Unreviewed label' }, { active: true }, { description: 'Edited note' }, { sort_order: 41 }, { topic_id: 'other' }]) {
  const s = snapshot(); Object.assign(s.rows[0], change); assert.throws(() => planReviewedCorrections([patch], s))
 }
 for (const change of [{ status: 'active' }, { rights_status: 'approved' }]) {
  const s = snapshot(); Object.assign(s.versions[0], change); assert.throws(() => planReviewedCorrections([patch], s))
 }
 assert.throws(() => planReviewedCorrections([patch], { versions: [version], rows: [] }))
 assert.throws(() => planReviewedCorrections([{ ...patch, changes: { active: true } }], snapshot()))
})
test('writes only pending corrections and verifies persisted state', async () => {
 const s = snapshot()
 const p = await executeReviewedCorrections([patch], { read: async () => s, update: async (p) => { s.rows[0].name = p.changes.name; return 'row-1' } })
 assert.equal(s.rows[0].name, 'Correct source label'); assert.equal(s.rows[0].active, false); assert.equal(p.completed, 1)
})
test('does not claim success when a write returns no ID or does not persist', async () => {
 await assert.rejects(executeReviewedCorrections([patch], { read: async () => snapshot(), update: async () => null }))
 await assert.rejects(executeReviewedCorrections([patch], { read: async () => snapshot(), update: async () => 'row-1' }))
})
test('resumes after a partial response failure without duplicating a saved change', async () => {
 const s = snapshot()
 await assert.rejects(executeReviewedCorrections([patch], { read: async () => s, update: async () => { s.rows[0].name = 'Correct source label'; throw new Error('Response lost') } }))
 const p = await executeReviewedCorrections([patch], { read: async () => s, update: async () => { throw new Error('Duplicate write') } }); assert.equal(p.completed, 1)
})
test('fills a missing source note without changing name, order or inactive status', async () => {
 const s = snapshot(); const note = { ...patch, changes: { description: 'Reviewed source locator' } }
 const p = await executeReviewedCorrections([note], { read: async () => s, update: async (p) => { s.rows[0].description = p.changes.description; return 'row-1' } })
 assert.equal(p.completed, 1); assert.equal(s.rows[0].name, 'Old label'); assert.equal(s.rows[0].sort_order, 40); assert.equal(s.rows[0].active, false)
})

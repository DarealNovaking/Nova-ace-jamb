import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const source = readFileSync(new URL('../src/lib/syllabusEdit.ts', import.meta.url), 'utf8')
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const { normalizeSubtopicEdit } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)

test('trims a corrected label and preserves valid display-order boundaries', () => {
  assert.deepEqual(normalizeSubtopicEdit('  Nervous system and sense organs  ', '161'), { name: 'Nervous system and sense organs', sort_order: 161 })
  assert.deepEqual(normalizeSubtopicEdit('Grammar', '0'), { name: 'Grammar', sort_order: 0 })
  assert.deepEqual(normalizeSubtopicEdit('Grammar', '2147483647'), { name: 'Grammar', sort_order: 2147483647 })
})

test('rejects blank or oversized labels before any write', () => {
  for (const name of ['', '   ', 'a'.repeat(201)]) assert.throws(() => normalizeSubtopicEdit(name, '10'))
})

test('rejects missing, fractional, negative, nonnumeric and out-of-range display order', () => {
  for (const order of ['', ' ', '1.5', '-1', 'Infinity', 'NaN', '1e2', '2147483648']) assert.throws(() => normalizeSubtopicEdit('Grammar', order))
})

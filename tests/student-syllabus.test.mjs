import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
const code = ts.transpileModule(readFileSync(new URL('../src/lib/studentSyllabus.ts', import.meta.url), 'utf8'), {compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
const { studentSyllabusRows } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
test('reserved provenance is omitted from student text without changing the source', () => {
 const input = [{id:'one',name:'Inference',active:true,description:'  EDITORIAL REVIEW DRAFT ABC. Source SHA-256: internal.'}]
 const result = studentSyllabusRows(input)
 assert.equal(result[0].description, null)
 assert.equal(result[0].id, 'one'); assert.equal(result[0].name, 'Inference'); assert.equal(result[0].active, true)
 assert.match(input[0].description, /Source SHA/); assert.notEqual(result[0], input[0])
})
test('ordinary descriptions, null and empty strings are preserved', () => {
 const rows = ['Draw conclusions from a passage.', 'Compare an editorial draft with its revision.', '', null].map(description => ({description}))
 assert.deepEqual(studentSyllabusRows(rows), rows)
 assert.deepEqual(studentSyllabusRows([]), [])
})

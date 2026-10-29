import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
const code = ts.transpileModule(readFileSync(new URL('../src/lib/studentSyllabus.ts', import.meta.url), 'utf8'), {compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
const { studentSyllabusRows, studyIndexReference } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
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

test('independent index disclosure uses only official safe coverage links', () => {
 const provenance = {package:'fcb-02-original-study-index'}
 assert.deepEqual(studyIndexReference({provenance:{},source_url:'https://example.test'}), {})
 assert.equal(studyIndexReference({provenance,source_url:'https://ibass.jamb.gov.ng/static/media/English.abc.pdf'}).sourceUrl, 'https://ibass.jamb.gov.ng/static/media/English.abc.pdf')
 for(const source_url of ['javascript:alert(1)','https://evil.test/file.pdf','http://ibass.jamb.gov.ng/static/media/a.pdf','https://ibass.jamb.gov.ng@evil.test/static/media/a.pdf','https://ibass.jamb.gov.ng:8443/static/media/a.pdf',null]){
  assert.deepEqual(studyIndexReference({provenance,source_url}),{independentStudyIndex:true,sourceUrl:null})
 }
})

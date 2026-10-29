import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
const code = ts.transpileModule(readFileSync(new URL('../src/lib/studyPublication.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
const {parseStudyResult,changeStudyIndex,studyDigest} = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
const response=state=>({state,changed:false,digest:studyDigest,versions:state==='absent'?0:25,topics:state==='absent'?0:108,concepts:state==='absent'?0:1167,source_year:2026})
test('rejects malformed, wrong-package and inconsistent readback',()=>{
 for(const bad of [null,{},response('other'),{...response('published'),digest:'other'},{...response('published'),concepts:1},{...response('published'),source_year:2027},{...response('absent'),versions:25}])assert.throws(()=>parseStudyResult(bad))
 for(const state of ['absent','published','withdrawn'])assert.equal(parseStudyResult(response(state)).state,state)
})
test('publication and withdrawal require persisted readback',async()=>{
 for(const action of ['publish','withdraw']){
  const calls=[], state=action==='publish'?'published':'withdrawn'
  assert.equal((await changeStudyIndex(action,async a=>{calls.push(a);return response(state)})).state,state)
  assert.deepEqual(calls,[action,'check'])
  await assert.rejects(()=>changeStudyIndex(action,async a=>response(a==='check'?'absent':state)))
 }
})
test('uncertain errors never become success',async()=>{
 await assert.rejects(()=>changeStudyIndex('publish',async()=>{throw Error('network')}))
 await assert.rejects(()=>changeStudyIndex('publish',async()=>response('withdrawn')))
})

test('withdrawal confirms safe takedown after count drift while publication stays exact',()=>{
 assert.equal(parseStudyResult({...response('withdrawn'),topics:109,concepts:1168}).state,'withdrawn')
 for(const counts of [{topics:-1},{concepts:1.5},{topics:NaN}])assert.throws(()=>parseStudyResult({...response('withdrawn'),...counts}))
 assert.throws(()=>parseStudyResult({...response('published'),topics:109}))
})

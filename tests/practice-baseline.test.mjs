import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import ts from 'typescript'
const code=ts.transpileModule(readFileSync(new URL('../src/lib/practiceBaseline.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
const {parsePracticeBaseline,createPracticeBaseline}=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
const response=(state)=>({state,config_id:'396d1910-d458-5d5f-8484-380bc8c71919',source_year:2026,subject_count:25,active:false})
test('accepts the exact inactive draft state for check and create',()=>{
 assert.equal(parsePracticeBaseline(response('ready'),'check').state,'ready')
 assert.equal(parsePracticeBaseline(response('created'),'create').state,'created')
 assert.equal(parsePracticeBaseline(response('exists'),'check').state,'exists')
})
test('rejects active, missing, wrong-year, wrong-ID and inconsistent states',()=>{
 for(const bad of [null,{},response('invalid'),{...response('exists'),active:true},{...response('exists'),source_year:2027},{...response('exists'),subject_count:24},{...response('exists'),config_id:'other'}])assert.throws(()=>parsePracticeBaseline(bad,'check'))
 assert.throws(()=>parsePracticeBaseline(response('created'),'check'))
 assert.throws(()=>parsePracticeBaseline(response('ready'),'create'))
})
test('checks persisted state after creation before reporting success',async()=>{
 const actions=[]
 const out=await createPracticeBaseline(async action=>{actions.push(action);return response(action==='create'?'created':'exists')})
 assert.deepEqual(actions,['create','check']);assert.equal(out.state,'exists')
})
test('refuses success when creation fails or readback remains ready',async()=>{
 await assert.rejects(()=>createPracticeBaseline(async()=>{throw Error('network')}))
 await assert.rejects(()=>createPracticeBaseline(async action=>response(action==='create'?'created':'ready')))
})

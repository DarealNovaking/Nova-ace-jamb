import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
const moduleUrl=path=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64')
const moduleUrlFromCode=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64')
const richContent=moduleUrl('../src/lib/richContent.ts')
const workflowSource=readFileSync(new URL('../src/lib/questionWorkflow.ts',import.meta.url),'utf8').replace(/from (["'])\.\/richContent\1/g,(_,q)=>'from '+JSON.stringify(richContent))
const workflow=moduleUrlFromCode(ts.transpileModule(workflowSource,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText)
const code=ts.transpileModule(readFileSync(new URL('../src/lib/questionImport.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replaceAll("'./questionWorkflow'",JSON.stringify(workflow)).replaceAll('"./questionWorkflow"',JSON.stringify(workflow))
const {QUESTION_IMPORT_COLUMNS,parseQuestionImport,runQuestionImport}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))
const subject='03000000-0000-4000-8000-000000000001',topic='03000000-0000-4000-8000-000000000002'
const taxonomy={subject_id:subject,topic_id:topic,subtopic_id:null}
const columns=['question','option_a','option_b','option_c','option_d','correct_option','explanation','difficulty','attribution','exam_year','source_kind','source_title','author','source_url','rights_evidence']
const cells=(question='What is 3 + 4?')=>[question,'5','6','7','8','C','Adding four to three gives seven.','easy','ACE practice','','original','ACE arithmetic','ACE team','','Original exercise.']
const csv=(rows=[cells()])=>[columns,...rows].map(row=>row.map(x=>'"'+x.replaceAll('"','""')+'"').join(',')).join('\r\n')
const saved=row=>({...row.draft,id:row.id,content_version:1,review_status:'draft',rights_status:'unknown',active:false,created_by:subject,reviewed_by:null,provenance:{...row.draft.provenance,last_content_editor:subject}})
test('CSV template has the complete documented contract',()=>assert.deepEqual(QUESTION_IMPORT_COLUMNS,columns))
test('parses BOM, quotes, embedded newlines and Unicode without interpreting markup',()=>{
 const values=cells('Which says "yes",\r\non line 2? <img src=x> π');const rows=parseQuestionImport('\uFEFF'+csv([values])+'\r\n',taxonomy)
 assert.equal(rows.length,1);assert.equal(rows[0].error,null);assert.equal(rows[0].draft.stem,values[0]);assert.equal(rows[0].draft.topic_id,topic);assert.equal(rows[0].draft.exam_year,null)
 assert.match(rows[0].id,/^[0-9a-f-]{36}$/)
})
test('rejects malformed quotes, unexpected data after quote and row widths',()=>{
 for(const body of [csv()+'\r\n"unterminated',csv()+'\r\n"closed"bad',columns.join(',')+'\na,b'])assert.throws(()=>parseQuestionImport(body,taxonomy),/CSV|columns/i)
})
test('rejects unknown/duplicate headers, empty uploads and bounds',()=>{
 for(const body of ['',columns.join(','),csv().replace('rights_evidence','active'),csv().replace('option_d','option_c'),csv(Array.from({length:101},(_,i)=>cells('Q'+i))),'x'.repeat(1048577)])assert.throws(()=>parseQuestionImport(body,taxonomy))
})
test('validates every row and marks normalized duplicates, answers and missing sources',()=>{
 const a=cells(),b=cells('  WHAT is 3 + 4?  '),c=cells('Other question');c[5]='E';const d=cells('No proof');d[14]=''
 const rows=parseQuestionImport(csv([a,b,c,d]),taxonomy)
 assert.match(rows[1].error,/duplicate/i);assert.equal(rows[2].draft,null);assert.ok(rows[2].error);assert.ok(rows[3].error)
})
test('licensed historic sources retain explicit year and refuse false original attribution',()=>{
 const values=cells();values[8]='JAMB';values[9]='2020';values[10]='licensed';values[13]='https://example.com/licence'
 assert.equal(parseQuestionImport(csv([values]),taxonomy)[0].draft.exam_year,2020)
 values[10]='original';assert.ok(parseQuestionImport(csv([values]),taxonomy)[0].error)
 values[10]='licensed';values[13]='javascript:alert(1)';assert.ok(parseQuestionImport(csv([values]),taxonomy)[0].error)
})
test('one invalid row blocks the whole batch before any write',async()=>{
 let writes=0;const b=cells('invalid');b[5]='Z'
 await assert.rejects(()=>runQuestionImport(parseQuestionImport(csv([cells(),b]),taxonomy),async()=>{writes++},()=>true,()=>{}))
 assert.equal(writes,0)
})
test('saves sequentially with stable preview IDs and reports only confirmed drafts',async()=>{
 const rows=parseQuestionImport(csv([cells(),cells('Next question')]),taxonomy);const calls=[],progress=[]
 const results=await runQuestionImport(rows,async row=>{calls.push(row.id);return saved(row)},()=>true,rows=>progress.push(rows.map(x=>x.state)))
 assert.deepEqual(calls,rows.map(x=>x.id));assert.deepEqual(results.map(x=>x.state),['saved','saved']);assert.equal(progress.at(-1).filter(x=>x==='saved').length,2)
})
test('stops on a denied or mismatched readback without retry or later writes',async()=>{
 for(const wrong of [false,true]){
 const rows=parseQuestionImport(csv([cells(),cells('Two'),cells('Three')]),taxonomy);let writes=0
 const results=await runQuestionImport(rows,async row=>{writes++;if(writes===2){if(wrong)return {...saved(row),id:subject};throw Error('sensitive internal details')}return saved(row)},()=>true,()=>{})
 assert.equal(writes,2);assert.deepEqual(results.map(x=>x.state),['saved','uncertain','pending']);assert.equal(JSON.stringify(results).includes('sensitive internal'),false)
 }
})
test('cancellation before and during a save prevents further writes and callbacks',async()=>{
 const rows=parseQuestionImport(csv([cells(),cells('Two')]),taxonomy);let active=false,writes=0,callbacks=0
 let result=await runQuestionImport(rows,async row=>{writes++;return saved(row)},()=>active,()=>callbacks++)
 assert.equal(writes,0);assert.ok(result.every(x=>x.state==='pending'))
 active=true;result=await runQuestionImport(rows,async row=>{writes++;active=false;return saved(row)},()=>active,()=>callbacks++)
 assert.equal(writes,1);assert.deepEqual(result.map(x=>x.state),['saved','pending']);assert.equal(callbacks,0)
})

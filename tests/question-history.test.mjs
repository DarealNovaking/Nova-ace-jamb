import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
const data=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64')
const compile=path=>ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
const richContent=data(compile('../src/lib/richContent.ts'))
const code=compile('../src/lib/questionWorkflow.ts').replace(/from (["'])\.\/richContent\1/g,(_,q)=>'from '+JSON.stringify(richContent))
const {parseQuestionHistory,validateQuestionRestore}=await import(data(code))
const id='03000000-0000-4000-8000-000000000001',other='03000000-0000-4000-8000-000000000002'
const snapshot=version=>({id,subject_id:id,topic_id:other,subtopic_id:null,stem:'What is 3 + 4?',options:['5','6','7','8'].map((text,i)=>({key:'ABCD'[i],text})),correct_option_key:'C',explanation:'Three plus four equals seven.',difficulty:'easy',exam:'ACE practice',exam_year:null,review_status:'draft',rights_status:'unknown',active:false,content_version:version,created_by:id,reviewed_by:null,provenance:{source_kind:'original',source_title:'ACE arithmetic',author_label:'ACE team',source_url:null,rights_evidence:'Original exercise.',last_content_editor:id}})
const entry=version=>({version,snapshot:snapshot(version),created_by:id,created_at:'2026-10-29T15:00:00+00:00'})
const page=()=>({question_id:id,current_version:12,versions:Array.from({length:10},(_,i)=>entry(12-i)),has_next:true,next_before:3})
test('parses bounded history with matching identities, ordered snapshots and cursor',()=>{
 const result=parseQuestionHistory(page(),id,null);assert.equal(result.versions.length,10);assert.equal(result.next_before,3)
 const last=parseQuestionHistory({...page(),versions:[entry(2),entry(1)],has_next:false,next_before:null},id,3);assert.equal(last.versions.at(-1).version,1)
})
test('rejects malformed, oversized, unordered, forged or mismatched history readback',()=>{
 const p=page()
 for(const value of [null,{}, {...p,question_id:other},{...p,current_version:0},{...p,versions:Array(11).fill(entry(1))},{...p,versions:[entry(12),entry(12)]},{...p,versions:[entry(13)]},{...p,versions:[{...entry(12),snapshot:{...snapshot(12),id:other}}]},{...p,versions:[{...entry(12),created_at:'not a date'}]},{...p,next_before:4},{...p,has_next:false},{...p,versions:[]}])assert.throws(()=>parseQuestionHistory(value,id,null))
 assert.throws(()=>parseQuestionHistory(p,id,3))
})
test('historical snapshots retain full source/answer validation',()=>{
 const p=page();p.versions[0].snapshot.correct_option_key='Z';assert.throws(()=>parseQuestionHistory(p,id,null))
})
test('restoration requires an older integer revision and bounded trimmed reason',()=>{
 assert.deepEqual(validateQuestionRestore(3,1,'  Fix typo  '),{expected_version:3,source_version:1,reason:'Fix typo'})
 for(const values of [[1,1,'Reason'],[3,3,'Reason'],[3,0,'Reason'],[3,1.5,'Reason'],[3,1,'\t\n'],[3,1,'x'.repeat(2001)],[2147483647,1,'Reason']])assert.throws(()=>validateQuestionRestore(...values))
})

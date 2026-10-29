import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
const code=ts.transpileModule(readFileSync(new URL('../src/lib/questionWorkflow.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
const {validateQuestionDraft,parseQuestionQueue,parseSavedQuestion,questionActions}=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
const author='03000000-0000-4000-8000-000000000001', reviewer='03000000-0000-4000-8000-000000000002'
const draft=()=>({subject_id:author,topic_id:reviewer,subtopic_id:null,stem:'What is 3 + 4?',options:[{key:'A',text:'5'},{key:'B',text:'6'},{key:'C',text:'7'},{key:'D',text:'8'}],correct_option_key:'C',explanation:'Adding four to three gives seven.',difficulty:'easy',exam:'ACE practice',exam_year:null,provenance:{source_kind:'original',source_title:'ACE original arithmetic',author_label:'ACE team',source_url:null,rights_evidence:'Original exercise.'}})
const row=()=>({...draft(),id:author,content_version:1,review_status:'draft',active:false,rights_status:'unknown',created_by:author,reviewed_by:null,provenance:{...draft().provenance,last_content_editor:author}})
test('validates and trims a complete original question',()=>{const p=draft();p.stem='  '+p.stem+'  ';assert.equal(validateQuestionDraft(p).stem,'What is 3 + 4?')})
test('rejects empty, duplicate and mismatched choices',()=>{
 for(const options of [[],draft().options.slice(0,3),draft().options.map(x=>({...x,text:'same'})),draft().options.map(x=>({...x,key:'A'}))])assert.throws(()=>validateQuestionDraft({...draft(),options}))
 assert.throws(()=>validateQuestionDraft({...draft(),correct_option_key:'E'}))
})
test('rejects oversized, missing attribution and false original past-year inputs',()=>{
 for(const p of [{...draft(),stem:'x'.repeat(20001)},{...draft(),explanation:''},{...draft(),exam_year:2026},{...draft(),provenance:{}},{...draft(),active:true},{...draft(),media:[]}])assert.throws(()=>validateQuestionDraft(p))
})
test('rejects hostile links and accepts a documented HTTPS source',()=>{
 for(const source_url of ['javascript:alert(1)','https://user:pass@example.com/','https://example.com/\nBAD'])assert.throws(()=>validateQuestionDraft({...draft(),provenance:{...draft().provenance,source_url}}))
 assert.equal(validateQuestionDraft({...draft(),provenance:{...draft().provenance,source_kind:'licensed',source_url:'https://example.com/licence'}}).provenance.source_kind,'licensed')
})
test('requires correct saved identity and a new revision',()=>{
 assert.equal(parseSavedQuestion(row(),author,0).content_version,1)
 assert.throws(()=>parseSavedQuestion(row(),reviewer,0))
 assert.throws(()=>parseSavedQuestion(row(),author,1))
 assert.throws(()=>parseSavedQuestion({...row(),active:true},author,0))
})
test('validates bounded server pages and refuses malformed rows',()=>{
 const q=parseQuestionQueue({questions:[row()],page:0,has_next:false,actor_role:'editor'},0);assert.equal(q.questions.length,1)
 for(const response of [null,[],{}, {questions:[row()],page:1,has_next:false,actor_role:'admin'},{questions:Array(31).fill(row()),page:0,has_next:false,actor_role:'admin'},{questions:[{}],page:0,has_next:false,actor_role:'admin'}])assert.throws(()=>parseQuestionQueue(response,0))
})
test('hides self-approval and leaves publication to administrators',()=>{
 const q={...row(),review_status:'in_review',content_version:2}
 assert.deepEqual(questionActions(q,author,'admin'),[])
 assert.deepEqual(questionActions(q,reviewer,'editor'),[])
 assert.deepEqual(questionActions(q,reviewer,'admin'),['approve','reject'])
 assert.deepEqual(questionActions({...q,review_status:'approved',reviewed_by:reviewer},author,'admin'),['publish'])
 assert.deepEqual(questionActions({...q,review_status:'published',active:true},reviewer,'admin'),['withdraw'])
})

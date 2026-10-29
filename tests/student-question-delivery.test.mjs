import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync}from'node:fs'
import ts from'typescript'
const data=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64')
const compile=p=>ts.transpileModule(readFileSync(new URL(p,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
const parserSource=data(compile('../src/lib/studentQuestionDelivery.ts'))
const {validateAttemptQuestionRequest,parseAttemptQuestions:parsePaper,parsePublishedQuestionIds,parseStudentQuestionTopics,questionDeliveryPhase}=await import(parserSource)
const attempt='04000000-0000-4000-8000-000000000001',first='03000000-0000-4000-8000-000000000001',second='03000000-0000-4000-8000-000000000002'
const order=ids=>Object.fromEntries(ids.map(id=>[id,['A','B']]))
const parseAttemptQuestions=(value,ids,keys=order(ids))=>parsePaper(value,ids,keys)
const row=id=>({id,question_text:'A reviewed frozen question',options:[{key:'A',text:'First'},{key:'B',text:'Second'}],subject_id:null,topic_id:null,difficulty:'easy'})
test('validates attempt request identity, bounded paper and unique UUIDs',()=>{
 assert.equal(validateAttemptQuestionRequest(attempt,[first],order([first])),attempt)
 for(const [a,ids]of [[null,[first]],['x',[first]],[attempt,[]],[attempt,[first,first]],[attempt,Array(501).fill(first)],[attempt,['bad']]])assert.throws(()=>validateAttemptQuestionRequest(a,ids,order(ids)))
})
test('strictly parses complete frozen paper in server-owned attempt order',()=>{
 const result=parseAttemptQuestions([row(second),row(first)],[second,first]);assert.deepEqual(result.map(x=>x.id),[second,first]);assert.equal(result[0].text,'A reviewed frozen question');assert.equal(result[0].options[1].key,'B')
})
test('rejects missing, extra, duplicate and reordered paper records',()=>{
 for(const value of [null,{},[],[row(first)],[row(first),row(first)],[row(second),row(first)],[row(first),row(second),row(attempt)]])assert.throws(()=>parseAttemptQuestions(value,[first,second]))
})
test('refuses answer leakage, invalid options, oversized text and malformed taxonomy',()=>{
 for(const change of [{correct_option_key:'A'},{explanation:'Private explanation'},{question_text:''},{question_text:'x'.repeat(20001)},{options:[]},{options:[{key:'A',text:'First',is_correct:true}]},{options:[{key:'A',text:'First'},{key:'A',text:'Again'}]},{subject_id:'bad'},{difficulty:'unknown'},{difficulty:['easy']}])assert.throws(()=>parseAttemptQuestions([{...row(first),...change}],[first]))
})
test('published metadata IDs are bounded distinct UUIDs, not question records',()=>{
 assert.deepEqual(parsePublishedQuestionIds([first,second],2),[first,second]);assert.deepEqual(parsePublishedQuestionIds([],20),[])
 for(const value of [null,[first,first],['bad'],[first,second],[row(first)]])assert.throws(()=>parsePublishedQuestionIds(value,1))
})
test('topic evidence accepts only distinct requested metadata, no answer fields',()=>{
 const mapping={id:first,subject_id:attempt,topic_id:second,subtopic_id:null}
 assert.deepEqual(parseStudentQuestionTopics([mapping],[first]),[mapping]);assert.deepEqual(parseStudentQuestionTopics([],[first]),[])
 for(const value of [[{...mapping,id:attempt}],[mapping,mapping],[{...mapping,stem:'private'}],[{...mapping,subject_id:null}]])assert.throws(()=>parseStudentQuestionTopics(value,[first]))
})
const state=globalThis.__aceDeliveryTest={calls:[],data:null,error:null}
const fake=data(`export const ace={rpc:async(name,args)=>{const s=globalThis.__aceDeliveryTest;s.calls.push({name,args});return {data:s.data,error:s.error}},from(){throw Error('Direct question reads forbidden')}};export const supabase={auth:{getUser:async()=>({data:{user:{id:'${attempt}'}},error:null})}}`)
const serviceCode=compile('../src/lib/cbtService.ts').replace("from './supabase'",'from '+JSON.stringify(fake)).replace("from './studentQuestionDelivery'",'from '+JSON.stringify(parserSource))
const {loadCbtQuestions}=await import(data(serviceCode))
test('CBT service sends actual attempt ID to the installed RPC and never queries questions',async()=>{
 state.calls=[];state.error=null;state.data=[row(first)];const result=await loadCbtQuestions(attempt,[first],order([first]));assert.equal(result[0].id,first);assert.deepEqual(state.calls,[{name:'get_attempt_questions',args:{p_attempt_id:attempt}}])
})
test('delivery refusal propagates without another RPC, fallback or partial paper',async()=>{
 state.calls=[];state.data=null;state.error={code:'P0002',message:'Attempt questions unavailable'};await assert.rejects(loadCbtQuestions(attempt,[first],order([first])));assert.equal(state.calls.length,1);state.error=null;state.data=[];await assert.rejects(loadCbtQuestions(attempt,[first],order([first])))
})

test('expired or closed attempts do not request unavailable question snapshots',()=>{
 assert.equal(questionDeliveryPhase('active',0),'expired');assert.equal(questionDeliveryPhase('active',60),'load')
 for(const status of ['paused','completed','abandoned'])assert.equal(questionDeliveryPhase(status,0),'closed')
 for(const [status,seconds]of [['unknown',60],['active',NaN],['active',-1],['active',Infinity]])assert.throws(()=>questionDeliveryPhase(status,seconds))
})
const practiceCode=compile('../src/lib/practiceService.ts').replace("from './supabase'",'from '+JSON.stringify(fake)).replace("from './studentQuestionDelivery'",'from '+JSON.stringify(parserSource))
const {listPublishedTopicQuestionIds}=await import(data(practiceCode))
test('topic service uses bounded metadata RPC with exact taxonomy and no table reads',async()=>{
 state.calls=[];state.error=null;state.data=[first]
 assert.deepEqual(await listPublishedTopicQuestionIds(attempt,second,null,100),[first])
 assert.deepEqual(state.calls,[{name:'published_topic_questions',args:{p_subject_id:attempt,p_topic_id:second,p_subtopic_id:null,p_limit:20}}])
})
test('topic service distinguishes empty results from provider errors and malformed IDs',async()=>{
 state.calls=[];state.error=null;state.data=[];assert.deepEqual(await listPublishedTopicQuestionIds(attempt,second),[])
 state.error={message:'unavailable'};await assert.rejects(listPublishedTopicQuestionIds(attempt,second));state.error=null;state.data=[{id:first}];await assert.rejects(listPublishedTopicQuestionIds(attempt,second))
 state.calls=[];await assert.rejects(listPublishedTopicQuestionIds(attempt,second,null,NaN));assert.equal(state.calls.length,0)
})

test('paper options must exactly match the attempt snapshot keys',()=>{
 for(const options of [[{key:'A',text:'Only one'}],[{key:'A',text:'First'},{key:'C',text:'Substituted'}],[{key:'A',text:'First'},{key:'B',text:'Second'},{key:'C',text:'Extra'}]])assert.throws(()=>parseAttemptQuestions([{...row(first),options}],[first],order([first])))
 for(const keys of [null,{}, {[first]:['A','A']}, {[first]:['bad']}, {[first]:[]}, {[first]:['A','B'],[second]:['A','B']}])assert.throws(()=>parseAttemptQuestions([row(first)],[first],keys))
})

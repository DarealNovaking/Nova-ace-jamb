import type { CbtQuestion } from './cbtService'
import type { PublishedTopicMapping } from './progressSummary'
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const failure=()=>new Error('Question delivery could not be confirmed. Reload the session before continuing.')
const object=(v:unknown):v is Record<string,unknown>=>typeof v==='object'&&v!==null&&!Array.isArray(v)
function id(v:unknown):string {if(typeof v!=='string'||!uuid.test(v))throw failure();return v.toLowerCase()}
function fields(v:unknown,allowed:string[]):Record<string,unknown>{if(!object(v)||Object.keys(v).some(k=>!allowed.includes(k))||allowed.some(k=>!(k in v)))throw failure();return v}
function text(v:unknown,limit:number):string{if(typeof v!=='string'||!v.trim()||v.length>limit)throw failure();return v}
export function validateQuestionIds(ids:unknown,limit:number):string[]{if(!Array.isArray(ids)||ids.length<1||ids.length>limit)throw failure();const valid=ids.map(id);if(new Set(valid).size!==valid.length)throw failure();return valid}
export function validateAttemptQuestionRequest(attemptId:string,ids:string[]):string{validateQuestionIds(ids,500);return id(attemptId)}
export function parseAttemptQuestions(value:unknown,ids:string[]):CbtQuestion[]{
 const expected=validateQuestionIds(ids,500)
 if(!Array.isArray(value)||value.length!==expected.length)throw failure()
 return value.map((item,index)=>{
  const q=fields(item,['id','question_text','options','subject_id','topic_id','difficulty'])
  if(id(q.id)!==expected[index]||!Array.isArray(q.options)||q.options.length<1||q.options.length>20)throw failure()
  const options=q.options.map(item=>{const o=fields(item,['key','text']);if(typeof o.key!=='string'||!/^[A-Z]$/.test(o.key))throw failure();return {key:o.key,text:text(o.text,4000)}})
  if(new Set(options.map(o=>o.key)).size!==options.length)throw failure()
  if(q.difficulty!==null&&!['easy','medium','hard'].includes(String(q.difficulty)))throw failure()
  return {id:expected[index],text:text(q.question_text,20000),options,subject_id:q.subject_id===null?null:id(q.subject_id),topic_id:q.topic_id===null?null:id(q.topic_id),difficulty:q.difficulty as string|null}
 })
}
export function parsePublishedQuestionIds(value:unknown,limit:number):string[]{
 if(!Number.isInteger(limit)||limit<1||limit>20||!Array.isArray(value)||value.length>limit)throw failure()
 if(!value.length)return []
 return validateQuestionIds(value,limit)
}
export function parseStudentQuestionTopics(value:unknown,ids:string[]):PublishedTopicMapping[]{
 const requested=new Set(validateQuestionIds(ids,80));const seen=new Set<string>()
 if(!Array.isArray(value)||value.length>requested.size)throw failure()
 return value.map(item=>{const q=fields(item,['id','subject_id','topic_id','subtopic_id']);const key=id(q.id);if(!requested.has(key)||seen.has(key))throw failure();seen.add(key);return {id:key,subject_id:id(q.subject_id),topic_id:id(q.topic_id),subtopic_id:q.subtopic_id===null?null:id(q.subtopic_id)}})
}
export function questionDeliveryPhase(status:string,seconds:number):'load'|'expired'|'closed' {
 if(!['active','paused','completed','abandoned'].includes(status)||!Number.isFinite(seconds)||seconds<0)throw failure()
 return status!=='active'?'closed':seconds===0?'expired':'load'
}

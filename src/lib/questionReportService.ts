import {ace} from './supabase'

export type QuestionReportReason='incorrect_answer'|'ambiguous'|'formatting'|'diagram'|'other'
export type QuestionReportStatus='open'|'triaged'|'resolved'|'dismissed'
export type QuestionReport={
 id:string;question_id:string;question_version:number;attempt_id:string;reporter_id:string
 reason:QuestionReportReason;details:string;status:QuestionReportStatus;created_at:string
 handled_by:string|null;resolution_note:string|null;resolved_at:string|null
}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const reasons:QuestionReportReason[]=['incorrect_answer','ambiguous','formatting','diagram','other']
const statuses:QuestionReportStatus[]=['open','triaged','resolved','dismissed']
export async function isQuestionReportingEnabled():Promise<boolean>{
 try{
  const {data,error}=await ace.rpc('question_reporting_enabled')
  return !error&&data===true
 }catch{return false}
}
function object(value:unknown):value is Record<string,unknown>{return !!value&&typeof value==='object'&&!Array.isArray(value)}
function parseReport(value:unknown):QuestionReport{
 if(!object(value)||typeof value.id!=='string'||!uuid.test(value.id)||
  typeof value.question_id!=='string'||!uuid.test(value.question_id)||
  typeof value.attempt_id!=='string'||!uuid.test(value.attempt_id)||
  typeof value.reporter_id!=='string'||!uuid.test(value.reporter_id)||
  !Number.isSafeInteger(value.question_version)||(value.question_version as number)<1||
  !reasons.includes(value.reason as QuestionReportReason)||
  typeof value.details!=='string'||value.details.length<8||value.details.length>1000||
  !statuses.includes(value.status as QuestionReportStatus)||
  typeof value.created_at!=='string'||Number.isNaN(Date.parse(value.created_at))||
  !(value.handled_by===null||(typeof value.handled_by==='string'&&uuid.test(value.handled_by)))||
  !(value.resolution_note===null||(typeof value.resolution_note==='string'&&value.resolution_note.length<=1000))||
  !(value.resolved_at===null||(typeof value.resolved_at==='string'&&!Number.isNaN(Date.parse(value.resolved_at)))))
  throw new Error('Question report response was invalid.')
 return value as QuestionReport
}
export async function submitQuestionReport(
 attemptId:string,questionId:string,reason:QuestionReportReason,details:string,requestId:string=globalThis.crypto.randomUUID(),
){
 if(!uuid.test(attemptId)||!uuid.test(questionId)||!uuid.test(requestId)||!reasons.includes(reason)||
  typeof details!=='string'||details.trim().length<8||details.trim().length>1000)
  throw new Error('Add a clear report description before submitting.')
 const {data,error}=await ace.rpc('submit_question_report',{
  p_attempt:attemptId,p_question:questionId,p_reason:reason,p_details:details.trim(),p_request:requestId,
 })
 if(error)throw error
 if(!object(data)||typeof data.id!=='string'||!uuid.test(data.id)||
  !statuses.includes(data.status as QuestionReportStatus)||typeof data.created_at!=='string'||Number.isNaN(Date.parse(data.created_at)))
  throw new Error('Your report could not be confirmed.')
 return {id:data.id,status:data.status as QuestionReportStatus,created_at:data.created_at,request_id:requestId}
}
export async function listQuestionReports(status:QuestionReportStatus|null='open'):Promise<QuestionReport[]>{
 if(status!==null&&!statuses.includes(status))throw new Error('Invalid report status.')
 const {data,error}=await ace.rpc('list_question_reports',{p_status:status,p_limit:50})
 if(error)throw error
 if(!Array.isArray(data))throw new Error('Question reports could not be read.')
 return data.map(parseReport)
}
export async function manageQuestionReport(id:string,action:'triage'|'resolve'|'dismiss',note:string){
 if(!uuid.test(id)||!['triage','resolve','dismiss'].includes(action)||
  typeof note!=='string'||note.trim().length<8||note.trim().length>1000)
  throw new Error('Add a clear moderation note before saving.')
 const {data,error}=await ace.rpc('manage_question_report',{p_report:id,p_action:action,p_note:note.trim()})
 if(error)throw error
 if(!object(data)||data.id!==id||!statuses.includes(data.status as QuestionReportStatus)||
  typeof data.question_id!=='string'||!uuid.test(data.question_id))
  throw new Error('The moderation decision could not be confirmed.')
 return data as {id:string;status:QuestionReportStatus;question_id:string}
}

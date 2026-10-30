import { ace } from './supabase'
import { parseQuestionHistory, parseQuestionQueue, parseSavedQuestion, validateQuestionDraft, validateQuestionRestore, type QuestionAction, type QuestionDraft, type QuestionStatus } from './questionWorkflow'

export async function listQuestionReview(status: QuestionStatus | null, page: number) {
  const {data,error}=await ace.rpc('review_questions',{p_status:status,p_page:page})
  if(error) throw error
  return parseQuestionQueue(data,page)
}
export async function mutateQuestion(action: QuestionAction,id: string,revision: number,payload: QuestionDraft | {reason: string} | Record<string,never> = {}) {
  const {data,error}=await ace.rpc('manage_question',{p_action:action,p_id:id,p_expected_version:revision,p_payload:action==='save'?validateQuestionDraft(payload):payload})
  if(error) throw error
  return parseSavedQuestion(data,id,revision,action)
}
export async function listQuestionHistory(id: string, before: number | null) {
  const {data,error}=await ace.rpc('question_history',{p_id:id,p_before:before})
  if(error)throw error
  return parseQuestionHistory(data,id,before)
}
export async function restoreQuestion(id: string, currentVersion: number, sourceVersion: number, reason: string) {
  const request=validateQuestionRestore(currentVersion,sourceVersion,reason)
  const {data,error}=await ace.rpc('restore_question',{p_id:id,p_expected_version:request.expected_version,p_source_version:request.source_version,p_reason:request.reason})
  if(error)throw error
  return parseSavedQuestion(data,id,currentVersion,'save')
}

export async function reviewQuestionMediaIntent(
 questionId:string,version:number,assetId:string,decision:'approved'|'rejected',
 rightsStatus:'owned'|'licensed'|'permitted'|'restricted',evidence:string,
) {
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
 if(!uuid.test(questionId)||!uuid.test(assetId)||!Number.isSafeInteger(version)||version<1||
  !['approved','rejected'].includes(decision)||
  !(decision==='approved'?['owned','licensed','permitted']:['restricted']).includes(rightsStatus)||
  typeof evidence!=='string'||evidence.trim().length<8||evidence.trim().length>4000)
  throw new Error('Invalid media-rights review request')
 const {data,error}=await ace.rpc('review_question_media_intent',{
  p_question:questionId,p_version:version,p_asset:assetId,p_decision:decision,
  p_rights_status:rightsStatus,p_rights_evidence:evidence.trim(),
 })
 if(error)throw error
 if(!data||typeof data!=='object'||Array.isArray(data)||
  (data as Record<string,unknown>).intent_id!==assetId||
  (data as Record<string,unknown>).question_version!==version||
  (data as Record<string,unknown>).decision!==decision)
  throw new Error('Media-rights review could not be confirmed')
 return data
}

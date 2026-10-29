import { ace } from './supabase'
import { parseQuestionQueue, parseSavedQuestion, validateQuestionDraft, type QuestionAction, type QuestionDraft, type QuestionStatus } from './questionWorkflow'

export async function listQuestionReview(status: QuestionStatus | null, page: number) {
  const {data,error}=await ace.rpc('review_questions',{p_status:status,p_page:page})
  if(error) throw error
  return parseQuestionQueue(data,page)
}
export async function mutateQuestion(action: QuestionAction,id: string,revision: number,payload: QuestionDraft | {reason: string} | Record<string,never> = {}) {
  const {data,error}=await ace.rpc('manage_question',{p_action:action,p_id:id,p_expected_version:revision,p_payload:action==='save'?validateQuestionDraft(payload):payload})
  if(error) throw error
  return parseSavedQuestion(data,id,revision)
}

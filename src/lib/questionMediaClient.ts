import { supabase, supabaseUrl, supabasePublishableKey } from './supabase'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const MAX_BYTES = 2 * 1024 * 1024
const MIME = new Set(['image/png', 'image/jpeg', 'image/webp'])
const UPLOAD_MIME = new Set(['image/png', 'image/jpeg', 'image/webp'])

/** Upload one image to private staging; the server decodes, re-encodes and verifies it. */
export async function uploadQuestionMedia(
  questionId: string,
  questionVersion: number,
  file: File,
  altText: string,
  rightsEvidence: string,
): Promise<string> {
  if (!UUID.test(questionId) || !Number.isSafeInteger(questionVersion) || questionVersion < 1 ||
      !(file instanceof File) || file.size < 1 || file.size > MAX_BYTES || !UPLOAD_MIME.has(file.type) ||
      typeof altText !== 'string' || altText.trim().length < 8 || altText.length > 500 ||
      typeof rightsEvidence !== 'string' || rightsEvidence.trim().length < 8 || rightsEvidence.length > 4000) {
    throw new Error('Choose a valid PNG, JPEG or WebP image and complete its description and rights evidence.')
  }
  const { data, error } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (error || !token) throw new Error('Sign in again before uploading a private question image.')
  const form = new FormData()
  form.set('question_id', questionId)
  form.set('question_version', String(questionVersion))
  form.set('request_id', crypto.randomUUID())
  form.set('alt_text', altText.trim())
  form.set('rights_evidence', rightsEvidence.trim())
  form.set('file', file)
  const endpoint = new URL('/functions/v1/question-media-upload', supabaseUrl)
  const response = await fetch(endpoint.toString(), {
    method: 'POST',
    headers: { authorization: 'Bearer ' + token, apikey: supabasePublishableKey },
    body: form,
    cache: 'no-store',
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
  })
  if (!response.ok) throw new Error('The image could not be verified or saved privately. Check the file and try again.')
  let result: unknown
  try { result = await response.json() } catch {
    throw new Error('The image upload could not be confirmed. Refresh before retrying.')
  }
  if (!result || typeof result !== 'object' || Array.isArray(result) ||
      Object.keys(result).some(key => !['id', 'status'].includes(key)) ||
      !('id' in result) || !('status' in result) ||
      typeof result.id !== 'string' || !UUID.test(result.id) || result.status !== 'verified') {
    throw new Error('The image upload could not be confirmed. Refresh before retrying.')
  }
  return result.id.toLowerCase()
}


/** Fetch bytes through the authenticated attempt-scoped proxy, never a Storage URL. */
export async function fetchQuestionMediaObjectUrl(
  attemptId: string,
  questionId: string,
  assetId: string,
  signal?: AbortSignal,
): Promise<string> {
  if (![attemptId, questionId, assetId].every(id => UUID.test(id))) {
    throw new Error('Question image unavailable')
  }
  const { data, error } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (error || !token) throw new Error('Question image unavailable')

  const endpoint = new URL('/functions/v1/question-media-delivery', supabaseUrl)
  endpoint.searchParams.set('attempt_id', attemptId)
  endpoint.searchParams.set('question_id', questionId)
  endpoint.searchParams.set('asset_id', assetId)
  const response = await fetch(endpoint.toString(), {
    method: 'GET',
    headers: { authorization: 'Bearer ' + token, apikey: supabasePublishableKey },
    cache: 'no-store',
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
    signal,
  })
  if (!response.ok) throw new Error('Question image unavailable')
  const mime = (response.headers.get('content-type') || '').split(';', 1)[0].trim().toLowerCase()
  if (!MIME.has(mime)) throw new Error('Question image unavailable')
  const claimedLength = response.headers.get('content-length')
  const length = claimedLength === null ? null : Number(claimedLength)
  if (length !== null && (!Number.isSafeInteger(length) || length < 1 || length > MAX_BYTES)) {
    throw new Error('Question image unavailable')
  }
  const blob = await response.blob()
  if (blob.size < 1 || blob.size > MAX_BYTES || blob.type.toLowerCase() !== mime ||
      (length !== null && blob.size !== length)) {
    throw new Error('Question image unavailable')
  }
  return URL.createObjectURL(blob)
}


/** Fetch a staged diagram through the role/revision-scoped reviewer proxy. */
export async function fetchQuestionMediaPreviewObjectUrl(
  questionId: string,
  questionVersion: number,
  assetId: string,
  signal?: AbortSignal,
): Promise<string> {
  if (![questionId, assetId].every(id => UUID.test(id)) ||
      !Number.isSafeInteger(questionVersion) || questionVersion < 1) {
    throw new Error('Private image unavailable')
  }
  const { data, error } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (error || !token) throw new Error('Private image unavailable')
  const endpoint = new URL('/functions/v1/question-media-preview', supabaseUrl)
  endpoint.searchParams.set('question_id', questionId)
  endpoint.searchParams.set('question_version', String(questionVersion))
  endpoint.searchParams.set('asset_id', assetId)
  const response = await fetch(endpoint.toString(), {
    method: 'GET',
    headers: { authorization: 'Bearer ' + token, apikey: supabasePublishableKey },
    cache: 'no-store',
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
    signal,
  })
  if (!response.ok) throw new Error('Private image unavailable')
  const mime = (response.headers.get('content-type') || '').split(';', 1)[0].trim().toLowerCase()
  if (!MIME.has(mime)) throw new Error('Private image unavailable')
  const claimedLength = response.headers.get('content-length')
  const length = claimedLength === null ? null : Number(claimedLength)
  if (length !== null && (!Number.isSafeInteger(length) || length < 1 || length > MAX_BYTES)) {
    throw new Error('Private image unavailable')
  }
  const blob = await response.blob()
  if (blob.size < 1 || blob.size > MAX_BYTES || blob.type.toLowerCase() !== mime ||
      (length !== null && blob.size !== length)) throw new Error('Private image unavailable')
  return URL.createObjectURL(blob)
}

/** Promote and publish an approved image question through the trusted server workflow. */
export async function publishRichQuestion(
  questionId: string,
  approvedVersion: number,
): Promise<{id:string;status:'published';version:number}> {
  if (!UUID.test(questionId) || !Number.isSafeInteger(approvedVersion) ||
      approvedVersion < 1 || approvedVersion >= 2147483647) {
    throw new Error('Private image publication is not ready.')
  }
  const { data, error } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (error || !token) throw new Error('Sign in again before publishing this question.')
  const response = await fetch(new URL('/functions/v1/question-media-publish', supabaseUrl).toString(), {
    method: 'POST',
    headers: { authorization: 'Bearer ' + token, apikey: supabasePublishableKey, 'content-type': 'application/json' },
    body: JSON.stringify({ question_id: questionId, question_version: approvedVersion }),
    cache: 'no-store',
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
  })
  if (!response.ok) throw new Error('Private image publication is not ready. Confirm every rights review and try again.')
  let result: unknown
  try { result = await response.json() } catch { throw new Error('Question publication could not be confirmed. Refresh before retrying.') }
  if (!result || typeof result !== 'object' || Array.isArray(result) ||
      Object.keys(result).some(key => !['id','status','version'].includes(key)) ||
      !('id' in result) || !('status' in result) || !('version' in result) ||
      result.id !== questionId || result.status !== 'published' || result.version !== approvedVersion + 1) {
    throw new Error('Question publication could not be confirmed. Refresh before retrying.')
  }
  return result as {id:string;status:'published';version:number}
}

/** Revoke future student delivery for one published image after a rights concern. */
export async function takedownQuestionMedia(
  questionId:string,
  assetId:string,
  reason:string,
):Promise<void>{
  if(!UUID.test(questionId)||!UUID.test(assetId)||
   typeof reason!=='string'||reason.trim().length<8||reason.trim().length>2000){
    throw new Error('Add a clear reason before revoking student image access.')
  }
  const {data,error}=await supabase.auth.getSession()
  const token=data.session?.access_token
  if(error||!token)throw new Error('Sign in again before managing published media.')
  const response=await fetch(new URL('/functions/v1/question-media-takedown',supabaseUrl).toString(),{
    method:'POST',
    headers:{authorization:'Bearer '+token,apikey:supabasePublishableKey,'content-type':'application/json'},
    body:JSON.stringify({question_id:questionId,asset_id:assetId,reason:reason.trim()}),
    cache:'no-store',
    credentials:'omit',
    referrerPolicy:'no-referrer',
  })
  if(!response.ok)throw new Error('Student image access could not be revoked. Refresh and retry.')
  let result:unknown
  try{result=await response.json()}catch{throw new Error('Image takedown could not be confirmed. Refresh before retrying.')}
  if(!result||typeof result!=='object'||Array.isArray(result)||
   Object.keys(result).length!==3||Object.keys(result).some(key=>!['question_id','asset_id','status'].includes(key))||
   !('question_id'in result)||!('asset_id'in result)||!('status'in result)||
   result.question_id!==questionId||result.asset_id!==assetId||result.status!=='revoked'){
    throw new Error('Image takedown could not be confirmed. Refresh before retrying.')
  }
}

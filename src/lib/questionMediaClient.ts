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

import { supabase, supabaseUrl, supabasePublishableKey } from './supabase'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const MAX_BYTES = 2 * 1024 * 1024
const MIME = new Set(['image/png', 'image/jpeg', 'image/webp'])

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

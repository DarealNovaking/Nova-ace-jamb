/**
 * Source-only authenticated reviewer preview of a sanitized private staging image.
 * It never accepts a storage path or bucket from the browser and never returns a URL.
 */
import type { SafeImageMime } from './questionMedia.ts'

export type QuestionMediaPreviewGrant = {
  id: string
  question_id: string
  question_version: number
  storage_path: string
  mime_type: SafeImageMime
  size_bytes: number
  sha256: string
}
type VerifiedActor = { id: string }
type PreviewDependencies = {
  authenticate(token: string): Promise<VerifiedActor | null>
  authorize(actorId: string, questionId: string, version: number, assetId: string): Promise<QuestionMediaPreviewGrant | null>
  storage: { read(path: string): Promise<{ bytes: Uint8Array; mime: string } | null> }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const MAX_BYTES = 2 * 1024 * 1024
const MIME = new Set<SafeImageMime>(['image/png', 'image/jpeg', 'image/webp'])
function errorResponse(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'private, no-store, max-age=0',
      'pragma': 'no-cache',
      'x-content-type-options': 'nosniff',
      'content-security-policy': "default-src 'none'; sandbox",
      'referrer-policy': 'no-referrer',
      'cross-origin-resource-policy': 'cross-origin',
    },
  })
}
function extension(mime: SafeImageMime): string {
  return mime === 'image/png' ? 'png' : mime === 'image/jpeg' ? 'jpg' : 'webp'
}
async function sha256(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes)
  const hash = await globalThis.crypto.subtle.digest('SHA-256', copy)
  return Array.from(new Uint8Array(hash), value => value.toString(16).padStart(2, '0')).join('')
}
function parseRequest(request: Request): { questionId: string; version: number; assetId: string } | null {
  const url = new URL(request.url)
  const keys = [...url.searchParams.keys()]
  if (keys.length !== 3 || new Set(keys).size !== 3 ||
      keys.some(key => !['question_id', 'version', 'asset_id'].includes(key))) return null
  const questionId = url.searchParams.get('question_id') || ''
  const assetId = url.searchParams.get('asset_id') || ''
  const rawVersion = url.searchParams.get('version') || ''
  if (!UUID.test(questionId) || !UUID.test(assetId) || !/^[1-9][0-9]*$/.test(rawVersion)) return null
  const version = Number(rawVersion)
  if (!Number.isSafeInteger(version) || version < 1 || version >= 2147483647) return null
  return { questionId, version, assetId }
}
function safeGrant(value: QuestionMediaPreviewGrant, questionId: string, version: number, assetId: string): boolean {
  return !!value && value.id === assetId && value.question_id === questionId &&
    value.question_version === version &&
    value.storage_path === 'staging/v1/' + questionId + '/' + assetId &&
    MIME.has(value.mime_type) && Number.isInteger(value.size_bytes) &&
    value.size_bytes > 0 && value.size_bytes <= MAX_BYTES &&
    typeof value.sha256 === 'string' && /^[0-9a-f]{64}$/.test(value.sha256)
}

export function createQuestionMediaPreviewHandler(
  deps: PreviewDependencies,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'GET') return errorResponse(405, 'Method not allowed')
    if (request.headers.has('range')) return errorResponse(416, 'Partial media requests are not supported')
    const authorization = request.headers.get('authorization') || ''
    if (!/^Bearer [^\s]{10,8192}$/.test(authorization)) return errorResponse(401, 'Authentication required')
    let actor: VerifiedActor | null
    try { actor = await deps.authenticate(authorization.slice(7)) }
    catch { return errorResponse(401, 'Authentication required') }
    if (!actor || !UUID.test(actor.id)) return errorResponse(401, 'Authentication required')
    const ids = parseRequest(request)
    if (!ids) return errorResponse(400, 'Invalid media request')
    try {
      const grant = await deps.authorize(actor.id, ids.questionId, ids.version, ids.assetId)
      if (!grant || !safeGrant(grant, ids.questionId, ids.version, ids.assetId)) {
        return errorResponse(404, 'Question image unavailable')
      }
      const object = await deps.storage.read(grant.storage_path)
      if (!object || !(object.bytes instanceof Uint8Array) ||
          object.bytes.length !== grant.size_bytes || object.bytes.length < 1 ||
          object.bytes.length > MAX_BYTES || object.mime !== grant.mime_type ||
          await sha256(object.bytes) !== grant.sha256) {
        return errorResponse(404, 'Question image unavailable')
      }
      return new Response(new Uint8Array(object.bytes), {
        status: 200,
        headers: {
          'content-type': grant.mime_type,
          'content-length': String(object.bytes.length),
          'content-disposition': 'inline; filename="question-preview.' + extension(grant.mime_type) + '"',
          'cache-control': 'private, no-store, max-age=0',
          'pragma': 'no-cache',
          'x-content-type-options': 'nosniff',
          'content-security-policy': "default-src 'none'; sandbox",
          'referrer-policy': 'no-referrer',
          'cross-origin-resource-policy': 'cross-origin',
        },
      })
    } catch {
      return errorResponse(404, 'Question image unavailable')
    }
  }
}

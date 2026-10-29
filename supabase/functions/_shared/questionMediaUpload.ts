/**
 * FCB-03 upload HTTP protocol, SOURCE ONLY. This is deliberately not a deployed
 * Edge Function: a separately reviewed trusted Postgres executor, real image
 * decoder/re-encoder, and private Storage adapter must be supplied before use.
 *
 * The dependencies are SERVER-ONLY capabilities. In particular authenticate()
 * must verify the JWT against Supabase Auth (not decode unverified claims), and
 * reserve()/confirm() must execute the private PostgreSQL functions with that
 * verified identity in an isolated, trusted transaction. Never expose a
 * service-role key or let the caller provide the actor, bucket or object path.
 */
import {
  prepareQuestionImage, persistQuestionImage,
  type MediaIntent, type Sanitizer, type PrivateObjectStorage,
  type SafeImageMime,
} from './questionMedia.ts'

const MAX_BODY_BYTES = 2 * 1024 * 1024 + 16 * 1024
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const FIELDS = new Set(['question_id', 'question_version', 'request_id', 'alt_text', 'rights_evidence', 'file'])
type VerifiedActor = { id: string }
type Reservation = {
  questionId: string
  questionVersion: number
  requestId: string
  alt: string
  rights: string
  mime: SafeImageMime
  bytes: number
  sha256: string
}
export type UploadDependencies = {
  /** Return null for invalid/expired credentials; always validate server-side. */
  authenticate(token: string): Promise<VerifiedActor | null>
  /** Must recheck current editorial role, ownership, revision and rights in SQL. */
  reserve(actorId: string, details: Reservation): Promise<MediaIntent>
  /** Must recheck editor/revision in SQL immediately before confirming. */
  confirm(actorId: string, id: string, mime: SafeImageMime, size: number, sha256: string):
    Promise<{ id: string; question_id: string; question_version: number; status: 'verified' }>
  /** Requires a REAL trusted decoder/re-encoder, never magic-byte-only checks. */
  sanitizer: Sanitizer
  /** Private, immutable, server-controlled object storage. */
  storage: PrivateObjectStorage
}

function reply(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'content-security-policy': "default-src 'none'",
    },
  })
}
function success(status: number, id: string): Response {
  return new Response(JSON.stringify({ id, status: 'verified' }), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'content-security-policy': "default-src 'none'",
    },
  })
}
async function readBounded(req: Request): Promise<Uint8Array | null> {
  const claimed = req.headers.get('content-length')
  if (claimed !== null && (!/^\d+$/.test(claimed) || Number(claimed) > MAX_BODY_BYTES)) return null
  if (!req.body) return null
  const reader = req.body.getReader()
  const parts: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (!(value instanceof Uint8Array)) return null
      size += value.byteLength
      if (size > MAX_BODY_BYTES) {
        await reader.cancel()
        return null
      }
      parts.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  const bytes = new Uint8Array(size)
  let index = 0
  for (const part of parts) { bytes.set(part, index); index += part.length }
  return bytes
}
function validText(value: FormDataEntryValue | null, max: number, min = 1): value is string {
  return typeof value === 'string' && value === value.trim() &&
    value.length >= min && value.length <= max &&
    !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(value)
}

export function createQuestionMediaUploadHandler(deps: UploadDependencies): (request: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    if (req.method !== 'POST') return reply(405, 'Method not allowed')
    const authorization = req.headers.get('authorization')
    if (!authorization || !/^Bearer [^\s]{10,8192}$/.test(authorization)) {
      return reply(401, 'Authentication required')
    }
    // Authentication comes first: do not decode or allocate an untrusted image
    // for an anonymous request.
    let actor: VerifiedActor | null
    try { actor = await deps.authenticate(authorization.slice(7)) }
    catch { return reply(401, 'Authentication required') }
    if (!actor || !UUID.test(actor.id)) return reply(401, 'Authentication required')

    const mediaType = req.headers.get('content-type') || ''
    if (!/^multipart\/form-data;\s*boundary=[A-Za-z0-9_'()+,./:=?-]{1,200}$/i.test(mediaType)) {
      return reply(415, 'Multipart image upload required')
    }
    let form: FormData
    try {
      const bytes = await readBounded(req)
      if (!bytes) return reply(413, 'Request too large')
      form = await new Request('https://private.invalid/upload', {
        method: 'POST', headers: { 'content-type': mediaType }, body: bytes,
      }).formData()
    } catch { return reply(400, 'Invalid upload') }

    const seen = new Set<string>()
    for (const [key] of form.entries()) {
      if (!FIELDS.has(key) || seen.has(key)) return reply(400, 'Invalid upload fields')
      seen.add(key)
    }
    if (seen.size !== FIELDS.size) return reply(400, 'Missing upload fields')
    const question = form.get('question_id')
    const version = form.get('question_version')
    const requestId = form.get('request_id')
    const alt = form.get('alt_text')
    const rights = form.get('rights_evidence')
    const file = form.get('file')
    if (!validText(question, 36, 36) || !UUID.test(question) ||
        !validText(requestId, 36, 36) || !UUID.test(requestId) ||
        !validText(version, 9) || !/^[1-9]\d{0,8}$/.test(version) ||
        !validText(alt, 500, 8) || !validText(rights, 4000) ||
        !(file instanceof Blob) || file.size < 1 || file.size > 2 * 1024 * 1024 ||
        !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      return reply(400, 'Invalid question image details')
    }

    try {
      // Actual bytes, not filename, MIME header or a browser hash, are authority.
      const prepared = await prepareQuestionImage(new Uint8Array(await file.arrayBuffer()), file.type, deps.sanitizer)
      const intent = await deps.reserve(actor.id, {
        questionId: question, questionVersion: Number(version), requestId,
        alt, rights, mime: prepared.mime, bytes: prepared.bytes.length, sha256: prepared.sha256,
      })
      if (intent.status === 'verified') {
        // Verified idempotent replay is valid only because SQL independently
        // compared the exact digest, metadata, question and editor identity.
        if (!UUID.test(intent.id) || intent.question_id !== question ||
            intent.question_version !== Number(version)) throw Error('Invalid replay')
        return success(200, intent.id)
      }
      await persistQuestionImage(intent, prepared, deps.storage,
        (id, mime, size, sha256) => deps.confirm(actor.id, id, mime, size, sha256))
      return success(201, intent.id)
    } catch {
      // Never return privileged SQL errors, storage paths, owner or object existence.
      return reply(409, 'Question image could not be verified or saved')
    }
  }
}

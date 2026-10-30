/**
 * FCB-03 SOURCE-ONLY Supabase Edge upload endpoint.
 * NOT DEPLOYED. Requires separate authorization for a dedicated PostgreSQL
 * executor, a private Storage bucket and an approved production release.
 * NEVER use a postgres/superuser connection URL here.
 */
import { createClient } from 'npm:@supabase/supabase-js@2.57.0'
import postgres from 'npm:postgres@3.4.7'
import { createQuestionMediaUploadHandler } from '../_shared/questionMediaUpload.ts'
import { magickQuestionSanitizer } from '../_shared/magickQuestionSanitizer.ts'
import type { MediaIntent } from '../_shared/questionMedia.ts'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const url = Deno.env.get('SUPABASE_URL')
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const databaseUrl = Deno.env.get('ACE_MEDIA_DATABASE_URL')
const origin = Deno.env.get('ACE_MEDIA_ORIGIN')
const bucket = Deno.env.get('ACE_PRIVATE_MEDIA_BUCKET')
const ready = Boolean(url && anonKey && serviceKey && databaseUrl &&
  origin && /^https:\/\/[^/]+$/.test(origin) && bucket === 'ace-question-media-private')

const auth = ready ? createClient(url!, anonKey!, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
}) : null
const storage = ready ? createClient(url!, serviceKey!, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
}) : null
// Transaction-pooler safe: one connection, no prepared statements, TLS.
const db = ready ? postgres(databaseUrl!, {
  max: 1, prepare: false, ssl: 'require', idle_timeout: 10, connect_timeout: 5,
}) : null

function requireUuid(id: string): void {
  if (!UUID.test(id)) throw Error('Invalid authenticated identity')
}
async function databaseAsActor<T>(
  actorId: string, query: (transaction: any) => Promise<T>,
): Promise<T> {
  requireUuid(actorId)
  if (!db) throw Error('No trusted media executor')
  return (await db.begin(async transaction => {
    const role = await transaction.unsafe('select current_user::text as name')
    // Never run as postgres, an administrative account or the ordinary
    // authenticated/anon API role. A narrowly scoped login is mandatory.
    if (role.length !== 1 || role[0].name !== 'ace_media_executor') {
      throw Error('Unexpected media database identity')
    }
    // Transaction-local verified user: no JWT/session leaks across the pool.
    await transaction.unsafe("select set_config('request.jwt.claim.sub',$1,true)", [actorId])
    return query(transaction)
  })) as unknown as T
}

const handleUpload = ready ? createQuestionMediaUploadHandler({
  async authenticate(token) {
    const { data, error } = await auth!.auth.getUser(token)
    if (error || !data.user || !UUID.test(data.user.id)) return null
    return { id: data.user.id }
  },
  async authorize(actorId, questionId, version) {
    const permitted = await databaseAsActor(actorId, async transaction => {
      const rows = await transaction.unsafe(
        'select ace.can_stage_question_media($1::uuid,$2::integer) as allowed',
        [questionId, version],
      )
      return rows[0]?.allowed === true
    })
    return permitted === true
  },
  async reserve(actorId, details): Promise<MediaIntent> {
    const result = await databaseAsActor(actorId, async transaction => {
      const rows = await transaction.unsafe(
        'select ace.reserve_question_media_intent($1::uuid,$2::integer,$3::uuid,$4::text,$5::text,$6::text,$7::integer,$8::text) as value',
        [details.questionId, details.questionVersion, details.requestId,
          details.alt, details.rights, details.mime, details.bytes, details.sha256],
      )
      return rows[0]?.value
    })
    if (!result || !UUID.test(result.id) ||
        result.question_id !== details.questionId ||
        result.question_version !== details.questionVersion ||
        typeof result.storage_path !== 'string' ||
        typeof result.expires_at !== 'string' ||
        !['pending', 'verified'].includes(result.status)) {
      throw Error('Invalid media reservation')
    }
    return result as MediaIntent
  },
  async confirm(actorId, id, mime, size, sha256) {
    const result = await databaseAsActor(actorId, async transaction => {
      const rows = await transaction.unsafe(
        'select ace.confirm_question_media_intent($1::uuid,$2::text,$3::integer,$4::text) as value',
        [id, mime, size, sha256],
      )
      return rows[0]?.value
    })
    if (!result || result.id !== id || result.status !== 'verified') {
      throw Error('Invalid media confirmation')
    }
    return result
  },
  sanitizer: magickQuestionSanitizer,
  storage: {
    async putIfAbsent(path, bytes, mime) {
      const { error } = await storage!.storage.from('ace-question-media-private')
        .upload(path, bytes, { contentType: mime, upsert: false, cacheControl: '0' })
      if (error) throw Error('Private object write failed')
    },
    async read(path) {
      const { data, error } = await storage!.storage.from('ace-question-media-private').download(path)
      if (error || !data) throw Error('Private object verification unavailable')
      return { bytes: new Uint8Array(await data.arrayBuffer()), mime: data.type }
    },
  },
}) : null

function jsonError(status: number, error: string): Response {
  return Response.json({ error }, {
    status, headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' },
  })
}
function respondCors(allowed: string, response: Response): Response {
  const headers = new Headers(response.headers)
  headers.set('access-control-allow-origin', allowed)
  headers.set('access-control-allow-methods', 'POST, OPTIONS')
  headers.set('access-control-allow-headers', 'authorization,content-type,apikey,x-client-info')
  headers.set('access-control-max-age', '600')
  headers.set('vary', 'Origin')
  headers.set('cache-control', 'no-store')
  return new Response(response.body, { status: response.status, headers })
}

Deno.serve(async request => {
  const suppliedOrigin = request.headers.get('origin')
  if (suppliedOrigin && suppliedOrigin !== origin) return jsonError(403, 'Origin not allowed')
  if (!ready || !handleUpload) return jsonError(503, 'Private image service unavailable')
  if (request.method === 'OPTIONS') {
    const response = new Response(null, { status: 204 })
    return suppliedOrigin ? respondCors(suppliedOrigin, response) : response
  }
  const response = await handleUpload(request)
  return suppliedOrigin ? respondCors(suppliedOrigin, response) : response
})

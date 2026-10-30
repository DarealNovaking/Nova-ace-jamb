/**
 * FCB-03 SOURCE-ONLY reviewer preview proxy. Not deployed.
 * It serves verified staging bytes only to an independent editor/reviewer.
 */
import { createClient } from 'npm:@supabase/supabase-js@2.57.0'
import postgres from 'npm:postgres@3.4.7'
import { createQuestionMediaPreviewHandler } from '../_shared/questionMediaPreview.ts'
import type { QuestionMediaPreviewGrant } from '../_shared/questionMediaPreview.ts'

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
const db = ready ? postgres(databaseUrl!, {
  max: 1, prepare: false, ssl: 'require', idle_timeout: 10, connect_timeout: 5,
}) : null

async function databaseAsActor<T>(actorId: string, query: (transaction: any) => Promise<T>): Promise<T> {
  if (!UUID.test(actorId) || !db) throw Error('Private media database unavailable')
  return (await db.begin(async transaction => {
    const role = await transaction.unsafe('select current_user::text as name')
    if (role.length !== 1 || role[0].name !== 'ace_media_executor') throw Error('Unexpected media database identity')
    await transaction.unsafe("select set_config('request.jwt.claim.sub',$1,true)", [actorId])
    return query(transaction)
  })) as unknown as T
}
const handlePreview = ready ? createQuestionMediaPreviewHandler({
  async authenticate(token) {
    const { data, error } = await auth!.auth.getUser(token)
    if (error || !data.user || !UUID.test(data.user.id)) return null
    return { id: data.user.id }
  },
  async authorize(actorId, questionId, version, assetId): Promise<QuestionMediaPreviewGrant | null> {
    const rows = await databaseAsActor(actorId, async transaction => {
      const result = await transaction.unsafe(
        'select ace.authorize_question_media_preview($1::uuid,$2::integer,$3::uuid) as value',
        [questionId, version, assetId],
      )
      return result[0]?.value ?? null
    })
    if (!rows) return null
    if (rows.id !== assetId || rows.question_id !== questionId ||
        rows.question_version !== version || typeof rows.storage_path !== 'string' ||
        typeof rows.mime_type !== 'string' || !Number.isInteger(rows.size_bytes) ||
        typeof rows.sha256 !== 'string') throw Error('Invalid private preview grant')
    return rows as QuestionMediaPreviewGrant
  },
  storage: {
    async read(path) {
      const { data, error } = await storage!.storage.from('ace-question-media-private').download(path)
      if (error || !data || data.size < 1 || data.size > 2 * 1024 * 1024) return null
      return { bytes: new Uint8Array(await data.arrayBuffer()), mime: data.type }
    },
  },
}) : null

function jsonError(status: number, message: string): Response {
  return Response.json({ error: message }, { status, headers: {
    'cache-control': 'private, no-store, max-age=0',
    'x-content-type-options': 'nosniff',
    'content-security-policy': "default-src 'none'; sandbox",
    'referrer-policy': 'no-referrer',
    'cross-origin-resource-policy': 'cross-origin',
  } })
}
function withCors(allowedOrigin: string, response: Response): Response {
  const headers = new Headers(response.headers)
  headers.set('access-control-allow-origin', allowedOrigin)
  headers.set('access-control-allow-methods', 'GET, OPTIONS')
  headers.set('access-control-allow-headers', 'authorization, apikey, x-client-info')
  headers.set('access-control-max-age', '600')
  headers.set('vary', 'Origin')
  return new Response(response.body, { status: response.status, headers })
}
Deno.serve(async request => {
  const suppliedOrigin = request.headers.get('origin')
  if (suppliedOrigin && suppliedOrigin !== origin) return jsonError(403, 'Origin not allowed')
  if (!ready || !handlePreview) return jsonError(503, 'Private preview service unavailable')
  if (request.method === 'OPTIONS') {
    const response = new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } })
    return suppliedOrigin ? withCors(suppliedOrigin, response) : response
  }
  const response = await handlePreview(request)
  return suppliedOrigin ? withCors(suppliedOrigin, response) : response
})

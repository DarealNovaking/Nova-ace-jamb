import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { webcrypto } from 'node:crypto'

if (!globalThis.crypto) globalThis.crypto = webcrypto
const transpile = code => ts.transpileModule(code, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText
const media = 'data:text/javascript;base64,' + Buffer.from(transpile(
  readFileSync(new URL('../supabase/functions/_shared/questionMedia.ts', import.meta.url), 'utf8'),
)).toString('base64')
const uploadSource = readFileSync(new URL('../supabase/functions/_shared/questionMediaUpload.ts', import.meta.url), 'utf8')
  .replace("from './questionMedia.ts'", "from '" + media + "'")
const { createQuestionMediaUploadHandler } = await import(
  'data:text/javascript;base64,' + Buffer.from(transpile(uploadSource)).toString('base64')
)

const questionId = '04000000-0000-4000-8000-000000000004'
const actorId = '04000000-0000-4000-8000-000000000001'
const requestId = '04000000-0000-4000-8000-00000000000b'
const assetId = '04000000-0000-4000-8000-00000000000c'
const rawImage = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 1, 2])
const cleanImage = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 3, 4])
const intent = () => ({
  id: assetId, question_id: questionId, question_version: 1,
  storage_path: 'staging/v1/' + questionId + '/' + assetId,
  status: 'pending', expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
})
const form = (overrides = {}, extra = []) => {
  const f = new FormData()
  for (const [key, value] of Object.entries({
    question_id: questionId, question_version: '1', request_id: requestId,
    alt_text: 'A labelled geometry diagram',
    rights_evidence: 'Created for ACE by our question author.',
    file: new Blob([rawImage], { type: 'image/png' }),
    ...overrides,
  })) f.append(key, value)
  for (const [key, value] of extra) f.append(key, value)
  return f
}
const request = (body = form(), headers = {}, method = 'POST') => {
  const req = new Request('https://private.invalid/upload', { method, body: method === 'POST' ? body : undefined })
  const h = new Headers(req.headers)
  h.set('authorization', 'Bearer sample-test-auth-token')
  for (const [key, value] of Object.entries(headers)) h.set(key, value)
  return new Request(req, { headers: h })
}
const fixture = () => {
  const seen = { auth: 0, authorize: 0, reserve: 0, confirm: 0, put: 0, stored: new Map(), details: null }
  const deps = {
    authenticate: async token => {
      seen.auth++
      return token === 'sample-test-auth-token' ? { id: actorId } : null
    },
    authorize: async (actor, question, version) => {
      seen.authorize++
      assert.equal(actor, actorId)
      assert.equal(question, questionId)
      assert.equal(version, 1)
      return true
    },
    reserve: async (actor, details) => {
      seen.reserve++
      assert.equal(actor, actorId)
      seen.details = details
      return intent()
    },
    confirm: async (actor, id, mime, bytes, sha256) => {
      seen.confirm++
      assert.equal(actor, actorId)
      assert.equal(id, assetId)
      assert.equal(mime, 'image/png')
      assert.equal(bytes, cleanImage.length)
      assert.equal(sha256, seen.details.sha256)
      return { id, question_id: questionId, question_version: 1, status: 'verified' }
    },
    sanitizer: { sanitize: async (_bytes, mime) => ({
      bytes: cleanImage, mime, width: 128, height: 64, frames: 1,
    }) },
    storage: {
      putIfAbsent: async (path, bytes, mime) => {
        seen.put++
        if (seen.stored.has(path)) throw Error('Cannot overwrite')
        seen.stored.set(path, { bytes: new Uint8Array(bytes), mime })
      },
      read: async path => seen.stored.get(path) || null,
    },
  }
  return { seen, deps, handler: createQuestionMediaUploadHandler(deps) }
}
const status = async (handler, req) => (await handler(req)).status

test('anonymous, bad tokens and bad methods never enter binary/image processing', async () => {
  const { seen, handler } = fixture()
  assert.equal(await status(handler, new Request('https://private.invalid/upload', { method: 'POST', body: form() })), 401)
  assert.equal(await status(handler, request(form(), { authorization: 'Bearer invalid-token-123' })), 401)
  assert.equal(await status(handler, request(null, {}, 'GET')), 405)
  assert.equal(seen.reserve, 0)
  assert.equal(seen.put, 0)
})

test('complete private flow reserves against authenticated actor and confirms persisted sanitized bytes', async () => {
  const { seen, handler } = fixture()
  const response = await handler(request())
  assert.equal(response.status, 201)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
  assert.deepEqual(await response.json(), { id: assetId, status: 'verified' })
  assert.equal(seen.auth, 1)
  assert.equal(seen.authorize, 1)
  assert.equal(seen.reserve, 1)
  assert.equal(seen.confirm, 1)
  assert.equal(seen.put, 1)
  assert.equal(seen.details.questionId, questionId)
  assert.equal(seen.details.questionVersion, 1)
  assert.equal(seen.details.requestId, requestId)
  assert.equal(seen.details.mime, 'image/png')
  assert.equal(seen.details.bytes, cleanImage.length)
  assert.equal(seen.details.sha256, Buffer.from(await webcrypto.subtle.digest('SHA-256', cleanImage)).toString('hex'))
  const saved = seen.stored.get(intent().storage_path)
  assert.deepEqual(saved.bytes, cleanImage)
  assert.equal(saved.mime, 'image/png')
})

test('verified same-request replay validates object integrity without rewriting immutable bytes', async () => {
  const { seen, deps } = fixture()
  deps.reserve = async () => { seen.reserve++; return { ...intent(), status: 'verified' } }
  seen.stored.set(intent().storage_path, { bytes: new Uint8Array(cleanImage), mime: 'image/png' })
  const handler = createQuestionMediaUploadHandler(deps)
  const response = await handler(request())
  assert.equal(response.status, 200)
  assert.equal(seen.put, 0)
  assert.equal(seen.confirm, 0)
  seen.stored.delete(intent().storage_path)
  assert.equal(await status(handler, request()), 409, 'missing verified object must fail closed')
  seen.stored.set(intent().storage_path, { bytes: new Uint8Array([...cleanImage.slice(0, -1), 255]), mime: 'image/png' })
  assert.equal(await status(handler, request()), 409, 'same-size tampered object must fail closed')
  seen.stored.set(intent().storage_path, { bytes: new Uint8Array(cleanImage), mime: 'image/jpeg' })
  assert.equal(await status(handler, request()), 409, 'wrong stored content type must fail closed')
  assert.equal(seen.put, 0)
})

test('rejects misleading content-type, non-image bytes, forged file MIME and absent file', async () => {
  const { seen, handler } = fixture()
  assert.equal(await status(handler, request(form(), { 'content-type': 'application/json' })), 415)
  assert.equal(await status(handler, request(form({ file: new Blob(['<svg></svg>'], { type: 'image/png' }) }))), 409)
  assert.equal(await status(handler, request(form({ file: new Blob([rawImage], { type: 'image/jpeg' }) }))), 409)
  assert.equal(await status(handler, request(form({ file: 'not a file' }))), 400)
  assert.equal(seen.reserve, 0)
})

test('refuses unknown fields, duplicates, missing fields, bad UUID and stale/invalid version', async () => {
  const { seen, handler } = fixture()
  const bad = [
    form({}, [['question_id', questionId]]), form({}, [['storage_path', 'public/escape']]),
    form({ request_id: 'incorrect' }), form({ question_id: 'AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA' }),
    form({ question_version: '0' }), form({ question_version: '1.0' }),
    form({ question_version: '9999999999' }), form({ alt_text: 'short' }),
    form({ rights_evidence: ' ' }), form({ file: new Blob([], { type: 'image/png' }) }),
  ]
  for (const item of bad) assert.equal(await status(handler, request(item)), 400)
  assert.equal(seen.reserve, 0)
  assert.equal(seen.put, 0)
})

test('enforces declared and actual stream size independently before parsing', async () => {
  const { seen, handler } = fixture()
  assert.equal(await status(handler, request(form(), { 'content-length': '9999999' })), 413)
  const huge = new Uint8Array(2 * 1024 * 1024 + 16 * 1024 + 5)
  const requestTooLarge = new Request('https://private.invalid/upload', {
    method: 'POST', body: huge,
    headers: { 'content-type': 'multipart/form-data; boundary=abc',
      'authorization': 'Bearer sample-test-auth-token' },
  })
  assert.equal(await status(handler, requestTooLarge), 413)
  assert.equal(seen.reserve, 0)
})

test('role/ownership failures and invalid reservations fail without storing any bytes', async () => {
  const { seen, deps } = fixture()
  deps.reserve = async () => { throw Error('sensitive database access denied') }
  const denied = await createQuestionMediaUploadHandler(deps)(request())
  assert.equal(denied.status, 409)
  assert.ok(!(await denied.text()).includes('sensitive'))
  assert.equal(seen.put, 0)
  deps.reserve = async () => ({ ...intent(), storage_path: 'evil-other-bucket' })
  assert.equal(await status(createQuestionMediaUploadHandler(deps), request()), 409)
  assert.equal(seen.put, 0)
})

test('broken object storage or confirmation exposes no internal secrets, never publishes', async () => {
  const { seen, deps } = fixture()
  deps.storage.putIfAbsent = async () => { throw Error('provider secret') }
  const resp = await createQuestionMediaUploadHandler(deps)(request())
  assert.equal(resp.status, 409)
  assert.ok(!(await resp.text()).includes('provider secret'))
  assert.equal(seen.confirm, 0)

  const other = fixture()
  other.deps.confirm = async () => { throw Error('database secret') }
  assert.equal(await status(createQuestionMediaUploadHandler(other.deps), request()), 409)
  assert.equal(other.seen.put, 1)
})

test('no user-controlled bucket, object path, owner or publication flags are forwarded to reserve', async () => {
  const { seen, handler } = fixture()
  assert.equal(await status(handler, request(form({}, [['active', 'true']]))), 400)
  assert.equal(seen.reserve, 0)
  assert.equal(await status(handler, request(form({}, [['created_by', actorId]]))), 400)
  assert.equal(seen.reserve, 0)
})


test('preflight blocks student or stale question before image decoding and storage', async () => {
  const { seen, deps } = fixture()
  let decoded = 0
  deps.authorize = async () => { seen.authorize++; return false }
  deps.sanitizer.sanitize = async () => { decoded++; throw Error('must not decode') }
  const response = await createQuestionMediaUploadHandler(deps)(request())
  assert.equal(response.status, 403)
  assert.equal(seen.authorize, 1)
  assert.equal(decoded, 0)
  assert.equal(seen.reserve, 0)
  assert.equal(seen.put, 0)
})

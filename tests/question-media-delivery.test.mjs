import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { webcrypto } from 'node:crypto'

if (!globalThis.crypto) globalThis.crypto = webcrypto
const source = readFileSync(new URL('../supabase/functions/_shared/questionMediaDelivery.ts', import.meta.url), 'utf8')
  .replace("import type { SafeImageMime } from './questionMedia.ts'", '')
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText
const { createQuestionMediaDeliveryHandler } = await import(
  'data:text/javascript;base64,' + Buffer.from(compiled).toString('base64')
)

const actorId = '05000000-0000-4000-8000-000000000001'
const attemptId = '05000000-0000-4000-8000-000000000002'
const questionId = '05000000-0000-4000-8000-000000000003'
const assetId = '05000000-0000-4000-8000-000000000004'
const bytes = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3, 4])
const digest = async value => Buffer.from(await webcrypto.subtle.digest('SHA-256', value)).toString('hex')
const grant = async (overrides = {}) => ({
  id: assetId, question_id: questionId, question_version: 3,
  storage_path: 'published/v1/' + questionId + '/3/' + assetId,
  mime_type: 'image/png', size_bytes: bytes.length, sha256: await digest(bytes),
  ...overrides,
})
const makeRequest = (options = {}) => {
  const params = new URLSearchParams(options.params || {
    attempt_id: attemptId, question_id: questionId, asset_id: assetId,
  })
  const headers = new Headers()
  if (options.token !== null) headers.set('authorization', options.token || 'Bearer sample-test-auth-token')
  if (options.range) headers.set('range', options.range)
  return new Request('https://media.invalid/question-media?' + params.toString(), {
    method: options.method || 'GET', headers,
  })
}
const fixture = async (settings = {}) => {
  const seen = { authenticate: 0, authorize: 0, read: 0, actor: null, ids: null }
  const metadata = await grant(settings.grant || {})
  const stored = settings.stored === undefined ? { bytes: new Uint8Array(bytes), mime: 'image/png' } : settings.stored
  const handler = createQuestionMediaDeliveryHandler({
    authenticate: async token => {
      seen.authenticate++
      return token === 'sample-test-auth-token' && !settings.unauthenticated ? { id: actorId } : null
    },
    authorize: async (actor, attempt, question, asset) => {
      seen.authorize++
      seen.actor = actor
      seen.ids = [attempt, question, asset]
      if (settings.authorizationError) throw Error('private database failure')
      if (settings.denied) return null
      return metadata
    },
    storage: {
      read: async path => {
        seen.read++
        if (settings.pathMismatch) assert.notEqual(path, metadata.storage_path)
        else assert.equal(path, metadata.storage_path)
        if (settings.storageError) throw Error('private storage failure')
        return stored
      },
    },
  })
  return { handler, seen, metadata }
}

test('serves only the exact authorized immutable bytes with strict no-store headers', async () => {
  const { handler, seen, metadata } = await fixture()
  const response = await handler(makeRequest())
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('content-type'), 'image/png')
  assert.equal(response.headers.get('content-length'), String(bytes.length))
  assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0')
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer')
  assert.equal(response.headers.get('content-security-policy'), "default-src 'none'; sandbox")
  assert.equal(response.headers.get('content-disposition'), 'inline; filename="question-image.png"')
  assert.equal(response.headers.get('cross-origin-resource-policy'), 'cross-origin')
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes)
  assert.equal(seen.actor, actorId)
  assert.deepEqual(seen.ids, [attemptId, questionId, assetId])
  assert.equal(seen.read, 1)
  assert.equal(metadata.storage_path, 'published/v1/' + questionId + '/3/' + assetId)
})

test('authenticates before database or storage access', async () => {
  const { handler, seen } = await fixture({ unauthenticated: true })
  const response = await handler(makeRequest())
  assert.equal(response.status, 401)
  assert.equal(seen.authorize, 0)
  assert.equal(seen.read, 0)
})

test('rejects invalid query keys, duplicates, UUIDs and non-GET requests', async () => {
  const { handler, seen } = await fixture()
  assert.equal((await handler(makeRequest({ params: { attempt_id: attemptId, question_id: questionId } }))).status, 400)
  const duplicate = new Request('https://media.invalid/?attempt_id=' + attemptId +
    '&question_id=' + questionId + '&asset_id=' + assetId + '&asset_id=' + assetId, {
    headers: { authorization: 'Bearer sample-test-auth-token' },
  })
  assert.equal((await handler(duplicate)).status, 400)
  assert.equal((await handler(makeRequest({ params: { attempt_id: 'not-a-uuid', question_id: questionId, asset_id: assetId } }))).status, 400)
  assert.equal((await handler(makeRequest({ method: 'POST' }))).status, 405)
  assert.equal((await handler(makeRequest({ range: 'bytes=0-4' }))).status, 416)
  assert.equal(seen.authorize, 0)
  assert.equal(seen.read, 0)
})

test('hides wrong-owner, expired, withdrawn and unknown asset results behind one response', async () => {
  const { handler, seen } = await fixture({ denied: true })
  const response = await handler(makeRequest())
  assert.equal(response.status, 404)
  assert.deepEqual(await response.json(), { error: 'Question image unavailable' })
  assert.equal(seen.read, 0)
})

test('rejects a database grant for a different question, asset, version or arbitrary path', async () => {
  const overrides = [
    { id: questionId },
    { question_id: attemptId },
    { question_version: 0 },
    { storage_path: 'https://example.invalid/secret.png' },
    { storage_path: '../secret' },
    { mime_type: 'image/svg+xml' },
    { size_bytes: 0 },
    { size_bytes: 2_097_153 },
    { sha256: 'bad' },
  ]
  for (const item of overrides) {
    const { handler, seen } = await fixture({ grant: item })
    const response = await handler(makeRequest())
    assert.equal(response.status, 404)
    assert.equal(seen.read, 0)
  }
})

test('verifies stored bytes, MIME, size and SHA-256 before sending', async () => {
  const badObjects = [
    { bytes: Uint8Array.from([1, 2]), mime: 'image/png' },
    { bytes: new Uint8Array(bytes), mime: 'image/jpeg' },
    { bytes: new Uint8Array([...bytes, 5]), mime: 'image/png' },
    { bytes: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 8, 8, 8, 8]), mime: 'image/png' },
    null,
  ]
  for (const stored of badObjects) {
    const { handler } = await fixture({ stored })
    const response = await handler(makeRequest())
    assert.equal(response.status, 404)
    assert.deepEqual(await response.json(), { error: 'Question image unavailable' })
  }
})

test('fails closed when authorization or storage throws and never leaks internal details', async () => {
  for (const settings of [{ authorizationError: true }, { storageError: true }]) {
    const { handler } = await fixture(settings)
    const response = await handler(makeRequest())
    assert.equal(response.status, 404)
    const body = await response.text()
    assert.ok(!body.includes('private database failure'))
    assert.ok(!body.includes('private storage failure'))
    assert.ok(!body.includes('published/v1/'))
  }
})

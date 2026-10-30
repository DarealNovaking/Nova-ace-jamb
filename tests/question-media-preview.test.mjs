import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { webcrypto } from 'node:crypto'

if (!globalThis.crypto) globalThis.crypto = webcrypto
const source = readFileSync(new URL('../supabase/functions/_shared/questionMediaPreview.ts', import.meta.url), 'utf8')
  .replace("import type { SafeImageMime } from './questionMedia.ts'", '')
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText
const { createQuestionMediaPreviewHandler } = await import(
  'data:text/javascript;base64,' + Buffer.from(compiled).toString('base64')
)

const actorId = '06000000-0000-4000-8000-000000000001'
const questionId = '06000000-0000-4000-8000-000000000002'
const assetId = '06000000-0000-4000-8000-000000000003'
const version = 4
const bytes = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 7, 6, 5, 4])
const digest = async value => Buffer.from(await webcrypto.subtle.digest('SHA-256', value)).toString('hex')
const grant = async (overrides = {}) => ({
  id: assetId, question_id: questionId, question_version: version,
  storage_path: 'staging/v1/' + questionId + '/' + assetId,
  mime_type: 'image/png', size_bytes: bytes.length, sha256: await digest(bytes),
  ...overrides,
})
const makeRequest = (options = {}) => {
  const params = new URLSearchParams(options.params || {
    question_id: questionId, version: String(version), asset_id: assetId,
  })
  const headers = new Headers()
  if (options.token !== null) headers.set('authorization', options.token || 'Bearer sample-review-token')
  if (options.range) headers.set('range', options.range)
  return new Request('https://media.invalid/question-media-preview?' + params.toString(), {
    method: options.method || 'GET', headers,
  })
}
const fixture = async (settings = {}) => {
  const seen = { authenticate: 0, authorize: 0, read: 0, actor: null, ids: null }
  const metadata = await grant(settings.grant || {})
  const stored = settings.stored === undefined ? { bytes: new Uint8Array(bytes), mime: 'image/png' } : settings.stored
  const handler = createQuestionMediaPreviewHandler({
    authenticate: async token => {
      seen.authenticate++
      return token === 'sample-review-token' && !settings.unauthenticated ? { id: actorId } : null
    },
    authorize: async (actor, question, revision, asset) => {
      seen.authorize++
      seen.actor = actor
      seen.ids = [question, revision, asset]
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

test('serves verified staging bytes only through a private no-store response', async () => {
  const { handler, seen, metadata } = await fixture()
  const response = await handler(makeRequest())
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('content-type'), 'image/png')
  assert.equal(response.headers.get('content-length'), String(bytes.length))
  assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0')
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer')
  assert.equal(response.headers.get('content-security-policy'), "default-src 'none'; sandbox")
  assert.equal(response.headers.get('content-disposition'), 'inline; filename="question-preview.png"')
  assert.equal(response.headers.get('cross-origin-resource-policy'), 'cross-origin')
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes)
  assert.equal(seen.actor, actorId)
  assert.deepEqual(seen.ids, [questionId, version, assetId])
  assert.equal(seen.read, 1)
  assert.equal(metadata.storage_path, 'staging/v1/' + questionId + '/' + assetId)
})

test('authenticates before any database or storage access', async () => {
  const { handler, seen } = await fixture({ unauthenticated: true })
  assert.equal((await handler(makeRequest())).status, 401)
  assert.equal(seen.authorize, 0)
  assert.equal(seen.read, 0)
})

test('rejects malformed query, duplicate parameters, invalid versions and non-GET/range requests', async () => {
  const { handler, seen } = await fixture()
  assert.equal((await handler(makeRequest({ params: { question_id: questionId, version: String(version) } }))).status, 400)
  assert.equal((await handler(makeRequest({ params: { question_id: questionId, version: '01', asset_id: assetId } }))).status, 400)
  assert.equal((await handler(makeRequest({ params: { question_id: questionId, version: '0', asset_id: assetId } }))).status, 400)
  const duplicate = new Request('https://media.invalid/?question_id=' + questionId +
    '&version=' + version + '&asset_id=' + assetId + '&asset_id=' + assetId, {
    headers: { authorization: 'Bearer sample-review-token' },
  })
  assert.equal((await handler(duplicate)).status, 400)
  assert.equal((await handler(makeRequest({ method: 'POST' }))).status, 405)
  assert.equal((await handler(makeRequest({ range: 'bytes=0-4' }))).status, 416)
  assert.equal(seen.authorize, 0)
  assert.equal(seen.read, 0)
})

test('denies unauthorized or mismatched staging grants without reading storage', async () => {
  const { handler, seen } = await fixture({ denied: true })
  assert.equal((await handler(makeRequest())).status, 404)
  assert.deepEqual(seen.read, 0)
  const badGrants = [
    { id: questionId },
    { question_id: assetId },
    { question_version: version - 1 },
    { storage_path: 'published/v1/' + questionId + '/' + version + '/' + assetId },
    { storage_path: '../secret' },
    { mime_type: 'image/svg+xml' },
    { size_bytes: 0 },
    { size_bytes: 2_097_153 },
    { sha256: 'bad' },
  ]
  for (const bad of badGrants) {
    const { handler: h, seen: calls } = await fixture({ grant: bad })
    assert.equal((await h(makeRequest())).status, 404)
    assert.equal(calls.read, 0)
  }
})

test('checks persisted bytes, size, MIME and digest before returning an image', async () => {
  const badObjects = [
    { bytes: Uint8Array.from([1, 2]), mime: 'image/png' },
    { bytes: new Uint8Array(bytes), mime: 'image/jpeg' },
    { bytes: new Uint8Array([...bytes, 9]), mime: 'image/png' },
    { bytes: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1, 1, 1, 1]), mime: 'image/png' },
    null,
  ]
  for (const stored of badObjects) {
    const { handler } = await fixture({ stored })
    const response = await handler(makeRequest())
    assert.equal(response.status, 404)
    assert.deepEqual(await response.json(), { error: 'Question image unavailable' })
  }
})

test('fails closed without leaking database or storage details', async () => {
  for (const settings of [{ authorizationError: true }, { storageError: true }]) {
    const { handler } = await fixture(settings)
    const response = await handler(makeRequest())
    assert.equal(response.status, 404)
    const body = await response.text()
    assert.ok(!body.includes('private database failure'))
    assert.ok(!body.includes('private storage failure'))
    assert.ok(!body.includes('staging/v1/'))
  }
})

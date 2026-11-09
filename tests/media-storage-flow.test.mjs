import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { webcrypto } from 'node:crypto'

if (!globalThis.crypto) globalThis.crypto = webcrypto
const code = ts.transpileModule(
  readFileSync(new URL('../supabase/functions/_shared/questionMedia.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } },
).outputText
const { prepareQuestionImage, persistQuestionImage } = await import(
  'data:text/javascript;base64,' + Buffer.from(code).toString('base64')
)
const prefix = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])
const png = (tail = [1, 2, 3, 4]) => Uint8Array.from([...prefix, ...tail])
const id = '03000000-0000-4000-8000-000000000001'
const question = '03000000-0000-4000-8000-000000000004'
const intent = () => ({
  id, question_id: question, question_version: 1,
  storage_path: 'staging/v1/' + question + '/' + id,
  status: 'pending',
  expires_at: new Date(Date.now() + 600_000).toISOString(),
})
const sanitizer = (output = {}) => ({
  sanitize: async bytes => ({
    bytes: png(), mime: 'image/png', width: 100, height: 100, frames: 1, ...output,
  }),
})
const storage = () => {
  const objects = new Map()
  return {
    objects,
    putIfAbsent: async (path, bytes, mime) => {
      if (objects.has(path)) throw Error('Immutable path exists')
      objects.set(path, { bytes: new Uint8Array(bytes), mime })
    },
    read: async path => {
      const row = objects.get(path)
      return row && { bytes: new Uint8Array(row.bytes), mime: row.mime }
    },
  }
}
const confirmed = values => (assetId, mime, length, sha256) => {
  values.push({ assetId, mime, length, sha256 })
  return Promise.resolve({ id: assetId, question_id: question, question_version: 1, status: 'verified' })
}

test('requires an actual sanitizer: magic bytes alone never authorize an image', async () => {
  await assert.rejects(prepareQuestionImage(png(), 'image/png', null), /could not be verified/)
  await assert.rejects(prepareQuestionImage(png(), 'image/jpeg', sanitizer()), /could not be verified/)
  await assert.rejects(prepareQuestionImage(Uint8Array.from([60, 115, 118, 103]), 'image/png', sanitizer()))
  await assert.rejects(prepareQuestionImage(png(), 'image/png', {
    sanitize: async () => { throw Error('untrusted internal processor error') },
  }), /could not be verified/)
})

test('trusted processor must return same MIME, real still dimensions and bounded re-encoded bytes', async () => {
  for (const override of [
    { mime: 'image/jpeg' }, { bytes: Uint8Array.from([60, 104, 116, 109, 108]) },
    { width: 0 }, { width: 4097 }, { height: 0 }, { height: 4097 },
    { frames: 2 }, { frames: 0 }, { bytes: png(Array(2_097_152).fill(1)) },
  ]) await assert.rejects(prepareQuestionImage(png(), 'image/png', sanitizer(override)), /could not be verified/)
})

test('input byte limits prevent oversized decode workloads', async () => {
  let called = 0
  await assert.rejects(prepareQuestionImage(png(Array(2_097_152).fill(1)), 'image/png', {
    sanitize: async () => { called++; return sanitizer().sanitize(png()) },
  }))
  assert.equal(called, 0)
})

test('prepares sanitized bytes and hashes output rather than trusting client hash', async () => {
  const prepared = await prepareQuestionImage(png([99]), 'image/png', sanitizer())
  const hash = await webcrypto.subtle.digest('SHA-256', png())
  assert.equal(prepared.sha256, Buffer.from(hash).toString('hex'))
  assert.deepEqual(prepared.bytes, png())
  assert.equal(prepared.width, 100)
})

test('validates returned database-owned object path before touching storage', async () => {
  const prepared = await prepareQuestionImage(png(), 'image/png', sanitizer())
  const rejected = [
    { ...intent(), storage_path: '../private' },
    { ...intent(), storage_path: 'https://example.com/object' },
    { ...intent(), question_id: id },
    { ...intent(), id: 'not-uuid' },
    { ...intent(), status: 'verified' },
    { ...intent(), question_version: 0 },
    { ...intent(), expires_at: new Date(Date.now() - 1000).toISOString() },
  ]
  for (const entry of rejected) {
    let writes = 0
    await assert.rejects(persistQuestionImage(entry, prepared, {
      putIfAbsent: async () => { writes++ },
      read: async () => null,
    }, confirmed([])), /could not be verified/)
    assert.equal(writes, 0)
  }
})

test('writes once, verifies persisted bytes and requires a consistent confirmation', async () => {
  const prepared = await prepareQuestionImage(png(), 'image/png', sanitizer())
  const store = storage(), calls = []
  await persistQuestionImage(intent(), prepared, store, confirmed(calls))
  assert.equal(calls.length, 1)
  assert.equal(calls[0].assetId, id)
  assert.equal(calls[0].sha256, prepared.sha256)
  assert.equal(store.objects.size, 1)
  assert.ok(store.objects.get(intent().storage_path).bytes.every((value, index) => value === prepared.bytes[index]))
  // Retry cannot overwrite the previous immutable object or confirm it twice.
  await assert.rejects(persistQuestionImage(intent(), prepared, store, confirmed(calls)))
  assert.equal(calls.length, 1)
})

test('detects tampering and readback/storage failures without confirming', async () => {
  const prepared = await prepareQuestionImage(png(), 'image/png', sanitizer())
  for (const tamper of [
    row => ({ ...row, bytes: png([1, 2, 3, 8]) }),
    row => ({ ...row, mime: 'image/jpeg' }),
    () => null,
  ]) {
    const store = storage(), calls = []
    store.read = async path => tamper(store.objects.get(path))
    await assert.rejects(persistQuestionImage(intent(), prepared, store, confirmed(calls)), /could not be verified/)
    assert.deepEqual(calls, [])
  }
})

test('storage failure and database confirmation failure never imply publication', async () => {
  const prepared = await prepareQuestionImage(png(), 'image/png', sanitizer())
  const calls = []
  await assert.rejects(persistQuestionImage(intent(), prepared, {
    putIfAbsent: async () => { throw Error('provider internal secret') },
    read: async () => null,
  }, confirmed(calls)), /could not be verified/)
  assert.equal(calls.length, 0)
  const store = storage()
  await assert.rejects(persistQuestionImage(intent(), prepared, store, async () => { throw Error('database failed') }))
  assert.equal(store.objects.size, 1, 'retained orphan must later be swept only after guarded reference checks')
})

test('refuses fabricated confirmation responses and altered bytes before write', async () => {
  const prepared = await prepareQuestionImage(png(), 'image/png', sanitizer())
  const wrong = async assetId => ({ id: assetId, question_id: id, question_version: 1, status: 'verified' })
  await assert.rejects(persistQuestionImage(intent(), prepared, storage(), wrong))
  prepared.bytes[8] ^= 7
  const store = storage()
  await assert.rejects(persistQuestionImage(intent(), prepared, store, confirmed([])))
  assert.equal(store.objects.size, 0)
})

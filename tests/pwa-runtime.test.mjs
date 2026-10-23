import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'

const workerSource = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8')

function createWorker({ fetchImpl = async () => new Response('network') } = {}) {
  const handlers = new Map()
  const cached = new Map()
  const calls = { addAll: [], put: [], deleted: [], skipWaiting: 0, claim: 0, fetch: [] }
  const cache = {
    async addAll(paths) { calls.addAll.push(...paths) },
    async match(key) { return cached.get(typeof key === 'string' ? key : key.url) ?? null },
    async put(key, response) { calls.put.push(key.url ?? key); cached.set(key.url ?? key, response) },
  }
  const cacheApi = {
    async open() { return cache },
    async match(key) { return cached.get(typeof key === 'string' ? key : key.url) ?? null },
    async keys() { return ['nova-ace-static-old', 'unrelated-cache'] },
    async delete(key) { calls.deleted.push(key); return true },
  }
  const self = {
    location: { origin: 'https://ace.test' },
    clients: { async claim() { calls.claim++ } },
    async skipWaiting() { calls.skipWaiting++ },
    addEventListener(name, handler) { handlers.set(name, handler) },
  }
  const context = {
    self,
    caches: cacheApi,
    URL,
    Promise,
    Response,
    fetch: async (request) => { calls.fetch.push(request.url ?? request); return fetchImpl(request) },
  }
  vm.runInNewContext(workerSource, context, { filename: 'public/sw.js' })
  return { handlers, cache, cached, calls }
}

test('service worker install pre-caches only the static app shell and activates promptly', async () => {
  const worker = createWorker()
  let pending
  worker.handlers.get('install')({ waitUntil(promise) { pending = promise } })
  await pending
  assert.deepEqual(worker.calls.addAll, ['/', '/manifest.webmanifest', '/nova-ace-icon.svg'])
  assert.equal(worker.calls.skipWaiting, 1)
})

test('service worker leaves auth, API, storage, realtime, functions and cross-origin requests untouched', () => {
  const worker = createWorker()
  const cases = [
    { method: 'GET', url: 'https://ace.test/auth/v1/token', mode: 'cors' },
    { method: 'GET', url: 'https://ace.test/rest/v1/profile', mode: 'cors' },
    { method: 'GET', url: 'https://ace.test/storage/v1/object/private/file', mode: 'cors' },
    { method: 'GET', url: 'https://ace.test/realtime/v1/websocket', mode: 'cors' },
    { method: 'GET', url: 'https://ace.test/functions/v1/example', mode: 'cors' },
    { method: 'GET', url: 'https://other.test/assets/app.js', mode: 'cors' },
    { method: 'POST', url: 'https://ace.test/assets/ignored.js', mode: 'cors' },
    { method: 'GET', url: 'https://ace.test/sw.js', mode: 'cors' },
  ]
  for (const request of cases) {
    let intercepted = false
    worker.handlers.get('fetch')({ request, respondWith() { intercepted = true } })
    assert.equal(intercepted, false, `unexpected interception for ${request.method} ${request.url}`)
  }
  assert.equal(worker.calls.fetch.length, 0)
  assert.equal(worker.calls.put.length, 0)
})

test('service worker caches successful same-origin build assets for repeat visits', async () => {
  const worker = createWorker({ fetchImpl: async () => ({ ok: true, type: 'basic', text: async () => 'bundle', clone: () => new Response('bundle', { status: 200 }) }) })
  const request = { method: 'GET', url: 'https://ace.test/assets/app-abc123.js', mode: 'cors' }
  let pending
  worker.handlers.get('fetch')({ request, respondWith(promise) { pending = promise } })
  const response = await pending
  assert.equal(await response.text(), 'bundle')
  assert.deepEqual(worker.calls.fetch, [request.url])
  assert.deepEqual(worker.calls.put, [request.url])
  const cachedResponse = await worker.cache.match(request.url)
  assert.ok(cachedResponse)
  assert.equal(await cachedResponse.text(), 'bundle')
})

test('service worker uses the static app shell when a navigation request is offline', async () => {
  const worker = createWorker({ fetchImpl: async () => { throw new Error('offline') } })
  const shell = new Response('<html>app shell</html>', { status: 200 })
  worker.cached.set('/', shell)
  const request = { method: 'GET', url: 'https://ace.test/learn', mode: 'navigate' }
  let pending
  worker.handlers.get('fetch')({ request, respondWith(promise) { pending = promise } })
  const response = await pending
  assert.equal(response.status, 200)
  assert.equal(await response.text(), '<html>app shell</html>')
  assert.deepEqual(worker.calls.put, [])
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const worker = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8')
const manifest = JSON.parse(await readFile(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'))

test('PWA caches only the static app shell and versioned build assets', () => {
  assert.match(worker, /const APP_SHELL = \['\/', '\/manifest\.webmanifest', '\/nova-ace-icon\.svg'\]/)
  assert.match(worker, /request\.method !== 'GET' \|\| url\.origin !== self\.location\.origin/)
  assert.match(worker, /if \(url\.pathname\.startsWith\('\/assets\/'\)\)/)
  assert.match(worker, /if \(response\.ok && response\.type === 'basic'\) await cache\.put\(request, response\.clone\(\)\)/)
  assert.match(worker, /if \(request\.mode === 'navigate'\)/)
  assert.match(worker, /fetch\(request\)\.catch\(async \(\) => \(await caches\.match\('\/'\)\) \|\| Response\.error\(\)\)/)
})

test('PWA never caches auth, API, storage, realtime, functions, or service-worker requests', () => {
  assert.match(worker, /const EXCLUDED_PREFIXES = \['\/rest\/', '\/auth\/', '\/functions\/', '\/storage\/', '\/realtime\/', '\/api\/'\]/)
  assert.match(worker, /EXCLUDED_PREFIXES\.some\(\(prefix\) => url\.pathname\.startsWith\(prefix\)\) \|\| url\.pathname === '\/sw\.js'/)
  const guardIndex = worker.indexOf('EXCLUDED_PREFIXES.some')
  const respondWithIndex = worker.indexOf('event.respondWith', worker.indexOf("self.addEventListener('fetch'"))
  assert.ok(guardIndex >= 0 && respondWithIndex > guardIndex, 'privacy exclusions must run before any response caching/fallback handler')
})

test('PWA manifest uses a root-scoped standalone app shell and branded icon', () => {
  assert.equal(manifest.start_url, '/')
  assert.equal(manifest.scope, '/')
  assert.equal(manifest.display, 'standalone')
  assert.ok(manifest.icons.some((icon) => icon.src === '/nova-ace-icon.svg'))
})

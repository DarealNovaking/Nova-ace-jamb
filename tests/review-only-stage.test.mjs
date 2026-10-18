import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../src/components/AdminReviewOnlyStage.tsx', import.meta.url), 'utf8')

test('review-only staging submits exactly one institution row', () => {
  assert.match(source, /rows:\s*\[\s*\{/)
  assert.match(source, /if\s*\(body\.rows\.length\s*!==\s*1\)/)
  assert.match(source, /data\?\.status\s*!==\s*'staged'/)
  assert.match(source, /data\?\.row_count\s*!==\s*1/)
})

test('review-only staging never calls validation, approval, or publication RPCs', () => {
  assert.doesNotMatch(source, /rpc\(['"]validate_catalog_batch['"]/)
  assert.doesNotMatch(source, /rpc\(['"]approve_catalog_batch['"]/)
  assert.doesNotMatch(source, /rpc\(['"]publish_catalog_batch['"]/)
})

test('review-only staging requires an approved source and explicit confirmation', () => {
  assert.match(source, /item\.status === 'approved'/)
  assert.match(source, /!confirmed/)
  assert.match(source, /purpose: 'review-only safety verification'/)
})

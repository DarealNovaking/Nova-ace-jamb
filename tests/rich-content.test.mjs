import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

const source = readFileSync(new URL('../src/lib/richContent.ts', import.meta.url), 'utf8')
const compile = (code, jsx = false) => ts.transpileModule(code, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: jsx ? ts.JsxEmit.ReactJSX : undefined },
}).outputText
const load = (code, dependencies = {}) => {
  const module = { exports: {} }
  const requireNative = createRequire(import.meta.url)
  new Function('require', 'module', 'exports', code)(
    name => dependencies[name] ?? requireNative(name), module, module.exports,
  )
  return module.exports
}
const { createRichContent, parseRichContent, richContentFallback } = load(compile(source))
const viewSource = readFileSync(new URL('../src/components/RichContentView.tsx', import.meta.url), 'utf8')
const { default: RichContentView } = load(compile(viewSource, true), {
  '../lib/richContent': { parseRichContent },
})
const id = '03000000-0000-4000-8000-000000000001'
const example = () => createRichContent([
  { type: 'paragraph', text: '  Find the area of the rectangle. ' },
  { type: 'equation', expression: 'A = l × w', spoken: 'Area equals length multiplied by width' },
  { type: 'table', caption: 'Measurements', headers: ['Length', 'Width'], rows: [['3 m', '2 m'], ['4 m', '5 m']] },
  { type: 'image', asset_id: id, alt: 'A rectangle labelled length 3 m and width 2 m', caption: 'Diagram 1' },
])
const view = value => renderToStaticMarkup(createElement(RichContentView, { value }))

test('v1 documents have deterministic accessible text fallbacks', () => {
  const document = example()
  assert.equal(document.version, 1)
  assert.match(document.fallback_text, /Area equals length multiplied by width/)
  assert.match(document.fallback_text, /Measurements\nLength \| Width/)
  assert.match(document.fallback_text, /Diagram: A rectangle/)
  assert.deepEqual(parseRichContent(document), document)
  assert.equal(richContentFallback(document), document.fallback_text)
  assert.equal(document.blocks[0].text, 'Find the area of the rectangle.')
})

test('rejects unknown versions, document fields, and inconsistent text fallbacks', () => {
  const document = example()
  for (const candidate of [
    { ...document, version: 2 },
    { ...document, html: '<img src=x>' },
    { ...document, fallback_text: 'Unrelated content' },
    { ...document, fallback_text: '' },
    { ...document, blocks: [] },
    { ...document, blocks: null },
    null,
  ]) assert.throws(() => parseRichContent(candidate), /Unsupported/)
})

test('rejects nested HTML, URL, and executable props instead of rendering them', () => {
  const document = example()
  const blocks = document.blocks
  for (const altered of [
    { ...blocks[0], html: '<b>hi</b>' },
    { ...blocks[1], latex: '\\html{<img>}' },
    { ...blocks[2], style: { color: 'red' } },
    { ...blocks[3], src: 'https://example.com/pixel.png' },
    { ...blocks[3], url: 'javascript:alert(1)' },
    { ...blocks[3], asset_id: 'https://example.com/a.png' },
  ]) assert.throws(() => createRichContent([altered]), /Unsupported/)
})

test('enforces block, media, table, and total-text bounds', () => {
  const paragraph = { type: 'paragraph', text: 'Short question' }
  assert.throws(() => createRichContent(Array(25).fill(paragraph)))
  assert.throws(() => createRichContent(Array(5).fill(example().blocks[3])))
  assert.throws(() => createRichContent(Array(4).fill(example().blocks[2])))
  assert.throws(() => createRichContent([{ type: 'paragraph', text: 'x'.repeat(6001) }]))
  assert.throws(() => createRichContent(Array(5).fill({ type: 'paragraph', text: 'x'.repeat(5999) })))
  assert.throws(() => createRichContent([{ type: 'table', caption: 'Large', headers: ['A', 'B'], rows: Array(21).fill(['x', 'y']) }]))
  assert.throws(() => createRichContent([{ type: 'table', caption: 'Mismatch', headers: ['A', 'B'], rows: [['x']] }]))
})

test('rejects spoofing controls and malformed equation/image payloads', () => {
  for (const entry of [
    { type: 'paragraph', text: 'abc\u202Edef' },
    { type: 'paragraph', text: '\u0000' },
    { type: 'equation', expression: 'x + y', spoken: '' },
    { type: 'image', asset_id: id, alt: 'Photo', caption: '' },
    { type: 'image', asset_id: 'bad', alt: 'Meaningful diagram description', caption: '' },
    { type: 'table', caption: 'Rows', headers: ['A', 'B'], rows: [['ok', '\u0007']] },
  ]) assert.throws(() => createRichContent([entry]), /Unsupported/)
})

test('renders semantic tables, readable math and inaccessible media fallback', () => {
  const html = view(example())
  assert.match(html, /role="math" aria-label="Area equals length multiplied by width"/)
  assert.match(html, /<caption[^>]*>Measurements<\/caption>/)
  assert.match(html, /<th scope="col"/)
  assert.match(html, /<td /)
  assert.match(html, /Diagram unavailable: A rectangle labelled/)
  assert.match(html, /Diagram 1/)
  assert.doesNotMatch(html, /<img\b|src=|dangerouslySetInnerHTML/)
})

test('escapes untrusted paragraph markup instead of interpreting it', () => {
  const html = view(createRichContent([{ type: 'paragraph', text: '<img src=x onerror=alert(1)> & π' }]))
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt; &amp; π/)
  assert.doesNotMatch(html, /<img\b/)
})

test('invalid documents fail closed in UI instead of leaking untrusted content', () => {
  const html = view({ version: 1, blocks: [{ type: 'paragraph', text: 'private' }], fallback_text: 'fake' })
  assert.match(html, /content is unavailable/)
  assert.doesNotMatch(html, /private|fake/)
})

test('preserves Unicode equations, whitespace and empty table cells safely', () => {
  const document = createRichContent([
    { type: 'equation', expression: 'πr² = 16π', spoken: 'Pi times radius squared equals sixteen pi' },
    { type: 'table', caption: 'Blank cells', headers: ['X', 'Y'], rows: [[' ', '42']] },
  ])
  assert.equal(document.blocks[1].rows[0][0], '')
  assert.match(view(document), /πr² = 16π/)
  assert.match(view(document), /<td[^>]*><\/td>/)
})

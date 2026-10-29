/**
 * FCB-03 rich question content v1.
 *
 * This is an untrusted-data boundary and a preview/read contract, NOT permission
 * to store rich drafts in the current text-only manage_question RPC.
 * The server must independently enforce this same contract and media rights
 * before accepting or delivering any rich content.
 */
export type RichBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'equation'; expression: string; spoken: string }
  | { type: 'table'; caption: string; headers: string[]; rows: string[][] }
  | { type: 'image'; asset_id: string; alt: string; caption: string }

export type RichDocument = {
  version: 1
  blocks: RichBlock[]
  /** Exact, deterministic plain-text projection for indexing and accessibility. */
  fallback_text: string
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u
const MAX_BLOCKS = 24
const MAX_IMAGES = 4
const MAX_TABLES = 3
const MAX_DOCUMENT_LENGTH = 32000
const MAX_FALLBACK_LENGTH = 20000

function fail(): never {
  throw new Error('Unsupported or oversized question content. Use the approved rich-content format.')
}
function object(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype: unknown = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}
function fields(value: Record<string, unknown>, allowed: readonly string[], required: readonly string[]): void {
  if (Object.keys(value).some(key => !allowed.includes(key)) || required.some(key => !Object.hasOwn(value, key))) fail()
}
function plain(value: unknown, max: number, min = 1): string {
  if (typeof value !== 'string' || CONTROL.test(value)) fail()
  const clean = value.trim()
  if (clean.length < min || clean.length > max) fail()
  return clean
}
function block(value: unknown): RichBlock {
  if (!object(value)) fail()
  switch (value.type) {
    case 'paragraph':
      fields(value, ['type', 'text'], ['type', 'text'])
      return { type: 'paragraph', text: plain(value.text, 6000) }
    case 'equation':
      fields(value, ['type', 'expression', 'spoken'], ['type', 'expression', 'spoken'])
      return { type: 'equation', expression: plain(value.expression, 1000), spoken: plain(value.spoken, 400) }
    case 'table': {
      fields(value, ['type', 'caption', 'headers', 'rows'], ['type', 'caption', 'headers', 'rows'])
      if (!Array.isArray(value.headers) || value.headers.length < 2 || value.headers.length > 6 ||
          !Array.isArray(value.rows) || value.rows.length < 1 || value.rows.length > 20 ||
          value.rows.length * value.headers.length > 120) fail()
      const headers = value.headers.map(header => plain(header, 160))
      const rows: string[][] = value.rows.map(row => {
        if (!Array.isArray(row) || row.length !== headers.length) fail()
        return row.map(cell => plain(cell, 240, 0))
      })
      return { type: 'table', caption: plain(value.caption, 240), headers, rows }
    }
    case 'image': {
      fields(value, ['type', 'asset_id', 'alt', 'caption'], ['type', 'asset_id', 'alt', 'caption'])
      if (typeof value.asset_id !== 'string' || !UUID.test(value.asset_id)) fail()
      return {
        type: 'image',
        asset_id: value.asset_id.toLowerCase(),
        alt: plain(value.alt, 500, 8),
        caption: plain(value.caption, 240, 0),
      }
    }
    default:
      return fail()
  }
}

/** Only validated documents should be passed to this formatter. */
export function richContentFallback(document: RichDocument): string {
  return document.blocks.map(item => {
    switch (item.type) {
      case 'paragraph': return item.text
      case 'equation': return item.expression + ' — ' + item.spoken
      case 'table':
        return [item.caption, item.headers.join(' | '), ...item.rows.map(row => row.join(' | '))].join('\n')
      case 'image': return 'Diagram: ' + item.alt + (item.caption ? '\n' + item.caption : '')
    }
  }).join('\n\n')
}

export function parseRichContent(value: unknown): RichDocument {
  if (!object(value)) fail()
  fields(value, ['version', 'blocks', 'fallback_text'], ['version', 'blocks', 'fallback_text'])
  if (value.version !== 1 || !Array.isArray(value.blocks) ||
      value.blocks.length < 1 || value.blocks.length > MAX_BLOCKS) fail()
  const blocks = value.blocks.map(block)
  if (blocks.filter(item => item.type === 'image').length > MAX_IMAGES ||
      blocks.filter(item => item.type === 'table').length > MAX_TABLES) fail()
  const document: RichDocument = { version: 1, blocks, fallback_text: '' }
  document.fallback_text = richContentFallback(document)
  if (document.fallback_text.length > MAX_FALLBACK_LENGTH ||
      value.fallback_text !== document.fallback_text ||
      JSON.stringify(document).length > MAX_DOCUMENT_LENGTH) fail()
  return document
}

/** Helper for constructing a preview while still checking the exact same limits. */
export function createRichContent(blocks: RichBlock[]): RichDocument {
  const document: RichDocument = { version: 1, blocks, fallback_text: '' }
  document.fallback_text = richContentFallback(document)
  return parseRichContent(document)
}

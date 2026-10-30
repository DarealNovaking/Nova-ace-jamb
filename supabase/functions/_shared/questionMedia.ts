/**
 * FCB-03 PRIVATE backend-only image processing boundary. Not an HTTP endpoint.
 *
 * Trust contract: the caller authenticates the user against current ace.roles,
 * obtains a guarded database intent, and injects a real decoder/re-encoder
 * which validates *actual image bytes*. No decoder is shipped here; activation
 * MUST fail until a production-grade safe processor is integrated.
 *
 * Never import this into the student/admin browser bundle. No signed URLs,
 * Storage bucket permissions, upload API or publication are provided.
 */
export type SafeImageMime = 'image/png' | 'image/jpeg' | 'image/webp'
export type PreparedQuestionImage = {
  bytes: Uint8Array
  mime: SafeImageMime
  sha256: string
  width: number
  height: number
}
export type Sanitizer = {
  /** Must fully decode and securely re-encode as one still image, stripping metadata. */
  sanitize(bytes: Uint8Array, mime: SafeImageMime): Promise<{
    bytes: Uint8Array
    mime: SafeImageMime
    width: number
    height: number
    frames: number
  }>
}
export type PrivateObjectStorage = {
  /** Create immutable object. Must fail rather than replace existing bytes. */
  putIfAbsent(path: string, bytes: Uint8Array, mime: SafeImageMime): Promise<void>
  /** Return exact persisted bytes for digest comparison, never a public URL. */
  read(path: string): Promise<{ bytes: Uint8Array; mime: string } | null>
}
export type MediaIntent = {
  id: string
  question_id: string
  question_version: number
  storage_path: string
  status: 'pending' | 'verified'
  expires_at: string
}
export type ConfirmMediaIntent = (
  id: string, mime: SafeImageMime, size: number, sha256: string,
) => Promise<{ id: string; question_id: string; question_version: number; status: 'verified' }>

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const MAX_BYTES = 2 * 1024 * 1024
const MAX_DIMENSION = 4096
function refusal(): never { throw Error('Question image could not be verified or saved.') }
function detectedMime(bytes: Uint8Array): SafeImageMime | null {
  if (bytes.length >= 8 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b)) return 'image/png'
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg'
  if (bytes.length >= 12 &&
    [82, 73, 70, 70].every((b, i) => bytes[i] === b) &&
    [87, 69, 66, 80].every((b, i) => bytes[i + 8] === b)) return 'image/webp'
  return null
}
async function digest(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes)
  const hash = await globalThis.crypto.subtle.digest('SHA-256', copy)
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('')
}
function validSize(bytes: Uint8Array): boolean {
  return bytes.length > 0 && bytes.length <= MAX_BYTES
}

/** The required decoder cannot be optional or replaced by magic-byte checks. */
export async function prepareQuestionImage(
  input: Uint8Array, claimedMime: string, decoder: Sanitizer,
): Promise<PreparedQuestionImage> {
  if (!(input instanceof Uint8Array) || !validSize(input) ||
      !decoder || typeof decoder.sanitize !== 'function') refusal()
  const actual = detectedMime(input)
  if (!actual || actual !== claimedMime) refusal()
  let result: Awaited<ReturnType<Sanitizer['sanitize']>>
  try { result = await decoder.sanitize(new Uint8Array(input), actual) }
  catch { return refusal() }
  if (!(result?.bytes instanceof Uint8Array) || !validSize(result.bytes) ||
      result.mime !== actual || detectedMime(result.bytes) !== actual ||
      !Number.isInteger(result.width) || result.width < 1 || result.width > MAX_DIMENSION ||
      !Number.isInteger(result.height) || result.height < 1 || result.height > MAX_DIMENSION ||
      result.frames !== 1) refusal()
  return {
    bytes: new Uint8Array(result.bytes),
    mime: actual,
    sha256: await digest(result.bytes),
    width: result.width,
    height: result.height,
  }
}

/**
 * Called only after reserve_question_media_intent returned its server-owned
 * opaque path. This method never signs URLs and never marks images published.
 *
 * Storage is not transactional with PostgreSQL. A failed write/read/confirm
 * leaves the DB intent pending and requires guarded orphan cleanup later.
 */
export async function persistQuestionImage(
  intent: MediaIntent, prepared: PreparedQuestionImage,
  storage: PrivateObjectStorage, confirm: ConfirmMediaIntent,
): Promise<void> {
  if (!intent || !UUID.test(intent.id) || !UUID.test(intent.question_id) ||
      !Number.isInteger(intent.question_version) || intent.question_version < 1 ||
      intent.status !== 'pending' || typeof intent.expires_at !== 'string' ||
      !Number.isFinite(Date.parse(intent.expires_at)) ||
      Date.parse(intent.expires_at) <= Date.now() ||
      intent.storage_path !== 'staging/v1/' + intent.question_id + '/' + intent.id ||
      !prepared || !validSize(prepared.bytes) ||
      !['image/png', 'image/jpeg', 'image/webp'].includes(prepared.mime) ||
      detectedMime(prepared.bytes) !== prepared.mime ||
      !/^[0-9a-f]{64}$/.test(prepared.sha256) ||
      (await digest(prepared.bytes)) !== prepared.sha256) refusal()
  if (!storage || typeof storage.putIfAbsent !== 'function' || typeof storage.read !== 'function' ||
      typeof confirm !== 'function') refusal()
  try {
    await storage.putIfAbsent(intent.storage_path, new Uint8Array(prepared.bytes), prepared.mime)
    const stored = await storage.read(intent.storage_path)
    if (!stored || stored.mime !== prepared.mime || !(stored.bytes instanceof Uint8Array) ||
        !validSize(stored.bytes) || (await digest(stored.bytes)) !== prepared.sha256) refusal()
    const result = await confirm(intent.id, prepared.mime, prepared.bytes.length, prepared.sha256)
    if (result.id !== intent.id || result.question_id !== intent.question_id ||
        result.question_version !== intent.question_version || result.status !== 'verified') refusal()
  } catch { refusal() }
}

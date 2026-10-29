import { prepareQuestionImage } from '../../supabase/functions/_shared/questionMedia.ts'
import { magickQuestionSanitizer } from '../../supabase/functions/_shared/magickQuestionSanitizer.ts'

const image = Uint8Array.from(
  atob('iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAIAAAA2iEnWAAAAFElEQVR4nGOs5tFlYGBgYmBgQFAADf4AutKYZF0AAAAASUVORK5CYII='),
  char => char.charCodeAt(0),
)
function check(condition: unknown, label: string): void {
  if (!condition) throw Error(label)
}
async function denied(bytes: Uint8Array, mime: string): Promise<void> {
  let refused = false
  try { await prepareQuestionImage(bytes, mime, magickQuestionSanitizer) }
  catch { refused = true }
  check(refused, 'Malformed image was accepted')
}

Deno.test('real WASM decoder re-encodes legitimate still PNG with correct pixel dimensions', async () => {
  const prepared = await prepareQuestionImage(image, 'image/png', magickQuestionSanitizer)
  check(prepared.width === 2 && prepared.height === 3, 'Decoded dimensions mismatch')
  check(prepared.mime === 'image/png', 'MIME changed unexpectedly')
  check(prepared.bytes.length > 8, 'No sanitized bytes')
  check(prepared.bytes.slice(0, 8).every((v, i) => v === image[i]), 'Not real PNG output')
  const repeat = await prepareQuestionImage(prepared.bytes, 'image/png', magickQuestionSanitizer)
  check(repeat.width === 2 && repeat.height === 3, 'Sanitized output cannot be decoded')
  check(/^[0-9a-f]{64}$/.test(prepared.sha256), 'Sanitized content has no SHA-256')
})

Deno.test('real decoder rejects spoofed headers, corrupt images, unsupported MIME and oversized input', async () => {
  await denied(Uint8Array.from([...image.slice(0, 8), 1, 2, 3, 4, 5]), 'image/png')
  await denied(image, 'image/jpeg')
  await denied(new Uint8Array(2 * 1024 * 1024 + 1), 'image/png')
  await denied(Uint8Array.from([60, 115, 118, 103, 62]), 'image/png')
})

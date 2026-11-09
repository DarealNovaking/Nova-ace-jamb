/**
 * A REAL still-image decoder/re-encoder for the FCB-03 private upload pipeline.
 * SOURCE ONLY — not deployed or connected to production Storage/Postgres.
 *
 * Supabase Edge Functions run WASM but not native Sharp. Pin the WASM dependency;
 * no external executable, public URL, or browser image processing is involved.
 * The frontend never imports this module.
 */
import {
  ImageMagick, initializeImageMagick, MagickFormat, ResourceLimits,
} from 'npm:@imagemagick/magick-wasm@0.0.44'
import type { Sanitizer, SafeImageMime } from './questionMedia.ts'

const MAX_DIMENSION = 4096
const MAX_AREA = 4096 * 4096
const MAX_OUTPUT = 2 * 1024 * 1024
let initialization: Promise<void> | undefined

function ensureReady(): Promise<void> {
  if (!initialization) initialization = (async () => {
    // Exact mechanism recommended for Supabase's Edge/WASM runtime.
    const wasm = await Deno.readFile(
      new URL('x86/magick.wasm', import.meta.resolve('npm:@imagemagick/magick-wasm@0.0.44')),
    )
    await initializeImageMagick(wasm)
    // The default ImageMagick policy is broader than an untrusted file uploader.
    ResourceLimits.width = BigInt(MAX_DIMENSION)
    ResourceLimits.height = BigInt(MAX_DIMENSION)
    ResourceLimits.area = BigInt(MAX_AREA)
    ResourceLimits.listLength = 2n // Permit detection, never acceptance, of animation.
    ResourceLimits.memory = 96n * 1024n * 1024n
    ResourceLimits.disk = 0n
    ResourceLimits.time = 5n
  })()
  return initialization
}

const formatOf = (mime: SafeImageMime) =>
  mime === 'image/png' ? MagickFormat.Png :
  mime === 'image/jpeg' ? MagickFormat.Jpeg : MagickFormat.WebP

/**
 * Full decode, exactly one frame, bounds checked both by the decoder resource
 * policy and after decoding, remove profiles/comments and re-encode the pixels.
 * All unknown or unsupported input formats are rejected by the calling
 * prepareQuestionImage() magic/MIME contract before reaching this function.
 */
export const magickQuestionSanitizer: Sanitizer = {
  async sanitize(input, mime) {
    if (!(input instanceof Uint8Array) || input.length === 0 ||
        input.length > MAX_OUTPUT || !['image/png', 'image/jpeg', 'image/webp'].includes(mime)) {
      throw Error('Unsupported image')
    }
    await ensureReady()
    const format = formatOf(mime)
    return ImageMagick.readCollection(input, format, collection => {
      if (collection.length !== 1) throw Error('Animated or empty image')
      const image = collection[0]
      const width = image.width
      const height = image.height
      if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) ||
          width < 1 || height < 1 || width > MAX_DIMENSION ||
          height > MAX_DIMENSION || width * height > MAX_AREA) {
        throw Error('Invalid decoded image dimensions')
      }
      image.strip()
      if (mime !== 'image/png') image.quality = 85
      // Copy while WASM owns the buffer; output is detached from decoder memory.
      const bytes = image.write(format, data => new Uint8Array(data))
      if (!bytes.length || bytes.length > MAX_OUTPUT) throw Error('Image too large')
      return { bytes, mime, width, height, frames: 1 }
    })
  },
}

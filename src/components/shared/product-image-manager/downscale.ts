import { IMAGE_EDGE_PX, IMAGE_JPEG_QUALITY } from '@/lib/utils/image-upload'

/**
 * Shrinks an image to the stored size before it leaves the device.
 *
 * This is the difference between a usable and an unusable upload on the 3G
 * connections this project targets: a modern phone photo is 4-12 MB, and the
 * stored copy is ~200 KB, so resizing here rather than server-side removes
 * around 95% of the bytes a partner has to push over the network. It also
 * keeps parity with scripts/upload-product-images.mjs, which produces the same
 * 1600px JPEG for the seeded catalog.
 *
 * Falls back to the original file if the browser cannot decode or re-encode
 * it. That path still succeeds — the server accepts up to MAX_UPLOAD_BYTES and
 * re-validates the format either way — it is just slower.
 */
export async function downscaleImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, IMAGE_EDGE_PX / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close()
      return file
    }

    // JPEG has no alpha channel, so a transparent PNG cutout would otherwise
    // flatten onto black. Product shots belong on white.
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', IMAGE_JPEG_QUALITY)
    )
    if (!blob) return file

    const name = file.name.replace(/\.[^.]+$/, '') || 'image'
    return new File([blob], `${name}.jpg`, { type: 'image/jpeg' })
  } catch {
    return file
  }
}

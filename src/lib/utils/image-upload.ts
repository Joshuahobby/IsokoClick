// Shared upload constraints. Imported by both the client picker and the server
// action so the two can never disagree about what is acceptable.

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export type AcceptedImageType = (typeof ACCEPTED_IMAGE_TYPES)[number]

// Lives here rather than beside the queries because the client picker needs it
// too, and that module pulls in the service-role client.
// The PDP renders one hero plus up to four thumbnails, so a sixth image would
// be uploaded, stored and never shown.
export const MAX_IMAGES_PER_PRODUCT = 5

/**
 * Ceiling on what the server will accept, not a target.
 *
 * The picker downscales to roughly 200 KB before anything leaves the device,
 * so this only ever catches a client that skipped that step — a failed canvas
 * decode, or a crafted request. Generous enough not to reject a legitimate
 * unprocessed phone photo.
 */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024

/** Longest edge of a stored image, matching scripts/upload-product-images.mjs. */
export const IMAGE_EDGE_PX = 1600
export const IMAGE_JPEG_QUALITY = 0.82

export function isAcceptedImageType(value: string): value is AcceptedImageType {
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(value)
}

export function extensionFor(type: AcceptedImageType): string {
  switch (type) {
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    default:
      return 'jpg'
  }
}

/**
 * Identifies an image by its leading bytes rather than its declared type.
 *
 * A multipart part's Content-Type is attacker-controlled, and the bucket is
 * public — so a file labelled image/jpeg but containing markup would be served
 * back from our own origin under that label. Sniffing means the stored object's
 * content type always reflects what the bytes actually are.
 *
 * Returns null for anything that is not one of the three accepted formats.
 */
export function sniffImageType(bytes: Uint8Array): AcceptedImageType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'
  }

  const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  if (bytes.length >= PNG.length && PNG.every((b, i) => bytes[i] === b)) {
    return 'image/png'
  }

  // RIFF....WEBP — the four size bytes between the two markers are skipped.
  const ascii = (start: number, text: string) =>
    [...text].every((ch, i) => bytes[start + i] === ch.charCodeAt(0))
  if (bytes.length >= 12 && ascii(0, 'RIFF') && ascii(8, 'WEBP')) {
    return 'image/webp'
  }

  return null
}

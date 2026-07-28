/**
 * Processes the ISOKOCLICK photo library and publishes it to Supabase Storage.
 *
 * Sources are 4096px or 8192px square PNGs, up to 60 MB each — far too heavy
 * to serve or to commit. Each one is cropped (where a third-party mark has to
 * go), squared to 1600px and re-encoded as JPEG. `next/image` re-encodes again
 * to AVIF/WebP at render size, so 1600px is the useful ceiling: the largest
 * slot in the UI is the PDP hero at 50vw.
 *
 * Storage layout follows the convention already live in the bucket:
 *   product-images/{slug}/primary.jpg, 02.jpg, 03.jpg, ...
 *
 * Run:
 *   node scripts/upload-product-images.mjs --dry-run   # write locally + build a review sheet
 *   node scripts/upload-product-images.mjs             # process and upload
 */
import { mkdir, writeFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { createAdminClient, ROOT } from './lib/admin-client.mjs'
import { MANIFEST, EXCLUDED } from './product-image-manifest.mjs'

const SOURCE_DIR =
  process.env.PHOTO_SOURCE_DIR ?? 'C:/Users/Joesure/Downloads/ISOKOCLICK/Pictures'
const BUCKET = 'product-images'
const EDGE = 1600
const QUALITY = 82

const DRY_RUN = process.argv.includes('--dry-run')
const DRY_DIR = path.join(ROOT, '.tmp-product-images')

/** Applies the manifest's fractional edge insets, then squares the frame. */
async function renderImage(file, crop) {
  const input = path.join(SOURCE_DIR, file)
  const pipeline = sharp(input)
  const { width, height } = await pipeline.metadata()

  if (crop) {
    const left = Math.round(width * (crop.left ?? 0))
    const top = Math.round(height * (crop.top ?? 0))
    pipeline.extract({
      left,
      top,
      width: Math.round(width * (1 - (crop.left ?? 0) - (crop.right ?? 0))),
      height: Math.round(height * (1 - (crop.top ?? 0) - (crop.bottom ?? 0))),
    })
  }

  return pipeline
    .resize(EDGE, EDGE, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toBuffer()
}

const objectName = (i) => (i === 0 ? 'primary.jpg' : String(i + 1).padStart(2, '0') + '.jpg')

async function main() {
  const sources = new Set(await readdir(SOURCE_DIR))
  const missing = MANIFEST.flatMap((p) =>
    p.images.filter((img) => !sources.has(img.file)).map((img) => `${p.slug}: ${img.file}`)
  )
  if (missing.length) {
    throw new Error(`source files not found:\n  ${missing.join('\n  ')}`)
  }

  console.log(
    `${MANIFEST.length} products, ` +
      `${MANIFEST.reduce((n, p) => n + p.images.length, 0)} images, ` +
      `${Object.keys(EXCLUDED).length} sources excluded for third-party marks`
  )

  if (DRY_RUN) {
    await mkdir(DRY_DIR, { recursive: true })
    for (const product of MANIFEST) {
      for (const [i, img] of product.images.entries()) {
        const buf = await renderImage(img.file, img.crop)
        await writeFile(path.join(DRY_DIR, `${product.slug}--${objectName(i)}`), buf)
      }
      console.log(`  ${product.slug}: ${product.images.length}`)
    }
    console.log(`\ndry run — wrote to ${DRY_DIR}, nothing uploaded`)
    return
  }

  const supabase = await createAdminClient()

  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, slug')
    .in('slug', MANIFEST.map((p) => p.slug))

  if (prodError) throw new Error(`product lookup: ${prodError.message}`)

  const idBySlug = new Map(products.map((p) => [p.slug, p.id]))
  const unknown = MANIFEST.filter((p) => !idBySlug.has(p.slug)).map((p) => p.slug)
  if (unknown.length) {
    throw new Error(`no product row for: ${unknown.join(', ')} — run seed-sanitaryware.mjs first`)
  }

  const publicBase = (await supabase.storage.from(BUCKET).getPublicUrl('')).data.publicUrl

  for (const product of MANIFEST) {
    const productId = idBySlug.get(product.slug)
    const rows = []

    for (const [i, img] of product.images.entries()) {
      const buf = await renderImage(img.file, img.crop)
      const objectPath = `${product.slug}/${objectName(i)}`

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(objectPath, buf, { contentType: 'image/jpeg', upsert: true })

      if (upErr) throw new Error(`upload ${objectPath}: ${upErr.message}`)

      rows.push({
        product_id: productId,
        storage_url: `${publicBase.replace(/\/$/, '')}/${objectPath}`,
        alt_text: img.alt,
        sort_order: i,
        is_primary: i === 0,
      })
    }

    // Replaced rather than upserted: product_images has no natural key, so
    // re-running with a shorter image list would otherwise strand old rows.
    const { error: delErr } = await supabase
      .from('product_images')
      .delete()
      .eq('product_id', productId)
    if (delErr) throw new Error(`clear images for ${product.slug}: ${delErr.message}`)

    const { error: insErr } = await supabase.from('product_images').insert(rows)
    if (insErr) throw new Error(`insert images for ${product.slug}: ${insErr.message}`)

    console.log(`  ${product.slug}: ${rows.length} uploaded`)
  }

  console.log('\ndone')
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})

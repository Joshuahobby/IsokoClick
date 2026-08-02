/**
 * Builds the static site chrome imagery: the category card backgrounds.
 *
 * These live in public/ rather than Supabase Storage because they are layout
 * decoration keyed to a hardcoded category slug, not catalog data an admin
 * would ever edit.
 *
 * Only `plumbing` and `tiles` get a photo. The asset library is entirely
 * bathroom, kitchen and tile photography, so there is nothing honest to put
 * behind Construction, Finishes or Lights — those keep the icon-only card,
 * which `CategoryIcon` already renders as the fallback.
 *
 * Run:  node scripts/build-site-imagery.mjs
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { ROOT } from './lib/admin-client.mjs'

const SOURCE_DIR =
  process.env.PHOTO_SOURCE_DIR ?? 'C:/Users/Joesure/Downloads/ISOKOCLICK/Pictures'

// Keyed to the *main* categories the home page renders — a photo filed under a
// subcategory slug would never be shown. The bathroom scene stands in for
// Plumbing, whose stock is almost entirely bathroom sanitaryware.
const CATEGORY_TILES = [
  { slug: 'plumbing', file: 'image-gen (7).png' },
  { slug: 'tiles', file: 'image-gen (53).png' },
]

// A materials banner (public/banner-materials.jpg) used to be built here too.
// It decorated the "Stocked two ways" section, which has since been removed
// from the home page, leaving the asset with no consumer — so the build step
// went with it rather than regenerating an orphan on every run.

async function main() {
  await mkdir(path.join(ROOT, 'public', 'category'), { recursive: true })

  for (const tile of CATEGORY_TILES) {
    await sharp(path.join(SOURCE_DIR, tile.file))
      .resize(800, 600, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 78, mozjpeg: true })
      .toFile(path.join(ROOT, 'public', 'category', `${tile.slug}.jpg`))
    console.log(`  category/${tile.slug}.jpg`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})

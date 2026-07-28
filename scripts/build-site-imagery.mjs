/**
 * Builds the static site chrome imagery: category card backgrounds and the
 * materials banner.
 *
 * These live in public/ rather than Supabase Storage because they are layout
 * decoration keyed to a hardcoded category slug, not catalog data an admin
 * would ever edit.
 *
 * Only `plumbing` and `finishes` get a photo. The asset library is entirely
 * bathroom, kitchen and tile photography, so there is nothing honest to put
 * behind Structure, Steel, Electrical, Tools, Safety or Landscaping — those
 * keep the icon-only card, which `CategoryIcon` already renders as the
 * fallback.
 *
 * Run:  node scripts/build-site-imagery.mjs
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { ROOT } from './lib/admin-client.mjs'

const SOURCE_DIR =
  process.env.PHOTO_SOURCE_DIR ?? 'C:/Users/Joesure/Downloads/ISOKOCLICK/Pictures'

const CATEGORY_TILES = [
  { slug: 'plumbing', file: 'image-gen (7).png' },
  { slug: 'finishes', file: 'image-gen (53).png' },
]

// The one asset in the folder that actually depicts this catalog: cement being
// poured, rebar, paving blocks and clay bricks on a site. Native size is
// 850x400, so it is never upscaled beyond the decorative band it sits in.
const BANNER = 'IsokoClick-Building-Materials-850x400.jpg-1.webp'

async function main() {
  await mkdir(path.join(ROOT, 'public', 'category'), { recursive: true })

  for (const tile of CATEGORY_TILES) {
    await sharp(path.join(SOURCE_DIR, tile.file))
      .resize(800, 600, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 78, mozjpeg: true })
      .toFile(path.join(ROOT, 'public', 'category', `${tile.slug}.jpg`))
    console.log(`  category/${tile.slug}.jpg`)
  }

  await sharp(path.join(SOURCE_DIR, BANNER))
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(ROOT, 'public', 'banner-materials.jpg'))
  console.log('  banner-materials.jpg')
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})

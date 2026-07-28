/**
 * Builds every brand asset the app ships from the three master logo PNGs.
 *
 * The masters are 594x420 but the artwork only occupies a 316x48 box in the
 * middle — roughly 86% of each canvas is empty padding. Dropped into a 36px
 * header slot unchanged they render as an illegible smudge, so everything
 * here starts by cropping to that box.
 *
 * Run:  node scripts/build-brand-assets.mjs
 * Outputs are committed; this only needs re-running when the masters change.
 *
 * `sharp` is not declared in package.json on purpose — see scripts/README.md.
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE_DIR =
  process.env.LOGO_SOURCE_DIR ?? 'C:/Users/Joesure/Downloads/ISOKOCLICK/logos'

// Measured off logo-both.png by scanning for non-transparent, non-white pixels.
const INK = { left: 139, top: 186, width: 316, height: 48 }
// The wave mark ends at x=187; a clean empty gutter runs x=188..202.
const MARK = { left: 139, top: 186, width: 49, height: 48 }

// Every output is flat two- or three-colour artwork, so a quantised palette
// costs nothing visually and cuts the files by roughly 10x.
const PNG_OPTS = { compressionLevel: 9, palette: true }

const ORANGE = '#F7941C'
const INK_DARK = '#0A0A0A'
const TAGLINE = "Rwanda's Construction Marketplace"

const src = (name) => path.join(SOURCE_DIR, name)
const out = (...parts) => path.join(ROOT, ...parts)

/**
 * Recolours the navy half of the wordmark to white, leaving the orange mark
 * and orange "Click" untouched.
 *
 * Navy (#252362) sits at 1.41:1 against the #0A0A0A header — invisible. The
 * two ink colours are cleanly separable by channel order: navy has B > R,
 * orange has R >> B. Testing that rather than matching an exact RGB triple
 * also catches the antialiased edge pixels, which are navy blended toward
 * transparent and would otherwise survive as a dark fringe.
 */
async function recolourNavyToWhite(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i + 3] === 0) continue
    if (data[i + 2] > data[i]) {
      data[i] = 255
      data[i + 1] = 255
      data[i + 2] = 255
    }
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .png()
    .toBuffer()
}

async function main() {
  await mkdir(out('public'), { recursive: true })

  // ── Wordmark lockups ────────────────────────────────────────────────
  // Emitted at 2x the largest rendered size so the header stays crisp on
  // retina displays.
  const cropped = await sharp(src('logo-both.png')).extract(INK).png().toBuffer()

  const onDark = await recolourNavyToWhite(cropped)
  await sharp(onDark)
    .resize({ width: INK.width * 2 })
    .png(PNG_OPTS)
    .toFile(out('public', 'logo-on-dark.png'))

  await sharp(cropped)
    .resize({ width: INK.width * 2 })
    .png(PNG_OPTS)
    .toFile(out('public', 'logo-color.png'))

  // ── Mark only ───────────────────────────────────────────────────────
  // 49x48, effectively square already — pad the 1px difference and scale up.
  const mark = await sharp(src('logo-both.png'))
    .extract(MARK)
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()

  await sharp(mark).png(PNG_OPTS).toFile(out('public', 'logo-mark.png'))

  // ── App icons ───────────────────────────────────────────────────────
  // Next.js App Router picks these up by filename and emits the <link> tags.
  const padMark = async (size, inset) => {
    const scaled = await sharp(mark)
      .resize(size - inset * 2, size - inset * 2, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer()

    return sharp({
      create: { width: size, height: size, channels: 4, background: INK_DARK },
    }).composite([{ input: scaled, left: inset, top: inset }])
  }

  await (await padMark(512, 64))
    .png(PNG_OPTS)
    .toFile(out('src', 'app', 'icon.png'))
  // Apple crops to a rounded rect, so the mark needs a wider safe area.
  await (await padMark(180, 30))
    .png(PNG_OPTS)
    .toFile(out('src', 'app', 'apple-icon.png'))

  // No favicon.ico is emitted. A hand-rolled PNG-in-ICO is served fine by Next
  // but Turbopack's ICO decoder rejects it ("The PNG is not in RGBA format")
  // even when the payload is RGBA8, leaving a permanent build error. icon.png
  // above covers every browser that reads <link rel="icon">, which is all of
  // them; the only cost is a 404 for clients that hard-request /favicon.ico.

  // ── Open Graph card ─────────────────────────────────────────────────
  // Composed rather than photographic: the only genuinely on-brand photo in
  // the asset folder is 850x400 and would upscale soft at 1200x630.
  const lockupWidth = 600
  const lockup = await sharp(onDark).resize({ width: lockupWidth }).png().toBuffer()
  const lockupHeight = (await sharp(lockup).metadata()).height

  const backdrop = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <rect width="1200" height="630" fill="${INK_DARK}"/>
      <g fill="none" stroke="${ORANGE}" stroke-width="1" opacity="0.06">
        ${Array.from({ length: 11 }, (_, i) => `<path d="M0 ${i * 60}H1200"/>`).join('')}
        ${Array.from({ length: 21 }, (_, i) => `<path d="M${i * 60} 0V630"/>`).join('')}
      </g>
      <circle cx="1140" cy="70" r="220" fill="${ORANGE}" opacity="0.10"/>
      <text x="600" y="410" text-anchor="middle" fill="#A3A3A3"
            font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="34">${TAGLINE}</text>
      <rect x="520" y="452" width="160" height="4" rx="2" fill="${ORANGE}"/>
    </svg>`
  )

  await sharp(backdrop)
    .composite([
      {
        input: lockup,
        left: Math.round((1200 - lockupWidth) / 2),
        top: Math.round(300 - lockupHeight / 2) - 40,
      },
    ])
    .png(PNG_OPTS)
    .toFile(out('src', 'app', 'opengraph-image.png'))

  console.log('brand assets written')
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})

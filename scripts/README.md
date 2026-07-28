# scripts/

One-off maintenance scripts. Nothing here runs in CI, at build time, or from
application code — each is invoked by hand when the underlying source assets or
catalog data change, and their outputs are committed or already live in
Supabase.

| Script | What it does |
|---|---|
| `build-brand-assets.mjs` | Crops the master logos and emits `public/logo-*.png`, `src/app/icon.png`, `apple-icon.png` and `opengraph-image.png` |
| `build-site-imagery.mjs` | Emits `public/category/*.jpg` and `public/banner-materials.jpg` |
| `seed-sanitaryware.mjs` | Upserts the plumbing + finishes catalog and its specs |
| `product-image-manifest.mjs` | Data only: maps product slugs to source photographs, crop boxes and alt text |
| `upload-product-images.mjs` | Processes those sources and publishes them to Supabase Storage |

## Source assets

The image scripts read from a folder outside the repo, overridable per run:

```bash
LOGO_SOURCE_DIR=/path/to/logos PHOTO_SOURCE_DIR=/path/to/pictures node scripts/build-brand-assets.mjs
```

Defaults point at `C:/Users/Joesure/Downloads/ISOKOCLICK/{logos,Pictures}`.

## Why `sharp` is not in package.json

These scripts need `sharp`, which is already present because Next ships it to
power `next/image`. Adding it to `devDependencies` looks tidier but breaks CI:
`npm install` on Windows rewrites `package-lock.json` and prunes the
`@next/swc-*` binaries for every platform except the one it ran on, dropping 15
entries to 8. `npm ci` on `ubuntu-latest` then has no Linux SWC binary.

Since nothing in CI or the app imports `sharp`, the dependency stays implicit.
If it ever goes missing, install it locally without touching the lockfile:

```bash
npm install --no-save sharp
```

## Credentials

`seed-sanitaryware.mjs` and `upload-product-images.mjs` read
`SUPABASE_SERVICE_ROLE_KEY` from `.env.local` via `lib/admin-client.mjs`. That
key is server-side only and must never reach the browser.

## Re-running safely

Both database scripts are idempotent. `seed-sanitaryware.mjs` upserts on `slug`
and replaces specs wholesale; `upload-product-images.mjs` upserts storage
objects and replaces each product's `product_images` rows, so shortening a
product's image list does not strand old rows.

Preview the image pipeline without touching Supabase:

```bash
node scripts/upload-product-images.mjs --dry-run
```

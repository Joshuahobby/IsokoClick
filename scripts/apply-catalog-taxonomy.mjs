/**
 * Applies the merchandising taxonomy in
 * supabase/migrations/20260801000001_recategorize_catalog.sql and the nesting in
 * 20260801000002_nest_category_subtrees.sql to a running database.
 *
 * The migrations are the source of truth for a fresh database; this script is
 * how the same change reaches an already-seeded one, the same way
 * scripts/seed-sanitaryware.mjs seeds the catalog itself. Keep them in sync —
 * CATEGORIES and ASSIGNMENTS below mirror the SQL statement for statement.
 *
 * Five categories carry the storefront: Construction, Plumbing, Tiles,
 * Finishes, Lights. Bathroom and Kitchen nest under Plumbing, Roofing under
 * Construction, so products keep a precise home without crowding the menu.
 *
 * Idempotent: categories upsert on `slug`, products move by `slug`. Re-running
 * after editing the mapping corrects the catalog in place.
 *
 * Run:  node scripts/apply-catalog-taxonomy.mjs
 */
import { createAdminClient } from './lib/admin-client.mjs'

// `parent` is a slug in this same list; the upsert runs in two passes so a
// child can reference a parent created in the same run.
const CATEGORIES = [
  { slug: 'construction', name_en: 'Construction', name_rw: 'Ubwubatsi', sort_order: 1, parent: null },
  { slug: 'plumbing',     name_en: 'Plumbing',     name_rw: 'Amazi',     sort_order: 2, parent: null },
  { slug: 'tiles',        name_en: 'Tiles',        name_rw: 'Amakaro',   sort_order: 3, parent: null },
  { slug: 'finishes',     name_en: 'Finishes',     name_rw: 'Imitsindo', sort_order: 4, parent: null },
  { slug: 'lights',       name_en: 'Lights',       name_rw: 'Amatara',   sort_order: 5, parent: null },

  { slug: 'roofing',      name_en: 'Roofing',      name_rw: 'Igisenge',  sort_order: 1, parent: 'construction' },
  { slug: 'bathroom',     name_en: 'Bathroom',     name_rw: 'Ubwogero',  sort_order: 1, parent: 'plumbing' },
  { slug: 'kitchen',      name_en: 'Kitchen',      name_rw: 'Igikoni',   sort_order: 2, parent: 'plumbing' },
]

const ASSIGNMENTS = {
  bathroom: [
    'wall-hung-toilet', 'smart-bidet-toilet', 'close-coupled-toilet',
    'countertop-basin-white', 'vessel-basin-black-round', 'vessel-basin-black-rect',
    'vessel-basin-duotone', 'vessel-basin-marble',
    'basin-mixer-black-square', 'basin-mixer-black-round', 'sensor-basin-tap',
    'bathroom-mixer-tap',
    'shower-column-black', 'shower-column-chrome', 'rain-shower-head-wall',
  ],
  kitchen: [
    'kitchen-faucet-spring', 'kitchen-faucet-gooseneck',
    'kitchen-sink-multifunction', 'kitchen-sink-double-bowl', 'sink-accessory-set',
  ],
  tiles: [
    'ceramic-tiles-60x60', 'marble-tile-calacatta-60x60', 'stone-tile-dark-60x60',
    'porcelain-tile-polished-80x80', 'porcelain-tile-grey-60x60',
    'marble-slab-bookmatched',
  ],
  construction: [
    'portland-cement-50kg', 'hollow-blocks-6inch',
    'deformed-rebar-y16', 'brc-mesh-a142', 'binding-wire-2kg',
    'concrete-mixer-140l',
  ],
  // The trade category, not the room: pipework and fittings only.
  plumbing: ['pvc-pipe-2inch-6m'],
  finishes: ['interior-emulsion-20l', 'mortise-lock-set'],
}

const RETIRED = ['structure', 'steel', 'electrical', 'safety', 'landscaping', 'tools']

async function main() {
  const supabase = await createAdminClient()

  // Pass 1 creates every row with no parent, so pass 2 can resolve parent
  // slugs to ids that are guaranteed to exist.
  const { data: upserted, error: catError } = await supabase
    .from('categories')
    .upsert(
      CATEGORIES.map((c) => ({
        slug: c.slug,
        name_en: c.name_en,
        name_rw: c.name_rw,
        sort_order: c.sort_order,
        is_active: true,
        parent_id: null,
      })),
      { onConflict: 'slug' }
    )
    .select('id, slug')
  if (catError) throw new Error(`categories upsert: ${catError.message}`)

  const idBySlug = Object.fromEntries(upserted.map((c) => [c.slug, c.id]))
  console.log(`categories: ${upserted.length} upserted`)

  for (const category of CATEGORIES.filter((c) => c.parent)) {
    const { error } = await supabase
      .from('categories')
      .update({ parent_id: idBySlug[category.parent] })
      .eq('slug', category.slug)
    if (error) throw new Error(`nest ${category.slug}: ${error.message}`)
    console.log(`  ${category.slug} nested under ${category.parent}`)
  }

  for (const [categorySlug, productSlugs] of Object.entries(ASSIGNMENTS)) {
    const { data, error } = await supabase
      .from('products')
      .update({ category_id: idBySlug[categorySlug] })
      .in('slug', productSlugs)
      .select('slug')
    if (error) throw new Error(`assign ${categorySlug}: ${error.message}`)

    const missing = productSlugs.filter((s) => !data.some((p) => p.slug === s))
    console.log(`  ${categorySlug.padEnd(13)} ${data.length}/${productSlugs.length} products`)
    if (missing.length) console.warn(`    not found: ${missing.join(', ')}`)
  }

  const { error: retireError } = await supabase
    .from('categories')
    .update({ is_active: false })
    .in('slug', RETIRED)
  if (retireError) throw new Error(`retire categories: ${retireError.message}`)
  console.log(`retired: ${RETIRED.join(', ')}`)

  // Anything still pointing at a retired bucket is a mapping gap, not a
  // success — surface it rather than leaving it to be found in the storefront.
  const { data: orphans } = await supabase
    .from('products')
    .select('slug, categories:category_id(slug, is_active)')
    .eq('is_active', true)
    .is('deleted_at', null)

  const stranded = (orphans ?? []).filter((p) => !p.categories || p.categories.is_active === false)
  if (stranded.length) {
    console.warn(`\n${stranded.length} active product(s) left in a retired category:`)
    for (const p of stranded) console.warn(`  ${p.slug} -> ${p.categories?.slug ?? 'none'}`)
    process.exitCode = 1
  } else {
    console.log('\nAll active products sit in an active category.')
  }
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})

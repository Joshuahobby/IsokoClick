/**
 * Seeds the plumbing + finishes catalog that the ISOKOCLICK photo library
 * actually depicts.
 *
 * The library is ~90% bathroom and kitchen sanitaryware, but the catalog
 * shipped with 10 construction-materials rows, so most of the photography had
 * no product to attach to. These rows close that gap.
 *
 * Idempotent: upserts on `slug`, so re-running after editing prices or copy
 * updates in place rather than duplicating.
 *
 * !! PLACEHOLDER COMMERCIAL DATA !!
 * `basePrice`, `sku` and `weightKg` below are plausible market-rate guesses,
 * not IsokoClick's real figures. They are gathered in this one array so they
 * are cheap to correct. Replace them before this catalog faces customers.
 *
 * Run:  node scripts/seed-sanitaryware.mjs
 */
import { createAdminClient } from './lib/admin-client.mjs'

// Category *slugs*, resolved to ids at run time. They were hardcoded uuids
// until the merchandising taxonomy landed, which regenerated the category rows
// and left those uuids pointing at nothing.
//
// These are the landing buckets, not the final ones: this script only has to
// put every row in a valid category. scripts/apply-catalog-taxonomy.mjs then
// files them into Bathroom / Kitchen / Tiles, so run it after this one.
const PLUMBING = 'plumbing'
const FINISHES = 'finishes'

// name_rw is deliberately omitted throughout. Every existing seeded product
// leaves it null and `localize()` falls back to English; inventing Kinyarwanda
// product names would be worse than an honest fallback. Translation is
// tracked as follow-up work.
const PRODUCTS = [
  // ── Plumbing: WC ──────────────────────────────────────────────────
  {
    slug: 'wall-hung-toilet',
    categoryId: PLUMBING,
    nameEn: 'Wall-Hung Toilet with Soft-Close Seat',
    descriptionEn:
      'Rimless wall-hung pan with a quick-release soft-close seat. Concealed cistern sold separately. Frees the floor beneath for easier cleaning in compact bathrooms.',
    brand: 'Aqualine',
    sku: 'SAN-WC-WH01',
    unitType: 'piece',
    unitLabelEn: 'per unit',
    basePrice: 285000,
    minOrderQty: 1,
    weightKg: 26,
    isFeatured: true,
    specs: [
      ['Mounting', 'Wall-hung, concealed frame'],
      ['Flush', 'Rimless dual-flush 3/6 L'],
      ['Seat', 'Soft-close, quick-release'],
      ['Material', 'Vitreous china'],
    ],
  },
  {
    slug: 'smart-bidet-toilet',
    categoryId: PLUMBING,
    nameEn: 'Smart Bidet Toilet with Heated Seat',
    descriptionEn:
      'One-piece smart toilet with heated seat, warm-water wash, air dryer and automatic lid. Tankless design with an integrated booster pump for consistent flush pressure.',
    brand: 'Aqualine',
    sku: 'SAN-WC-SM01',
    unitType: 'piece',
    unitLabelEn: 'per unit',
    basePrice: 890000,
    salePrice: 795000,
    minOrderQty: 1,
    weightKg: 48,
    isFeatured: true,
    specs: [
      ['Dimensions', '700 x 445 x 145 mm'],
      ['Seat', 'Heated, adjustable temperature'],
      ['Wash', 'Warm water, adjustable position'],
      ['Power', '220 V, 1200 W'],
    ],
  },
  {
    slug: 'close-coupled-toilet',
    categoryId: PLUMBING,
    nameEn: 'Close-Coupled Toilet Suite',
    descriptionEn:
      'Standard close-coupled WC suite with cistern and fittings included. The workhorse specification for residential builds and rentals.',
    brand: 'Aqualine',
    sku: 'SAN-WC-CC01',
    unitType: 'piece',
    unitLabelEn: 'per suite',
    basePrice: 165000,
    minOrderQty: 1,
    weightKg: 34,
    specs: [
      ['Type', 'Close-coupled, floor standing'],
      ['Flush', 'Dual-flush 3/6 L'],
      ['Includes', 'Pan, cistern, seat, fittings'],
    ],
  },

  // ── Plumbing: basins ──────────────────────────────────────────────
  {
    slug: 'countertop-basin-white',
    categoryId: PLUMBING,
    nameEn: 'White Ceramic Countertop Basin',
    descriptionEn:
      'Soft rectangular countertop basin in glazed white ceramic. No tap hole — pair with a wall-mounted or tall vessel mixer.',
    brand: 'Aqualine',
    sku: 'SAN-BS-CW01',
    unitType: 'piece',
    unitLabelEn: 'per basin',
    basePrice: 78000,
    minOrderQty: 1,
    weightKg: 12,
    specs: [
      ['Installation', 'Countertop / vessel'],
      ['Material', 'Glazed vitreous china'],
      ['Tap hole', 'None — separate mixer required'],
    ],
  },
  {
    slug: 'vessel-basin-black-round',
    categoryId: PLUMBING,
    nameEn: 'Matte Black Round Vessel Basin',
    descriptionEn:
      'Shallow round vessel basin with a matte black glaze and a slim 12 mm rim. Pairs with the black square basin mixer.',
    brand: 'Aqualine',
    sku: 'SAN-BS-BR01',
    unitType: 'piece',
    unitLabelEn: 'per basin',
    basePrice: 95000,
    minOrderQty: 1,
    weightKg: 10,
    isFeatured: true,
    specs: [
      ['Shape', 'Round, 400 mm diameter'],
      ['Finish', 'Matte black glaze'],
      ['Installation', 'Countertop / vessel'],
    ],
  },
  {
    slug: 'vessel-basin-black-rect',
    categoryId: PLUMBING,
    nameEn: 'Matte Black Rectangular Vessel Basin',
    descriptionEn:
      'Rectangular vessel basin in matte black with squared internal corners and a centre waste. Suits narrow vanity tops.',
    brand: 'Aqualine',
    sku: 'SAN-BS-BQ01',
    unitType: 'piece',
    unitLabelEn: 'per basin',
    basePrice: 98000,
    minOrderQty: 1,
    weightKg: 11,
    specs: [
      ['Shape', 'Rectangular, 500 x 380 mm'],
      ['Finish', 'Matte black glaze'],
      ['Waste', 'Centre, unslotted'],
    ],
  },
  {
    slug: 'vessel-basin-duotone',
    categoryId: PLUMBING,
    nameEn: 'Black and White Round Vessel Basin',
    descriptionEn:
      'Round vessel basin glazed white inside and matte black outside, so the bowl stays bright while the exterior reads as a dark accent.',
    brand: 'Aqualine',
    sku: 'SAN-BS-DT01',
    unitType: 'piece',
    unitLabelEn: 'per basin',
    basePrice: 88000,
    minOrderQty: 1,
    weightKg: 10,
    specs: [
      ['Shape', 'Round, 400 mm diameter'],
      ['Finish', 'White interior, matte black exterior'],
      ['Installation', 'Countertop / vessel'],
    ],
  },
  {
    slug: 'vessel-basin-marble',
    categoryId: PLUMBING,
    nameEn: 'Marble-Pattern Stone Vessel Basin',
    descriptionEn:
      'Round vessel basin finished in a warm marble pattern with a high-temperature glaze. Each piece varies, so veining will not match the photograph exactly.',
    brand: 'Aqualine',
    sku: 'SAN-BS-MB01',
    unitType: 'piece',
    unitLabelEn: 'per basin',
    basePrice: 145000,
    minOrderQty: 1,
    weightKg: 14,
    isFeatured: true,
    specs: [
      ['Shape', 'Round, 400 mm diameter'],
      ['Finish', 'Marble-pattern high-temperature glaze'],
      ['Note', 'Veining varies piece to piece'],
    ],
  },

  // ── Plumbing: showers ─────────────────────────────────────────────
  {
    slug: 'shower-column-black',
    categoryId: PLUMBING,
    nameEn: 'Rain Shower Column Set, Matte Black',
    descriptionEn:
      'Exposed shower column with an overhead rain head, hand shower, diverter mixer and slide rail. Matte black throughout.',
    brand: 'Aqualine',
    sku: 'SAN-SH-BK01',
    unitType: 'piece',
    unitLabelEn: 'per set',
    basePrice: 210000,
    minOrderQty: 1,
    weightKg: 7,
    isFeatured: true,
    specs: [
      ['Rain head', '250 mm, ABS'],
      ['Hand shower', 'Multi-function with 1.5 m hose'],
      ['Finish', 'Matte black'],
      ['Mounting', 'Exposed, wall-mounted'],
    ],
  },
  {
    slug: 'shower-column-chrome',
    categoryId: PLUMBING,
    nameEn: 'Rain Shower Column Set, Chrome',
    descriptionEn:
      'Exposed chrome shower column with rain head, hand shower and single-lever diverter mixer. The standard-specification alternative to the black set.',
    brand: 'Aqualine',
    sku: 'SAN-SH-CR01',
    unitType: 'piece',
    unitLabelEn: 'per set',
    basePrice: 185000,
    minOrderQty: 1,
    weightKg: 7,
    specs: [
      ['Rain head', '200 mm, stainless steel'],
      ['Hand shower', 'Multi-function with 1.5 m hose'],
      ['Finish', 'Polished chrome'],
    ],
  },
  {
    slug: 'rain-shower-head-wall',
    categoryId: PLUMBING,
    nameEn: 'Concealed Wall Rain Shower Head',
    descriptionEn:
      'Wall-mounted stainless rain head with a separate waterfall outlet. Requires a concealed valve, which is sold separately.',
    brand: 'Aqualine',
    sku: 'SAN-SH-WL01',
    unitType: 'piece',
    unitLabelEn: 'per unit',
    basePrice: 125000,
    minOrderQty: 1,
    weightKg: 4,
    specs: [
      ['Type', 'Rain + waterfall, wall-mounted'],
      ['Material', 'Stainless steel'],
      ['Requires', 'Concealed valve, sold separately'],
    ],
  },

  // ── Plumbing: taps ────────────────────────────────────────────────
  {
    slug: 'basin-mixer-black-square',
    categoryId: PLUMBING,
    nameEn: 'Basin Mixer Tap, Black Square',
    descriptionEn:
      'Single-lever basin mixer with a squared body and spout in matte black. Ceramic cartridge, flexible tails included.',
    brand: 'Aqualine',
    sku: 'SAN-TP-BQ01',
    unitType: 'piece',
    unitLabelEn: 'per tap',
    basePrice: 62000,
    minOrderQty: 1,
    weightKg: 2,
    specs: [
      ['Body', 'Brass, matte black finish'],
      ['Cartridge', '35 mm ceramic disc'],
      ['Includes', 'Flexible tails, fixing kit'],
    ],
  },
  {
    slug: 'basin-mixer-black-round',
    categoryId: PLUMBING,
    nameEn: 'Basin Mixer Tap, Black Round',
    descriptionEn:
      'Single-lever basin mixer with a rounded body and pull-out aerator in matte black. Ceramic cartridge, flexible tails included.',
    brand: 'Aqualine',
    sku: 'SAN-TP-BR01',
    unitType: 'piece',
    unitLabelEn: 'per tap',
    basePrice: 58000,
    minOrderQty: 1,
    weightKg: 2,
    specs: [
      ['Body', 'Brass, matte black finish'],
      ['Cartridge', '35 mm ceramic disc'],
      ['Spout', 'Pull-out aerator'],
    ],
  },
  {
    slug: 'sensor-basin-tap',
    categoryId: PLUMBING,
    nameEn: 'Sensor Basin Tap, Chrome',
    descriptionEn:
      'Touch-free infrared basin tap in polished chrome. Suits clinics, offices and public washrooms where hand contact is a concern.',
    brand: 'Aqualine',
    sku: 'SAN-TP-SN01',
    unitType: 'piece',
    unitLabelEn: 'per tap',
    basePrice: 148000,
    minOrderQty: 1,
    weightKg: 3,
    specs: [
      ['Activation', 'Infrared sensor, touch-free'],
      ['Power', 'Mains adapter or 6 V battery'],
      ['Finish', 'Polished chrome'],
    ],
  },
  {
    slug: 'kitchen-faucet-spring',
    categoryId: PLUMBING,
    nameEn: 'Kitchen Pull-Down Spring Faucet, Black',
    descriptionEn:
      'Professional-style kitchen mixer with an exposed spring neck and pull-down spray head. Matte black with a 360-degree swivel.',
    brand: 'Aqualine',
    sku: 'SAN-TP-KS01',
    unitType: 'piece',
    unitLabelEn: 'per tap',
    basePrice: 135000,
    minOrderQty: 1,
    weightKg: 4,
    isFeatured: true,
    specs: [
      ['Style', 'Spring neck, pull-down spray'],
      ['Swivel', '360 degrees'],
      ['Finish', 'Matte black'],
    ],
  },
  {
    slug: 'kitchen-faucet-gooseneck',
    categoryId: PLUMBING,
    nameEn: 'Kitchen Faucet, Black Square Gooseneck',
    descriptionEn:
      'Square-profile kitchen mixer with a high gooseneck spout in matte black. Single lever, 19 cm reach.',
    brand: 'Aqualine',
    sku: 'SAN-TP-KG01',
    unitType: 'piece',
    unitLabelEn: 'per tap',
    basePrice: 88000,
    minOrderQty: 1,
    weightKg: 3,
    specs: [
      ['Spout reach', '190 mm'],
      ['Spout height', '230 mm'],
      ['Finish', 'Matte black'],
    ],
  },

  // ── Plumbing: sinks ───────────────────────────────────────────────
  {
    slug: 'kitchen-sink-multifunction',
    categoryId: PLUMBING,
    nameEn: 'Multifunction Waterfall Kitchen Sink',
    descriptionEn:
      'Large single-bowl workstation sink in nano-coated stainless steel. Ships with the waterfall mixer, pull-out spray, cutting board, drying basket and colander.',
    brand: 'Aqualine',
    sku: 'SAN-SK-MF01',
    unitType: 'piece',
    unitLabelEn: 'per unit',
    basePrice: 420000,
    salePrice: 375000,
    minOrderQty: 1,
    weightKg: 22,
    isFeatured: true,
    specs: [
      ['Dimensions', '750 x 450 mm'],
      ['Material', 'Nano-coated 304 stainless steel'],
      ['Includes', 'Mixer, spray, board, basket, colander'],
      ['Installation', 'Topmount or undermount'],
    ],
  },
  {
    slug: 'kitchen-sink-double-bowl',
    categoryId: PLUMBING,
    nameEn: 'Stainless Double-Bowl Undermount Sink',
    descriptionEn:
      'Brushed 304 stainless double-bowl sink with tight 10 mm corner radii and sound-deadening pads. Undermount installation.',
    brand: 'Aqualine',
    sku: 'SAN-SK-DB01',
    unitType: 'piece',
    unitLabelEn: 'per unit',
    basePrice: 245000,
    minOrderQty: 1,
    weightKg: 14,
    specs: [
      ['Bowls', 'Double, equal'],
      ['Material', 'Brushed 304 stainless steel'],
      ['Installation', 'Undermount'],
    ],
  },
  {
    slug: 'sink-accessory-set',
    categoryId: PLUMBING,
    nameEn: 'Kitchen Sink Accessory Set',
    descriptionEn:
      'Replacement and add-on set for workstation sinks: roll-up drying rack, adjustable baskets, soap dispenser, cutting board, drainer head and drainer plumbing.',
    brand: 'Aqualine',
    sku: 'SAN-SK-AC01',
    unitType: 'box',
    unitLabelEn: 'per set',
    basePrice: 45000,
    minOrderQty: 1,
    weightKg: 5,
    specs: [
      ['Includes', 'Drying roller, baskets, dispenser, board'],
      ['Also includes', 'Drainer head and drainer set'],
      ['Material', 'Stainless steel and bamboo'],
    ],
  },

  // ── Finishes: tiles and stone ─────────────────────────────────────
  {
    slug: 'marble-tile-calacatta-60x60',
    categoryId: FINISHES,
    nameEn: 'Calacatta Marble-Effect Porcelain Tile 60x60cm',
    descriptionEn:
      'Polished rectified porcelain in a Calacatta pattern — white ground with gold and grey veining. Suitable for floors and walls indoors.',
    brand: 'CIMERWA',
    sku: 'TIL-MC-6060',
    unitType: 'm2',
    unitLabelEn: 'per m2',
    basePrice: 32000,
    minOrderQty: 5,
    weightKg: 24,
    isFeatured: true,
    specs: [
      ['Size', '600 x 600 mm'],
      ['Finish', 'Polished, rectified edges'],
      ['Coverage', '1.44 m2 per box (4 pieces)'],
      ['Application', 'Indoor floors and walls'],
    ],
  },
  {
    slug: 'marble-slab-bookmatched',
    categoryId: FINISHES,
    nameEn: 'Book-Matched Marble Slab 1200x2400mm',
    descriptionEn:
      'Large-format porcelain slab supplied in book-matched pairs, so the veining mirrors across the joint. For feature walls and full-height cladding.',
    brand: 'CIMERWA',
    sku: 'TIL-SL-1224',
    unitType: 'm2',
    unitLabelEn: 'per m2',
    basePrice: 145000,
    minOrderQty: 3,
    weightKg: 42,
    specs: [
      ['Slab size', '1200 x 2400 mm'],
      ['Supplied', 'Book-matched pairs'],
      ['Thickness', '9 mm'],
    ],
  },
  {
    slug: 'porcelain-tile-grey-60x60',
    categoryId: FINISHES,
    nameEn: 'Grey Marble Porcelain Tile 60x60cm',
    descriptionEn:
      'Polished grey marble-effect porcelain with soft white veining. A quieter alternative to the Calacatta pattern for larger floor areas.',
    brand: 'CIMERWA',
    sku: 'TIL-MG-6060',
    unitType: 'm2',
    unitLabelEn: 'per m2',
    basePrice: 26000,
    minOrderQty: 5,
    weightKg: 24,
    specs: [
      ['Size', '600 x 600 mm'],
      ['Finish', 'Polished, rectified edges'],
      ['Application', 'Indoor floors and walls'],
    ],
  },
  {
    slug: 'stone-tile-dark-60x60',
    categoryId: FINISHES,
    nameEn: 'Dark Stone-Effect Porcelain Tile 60x60cm',
    descriptionEn:
      'Matte porcelain in a dark slate and rust stone pattern. Slip-resistant enough for kitchens, entrances and covered outdoor areas.',
    brand: 'CIMERWA',
    sku: 'TIL-SD-6060',
    unitType: 'm2',
    unitLabelEn: 'per m2',
    basePrice: 28500,
    minOrderQty: 5,
    weightKg: 25,
    specs: [
      ['Size', '600 x 600 mm'],
      ['Finish', 'Matte, textured'],
      ['Application', 'Indoor and covered outdoor'],
    ],
  },
  {
    slug: 'porcelain-tile-polished-80x80',
    categoryId: FINISHES,
    nameEn: 'Polished Porcelain Floor Tile 80x80cm',
    descriptionEn:
      'Large-format polished porcelain with a subtle warm marble pattern. Fewer joints across open-plan floors.',
    brand: 'CIMERWA',
    sku: 'TIL-PP-8080',
    unitType: 'm2',
    unitLabelEn: 'per m2',
    basePrice: 38000,
    minOrderQty: 5,
    weightKg: 28,
    specs: [
      ['Size', '800 x 800 mm'],
      ['Finish', 'Polished, rectified edges'],
      ['Application', 'Indoor floors'],
    ],
  },
  {
    slug: 'mortise-lock-set',
    categoryId: FINISHES,
    nameEn: 'Mortise Door Lock Set, Antique Brass',
    descriptionEn:
      'Complete mortise lock body with lever handles, backplates, strike plate and three keys. Antique brass finish, suits standard 40-45 mm interior and entrance doors.',
    brand: 'WISTA',
    sku: 'HDW-LK-MT01',
    unitType: 'piece',
    unitLabelEn: 'per set',
    basePrice: 42000,
    minOrderQty: 1,
    weightKg: 2,
    specs: [
      ['Finish', 'Antique brass'],
      ['Door thickness', '40 - 45 mm'],
      ['Includes', 'Lock body, levers, plates, 3 keys'],
    ],
  },
]

async function main() {
  const supabase = await createAdminClient()

  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id, slug')
    .in('slug', [PLUMBING, FINISHES])
  if (catError) throw new Error(`categories lookup: ${catError.message}`)

  const categoryIdBySlug = new Map(categories.map((c) => [c.slug, c.id]))
  for (const slug of [PLUMBING, FINISHES]) {
    if (!categoryIdBySlug.has(slug)) {
      throw new Error(
        `category "${slug}" not found — apply supabase/migrations first, then re-run`
      )
    }
  }

  const rows = PRODUCTS.map((p) => ({
    category_id: categoryIdBySlug.get(p.categoryId),
    source: 'internal',
    name_en: p.nameEn,
    slug: p.slug,
    description_en: p.descriptionEn,
    brand: p.brand,
    sku: p.sku,
    unit_type: p.unitType,
    unit_label_en: p.unitLabelEn,
    base_price: p.basePrice,
    sale_price: p.salePrice ?? null,
    min_order_qty: p.minOrderQty,
    weight_kg: p.weightKg ?? null,
    is_heavy_goods: (p.weightKg ?? 0) > 500,
    is_active: true,
    is_featured: p.isFeatured ?? false,
  }))

  const { data: upserted, error } = await supabase
    .from('products')
    .upsert(rows, { onConflict: 'slug' })
    .select('id, slug')

  if (error) throw new Error(`products upsert: ${error.message}`)

  const idBySlug = new Map(upserted.map((r) => [r.slug, r.id]))
  console.log(`upserted ${upserted.length} products`)

  // Specs are replaced wholesale rather than upserted — they have no natural
  // key, so re-running would otherwise accumulate duplicates.
  const productIds = [...idBySlug.values()]
  const { error: delError } = await supabase
    .from('product_specs')
    .delete()
    .in('product_id', productIds)

  if (delError) throw new Error(`product_specs delete: ${delError.message}`)

  const specRows = PRODUCTS.flatMap((p) =>
    (p.specs ?? []).map(([keyEn, valueEn], i) => ({
      product_id: idBySlug.get(p.slug),
      key_en: keyEn,
      value_en: valueEn,
      sort_order: i + 1,
    }))
  )

  const { error: specError } = await supabase.from('product_specs').insert(specRows)
  if (specError) throw new Error(`product_specs insert: ${specError.message}`)
  console.log(`inserted ${specRows.length} specs`)

  // The existing paint product is photographed in Iyaga Plus livery, so the
  // brand field has to agree with the picture.
  const { error: brandError } = await supabase
    .from('products')
    .update({ brand: 'Iyaga Plus' })
    .eq('slug', 'interior-emulsion-20l')

  if (brandError) throw new Error(`paint brand update: ${brandError.message}`)
  console.log('retagged interior-emulsion-20l brand -> Iyaga Plus')
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})

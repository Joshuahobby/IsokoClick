-- Recategorise the catalog around how customers actually shop.
--
-- The original taxonomy (Structure / Steel / Plumbing / Electrical / Finishes /
-- Tools / Safety / Landscaping) was written for a bulk-materials catalog. What
-- the catalog actually holds today is ~75% bathroom, kitchen and tile
-- sanitaryware, all of it filed under a single "Plumbing" bucket that mixes
-- toilets, vessel basins, kitchen sinks and PVC pressure pipe. That bucket is
-- unusable as a top-level menu entry.
--
-- This migration replaces it with the merchandising taxonomy used by the header
-- mega menu: Bathroom, Kitchen, Tiles, Construction, Plumbing, Lights, Roofing
-- (plus Finishes for paint and door hardware).
--
-- Lights and Roofing carry no stock yet. They are seeded active and empty on
-- purpose: they are committed ranges, the storefront renders an explicit
-- "coming soon" for a category with no products, and seeding them now means the
-- menu does not change shape the day the first SKU lands.
--
-- Products move by slug, so this is idempotent and safe to re-run.

-- ── New and repositioned categories ──────────────────────────────
INSERT INTO categories (name_en, name_rw, slug, sort_order) VALUES
  ('Bathroom',     'Ubwogero',   'bathroom',     1),
  ('Kitchen',      'Igikoni',    'kitchen',      2),
  ('Tiles',        'Amakaro',    'tiles',        3),
  ('Construction', 'Ubwubatsi',  'construction', 4),
  ('Plumbing',     'Amazi',      'plumbing',     5),
  ('Lights',       'Amatara',    'lights',       6),
  ('Roofing',      'Igisenge',   'roofing',      7),
  ('Finishes',     'Imitsindo',  'finishes',     8)
ON CONFLICT (slug) DO UPDATE SET
  name_en    = EXCLUDED.name_en,
  name_rw    = EXCLUDED.name_rw,
  sort_order = EXCLUDED.sort_order,
  is_active  = true;

-- ── Reassign the existing catalog ────────────────────────────────
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'bathroom')
WHERE slug IN (
  'wall-hung-toilet', 'smart-bidet-toilet', 'close-coupled-toilet',
  'countertop-basin-white', 'vessel-basin-black-round', 'vessel-basin-black-rect',
  'vessel-basin-duotone', 'vessel-basin-marble',
  'basin-mixer-black-square', 'basin-mixer-black-round', 'sensor-basin-tap',
  'bathroom-mixer-tap',
  'shower-column-black', 'shower-column-chrome', 'rain-shower-head-wall'
);

UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'kitchen')
WHERE slug IN (
  'kitchen-faucet-spring', 'kitchen-faucet-gooseneck',
  'kitchen-sink-multifunction', 'kitchen-sink-double-bowl', 'sink-accessory-set'
);

UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'tiles')
WHERE slug IN (
  'ceramic-tiles-60x60', 'marble-tile-calacatta-60x60', 'stone-tile-dark-60x60',
  'porcelain-tile-polished-80x80', 'porcelain-tile-grey-60x60',
  'marble-slab-bookmatched'
);

UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'construction')
WHERE slug IN (
  'portland-cement-50kg', 'hollow-blocks-6inch',
  'deformed-rebar-y16', 'brc-mesh-a142', 'binding-wire-2kg',
  'concrete-mixer-140l'
);

-- Plumbing keeps pipework and fittings only — the trade category, not the room.
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'plumbing')
WHERE slug IN ('pvc-pipe-2inch-6m');

UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'finishes')
WHERE slug IN ('interior-emulsion-20l', 'mortise-lock-set');

-- ── Retire the superseded buckets ────────────────────────────────
-- Deactivated rather than deleted: products.category_id references them, and
-- soft-retiring keeps any historical row resolvable.
UPDATE categories SET is_active = false
WHERE slug IN ('structure', 'steel', 'electrical', 'safety', 'landscaping', 'tools');

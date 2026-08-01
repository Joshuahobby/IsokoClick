-- Reduce the storefront to five main categories and nest the rest beneath them.
--
-- 20260801000001 introduced eight flat categories. Eight is too many for a
-- header menu, and three of them were really facets of the others: Bathroom and
-- Kitchen are both rooms full of plumbing fixtures, and Roofing is construction
-- material. They become subcategories rather than disappearing — the products
-- keep a precise home, and a shopper who wants basins specifically can still
-- get to exactly those.
--
-- Top level, in menu order: Construction, Plumbing, Tiles, Finishes, Lights.
--
-- Products stay attached to the most specific category that fits, so filtering
-- a parent has to include its descendants — see getProducts() in
-- src/lib/supabase/queries/products.ts, which resolves a slug to its subtree.

-- ── Top level ────────────────────────────────────────────────────
UPDATE categories SET parent_id = NULL, sort_order = 1 WHERE slug = 'construction';
UPDATE categories SET parent_id = NULL, sort_order = 2 WHERE slug = 'plumbing';
UPDATE categories SET parent_id = NULL, sort_order = 3 WHERE slug = 'tiles';
UPDATE categories SET parent_id = NULL, sort_order = 4 WHERE slug = 'finishes';
UPDATE categories SET parent_id = NULL, sort_order = 5 WHERE slug = 'lights';

-- ── Subcategories ────────────────────────────────────────────────
UPDATE categories
SET parent_id = (SELECT id FROM categories WHERE slug = 'plumbing'), sort_order = 1
WHERE slug = 'bathroom';

UPDATE categories
SET parent_id = (SELECT id FROM categories WHERE slug = 'plumbing'), sort_order = 2
WHERE slug = 'kitchen';

UPDATE categories
SET parent_id = (SELECT id FROM categories WHERE slug = 'construction'), sort_order = 1
WHERE slug = 'roofing';

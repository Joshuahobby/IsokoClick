-- ============================================================
-- IsokoClick — Seed Data: Categories + Sample Products
-- ============================================================

-- ── Categories ───────────────────────────────────────────────
INSERT INTO categories (name_en, name_rw, slug, sort_order) VALUES
  ('Structure',    'Inzego',       'structure',    1),
  ('Steel',        'Icyuma',       'steel',        2),
  ('Plumbing',     'Amazi',        'plumbing',     3),
  ('Electrical',   'Amashanyarazi','electrical',   4),
  ('Finishes',     'Imitsindo',    'finishes',     5),
  ('Tools',        'Ibikoresho',   'tools',        6),
  ('Safety',       'Umutekano',    'safety',       7),
  ('Landscaping',  'Igihugu',      'landscaping',  8);

-- ── Delivery Zones ───────────────────────────────────────────
INSERT INTO delivery_zones (name, districts, delivery_fee, min_days, max_days, supports_heavy) VALUES
  ('Kigali City',       ARRAY['Nyarugenge','Gasabo','Kicukiro'],                            2000, 1, 1,  true),
  ('Eastern Province',  ARRAY['Rwamagana','Kayonza','Kirehe','Ngoma','Nyagatare','Bugesera'], 5000, 2, 3, false),
  ('Northern Province', ARRAY['Musanze','Burera','Gakenke','Gicumbi','Rulindo'],            5000, 2, 3, false),
  ('Southern Province', ARRAY['Huye','Muhanga','Karongi','Ruhango','Nyanza','Gisagara','Nyaruguru','Nyamagabe','Ruhango'], 5000, 2, 3, false),
  ('Western Province',  ARRAY['Rubavu','Rusizi','Nyamasheke','Ngororero','Karongi','Rutsiro'], 5000, 2, 3, false);

-- ── Sample Products (placeholder — replace with real data) ───
-- Using gen_random_uuid() for ids so they are stable on re-seed
-- Category slugs resolved via subquery

INSERT INTO products (category_id, source, name_en, slug, description_en, brand, sku, unit_type, unit_label_en, base_price, min_order_qty, is_active, is_featured) VALUES
  ((SELECT id FROM categories WHERE slug = 'structure'), 'internal', 'Portland Cement 50kg',         'portland-cement-50kg',   'High-strength 42.5R Portland cement. Ideal for structural concrete, masonry and plastering.', 'CIMERWA', 'CEM-PC-50',   'bag',   'per 50kg bag', 8500,  1, true, true),
  ((SELECT id FROM categories WHERE slug = 'structure'), 'internal', 'Hollow Concrete Blocks 6"',    'hollow-blocks-6inch',    'Standard 6" hollow concrete blocks, 400×200×150mm. Ready-to-lay, cured 28 days.',             NULL,      'HCB-6IN',     'piece', 'per block',    350,   50, true, false),
  ((SELECT id FROM categories WHERE slug = 'steel'),     'internal', 'Iron Binding Wire 2kg',         'binding-wire-2kg',       'Annealed black iron binding wire, gauge 18. Used for tying rebar in concrete structures.',        NULL,      'STL-BW-2KG',  'kg',    'per 2kg roll', 3200,  1, true, true),
  ((SELECT id FROM categories WHERE slug = 'steel'),     'internal', 'BRC Mesh A142',                 'brc-mesh-a142',          'Square welded wire mesh A142 (6mm bars at 200mm centres). 2.4m × 4.8m sheet.',                   NULL,      'STL-BRC-A142','piece', 'per sheet',    18500, 1, true, false),
  ((SELECT id FROM categories WHERE slug = 'steel'),     'internal', 'Deformed Rebar Y16',            'deformed-rebar-y16',     'High-yield deformed steel bar Y16, 12m length. Grade 500B to BS4449.',                           NULL,      'STL-RB-Y16',  'piece', 'per 12m bar',  14200, 5, true, true),
  ((SELECT id FROM categories WHERE slug = 'finishes'),  'internal', 'Ceramic Floor Tiles 60×60cm',   'ceramic-tiles-60x60',    'Polished porcelain floor tile 60×60cm, rectified edges. Suitable for indoor floors.',            'CIMERWA', 'TIL-CF-6060', 'm2',    'per m²',       24000, 5, true, true),
  ((SELECT id FROM categories WHERE slug = 'finishes'),  'internal', 'Interior Emulsion Paint 20L',   'interior-emulsion-20l',  'Premium washable interior emulsion. Low VOC, high coverage (12–14 m²/L). Brilliant White.',      'Crown',   'PNT-IEM-20L', 'litre', 'per 20L tin',  34000, 1, true, false),
  ((SELECT id FROM categories WHERE slug = 'plumbing'),  'internal', 'PVC Pipe 2" × 6m',             'pvc-pipe-2inch-6m',      'Class B uPVC pressure pipe 2" (50mm) × 6m. BS EN ISO 1452 compliant.',                         NULL,      'PLM-PVC-2-6', 'piece', 'per 6m length', 5800, 2, true, false),
  ((SELECT id FROM categories WHERE slug = 'plumbing'),  'dropship', 'Bathroom Mixer Tap Chrome',     'bathroom-mixer-tap',     'Single-lever basin mixer tap, chrome finish, 35mm ceramic cartridge. ½" connections.',           'Grohe',   'PLM-MXT-CH',  'piece', 'per tap',      28500, 1, true, false),
  ((SELECT id FROM categories WHERE slug = 'tools'),     'internal', 'Concrete Mixer 140L Electric',  'concrete-mixer-140l',    '140-litre electric concrete mixer, 0.5HP motor, 230V. Includes drum, blades and stand.',         NULL,      'TLS-MX-140L', 'piece', 'per unit',     185000,1, true, true);

-- Update sale price for tiles
UPDATE products SET sale_price = 19500 WHERE slug = 'ceramic-tiles-60x60';
UPDATE products SET sale_price = 29000 WHERE slug = 'interior-emulsion-20l';

-- ── Product Specs ─────────────────────────────────────────────
INSERT INTO product_specs (product_id, key_en, value_en, sort_order) VALUES
  ((SELECT id FROM products WHERE slug = 'portland-cement-50kg'), 'Grade',               '42.5R',                         1),
  ((SELECT id FROM products WHERE slug = 'portland-cement-50kg'), 'Standard',            'RBS 50:2014 / EN 197-1',        2),
  ((SELECT id FROM products WHERE slug = 'portland-cement-50kg'), 'Setting Time',        'Initial ≥ 60 min',              3),
  ((SELECT id FROM products WHERE slug = 'portland-cement-50kg'), 'Compressive Strength','≥ 42.5 MPa at 28 days',        4),
  ((SELECT id FROM products WHERE slug = 'deformed-rebar-y16'),   'Grade',               '500B',                          1),
  ((SELECT id FROM products WHERE slug = 'deformed-rebar-y16'),   'Diameter',            '16mm',                          2),
  ((SELECT id FROM products WHERE slug = 'deformed-rebar-y16'),   'Length',              '12m',                           3),
  ((SELECT id FROM products WHERE slug = 'deformed-rebar-y16'),   'Weight',              '18.96 kg/bar',                  4),
  ((SELECT id FROM products WHERE slug = 'ceramic-tiles-60x60'),  'Size',                '600 × 600 mm',                  1),
  ((SELECT id FROM products WHERE slug = 'ceramic-tiles-60x60'),  'Thickness',           '9mm',                           2),
  ((SELECT id FROM products WHERE slug = 'ceramic-tiles-60x60'),  'Finish',              'Polished',                      3),
  ((SELECT id FROM products WHERE slug = 'ceramic-tiles-60x60'),  'Slip Resistance',     'R9',                            4),
  ((SELECT id FROM products WHERE slug = 'ceramic-tiles-60x60'),  'Coverage',            '2.78 pieces per m²',           5);

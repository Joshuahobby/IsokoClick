-- ============================================================
-- IsokoClick — Initial Schema Migration
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Trigger: auto-update updated_at ─────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── USERS ────────────────────────────────────────────────────

CREATE TABLE users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id         uuid UNIQUE NOT NULL,
  email           text UNIQUE NOT NULL,
  phone           text,
  full_name       text NOT NULL,
  role            text NOT NULL DEFAULT 'customer'
                  CHECK (role IN ('customer','b2b_customer','partner',
                                  'warehouse_staff','delivery_agent','admin')),
  business_name   text,
  tin_number      text,
  preferred_lang  text DEFAULT 'en' CHECK (preferred_lang IN ('en','rw')),
  avatar_url      text,
  is_verified     boolean DEFAULT false,
  deleted_at      timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE user_addresses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES users(id) ON DELETE CASCADE,
  label         text,
  sector        text NOT NULL,
  district      text NOT NULL,
  province      text NOT NULL,
  street_detail text,
  landmark      text,
  lat           decimal(10,8),
  lng           decimal(11,8),
  is_default    boolean DEFAULT false,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);
CREATE TRIGGER trg_user_addresses_updated_at BEFORE UPDATE ON user_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── CATALOG ──────────────────────────────────────────────────

CREATE TABLE categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id   uuid REFERENCES categories(id) ON DELETE SET NULL,
  name_en     text NOT NULL,
  name_rw     text,
  slug        text UNIQUE NOT NULL,
  icon_url    text,
  sort_order  integer DEFAULT 0,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Partners must exist before products (forward reference)
CREATE TABLE partners (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES users(id),
  business_name   text NOT NULL,
  slug            text UNIQUE NOT NULL,
  logo_url        text,
  description     text,
  tin_number      text,
  phone           text,
  email           text,
  district        text,
  address         text,
  commission_rate decimal(5,2) DEFAULT 10.00,
  status          text DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','suspended','rejected')),
  payout_phone    text,
  deleted_at      timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
CREATE TRIGGER trg_partners_updated_at BEFORE UPDATE ON partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE products (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id      uuid REFERENCES categories(id),
  partner_id       uuid REFERENCES partners(id),
  source           text NOT NULL CHECK (source IN ('internal','dropship')),
  name_en          text NOT NULL,
  name_rw          text,
  slug             text UNIQUE NOT NULL,
  description_en   text,
  description_rw   text,
  brand            text,
  sku              text UNIQUE,
  unit_type        text NOT NULL
                   CHECK (unit_type IN ('bag','kg','tonne','m2','litre','piece','roll','box')),
  unit_label_en    text NOT NULL,
  unit_label_rw    text,
  base_price       integer NOT NULL,
  sale_price       integer,
  min_order_qty    integer DEFAULT 1,
  weight_kg        decimal(10,2),
  is_heavy_goods   boolean DEFAULT false,
  is_active        boolean DEFAULT true,
  is_featured      boolean DEFAULT false,
  meta_title       text,
  meta_description text,
  deleted_at       timestamptz,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);
CREATE INDEX idx_products_category  ON products(category_id);
CREATE INDEX idx_products_source    ON products(source);
CREATE INDEX idx_products_slug      ON products(slug);
CREATE INDEX idx_products_active    ON products(is_active, deleted_at);
CREATE INDEX idx_products_featured  ON products(is_featured) WHERE is_featured = true;
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE product_variants (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid REFERENCES products(id) ON DELETE CASCADE,
  name_en     text NOT NULL,
  name_rw     text,
  sku         text UNIQUE,
  price       integer,
  sort_order  integer DEFAULT 0,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
CREATE TRIGGER trg_product_variants_updated_at BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE product_images (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid REFERENCES products(id) ON DELETE CASCADE,
  storage_url text NOT NULL,
  alt_text    text,
  sort_order  integer DEFAULT 0,
  is_primary  boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE product_specs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid REFERENCES products(id) ON DELETE CASCADE,
  key_en      text NOT NULL,
  key_rw      text,
  value_en    text NOT NULL,
  value_rw    text,
  sort_order  integer DEFAULT 0
);

-- ── INVENTORY ────────────────────────────────────────────────

CREATE TABLE warehouses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  address     text NOT NULL,
  district    text NOT NULL,
  lat         decimal(10,8),
  lng         decimal(11,8),
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
CREATE TRIGGER trg_warehouses_updated_at BEFORE UPDATE ON warehouses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE inventory_internal (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id         uuid REFERENCES products(id),
  variant_id         uuid REFERENCES product_variants(id),
  warehouse_id       uuid REFERENCES warehouses(id),
  quantity           integer NOT NULL DEFAULT 0,
  reserved_quantity  integer NOT NULL DEFAULT 0,
  reorder_threshold  integer DEFAULT 10,
  updated_at         timestamptz DEFAULT now(),
  UNIQUE (product_id, variant_id, warehouse_id)
);
CREATE INDEX idx_inventory_low_stock ON inventory_internal(quantity, reorder_threshold)
  WHERE quantity <= reorder_threshold;
CREATE TRIGGER trg_inventory_internal_updated_at BEFORE UPDATE ON inventory_internal
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE inventory_dropship (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      uuid REFERENCES products(id),
  variant_id      uuid REFERENCES product_variants(id),
  partner_id      uuid REFERENCES partners(id),
  quantity        integer NOT NULL DEFAULT 0,
  last_synced_at  timestamptz,
  updated_at      timestamptz DEFAULT now(),
  UNIQUE (product_id, variant_id, partner_id)
);
CREATE TRIGGER trg_inventory_dropship_updated_at BEFORE UPDATE ON inventory_dropship
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── PARTNER PAYOUTS ───────────────────────────────────────────

CREATE TABLE partner_payouts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id          uuid REFERENCES partners(id),
  amount              integer NOT NULL,
  period_start        date NOT NULL,
  period_end          date NOT NULL,
  order_count         integer DEFAULT 0,
  pawapay_transfer_id text,
  status              text DEFAULT 'pending'
                      CHECK (status IN ('pending','processing','paid','failed')),
  paid_at             timestamptz,
  notes               text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);
CREATE TRIGGER trg_partner_payouts_updated_at BEFORE UPDATE ON partner_payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── ORDERS ───────────────────────────────────────────────────

CREATE TABLE orders (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number        text UNIQUE NOT NULL,
  customer_id         uuid REFERENCES users(id),
  shipping_address_id uuid REFERENCES user_addresses(id),
  status              text DEFAULT 'pending'
                      CHECK (status IN ('pending','confirmed','processing',
                                        'partially_fulfilled','fulfilled',
                                        'shipped','delivered','cancelled','refunded')),
  order_type          text DEFAULT 'b2c' CHECK (order_type IN ('b2c','b2b','rfq')),
  subtotal            integer NOT NULL,
  discount_amount     integer DEFAULT 0,
  delivery_fee        integer DEFAULT 0,
  total_amount        integer NOT NULL,
  promo_code          text,
  notes               text,
  is_approved         boolean DEFAULT true,
  deleted_at          timestamptz,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status   ON orders(status);
CREATE INDEX idx_orders_number   ON orders(order_number);
CREATE INDEX idx_orders_created  ON orders(created_at DESC);
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE order_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id      uuid REFERENCES products(id),
  variant_id      uuid REFERENCES product_variants(id),
  source          text NOT NULL CHECK (source IN ('internal','dropship')),
  partner_id      uuid REFERENCES partners(id),
  quantity        integer NOT NULL,
  unit_price      integer NOT NULL,
  total_price     integer NOT NULL,
  commission_rate decimal(5,2),
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE order_fulfillments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid REFERENCES orders(id),
  source       text NOT NULL CHECK (source IN ('internal','dropship')),
  partner_id   uuid REFERENCES partners(id),
  warehouse_id uuid REFERENCES warehouses(id),
  status       text DEFAULT 'pending'
               CHECK (status IN ('pending','accepted','picking','packed',
                                 'dispatched','delivered','failed')),
  staff_id     uuid REFERENCES users(id),
  notes        text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);
CREATE TRIGGER trg_order_fulfillments_updated_at BEFORE UPDATE ON order_fulfillments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE order_status_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid REFERENCES orders(id) ON DELETE CASCADE,
  status      text NOT NULL,
  changed_by  uuid REFERENCES users(id),
  notes       text,
  created_at  timestamptz DEFAULT now()
);

-- ── PAYMENTS ─────────────────────────────────────────────────

CREATE TABLE payments (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id           uuid REFERENCES orders(id),
  pawapay_deposit_id text UNIQUE,
  amount             integer NOT NULL,
  currency           text DEFAULT 'RWF',
  phone_number       text NOT NULL,
  operator           text,
  status             text DEFAULT 'pending'
                     CHECK (status IN ('pending','initiated','completed','failed','refunded')),
  failure_reason     text,
  initiated_at       timestamptz,
  completed_at       timestamptz,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);
CREATE INDEX idx_payments_order   ON payments(order_id);
CREATE INDEX idx_payments_pawapay ON payments(pawapay_deposit_id);
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE payment_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id  uuid REFERENCES payments(id),
  event_type  text NOT NULL,
  raw_payload jsonb NOT NULL,
  received_at timestamptz DEFAULT now()
);

-- ── DELIVERY ─────────────────────────────────────────────────

CREATE TABLE delivery_zones (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  districts       text[] NOT NULL,
  delivery_fee    integer NOT NULL,
  min_days        integer DEFAULT 1,
  max_days        integer DEFAULT 3,
  supports_heavy  boolean DEFAULT false,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
CREATE TRIGGER trg_delivery_zones_updated_at BEFORE UPDATE ON delivery_zones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE deliveries (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          uuid REFERENCES orders(id),
  fulfillment_id    uuid REFERENCES order_fulfillments(id),
  agent_id          uuid REFERENCES users(id),
  zone_id           uuid REFERENCES delivery_zones(id),
  scheduled_date    date,
  scheduled_slot    text,
  status            text DEFAULT 'pending'
                    CHECK (status IN ('pending','assigned','in_transit',
                                      'delivered','failed','rescheduled')),
  proof_of_delivery text,
  delivered_at      timestamptz,
  notes             text,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);
CREATE TRIGGER trg_deliveries_updated_at BEFORE UPDATE ON deliveries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── PROMOTIONS ───────────────────────────────────────────────

CREATE TABLE promotions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code            text UNIQUE,
  name_en         text NOT NULL,
  type            text NOT NULL
                  CHECK (type IN ('percentage','fixed','free_delivery')),
  value           integer NOT NULL,
  min_order_value integer DEFAULT 0,
  max_uses        integer,
  uses_count      integer DEFAULT 0,
  valid_from      timestamptz,
  valid_until     timestamptz,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
CREATE TRIGGER trg_promotions_updated_at BEFORE UPDATE ON promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── CONTENT ──────────────────────────────────────────────────

CREATE TABLE reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid REFERENCES products(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES users(id),
  order_id    uuid REFERENCES orders(id),
  rating      integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title       text,
  body        text,
  is_verified boolean DEFAULT false,
  is_approved boolean DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (product_id, customer_id, order_id)
);
CREATE TRIGGER trg_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES users(id) ON DELETE CASCADE,
  type        text NOT NULL,
  title_en    text NOT NULL,
  title_rw    text,
  body_en     text,
  body_rw     text,
  data        jsonb,
  channel     text[] DEFAULT '{in_app}',
  is_read     boolean DEFAULT false,
  sent_at     timestamptz,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- ── RLS ──────────────────────────────────────────────────────

ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE products            ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants    ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images      ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_specs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_internal  ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_dropship  ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners            ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_payouts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders              ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_fulfillments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones      ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries          ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews             ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;

-- Public read: categories, products, product_variants, product_images, product_specs, delivery_zones
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "products_public_read"   ON products   FOR SELECT USING (is_active = true AND deleted_at IS NULL);
CREATE POLICY "product_variants_public_read" ON product_variants FOR SELECT USING (is_active = true);
CREATE POLICY "product_images_public_read"   ON product_images   FOR SELECT USING (true);
CREATE POLICY "product_specs_public_read"    ON product_specs    FOR SELECT USING (true);
CREATE POLICY "reviews_public_read"          ON reviews          FOR SELECT USING (is_approved = true);
CREATE POLICY "delivery_zones_public_read"   ON delivery_zones   FOR SELECT USING (is_active = true);
CREATE POLICY "partners_public_read"         ON partners         FOR SELECT USING (status = 'approved' AND deleted_at IS NULL);

-- Users: own row only
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = auth_id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = auth_id);

-- Addresses: own only
CREATE POLICY "addresses_own" ON user_addresses FOR ALL USING (
  user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- Orders: own only
CREATE POLICY "orders_select_own" ON orders FOR SELECT USING (
  customer_id = (SELECT id FROM users WHERE auth_id = auth.uid())
);
CREATE POLICY "orders_insert_own" ON orders FOR INSERT WITH CHECK (
  customer_id = (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- Notifications: own only
CREATE POLICY "notifications_own" ON notifications FOR SELECT USING (
  user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- Reviews: insert own
CREATE POLICY "reviews_insert_own" ON reviews FOR INSERT WITH CHECK (
  customer_id = (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- Payments: own only
CREATE POLICY "payments_select_own" ON payments FOR SELECT USING (
  order_id IN (SELECT id FROM orders WHERE customer_id = (SELECT id FROM users WHERE auth_id = auth.uid()))
);

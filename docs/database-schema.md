# IsokoClick — Database Schema

## Conventions
- All tables have `id uuid DEFAULT gen_random_uuid() PRIMARY KEY`
- All tables have `created_at timestamptz DEFAULT now()` and `updated_at timestamptz DEFAULT now()`
- Soft deletes via `deleted_at timestamptz DEFAULT NULL` on core entities
- All monetary values in **RWF as integers** (no decimals — RWF has no cents)
- All timestamps stored in **UTC**, converted to `Africa/Kigali` (+2) on display
- Foreign keys use `uuid` references with `ON DELETE RESTRICT` unless noted

---

## Schema Diagram (Entity Groups)

```
USERS & AUTH
  users ←── user_addresses
         ←── user_payment_methods

CATALOG
  categories (tree)
  products ←── product_variants
           ←── product_images
           ←── product_specs

INVENTORY
  warehouses ←── inventory_internal
  partners   ←── inventory_dropship

ORDERS
  orders ←── order_items
         ←── order_fulfillments
         ←── order_status_history

PAYMENTS
  payments ←── payment_events (append-only log)

DELIVERY
  delivery_zones
  deliveries ←── delivery_status_history

PARTNERS
  partners ←── partner_products
           ←── partner_payouts

PROMOTIONS
  promotions ←── promotion_usages

CONTENT
  reviews
  notifications
```

---

## Tables

### users
```sql
CREATE TABLE users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id         uuid UNIQUE NOT NULL,           -- Supabase Auth user id
  email           text UNIQUE NOT NULL,
  phone           text,
  full_name       text NOT NULL,
  role            text NOT NULL DEFAULT 'customer'
                  CHECK (role IN ('customer', 'b2b_customer', 'partner',
                                  'warehouse_staff', 'delivery_agent', 'admin')),
  business_name   text,                           -- B2B only
  tin_number      text,                           -- Rwanda tax ID, B2B only
  preferred_lang  text DEFAULT 'en' CHECK (preferred_lang IN ('en', 'rw')),
  avatar_url      text,
  is_verified     boolean DEFAULT false,
  deleted_at      timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
```

### user_addresses
```sql
CREATE TABLE user_addresses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES users(id) ON DELETE CASCADE,
  label         text,                             -- "Home", "Site", "Office"
  sector        text NOT NULL,                    -- Rwanda admin division
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
```

---

### categories
```sql
CREATE TABLE categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id   uuid REFERENCES categories(id) ON DELETE SET NULL,
  name_en     text NOT NULL,
  name_rw     text,                               -- Kinyarwanda
  slug        text UNIQUE NOT NULL,
  icon_url    text,
  sort_order  integer DEFAULT 0,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
-- Root categories: Structure, Finishes, Plumbing, Electrical, Tools, Safety, Landscaping
```

### products
```sql
CREATE TABLE products (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     uuid REFERENCES categories(id),
  partner_id      uuid REFERENCES partners(id),  -- null if internal
  source          text NOT NULL CHECK (source IN ('internal', 'dropship')),
  name_en         text NOT NULL,
  name_rw         text,
  slug            text UNIQUE NOT NULL,
  description_en  text,
  description_rw  text,
  brand           text,
  sku             text UNIQUE,
  unit_type       text NOT NULL                   -- 'bag', 'kg', 'tonne', 'm2', 'litre',
                  CHECK (unit_type IN ('bag','kg','tonne','m2','litre','piece','roll','box')),
  unit_label_en   text NOT NULL,                  -- "per 50kg bag"
  unit_label_rw   text,
  base_price      integer NOT NULL,               -- RWF, VAT inclusive
  sale_price      integer,                        -- null if not on sale
  min_order_qty   integer DEFAULT 1,
  weight_kg       decimal(10,2),                  -- for delivery classification
  is_heavy_goods  boolean DEFAULT false,          -- >500kg orders need scheduled delivery
  is_active       boolean DEFAULT true,
  is_featured     boolean DEFAULT false,
  meta_title      text,
  meta_description text,
  deleted_at      timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_source ON products(source);
CREATE INDEX idx_products_slug ON products(slug);
```

### product_variants
```sql
CREATE TABLE product_variants (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid REFERENCES products(id) ON DELETE CASCADE,
  name_en     text NOT NULL,                      -- "Red", "20mm", "Grade A"
  name_rw     text,
  sku         text UNIQUE,
  price       integer,                            -- null = use product base_price
  sort_order  integer DEFAULT 0,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
```

### product_images
```sql
CREATE TABLE product_images (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid REFERENCES products(id) ON DELETE CASCADE,
  storage_url text NOT NULL,                      -- Supabase Storage URL
  alt_text    text,
  sort_order  integer DEFAULT 0,
  is_primary  boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);
```

### product_specs
```sql
CREATE TABLE product_specs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid REFERENCES products(id) ON DELETE CASCADE,
  key_en      text NOT NULL,                      -- "Compressive Strength"
  key_rw      text,
  value_en    text NOT NULL,                      -- "42.5 MPa"
  value_rw    text,
  sort_order  integer DEFAULT 0
);
```

---

### warehouses
```sql
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
```

### inventory_internal
```sql
CREATE TABLE inventory_internal (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id          uuid REFERENCES products(id),
  variant_id          uuid REFERENCES product_variants(id),
  warehouse_id        uuid REFERENCES warehouses(id),
  quantity            integer NOT NULL DEFAULT 0,
  reserved_quantity   integer NOT NULL DEFAULT 0, -- in active orders
  reorder_threshold   integer DEFAULT 10,
  updated_at          timestamptz DEFAULT now(),
  UNIQUE (product_id, variant_id, warehouse_id)
);
```

### inventory_dropship
```sql
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
```

---

### partners
```sql
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
  commission_rate decimal(5,2) DEFAULT 10.00,     -- percentage
  status          text DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'suspended', 'rejected')),
  payout_phone    text,                           -- MoMo number for payouts
  deleted_at      timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
```

### partner_payouts
```sql
CREATE TABLE partner_payouts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id          uuid REFERENCES partners(id),
  amount              integer NOT NULL,           -- RWF
  period_start        date NOT NULL,
  period_end          date NOT NULL,
  order_count         integer DEFAULT 0,
  pawapay_transfer_id text,
  status              text DEFAULT 'pending'
                      CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
  paid_at             timestamptz,
  notes               text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);
```

---

### orders
```sql
CREATE TABLE orders (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number        text UNIQUE NOT NULL,       -- IK-2026-00001
  customer_id         uuid REFERENCES users(id),
  shipping_address_id uuid REFERENCES user_addresses(id),
  status              text DEFAULT 'pending'
                      CHECK (status IN ('pending','confirmed','processing',
                                        'partially_fulfilled','fulfilled',
                                        'shipped','delivered','cancelled','refunded')),
  order_type          text DEFAULT 'b2c' CHECK (order_type IN ('b2c','b2b','rfq')),
  subtotal            integer NOT NULL,           -- RWF, before discounts
  discount_amount     integer DEFAULT 0,
  delivery_fee        integer DEFAULT 0,
  total_amount        integer NOT NULL,           -- RWF, final
  promo_code          text,
  notes               text,
  is_approved         boolean DEFAULT true,       -- false for B2B >1M RWF
  deleted_at          timestamptz,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);
```

### order_items
```sql
CREATE TABLE order_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id      uuid REFERENCES products(id),
  variant_id      uuid REFERENCES product_variants(id),
  source          text NOT NULL CHECK (source IN ('internal', 'dropship')),
  partner_id      uuid REFERENCES partners(id),  -- null if internal
  quantity        integer NOT NULL,
  unit_price      integer NOT NULL,              -- RWF at time of order
  total_price     integer NOT NULL,
  commission_rate decimal(5,2),                  -- snapshot at order time
  created_at      timestamptz DEFAULT now()
);
```

### order_fulfillments
```sql
CREATE TABLE order_fulfillments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid REFERENCES orders(id),
  source          text NOT NULL CHECK (source IN ('internal', 'dropship')),
  partner_id      uuid REFERENCES partners(id),
  warehouse_id    uuid REFERENCES warehouses(id),
  status          text DEFAULT 'pending'
                  CHECK (status IN ('pending','accepted','picking','packed',
                                    'dispatched','delivered','failed')),
  staff_id        uuid REFERENCES users(id),      -- warehouse staff assigned
  notes           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
```

### order_status_history
```sql
CREATE TABLE order_status_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid REFERENCES orders(id) ON DELETE CASCADE,
  status      text NOT NULL,
  changed_by  uuid REFERENCES users(id),
  notes       text,
  created_at  timestamptz DEFAULT now()
);
```

---

### payments
```sql
CREATE TABLE payments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              uuid REFERENCES orders(id),
  pawapay_deposit_id    text UNIQUE,              -- PawaPay's deposit ID
  amount                integer NOT NULL,         -- RWF
  currency              text DEFAULT 'RWF',
  phone_number          text NOT NULL,            -- customer MoMo number
  operator              text,                     -- 'MTN' | 'AIRTEL'
  status                text DEFAULT 'pending'
                        CHECK (status IN ('pending','initiated','completed',
                                          'failed','refunded')),
  failure_reason        text,
  initiated_at          timestamptz,
  completed_at          timestamptz,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_pawapay ON payments(pawapay_deposit_id);
```

### payment_events
```sql
-- Append-only log of all PawaPay webhook events
CREATE TABLE payment_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id      uuid REFERENCES payments(id),
  event_type      text NOT NULL,                  -- 'DEPOSIT_COMPLETED', etc.
  raw_payload     jsonb NOT NULL,                 -- full PawaPay webhook body
  received_at     timestamptz DEFAULT now()
);
```

---

### delivery_zones
```sql
CREATE TABLE delivery_zones (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,                  -- "Kigali City", "Northern Province"
  districts       text[] NOT NULL,
  delivery_fee    integer NOT NULL,               -- RWF
  min_days        integer DEFAULT 1,
  max_days        integer DEFAULT 3,
  supports_heavy  boolean DEFAULT false,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
```

### deliveries
```sql
CREATE TABLE deliveries (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            uuid REFERENCES orders(id),
  fulfillment_id      uuid REFERENCES order_fulfillments(id),
  agent_id            uuid REFERENCES users(id),  -- delivery agent
  zone_id             uuid REFERENCES delivery_zones(id),
  scheduled_date      date,
  scheduled_slot      text,                       -- "08:00-12:00"
  status              text DEFAULT 'pending'
                      CHECK (status IN ('pending','assigned','in_transit',
                                        'delivered','failed','rescheduled')),
  proof_of_delivery   text,                       -- Supabase Storage URL
  delivered_at        timestamptz,
  notes               text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);
```

---

### promotions
```sql
CREATE TABLE promotions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code            text UNIQUE,                    -- null for auto-applied
  name_en         text NOT NULL,
  type            text NOT NULL
                  CHECK (type IN ('percentage','fixed','free_delivery')),
  value           integer NOT NULL,               -- % or RWF amount
  min_order_value integer DEFAULT 0,
  max_uses        integer,
  uses_count      integer DEFAULT 0,
  valid_from      timestamptz,
  valid_until     timestamptz,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
```

---

### reviews
```sql
CREATE TABLE reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid REFERENCES products(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES users(id),
  order_id    uuid REFERENCES orders(id),
  rating      integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title       text,
  body        text,
  is_verified boolean DEFAULT false,              -- purchased the product
  is_approved boolean DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (product_id, customer_id, order_id)
);
```

### notifications
```sql
CREATE TABLE notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES users(id) ON DELETE CASCADE,
  type        text NOT NULL,                      -- 'order_confirmed', 'delivery_update', etc.
  title_en    text NOT NULL,
  title_rw    text,
  body_en     text,
  body_rw     text,
  data        jsonb,                              -- arbitrary payload
  channel     text[] DEFAULT '{in_app}',          -- 'in_app', 'sms', 'email', 'whatsapp'
  is_read     boolean DEFAULT false,
  sent_at     timestamptz,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
```

---

## RLS Policy Summary

| Table | Anon | Customer | Partner | Staff | Admin |
|-------|------|----------|---------|-------|-------|
| products | SELECT | SELECT | SELECT own | SELECT | ALL |
| inventory_internal | — | — | — | ALL | ALL |
| inventory_dropship | — | — | ALL own | SELECT | ALL |
| orders | — | SELECT/INSERT own | SELECT own items | SELECT | ALL |
| payments | — | SELECT own | — | SELECT | ALL |
| partners | — | SELECT (approved) | SELECT/UPDATE own | SELECT | ALL |
| reviews | SELECT | INSERT own | — | — | ALL |
| notifications | — | SELECT own | SELECT own | SELECT own | ALL |

---

## Key Indexes
```sql
-- Performance indexes beyond PKs and FKs
CREATE INDEX idx_products_active ON products(is_active, deleted_at);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_inventory_low_stock ON inventory_internal(quantity, reorder_threshold)
  WHERE quantity <= reorder_threshold;
```

---

## Triggers
```sql
-- Auto-update updated_at on all tables
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at column
```

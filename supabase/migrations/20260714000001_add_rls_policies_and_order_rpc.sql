-- ============================================================
-- RLS policies for tables that had RLS enabled but no policies,
-- plus an atomic order-creation RPC used by /api/orders.
--
-- Without a policy, RLS-enabled tables return zero rows to anon
-- and authenticated clients — which silently emptied order_items
-- on every customer-facing order page. Most privileged reads go
-- through the service key (which bypasses RLS), so the role
-- policies below are defense in depth, not the primary gate.
-- ============================================================

-- Role claim from the JWT. Roles live in app_metadata, which is only
-- settable with the service key — the same claim src/proxy.ts trusts.
CREATE OR REPLACE FUNCTION public.jwt_role()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '')
$$;

-- public.users.id for the signed-in auth user. SECURITY DEFINER so it
-- can be used inside policies on other tables without tripping over
-- the users table's own RLS.
CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS uuid
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT id FROM public.users WHERE auth_id = auth.uid()
$$;

REVOKE EXECUTE ON FUNCTION public.current_profile_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_profile_id() TO authenticated;

-- ── Admin: full access on every table ────────────────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','user_addresses','categories','products','product_variants',
    'product_images','product_specs','warehouses','inventory_internal',
    'inventory_dropship','partners','partner_payouts','orders','order_items',
    'order_fulfillments','order_status_history','payments','payment_events',
    'delivery_zones','deliveries','promotions','reviews','notifications'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_admin_all', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL
         USING (public.jwt_role() = ''admin'')
         WITH CHECK (public.jwt_role() = ''admin'')',
      t || '_admin_all', t
    );
  END LOOP;
END $$;

-- ── Customers ────────────────────────────────────────────────

-- order_items: read items of your own orders (this was the gap that
-- made every order confirmation page render zero line items)
DROP POLICY IF EXISTS "order_items_select_own" ON order_items;
CREATE POLICY "order_items_select_own" ON order_items FOR SELECT USING (
  order_id IN (SELECT id FROM orders WHERE customer_id = public.current_profile_id())
);

DROP POLICY IF EXISTS "order_status_history_select_own" ON order_status_history;
CREATE POLICY "order_status_history_select_own" ON order_status_history FOR SELECT USING (
  order_id IN (SELECT id FROM orders WHERE customer_id = public.current_profile_id())
);

-- ── Partners ─────────────────────────────────────────────────

-- Read your own partner row regardless of approval status
DROP POLICY IF EXISTS "partners_select_own" ON partners;
CREATE POLICY "partners_select_own" ON partners FOR SELECT USING (
  user_id = public.current_profile_id()
);

-- Update your own partner row (payout phone, profile details). Without
-- this, the payout-settings form silently updated zero rows.
DROP POLICY IF EXISTS "partners_update_own" ON partners;
CREATE POLICY "partners_update_own" ON partners FOR UPDATE
  USING (user_id = public.current_profile_id())
  WITH CHECK (user_id = public.current_profile_id());

-- See your own products even when inactive (the public policy only
-- exposes active ones)
DROP POLICY IF EXISTS "products_select_own_partner" ON products;
CREATE POLICY "products_select_own_partner" ON products FOR SELECT USING (
  partner_id IN (SELECT id FROM partners WHERE user_id = public.current_profile_id())
);

-- Read order items that reference your products
DROP POLICY IF EXISTS "order_items_select_partner" ON order_items;
CREATE POLICY "order_items_select_partner" ON order_items FOR SELECT USING (
  partner_id IN (SELECT id FROM partners WHERE user_id = public.current_profile_id())
);

DROP POLICY IF EXISTS "partner_payouts_select_own" ON partner_payouts;
CREATE POLICY "partner_payouts_select_own" ON partner_payouts FOR SELECT USING (
  partner_id IN (SELECT id FROM partners WHERE user_id = public.current_profile_id())
);

DROP POLICY IF EXISTS "inventory_dropship_partner_all" ON inventory_dropship;
CREATE POLICY "inventory_dropship_partner_all" ON inventory_dropship FOR ALL
  USING (partner_id IN (SELECT id FROM partners WHERE user_id = public.current_profile_id()))
  WITH CHECK (partner_id IN (SELECT id FROM partners WHERE user_id = public.current_profile_id()));

-- ── Warehouse staff ──────────────────────────────────────────

DROP POLICY IF EXISTS "warehouses_staff_read" ON warehouses;
CREATE POLICY "warehouses_staff_read" ON warehouses FOR SELECT
  USING (public.jwt_role() = 'warehouse_staff');

DROP POLICY IF EXISTS "inventory_internal_staff_all" ON inventory_internal;
CREATE POLICY "inventory_internal_staff_all" ON inventory_internal FOR ALL
  USING (public.jwt_role() = 'warehouse_staff')
  WITH CHECK (public.jwt_role() = 'warehouse_staff');

DROP POLICY IF EXISTS "order_fulfillments_staff_all" ON order_fulfillments;
CREATE POLICY "order_fulfillments_staff_all" ON order_fulfillments FOR ALL
  USING (public.jwt_role() = 'warehouse_staff')
  WITH CHECK (public.jwt_role() = 'warehouse_staff');

-- Staff need order context to pick/pack
DROP POLICY IF EXISTS "orders_staff_read" ON orders;
CREATE POLICY "orders_staff_read" ON orders FOR SELECT
  USING (public.jwt_role() = 'warehouse_staff');

DROP POLICY IF EXISTS "order_items_staff_read" ON order_items;
CREATE POLICY "order_items_staff_read" ON order_items FOR SELECT
  USING (public.jwt_role() = 'warehouse_staff');

-- ── Delivery agents ──────────────────────────────────────────

DROP POLICY IF EXISTS "deliveries_agent_select" ON deliveries;
CREATE POLICY "deliveries_agent_select" ON deliveries FOR SELECT
  USING (agent_id = public.current_profile_id());

DROP POLICY IF EXISTS "deliveries_agent_update" ON deliveries;
CREATE POLICY "deliveries_agent_update" ON deliveries FOR UPDATE
  USING (agent_id = public.current_profile_id())
  WITH CHECK (agent_id = public.current_profile_id());

-- ============================================================
-- Atomic order creation: order + items + payment in one
-- transaction, so a failed insert can never leave a headless
-- order behind (previously "rolled back" with a soft delete).
-- Called with the service key only.
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_order_with_items(
  p_order jsonb,
  p_items jsonb,
  p_payment jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order_id uuid;
BEGIN
  INSERT INTO public.orders (
    order_number, customer_id, shipping_address_id, status, order_type,
    subtotal, discount_amount, delivery_fee, total_amount, promo_code,
    notes, is_approved
  )
  VALUES (
    p_order->>'order_number',
    (p_order->>'customer_id')::uuid,
    NULL,
    COALESCE(p_order->>'status', 'pending'),
    COALESCE(p_order->>'order_type', 'b2c'),
    (p_order->>'subtotal')::integer,
    COALESCE((p_order->>'discount_amount')::integer, 0),
    COALESCE((p_order->>'delivery_fee')::integer, 0),
    (p_order->>'total_amount')::integer,
    p_order->>'promo_code',
    p_order->>'notes',
    COALESCE((p_order->>'is_approved')::boolean, true)
  )
  RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (
    order_id, product_id, variant_id, source, partner_id,
    quantity, unit_price, total_price, commission_rate
  )
  SELECT
    v_order_id,
    (i->>'product_id')::uuid,
    (i->>'variant_id')::uuid,
    i->>'source',
    (i->>'partner_id')::uuid,
    (i->>'quantity')::integer,
    (i->>'unit_price')::integer,
    (i->>'total_price')::integer,
    (i->>'commission_rate')::numeric
  FROM jsonb_array_elements(p_items) AS i;

  INSERT INTO public.payments (
    order_id, pawapay_deposit_id, amount, currency,
    phone_number, operator, status, initiated_at
  )
  VALUES (
    v_order_id,
    p_payment->>'pawapay_deposit_id',
    (p_payment->>'amount')::integer,
    COALESCE(p_payment->>'currency', 'RWF'),
    p_payment->>'phone_number',
    p_payment->>'operator',
    COALESCE(p_payment->>'status', 'pending'),
    (p_payment->>'initiated_at')::timestamptz
  );

  RETURN v_order_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_order_with_items(jsonb, jsonb, jsonb)
  FROM PUBLIC, anon, authenticated;

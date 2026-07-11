-- Customers could not read their own order items: order_items has RLS enabled
-- but no SELECT policy, so the order confirmation page rendered an empty item list.
-- Mirrors the ownership chain used by orders_select_own / payments_select_own.

CREATE POLICY "order_items_select_own" ON order_items FOR SELECT USING (
  order_id IN (
    SELECT id FROM orders
    WHERE customer_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  )
);

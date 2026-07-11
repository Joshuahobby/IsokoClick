// Hand-maintained placeholder mirroring supabase/migrations/ — NOT generated yet.
// Nullability is approximated pragmatically (columns with DB defaults are non-null here).
// Once the project is linked with the Supabase CLI, replace this file with the output of:
//   npx supabase gen types typescript --linked > src/types/database.ts
// and re-run that after every schema migration.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole =
  | 'customer'
  | 'b2b_customer'
  | 'partner'
  | 'warehouse_staff'
  | 'delivery_agent'
  | 'admin'

export type InventorySource = 'internal' | 'dropship'

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'partially_fulfilled'
  | 'fulfilled'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export type PaymentStatus =
  | 'pending'
  | 'initiated'
  | 'completed'
  | 'failed'
  | 'refunded'

export type PartnerStatus = 'pending' | 'approved' | 'suspended' | 'rejected'

export type FulfillmentStatus =
  | 'pending'
  | 'accepted'
  | 'picking'
  | 'packed'
  | 'dispatched'
  | 'delivered'
  | 'failed'

export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed'

export type DeliveryStatus =
  | 'pending'
  | 'assigned'
  | 'in_transit'
  | 'delivered'
  | 'failed'
  | 'rescheduled'

export type PromotionType = 'percentage' | 'fixed' | 'free_delivery'

export type UnitType =
  | 'bag'
  | 'kg'
  | 'tonne'
  | 'm2'
  | 'litre'
  | 'piece'
  | 'roll'
  | 'box'

// The `& Record<string, unknown>` intersections are required so that each table satisfies
// Supabase's GenericTable constraint (Row/Insert/Update must extend Record<string, unknown>).
// Without them, the client resolves Schema = never and all Insert/Update ops fail to type-check.
type DbEntry<Row, Insert, Update> = {
  Row: Row & Record<string, unknown>
  Insert: Insert & Record<string, unknown>
  Update: Update & Record<string, unknown>
  Relationships: never[]
}

export interface Database {
  public: {
    Tables: {
      users:                DbEntry<UserRow,               UserInsert,               UserUpdate>
      user_addresses:       DbEntry<UserAddressRow,        UserAddressInsert,        UserAddressUpdate>
      categories:           DbEntry<CategoryRow,           CategoryInsert,           CategoryUpdate>
      partners:             DbEntry<PartnerRow,            PartnerInsert,            PartnerUpdate>
      products:             DbEntry<ProductRow,            ProductInsert,            ProductUpdate>
      product_variants:     DbEntry<ProductVariantRow,     ProductVariantInsert,     ProductVariantUpdate>
      product_images:       DbEntry<ProductImageRow,       ProductImageInsert,       ProductImageUpdate>
      product_specs:        DbEntry<ProductSpecRow,        ProductSpecInsert,        ProductSpecUpdate>
      warehouses:           DbEntry<WarehouseRow,          WarehouseInsert,          WarehouseUpdate>
      inventory_internal:   DbEntry<InventoryInternalRow,  InventoryInternalInsert,  InventoryInternalUpdate>
      inventory_dropship:   DbEntry<InventoryDropshipRow,  InventoryDropshipInsert,  InventoryDropshipUpdate>
      partner_payouts:      DbEntry<PartnerPayoutRow,      PartnerPayoutInsert,      PartnerPayoutUpdate>
      orders:               DbEntry<OrderRow,              OrderInsert,              OrderUpdate>
      order_items:          DbEntry<OrderItemRow,          OrderItemInsert,          OrderItemUpdate>
      order_fulfillments:   DbEntry<OrderFulfillmentRow,   OrderFulfillmentInsert,   OrderFulfillmentUpdate>
      order_status_history: DbEntry<OrderStatusHistoryRow, OrderStatusHistoryInsert, OrderStatusHistoryUpdate>
      payments:             DbEntry<PaymentRow,            PaymentInsert,            PaymentUpdate>
      payment_events:       DbEntry<PaymentEventRow,       PaymentEventInsert,       PaymentEventUpdate>
      delivery_zones:       DbEntry<DeliveryZoneRow,       DeliveryZoneInsert,       DeliveryZoneUpdate>
      deliveries:           DbEntry<DeliveryRow,           DeliveryInsert,           DeliveryUpdate>
      promotions:           DbEntry<PromotionRow,          PromotionInsert,          PromotionUpdate>
      reviews:              DbEntry<ReviewRow,             ReviewInsert,             ReviewUpdate>
      notifications:        DbEntry<NotificationRow,       NotificationInsert,       NotificationUpdate>
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, string[]>
    CompositeTypes: Record<string, null>
  }
}

// ── Users ─────────────────────────────────────────────────────────────────────

export interface UserRow {
  id: string
  auth_id: string
  email: string
  phone: string | null
  full_name: string
  role: UserRole
  business_name: string | null
  tin_number: string | null
  preferred_lang: 'en' | 'rw'
  avatar_url: string | null
  is_verified: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}
export type UserInsert = Omit<UserRow, 'id' | 'created_at' | 'updated_at'>
export type UserUpdate = Partial<UserInsert>

export interface UserAddressRow {
  id: string
  user_id: string
  label: string | null
  sector: string
  district: string
  province: string
  street_detail: string | null
  landmark: string | null
  lat: number | null
  lng: number | null
  is_default: boolean
  created_at: string
  updated_at: string
}
export type UserAddressInsert = Omit<UserAddressRow, 'id' | 'created_at' | 'updated_at'>
export type UserAddressUpdate = Partial<UserAddressInsert>

// ── Catalog ───────────────────────────────────────────────────────────────────

export interface CategoryRow {
  id: string
  parent_id: string | null
  name_en: string
  name_rw: string | null
  slug: string
  icon_url: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}
export type CategoryInsert = Omit<CategoryRow, 'id' | 'created_at' | 'updated_at'>
export type CategoryUpdate = Partial<CategoryInsert>

export interface PartnerRow {
  id: string
  user_id: string
  business_name: string
  slug: string
  logo_url: string | null
  description: string | null
  tin_number: string | null
  phone: string | null
  email: string | null
  district: string | null
  address: string | null
  commission_rate: number
  status: PartnerStatus
  payout_phone: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}
export type PartnerInsert = Omit<PartnerRow, 'id' | 'created_at' | 'updated_at'>
export type PartnerUpdate = Partial<PartnerInsert>

export interface ProductRow {
  id: string
  category_id: string | null
  partner_id: string | null
  source: InventorySource
  name_en: string
  name_rw: string | null
  slug: string
  description_en: string | null
  description_rw: string | null
  brand: string | null
  sku: string | null
  unit_type: UnitType
  unit_label_en: string
  unit_label_rw: string | null
  base_price: number
  sale_price: number | null
  min_order_qty: number
  weight_kg: number | null
  is_heavy_goods: boolean
  is_active: boolean
  is_featured: boolean
  meta_title: string | null
  meta_description: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}
export type ProductInsert = Omit<ProductRow, 'id' | 'created_at' | 'updated_at'>
export type ProductUpdate = Partial<ProductInsert>

export interface ProductVariantRow {
  id: string
  product_id: string
  name_en: string
  name_rw: string | null
  sku: string | null
  price: number | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}
export type ProductVariantInsert = Omit<ProductVariantRow, 'id' | 'created_at' | 'updated_at'>
export type ProductVariantUpdate = Partial<ProductVariantInsert>

export interface ProductImageRow {
  id: string
  product_id: string
  storage_url: string
  alt_text: string | null
  sort_order: number
  is_primary: boolean
  created_at: string
}
export type ProductImageInsert = Omit<ProductImageRow, 'id' | 'created_at'>
export type ProductImageUpdate = Partial<ProductImageInsert>

export interface ProductSpecRow {
  id: string
  product_id: string
  key_en: string
  key_rw: string | null
  value_en: string
  value_rw: string | null
  sort_order: number
}
export type ProductSpecInsert = Omit<ProductSpecRow, 'id'>
export type ProductSpecUpdate = Partial<ProductSpecInsert>

// ── Inventory ─────────────────────────────────────────────────────────────────

export interface WarehouseRow {
  id: string
  name: string
  address: string
  district: string
  lat: number | null
  lng: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}
export type WarehouseInsert = Omit<WarehouseRow, 'id' | 'created_at' | 'updated_at'>
export type WarehouseUpdate = Partial<WarehouseInsert>

export interface InventoryInternalRow {
  id: string
  product_id: string
  variant_id: string | null
  warehouse_id: string
  quantity: number
  reserved_quantity: number
  reorder_threshold: number
  updated_at: string
}
export type InventoryInternalInsert = Omit<InventoryInternalRow, 'id' | 'updated_at'>
export type InventoryInternalUpdate = Partial<InventoryInternalInsert>

export interface InventoryDropshipRow {
  id: string
  product_id: string
  variant_id: string | null
  partner_id: string
  quantity: number
  last_synced_at: string | null
  updated_at: string
}
export type InventoryDropshipInsert = Omit<InventoryDropshipRow, 'id' | 'updated_at'>
export type InventoryDropshipUpdate = Partial<InventoryDropshipInsert>

// ── Partner payouts ───────────────────────────────────────────────────────────

export interface PartnerPayoutRow {
  id: string
  partner_id: string
  amount: number
  period_start: string
  period_end: string
  order_count: number
  pawapay_transfer_id: string | null
  status: PayoutStatus
  paid_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}
export type PartnerPayoutInsert = Omit<PartnerPayoutRow, 'id' | 'created_at' | 'updated_at'>
export type PartnerPayoutUpdate = Partial<PartnerPayoutInsert>

// ── Orders ────────────────────────────────────────────────────────────────────

export interface OrderRow {
  id: string
  order_number: string
  customer_id: string
  shipping_address_id: string | null
  status: OrderStatus
  order_type: 'b2c' | 'b2b' | 'rfq'
  subtotal: number
  discount_amount: number
  delivery_fee: number
  total_amount: number
  promo_code: string | null
  notes: string | null
  is_approved: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}
export type OrderInsert = Omit<OrderRow, 'id' | 'created_at' | 'updated_at'>
export type OrderUpdate = Partial<OrderInsert>

export interface OrderItemRow {
  id: string
  order_id: string
  product_id: string
  variant_id: string | null
  source: InventorySource
  partner_id: string | null
  quantity: number
  unit_price: number
  total_price: number
  commission_rate: number | null
  created_at: string
}
export type OrderItemInsert = Omit<OrderItemRow, 'id' | 'created_at'>
export type OrderItemUpdate = Partial<OrderItemInsert>

export interface OrderFulfillmentRow {
  id: string
  order_id: string
  source: InventorySource
  partner_id: string | null
  warehouse_id: string | null
  status: FulfillmentStatus
  staff_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}
export type OrderFulfillmentInsert = Omit<OrderFulfillmentRow, 'id' | 'created_at' | 'updated_at'>
export type OrderFulfillmentUpdate = Partial<OrderFulfillmentInsert>

export interface OrderStatusHistoryRow {
  id: string
  order_id: string
  status: OrderStatus
  changed_by: string | null
  notes: string | null
  created_at: string
}
export type OrderStatusHistoryInsert = Omit<OrderStatusHistoryRow, 'id' | 'created_at'>
export type OrderStatusHistoryUpdate = Partial<OrderStatusHistoryInsert>

// ── Payments ──────────────────────────────────────────────────────────────────

export interface PaymentRow {
  id: string
  order_id: string
  pawapay_deposit_id: string | null
  amount: number
  currency: string
  phone_number: string
  operator: 'MTN' | 'AIRTEL' | null
  status: PaymentStatus
  failure_reason: string | null
  initiated_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}
export type PaymentInsert = Omit<PaymentRow, 'id' | 'created_at' | 'updated_at'>
export type PaymentUpdate = Partial<PaymentInsert>

export interface PaymentEventRow {
  id: string
  payment_id: string
  event_type: string
  raw_payload: Json
  received_at: string
}
export type PaymentEventInsert = Omit<PaymentEventRow, 'id' | 'received_at'>
export type PaymentEventUpdate = Partial<PaymentEventInsert>

// ── Delivery ──────────────────────────────────────────────────────────────────

export interface DeliveryZoneRow {
  id: string
  name: string
  districts: string[]
  delivery_fee: number
  min_days: number
  max_days: number
  supports_heavy: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}
export type DeliveryZoneInsert = Omit<DeliveryZoneRow, 'id' | 'created_at' | 'updated_at'>
export type DeliveryZoneUpdate = Partial<DeliveryZoneInsert>

export interface DeliveryRow {
  id: string
  order_id: string
  fulfillment_id: string | null
  agent_id: string | null
  zone_id: string | null
  scheduled_date: string | null
  scheduled_slot: string | null
  status: DeliveryStatus
  proof_of_delivery: string | null
  delivered_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}
export type DeliveryInsert = Omit<DeliveryRow, 'id' | 'created_at' | 'updated_at'>
export type DeliveryUpdate = Partial<DeliveryInsert>

// ── Promotions ────────────────────────────────────────────────────────────────

export interface PromotionRow {
  id: string
  code: string | null
  name_en: string
  type: PromotionType
  value: number
  min_order_value: number
  max_uses: number | null
  uses_count: number
  valid_from: string | null
  valid_until: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}
export type PromotionInsert = Omit<PromotionRow, 'id' | 'created_at' | 'updated_at'>
export type PromotionUpdate = Partial<PromotionInsert>

// ── Content ───────────────────────────────────────────────────────────────────

export interface ReviewRow {
  id: string
  product_id: string
  customer_id: string
  order_id: string | null
  rating: number
  title: string | null
  body: string | null
  is_verified: boolean
  is_approved: boolean
  created_at: string
  updated_at: string
}
export type ReviewInsert = Omit<ReviewRow, 'id' | 'created_at' | 'updated_at'>
export type ReviewUpdate = Partial<ReviewInsert>

export interface NotificationRow {
  id: string
  user_id: string
  type: string
  title_en: string
  title_rw: string | null
  body_en: string | null
  body_rw: string | null
  data: Json | null
  channel: string[]
  is_read: boolean
  sent_at: string | null
  created_at: string
}
export type NotificationInsert = Omit<NotificationRow, 'id' | 'created_at'>
export type NotificationUpdate = Partial<NotificationInsert>

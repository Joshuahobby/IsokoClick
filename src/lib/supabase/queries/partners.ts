import { createAdminClient, createClient } from '@/lib/supabase/server'
import type { PartnerRow, ProductRow } from '@/types/database'

// ─── Partner profile ──────────────────────────────────────────────────────────

export type PartnerProfile = PartnerRow

export async function getPartnerByUserId(userId: string): Promise<PartnerProfile | null> {
  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('partners')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single()
  if (error) return null
  return data as unknown as PartnerProfile
}

// ─── Partner stats ────────────────────────────────────────────────────────────

export type PartnerStats = {
  pendingItems: number
  activeProducts: number
  revenueTotal: number
  revenueThisMonth: number
}

export async function getPartnerStats(partnerId: string): Promise<PartnerStats> {
  const admin = await createAdminClient()
  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  ).toISOString()

  // Product IDs for this partner
  const { data: productRows } = await admin
    .from('products')
    .select('id')
    .eq('partner_id', partnerId)
    .is('deleted_at', null)

  const productIds = (productRows ?? []).map((p) => (p as { id: string }).id)

  const [activeProducts, pendingItems, revenue, revenueMonth] = await Promise.all([
    admin
      .from('products')
      .select('id', { count: 'exact' })
      .eq('partner_id', partnerId)
      .eq('is_active', true)
      .is('deleted_at', null),

    productIds.length > 0
      ? admin
          .from('order_items')
          .select('id', { count: 'exact' })
          .in('product_id', productIds)
      : Promise.resolve({ count: 0 }),

    productIds.length > 0
      ? admin
          .from('order_items')
          .select('total_price')
          .in('product_id', productIds)
      : Promise.resolve({ data: [] }),

    productIds.length > 0
      ? admin
          .from('order_items')
          .select('total_price, orders!inner(created_at)')
          .in('product_id', productIds)
          .gte('orders.created_at', monthStart)
      : Promise.resolve({ data: [] }),
  ])

  const sumTotals = (rows: { total_price: number }[] | null) =>
    (rows ?? []).reduce((s, r) => s + r.total_price, 0)

  return {
    pendingItems: pendingItems.count ?? 0,
    activeProducts: activeProducts.count ?? 0,
    revenueTotal: sumTotals(revenue.data as { total_price: number }[] | null),
    revenueThisMonth: sumTotals(revenueMonth.data as { total_price: number }[] | null),
  }
}

// ─── Partner orders ───────────────────────────────────────────────────────────

export type PartnerOrderItem = {
  id: string
  quantity: number
  unit_price: number
  total_price: number
  product: { name_en: string } | null
  order: {
    id: string
    order_number: string
    status: string
    created_at: string
  }
}

export async function getPartnerOrderItems(
  partnerId: string,
  page = 1,
  pageSize = 25
): Promise<{ items: PartnerOrderItem[]; total: number }> {
  const admin = await createAdminClient()

  // Get product IDs for this partner
  const { data: productRows } = await admin
    .from('products')
    .select('id')
    .eq('partner_id', partnerId)
    .is('deleted_at', null)

  const productIds = (productRows ?? []).map((p) => (p as { id: string }).id)
  if (productIds.length === 0) return { items: [], total: 0 }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await admin
    .from('order_items')
    .select(
      `id, quantity, unit_price, total_price,
       product:product_id(name_en),
       order:order_id(id, order_number, status, created_at)`,
      { count: 'exact' }
    )
    .in('product_id', productIds)
    .order('id', { ascending: false })
    .range(from, to)

  if (error) return { items: [], total: 0 }
  return { items: data as unknown as PartnerOrderItem[], total: count ?? 0 }
}

// ─── Partner catalog ──────────────────────────────────────────────────────────

export type PartnerProduct = Pick<
  ProductRow,
  'id' | 'name_en' | 'slug' | 'base_price' | 'sale_price' | 'is_active' | 'is_featured' | 'created_at'
>

export async function getPartnerProducts(
  partnerId: string,
  page = 1,
  pageSize = 25
): Promise<{ products: PartnerProduct[]; total: number }> {
  const supabase = await createClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('products')
    .select('id, name_en, slug, base_price, sale_price, is_active, is_featured, created_at', {
      count: 'exact',
    })
    .eq('partner_id', partnerId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return { products: [], total: 0 }
  return { products: data as unknown as PartnerProduct[], total: count ?? 0 }
}

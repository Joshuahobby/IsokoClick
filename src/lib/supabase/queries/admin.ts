import { createAdminClient } from '@/lib/supabase/server'
import type { OrderRow, OrderStatus, PartnerRow, PaymentStatus, PartnerStatus, UserRow } from '@/types/database'

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export type DashboardStats = {
  revenueTotal: number
  revenueThisMonth: number
  ordersTotal: number
  ordersToday: number
  ordersPending: number
  productsActive: number
  partnersApproved: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const admin = await createAdminClient()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

  const [revenue, revenueMonth, ordersTotal, ordersToday, ordersPending, products, partners] =
    await Promise.all([
      admin
        .from('payments')
        .select('amount', { count: 'exact' })
        .eq('status', 'completed'),

      admin
        .from('payments')
        .select('amount')
        .eq('status', 'completed')
        .gte('completed_at', monthStart),

      admin.from('orders').select('id', { count: 'exact' }).is('deleted_at', null),

      admin
        .from('orders')
        .select('id', { count: 'exact' })
        .is('deleted_at', null)
        .gte('created_at', todayStart),

      admin
        .from('orders')
        .select('id', { count: 'exact' })
        .is('deleted_at', null)
        .eq('status', 'pending'),

      admin.from('products').select('id', { count: 'exact' }).eq('is_active', true).is('deleted_at', null),

      admin.from('partners').select('id', { count: 'exact' }).eq('status', 'approved').is('deleted_at', null),
    ])

  const sumAmount = (rows: { amount: number }[] | null) =>
    (rows ?? []).reduce((s, r) => s + r.amount, 0)

  return {
    revenueTotal: sumAmount(revenue.data as { amount: number }[] | null),
    revenueThisMonth: sumAmount(revenueMonth.data as { amount: number }[] | null),
    ordersTotal: ordersTotal.count ?? 0,
    ordersToday: ordersToday.count ?? 0,
    ordersPending: ordersPending.count ?? 0,
    productsActive: products.count ?? 0,
    partnersApproved: partners.count ?? 0,
  }
}

// ─── Admin orders list ────────────────────────────────────────────────────────

export type AdminOrderRow = Pick<
  OrderRow,
  'id' | 'order_number' | 'status' | 'total_amount' | 'order_type' | 'created_at'
> & {
  customer: { full_name: string; email: string } | null
  payments: { status: PaymentStatus }[]
}

export type AdminOrderFilters = {
  status?: OrderStatus
  search?: string
  page?: number
  pageSize?: number
}

export async function getAdminOrders(
  filters: AdminOrderFilters = {}
): Promise<{ orders: AdminOrderRow[]; total: number }> {
  const admin = await createAdminClient()
  const page = filters.page ?? 1
  const pageSize = filters.pageSize ?? 25
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = admin
    .from('orders')
    .select(
      `id, order_number, status, total_amount, order_type, created_at,
       customer:customer_id(full_name, email),
       payments(status)`,
      { count: 'exact' }
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.search) query = query.ilike('order_number', `%${filters.search}%`)

  const { data, error, count } = await query
  if (error) return { orders: [], total: 0 }
  return { orders: data as unknown as AdminOrderRow[], total: count ?? 0 }
}

// ─── Admin products list ──────────────────────────────────────────────────────

export type AdminProductRow = {
  id: string
  name_en: string
  slug: string
  source: 'internal' | 'dropship'
  base_price: number
  sale_price: number | null
  is_active: boolean
  is_featured: boolean
  created_at: string
  categories: { name_en: string } | null
}

export async function getAdminProducts(
  page = 1,
  pageSize = 25,
  search?: string
): Promise<{ products: AdminProductRow[]; total: number }> {
  const admin = await createAdminClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = admin
    .from('products')
    .select(
      `id, name_en, slug, source, base_price, sale_price, is_active, is_featured, created_at,
       categories:category_id(name_en)`,
      { count: 'exact' }
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) query = query.ilike('name_en', `%${search}%`)

  const { data, error, count } = await query
  if (error) return { products: [], total: 0 }
  return { products: data as unknown as AdminProductRow[], total: count ?? 0 }
}

// ─── Admin partners list ──────────────────────────────────────────────────────

export type AdminPartnerRow = {
  id: string
  business_name: string
  slug: string
  status: PartnerStatus
  commission_rate: number
  district: string | null
  email: string | null
  phone: string | null
  created_at: string
}

export async function getAdminPartners(
  status?: PartnerStatus,
  page = 1,
  pageSize = 25
): Promise<{ partners: AdminPartnerRow[]; total: number }> {
  const admin = await createAdminClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = admin
    .from('partners')
    .select('id, business_name, slug, status, commission_rate, district, email, phone, created_at', {
      count: 'exact',
    })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status) query = query.eq('status', status)

  const { data, error, count } = await query
  if (error) return { partners: [], total: 0 }
  return { partners: data as unknown as AdminPartnerRow[], total: count ?? 0 }
}

// ─── Admin order detail ───────────────────────────────────────────────────────

export type AdminOrderDetail = OrderRow & {
  customer: { full_name: string; email: string; phone: string | null } | null
  order_items: {
    id: string
    source: 'internal' | 'dropship'
    quantity: number
    unit_price: number
    total_price: number
    product: { name_en: string; sku: string | null } | null
  }[]
  payments: {
    id: string
    status: PaymentStatus
    amount: number
    currency: string
    phone_number: string
    operator: 'MTN' | 'AIRTEL' | null
    initiated_at: string | null
    completed_at: string | null
    failure_reason: string | null
    pawapay_deposit_id: string | null
  }[]
}

export async function getAdminOrderById(id: string): Promise<AdminOrderDetail | null> {
  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('orders')
    .select(`
      *,
      customer:customer_id(full_name, email, phone),
      order_items(id, source, quantity, unit_price, total_price, product:product_id(name_en, sku)),
      payments(id, status, amount, currency, phone_number, operator, initiated_at, completed_at, failure_reason, pawapay_deposit_id)
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) return null
  return data as unknown as AdminOrderDetail
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<boolean> {
  const admin = await createAdminClient()
  const { error } = await admin.from('orders').update({ status }).eq('id', orderId)
  return !error
}

// ─── Admin partner detail & actions ──────────────────────────────────────────

export type AdminPartnerDetail = PartnerRow & {
  user: Pick<UserRow, 'full_name' | 'email' | 'phone'> | null
}

export async function getAdminPartnerById(id: string): Promise<AdminPartnerDetail | null> {
  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('partners')
    .select('*, user:user_id(full_name, email, phone)')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) return null
  // The hand-written Database type carries no relationship metadata, so
  // supabase-js cannot infer the embedded user join.
  return data as unknown as AdminPartnerDetail
}

export async function updatePartnerStatus(
  partnerId: string,
  status: PartnerStatus,
  userId: string
): Promise<boolean> {
  const admin = await createAdminClient()
  
  // 1. Update partner status
  const { error: partnerError } = await admin
    .from('partners')
    .update({ status })
    .eq('id', partnerId)
    
  if (partnerError) return false

  // 2. If approved, update user role to 'partner'
  // Roles live in app_metadata (service-key only) — user_metadata is
  // client-controlled and must never carry authorization.
  if (status === 'approved') {
    await admin.from('users').update({ role: 'partner' }).eq('id', userId)
    await admin.auth.admin.updateUserById(userId, {
      app_metadata: { role: 'partner' }
    })
  } else if (status === 'suspended' || status === 'rejected') {
    // Revert role to customer
    await admin.from('users').update({ role: 'customer' }).eq('id', userId)
    await admin.auth.admin.updateUserById(userId, {
      app_metadata: { role: 'customer' }
    })
  }

  return true
}

// ─── Recent orders (dashboard widget) ────────────────────────────────────────

export async function getRecentOrders(limit = 8): Promise<AdminOrderRow[]> {
  const { orders } = await getAdminOrders({ pageSize: limit })
  return orders
}

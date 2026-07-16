import { getTranslations } from 'next-intl/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { apiResponse, apiError } from '@/lib/utils/api'
import { getUserProfileId } from '@/lib/supabase/queries/orders'
import { logError } from '@/lib/utils/log'
import { normalizePhone, detectOperator } from '@/lib/utils/phone'
import { MIN_ORDER_VALUE } from '@/constants/app'
import type { DeliveryZoneRow, InventorySource, Json } from '@/types/database'

type CartLine = { id: string; qty: number }

type DeliveryDetails = {
  fullName: string
  phone: string
  district: string
  address: string
  notes?: string
}

type OrderRequestBody = {
  items: CartLine[]
  deliveryDetails: DeliveryDetails
  paymentMethod: 'momo' | 'cash'
}

const PAWAPAY_BASE_URL =
  process.env.PAWAPAY_SANDBOX === 'true'
    ? 'https://api.sandbox.pawapay.io'
    : 'https://api.pawapay.cloud'

const CORRESPONDENT: Record<string, string> = {
  MTN: 'MTN_MOMO_RWA',
  AIRTEL: 'AIRTEL_OAPI_RWA',
}

const MAX_LINE_QTY = 10_000

function generateOrderNumber(): string {
  const rand = crypto.randomUUID().slice(0, 4).toUpperCase()
  return `IC-${Date.now().toString(36).toUpperCase()}-${rand}`
}

type PricedProduct = {
  id: string
  name_en: string
  source: InventorySource
  base_price: number
  sale_price: number | null
  min_order_qty: number
  is_heavy_goods: boolean
  partner_id: string | null
  partner: { commission_rate: number } | null
}

export async function POST(request: Request) {
  const t = await getTranslations('errors')

  // Auth check
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) return apiError(t('unauthorized'), 401)

  // Get public users.id (different from auth.uid())
  const customerId = await getUserProfileId(authUser.id)
  if (!customerId) return apiError(t('profileNotFound'), 404)

  // Parse body
  let body: OrderRequestBody
  try {
    body = (await request.json()) as OrderRequestBody
  } catch {
    return apiError(t('invalidBody'))
  }

  const { items, deliveryDetails, paymentMethod } = body

  if (!items?.length) return apiError(t('cartEmpty'))
  if (!deliveryDetails?.phone) return apiError(t('phoneRequired'))
  if (!deliveryDetails?.fullName) return apiError(t('nameRequired'))
  if (!deliveryDetails?.district) return apiError(t('districtRequired'))
  if (paymentMethod !== 'momo' && paymentMethod !== 'cash') {
    return apiError(t('invalidPaymentMethod'))
  }

  const phone = normalizePhone(deliveryDetails.phone)
  if (!phone) return apiError(t('invalidPhone'))

  const operator = detectOperator(phone)
  if (paymentMethod === 'momo' && !operator) {
    return apiError(t('momoOperator'))
  }

  // Validate quantities before touching the DB
  const lines = new Map<string, number>()
  for (const line of items) {
    if (typeof line.id !== 'string' || !Number.isInteger(line.qty) || line.qty < 1 || line.qty > MAX_LINE_QTY) {
      return apiError(t('invalidQuantity'))
    }
    lines.set(line.id, (lines.get(line.id) ?? 0) + line.qty)
  }

  // Re-price every line from the database — the client cart is never
  // trusted for prices, sources, or availability. The RLS-scoped client
  // only returns active, non-deleted products, and the embedded partner
  // join only resolves for approved partners.
  const { data: productRows, error: productsError } = await supabase
    .from('products')
    .select(
      'id, name_en, source, base_price, sale_price, min_order_qty, is_heavy_goods, partner_id, partner:partner_id(commission_rate)'
    )
    .in('id', [...lines.keys()])
    .eq('is_active', true)
    .is('deleted_at', null)

  if (productsError) {
    logError('orders:load-products', productsError)
    return apiError(t('productsLoadFailed'), 500)
  }

  // The hand-written Database type carries no relationship metadata, so
  // supabase-js cannot infer the embedded partner join.
  const products = (productRows ?? []) as unknown as PricedProduct[]
  const productById = new Map(products.map((p) => [p.id, p]))

  const orderItems: Json[] = []
  let subtotal = 0
  let hasHeavyGoods = false

  for (const [productId, qty] of lines) {
    const product = productById.get(productId)
    if (!product) return apiError(t('itemUnavailable'))
    if (product.source === 'dropship' && (!product.partner_id || !product.partner)) {
      return apiError(t('productUnavailable', { name: product.name_en }))
    }
    if (qty < product.min_order_qty) {
      return apiError(t('minQty', { name: product.name_en, qty: product.min_order_qty }))
    }

    const unitPrice = product.sale_price ?? product.base_price
    const totalPrice = unitPrice * qty
    subtotal += totalPrice
    if (product.is_heavy_goods) hasHeavyGoods = true

    orderItems.push({
      product_id: product.id,
      variant_id: null,
      source: product.source,
      partner_id: product.partner_id,
      quantity: qty,
      unit_price: unitPrice,
      total_price: totalPrice,
      commission_rate: product.source === 'dropship' ? (product.partner?.commission_rate ?? null) : null,
    })
  }

  if (subtotal < MIN_ORDER_VALUE) {
    return apiError(t('minOrderValue', { amount: MIN_ORDER_VALUE.toLocaleString() }))
  }

  // Delivery fee comes from the zone covering the district
  const { data: zoneRow } = await supabase
    .from('delivery_zones')
    .select('delivery_fee, supports_heavy')
    .contains('districts', [deliveryDetails.district])
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  const zone = zoneRow as Pick<DeliveryZoneRow, 'delivery_fee' | 'supports_heavy'> | null
  if (!zone) return apiError(t('deliveryUnavailable'))
  if (hasHeavyGoods && !zone.supports_heavy) {
    return apiError(t('heavyGoodsUnavailable'))
  }

  const deliveryFee = zone.delivery_fee
  const totalAmount = subtotal + deliveryFee

  const adminClient = await createAdminClient()
  const orderNumber = generateOrderNumber()
  const depositId = crypto.randomUUID()

  // Order + items + payment are created atomically in one transaction
  const { data: orderId, error: orderError } = await adminClient.rpc('create_order_with_items', {
    p_order: {
      order_number: orderNumber,
      customer_id: customerId,
      status: 'pending',
      order_type: 'b2c',
      subtotal,
      discount_amount: 0,
      delivery_fee: deliveryFee,
      total_amount: totalAmount,
      notes: JSON.stringify({ deliveryDetails: { ...deliveryDetails, phone }, paymentMethod }),
      is_approved: true,
    },
    p_items: orderItems,
    p_payment: {
      pawapay_deposit_id: paymentMethod === 'momo' ? depositId : null,
      amount: totalAmount,
      currency: 'RWF',
      phone_number: phone,
      operator,
      status: 'pending',
      initiated_at: null,
    },
  })

  if (orderError || !orderId) {
    logError('orders:create', orderError)
    return apiError(t('orderCreateFailed'), 500)
  }

  // Cash on delivery: no PawaPay push — the payment stays pending
  if (paymentMethod === 'cash') {
    return apiResponse({ orderId, orderNumber, depositId: null, paymentInitiated: false })
  }

  // Call PawaPay Deposits API (USSD push to the customer's phone)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://isokoclick.rw'
  let paymentInitiated = false

  try {
    const pawapayRes = await fetch(`${PAWAPAY_BASE_URL}/deposits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.PAWAPAY_API_KEY}`,
      },
      body: JSON.stringify({
        depositId,
        returnUrl: `${appUrl}/orders/${orderId}`,
        amount: String(totalAmount),
        currency: 'RWF',
        correspondent: CORRESPONDENT[operator as string],
        payer: {
          type: 'MSISDN',
          address: { value: phone },
        },
        customerTimestamp: new Date().toISOString(),
        statementDescription: `IsokoClick ${orderNumber}`,
      }),
    })

    if (pawapayRes.ok) {
      const pawapayData = (await pawapayRes.json()) as { status?: string }
      paymentInitiated = pawapayData.status === 'ACCEPTED' || pawapayData.status === 'SUBMITTED'
    } else {
      logError('orders:pawapay', new Error(`PawaPay deposit failed with HTTP ${pawapayRes.status}`))
    }
  } catch (error) {
    // PawaPay call failed — the order and pending payment are already
    // recorded, so the customer can retry payment from the order page.
    logError('orders:pawapay', error)
  }

  if (paymentInitiated) {
    await adminClient
      .from('payments')
      .update({ status: 'initiated', initiated_at: new Date().toISOString() })
      .eq('pawapay_deposit_id', depositId)
  }

  return apiResponse({ orderId, orderNumber, depositId, paymentInitiated })
}

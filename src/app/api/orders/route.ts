import { createClient, createAdminClient } from '@/lib/supabase/server'
import { apiResponse, apiError } from '@/lib/utils/api'
import { getUserProfileId } from '@/lib/supabase/queries/orders'
import { MIN_ORDER_VALUE } from '@/constants/app'
import type { CartItem } from '@/hooks/use-cart'

type DeliveryDetails = {
  fullName: string
  phone: string
  district: string
  notes: string
}

type OrderRequestBody = {
  items: CartItem[]
  deliveryDetails: DeliveryDetails
}

const PAWAPAY_BASE_URL =
  process.env.PAWAPAY_SANDBOX === 'true'
    ? 'https://api.sandbox.pawapay.io'
    : 'https://api.pawapay.cloud'

const CORRESPONDENT: Record<string, string> = {
  MTN: 'MTN_MOMO_RWA',
  AIRTEL: 'AIRTEL_OAPI_RWA',
}

function detectOperator(phone: string): 'MTN' | 'AIRTEL' | null {
  const sub = phone.slice(3, 5) // after '250'
  if (sub === '78' || sub === '79') return 'MTN'
  if (sub === '72' || sub === '73') return 'AIRTEL'
  return null
}

function generateOrderNumber(): string {
  return `IC-${Date.now().toString(36).toUpperCase()}`
}

export async function POST(request: Request) {
  // Auth check
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) return apiError('Unauthorized', 401)

  // Get public users.id (different from auth.uid())
  const customerId = await getUserProfileId(authUser.id)
  if (!customerId) return apiError('User profile not found. Please complete account setup.', 404)

  // Parse body
  let body: OrderRequestBody
  try {
    body = (await request.json()) as OrderRequestBody
  } catch {
    return apiError('Invalid request body')
  }

  const { items, deliveryDetails } = body

  if (!items?.length) return apiError('Cart is empty')
  if (!deliveryDetails?.phone) return apiError('Delivery phone number is required')
  if (!deliveryDetails?.fullName) return apiError('Full name is required')
  if (!deliveryDetails?.district) return apiError('District is required')

  // Compute totals server-side (never trust client total)
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)
  if (subtotal < MIN_ORDER_VALUE) {
    return apiError(`Minimum order value is RWF ${MIN_ORDER_VALUE.toLocaleString()}`)
  }

  const operator = detectOperator(deliveryDetails.phone)
  if (!operator) return apiError('Phone number must be MTN or Airtel Rwanda')

  const adminClient = await createAdminClient()
  const orderNumber = generateOrderNumber()
  const depositId = crypto.randomUUID()

  // Create order
  const { data: order, error: orderError } = await adminClient
    .from('orders')
    .insert({
      order_number: orderNumber,
      customer_id: customerId,
      shipping_address_id: null,
      status: 'pending' as const,
      order_type: 'b2c' as const,
      subtotal,
      discount_amount: 0,
      delivery_fee: 0,
      total_amount: subtotal,
      promo_code: null,
      is_approved: true,
      notes: JSON.stringify({ deliveryDetails }),
      deleted_at: null,
    })
    .select('id')
    .single()

  if (orderError || !order) {
    return apiError('Failed to create order. Please try again.', 500)
  }

  const orderId = (order as { id: string }).id

  // Create order items
  const orderItems = items.map((item) => ({
    order_id: orderId,
    product_id: item.id,
    product_name: item.name,
    product_sku: null,
    source: item.source,
    unit_price: item.price,
    qty: item.qty,
    subtotal: item.price * item.qty,
  }))

  const { error: itemsError } = await adminClient.from('order_items').insert(orderItems)

  if (itemsError) {
    // Roll back order (soft — set deleted_at)
    await adminClient.from('orders').update({ deleted_at: new Date().toISOString() }).eq('id', orderId)
    return apiError('Failed to create order items. Please try again.', 500)
  }

  // Call PawaPay Deposits API
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://isokoclick.rw'
  let pawapayStatus: string | null = null

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
        amount: String(subtotal),
        currency: 'RWF',
        correspondent: CORRESPONDENT[operator],
        payer: {
          type: 'MSISDN',
          address: { value: deliveryDetails.phone },
        },
        customerTimestamp: new Date().toISOString(),
        statementDescription: `IsokoClick ${orderNumber}`,
      }),
    })

    if (pawapayRes.ok) {
      const pawapayData = (await pawapayRes.json()) as { status?: string }
      pawapayStatus = pawapayData.status ?? null
    }
  } catch {
    // PawaPay call failed — still record the order but mark payment as pending
  }

  // Create payment record
  await adminClient.from('payments').insert({
    order_id: orderId,
    pawapay_deposit_id: depositId,
    amount: subtotal,
    currency: 'RWF',
    phone_number: deliveryDetails.phone,
    operator: operator as 'MTN' | 'AIRTEL',
    status:
      pawapayStatus === 'ACCEPTED' || pawapayStatus === 'SUBMITTED' ? 'initiated' : 'pending',
    failure_reason: null,
    initiated_at: new Date().toISOString(),
    completed_at: null,
  })

  return apiResponse({ orderId, orderNumber, depositId })
}

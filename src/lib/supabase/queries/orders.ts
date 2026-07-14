import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { Json, OrderRow, OrderItemRow, PaymentRow, PaymentStatus, OrderStatus } from '@/types/database'

export type OrderWithDetails = OrderRow & {
  order_items: OrderItemRow[]
  payments: PaymentRow[]
}

export async function getOrderById(id: string, userId: string): Promise<OrderWithDetails | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*), payments(*)')
    .eq('id', id)
    .eq('customer_id', userId)
    .is('deleted_at', null)
    .single()

  if (error) return null
  return data as unknown as OrderWithDetails
}

export async function getPaymentStatusByOrderId(
  orderId: string,
  userId: string
): Promise<PaymentStatus | null> {
  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select('id')
    .eq('id', orderId)
    .eq('customer_id', userId)
    .single()

  if (!order) return null

  const { data: payment } = await supabase
    .from('payments')
    .select('status')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return (payment?.status as PaymentStatus) ?? null
}

export type PaymentForWebhook = Pick<PaymentRow, 'id' | 'order_id' | 'amount' | 'currency' | 'status'>

export async function getPaymentByDepositId(depositId: string): Promise<PaymentForWebhook | null> {
  const adminClient = await createAdminClient()
  const { data, error } = await adminClient
    .from('payments')
    .select('id, order_id, amount, currency, status')
    .eq('pawapay_deposit_id', depositId)
    .single()

  if (error) return null
  return data as PaymentForWebhook | null
}

export async function recordPaymentEvent(
  paymentId: string,
  eventType: string,
  rawPayload: Json
): Promise<void> {
  const adminClient = await createAdminClient()
  await adminClient.from('payment_events').insert({
    payment_id: paymentId,
    event_type: eventType,
    raw_payload: rawPayload,
  })
}

export async function updatePaymentAndOrderStatus(
  depositId: string,
  paymentStatus: PaymentStatus,
  orderStatus: OrderStatus,
  failureReason: string | null = null
): Promise<boolean> {
  const adminClient = await createAdminClient()

  const { data: payment, error: paymentError } = await adminClient
    .from('payments')
    .update({
      status: paymentStatus,
      completed_at: paymentStatus === 'completed' ? new Date().toISOString() : undefined,
      failure_reason: paymentStatus === 'failed' ? failureReason : null,
    })
    .eq('pawapay_deposit_id', depositId)
    .select('order_id')
    .single()

  if (paymentError || !payment) return false

  const { error: orderError } = await adminClient
    .from('orders')
    .update({ status: orderStatus })
    .eq('id', (payment as { order_id: string }).order_id)

  return !orderError
}

export type OrderSummary = Pick<
  OrderRow,
  'id' | 'order_number' | 'status' | 'total_amount' | 'created_at'
> & {
  payments: Pick<PaymentRow, 'status'>[]
}

export async function getOrdersByCustomerId(userId: string): Promise<OrderSummary[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, status, total_amount, created_at, payments(status)')
    .eq('customer_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) return []
  return data as unknown as OrderSummary[]
}

export async function getUserProfileId(authId: string): Promise<string | null> {
  const adminClient = await createAdminClient()
  const { data } = await adminClient
    .from('users')
    .select('id')
    .eq('auth_id', authId)
    .single()
  return (data as { id: string } | null)?.id ?? null
}

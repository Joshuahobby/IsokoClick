'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { getUserProfileId } from '@/lib/supabase/queries/orders'
import type { CartItem } from '@/hooks/use-cart'
import type { OrderInsert, OrderItemInsert, PaymentInsert } from '@/types/database'

export async function createOrder(formData: FormData) {
  const supabase = await createClient()
  const admin = await createAdminClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to place an order.' }
  }

  // orders.customer_id references public.users.id, not the auth user id
  const customerId = await getUserProfileId(user.id)
  if (!customerId) {
    return { error: 'User profile not found. Please complete account setup.' }
  }

  try {
    const cartDataRaw = formData.get('cart_data') as string
    if (!cartDataRaw) return { error: 'Cart is empty.' }

    const cartItems: CartItem[] = JSON.parse(cartDataRaw)
    if (cartItems.length === 0) return { error: 'Cart is empty.' }

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0)
    const deliveryFee = 2000 // Fixed for demo
    const totalAmount = subtotal + deliveryFee

    // 1. Create Order
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`
    const newOrder: OrderInsert = {
      order_number: orderNumber,
      customer_id: customerId,
      shipping_address_id: null,
      status: 'pending',
      order_type: 'b2c',
      subtotal,
      discount_amount: 0,
      delivery_fee: deliveryFee,
      total_amount: totalAmount,
      promo_code: null,
      notes: `Delivery to: ${formData.get('address')}, ${formData.get('district')} | Phone: ${formData.get('phone')}`,
      is_approved: false,
      deleted_at: null,
    }

    const { data: orderResult, error: orderError } = await admin
      .from('orders')
      .insert(newOrder)
      .select('id')
      .single()

    if (orderError) throw new Error(`Order creation failed: ${orderError.message}`)

    const orderId = orderResult.id

    // 2. Create Order Items
    const orderItemsToInsert: OrderItemInsert[] = cartItems.map((item) => ({
      order_id: orderId,
      product_id: item.id,
      variant_id: null,
      source: item.source,
      partner_id: null,
      quantity: item.qty,
      unit_price: item.price,
      total_price: item.price * item.qty,
      commission_rate: null,
    }))

    const { error: itemsError } = await admin.from('order_items').insert(orderItemsToInsert)
    if (itemsError) throw new Error(`Failed to save items: ${itemsError.message}`)

    // 3. Create initial payment record
    const paymentMethod = formData.get('payment_method') as string
    const paymentStatus = paymentMethod === 'momo' ? 'initiated' : 'pending'

    const newPayment: PaymentInsert = {
      order_id: orderId,
      pawapay_deposit_id: null,
      amount: totalAmount,
      currency: 'RWF',
      phone_number: formData.get('phone') as string,
      operator: null, // Would be determined by pawapay usually
      status: paymentStatus,
      failure_reason: null,
      initiated_at: paymentMethod === 'momo' ? new Date().toISOString() : null,
      completed_at: null,
    }

    const { error: paymentError } = await admin.from('payments').insert(newPayment)
    if (paymentError) throw new Error(`Payment init failed: ${paymentError.message}`)

    return { success: true, orderId }
  } catch (error) {
    console.error('Checkout error:', error)
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred during checkout.'
    return { error: message }
  }
}

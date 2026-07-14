import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { CheckCircle2, Package, MapPin, CreditCard } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatRwf } from '@/lib/utils/currency'
import type { OrderRow, OrderItemRow, PaymentRow, ProductRow } from '@/types/database'

export const metadata = { title: 'Order Confirmation | IsokoClick' }

type Props = { params: Promise<{ id: string }> }

type OrderDetail = OrderRow & {
  order_items: (OrderItemRow & { product: Pick<ProductRow, 'name_en'> | null })[]
  payments: PaymentRow[]
}

export default async function OrderSuccessPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirectTo=/orders/${id}`)

  // Resolve the public.users profile id — RLS only exposes the own row
  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()
  if (!profile) notFound()

  // Ownership is enforced in the query itself (and again by RLS): the
  // order must belong to the signed-in customer or it does not exist.
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(*, product:product_id(name_en)),
      payments(*)
    `)
    .eq('id', id)
    .eq('customer_id', (profile as { id: string }).id)
    .is('deleted_at', null)
    .single()

  if (error || !order) {
    notFound()
  }

  // The hand-written Database type carries no relationship metadata, so
  // supabase-js cannot infer the embedded order_items/payments joins.
  const o = order as unknown as OrderDetail

  const payment = o.payments?.[0]

  // Delivery details are stored as JSON in notes by /api/orders
  type DeliveryDetails = { fullName?: string; phone?: string; district?: string; address?: string }
  let delivery: DeliveryDetails = {}
  if (o.notes) {
    try {
      delivery = (JSON.parse(o.notes) as { deliveryDetails?: DeliveryDetails }).deliveryDetails ?? {}
    } catch {
      // Legacy orders stored free-text notes — shown as-is below
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-6">
          <CheckCircle2 size={32} className="text-green-600" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">Order Placed Successfully!</h1>
        <p className="mt-2 text-neutral-500">
          Thank you for shopping with IsokoClick. Your order number is <span className="font-bold text-neutral-900">{o.order_number}</span>.
        </p>

        {payment?.status === 'initiated' && (
          <div className="mt-6 rounded-lg bg-blue-50 p-4 border border-blue-100">
            <p className="text-sm text-blue-800">
              <strong>Action Required:</strong> A Mobile Money prompt has been sent to <strong>{payment.phone_number}</strong>. Please approve the prompt on your phone to complete the payment.
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Order Details */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
            <Package size={20} className="text-neutral-400" /> Items Summary
          </h2>
          <div className="flow-root">
            <ul className="-my-4 divide-y divide-neutral-100">
              {o.order_items.map((item) => (
                <li key={item.id} className="flex py-4 justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{item.product?.name_en ?? 'Product'}</p>
                    <p className="text-sm text-neutral-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium text-neutral-900">{formatRwf(item.total_price)}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-neutral-200 pt-4 mt-4 space-y-2 text-sm text-neutral-500">
            <div className="flex justify-between">
              <p>Subtotal</p>
              <p>{formatRwf(o.subtotal)}</p>
            </div>
            <div className="flex justify-between">
              <p>Delivery Fee</p>
              <p>{formatRwf(o.delivery_fee)}</p>
            </div>
            <div className="flex justify-between border-t border-neutral-100 pt-2 text-base font-bold text-neutral-900">
              <p>Total</p>
              <p>{formatRwf(o.total_amount)}</p>
            </div>
          </div>
        </div>

        {/* Delivery & Payment Info */}
        <div className="space-y-6">
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-neutral-400" /> Delivery Details
            </h2>
            <div className="text-sm text-neutral-600 space-y-1">
              {Object.keys(delivery).length > 0 ? (
                <>
                  {delivery.fullName && <p className="font-medium text-neutral-900">{delivery.fullName}</p>}
                  {delivery.address && <p>{delivery.address}</p>}
                  {delivery.district && <p>{delivery.district}</p>}
                  {delivery.phone && <p>{delivery.phone}</p>}
                </>
              ) : (
                <p className="whitespace-pre-wrap">{o.notes}</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <CreditCard size={20} className="text-neutral-400" /> Payment Info
            </h2>
            {payment ? (
              <div className="text-sm text-neutral-600 space-y-1">
                <p>Status: <span className="font-semibold uppercase text-neutral-900">{payment.status}</span></p>
                <p>Phone: {payment.phone_number}</p>
              </div>
            ) : (
              <p className="text-sm text-neutral-500">No payment details found.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link href="/" className="inline-flex items-center justify-center rounded-lg bg-neutral-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-neutral-800">
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}

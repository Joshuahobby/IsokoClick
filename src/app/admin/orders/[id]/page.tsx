import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { ChevronRight, Package, User, Truck, CreditCard } from 'lucide-react'
import { getAdminOrderById, updateOrderStatus } from '@/lib/supabase/queries/admin'
import { hasRole } from '@/lib/supabase/require-role'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatRwf } from '@/lib/utils/currency'
import type { OrderStatus, PaymentStatus } from '@/types/database'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Order Detail — Admin' }

const ORDER_STATUS_BADGE: Record<OrderStatus, { label: string; className: string }> = {
  pending:             { label: 'Pending',        className: 'bg-neutral-800 text-neutral-300' },
  confirmed:           { label: 'Confirmed',      className: 'bg-blue-500/20 text-blue-400' },
  processing:          { label: 'Processing',     className: 'bg-amber-500/20 text-amber-400' },
  partially_fulfilled: { label: 'Part Fulfilled', className: 'bg-amber-500/20 text-amber-400' },
  fulfilled:           { label: 'Fulfilled',      className: 'bg-green-500/20 text-green-400' },
  shipped:             { label: 'Shipped',        className: 'bg-blue-500/20 text-blue-400' },
  delivered:           { label: 'Delivered',      className: 'bg-green-500/20 text-green-400' },
  cancelled:           { label: 'Cancelled',      className: 'bg-red-500/20 text-red-400' },
  refunded:            { label: 'Refunded',       className: 'bg-neutral-700 text-neutral-400' },
}

const PAYMENT_STATUS_BADGE: Record<PaymentStatus, { label: string; className: string }> = {
  pending:   { label: 'Unpaid',   className: 'bg-neutral-800 text-neutral-400' },
  initiated: { label: 'Pending',  className: 'bg-amber-500/20 text-amber-400' },
  completed: { label: 'Paid',     className: 'bg-green-500/20 text-green-400' },
  failed:    { label: 'Failed',   className: 'bg-red-500/20 text-red-400' },
  refunded:  { label: 'Refunded', className: 'bg-neutral-700 text-neutral-400' },
}

const NEXT_STATUSES: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending:             ['confirmed', 'cancelled'],
  confirmed:           ['processing', 'cancelled'],
  processing:          ['partially_fulfilled', 'fulfilled', 'cancelled'],
  partially_fulfilled: ['fulfilled', 'cancelled'],
  fulfilled:           ['shipped'],
  shipped:             ['delivered'],
  delivered:           ['refunded'],
}

type Props = { params: Promise<{ id: string }> }

async function changeStatus(orderId: string, status: OrderStatus) {
  'use server'
  if (!(await hasRole('admin'))) return
  await updateOrderStatus(orderId, status)
  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath('/admin/orders')
  revalidatePath('/admin/dashboard')
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params
  const order = await getAdminOrderById(id)
  if (!order) notFound()

  const customer = order.customer as { full_name: string; email: string; phone: string | null } | null
  const payment = order.payments[0] ?? null
  const paymentStatus = (payment?.status ?? 'pending') as PaymentStatus
  const statusCfg = ORDER_STATUS_BADGE[order.status]
  const nextStatuses = NEXT_STATUSES[order.status] ?? []

  type DeliveryDetails = { fullName?: string; phone?: string; district?: string; address?: string; notes?: string }
  let delivery: DeliveryDetails = {}
  if (order.notes) {
    try {
      const parsed = JSON.parse(order.notes) as { deliveryDetails?: DeliveryDetails }
      delivery = parsed.deliveryDetails ?? {}
    } catch {}
  }

  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-neutral-500">
        <Link href="/admin/orders" className="hover:text-white">Orders</Link>
        <ChevronRight size={14} />
        <span className="text-neutral-300">{order.order_number}</span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{order.order_number}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Placed{' '}
            {new Date(order.created_at).toLocaleDateString('en-RW', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={`border-0 ${statusCfg.className}`}>{statusCfg.label}</Badge>
          <Badge className={`border-0 ${PAYMENT_STATUS_BADGE[paymentStatus].className}`}>
            {PAYMENT_STATUS_BADGE[paymentStatus].label}
          </Badge>
        </div>
      </div>

      {/* Status actions */}
      {nextStatuses.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <span className="flex items-center text-sm text-neutral-500">Update status:</span>
          {nextStatuses.map((s) => {
            const cfg = ORDER_STATUS_BADGE[s]
            const action = changeStatus.bind(null, order.id, s)
            return (
              <form key={s} action={action}>
                <button
                  type="submit"
                  className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 transition-colors hover:border-brand-primary hover:bg-brand-primary/10 hover:text-white"
                >
                  {cfg.label}
                </button>
              </form>
            )
          })}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Customer */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <User size={14} className="text-brand-primary" /> Customer
          </h2>
          <div className="space-y-1 text-sm">
            <p className="font-medium text-white">{customer?.full_name ?? '—'}</p>
            <p className="text-neutral-400">{customer?.email ?? '—'}</p>
            {customer?.phone && <p className="text-neutral-400">{customer.phone}</p>}
          </div>
        </div>

        {/* Delivery */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <Truck size={14} className="text-brand-primary" /> Delivery
          </h2>
          {Object.keys(delivery).length > 0 ? (
            <div className="space-y-1 text-sm">
              {delivery.fullName && <p className="font-medium text-white">{delivery.fullName}</p>}
              {delivery.address && <p className="text-neutral-400">{delivery.address}</p>}
              {delivery.district && <p className="text-neutral-400">{delivery.district}</p>}
              {delivery.phone && <p className="text-neutral-400">{delivery.phone}</p>}
              {delivery.notes && <p className="text-neutral-500">{delivery.notes}</p>}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No delivery details recorded.</p>
          )}
        </div>

        {/* Payment */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 sm:col-span-2">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <CreditCard size={14} className="text-brand-primary" /> Payment
          </h2>
          {payment ? (
            <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-neutral-500">Phone</dt>
                <dd className="text-white">{payment.phone_number}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Operator</dt>
                <dd className="text-white">{payment.operator ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Amount</dt>
                <dd className="text-white">{formatRwf(payment.amount)}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Deposit ID</dt>
                <dd className="truncate font-mono text-xs text-neutral-400">
                  {payment.pawapay_deposit_id ?? '—'}
                </dd>
              </div>
              {payment.initiated_at && (
                <div>
                  <dt className="text-neutral-500">Initiated</dt>
                  <dd className="text-white">
                    {new Date(payment.initiated_at).toLocaleString('en-RW')}
                  </dd>
                </div>
              )}
              {payment.completed_at && (
                <div>
                  <dt className="text-neutral-500">Completed</dt>
                  <dd className="text-white">
                    {new Date(payment.completed_at).toLocaleString('en-RW')}
                  </dd>
                </div>
              )}
              {payment.failure_reason && (
                <div className="sm:col-span-4">
                  <dt className="text-neutral-500">Failure reason</dt>
                  <dd className="text-red-400">{payment.failure_reason}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="text-sm text-neutral-500">No payment record.</p>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
          <Package size={14} className="text-brand-primary" /> Items
        </h2>
        <div className="space-y-3">
          {order.order_items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white">{item.product?.name_en ?? 'Product'}</p>
                <p className="text-xs text-neutral-500">
                  {item.source === 'dropship' ? 'Dropship' : 'Internal'} ·{' '}
                  {formatRwf(item.unit_price)} × {item.quantity}
                  {item.product?.sku ? ` · SKU: ${item.product.sku}` : ''}
                </p>
              </div>
              <span className="shrink-0 font-semibold text-white">{formatRwf(item.total_price)}</span>
            </div>
          ))}
        </div>

        <Separator className="my-4 bg-neutral-800" />

        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-400">Subtotal</span>
            <span className="text-white">{formatRwf(order.subtotal)}</span>
          </div>
          {order.discount_amount > 0 && (
            <div className="flex justify-between">
              <span className="text-neutral-400">Discount</span>
              <span className="text-green-400">-{formatRwf(order.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-neutral-400">Delivery</span>
            <span className="text-neutral-500 italic">
              {order.delivery_fee > 0 ? formatRwf(order.delivery_fee) : 'TBD'}
            </span>
          </div>
          <Separator className="my-2 bg-neutral-800" />
          <div className="flex justify-between font-semibold">
            <span className="text-white">Total</span>
            <span className="text-white">{formatRwf(order.total_amount)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

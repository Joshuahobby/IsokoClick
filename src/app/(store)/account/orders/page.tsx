import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ShoppingBag, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getOrdersByCustomerId, getUserProfileId } from '@/lib/supabase/queries/orders'
import { Badge } from '@/components/ui/badge'
import { formatRwf } from '@/lib/utils/currency'
import type { OrderStatus, PaymentStatus } from '@/types/database'

export const metadata: Metadata = { title: 'My Orders' }

const ORDER_STATUS_BADGE: Record<OrderStatus, { label: string; className: string }> = {
  pending:             { label: 'Pending',            className: 'bg-neutral-800 text-neutral-300' },
  confirmed:           { label: 'Confirmed',          className: 'bg-blue-500/20 text-blue-400' },
  processing:          { label: 'Processing',         className: 'bg-amber-500/20 text-amber-400' },
  partially_fulfilled: { label: 'Part Fulfilled',     className: 'bg-amber-500/20 text-amber-400' },
  fulfilled:           { label: 'Fulfilled',          className: 'bg-green-500/20 text-green-400' },
  shipped:             { label: 'Shipped',            className: 'bg-blue-500/20 text-blue-400' },
  delivered:           { label: 'Delivered',          className: 'bg-green-500/20 text-green-400' },
  cancelled:           { label: 'Cancelled',          className: 'bg-red-500/20 text-red-400' },
  refunded:            { label: 'Refunded',           className: 'bg-neutral-700 text-neutral-400' },
}

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  pending:   'Awaiting payment',
  initiated: 'Approval pending',
  completed: 'Paid',
  failed:    'Payment failed',
  refunded:  'Refunded',
}

export default async function AccountOrdersPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login?redirectTo=/account/orders')

  const customerId = await getUserProfileId(authUser.id)
  if (!customerId) redirect('/auth/login')

  const orders = await getOrdersByCustomerId(customerId)

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-white">My Orders</h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 py-16 text-center">
          <ShoppingBag size={36} className="mb-4 text-neutral-600" />
          <p className="text-neutral-400">You haven&apos;t placed any orders yet.</p>
          <Link
            href="/shop"
            className="mt-4 text-sm font-medium text-brand-primary hover:underline"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const paymentStatus = (order.payments[0]?.status ?? 'pending') as PaymentStatus
            const statusConfig = ORDER_STATUS_BADGE[order.status]

            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-4 transition-colors hover:border-neutral-700 hover:bg-neutral-800/60"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{order.order_number}</span>
                    <Badge
                      className={`border-0 text-xs ${statusConfig.className}`}
                    >
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-neutral-500">
                    <span>
                      {new Date(order.created_at).toLocaleDateString('en-RW', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span>·</span>
                    <span>{PAYMENT_LABEL[paymentStatus]}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-semibold text-white">{formatRwf(order.total_amount)}</span>
                  <ChevronRight size={16} className="text-neutral-600" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

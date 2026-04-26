import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getAdminOrders } from '@/lib/supabase/queries/admin'
import { Badge } from '@/components/ui/badge'
import { formatRwf } from '@/lib/utils/currency'
import type { OrderStatus, PaymentStatus } from '@/types/database'

export const metadata: Metadata = { title: 'Orders — Admin' }

const STATUS_OPTS: { value: OrderStatus | ''; label: string }[] = [
  { value: '',             label: 'All statuses' },
  { value: 'pending',      label: 'Pending' },
  { value: 'confirmed',    label: 'Confirmed' },
  { value: 'processing',   label: 'Processing' },
  { value: 'fulfilled',    label: 'Fulfilled' },
  { value: 'shipped',      label: 'Shipped' },
  { value: 'delivered',    label: 'Delivered' },
  { value: 'cancelled',    label: 'Cancelled' },
]

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

const PAYMENT_BADGE: Record<PaymentStatus, { label: string; className: string }> = {
  pending:   { label: 'Unpaid',   className: 'bg-neutral-800 text-neutral-400' },
  initiated: { label: 'Pending',  className: 'bg-amber-500/20 text-amber-400' },
  completed: { label: 'Paid',     className: 'bg-green-500/20 text-green-400' },
  failed:    { label: 'Failed',   className: 'bg-red-500/20 text-red-400' },
  refunded:  { label: 'Refunded', className: 'bg-neutral-700 text-neutral-400' },
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const status = (sp.status as OrderStatus | undefined) ?? undefined
  const search = typeof sp.search === 'string' ? sp.search : undefined
  const page = Number(sp.page ?? 1)

  const { orders, total } = await getAdminOrders({ status, search, page, pageSize: 25 })
  const totalPages = Math.ceil(total / 25)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Orders</h1>
        <span className="text-sm text-neutral-500">{total.toLocaleString()} total</span>
      </div>

      {/* Filters */}
      <form className="mb-6 flex flex-wrap gap-3">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search order number…"
          className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
        <select
          name="status"
          defaultValue={status ?? ''}
          className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
        >
          {STATUS_OPTS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
        >
          Filter
        </button>
      </form>

      {/* Table */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900">
        {orders.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-neutral-500">No orders found.</div>
        ) : (
          <>
            <div className="divide-y divide-neutral-800">
              {/* Header */}
              <div className="grid grid-cols-[1fr_1fr_auto_auto_auto_auto] gap-4 px-6 py-3 text-xs font-medium uppercase tracking-wide text-neutral-500">
                <span>Order</span>
                <span>Customer</span>
                <span>Status</span>
                <span>Payment</span>
                <span>Total</span>
                <span></span>
              </div>

              {orders.map((order) => {
                const paymentStatus = (order.payments[0]?.status ?? 'pending') as PaymentStatus
                const statusCfg = ORDER_STATUS_BADGE[order.status]
                const paymentCfg = PAYMENT_BADGE[paymentStatus]
                const customer = order.customer as { full_name: string; email: string } | null

                return (
                  <div
                    key={order.id}
                    className="grid grid-cols-[1fr_1fr_auto_auto_auto_auto] items-center gap-4 px-6 py-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{order.order_number}</p>
                      <p className="text-xs text-neutral-500">
                        {new Date(order.created_at).toLocaleDateString('en-RW', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-white">{customer?.full_name ?? '—'}</p>
                      <p className="truncate text-xs text-neutral-500">{customer?.email ?? ''}</p>
                    </div>
                    <Badge className={`border-0 text-xs ${statusCfg.className}`}>
                      {statusCfg.label}
                    </Badge>
                    <Badge className={`border-0 text-xs ${paymentCfg.className}`}>
                      {paymentCfg.label}
                    </Badge>
                    <span className="text-sm font-semibold text-white">
                      {formatRwf(order.total_amount)}
                    </span>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="flex items-center text-neutral-500 hover:text-white"
                    >
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-neutral-800 px-6 py-4">
                <span className="text-xs text-neutral-500">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link
                      href={`?page=${page - 1}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`}
                      className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-white hover:bg-neutral-800"
                    >
                      Previous
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={`?page=${page + 1}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`}
                      className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-white hover:bg-neutral-800"
                    >
                      Next
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

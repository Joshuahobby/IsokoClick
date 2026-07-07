import type { Metadata } from 'next'
import Link from 'next/link'
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  Package,
  ChevronRight,
} from 'lucide-react'
import { getDashboardStats, getRecentOrders } from '@/lib/supabase/queries/admin'
import { Badge } from '@/components/ui/badge'
import { formatRwf, formatRwfCompact } from '@/lib/utils/currency'
import type { OrderStatus, PaymentStatus } from '@/types/database'

export const metadata: Metadata = { title: 'Admin Dashboard' }

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

export default async function AdminDashboardPage() {
  const [stats, recentOrders] = await Promise.all([getDashboardStats(), getRecentOrders(8)])

  const statCards = [
    {
      label: 'Revenue this month',
      value: formatRwfCompact(stats.revenueThisMonth),
      sub: `${formatRwfCompact(stats.revenueTotal)} all time`,
      icon: TrendingUp,
      color: 'text-green-400',
    },
    {
      label: 'Orders today',
      value: stats.ordersToday.toString(),
      sub: `${stats.ordersTotal} total`,
      icon: ShoppingBag,
      color: 'text-blue-400',
    },
    {
      label: 'Pending orders',
      value: stats.ordersPending.toString(),
      sub: 'Need attention',
      icon: Clock,
      color: 'text-amber-400',
    },
    {
      label: 'Active products',
      value: stats.productsActive.toString(),
      sub: `${stats.partnersApproved} partner(s)`,
      icon: Package,
      color: 'text-brand-primary',
    },
  ]

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <span className="text-sm text-neutral-500">
          {new Date().toLocaleDateString('en-RW', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </span>
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, sub, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-xl border border-neutral-800 bg-neutral-900 p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-neutral-500">{label}</span>
              <Icon size={16} className={color} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="mt-1 text-xs text-neutral-600">{sub}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900">
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
          <h2 className="text-sm font-semibold text-white">Recent Orders</h2>
          <Link
            href="/admin/orders"
            className="flex items-center gap-1 text-xs text-brand-primary hover:underline"
          >
            View all <ChevronRight size={12} />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-neutral-500">No orders yet.</div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {recentOrders.map((order) => {
              const paymentStatus = (order.payments[0]?.status ?? 'pending') as PaymentStatus
              const statusCfg = ORDER_STATUS_BADGE[order.status]
              const paymentCfg = PAYMENT_BADGE[paymentStatus]
              const customer = order.customer as { full_name: string; email: string } | null

              return (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-neutral-800/60"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white">{order.order_number}</p>
                    <p className="text-xs text-neutral-500">
                      {customer?.full_name ?? 'Unknown'} · {customer?.email ?? ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`border-0 text-xs ${statusCfg.className}`}>
                      {statusCfg.label}
                    </Badge>
                    <Badge className={`border-0 text-xs ${paymentCfg.className}`}>
                      {paymentCfg.label}
                    </Badge>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-white">
                    {formatRwf(order.total_amount)}
                  </span>
                  <span className="text-xs text-neutral-600">
                    {new Date(order.created_at).toLocaleDateString('en-RW', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

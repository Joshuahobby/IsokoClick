import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
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

export async function generateMetadata() {
  const t = await getTranslations('admin.dashboard')
  return { title: t('metaTitle') }
}

const ORDER_STATUS_CLASS: Record<OrderStatus, string> = {
  pending:             'bg-neutral-800 text-neutral-300',
  confirmed:           'bg-blue-500/20 text-blue-400',
  processing:          'bg-amber-500/20 text-amber-400',
  partially_fulfilled: 'bg-amber-500/20 text-amber-400',
  fulfilled:           'bg-green-500/20 text-green-400',
  shipped:             'bg-blue-500/20 text-blue-400',
  delivered:           'bg-green-500/20 text-green-400',
  cancelled:           'bg-red-500/20 text-red-400',
  refunded:            'bg-neutral-700 text-neutral-400',
}

const PAYMENT_STATUS_CLASS: Record<PaymentStatus, string> = {
  pending:   'bg-neutral-800 text-neutral-400',
  initiated: 'bg-amber-500/20 text-amber-400',
  completed: 'bg-green-500/20 text-green-400',
  failed:    'bg-red-500/20 text-red-400',
  refunded:  'bg-neutral-700 text-neutral-400',
}

export default async function AdminDashboardPage() {
  const [stats, recentOrders, t, tOrder, tPayment] = await Promise.all([
    getDashboardStats(),
    getRecentOrders(8),
    getTranslations('admin.dashboard'),
    getTranslations('statuses.order'),
    getTranslations('statuses.payment'),
  ])

  const statCards = [
    {
      label: t('revenueThisMonth'),
      value: formatRwfCompact(stats.revenueThisMonth),
      sub: t('allTime', { amount: formatRwfCompact(stats.revenueTotal) }),
      icon: TrendingUp,
      color: 'text-green-400',
    },
    {
      label: t('ordersToday'),
      value: stats.ordersToday.toString(),
      sub: t('ordersTotal', { count: stats.ordersTotal }),
      icon: ShoppingBag,
      color: 'text-blue-400',
    },
    {
      label: t('pendingOrders'),
      value: stats.ordersPending.toString(),
      sub: t('needAttention'),
      icon: Clock,
      color: 'text-amber-400',
    },
    {
      label: t('activeProducts'),
      value: stats.productsActive.toString(),
      sub: t('partnersCount', { count: stats.partnersApproved }),
      icon: Package,
      color: 'text-brand-primary',
    },
  ]

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
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
          <h2 className="text-sm font-semibold text-white">{t('recentOrders')}</h2>
          <Link
            href="/admin/orders"
            className="flex items-center gap-1 text-xs text-brand-primary hover:underline"
          >
            {t('viewAll')} <ChevronRight size={12} />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-neutral-500">{t('noOrders')}</div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {recentOrders.map((order) => {
              const paymentStatus = (order.payments[0]?.status ?? 'pending') as PaymentStatus
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
                      {customer?.full_name ?? t('unknownCustomer')} · {customer?.email ?? ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`border-0 text-xs ${ORDER_STATUS_CLASS[order.status]}`}>
                      {tOrder(order.status)}
                    </Badge>
                    <Badge className={`border-0 text-xs ${PAYMENT_STATUS_CLASS[paymentStatus]}`}>
                      {tPayment(paymentStatus)}
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

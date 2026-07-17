import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getOrdersByCustomerId, getUserProfileId } from '@/lib/supabase/queries/orders'
import { Badge } from '@/components/ui/badge'
import { formatRwf } from '@/lib/utils/currency'
import { formatShortDate } from '@/lib/utils/date'
import type { OrderStatus, PaymentStatus } from '@/types/database'

export async function generateMetadata() {
  const t = await getTranslations('accountOrders')
  return { title: t('metaTitle') }
}

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-neutral-800 text-neutral-300',
  confirmed: 'bg-blue-500/10 text-blue-400',
  processing: 'bg-blue-500/10 text-blue-400',
  partially_fulfilled: 'bg-amber-500/10 text-amber-400',
  fulfilled: 'bg-green-500/10 text-green-400',
  shipped: 'bg-green-500/10 text-green-400',
  delivered: 'bg-green-500/10 text-green-400',
  cancelled: 'bg-red-500/10 text-red-400',
  refunded: 'bg-red-500/10 text-red-400',
}

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  pending: 'bg-neutral-800 text-neutral-300',
  initiated: 'bg-amber-500/10 text-amber-400',
  completed: 'bg-green-500/10 text-green-400',
  failed: 'bg-red-500/10 text-red-400',
  refunded: 'bg-red-500/10 text-red-400',
}

export default async function AccountOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/account/orders')

  const [t, tStatus] = await Promise.all([
    getTranslations('accountOrders'),
    getTranslations('statuses'),
  ])

  // orders.customer_id references public.users.id, not the auth user id.
  const profileId = await getUserProfileId(user.id)
  const orders = profileId ? await getOrdersByCustomerId(profileId) : []

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">{t('title')}</h1>
        <p className="mt-2 text-neutral-400">{t('subtitle')}</p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-12 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-800">
            <Package size={32} className="text-neutral-500" />
          </div>
          <p className="text-neutral-400">{t('empty')}</p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-3 text-sm font-bold text-neutral-950 transition-colors hover:bg-amber-600"
          >
            {t('emptyCta')}
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => {
            const payment = order.payments?.[0]

            return (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-6 transition-colors hover:border-neutral-700"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-white">{order.order_number}</p>
                    <p className="mt-1 text-sm text-neutral-400">
                      {t('placed', { date: formatShortDate(order.created_at) })}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge className={`border-0 text-xs ${ORDER_STATUS_STYLES[order.status]}`}>
                        {tStatus(`order.${order.status}`)}
                      </Badge>
                      {payment && (
                        <Badge className={`border-0 text-xs ${PAYMENT_STATUS_STYLES[payment.status]}`}>
                          {tStatus(`payment.${payment.status}`)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="price text-white">{formatRwf(order.total_amount)}</p>
                    <p className="mt-1 text-sm text-brand-primary">{t('viewDetails')}</p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

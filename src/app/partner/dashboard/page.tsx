import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Package, TrendingUp, DollarSign, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getPartnerByUserId, getPartnerStats } from '@/lib/supabase/queries/partners'
import { formatRwf } from '@/lib/utils/currency'

export async function generateMetadata() {
  const t = await getTranslations('partner.dashboard')
  return { title: t('metaTitle') }
}

export default async function PartnerDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const [partner, t] = await Promise.all([
    getPartnerByUserId(user.id),
    getTranslations('partner.dashboard'),
  ])

  if (!partner) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-400">
        {t('notFound')}
      </div>
    )
  }

  if (partner.status === 'pending') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="mb-6 flex justify-center text-amber-500">
          <Clock size={48} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">{t('underReviewTitle')}</h1>
        <p className="text-neutral-400 mb-8">
          {t.rich('underReviewBody', {
            businessName: partner.business_name,
            strong: (chunks) => <span className="text-white font-medium">{chunks}</span>,
          })}
        </p>
        <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-6 text-left">
          <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider mb-4">{t('whatNext')}</h2>
          <ul className="space-y-4 text-sm text-neutral-400">
            <li className="flex gap-3">
              <span className="flex-shrink-0 h-5 w-5 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center text-xs">1</span>
              <span>{t('step1')}</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 h-5 w-5 rounded-full bg-neutral-800 text-neutral-500 flex items-center justify-center text-xs">2</span>
              <span>{t('step2')}</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 h-5 w-5 rounded-full bg-neutral-800 text-neutral-500 flex items-center justify-center text-xs">3</span>
              <span>{t('step3')}</span>
            </li>
          </ul>
        </div>
        <div className="mt-10">
          <Link href="/auth/signout" className="text-sm text-neutral-500 hover:text-white transition-colors">
            {t('signOut')}
          </Link>
        </div>
      </div>
    )
  }

  if (partner.status === 'rejected') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">{t('rejectedTitle')}</h1>
        <p className="text-neutral-400">{t('rejectedBody')}</p>
      </div>
    )
  }

  const stats = await getPartnerStats(partner.id)

  const statsCards = [
    { label: t('revenueAllTime'), value: formatRwf(stats.revenueTotal), icon: DollarSign, color: 'text-green-400' },
    { label: t('revenueThisMonth'), value: formatRwf(stats.revenueThisMonth), icon: TrendingUp, color: 'text-green-400' },
    { label: t('activeProducts'), value: stats.activeProducts, icon: Package, color: 'text-brand-primary' },
    { label: t('pendingItems'), value: stats.pendingItems, icon: Clock, color: 'text-amber-400' },
  ]

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">{t('welcome', { businessName: partner.business_name })}</h1>
        <p className="mt-1 text-sm text-neutral-400">{t('overview')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-neutral-500">{label}</span>
              <Icon size={16} className={color} />
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      {/* Could add recent orders or top selling products here eventually */}
      <div className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-center text-sm text-neutral-500">
        {t('moreSoon')}
      </div>
    </div>
  )
}

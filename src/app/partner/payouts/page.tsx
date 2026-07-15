import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Wallet, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getPartnerByUserId, getPartnerStats } from '@/lib/supabase/queries/partners'
import { formatRwf } from '@/lib/utils/currency'
import { PayoutForm } from './PayoutForm'

export async function generateMetadata() {
  const t = await getTranslations('partner.payouts')
  return { title: t('metaTitle') }
}

export default async function PartnerPayoutsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const partner = await getPartnerByUserId(user.id)
  if (!partner) redirect('/partner/dashboard')

  const [stats, t] = await Promise.all([
    getPartnerStats(partner.id),
    getTranslations('partner.payouts'),
  ])

  const commissionRate = partner.commission_rate ?? 0
  const estimatedEarnings = stats.revenueTotal * (1 - (commissionRate / 100))

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
        <p className="mt-1 text-sm text-neutral-400">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Earnings Summary */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Wallet className="text-green-400" size={20} />
            <h2 className="font-semibold text-white">{t('earningsSummary')}</h2>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-neutral-500">{t('totalRevenue')}</p>
              <p className="text-2xl font-bold text-white">{formatRwf(stats.revenueTotal)}</p>
            </div>
            <div className="border-t border-neutral-800 pt-4">
              <p className="text-sm text-neutral-500">{t('estimatedEarnings')}</p>
              <p className="text-2xl font-bold text-green-400">{formatRwf(estimatedEarnings)}</p>
              <p className="text-xs text-neutral-500 mt-1">
                {t('commissionNote', { rate: commissionRate })}
              </p>
            </div>
          </div>
        </div>

        {/* Payout Settings */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <div className="space-y-4">
            <div className="rounded-lg bg-neutral-800/50 p-4 flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-400 mt-0.5 shrink-0" />
              <div className="text-sm text-neutral-300">
                <p className="font-medium text-amber-400 mb-1">{t('howItWorksTitle')}</p>
                <p>{t('howItWorksBody')}</p>
              </div>
            </div>

            <PayoutForm currentPhone={partner.payout_phone} />
          </div>
        </div>
      </div>

      {/* Payout History Placeholder */}
      <div className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="mb-4 font-semibold text-white">{t('recentPayouts')}</h2>
        <div className="text-center text-sm text-neutral-500 py-8">
          {t('noPayouts')}
        </div>
      </div>
    </div>
  )
}

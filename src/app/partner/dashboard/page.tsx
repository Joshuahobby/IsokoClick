import { redirect } from 'next/navigation'
import { Package, TrendingUp, DollarSign, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getPartnerByUserId, getPartnerStats } from '@/lib/supabase/queries/partners'
import { formatRwf } from '@/lib/utils/currency'

export const metadata = { title: 'Dashboard — Partner Portal' }

export default async function PartnerDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const partner = await getPartnerByUserId(user.id)
  
  if (!partner) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-400">
        Partner profile not found or suspended. Please contact support.
      </div>
    )
  }

  const stats = await getPartnerStats(partner.id)

  const STATS_CARDS = [
    { label: 'Revenue (All Time)', value: formatRwf(stats.revenueTotal), icon: DollarSign, color: 'text-green-400' },
    { label: 'Revenue (This Month)', value: formatRwf(stats.revenueThisMonth), icon: TrendingUp, color: 'text-green-400' },
    { label: 'Active Products', value: stats.activeProducts, icon: Package, color: 'text-brand-primary' },
    { label: 'Pending Items', value: stats.pendingItems, icon: Clock, color: 'text-amber-400' },
  ]

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Welcome, {partner.business_name}</h1>
        <p className="mt-1 text-sm text-neutral-400">Here is an overview of your dropshipping business.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS_CARDS.map(({ label, value, icon: Icon, color }) => (
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
        More detailed charts and recent activity will appear here soon.
      </div>
    </div>
  )
}

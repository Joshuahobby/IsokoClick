import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ChevronRight } from 'lucide-react'
import { getAdminPartners } from '@/lib/supabase/queries/admin'
import { Badge } from '@/components/ui/badge'
import type { PartnerStatus } from '@/types/database'

export async function generateMetadata() {
  const t = await getTranslations('admin.partners')
  return { title: t('metaTitle') }
}

const STATUS_FILTER_VALUES: (PartnerStatus | '')[] = ['', 'pending', 'approved', 'suspended', 'rejected']

const PARTNER_STATUS_CLASS: Record<PartnerStatus, string> = {
  pending:   'bg-amber-500/20 text-amber-400',
  approved:  'bg-green-500/20 text-green-400',
  suspended: 'bg-red-500/20 text-red-400',
  rejected:  'bg-neutral-700 text-neutral-400',
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function AdminPartnersPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const status = (sp.status as PartnerStatus | undefined) ?? undefined
  const page = Number(sp.page ?? 1)

  const [{ partners, total }, t, tPartner, tCommon] = await Promise.all([
    getAdminPartners(status, page, 25),
    getTranslations('admin.partners'),
    getTranslations('statuses.partner'),
    getTranslations('common'),
  ])
  const totalPages = Math.ceil(total / 25)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
        <span className="text-sm text-neutral-500">{tCommon('countTotal', { count: total.toLocaleString() })}</span>
      </div>

      {/* Status filter tabs */}
      <div className="mb-6 flex gap-2">
        {STATUS_FILTER_VALUES.map((value) => (
          <Link
            key={value}
            href={value ? `?status=${value}` : '?'}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              (status ?? '') === value
                ? 'bg-brand-primary text-neutral-950'
                : 'border border-neutral-700 text-neutral-400 hover:text-white'
            }`}
          >
            {value === '' ? t('all') : tPartner(value)}
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900">
        {partners.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-neutral-500">{t('noPartners')}</div>
        ) : (
          <>
            <div className="divide-y divide-neutral-800">
              {/* Header */}
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-6 py-3 text-xs font-medium uppercase tracking-wide text-neutral-500">
                <span>{t('colPartner')}</span>
                <span>{t('colDistrict')}</span>
                <span>{t('colCommission')}</span>
                <span>{t('colStatus')}</span>
                <span></span>
              </div>

              {partners.map((partner) => (
                <div
                  key={partner.id}
                  className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-6 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{partner.business_name}</p>
                    <p className="text-xs text-neutral-500">
                      {partner.email ?? '—'} · {partner.phone ?? '—'}
                    </p>
                  </div>
                  <span className="text-sm text-neutral-400">{partner.district ?? '—'}</span>
                  <span className="text-sm text-white">{partner.commission_rate}%</span>
                  <Badge className={`border-0 text-xs ${PARTNER_STATUS_CLASS[partner.status]}`}>
                    {tPartner(partner.status)}
                  </Badge>
                  <Link
                    href={`/admin/partners/${partner.id}`}
                    className="flex items-center text-neutral-500 hover:text-white"
                  >
                    <ChevronRight size={16} />
                  </Link>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-neutral-800 px-6 py-4">
                <span className="text-xs text-neutral-500">
                  {tCommon('pageOf', { page, total: totalPages })}
                </span>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link
                      href={`?page=${page - 1}${status ? `&status=${status}` : ''}`}
                      className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-white hover:bg-neutral-800"
                    >
                      {tCommon('previous')}
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={`?page=${page + 1}${status ? `&status=${status}` : ''}`}
                      className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-white hover:bg-neutral-800"
                    >
                      {tCommon('next')}
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

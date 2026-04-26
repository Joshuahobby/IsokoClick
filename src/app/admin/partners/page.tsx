import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getAdminPartners } from '@/lib/supabase/queries/admin'
import { Badge } from '@/components/ui/badge'
import type { PartnerStatus } from '@/types/database'

export const metadata: Metadata = { title: 'Partners — Admin' }

const STATUS_OPTS: { value: PartnerStatus | ''; label: string }[] = [
  { value: '',           label: 'All' },
  { value: 'pending',    label: 'Pending' },
  { value: 'approved',   label: 'Approved' },
  { value: 'suspended',  label: 'Suspended' },
  { value: 'rejected',   label: 'Rejected' },
]

const PARTNER_STATUS_BADGE: Record<PartnerStatus, { label: string; className: string }> = {
  pending:   { label: 'Pending',   className: 'bg-amber-500/20 text-amber-400' },
  approved:  { label: 'Approved',  className: 'bg-green-500/20 text-green-400' },
  suspended: { label: 'Suspended', className: 'bg-red-500/20 text-red-400' },
  rejected:  { label: 'Rejected',  className: 'bg-neutral-700 text-neutral-400' },
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function AdminPartnersPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const status = (sp.status as PartnerStatus | undefined) ?? undefined
  const page = Number(sp.page ?? 1)

  const { partners, total } = await getAdminPartners(status, page, 25)
  const totalPages = Math.ceil(total / 25)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Partners</h1>
        <span className="text-sm text-neutral-500">{total.toLocaleString()} total</span>
      </div>

      {/* Status filter tabs */}
      <div className="mb-6 flex gap-2">
        {STATUS_OPTS.map((o) => (
          <Link
            key={o.value}
            href={o.value ? `?status=${o.value}` : '?'}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              (status ?? '') === o.value
                ? 'bg-brand-primary text-white'
                : 'border border-neutral-700 text-neutral-400 hover:text-white'
            }`}
          >
            {o.label}
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900">
        {partners.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-neutral-500">No partners found.</div>
        ) : (
          <>
            <div className="divide-y divide-neutral-800">
              {/* Header */}
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-6 py-3 text-xs font-medium uppercase tracking-wide text-neutral-500">
                <span>Partner</span>
                <span>District</span>
                <span>Commission</span>
                <span>Status</span>
                <span></span>
              </div>

              {partners.map((partner) => {
                const cfg = PARTNER_STATUS_BADGE[partner.status]

                return (
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
                    <Badge className={`border-0 text-xs ${cfg.className}`}>{cfg.label}</Badge>
                    <Link
                      href={`/admin/partners/${partner.id}`}
                      className="flex items-center text-neutral-500 hover:text-white"
                    >
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                )
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-neutral-800 px-6 py-4">
                <span className="text-xs text-neutral-500">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link
                      href={`?page=${page - 1}${status ? `&status=${status}` : ''}`}
                      className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-white hover:bg-neutral-800"
                    >
                      Previous
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={`?page=${page + 1}${status ? `&status=${status}` : ''}`}
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

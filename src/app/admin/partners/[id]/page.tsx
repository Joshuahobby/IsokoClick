import Link from 'next/link'
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { ChevronRight, User, Building, MapPin, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { getAdminPartnerById, updatePartnerStatus } from '@/lib/supabase/queries/admin'
import { hasRole } from '@/lib/supabase/require-role'
import { Badge } from '@/components/ui/badge'
import type { PartnerStatus } from '@/types/database'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const t = await getTranslations('admin.partnerDetail')
  return { title: t('metaTitle') }
}

const PARTNER_STATUS_CLASS: Record<PartnerStatus, string> = {
  pending:   'bg-amber-500/20 text-amber-400',
  approved:  'bg-green-500/20 text-green-400',
  suspended: 'bg-red-500/20 text-red-400',
  rejected:  'bg-neutral-700 text-neutral-400',
}

type Props = { params: Promise<{ id: string }> }

async function changeStatus(partnerId: string, userId: string, status: PartnerStatus) {
  'use server'
  if (!(await hasRole('admin'))) return
  await updatePartnerStatus(partnerId, status, userId)
  revalidatePath(`/admin/partners/${partnerId}`)
  revalidatePath('/admin/partners')
}

export default async function AdminPartnerDetailPage({ params }: Props) {
  const { id } = await params
  const [partner, t, tPartner, tCommon] = await Promise.all([
    getAdminPartnerById(id),
    getTranslations('admin.partnerDetail'),
    getTranslations('statuses.partner'),
    getTranslations('common'),
  ])

  if (!partner) notFound()

  const statusLabel = partner.status === 'pending' ? tPartner('pendingApproval') : tPartner(partner.status)
  const statusClass = PARTNER_STATUS_CLASS[partner.status] ?? 'bg-neutral-800'

  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-neutral-500">
        <Link href="/admin/partners" className="hover:text-white">{t('breadcrumb')}</Link>
        <ChevronRight size={14} />
        <span className="text-neutral-300">{partner.business_name}</span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{partner.business_name}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {t('appliedOn', {
              date: new Date(partner.created_at).toLocaleDateString('en-RW', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }),
            })}
          </p>
        </div>
        <Badge className={`border-0 ${statusClass}`}>{statusLabel}</Badge>
      </div>

      {/* Action Bar */}
      <div className="mb-6 flex flex-wrap gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <span className="flex items-center text-sm text-neutral-500">{t('actions')}</span>

        {partner.status !== 'approved' && (
          <form action={changeStatus.bind(null, partner.id, partner.user_id, 'approved')}>
            <button className="flex items-center gap-2 rounded-lg bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-400 transition-colors hover:bg-green-500/20">
              <CheckCircle size={16} /> {t('approve')}
            </button>
          </form>
        )}

        {partner.status !== 'rejected' && partner.status !== 'approved' && (
          <form action={changeStatus.bind(null, partner.id, partner.user_id, 'rejected')}>
            <button className="flex items-center gap-2 rounded-lg bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white">
              <XCircle size={16} /> {t('reject')}
            </button>
          </form>
        )}

        {partner.status === 'approved' && (
          <form action={changeStatus.bind(null, partner.id, partner.user_id, 'suspended')}>
            <button className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/20">
              <AlertTriangle size={16} /> {t('suspend')}
            </button>
          </form>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Business Details */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <Building size={16} className="text-brand-primary" /> {t('businessDetails')}
          </h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-neutral-500">{t('businessName')}</dt>
              <dd className="font-medium text-white">{partner.business_name}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">{t('tinNumber')}</dt>
              <dd className="text-white">{partner.tin_number || tCommon('notProvided')}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">{t('businessEmail')}</dt>
              <dd className="text-white">{partner.email || tCommon('notProvided')}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">{t('businessPhone')}</dt>
              <dd className="text-white">{partner.phone || tCommon('notProvided')}</dd>
            </div>
          </dl>
        </div>

        {/* Applicant Details */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <User size={16} className="text-brand-primary" /> {t('applicantDetails')}
          </h2>
          {partner.user ? (
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-neutral-500">{t('fullName')}</dt>
                <dd className="font-medium text-white">{partner.user.full_name}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">{t('accountEmail')}</dt>
                <dd className="text-white">{partner.user.email}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">{t('accountPhone')}</dt>
                <dd className="text-white">{partner.user.phone || tCommon('notProvided')}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-neutral-500">{t('userMissing')}</p>
          )}
        </div>

        {/* Location & Extra */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 sm:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <MapPin size={16} className="text-brand-primary" /> {t('locationDescription')}
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 text-sm">
            <div>
              <p className="text-neutral-500 mb-1">{t('district')}</p>
              <p className="text-white">{partner.district || tCommon('notProvided')}</p>
            </div>
            <div>
              <p className="text-neutral-500 mb-1">{t('address')}</p>
              <p className="text-white">{partner.address || tCommon('notProvided')}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-neutral-500 mb-1">{t('description')}</p>
              <p className="text-white whitespace-pre-wrap">{partner.description || t('noDescription')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

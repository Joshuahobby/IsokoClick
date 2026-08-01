import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ArrowRight, BadgeCheck, Building2, HardHat, MapPin, Phone, User } from 'lucide-react'
import { TECHNICIANS } from '@/constants/technicians'

// Rendered dynamically like the rest of the store — see the note in
// src/app/(store)/page.tsx on why the cookie-based locale rules out ISR.
export async function generateMetadata() {
  const t = await getTranslations('technicians')
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

export default async function TechniciansPage() {
  const t = await getTranslations('technicians')

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <header className="max-w-2xl">
        <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
            <HardHat size={22} aria-hidden="true" />
          </span>
          {t('title')}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-neutral-400">{t('subtitle')}</p>
      </header>

      {TECHNICIANS.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-3xl border border-neutral-800 bg-neutral-900/50 px-6 py-24 text-center">
          <HardHat size={48} className="mb-4 text-neutral-700" aria-hidden="true" />
          <h2 className="text-lg font-medium text-white">{t('empty')}</h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-neutral-400">{t('emptyHint')}</p>
          <Link
            href="/partner/register"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-primary px-7 py-3 text-sm font-bold text-neutral-950 transition-colors hover:bg-amber-600"
          >
            {t('emptyCta')}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <ul className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {TECHNICIANS.map((technician) => {
            const KindIcon = technician.kind === 'company' ? Building2 : User

            return (
              <li
                key={technician.slug}
                className="flex flex-col rounded-3xl border border-neutral-800 bg-neutral-900 p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
                    <KindIcon size={22} aria-hidden="true" />
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-700 px-2.5 py-1 text-[11px] font-semibold text-neutral-300">
                    {technician.kind === 'company' ? t('company') : t('individual')}
                  </span>
                </div>

                <h2 className="mt-5 text-lg font-bold text-white">{technician.name}</h2>
                <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-brand-primary">
                  <BadgeCheck size={14} aria-hidden="true" />
                  {t('verified')}
                </p>

                <p className="mt-3 flex-1 text-sm leading-relaxed text-neutral-400">
                  {technician.bio}
                </p>

                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {technician.trades.map((trade) => (
                    <li
                      key={trade}
                      className="rounded-full bg-neutral-800 px-2.5 py-1 text-[11px] font-medium text-neutral-200"
                    >
                      {trade}
                    </li>
                  ))}
                </ul>

                <dl className="mt-4 space-y-1.5 border-t border-neutral-800 pt-4 text-xs text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <dt className="flex items-center gap-1.5">
                      <MapPin size={13} aria-hidden="true" />
                      <span className="sr-only">{t('servesLabel')}</span>
                    </dt>
                    <dd>{technician.districts.join(', ')}</dd>
                  </div>
                  <div>
                    <dt className="sr-only">{t('trades')}</dt>
                    <dd>{t('yearsLabel', { count: technician.yearsExperience })}</dd>
                  </div>
                </dl>

                <a
                  href={`tel:${technician.phone}`}
                  aria-label={t('contact', { name: technician.name })}
                  className="mt-5 inline-flex w-fit items-center gap-2 rounded-full border border-neutral-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-white"
                >
                  <Phone size={15} aria-hidden="true" />
                  {technician.phone}
                </a>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

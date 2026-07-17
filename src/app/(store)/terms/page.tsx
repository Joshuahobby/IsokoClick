import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata() {
  const t = await getTranslations('legal')
  return { title: t('termsTitle') }
}

export default async function TermsPage() {
  const t = await getTranslations('legal')
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{t('termsTitle')}</h1>
      <p className="mt-6 leading-relaxed text-neutral-400">{t('placeholder')}</p>
      <Link
        href="/"
        className="mt-10 inline-flex rounded-full border border-neutral-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:border-white"
      >
        {t('backHome')}
      </Link>
    </div>
  )
}

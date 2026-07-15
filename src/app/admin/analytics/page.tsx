import { getTranslations } from 'next-intl/server'

export async function generateMetadata() {
  const t = await getTranslations('admin.analytics')
  return { title: t('metaTitle') }
}

export default async function AdminAnalyticsPage() {
  const t = await getTranslations('admin.analytics')

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">{t('title')}</h1>
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-8 text-center">
        <p className="text-neutral-500">{t('comingSoon')}</p>
      </div>
    </div>
  )
}

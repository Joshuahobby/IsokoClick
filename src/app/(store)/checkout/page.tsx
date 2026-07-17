import { getTranslations } from 'next-intl/server'
import { CheckoutClient } from './CheckoutClient'

export async function generateMetadata() {
  const t = await getTranslations('checkout')
  return { title: t('metaTitle') }
}

export default async function CheckoutPage() {
  const t = await getTranslations('checkout')

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">{t('title')}</h1>
      </div>

      <CheckoutClient />
    </div>
  )
}

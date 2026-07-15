'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ChevronLeft } from 'lucide-react'
import { createPartnerProduct } from './actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const initialState = { error: '' }

const UNIT_TYPES = ['piece', 'bag', 'kg', 'tonne', 'box', 'litre', 'm2', 'roll'] as const

export default function PartnerNewProductPage() {
  const t = useTranslations('partner.catalogNew')
  const [state, formAction, isPending] = useActionState(
    async (prevState: { error: string }, formData: FormData) => {
      const result = await createPartnerProduct(formData)
      if (result?.error) {
        return { error: result.error }
      }
      return prevState
    },
    initialState
  )

  return (
    <div className="max-w-3xl">
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-neutral-500">
        <Link href="/partner/catalog" className="flex items-center gap-1 hover:text-white">
          <ChevronLeft size={16} /> {t('backToCatalog')}
        </Link>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
        <p className="mt-1 text-sm text-neutral-400">{t('subtitle')}</p>
      </div>

      <form action={formAction} className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 space-y-6">
        {state.error && (
          <div className="rounded-lg bg-red-500/10 p-4 text-sm text-red-400">
            {state.error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name_en" className="text-neutral-300">
              {t('productName')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name_en"
              name="name_en"
              type="text"
              required
              className="border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500 focus-visible:ring-brand-primary"
              placeholder={t('productNamePlaceholder')}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="base_price" className="text-neutral-300">
                {t('basePrice')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="base_price"
                name="base_price"
                type="number"
                min="0"
                required
                className="border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500 focus-visible:ring-brand-primary"
                placeholder={t('basePricePlaceholder')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sale_price" className="text-neutral-300">
                {t('salePrice')}
              </Label>
              <Input
                id="sale_price"
                name="sale_price"
                type="number"
                min="0"
                className="border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500 focus-visible:ring-brand-primary"
                placeholder={t('salePricePlaceholder')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="unit_type" className="text-neutral-300">
                {t('unitType')} <span className="text-red-500">*</span>
              </Label>
              <select
                id="unit_type"
                name="unit_type"
                required
                className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-neutral-900"
              >
                {UNIT_TYPES.map((unit) => (
                  <option key={unit} value={unit}>{t(`units.${unit}`)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit_label_en" className="text-neutral-300">
                {t('unitLabel')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="unit_label_en"
                name="unit_label_en"
                type="text"
                required
                className="border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500 focus-visible:ring-brand-primary"
                placeholder={t('unitLabelPlaceholder')}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description_en" className="text-neutral-300">
              {t('description')}
            </Label>
            <textarea
              id="description_en"
              name="description_en"
              rows={4}
              className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-neutral-900"
              placeholder={t('descriptionPlaceholder')}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-neutral-800">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-brand-primary px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90 disabled:opacity-50"
          >
            {isPending ? t('saving') : t('submit')}
          </button>
        </div>
      </form>
    </div>
  )
}

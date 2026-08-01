'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { localize } from '@/lib/utils/localize'
import type { CategoryNode } from '@/lib/supabase/queries/products'
import type { AppLocale } from '@/i18n/locales'

type Props = {
  categories: CategoryNode[]
}

// Flattens the tree into render rows, keeping depth so subcategories can be
// indented under their parent. Selecting a parent still returns its whole
// subtree — see getProducts() — so both levels are useful filters.
function flatten(categories: CategoryNode[], depth = 0): { node: CategoryNode; depth: number }[] {
  return categories.flatMap((node) => [
    { node, depth },
    ...flatten(node.children, depth + 1),
  ])
}

export function ShopFilters({ categories }: Props) {
  const t = useTranslations('shop')
  const locale = useLocale() as AppLocale
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === null || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      params.delete('page') // reset to page 1 on filter change
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  const activeCategory = searchParams.get('category') ?? ''
  const activeSort = searchParams.get('sort') ?? ''
  const activeSource = searchParams.get('source') ?? ''
  const onSale = searchParams.get('sale') === '1'

  const sortOptions = [
    { value: '', label: t('relevance') },
    { value: 'featured', label: t('featured') },
    { value: 'newest', label: t('newest') },
    { value: 'price_asc', label: t('priceAsc') },
    { value: 'price_desc', label: t('priceDesc') },
  ]

  const sourceOptions = [
    { value: '', label: t('all') },
    { value: 'internal', label: t('internalStock') },
    { value: 'dropship', label: t('partnerStock') },
  ]

  return (
    <div className="space-y-6">
      {/* Sort */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">{t('sortBy')}</h3>
        <div className="space-y-1">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateParam('sort', opt.value || null)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                activeSort === opt.value
                  ? 'bg-brand-primary/10 text-brand-primary font-medium'
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">{t('category')}</h3>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => updateParam('category', null)}
            className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              !activeCategory
                ? 'bg-brand-primary/10 text-brand-primary font-medium'
                : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            {t('allCategories')}
          </button>
          {flatten(categories).map(({ node, depth }) => (
            <button
              key={node.slug}
              type="button"
              onClick={() => updateParam('category', node.slug)}
              style={depth > 0 ? { paddingLeft: `${0.75 + depth * 1}rem` } : undefined}
              className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                activeCategory === node.slug
                  ? 'bg-brand-primary/10 text-brand-primary font-medium'
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              {localize(locale, node.name_en, node.name_rw)}
              <span className="shrink-0 text-xs">{node.productCount}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Source */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">{t('stockType')}</h3>
        <div className="space-y-1">
          {sourceOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateParam('source', opt.value || null)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                activeSource === opt.value
                  ? 'bg-brand-primary/10 text-brand-primary font-medium'
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sale toggle */}
      <div>
        <button
          type="button"
          onClick={() => updateParam('sale', onSale ? null : '1')}
          className={`w-full rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            onSale
              ? 'border-red-500 bg-red-500/10 text-red-400'
              : 'border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white'
          }`}
        >
          {onSale ? `✕  ${t('onSale')}` : t('onSaleOnly')}
        </button>
      </div>

      {/* Clear all */}
      {(activeCategory || activeSort || activeSource || onSale) && (
        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="w-full rounded-lg px-3 py-2 text-sm text-neutral-400 underline hover:text-white"
        >
          {t('clearFilters')}
        </button>
      )}
    </div>
  )
}

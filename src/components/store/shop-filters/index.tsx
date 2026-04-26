'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import type { CategoryRow } from '@/types/database'

type Props = {
  categories: CategoryRow[]
}

const SORT_OPTIONS = [
  { value: '',          label: 'Relevance' },
  { value: 'featured',  label: 'Featured' },
  { value: 'newest',    label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc',label: 'Price: High → Low' },
]

export function ShopFilters({ categories }: Props) {
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

  return (
    <div className="space-y-6">
      {/* Sort */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Sort by</h3>
        <div className="space-y-1">
          {SORT_OPTIONS.map((opt) => (
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
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Category</h3>
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
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => updateParam('category', cat.slug)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                activeCategory === cat.slug
                  ? 'bg-brand-primary/10 text-brand-primary font-medium'
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              {cat.name_en}
            </button>
          ))}
        </div>
      </div>

      {/* Source */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Stock type</h3>
        <div className="space-y-1">
          {[
            { value: '',         label: 'All' },
            { value: 'internal', label: 'IsokoClick stock' },
            { value: 'dropship', label: 'Partner stock' },
          ].map((opt) => (
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
          {onSale ? '✕  On Sale' : 'On Sale only'}
        </button>
      </div>

      {/* Clear all */}
      {(activeCategory || activeSort || activeSource || onSale) && (
        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="w-full rounded-lg px-3 py-2 text-sm text-neutral-500 underline hover:text-white"
        >
          Clear all filters
        </button>
      )}
    </div>
  )
}

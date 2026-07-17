import { getLocale, getTranslations } from 'next-intl/server'
import { PackageSearch, SlidersHorizontal } from 'lucide-react'
import {
  getCategories,
  getProducts,
  type ProductFilters,
} from '@/lib/supabase/queries/products'
import { ProductCard } from '@/components/store/product-card'
import { ShopFilters } from '@/components/store/shop-filters'
import { ShopPagination } from '@/components/store/shop-pagination'
import type { AppLocale } from '@/i18n/locales'

export async function generateMetadata() {
  const t = await getTranslations('shop')
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

const PAGE_SIZE = 12
const SORT_VALUES: ReadonlyArray<ProductFilters['sort']> = [
  'price_asc',
  'price_desc',
  'newest',
  'featured',
]

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function asString(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined
}

export default async function ShopPage({ searchParams }: Props) {
  const sp = await searchParams

  const category = asString(sp.category)
  const rawSort = asString(sp.sort)
  const sort = SORT_VALUES.includes(rawSort as ProductFilters['sort'])
    ? (rawSort as ProductFilters['sort'])
    : undefined
  const rawSource = asString(sp.source)
  const source = rawSource === 'internal' || rawSource === 'dropship' ? rawSource : undefined
  const onSale = asString(sp.sale) === '1'
  const search = asString(sp.search)?.trim() || undefined
  const page = Math.max(1, parseInt(asString(sp.page) ?? '1', 10) || 1)

  const locale = (await getLocale()) as AppLocale
  const [t, categories, { products, total }] = await Promise.all([
    getTranslations('shop'),
    getCategories(),
    getProducts({ category, sort, source, onSale, search, page, pageSize: PAGE_SIZE }),
  ])
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {search ? t('searchResultsFor', { query: search }) : t('title')}
        </h1>
        <p className="mt-2 text-sm text-neutral-400">{t('resultsCount', { count: total })}</p>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[240px_1fr]">
        {/* Filters */}
        <aside>
          {/* Mobile: collapsible */}
          <details className="group rounded-2xl border border-neutral-800 bg-neutral-900 lg:hidden">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold text-white [&::-webkit-details-marker]:hidden">
              <SlidersHorizontal size={16} className="text-brand-primary" aria-hidden="true" />
              {t('filters')}
            </summary>
            <div className="border-t border-neutral-800 p-4">
              <ShopFilters categories={categories} />
            </div>
          </details>

          {/* Desktop: sticky sidebar */}
          <div className="sticky top-24 hidden lg:block">
            <ShopFilters categories={categories} />
          </div>
        </aside>

        {/* Results */}
        <div>
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-neutral-800 bg-neutral-900/50 py-24 text-center">
              <PackageSearch size={48} className="mb-4 text-neutral-700" aria-hidden="true" />
              <h2 className="text-lg font-medium text-white">{t('noResults')}</h2>
              <p className="mt-1 text-sm text-neutral-500">{t('noResultsHint')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} locale={locale} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-12">
                  <ShopPagination currentPage={page} totalPages={totalPages} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

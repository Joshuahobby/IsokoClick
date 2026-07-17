import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Plus } from 'lucide-react'
import { getAdminProducts } from '@/lib/supabase/queries/admin'
import { Badge } from '@/components/ui/badge'
import { formatRwf } from '@/lib/utils/currency'

export async function generateMetadata() {
  const t = await getTranslations('admin.products')
  return { title: t('metaTitle') }
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function AdminProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const search = typeof sp.search === 'string' ? sp.search : undefined
  const page = Number(sp.page ?? 1)

  const [{ products, total }, t, tCommon] = await Promise.all([
    getAdminProducts(page, 25, search),
    getTranslations('admin.products'),
    getTranslations('common'),
  ])
  const totalPages = Math.ceil(total / 25)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-500">{tCommon('countTotal', { count: total.toLocaleString() })}</span>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-amber-600"
          >
            <Plus size={14} />
            {t('addProduct')}
          </Link>
        </div>
      </div>

      {/* Search */}
      <form className="mb-6 flex gap-3">
        <input
          name="search"
          defaultValue={search}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchPlaceholder')}
          className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
        <button
          type="submit"
          className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-amber-600"
        >
          {t('search')}
        </button>
      </form>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900">
        {products.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-neutral-500">{t('noProducts')}</div>
        ) : (
          <>
            <div className="divide-y divide-neutral-800">
              {/* Header */}
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-6 py-3 text-xs font-medium uppercase tracking-wide text-neutral-500">
                <span>{t('colProduct')}</span>
                <span>{t('colCategory')}</span>
                <span>{t('colSource')}</span>
                <span>{t('colPrice')}</span>
                <span>{t('colStatus')}</span>
                <span></span>
              </div>

              {products.map((product) => {
                const category = product.categories as { name_en: string } | null

                return (
                  <div
                    key={product.id}
                    className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] items-center gap-4 px-6 py-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{product.name_en}</p>
                      <p className="truncate text-xs text-neutral-500">{product.slug}</p>
                    </div>
                    <span className="text-xs text-neutral-400">{category?.name_en ?? '—'}</span>
                    <Badge
                      className={`border-0 text-xs ${
                        product.source === 'internal'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-purple-500/20 text-purple-400'
                      }`}
                    >
                      {product.source === 'internal' ? tCommon('isokoClickStock') : tCommon('partnerStock')}
                    </Badge>
                    <div className="text-right">
                      <p className="text-sm text-white">{formatRwf(product.sale_price ?? product.base_price)}</p>
                      {product.sale_price && (
                        <p className="text-xs text-neutral-600 line-through">{formatRwf(product.base_price)}</p>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      <Badge
                        className={`border-0 text-xs ${
                          product.is_active
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {product.is_active ? tCommon('active') : tCommon('inactive')}
                      </Badge>
                      {product.is_featured && (
                        <Badge className="border-0 bg-amber-500/20 text-xs text-amber-400">
                          {tCommon('featured')}
                        </Badge>
                      )}
                    </div>
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="text-xs text-brand-primary hover:underline"
                    >
                      {t('edit')}
                    </Link>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-neutral-800 px-6 py-4">
                <span className="text-xs text-neutral-500">
                  {tCommon('pageOf', { page, total: totalPages })}
                </span>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link
                      href={`?page=${page - 1}${search ? `&search=${search}` : ''}`}
                      className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-white hover:bg-neutral-800"
                    >
                      {tCommon('previous')}
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={`?page=${page + 1}${search ? `&search=${search}` : ''}`}
                      className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-white hover:bg-neutral-800"
                    >
                      {tCommon('next')}
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

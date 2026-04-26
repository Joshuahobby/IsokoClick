import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getProducts, getCategories } from '@/lib/supabase/queries/products'
import { ProductCard } from '@/components/store/product-card'
import { ShopFilters } from '@/components/store/shop-filters'
import { ShopPagination } from '@/components/store/shop-pagination'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Browse 2,000+ construction materials — cement, steel, tiles, plumbing, electrical and more.',
}

type SearchParams = {
  category?: string
  source?: string
  min?: string
  max?: string
  q?: string
  sort?: string
  page?: string
  sale?: string
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const pageSize = 12

  const [{ products, total }, categories] = await Promise.all([
    getProducts({
      category:  params.category,
      source:    params.source === 'internal' || params.source === 'dropship' ? params.source : undefined,
      minPrice:  params.min ? parseInt(params.min, 10) : undefined,
      maxPrice:  params.max ? parseInt(params.max, 10) : undefined,
      search:    params.q,
      onSale:    params.sale === '1',
      sort:      params.sort as 'price_asc' | 'price_desc' | 'newest' | 'featured' | undefined,
      page,
      pageSize,
    }),
    getCategories(),
  ])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Shop</h1>
        <p className="mt-1 text-sm text-neutral-400">
          {total.toLocaleString()} product{total !== 1 ? 's' : ''} found
          {params.q ? ` for "${params.q}"` : ''}
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar filters */}
        <aside className="w-full shrink-0 lg:w-56">
          <Suspense>
            <ShopFilters categories={categories} />
          </Suspense>
        </aside>

        {/* Product grid */}
        <div className="flex-1">
          {products.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-10">
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 text-5xl">🔍</div>
      <h2 className="text-lg font-semibold text-white">No products found</h2>
      <p className="mt-2 text-sm text-neutral-400">Try adjusting your filters or search term.</p>
    </div>
  )
}

export function ShopPageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <div className="mb-8 space-y-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex gap-6">
        <div className="w-56 shrink-0 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
        <div className="grid flex-1 grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

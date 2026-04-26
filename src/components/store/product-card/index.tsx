import Link from 'next/link'
import Image from 'next/image'
import { formatRwf } from '@/lib/utils/currency'
import { QuickAddButton } from './quick-add-button'
import type { ProductWithImages } from '@/lib/supabase/queries/products'

type Props = {
  product: ProductWithImages
}

export function ProductCard({ product }: Props) {
  const displayPrice = product.sale_price ?? product.base_price
  const primaryImage = product.product_images?.find((img) => img.is_primary) ?? product.product_images?.[0]

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 transition-all hover:border-neutral-700 hover:shadow-lg hover:shadow-black/30">

        {/* Image */}
        <div className="arch-top relative aspect-[4/3] overflow-hidden bg-neutral-800">
          {primaryImage ? (
            <Image
              src={primaryImage.storage_url}
              alt={primaryImage.alt_text ?? product.name_en}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-neutral-600 text-sm">
              {product.categories?.name_en ?? ''}
            </div>
          )}

          {/* Source badge */}
          <div className="absolute right-3 top-3">
            {product.source === 'internal' ? (
              <span className="rounded-full bg-brand-primary/90 px-2 py-0.5 text-[10px] font-semibold text-white">
                IsokoClick
              </span>
            ) : (
              <span className="rounded-full bg-purple-600/90 px-2 py-0.5 text-[10px] font-semibold text-white">
                Partner
              </span>
            )}
          </div>

          {/* Sale badge */}
          {product.sale_price && (
            <div className="absolute left-3 top-3">
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">SALE</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <p className="text-xs text-neutral-500 mb-1">{product.categories?.name_en}</p>
          <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2 group-hover:text-neutral-200">
            {product.name_en}
          </h3>
          <p className="mt-1 text-xs text-neutral-500 line-clamp-1">{product.unit_label_en}</p>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <span className="price text-base text-white">{formatRwf(displayPrice)}</span>
              {product.sale_price && (
                <span className="ml-2 text-xs text-neutral-500 line-through">{formatRwf(product.base_price)}</span>
              )}
            </div>
            <QuickAddButton
              id={product.id}
              slug={product.slug}
              name={product.name_en}
              price={displayPrice}
              minQty={product.min_order_qty}
              unitType={product.unit_type}
              imageUrl={primaryImage?.storage_url ?? null}
              source={product.source}
            />
          </div>
        </div>
      </div>
    </Link>
  )
}

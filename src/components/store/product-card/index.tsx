import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { formatRwf } from '@/lib/utils/currency'
import { localize } from '@/lib/utils/localize'
import { CategoryIcon } from '@/components/store/category-icon'
import { QuickAddButton } from './quick-add-button'
import type { ProductWithImages } from '@/lib/supabase/queries/products'
import type { AppLocale } from '@/i18n/locales'

type Props = {
  product: ProductWithImages
  locale?: AppLocale
}

export function ProductCard({ product, locale = 'en' }: Props) {
  const tCommon = useTranslations('common')
  const displayPrice = product.sale_price ?? product.base_price
  const primaryImage = product.product_images?.find((img) => img.is_primary) ?? product.product_images?.[0]
  const name = localize(locale, product.name_en, product.name_rw)
  const unitLabel = localize(locale, product.unit_label_en, product.unit_label_rw)
  const categoryName = product.categories
    ? localize(locale, product.categories.name_en, product.categories.name_rw)
    : null

  return (
    // Stretched-link pattern: the title's ::after covers the card so the whole
    // card is clickable without nesting the quick-add <button> inside an <a>.
    <div className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 transition-all hover:border-neutral-700 hover:shadow-lg hover:shadow-black/30 focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/60">

      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-800">
        {primaryImage ? (
          <Image
            src={primaryImage.storage_url}
            alt={primaryImage.alt_text ?? name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-neutral-600">
            <CategoryIcon slug={product.categories?.slug} size={36} />
            {categoryName && <span className="text-xs font-medium">{categoryName}</span>}
          </div>
        )}

        {/* Source badge */}
        <div className="absolute right-3 top-3">
          {product.source === 'internal' ? (
            <span className="rounded-full bg-brand-primary/90 px-2 py-0.5 text-[10px] font-semibold text-neutral-950">
              {tCommon('isokoClickStock')}
            </span>
          ) : (
            <span className="rounded-full bg-purple-600/90 px-2 py-0.5 text-[10px] font-semibold text-white">
              {tCommon('partnerStock')}
            </span>
          )}
        </div>

        {/* Sale badge */}
        {product.sale_price && (
          <div className="absolute left-3 top-3">
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
              {tCommon('sale')}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="mb-1 text-xs text-neutral-400">{categoryName}</p>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white group-hover:text-neutral-200">
          <Link
            href={`/product/${product.slug}`}
            className="outline-none after:absolute after:inset-0 after:content-['']"
          >
            {name}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-1 text-xs text-neutral-400">{unitLabel}</p>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <span className="price text-base text-white">{formatRwf(displayPrice)}</span>
            {product.sale_price && (
              <span className="ml-2 text-xs text-neutral-400 line-through">{formatRwf(product.base_price)}</span>
            )}
          </div>
          <QuickAddButton
            id={product.id}
            slug={product.slug}
            name={name}
            price={displayPrice}
            minQty={product.min_order_qty}
            unitType={product.unit_type}
            imageUrl={primaryImage?.storage_url ?? null}
            source={product.source}
          />
        </div>
      </div>
    </div>
  )
}

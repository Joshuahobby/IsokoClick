import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { ChevronRight, Smartphone, Truck } from 'lucide-react'
import { getProductBySlug, getRelatedProducts } from '@/lib/supabase/queries/products'
import { ProductCard } from '@/components/store/product-card'
import { CategoryIcon } from '@/components/store/category-icon'
import { AddToCartButton } from '@/components/store/add-to-cart-button'
import { formatRwf } from '@/lib/utils/currency'
import { localize } from '@/lib/utils/localize'
import type { AppLocale } from '@/i18n/locales'

// Note: rendered dynamically (not ISR) — the cookie-based locale in
// src/i18n/request.ts falls back to English during static prerenders.

// Heavy goods (>500kg) require scheduled delivery (see CLAUDE.md)
const HEAVY_GOODS_KG = 500

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const [product, locale] = await Promise.all([getProductBySlug(slug), getLocale()])
  if (!product) return {}
  const name = localize(locale as AppLocale, product.name_en, product.name_rw)
  const description = product.description_en
    ? localize(locale as AppLocale, product.description_en, product.description_rw)
    : undefined
  return {
    title: name,
    description,
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const locale = (await getLocale()) as AppLocale
  const [t, tCommon, related] = await Promise.all([
    getTranslations('product'),
    getTranslations('common'),
    product.categories
      ? getRelatedProducts(product.id, product.categories.slug, 4)
      : Promise.resolve([]),
  ])

  const name = localize(locale, product.name_en, product.name_rw)
  const description = product.description_en
    ? localize(locale, product.description_en, product.description_rw)
    : null
  const unitLabel = localize(locale, product.unit_label_en, product.unit_label_rw)
  const categoryName = product.categories
    ? localize(locale, product.categories.name_en, product.categories.name_rw)
    : null
  const displayPrice = product.sale_price ?? product.base_price
  const images = [...(product.product_images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order
  )
  const specs = [...(product.product_specs ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  const isHeavy = (product.weight_kg ?? 0) > HEAVY_GOODS_KG

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-neutral-500">
        <Link href="/" className="transition-colors hover:text-white">{t('home')}</Link>
        <ChevronRight size={14} aria-hidden="true" />
        <Link href="/shop" className="transition-colors hover:text-white">{t('shop')}</Link>
        {product.categories && (
          <>
            <ChevronRight size={14} aria-hidden="true" />
            <Link
              href={`/shop?category=${product.categories.slug}`}
              className="transition-colors hover:text-white"
            >
              {categoryName}
            </Link>
          </>
        )}
        <ChevronRight size={14} aria-hidden="true" />
        <span className="text-neutral-300">{name}</span>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-14">

        {/* Gallery */}
        <div>
          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900">
            {images[0] ? (
              <Image
                src={images[0].storage_url}
                alt={images[0].alt_text ?? name}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-neutral-600">
                <CategoryIcon slug={product.categories?.slug} size={64} />
                {categoryName && <span className="text-sm font-medium">{categoryName}</span>}
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-4">
              {images.slice(1, 5).map((img) => (
                <div
                  key={img.storage_url}
                  className="relative aspect-square overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900"
                >
                  <Image
                    src={img.storage_url}
                    alt={img.alt_text ?? name}
                    fill
                    className="object-cover"
                    sizes="150px"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {product.categories && (
              <Link
                href={`/shop?category=${product.categories.slug}`}
                className="rounded-full border border-neutral-700 px-3 py-1 text-xs font-medium text-neutral-300 transition-colors hover:border-neutral-500"
              >
                {categoryName}
              </Link>
            )}
            {product.source === 'internal' ? (
              <span className="rounded-full bg-brand-primary/90 px-3 py-1 text-xs font-semibold text-white">
                {tCommon('isokoClickStock')}
              </span>
            ) : (
              <span className="rounded-full bg-purple-600/90 px-3 py-1 text-xs font-semibold text-white">
                {tCommon('partnerStock')}
              </span>
            )}
            {product.sale_price && (
              <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold uppercase text-white">
                {tCommon('sale')}
              </span>
            )}
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">{name}</h1>

          {(product.brand || product.sku) && (
            <p className="mt-2 text-sm text-neutral-500">
              {product.brand && <span>{t('brand')}: {product.brand}</span>}
              {product.brand && product.sku && <span className="mx-2">·</span>}
              {product.sku && <span>{t('sku')}: {product.sku}</span>}
            </p>
          )}

          <div className="mt-6 border-t border-neutral-800 pt-6">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="price text-3xl text-white sm:text-4xl">{formatRwf(displayPrice)}</span>
              {product.sale_price && (
                <span className="text-lg text-neutral-500 line-through">{formatRwf(product.base_price)}</span>
              )}
            </div>
            <p className="mt-1 text-sm text-neutral-400">{unitLabel}</p>
            <p className="mt-1 text-xs text-neutral-500">{t('vatIncluded')}</p>
            {product.min_order_qty > 1 && (
              <p className="mt-3 text-sm font-medium text-amber-500">
                {t('minOrder', { qty: product.min_order_qty })}
              </p>
            )}
          </div>

          <div className="mt-8">
            <AddToCartButton
              product={product}
              name={name}
              imageUrl={images[0]?.storage_url ?? null}
            />
          </div>

          {/* Delivery & payment */}
          <div className="mt-8 space-y-3 rounded-2xl border border-neutral-800 bg-neutral-900 p-5 text-sm text-neutral-300">
            <p className="flex items-start gap-3">
              <Truck size={18} className="mt-0.5 shrink-0 text-brand-primary" aria-hidden="true" />
              {t('deliveryNote')}
            </p>
            {isHeavy && (
              <p className="flex items-start gap-3">
                <Truck size={18} className="mt-0.5 shrink-0 text-amber-500" aria-hidden="true" />
                {t('heavyNote')}
              </p>
            )}
            <p className="flex items-start gap-3">
              <Smartphone size={18} className="mt-0.5 shrink-0 text-brand-primary" aria-hidden="true" />
              {t('paymentNote')}
            </p>
          </div>

          {/* Description */}
          {description && (
            <div className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
                {t('description')}
              </h2>
              <p className="mt-3 leading-relaxed text-neutral-300">{description}</p>
            </div>
          )}

          {/* Specifications */}
          {specs.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
                {t('specifications')}
              </h2>
              <dl className="mt-3 divide-y divide-neutral-800 rounded-2xl border border-neutral-800">
                {specs.map((spec) => (
                  <div key={spec.key_en} className="grid grid-cols-2 gap-4 px-5 py-3 text-sm">
                    <dt className="text-neutral-500">{spec.key_en}</dt>
                    <dd className="text-neutral-200">{spec.value_en}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-20 border-t border-neutral-800/70 pt-14">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{t('relatedTitle')}</h2>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} locale={locale} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

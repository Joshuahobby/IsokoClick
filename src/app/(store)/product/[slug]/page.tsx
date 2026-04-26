import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, Package, Truck, ShieldCheck, AlertCircle } from 'lucide-react'
import { getProductBySlug, getRelatedProducts } from '@/lib/supabase/queries/products'
import { ProductCard } from '@/components/store/product-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatRwf } from '@/lib/utils/currency'
import { AddToCartButton } from '@/components/store/add-to-cart-button'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: 'Product not found' }
  return {
    title: product.meta_title ?? product.name_en,
    description: product.meta_description ?? product.description_en ?? undefined,
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const sortedImages = [...(product.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  const primaryImage = sortedImages.find((img) => img.is_primary) ?? sortedImages[0]
  const displayPrice = product.sale_price ?? product.base_price
  const relatedProducts = product.categories
    ? await getRelatedProducts(product.id, product.categories.slug, 4)
    : []

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">

      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-1.5 text-sm text-neutral-500">
        <Link href="/" className="hover:text-white">Home</Link>
        <ChevronRight size={14} />
        <Link href="/shop" className="hover:text-white">Shop</Link>
        {product.categories && (
          <>
            <ChevronRight size={14} />
            <Link href={`/shop?category=${product.categories.slug}`} className="hover:text-white">
              {product.categories.name_en}
            </Link>
          </>
        )}
        <ChevronRight size={14} />
        <span className="text-neutral-300 line-clamp-1">{product.name_en}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">

        {/* Image gallery */}
        <div className="space-y-3">
          <div className="arch-top relative aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-800">
            {primaryImage ? (
              <Image
                src={primaryImage.storage_url}
                alt={primaryImage.alt_text ?? product.name_en}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-neutral-600">
                <Package size={48} />
              </div>
            )}
            {product.sale_price && (
              <div className="absolute left-4 top-4">
                <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">SALE</span>
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {sortedImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {sortedImages.map((img) => (
                <div
                  key={img.storage_url}
                  className="relative aspect-square w-16 shrink-0 overflow-hidden rounded-lg border border-neutral-700 bg-neutral-800"
                >
                  <Image
                    src={img.storage_url}
                    alt={img.alt_text ?? ''}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div>
          {/* Source badge */}
          <div className="mb-3">
            {product.source === 'internal' ? (
              <Badge className="border-0 bg-brand-primary/20 text-brand-primary">IsokoClick Stock</Badge>
            ) : (
              <Badge className="border-0 bg-purple-600/20 text-purple-400">Partner Stock</Badge>
            )}
          </div>

          <h1 className="text-2xl font-bold text-white sm:text-3xl">{product.name_en}</h1>
          {product.brand && (
            <p className="mt-1 text-sm text-neutral-500">by {product.brand}</p>
          )}

          {/* Price */}
          <div className="mt-5 flex items-baseline gap-3">
            <span className="price text-3xl font-bold text-white">{formatRwf(displayPrice)}</span>
            {product.sale_price && (
              <span className="price text-lg text-neutral-500 line-through">{formatRwf(product.base_price)}</span>
            )}
            <span className="text-sm text-neutral-500">{product.unit_label_en}</span>
          </div>

          {/* Min order */}
          {product.min_order_qty > 1 && (
            <p className="mt-2 text-sm text-amber-400/80">
              Minimum order: {product.min_order_qty} {product.unit_type}
            </p>
          )}

          {/* Heavy goods warning */}
          {product.is_heavy_goods && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-400" />
              <p className="text-sm text-amber-300">
                Heavy goods — scheduled delivery required. Contact us to arrange.
              </p>
            </div>
          )}

          {/* Variants */}
          {product.product_variants && product.product_variants.filter((v) => v.is_active).length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-medium text-neutral-300">Variants</p>
              <div className="flex flex-wrap gap-2">
                {product.product_variants
                  .filter((v) => v.is_active)
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 transition-colors hover:border-brand-primary hover:text-white"
                    >
                      {v.name_en}
                      {v.price && <span className="ml-1.5 text-neutral-500">{formatRwf(v.price)}</span>}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Add to cart */}
          <div className="mt-8">
            <AddToCartButton product={product} imageUrl={primaryImage?.storage_url ?? null} />
          </div>

          {/* Trust badges */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { icon: Truck,       label: 'Kigali: same-day dispatch' },
              { icon: ShieldCheck, label: 'Quality guaranteed' },
              { icon: Package,     label: 'Bulk order discounts' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 rounded-xl border border-neutral-800 p-3 text-center">
                <Icon size={18} className="text-brand-primary" />
                <span className="text-[11px] text-neutral-400 leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Description + Specs tabs */}
      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">

        {/* Description */}
        {product.description_en && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-white">Description</h2>
            <p className="text-sm leading-relaxed text-neutral-400">{product.description_en}</p>
          </div>
        )}

        {/* Specs */}
        {product.product_specs && product.product_specs.length > 0 && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-white">Specifications</h2>
            <dl className="divide-y divide-neutral-800">
              {[...product.product_specs]
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((spec) => (
                  <div key={spec.key_en} className="flex justify-between py-2.5">
                    <dt className="text-sm text-neutral-500">{spec.key_en}</dt>
                    <dd className="text-sm font-medium text-white">{spec.value_en}</dd>
                  </div>
                ))}
            </dl>
          </div>
        )}
      </div>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-xl font-bold text-white">Related Products</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

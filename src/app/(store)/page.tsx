import Link from 'next/link'
import Image from 'next/image'
import { getLocale, getTranslations } from 'next-intl/server'
import {
  ArrowRight,
  Building2,
  HardHat,
  ShoppingCart,
  Smartphone,
  Store,
  Tag,
  Truck,
} from 'lucide-react'
import {
  getCategoryTree,
  getProducts,
  type ProductWithImages,
} from '@/lib/supabase/queries/products'
import { ProductCard } from '@/components/store/product-card'
import { CategoryIcon } from '@/components/store/category-icon'
import { HeroShowcase, type ShowcaseProduct } from '@/components/store/hero-showcase'
import { formatRwf } from '@/lib/utils/currency'
import { localize } from '@/lib/utils/localize'
import type { AppLocale } from '@/i18n/locales'

// Main categories with a background photo in public/category/. The asset
// library is entirely bathroom, kitchen and tile photography, so the other
// slugs have nothing honest to show and keep the icon-only card. Kept in sync
// by hand with CATEGORY_TILES in scripts/build-site-imagery.mjs.
const CATEGORY_PHOTOS = new Set(['plumbing', 'tiles'])

// How many featured products the hero rotates through.
const SHOWCASE_SIZE = 6

// Note: rendered dynamically (not ISR) — the cookie-based locale in
// src/i18n/request.ts falls back to English during static prerenders.
export async function generateMetadata() {
  const t = await getTranslations('home')
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

// Several sections link out with the same visible label ("View all"), which
// would leave a screen reader user with a list of identical link names. The
// accessible name is composed here, from the title this component already
// receives, so every section is disambiguated by construction — a call site
// cannot forget to pass it.
async function SectionHeader({
  title,
  subtitle,
  href,
  linkLabel,
}: {
  title: string
  subtitle?: string
  href?: string
  linkLabel?: string
}) {
  const tCommon = await getTranslations('common')

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-2 text-sm text-neutral-400">{subtitle}</p>}
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          aria-label={tCommon('sectionLinkAria', { action: linkLabel, section: title })}
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary transition-colors hover:text-amber-500"
        >
          {linkLabel}
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}

export default async function StoreHomePage() {
  const locale = (await getLocale()) as AppLocale
  const [t, tCommon, categoryTree, featuredRes, newestRes, saleRes] = await Promise.all([
    getTranslations('home'),
    getTranslations('common'),
    getCategoryTree(),
    getProducts({ featured: true, pageSize: 8 }),
    getProducts({ sort: 'newest', pageSize: 12 }),
    getProducts({ onSale: true, pageSize: 4 }),
  ])

  // Trim grids to full rows (4-col desktop) so a lone card never orphans on
  // its own row; below one full row, show whatever exists.
  const fullRows = (products: ProductWithImages[]) =>
    products.length <= 4 ? products : products.slice(0, Math.floor(products.length / 4) * 4)

  const saleProducts = saleRes.products.slice(0, 2)
  const saleIds = new Set(saleProducts.map((p) => p.id))
  const featured = fullRows(featuredRes.products.filter((p) => !saleIds.has(p.id)))
  const featuredIds = new Set(featured.map((p) => p.id))
  const newArrivals = fullRows(
    newestRes.products.filter((p) => !featuredIds.has(p.id) && !saleIds.has(p.id))
  )
  // Main categories only, and only stocked ones — the header mega menu is
  // where the full tree and the ranges still waiting on stock live.
  const visibleCategories = categoryTree.filter((cat) => cat.productCount > 0)
  const brands = [...new Set(
    [...featured, ...newestRes.products].map((p) => p.brand).filter((b): b is string => Boolean(b))
  )]

  // The hero rotates the featured shelf rather than pinning one product, so a
  // repeat visitor does not meet the same basin every time. Prices are
  // formatted here because the showcase is a client component.
  const toShowcase = (product: ProductWithImages): ShowcaseProduct => {
    const image =
      product.product_images?.find((img) => img.is_primary) ?? product.product_images?.[0]
    const name = localize(locale, product.name_en, product.name_rw)

    return {
      slug: product.slug,
      name,
      categoryName: product.categories
        ? localize(locale, product.categories.name_en, product.categories.name_rw)
        : null,
      categorySlug: product.categories?.slug ?? null,
      price: formatRwf(product.sale_price ?? product.base_price),
      unitLabel: localize(locale, product.unit_label_en, product.unit_label_rw),
      imageUrl: image?.storage_url ?? null,
      imageAlt: image?.alt_text ?? name,
    }
  }

  const showcase = (featuredRes.products.length > 0 ? featuredRes.products : newestRes.products)
    .slice(0, SHOWCASE_SIZE)
    .map(toShowcase)

  const steps = [
    { icon: Store, title: t('how1Title'), desc: t('how1Desc') },
    { icon: Smartphone, title: t('how2Title'), desc: t('how2Desc') },
    { icon: Truck, title: t('how3Title'), desc: t('how3Desc') },
  ]

  return (
    <div className="flex min-h-screen flex-col">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-texture opacity-[0.04]" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-brand-primary/15 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1fr_400px] lg:items-center lg:px-8 lg:pb-24 lg:pt-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-primary/40 bg-brand-primary/10 px-4 py-1.5 text-xs font-semibold text-brand-primary">
              <HardHat size={14} aria-hidden="true" />
              {t('heroEyebrow')}
            </span>
            <h1 className="mt-6 max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {t('heroTitle')}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-neutral-400">
              {t('heroSubtitle')}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-8 py-3.5 text-sm font-bold text-neutral-950 transition-colors hover:bg-amber-600"
              >
                {t('shopMaterials')}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link
                href="#categories"
                className="rounded-full border border-neutral-600 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:border-white"
              >
                {t('browseCategories')}
              </Link>
            </div>
          </div>

          {/* Rotating featured shelf (desktop) */}
          {showcase.length > 0 && (
            <div className="hidden lg:block">
              <HeroShowcase products={showcase} />
            </div>
          )}
        </div>
      </section>

      {/* ── Featured materials ───────────────────────────────── */}
      {featured.length > 0 ? (
        <section className="mx-auto w-full max-w-7xl border-t border-neutral-800/70 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <SectionHeader
            title={t('featuredTitle')}
            subtitle={t('featuredSubtitle')}
            href="/shop?sort=featured"
            linkLabel={tCommon('viewAll')}
          />
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
          </div>
        </section>
      ) : (
        newArrivals.length === 0 && (
          <section className="mx-auto w-full max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
            <ShoppingCart size={48} className="mx-auto mb-4 text-neutral-700" aria-hidden="true" />
            <h3 className="text-lg font-medium text-white">{t('noProducts')}</h3>
            <p className="mt-1 text-sm text-neutral-400">{t('noProductsHint')}</p>
          </section>
        )
      )}

      {/* ── Deals band ───────────────────────────────────────── */}
      {saleProducts.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-700 to-amber-900">
            <div className="absolute inset-0 bg-stripe-texture opacity-10" aria-hidden="true" />
            <div className="relative grid gap-10 p-8 lg:grid-cols-2 lg:p-12">
              <div className="flex flex-col justify-center">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                  <Tag size={12} aria-hidden="true" />
                  {tCommon('sale')}
                </span>
                <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  {t('dealsTitle')}
                </h2>
                <p className="mt-3 max-w-md text-white">{t('dealsSubtitle')}</p>
                <Link
                  href="/shop?sale=1"
                  className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-bold text-neutral-900 transition-transform hover:scale-105"
                >
                  {t('shopAllDeals')}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {saleProducts.map((product) => (
                  <ProductCard key={product.id} product={product} locale={locale} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── New arrivals ─────────────────────────────────────── */}
      {newArrivals.length > 0 && (
        <section className="border-t border-neutral-800/70 bg-neutral-900/60">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <SectionHeader
              title={t('newArrivalsTitle')}
              subtitle={t('newArrivalsSubtitle')}
              href="/shop?sort=newest"
              linkLabel={tCommon('viewAll')}
            />
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Categories ───────────────────────────────────────── */}
      {/* Sits below the product shelves on purpose: a shopper landing here
          meets real products straight after the hero, and reaches the taxonomy
          once they want to narrow down. The header mega menu covers the
          shopper who arrives already knowing which range they want. */}
      {visibleCategories.length > 0 && (
        <section id="categories" className="border-t border-neutral-800/70 scroll-mt-16">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <SectionHeader
              title={t('categoriesTitle')}
              subtitle={t('categoriesSubtitle')}
              href="/shop"
              linkLabel={t('viewAllProducts')}
            />
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {visibleCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 p-6 transition-all hover:border-brand-primary/50 hover:bg-neutral-800/80"
                >
                  {/* Decorative only — the card already names the category, so
                      the photo takes an empty alt and sits under a scrim that
                      keeps the label and count on a near-solid background. */}
                  {CATEGORY_PHOTOS.has(cat.slug) && (
                    <>
                      <Image
                        src={`/category/${cat.slug}.jpg`}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover opacity-20 transition-opacity duration-300 group-hover:opacity-30"
                      />
                      <div
                        className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/85 to-neutral-900/55"
                        aria-hidden="true"
                      />
                    </>
                  )}
                  <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                    <CategoryIcon slug={cat.slug} size={22} />
                  </span>
                  <p className="relative mt-4 font-semibold text-white transition-colors group-hover:text-brand-primary">
                    {localize(locale, cat.name_en, cat.name_rw)}
                  </p>
                  <p className="relative mt-1 text-xs text-neutral-400">
                    {t('itemsCount', { count: cat.productCount })}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Brands strip ─────────────────────────────────────── */}
      {/* Was the tail of the "Stocked two ways" section until that block came
          out; it stands on its own because it is about who makes the stock,
          not where it ships from. */}
      {brands.length >= 2 && (
        <section className="mx-auto w-full max-w-7xl border-t border-neutral-800/70 px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              {t('brandsTitle')}
            </p>
            {brands.map((brand) => (
              <span key={brand} className="text-lg font-bold uppercase tracking-wide text-neutral-400">
                {brand}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="border-t border-neutral-800/70 bg-neutral-900/60">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <SectionHeader title={t('howTitle')} subtitle={t('howSubtitle')} />
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title} className="rounded-3xl border border-neutral-800 bg-neutral-900 p-8">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
                    <step.icon size={24} aria-hidden="true" />
                  </span>
                  <span className="price text-3xl text-neutral-500" aria-hidden="true">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-400">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── B2B & Partner CTAs ───────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col rounded-3xl border border-neutral-800 bg-neutral-900 p-8 lg:p-10">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
              <Building2 size={24} aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-2xl font-bold text-white">{t('b2bTitle')}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-400">{t('b2bDesc')}</p>
            <Link
              href="/signup"
              className="mt-8 inline-flex w-fit rounded-full border border-neutral-600 px-7 py-3 text-sm font-semibold text-white transition-colors hover:border-white"
            >
              {t('b2bCta')}
            </Link>
          </div>
          <div className="relative flex flex-col overflow-hidden rounded-3xl border border-brand-primary/40 bg-brand-primary/10 p-8 lg:p-10">
            <div className="absolute inset-0 bg-grid-texture opacity-[0.03]" aria-hidden="true" />
            <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary text-white">
              <Store size={24} aria-hidden="true" />
            </span>
            <h3 className="relative mt-5 text-2xl font-bold text-white">{t('partnerTitle')}</h3>
            <p className="relative mt-2 flex-1 text-sm leading-relaxed text-neutral-300">{t('partnerDesc')}</p>
            <Link
              href="/partner/register"
              className="relative mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-brand-primary px-7 py-3 text-sm font-bold text-neutral-950 transition-colors hover:bg-amber-600"
            >
              {t('partnerCta')}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

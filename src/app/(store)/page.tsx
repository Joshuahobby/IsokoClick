import Link from 'next/link'
import Image from 'next/image'
import { getLocale, getTranslations } from 'next-intl/server'
import {
  ArrowRight,
  Building2,
  Handshake,
  HardHat,
  ShoppingCart,
  Smartphone,
  Store,
  Tag,
  Truck,
  Warehouse,
} from 'lucide-react'
import {
  getCategories,
  getCategoryProductCounts,
  getProducts,
  type ProductWithImages,
} from '@/lib/supabase/queries/products'
import { ProductCard } from '@/components/store/product-card'
import { CategoryIcon } from '@/components/store/category-icon'
import { formatRwf } from '@/lib/utils/currency'
import { localize } from '@/lib/utils/localize'
import type { AppLocale } from '@/i18n/locales'

// Note: rendered dynamically (not ISR) — the cookie-based locale in
// src/i18n/request.ts falls back to English during static prerenders.
export async function generateMetadata() {
  const t = await getTranslations('home')
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

function SectionHeader({
  title,
  subtitle,
  href,
  linkLabel,
  linkAriaLabel,
}: {
  title: string
  subtitle?: string
  href?: string
  linkLabel?: string
  linkAriaLabel?: string
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-2 text-sm text-neutral-400">{subtitle}</p>}
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          aria-label={linkAriaLabel}
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
  const [t, tCommon, categories, categoryCounts, featuredRes, newestRes, saleRes] = await Promise.all([
    getTranslations('home'),
    getTranslations('common'),
    getCategories(),
    getCategoryProductCounts(),
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
  const visibleCategories = categories.filter((cat) => (categoryCounts[cat.id] ?? 0) > 0)
  const spotlight: ProductWithImages | undefined = featured[0] ?? newestRes.products[0]
  const spotlightImage =
    spotlight?.product_images?.find((img) => img.is_primary) ?? spotlight?.product_images?.[0]
  const brands = [...new Set(
    [...featured, ...newestRes.products].map((p) => p.brand).filter((b): b is string => Boolean(b))
  )]

  const stats = [
    { value: t('statDeliveryValue'), label: t('statDelivery') },
    { value: '30', label: t('statDistricts') },
    { value: t('statPaymentValue'), label: t('statPayment') },
    { value: '100%', label: t('statPartners') },
  ]

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

            <dl className="mt-14 grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col-reverse">
                  <dt className="mt-1 text-xs leading-snug text-neutral-400">{stat.label}</dt>
                  <dd className="price text-2xl text-white">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Spotlight card (desktop) */}
          {spotlight && (
            <div className="hidden lg:block">
              <div className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6 shadow-2xl shadow-black/40 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
                  {t('heroSpotlight')}
                </p>
                <Link href={`/product/${spotlight.slug}`} className="group mt-4 block">
                  <div className="arch-top relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-neutral-800">
                    {spotlightImage ? (
                      <Image
                        src={spotlightImage.storage_url}
                        alt={spotlightImage.alt_text ?? localize(locale, spotlight.name_en, spotlight.name_rw)}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="400px"
                      />
                    ) : (
                      <CategoryIcon slug={spotlight.categories?.slug} size={56} className="text-neutral-600" />
                    )}
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-neutral-400">
                        {spotlight.categories
                          ? localize(locale, spotlight.categories.name_en, spotlight.categories.name_rw)
                          : null}
                      </p>
                      <h3 className="mt-0.5 font-semibold text-white group-hover:text-neutral-200">
                        {localize(locale, spotlight.name_en, spotlight.name_rw)}
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="price text-lg text-white">
                        {formatRwf(spotlight.sale_price ?? spotlight.base_price)}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {localize(locale, spotlight.unit_label_en, spotlight.unit_label_rw)}
                      </p>
                    </div>
                  </div>
                </Link>
                <div className="mt-5 space-y-2.5 border-t border-neutral-800 pt-5 text-sm text-neutral-300">
                  <p className="flex items-center gap-2.5">
                    <Truck size={16} className="shrink-0 text-brand-primary" aria-hidden="true" />
                    {t('trustDelivery')}
                  </p>
                  <p className="flex items-center gap-2.5">
                    <Smartphone size={16} className="shrink-0 text-brand-primary" aria-hidden="true" />
                    {t('trustPayment')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────── */}
      {visibleCategories.length > 0 && (
        <section id="categories" className="border-t border-neutral-800/70 bg-neutral-900/60 scroll-mt-16">
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
                  className="group rounded-2xl border border-neutral-800 bg-neutral-900 p-6 transition-all hover:border-brand-primary/50 hover:bg-neutral-800/80"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                    <CategoryIcon slug={cat.slug} size={22} />
                  </span>
                  <p className="mt-4 font-semibold text-white transition-colors group-hover:text-brand-primary">
                    {localize(locale, cat.name_en, cat.name_rw)}
                  </p>
                  <p className="mt-1 text-xs text-neutral-400">
                    {t('itemsCount', { count: categoryCounts[cat.id] ?? 0 })}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Featured materials ───────────────────────────────── */}
      {featured.length > 0 ? (
        <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <SectionHeader
            title={t('featuredTitle')}
            subtitle={t('featuredSubtitle')}
            href="/shop?sort=featured"
            linkLabel={tCommon('viewAll')}
            linkAriaLabel={`${tCommon('viewAll')} — ${t('featuredTitle')}`}
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
              linkAriaLabel={`${tCommon('viewAll')} — ${t('newArrivalsTitle')}`}
            />
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Stocked two ways ─────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <SectionHeader title={t('sourceTitle')} subtitle={t('sourceSubtitle')} />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="flex flex-col rounded-3xl border border-neutral-800 bg-neutral-900 p-8">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
              <Warehouse size={24} aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-xl font-bold text-white">{t('warehouseTitle')}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-400">{t('warehouseDesc')}</p>
            <Link
              href="/shop?source=internal"
              className="group mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary hover:text-amber-500"
            >
              {t('warehouseCta')}
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>
          <div className="flex flex-col rounded-3xl border border-neutral-800 bg-neutral-900 p-8">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400">
              <Handshake size={24} aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-xl font-bold text-white">{t('partnerSourceTitle')}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-400">{t('partnerSourceDesc')}</p>
            <Link
              href="/shop?source=dropship"
              className="group mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-purple-400 hover:text-purple-300"
            >
              {t('partnerSourceCta')}
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Brands strip */}
        {brands.length >= 2 && (
          <div className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-neutral-800/70 pt-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              {t('brandsTitle')}
            </p>
            {brands.map((brand) => (
              <span key={brand} className="text-lg font-bold uppercase tracking-wide text-neutral-400">
                {brand}
              </span>
            ))}
          </div>
        )}
      </section>

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
                  <span className="price text-3xl text-neutral-800" aria-hidden="true">
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

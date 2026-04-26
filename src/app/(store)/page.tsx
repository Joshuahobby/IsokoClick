import Link from 'next/link'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProductCard } from '@/components/store/product-card'
import { CONSTRUCTION_CATEGORIES } from '@/constants/app'
import { getFeaturedProducts, getBestSellers } from '@/lib/supabase/queries/products'
import type { ProductWithImages } from '@/lib/supabase/queries/products'

export default async function HomePage() {
  const [featured, bestSellers] = await Promise.all([
    getFeaturedProducts(3).catch(() => [] as ProductWithImages[]),
    getBestSellers(3).catch(() => [] as ProductWithImages[]),
  ])

  return (
    <div className="min-h-screen">

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden bg-neutral-950 px-4 py-20 text-center md:py-32">
        <div className="bg-grid-texture pointer-events-none absolute inset-0 opacity-[0.03]" />

        <div className="relative mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-pulse" />
            <span className="text-sm text-neutral-300">New Stock Arrived — Cement, Tiles & Steel</span>
          </div>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Build Rwanda,{' '}
            <span className="text-brand-primary">One Click</span>{' '}
            at a Time
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-neutral-400 sm:text-lg">
            Quality construction materials delivered to your site. Cement, steel, tiles, and more
            — from IsokoClick warehouses and trusted partners across Rwanda.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/shop">
              <Button size="lg" className="gap-2 rounded-full bg-white px-8 font-semibold text-neutral-900 hover:bg-neutral-100">
                Shop Now <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/shop?category=structure">
              <Button size="lg" variant="ghost" className="gap-2 rounded-full border border-neutral-700 px-8 text-neutral-300 hover:border-neutral-500 hover:text-white">
                Browse Categories
              </Button>
            </Link>
          </div>

          <div className="mt-14 flex flex-wrap items-center justify-center gap-8 text-center">
            {[
              { value: '2,000+',   label: 'Products' },
              { value: '50+',      label: 'Partners' },
              { value: 'Same-day', label: 'Dispatch (Kigali)' },
              { value: 'PawaPay',  label: 'Mobile Money' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-neutral-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Category Grid ── */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Shop by Category</h2>
          <Link href="/shop" className="flex items-center gap-1 text-sm text-neutral-400 hover:text-white transition-colors">
            View all <ChevronRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {CONSTRUCTION_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/shop?category=${cat.slug}`}
              className="group flex flex-col items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-center transition-all hover:border-brand-primary/50 hover:bg-neutral-800"
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-xs font-medium text-neutral-300 group-hover:text-white leading-tight">
                {cat.name_en}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured Products ── */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16 md:px-8">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Featured Products</h2>
            <Link href="/shop?sort=featured" className="flex items-center gap-1 text-sm text-neutral-400 hover:text-white transition-colors">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ── Promotional Banner ── */}
      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-brand-primary px-8 py-12 text-center">
          <div className="bg-stripe-texture pointer-events-none absolute inset-0 opacity-10" />
          <div className="relative">
            <Badge className="mb-4 bg-white/20 text-white border-0">B2B & Bulk Orders</Badge>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Building a project? Get trade prices.
            </h2>
            <p className="mt-3 text-amber-100">
              Contractors and businesses get access to bulk pricing, credit terms, and dedicated support.
            </p>
            <Link href="/b2b" className="mt-6 inline-block">
              <Button size="lg" className="rounded-full bg-white px-8 font-semibold text-orange-600 hover:bg-orange-50">
                Apply for B2B Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Best Sellers ── */}
      {bestSellers.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-20 md:px-8">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Best Sellers</h2>
            <Link href="/shop?sort=newest" className="flex items-center gap-1 text-sm text-neutral-400 hover:text-white transition-colors">
              View more <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { getStoreProducts } from '@/lib/supabase/queries/store'
import { formatRwf } from '@/lib/utils/currency'
import { Badge } from '@/components/ui/badge'
import { AddToCartButton } from '@/components/store/AddToCartButton'

export const metadata = {
  title: 'IsokoClick | Premium Wholesale & Dropshipping',
  description: 'Rwanda\'s premier destination for wholesale, B2B, and dropship products.',
}

export default async function StoreHomePage() {
  const { products } = await getStoreProducts(1, 24)

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-brand-primary">
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-10 mix-blend-overlay"></div>
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="max-w-2xl text-white">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Quality products, <br className="hidden sm:block" />
              unbeatable wholesale prices.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-brand-primary-foreground/90">
              Source premium goods directly from verified partners and our own internal warehouses. Designed for businesses and smart shoppers across Rwanda.
            </p>
            <div className="mt-10 flex gap-4">
              <Link
                href="#products"
                className="rounded-full bg-white px-8 py-3.5 text-sm font-bold text-brand-primary transition-transform hover:scale-105"
              >
                Start Shopping
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories (Static for now) */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Shop by Category</h2>
              <p className="text-sm text-neutral-500 mt-1">Explore our wide range of wholesale supplies.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {['Agriculture', 'Construction', 'Electronics', 'Groceries', 'Hardware', 'Textiles'].map((cat) => (
              <Link key={cat} href={`/category/${cat.toLowerCase()}`} className="group relative flex h-32 flex-col items-center justify-center overflow-hidden rounded-2xl bg-neutral-100 transition-colors hover:bg-brand-primary/10">
                <span className="font-semibold text-neutral-700 transition-colors group-hover:text-brand-primary">{cat}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section id="products" className="bg-neutral-50 py-16 flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Latest Arrivals</h2>
          </div>

          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <ShoppingCart size={48} className="text-neutral-300 mb-4" />
              <h3 className="text-lg font-medium text-neutral-900">No products available</h3>
              <p className="mt-1 text-sm text-neutral-500">Check back later or apply to become a partner to list your products.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
              {products.map((product) => (
                <div key={product.id} className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-lg">
                  {/* Image Placeholder */}
                  <div className="aspect-[4/3] bg-neutral-100 flex items-center justify-center relative">
                    <span className="text-neutral-400 font-medium">No Image</span>
                    {product.sale_price && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-red-500 text-white hover:bg-red-600 border-0">Sale</Badge>
                      </div>
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <h3 className="text-base font-semibold text-neutral-900 line-clamp-2">
                        <Link href={`/product/${product.slug}`}>
                          <span aria-hidden="true" className="absolute inset-0"></span>
                          {product.name_en}
                        </Link>
                      </h3>
                    </div>
                    
                    <p className="text-sm text-neutral-500 mb-4">{product.brand || product.category || 'Uncategorized'}</p>
                    
                    <div className="mt-auto flex items-end justify-between">
                      <div>
                        {product.sale_price ? (
                          <div className="flex flex-col">
                            <span className="text-sm text-neutral-400 line-through">{formatRwf(product.base_price)}</span>
                            <span className="text-lg font-bold text-neutral-900">{formatRwf(product.sale_price)}</span>
                          </div>
                        ) : (
                          <span className="text-lg font-bold text-neutral-900">{formatRwf(product.base_price)}</span>
                        )}
                        <span className="text-xs text-neutral-500 block mt-0.5">/{product.unit_label_en}</span>
                      </div>
                      
                      <AddToCartButton product={product} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

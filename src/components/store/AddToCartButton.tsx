'use client'

import { useTranslations } from 'next-intl'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/hooks/use-cart'
import type { StoreProduct } from '@/lib/supabase/queries/store'

export function AddToCartButton({ product }: { product: StoreProduct }) {
  const t = useTranslations('common')
  const addItem = useCartStore((state) => state.addItem)

  return (
    <button
      onClick={() => {
        addItem({
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.sale_price ?? product.base_price,
          minQty: 1,
          unitType: 'piece', // Hardcoding for simplified example, in real use map properly
          imageUrl: null,
          source: product.source,
        })
      }}
      className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-brand-primary hover:text-white"
    >
      <ShoppingCart size={18} />
      <span className="sr-only">{t('addToCart')}</span>
    </button>
  )
}

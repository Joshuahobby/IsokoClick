'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ShoppingCart, Minus, Plus, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/hooks/use-cart'
import type { ProductRow } from '@/types/database'

type Props = {
  product: Pick<ProductRow, 'id' | 'slug' | 'source' | 'min_order_qty' | 'base_price' | 'sale_price' | 'unit_type'>
  /** Localized display name — stored in the cart as-is. */
  name: string
  imageUrl?: string | null
}

export function AddToCartButton({ product, name, imageUrl }: Props) {
  const tCommon = useTranslations('common')
  const tProduct = useTranslations('product')
  const [qty, setQty] = useState(product.min_order_qty)
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)

  function handleAddToCart() {
    addItem({
      id: product.id,
      slug: product.slug,
      name,
      price: product.sale_price ?? product.base_price,
      qty,
      minQty: product.min_order_qty,
      unitType: product.unit_type,
      imageUrl: imageUrl ?? null,
      source: product.source,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div
        className="flex items-center rounded-xl border border-neutral-700"
        role="group"
        aria-label={tProduct('quantity')}
      >
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(product.min_order_qty, q - 1))}
          disabled={qty <= product.min_order_qty}
          className="flex h-11 w-11 items-center justify-center text-neutral-400 transition-colors hover:text-white disabled:opacity-30"
          aria-label="Decrease quantity"
        >
          <Minus size={14} />
        </button>
        <span className="min-w-[40px] text-center text-sm font-medium text-white">{qty}</span>
        <button
          type="button"
          onClick={() => setQty((q) => q + 1)}
          className="flex h-11 w-11 items-center justify-center text-neutral-400 transition-colors hover:text-white"
          aria-label="Increase quantity"
        >
          <Plus size={14} />
        </button>
      </div>

      <Button
        size="lg"
        onClick={handleAddToCart}
        className={cn(
          'flex-1 gap-2 rounded-xl font-semibold transition-colors',
          added
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-brand-primary text-neutral-950 hover:bg-amber-600'
        )}
      >
        {added ? (
          <>
            <Check size={18} />
            {tCommon('addedToCart')}
          </>
        ) : (
          <>
            <ShoppingCart size={18} />
            {tCommon('addToCart')}
          </>
        )}
      </Button>
    </div>
  )
}

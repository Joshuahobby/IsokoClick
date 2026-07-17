'use client'

import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/hooks/use-cart'
import type { InventorySource, UnitType } from '@/types/database'

type Props = {
  id: string
  slug: string
  name: string
  price: number
  minQty: number
  unitType: UnitType
  imageUrl: string | null
  source: InventorySource
}

export function QuickAddButton({ id, slug, name, price, minQty, unitType, imageUrl, source }: Props) {
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)

  function handleClick() {
    addItem({ id, slug, name, price, qty: minQty, minQty, unitType, imageUrl, source })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    // relative z-10 keeps the button above the card's stretched product link
    <button
      type="button"
      onClick={handleClick}
      className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-primary text-neutral-950 transition-colors hover:bg-amber-600"
      aria-label={`Add ${name} to cart`}
    >
      {added ? <span className="text-xs font-bold">+{minQty}</span> : <ShoppingCart size={17} />}
    </button>
  )
}

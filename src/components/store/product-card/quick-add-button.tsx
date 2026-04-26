'use client'

import { useState } from 'react'
import { ShoppingCart, Check } from 'lucide-react'
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

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    addItem({ id, slug, name, price, qty: minQty, minQty, unitType, imageUrl, source })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-white opacity-0 transition-all group-hover:opacity-100 hover:bg-amber-600"
      aria-label={`Add ${name} to cart`}
    >
      {added ? <Check size={14} /> : <ShoppingCart size={14} />}
    </button>
  )
}

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { InventorySource, UnitType } from '@/types/database'

export type CartItem = {
  id: string
  slug: string
  name: string
  price: number
  qty: number
  minQty: number
  unitType: UnitType
  imageUrl: string | null
  source: InventorySource
}

type CartStore = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'qty'> & { qty?: number }) => void
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clearCart: () => void
  totalItems: () => number
  totalPrice: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: ({ qty = 1, ...incoming }) => {
        set((state) => {
          const existing = state.items.find((i) => i.id === incoming.id)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === incoming.id ? { ...i, qty: i.qty + qty } : i
              ),
            }
          }
          return { items: [...state.items, { ...incoming, qty }] }
        })
      },

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      updateQty: (id, qty) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id
              ? // Clamp to a whole number no lower than the product's
                // minimum order quantity (NaN and negatives become the min)
                { ...i, qty: Math.max(Math.max(1, i.minQty), Math.floor(qty) || 1) }
              : i
          ),
        })),

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((n, i) => n + i.qty, 0),

      totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
    }),
    { name: 'isokoclick-cart' }
  )
)

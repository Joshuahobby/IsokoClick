'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingCart, X, Plus, Minus, Trash2 } from 'lucide-react'
import { useCartStore } from '@/hooks/use-cart'
import { formatRwf } from '@/lib/utils/currency'

export function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  const items = useCartStore((state) => state.items)
  const removeItem = useCartStore((state) => state.removeItem)
  const updateQty = useCartStore((state) => state.updateQty)
  const totalItems = useCartStore((state) => state.totalItems())
  const totalPrice = useCartStore((state) => state.totalPrice())

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button className="relative text-neutral-600 hover:text-brand-primary">
        <ShoppingCart size={22} />
      </button>
    )
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="relative text-neutral-600 hover:text-brand-primary"
      >
        <ShoppingCart size={22} />
        {totalItems > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold text-white">
            {totalItems}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Drawer */}
          <div className="relative w-full max-w-md bg-white shadow-2xl transition-transform flex flex-col h-full animate-in slide-in-from-right">
            <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
              <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <ShoppingCart size={20} className="text-brand-primary" /> 
                Your Cart
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingCart size={48} className="text-neutral-200 mb-4" />
                  <p className="text-neutral-500">Your cart is currently empty.</p>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="mt-6 font-medium text-brand-primary hover:underline"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-neutral-50 flex items-center justify-center">
                        <span className="text-xs text-neutral-400">No Image</span>
                      </div>

                      <div className="flex flex-1 flex-col">
                        <div className="flex justify-between text-sm font-medium text-neutral-900">
                          <h3 className="line-clamp-2 pr-4">{item.name}</h3>
                          <p className="ml-4">{formatRwf(item.price * item.qty)}</p>
                        </div>
                        <p className="mt-1 text-sm text-neutral-500">{formatRwf(item.price)} /{item.unitType}</p>
                        
                        <div className="flex flex-1 items-end justify-between text-sm">
                          <div className="flex items-center rounded-md border border-neutral-200">
                            <button 
                              onClick={() => item.qty > 1 && updateQty(item.id, item.qty - 1)}
                              className="p-1 text-neutral-500 hover:text-neutral-900 disabled:opacity-50"
                              disabled={item.qty <= 1}
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center font-medium text-neutral-900">{item.qty}</span>
                            <button 
                              onClick={() => updateQty(item.id, item.qty + 1)}
                              className="p-1 text-neutral-500 hover:text-neutral-900"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <button 
                            type="button" 
                            onClick={() => removeItem(item.id)}
                            className="font-medium text-red-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-neutral-200 px-6 py-6 bg-neutral-50">
                <div className="flex justify-between text-base font-medium text-neutral-900 mb-4">
                  <p>Subtotal</p>
                  <p>{formatRwf(totalPrice)}</p>
                </div>
                <p className="mt-0.5 text-sm text-neutral-500 mb-6">
                  Delivery and taxes calculated at checkout.
                </p>
                <Link
                  href="/checkout"
                  onClick={() => setIsOpen(false)}
                  className="flex w-full items-center justify-center rounded-md border border-transparent bg-brand-primary px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-brand-primary/90"
                >
                  Checkout
                </Link>
                <div className="mt-4 flex justify-center text-center text-sm text-neutral-500">
                  <p>
                    or{' '}
                    <button
                      type="button"
                      className="font-medium text-brand-primary hover:text-brand-primary/80"
                      onClick={() => setIsOpen(false)}
                    >
                      Continue Shopping
                      <span aria-hidden="true"> &rarr;</span>
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

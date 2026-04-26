'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight } from 'lucide-react'
import { useCartStore } from '@/hooks/use-cart'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { formatRwf } from '@/lib/utils/currency'
import { MIN_ORDER_VALUE } from '@/constants/app'

export default function CartPage() {
  const { items, removeItem, updateQty, clearCart, totalPrice } = useCartStore()
  const total = totalPrice()
  const meetsMinimum = total >= MIN_ORDER_VALUE

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <ShoppingCart size={48} className="mb-4 text-neutral-600" />
        <h1 className="text-xl font-bold text-white">Your cart is empty</h1>
        <p className="mt-2 text-sm text-neutral-400">Browse our catalog and add some products.</p>
        <Link href="/shop" className="mt-6">
          <Button className="rounded-full bg-brand-primary text-white hover:bg-amber-600">
            Shop Now
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Your Cart</h1>
        <button
          type="button"
          onClick={clearCart}
          className="text-sm text-neutral-500 transition-colors hover:text-red-400"
        >
          Clear cart
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

        {/* Items list */}
        <div className="space-y-4 lg:col-span-2">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-4">

              {/* Thumbnail */}
              <Link
                href={`/product/${item.slug}`}
                className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-800"
              >
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-neutral-600">
                    <ShoppingCart size={20} />
                  </div>
                )}
              </Link>

              {/* Info */}
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/product/${item.slug}`}
                      className="line-clamp-2 text-sm font-semibold text-white hover:text-brand-primary"
                    >
                      {item.name}
                    </Link>
                    <div className="mt-0.5">
                      {item.source === 'internal' ? (
                        <Badge className="border-0 bg-brand-primary/20 text-[10px] text-brand-primary">
                          IsokoClick Stock
                        </Badge>
                      ) : (
                        <Badge className="border-0 bg-purple-600/20 text-[10px] text-purple-400">
                          Partner Stock
                        </Badge>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="shrink-0 p-1 text-neutral-600 transition-colors hover:text-red-400"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  {/* Qty stepper */}
                  <div className="flex items-center rounded-lg border border-neutral-700">
                    <button
                      type="button"
                      onClick={() => updateQty(item.id, Math.max(item.minQty, item.qty - 1))}
                      disabled={item.qty <= item.minQty}
                      className="flex h-8 w-8 items-center justify-center text-neutral-400 transition-colors hover:text-white disabled:opacity-30"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="min-w-[32px] text-center text-sm text-white">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      className="flex h-8 w-8 items-center justify-center text-neutral-400 transition-colors hover:text-white"
                      aria-label="Increase quantity"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  <span className="text-sm font-semibold text-white">
                    {formatRwf(item.price * item.qty)}
                  </span>
                </div>

                <p className="text-xs text-neutral-500">
                  {formatRwf(item.price)} / {item.unitType}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div>
          <div className="sticky top-24 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="mb-4 text-base font-semibold text-white">Order Summary</h2>

            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between gap-2 text-sm">
                  <span className="line-clamp-1 flex-1 text-neutral-400">
                    {item.name} ×{item.qty}
                  </span>
                  <span className="shrink-0 text-white">{formatRwf(item.price * item.qty)}</span>
                </div>
              ))}
            </div>

            <Separator className="my-4 bg-neutral-800" />

            <div className="flex justify-between text-sm">
              <span className="text-neutral-300">Delivery</span>
              <span className="text-neutral-400">Calculated at checkout</span>
            </div>

            <Separator className="my-4 bg-neutral-800" />

            <div className="flex items-baseline justify-between">
              <span className="font-semibold text-white">Total</span>
              <span className="text-lg font-bold text-white">{formatRwf(total)}</span>
            </div>

            {!meetsMinimum && (
              <p className="mt-3 text-xs text-amber-400">
                Minimum order: {formatRwf(MIN_ORDER_VALUE)}. Add{' '}
                {formatRwf(MIN_ORDER_VALUE - total)} more to proceed.
              </p>
            )}

            <Link href="/checkout" className="mt-5 block">
              <Button
                disabled={!meetsMinimum}
                className="w-full gap-2 rounded-xl bg-brand-primary font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
              >
                Checkout <ArrowRight size={16} />
              </Button>
            </Link>

            <Link href="/shop" className="mt-3 block">
              <Button variant="ghost" className="w-full text-neutral-400 hover:text-white">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

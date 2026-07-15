'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useCartStore } from '@/hooks/use-cart'
import { formatRwf } from '@/lib/utils/currency'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function CheckoutClient() {
  const t = useTranslations('checkout')
  const router = useRouter()
  const items = useCartStore((state) => state.items)
  const totalPrice = useCartStore((state) => state.totalPrice())
  const clearCart = useCartStore((state) => state.clearCart)

  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState('')

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">{t('emptyTitle')}</h2>
        <p className="text-neutral-500 mb-6">{t('emptySubtext')}</p>
        <Link href="/" className="rounded-lg bg-brand-primary px-6 py-2.5 font-semibold text-white hover:bg-brand-primary/90">
          {t('continueShopping')}
        </Link>
      </div>
    )
  }

  async function handleCheckout(formData: FormData) {
    setIsPending(true)
    setError('')

    // Only ids and quantities are sent — prices, sources, and delivery
    // fees are all re-derived server-side from the database.
    const payload = {
      items: items.map((item) => ({ id: item.id, qty: item.qty })),
      deliveryDetails: {
        fullName: `${formData.get('first_name')} ${formData.get('last_name')}`.trim(),
        phone: String(formData.get('phone') ?? ''),
        district: String(formData.get('district') ?? ''),
        address: String(formData.get('address') ?? ''),
      },
      paymentMethod: String(formData.get('payment_method') ?? 'momo'),
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.status === 401) {
        router.push('/login?redirectTo=/checkout')
        return
      }

      const json = (await res.json()) as {
        data: { orderId: string } | null
        error: string | null
      }

      if (!res.ok || !json.data) {
        setError(json.error ?? t('genericError'))
        setIsPending(false)
        return
      }

      clearCart()
      router.push(`/orders/${json.data.orderId}`)
    } catch {
      setError(t('genericError'))
      setIsPending(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
      {/* Checkout Form */}
      <div className="lg:col-span-7">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-neutral-900">{t('deliveryInformation')}</h2>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <form action={handleCheckout} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="first_name">{t('firstName')}</Label>
              <Input id="first_name" name="first_name" required placeholder="John" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">{t('lastName')}</Label>
              <Input id="last_name" name="last_name" required placeholder="Doe" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">{t('phone')}</Label>
            <Input id="phone" name="phone" type="tel" required placeholder="078..." />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="district">{t('district')}</Label>
            <Input id="district" name="district" required placeholder="Gasabo" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">{t('address')}</Label>
            <Input id="address" name="address" required placeholder="KG 11 Ave" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payment_method">{t('paymentMethod')}</Label>
            <select
              id="payment_method"
              name="payment_method"
              required
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="momo">{t('momo')}</option>
              <option value="cash">{t('cash')}</option>
            </select>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-brand-primary px-6 py-3.5 text-center text-sm font-bold text-white shadow-sm hover:bg-brand-primary/90 disabled:opacity-50"
            >
              {isPending ? t('processing') : t('placeOrder')}
            </button>
          </div>
        </form>
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-5">
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 sticky top-24">
          <h2 className="text-lg font-bold text-neutral-900 mb-6">{t('orderSummary')}</h2>

          <div className="flow-root mb-6 border-b border-neutral-200 pb-6">
            <ul className="-my-4 divide-y divide-neutral-200">
              {items.map((item) => (
                <li key={item.id} className="flex py-4">
                  <div className="ml-4 flex flex-1 flex-col">
                    <div className="flex justify-between text-base font-medium text-neutral-900">
                      <h3 className="line-clamp-2 pr-4">{item.name}</h3>
                      <p className="ml-4">{formatRwf(item.price * item.qty)}</p>
                    </div>
                    <p className="mt-1 text-sm text-neutral-500">{t('qty', { qty: item.qty })}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 text-sm font-medium text-neutral-900">
            <div className="flex justify-between">
              <p>{t('subtotal')}</p>
              <p>{formatRwf(totalPrice)}</p>
            </div>
            <div className="flex justify-between">
              <p>{t('deliveryFee')}</p>
              <p className="text-green-600">{t('feeByDistrict')}</p>
            </div>
            <div className="flex justify-between border-t border-neutral-200 pt-3 text-lg font-bold">
              <p>{t('totalEstimated')}</p>
              <p>{formatRwf(totalPrice)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

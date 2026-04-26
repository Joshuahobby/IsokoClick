'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ShoppingCart,
  Smartphone,
  MapPin,
  User,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react'
import { useCartStore } from '@/hooks/use-cart'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { formatRwf } from '@/lib/utils/currency'
import { MIN_ORDER_VALUE } from '@/constants/app'
import type { CartItem } from '@/hooks/use-cart'

type CheckoutState = 'form' | 'awaiting' | 'success' | 'failed'

function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (digits.startsWith('250') && digits.length === 12) return digits
  if (digits.startsWith('0') && digits.length === 10) return `250${digits.slice(1)}`
  if (digits.length === 9) return `250${digits}`
  return digits
}

function detectOperator(input: string): 'MTN' | 'AIRTEL' | null {
  const phone = normalizePhone(input)
  if (phone.length < 12) return null
  const sub = phone.slice(3, 5)
  if (sub === '78' || sub === '79') return 'MTN'
  if (sub === '72' || sub === '73') return 'AIRTEL'
  return null
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalPrice, clearCart } = useCartStore()
  const total = totalPrice()

  const [state, setState] = useState<CheckoutState>('form')
  const [orderId, setOrderId] = useState<string | null>(null)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [district, setDistrict] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const operator = detectOperator(phone)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Redirect if cart is invalid
  useEffect(() => {
    if (items.length === 0 || total < MIN_ORDER_VALUE) {
      router.replace('/cart')
    }
  }, [items.length, total, router])

  // Pre-fill name from auth profile
  useEffect(() => {
    async function prefill() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user?.user_metadata?.full_name) {
        setFullName(String(user.user_metadata.full_name))
      }
    }
    prefill()
  }, [])

  // Poll payment status while awaiting
  useEffect(() => {
    if (state !== 'awaiting' || !orderId) return

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/status?orderId=${orderId}`)
        const json = (await res.json()) as { data?: { status?: string } }
        const status = json.data?.status

        if (status === 'completed') {
          clearInterval(pollingRef.current!)
          clearCart()
          setState('success')
        } else if (status === 'failed') {
          clearInterval(pollingRef.current!)
          setState('failed')
        }
      } catch {
        // Network hiccup — keep polling
      }
    }, 3000)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [state, orderId, clearCart])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const normalized = normalizePhone(phone)
    if (!operator || normalized.length !== 12) {
      setError('Enter a valid Rwandan mobile money number (MTN 078/079 or Airtel 072/073).')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items as CartItem[],
          deliveryDetails: { fullName, phone: normalized, district, notes },
        }),
      })

      const json = (await res.json()) as {
        data?: { orderId: string; orderNumber: string }
        error?: string
      }

      if (!res.ok || json.error) {
        setError(json.error ?? 'Could not place order. Please try again.')
        setLoading(false)
        return
      }

      setOrderId(json.data!.orderId)
      setOrderNumber(json.data!.orderNumber)
      setState('awaiting')
    } catch {
      setError('Network error. Please check your connection and try again.')
      setLoading(false)
    }
  }

  if (items.length === 0) return null

  if (state === 'awaiting') {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary/20">
          <Smartphone size={28} className="text-brand-primary" />
        </div>
        <h1 className="text-2xl font-bold text-white">Check your phone</h1>
        <p className="mt-3 max-w-sm text-neutral-400">
          A mobile money request was sent to{' '}
          <span className="font-semibold text-white">{phone}</span>. Enter your PIN to
          approve the payment.
        </p>
        <div className="mt-6 flex items-center gap-2 text-sm text-neutral-500">
          <Loader2 size={15} className="animate-spin" />
          <span>Waiting for confirmation…</span>
        </div>
        <p className="mt-8 text-xs text-neutral-600">
          {orderNumber ?? ''} · {formatRwf(total)}
        </p>
      </div>
    )
  }

  if (state === 'success') {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-16 text-center">
        <CheckCircle size={52} className="mb-4 text-green-500" />
        <h1 className="text-2xl font-bold text-white">Payment confirmed!</h1>
        <p className="mt-2 text-neutral-400">
          Your order <span className="font-medium text-white">{orderNumber}</span> has been placed.
        </p>
        <Link href={`/orders/${orderId}`} className="mt-6">
          <Button className="rounded-xl bg-brand-primary text-white hover:bg-amber-600">
            View Order
          </Button>
        </Link>
      </div>
    )
  }

  if (state === 'failed') {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-16 text-center">
        <XCircle size={52} className="mb-4 text-red-500" />
        <h1 className="text-2xl font-bold text-white">Payment failed</h1>
        <p className="mt-2 text-neutral-400">
          The mobile money request was not completed.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href={`/orders/${orderId}`}>
            <Button variant="ghost" className="text-neutral-400 hover:text-white">
              View Order
            </Button>
          </Link>
          <Button
            onClick={() => setState('form')}
            className="rounded-xl bg-brand-primary text-white hover:bg-amber-600"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
      <h1 className="mb-8 text-2xl font-bold text-white">Checkout</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-2">

          {/* Delivery */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-white">
              <User size={15} className="text-brand-primary" />
              Contact &amp; Delivery
            </h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-neutral-300">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jean Claude Niyonzima"
                  required
                  autoComplete="name"
                  className="border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-600"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="district" className="text-neutral-300">
                  <MapPin size={11} className="mr-1 inline" />
                  District / area
                </Label>
                <Input
                  id="district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Gasabo, Kigali"
                  required
                  className="border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-600"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-neutral-300">
                  Delivery notes <span className="text-neutral-600">(optional)</span>
                </Label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Street name, landmark, or special instructions…"
                  rows={3}
                  className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-white">
              <Smartphone size={15} className="text-brand-primary" />
              Mobile Money Payment
            </h2>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-neutral-300">Mobile money number</Label>
              <div className="flex gap-2">
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07X XXX XXXX"
                  required
                  autoComplete="tel"
                  className="border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-600"
                />
                {operator && (
                  <span
                    className={`flex shrink-0 items-center rounded-lg px-3 text-xs font-bold ${
                      operator === 'MTN'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {operator}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-600">MTN MoMo (078/079) or Airtel Money (072/073)</p>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !operator}
            className="w-full gap-2 rounded-xl bg-brand-primary py-3 font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Placing order…
              </>
            ) : (
              `Pay ${formatRwf(total)}`
            )}
          </Button>
        </form>

        {/* Order summary */}
        <div className="h-fit lg:sticky lg:top-24">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
              <ShoppingCart size={15} />
              Order Summary
            </h2>
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
              <span className="text-neutral-400">Delivery</span>
              <span className="text-neutral-500 italic">Calculated at fulfillment</span>
            </div>
            <Separator className="my-4 bg-neutral-800" />
            <div className="flex items-baseline justify-between">
              <span className="font-semibold text-white">Total</span>
              <span className="text-lg font-bold text-white">{formatRwf(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

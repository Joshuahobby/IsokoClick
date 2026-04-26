import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle,
  Clock,
  XCircle,
  Package,
  Truck,
  ChevronRight,
  Smartphone,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getOrderById, getUserProfileId } from '@/lib/supabase/queries/orders'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatRwf } from '@/lib/utils/currency'
import type { OrderStatus, PaymentStatus } from '@/types/database'

type Props = { params: Promise<{ id: string }> }

export const metadata: Metadata = { title: 'Order Details' }

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  partially_fulfilled: 'Partially Fulfilled',
  fulfilled: 'Fulfilled',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; icon: React.ElementType; color: string }
> = {
  pending: { label: 'Payment Pending', icon: Clock, color: 'text-neutral-400' },
  initiated: { label: 'Awaiting Approval', icon: Smartphone, color: 'text-amber-400' },
  completed: { label: 'Payment Received', icon: CheckCircle, color: 'text-green-500' },
  failed: { label: 'Payment Failed', icon: XCircle, color: 'text-red-500' },
  refunded: { label: 'Refunded', icon: CheckCircle, color: 'text-blue-400' },
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) redirect(`/auth/login?redirectTo=/orders/${id}`)

  const customerId = await getUserProfileId(authUser.id)
  if (!customerId) redirect('/auth/login')

  const order = await getOrderById(id, customerId)
  if (!order) notFound()

  const payment = order.payments[0] ?? null
  const paymentStatus = (payment?.status ?? 'pending') as PaymentStatus
  const paymentConfig = PAYMENT_STATUS_CONFIG[paymentStatus]
  const PaymentIcon = paymentConfig.icon

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-8">

      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-1.5 text-sm text-neutral-500">
        <Link href="/" className="hover:text-white">Home</Link>
        <ChevronRight size={14} />
        <Link href="/account/orders" className="hover:text-white">Orders</Link>
        <ChevronRight size={14} />
        <span className="text-neutral-300">{order.order_number}</span>
      </nav>

      {/* Payment status hero */}
      <div className="mb-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-center">
        <PaymentIcon size={44} className={`mx-auto mb-3 ${paymentConfig.color}`} />
        <h1 className="text-xl font-bold text-white">{paymentConfig.label}</h1>
        <p className="mt-1 text-sm text-neutral-500">Order {order.order_number}</p>

        {paymentStatus === 'initiated' && (
          <p className="mt-3 text-sm text-amber-400/80">
            A mobile money request was sent to your phone. Please approve to confirm your order.
          </p>
        )}
        {paymentStatus === 'failed' && (
          <div className="mt-4">
            <Link href="/checkout">
              <Button className="bg-brand-primary text-white hover:bg-amber-600">
                Try Payment Again
              </Button>
            </Link>
          </div>
        )}
        {paymentStatus === 'completed' && (
          <p className="mt-3 text-sm text-neutral-400">
            Thank you! Your order is being processed.
          </p>
        )}
      </div>

      {/* Order details */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

        {/* Status card */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <Package size={15} className="text-brand-primary" />
            Order Status
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Order</span>
              <Badge className="border-0 bg-neutral-800 text-neutral-300">
                {ORDER_STATUS_LABEL[order.status]}
              </Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Type</span>
              <span className="text-white uppercase">{order.order_type}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Placed</span>
              <span className="text-white">
                {new Date(order.created_at).toLocaleDateString('en-RW', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Delivery card */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <Truck size={15} className="text-brand-primary" />
            Delivery
          </h2>
          {order.notes ? (
            (() => {
              type DeliveryDetails = { fullName?: string; district?: string; notes?: string }
              let details: DeliveryDetails = {}
              try {
                const parsed = JSON.parse(order.notes) as { deliveryDetails?: DeliveryDetails }
                details = parsed.deliveryDetails ?? {}
              } catch {}
              return (
                <div className="space-y-1 text-sm">
                  {details.fullName && (
                    <p className="font-medium text-white">{details.fullName}</p>
                  )}
                  {details.district && (
                    <p className="text-neutral-400">{details.district}</p>
                  )}
                  {details.notes && (
                    <p className="text-neutral-500">{details.notes}</p>
                  )}
                </div>
              )
            })()
          ) : (
            <p className="text-sm text-neutral-500">No delivery details recorded.</p>
          )}
        </div>
      </div>

      {/* Order items */}
      <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="mb-4 text-sm font-semibold text-white">Items</h2>
        <div className="space-y-3">
          {order.order_items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 text-sm">
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 font-medium text-white">{item.product_name}</p>
                <p className="text-xs text-neutral-500">
                  {formatRwf(item.unit_price)} × {item.qty}
                </p>
              </div>
              <span className="shrink-0 font-semibold text-white">
                {formatRwf(item.subtotal)}
              </span>
            </div>
          ))}
        </div>

        <Separator className="my-4 bg-neutral-800" />

        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-400">Subtotal</span>
            <span className="text-white">{formatRwf(order.subtotal)}</span>
          </div>
          {order.discount_amount > 0 && (
            <div className="flex justify-between">
              <span className="text-neutral-400">Discount</span>
              <span className="text-green-400">-{formatRwf(order.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-neutral-400">Delivery</span>
            <span className="text-neutral-500 italic">
              {order.delivery_fee > 0 ? formatRwf(order.delivery_fee) : 'TBD'}
            </span>
          </div>
          <Separator className="my-2 bg-neutral-800" />
          <div className="flex justify-between font-semibold">
            <span className="text-white">Total</span>
            <span className="text-white">{formatRwf(order.total_amount)}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Link href="/shop" className="flex-1">
          <Button variant="ghost" className="w-full text-neutral-400 hover:text-white">
            Continue Shopping
          </Button>
        </Link>
        <Link href="/account/orders" className="flex-1">
          <Button variant="outline" className="w-full border-neutral-700 text-white hover:bg-neutral-800">
            All Orders
          </Button>
        </Link>
      </div>
    </div>
  )
}

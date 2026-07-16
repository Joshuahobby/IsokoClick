import { redirect } from 'next/navigation'
import { ShoppingBag } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getPartnerByUserId, getPartnerOrderItems } from '@/lib/supabase/queries/partners'
import { formatRwf } from '@/lib/utils/currency'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Orders — Partner Portal' }

const ORDER_STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending:             { label: 'Pending',        className: 'bg-neutral-800 text-neutral-300' },
  confirmed:           { label: 'Confirmed',      className: 'bg-blue-500/20 text-blue-400' },
  processing:          { label: 'Processing',     className: 'bg-amber-500/20 text-amber-400' },
  partially_fulfilled: { label: 'Part Fulfilled', className: 'bg-amber-500/20 text-amber-400' },
  fulfilled:           { label: 'Fulfilled',      className: 'bg-green-500/20 text-green-400' },
  shipped:             { label: 'Shipped',        className: 'bg-blue-500/20 text-blue-400' },
  delivered:           { label: 'Delivered',      className: 'bg-green-500/20 text-green-400' },
  cancelled:           { label: 'Cancelled',      className: 'bg-red-500/20 text-red-400' },
  refunded:            { label: 'Refunded',       className: 'bg-neutral-700 text-neutral-400' },
}

export default async function PartnerOrdersPage(
  props: { searchParams?: Promise<{ page?: string }> }
) {
  const searchParams = await props.searchParams
  const currentPage = Number(searchParams?.page) || 1
  
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const partner = await getPartnerByUserId(user.id)
  if (!partner) redirect('/partner/dashboard')

  const { items, total } = await getPartnerOrderItems(partner.id, currentPage)

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Orders</h1>
        <p className="mt-1 text-sm text-neutral-400">Track orders containing your products.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-800 bg-neutral-950/50">
              <tr>
                <th className="px-6 py-4 font-medium text-neutral-400">Order ID</th>
                <th className="px-6 py-4 font-medium text-neutral-400">Product</th>
                <th className="px-6 py-4 font-medium text-neutral-400">Qty / Price</th>
                <th className="px-6 py-4 font-medium text-neutral-400">Status</th>
                <th className="px-6 py-4 font-medium text-neutral-400 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                    <ShoppingBag size={24} className="mx-auto mb-2 text-neutral-700" />
                    No orders found.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const statusCfg = ORDER_STATUS_BADGE[item.order.status] || { label: item.order.status, className: 'bg-neutral-800 text-neutral-400' }
                  return (
                    <tr key={item.id} className="transition-colors hover:bg-neutral-800/50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{item.order.order_number}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{item.product?.name_en ?? 'Product'}</div>
                      </td>
                      <td className="px-6 py-4 text-neutral-300">
                        {item.quantity} × {formatRwf(item.unit_price)}
                        <div className="font-medium text-brand-primary mt-0.5">{formatRwf(item.total_price)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`border-0 ${statusCfg.className}`}>
                          {statusCfg.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right text-neutral-400">
                        {new Date(item.order.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        {/* Simple Pagination Placeholder */}
        {total > 25 && (
          <div className="border-t border-neutral-800 p-4 text-center text-xs text-neutral-500">
            Showing {items.length} of {total} items
          </div>
        )}
      </div>
    </div>
  )
}

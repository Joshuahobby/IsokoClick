import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getPartnerByUserId, getPartnerProducts } from '@/lib/supabase/queries/partners'
import { formatRwf } from '@/lib/utils/currency'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Catalog — Partner Portal' }

export default async function PartnerCatalogPage(
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

  const { products, total } = await getPartnerProducts(partner.id, currentPage)

  return (
    <div className="max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Catalog</h1>
          <p className="mt-1 text-sm text-neutral-400">Manage your product listings and pricing.</p>
        </div>
        <Link
          href="/partner/catalog/new"
          className="flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90"
        >
          <Plus size={16} />
          Add Product
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-800 bg-neutral-950/50">
              <tr>
                <th className="px-6 py-4 font-medium text-neutral-400">Product</th>
                <th className="px-6 py-4 font-medium text-neutral-400">Price</th>
                <th className="px-6 py-4 font-medium text-neutral-400">Status</th>
                <th className="px-6 py-4 font-medium text-neutral-400 text-right">Added On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-neutral-500">
                    <Package size={24} className="mx-auto mb-2 text-neutral-700" />
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-neutral-800/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{p.name_en}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">{p.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{formatRwf(p.base_price)}</div>
                      {p.sale_price && (
                        <div className="text-xs text-green-400 mt-0.5">Sale: {formatRwf(p.sale_price)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={p.is_active ? 'bg-green-500/10 text-green-400 border-0' : 'bg-neutral-800 text-neutral-400 border-0'}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {p.is_featured && (
                        <Badge className="ml-2 bg-amber-500/10 text-amber-400 border-0">Featured</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-neutral-400">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Simple Pagination Placeholder */}
        {total > 25 && (
          <div className="border-t border-neutral-800 p-4 text-center text-xs text-neutral-500">
            Showing {products.length} of {total} products
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createPartnerProduct } from './actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const initialState = { error: '' }

export default function PartnerNewProductPage() {
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await createPartnerProduct(formData)
      if (result?.error) {
        return { error: result.error }
      }
      return prevState
    },
    initialState
  )

  return (
    <div className="max-w-3xl">
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-neutral-500">
        <Link href="/partner/catalog" className="flex items-center gap-1 hover:text-white">
          <ChevronLeft size={16} /> Back to Catalog
        </Link>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Add New Product</h1>
        <p className="mt-1 text-sm text-neutral-400">List a new dropship product on IsokoClick.</p>
      </div>

      <form action={formAction} className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 space-y-6">
        {state.error && (
          <div className="rounded-lg bg-red-500/10 p-4 text-sm text-red-400">
            {state.error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name_en" className="text-neutral-300">
              Product Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name_en"
              name="name_en"
              type="text"
              required
              className="border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500 focus-visible:ring-brand-primary"
              placeholder="e.g. Premium Rice 25kg"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="base_price" className="text-neutral-300">
                Base Price (RWF) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="base_price"
                name="base_price"
                type="number"
                min="0"
                required
                className="border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500 focus-visible:ring-brand-primary"
                placeholder="25000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sale_price" className="text-neutral-300">
                Sale Price (RWF) - Optional
              </Label>
              <Input
                id="sale_price"
                name="sale_price"
                type="number"
                min="0"
                className="border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500 focus-visible:ring-brand-primary"
                placeholder="e.g. 23500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="unit_type" className="text-neutral-300">
                Unit Type <span className="text-red-500">*</span>
              </Label>
              <select
                id="unit_type"
                name="unit_type"
                required
                className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-neutral-900"
              >
                <option value="piece">Piece</option>
                <option value="bag">Bag</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="tonne">Tonne</option>
                <option value="box">Box</option>
                <option value="litre">Litre</option>
                <option value="m2">Square Meter (m2)</option>
                <option value="roll">Roll</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit_label_en" className="text-neutral-300">
                Unit Label <span className="text-red-500">*</span>
              </Label>
              <Input
                id="unit_label_en"
                name="unit_label_en"
                type="text"
                required
                className="border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500 focus-visible:ring-brand-primary"
                placeholder="e.g. per bag, per piece"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description_en" className="text-neutral-300">
              Description
            </Label>
            <textarea
              id="description_en"
              name="description_en"
              rows={4}
              className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-neutral-900"
              placeholder="Describe your product..."
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-neutral-800">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-brand-primary px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90 disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  )
}

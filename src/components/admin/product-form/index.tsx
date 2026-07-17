'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ChevronLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ProductFormState } from '@/app/admin/products/actions'
import type { CategoryRow, ProductRow, UnitType } from '@/types/database'

const UNIT_TYPES: UnitType[] = ['bag', 'kg', 'tonne', 'm2', 'litre', 'piece', 'roll', 'box']

const FIELD_CLASS =
  'w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-brand-primary'
const INPUT_CLASS =
  'border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500 focus-visible:ring-brand-primary'

type Props = {
  action: (prev: ProductFormState, formData: FormData) => Promise<ProductFormState>
  categories: CategoryRow[]
  product?: ProductRow
}

export function ProductForm({ action, categories, product }: Props) {
  const t = useTranslations('admin.productForm')
  const [state, formAction, isPending] = useActionState(action, { error: '' })

  return (
    <div className="max-w-3xl">
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-neutral-500">
        <Link href="/admin/products" className="flex items-center gap-1 hover:text-white">
          <ChevronLeft size={16} /> {t('backToProducts')}
        </Link>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">{product ? t('editTitle') : t('newTitle')}</h1>
        <p className="mt-1 text-sm text-neutral-400">
          {product ? t('editSubtitle') : t('newSubtitle')}
        </p>
      </div>

      <form action={formAction} className="space-y-6 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        {state.error && (
          <div className="rounded-lg bg-red-500/10 p-4 text-sm text-red-400">{state.error}</div>
        )}

        {product && product.source === 'dropship' && (
          <div className="rounded-lg bg-amber-500/10 p-4 text-sm text-amber-400">
            {t('dropshipNotice')}
          </div>
        )}

        {/* Details */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-neutral-300">{t('sectionDetails')}</legend>

          <div className="space-y-1.5">
            <Label htmlFor="name_en" className="text-neutral-300">
              {t('nameEn')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name_en"
              name="name_en"
              required
              defaultValue={product?.name_en}
              className={INPUT_CLASS}
              placeholder={t('nameEnPlaceholder')}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name_rw" className="text-neutral-300">{t('nameRw')}</Label>
            <Input id="name_rw" name="name_rw" defaultValue={product?.name_rw ?? ''} className={INPUT_CLASS} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="category_id" className="text-neutral-300">{t('category')}</Label>
              <select
                id="category_id"
                name="category_id"
                defaultValue={product?.category_id ?? ''}
                className={FIELD_CLASS}
              >
                <option value="">{t('categoryNone')}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name_en}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brand" className="text-neutral-300">{t('brand')}</Label>
              <Input id="brand" name="brand" defaultValue={product?.brand ?? ''} className={INPUT_CLASS} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sku" className="text-neutral-300">{t('sku')}</Label>
              <Input id="sku" name="sku" defaultValue={product?.sku ?? ''} className={INPUT_CLASS} />
            </div>
          </div>
        </fieldset>

        {/* Pricing */}
        <fieldset className="space-y-4 border-t border-neutral-800 pt-6">
          <legend className="text-sm font-semibold text-neutral-300">{t('sectionPricing')}</legend>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="base_price" className="text-neutral-300">
                {t('basePrice')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="base_price"
                name="base_price"
                type="number"
                min="1"
                step="1"
                required
                defaultValue={product?.base_price}
                className={INPUT_CLASS}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sale_price" className="text-neutral-300">{t('salePrice')}</Label>
              <Input
                id="sale_price"
                name="sale_price"
                type="number"
                min="1"
                step="1"
                defaultValue={product?.sale_price ?? ''}
                className={INPUT_CLASS}
              />
              <p className="text-xs text-neutral-500">{t('salePriceHint')}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="min_order_qty" className="text-neutral-300">{t('minOrderQty')}</Label>
              <Input
                id="min_order_qty"
                name="min_order_qty"
                type="number"
                min="1"
                step="1"
                defaultValue={product?.min_order_qty ?? 1}
                className={INPUT_CLASS}
              />
            </div>
          </div>
        </fieldset>

        {/* Unit & shipping */}
        <fieldset className="space-y-4 border-t border-neutral-800 pt-6">
          <legend className="text-sm font-semibold text-neutral-300">{t('sectionUnit')}</legend>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="unit_type" className="text-neutral-300">
                {t('unitType')} <span className="text-red-500">*</span>
              </Label>
              <select
                id="unit_type"
                name="unit_type"
                required
                defaultValue={product?.unit_type ?? 'piece'}
                className={FIELD_CLASS}
              >
                {UNIT_TYPES.map((unit) => (
                  <option key={unit} value={unit}>{t(`units.${unit}`)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit_label_en" className="text-neutral-300">
                {t('unitLabelEn')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="unit_label_en"
                name="unit_label_en"
                required
                defaultValue={product?.unit_label_en}
                className={INPUT_CLASS}
                placeholder={t('unitLabelPlaceholder')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="unit_label_rw" className="text-neutral-300">{t('unitLabelRw')}</Label>
              <Input
                id="unit_label_rw"
                name="unit_label_rw"
                defaultValue={product?.unit_label_rw ?? ''}
                className={INPUT_CLASS}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="weight_kg" className="text-neutral-300">{t('weightKg')}</Label>
              <Input
                id="weight_kg"
                name="weight_kg"
                type="number"
                min="0"
                step="0.01"
                defaultValue={product?.weight_kg ?? ''}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <label className="flex items-start gap-3 text-sm text-neutral-300">
            <input
              type="checkbox"
              name="is_heavy_goods"
              defaultChecked={product?.is_heavy_goods ?? false}
              className="mt-0.5 h-4 w-4 rounded border-neutral-700 bg-neutral-800 accent-brand-primary"
            />
            <span>
              {t('isHeavyGoods')}
              <span className="block text-xs text-neutral-500">{t('isHeavyGoodsHint')}</span>
            </span>
          </label>
        </fieldset>

        {/* Description */}
        <fieldset className="space-y-4 border-t border-neutral-800 pt-6">
          <legend className="text-sm font-semibold text-neutral-300">{t('sectionDescription')}</legend>

          <div className="space-y-1.5">
            <Label htmlFor="description_en" className="text-neutral-300">{t('descriptionEn')}</Label>
            <textarea
              id="description_en"
              name="description_en"
              rows={4}
              defaultValue={product?.description_en ?? ''}
              className={FIELD_CLASS}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description_rw" className="text-neutral-300">{t('descriptionRw')}</Label>
            <textarea
              id="description_rw"
              name="description_rw"
              rows={4}
              defaultValue={product?.description_rw ?? ''}
              className={FIELD_CLASS}
            />
          </div>
        </fieldset>

        {/* Visibility */}
        <fieldset className="space-y-3 border-t border-neutral-800 pt-6">
          <legend className="text-sm font-semibold text-neutral-300">{t('sectionVisibility')}</legend>

          <label className="flex items-center gap-3 text-sm text-neutral-300">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={product?.is_active ?? true}
              className="h-4 w-4 rounded border-neutral-700 bg-neutral-800 accent-brand-primary"
            />
            {t('isActive')}
          </label>

          <label className="flex items-center gap-3 text-sm text-neutral-300">
            <input
              type="checkbox"
              name="is_featured"
              defaultChecked={product?.is_featured ?? false}
              className="h-4 w-4 rounded border-neutral-700 bg-neutral-800 accent-brand-primary"
            />
            {t('isFeatured')}
          </label>
        </fieldset>

        <div className="flex justify-end gap-3 border-t border-neutral-800 pt-6">
          <Link
            href="/admin/products"
            className="rounded-lg border border-neutral-700 px-6 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-800"
          >
            {t('cancel')}
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-brand-primary px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
          >
            {isPending ? t('saving') : product ? t('saveChanges') : t('create')}
          </button>
        </div>
      </form>
    </div>
  )
}

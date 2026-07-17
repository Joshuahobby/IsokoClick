'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createProduct, getAdminProductById, updateProduct } from '@/lib/supabase/queries/admin'
import { hasRole } from '@/lib/supabase/require-role'
import type { ProductInsert, UnitType } from '@/types/database'

export type ProductFormState = { error: string }

const UNIT_TYPES: UnitType[] = ['bag', 'kg', 'tonne', 'm2', 'litre', 'piece', 'roll', 'box']

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function text(formData: FormData, key: string): string | null {
  const value = formData.get(key)
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function number(formData: FormData, key: string): number | null {
  const value = text(formData, key)
  if (value === null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

// The fields the form owns. source/partner_id/slug are derived, and the meta_*
// SEO fields aren't exposed yet — those are set at the call sites below.
// Prices are whole RWF integers, not minor units: MIN_ORDER_VALUE 5000 is RWF 5,000.
type ParsedProduct = Omit<
  ProductInsert,
  'source' | 'partner_id' | 'slug' | 'meta_title' | 'meta_description' | 'deleted_at'
>

function parse(formData: FormData): ParsedProduct | null {
  const nameEn = text(formData, 'name_en')
  const basePrice = number(formData, 'base_price')
  const unitType = text(formData, 'unit_type')
  const unitLabelEn = text(formData, 'unit_label_en')

  if (!nameEn || basePrice === null || basePrice <= 0 || !unitLabelEn) return null
  if (!unitType || !UNIT_TYPES.includes(unitType as UnitType)) return null

  const salePrice = number(formData, 'sale_price')
  // A sale price at or above base would render as a negative discount.
  if (salePrice !== null && (salePrice <= 0 || salePrice >= basePrice)) return null

  const minOrderQty = number(formData, 'min_order_qty')

  return {
    name_en: nameEn,
    name_rw: text(formData, 'name_rw'),
    category_id: text(formData, 'category_id'),
    brand: text(formData, 'brand'),
    sku: text(formData, 'sku'),
    base_price: basePrice,
    sale_price: salePrice,
    min_order_qty: minOrderQty !== null && minOrderQty > 0 ? Math.floor(minOrderQty) : 1,
    unit_type: unitType as UnitType,
    unit_label_en: unitLabelEn,
    unit_label_rw: text(formData, 'unit_label_rw'),
    weight_kg: number(formData, 'weight_kg'),
    is_heavy_goods: formData.get('is_heavy_goods') === 'on',
    description_en: text(formData, 'description_en'),
    description_rw: text(formData, 'description_rw'),
    is_active: formData.get('is_active') === 'on',
    is_featured: formData.get('is_featured') === 'on',
  }
}

export async function createAdminProduct(
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const t = await getTranslations('errors')

  // Server actions are addressable endpoints of their own — the proxy's
  // /admin path guard does not cover them, and the query layer runs on the
  // service key, so authorization has to happen here.
  if (!(await hasRole('admin'))) return { error: t('unauthorized') }

  const fields = parse(formData)
  if (!fields) return { error: t('productFieldsMissing') }

  const created = await createProduct({
    ...fields,
    // Admins stock IsokoClick's own inventory; dropship listings are created
    // by their owning partner, which is where partner_id comes from.
    source: 'internal',
    partner_id: null,
    slug: `${slugify(fields.name_en)}-${Date.now().toString(36)}`,
    meta_title: null,
    meta_description: null,
    deleted_at: null,
  })

  if (!created) return { error: t('productCreateFailed') }

  revalidatePath('/admin/products')
  redirect('/admin/products')
}

export async function updateAdminProduct(
  productId: string,
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const t = await getTranslations('errors')

  if (!(await hasRole('admin'))) return { error: t('unauthorized') }

  const existing = await getAdminProductById(productId)
  if (!existing) return { error: t('productNotFound') }

  const fields = parse(formData)
  if (!fields) return { error: t('productFieldsMissing') }

  // source and partner_id are deliberately not editable: flipping a partner's
  // dropship listing to internal would orphan it from its inventory and payouts.
  const ok = await updateProduct(productId, fields)
  if (!ok) return { error: t('productUpdateFailed') }

  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${productId}`)
  redirect('/admin/products')
}

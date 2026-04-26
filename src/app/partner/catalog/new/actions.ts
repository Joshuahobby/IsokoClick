'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { getPartnerByUserId } from '@/lib/supabase/queries/partners'
import type { ProductInsert } from '@/types/database'

export async function createPartnerProduct(formData: FormData) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Not authenticated.' }
  }

  const partner = await getPartnerByUserId(user.id)
  if (!partner) {
    return { error: 'Partner profile not found.' }
  }

  const nameEn = formData.get('name_en') as string
  const basePrice = Number(formData.get('base_price'))
  const salePriceStr = formData.get('sale_price') as string
  const salePrice = salePriceStr ? Number(salePriceStr) : null
  const unitType = formData.get('unit_type') as ProductInsert['unit_type']
  const unitLabelEn = formData.get('unit_label_en') as string
  const descriptionEn = formData.get('description_en') as string

  if (!nameEn || !basePrice || !unitType || !unitLabelEn) {
    return { error: 'Missing required fields.' }
  }

  const slug = nameEn
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') + '-' + Math.floor(Math.random() * 1000)

  const newProduct: ProductInsert = {
    partner_id: partner.id,
    source: 'dropship',
    name_en: nameEn,
    slug,
    description_en: descriptionEn || null,
    unit_type: unitType,
    unit_label_en: unitLabelEn,
    base_price: basePrice,
    sale_price: salePrice,
    min_order_qty: 1,
    is_active: true, // Auto-active for dropship by default, or maybe pending approval? Assuming auto-active for simplicity.
    is_featured: false,
    is_heavy_goods: false,
    category_id: null,
    name_rw: null,
    description_rw: null,
    brand: null,
    sku: null,
    unit_label_rw: null,
    weight_kg: null,
    meta_title: null,
    meta_description: null,
    deleted_at: null,
  }

  const admin = await createAdminClient()
  const { error } = await admin.from('products').insert(newProduct)

  if (error) {
    return { error: 'Failed to create product. ' + error.message }
  }

  revalidatePath('/partner/catalog')
  redirect('/partner/catalog')
}

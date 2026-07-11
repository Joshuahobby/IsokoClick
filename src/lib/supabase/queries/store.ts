import { createClient } from '@/lib/supabase/server'
import type { ProductRow } from '@/types/database'

export type StoreProduct = Pick<
  ProductRow,
  | 'id'
  | 'name_en'
  | 'slug'
  | 'base_price'
  | 'sale_price'
  | 'unit_label_en'
  | 'brand'
  | 'source'
  | 'min_order_qty'
  | 'unit_type'
> & {
  category?: string
}

type RawStoreProduct = Omit<StoreProduct, 'category'> & {
  categories: { name_en: string } | null
}

export async function getStoreProducts(
  page = 1,
  pageSize = 24
): Promise<{ products: StoreProduct[]; total: number }> {
  const supabase = await createClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('products')
    .select(`
      id, name_en, slug, base_price, sale_price, unit_label_en, brand, source, min_order_qty, unit_type,
      categories:category_id(name_en)
    `, { count: 'exact' })
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return { products: [], total: 0 }

  // Supabase's embed parsing defeats inference on the placeholder DB types — cast once, then map
  const rows = (data ?? []) as unknown as RawStoreProduct[]
  const products = rows.map(({ categories, ...product }) => ({
    ...product,
    category: categories?.name_en,
  }))

  return { products, total: count ?? 0 }
}

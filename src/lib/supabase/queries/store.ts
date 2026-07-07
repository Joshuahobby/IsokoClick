import { createClient } from '@/lib/supabase/server'
import type { CategoryRow, ProductRow } from '@/types/database'

export type StoreProduct = Pick<
  ProductRow,
  'id' | 'name_en' | 'slug' | 'base_price' | 'sale_price' | 'unit_label_en' | 'brand' | 'source'
> & {
  category?: string
}

type StoreProductQueryRow = Pick<
  ProductRow,
  'id' | 'name_en' | 'slug' | 'base_price' | 'sale_price' | 'unit_label_en' | 'brand' | 'source'
> & {
  categories: Pick<CategoryRow, 'name_en'> | null
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
      id, name_en, slug, base_price, sale_price, unit_label_en, brand, source,
      categories:category_id(name_en)
    `, { count: 'exact' })
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return { products: [], total: 0 }

  // The hand-written Database type carries no relationship metadata, so
  // supabase-js cannot infer the embedded categories join.
  const rows = data as unknown as StoreProductQueryRow[]

  const formattedProducts: StoreProduct[] = rows.map((p) => ({
    id: p.id,
    name_en: p.name_en,
    slug: p.slug,
    base_price: p.base_price,
    sale_price: p.sale_price,
    unit_label_en: p.unit_label_en,
    brand: p.brand,
    source: p.source,
    category: p.categories?.name_en,
  }))

  return { products: formattedProducts, total: count ?? 0 }
}

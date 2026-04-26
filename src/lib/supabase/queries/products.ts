import { createClient } from '@/lib/supabase/server'
import type { ProductRow, CategoryRow } from '@/types/database'

export type ProductWithImages = ProductRow & {
  product_images: { storage_url: string; alt_text: string | null; is_primary: boolean }[]
  categories: Pick<CategoryRow, 'name_en' | 'slug'> | null
}

export type ProductFilters = {
  category?: string
  source?: 'internal' | 'dropship'
  minPrice?: number
  maxPrice?: number
  search?: string
  featured?: boolean
  onSale?: boolean
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'featured'
  page?: number
  pageSize?: number
}

export async function getProducts(filters: ProductFilters = {}): Promise<{
  products: ProductWithImages[]
  total: number
}> {
  const supabase = await createClient()
  const page = filters.page ?? 1
  const pageSize = filters.pageSize ?? 12
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('products')
    .select(
      `*, product_images(storage_url, alt_text, is_primary), categories:category_id(name_en, slug)`,
      { count: 'exact' }
    )
    .eq('is_active', true)
    .is('deleted_at', null)

  if (filters.category) {
    query = query.eq('categories.slug', filters.category)
  }
  if (filters.source) {
    query = query.eq('source', filters.source)
  }
  if (filters.minPrice !== undefined) {
    query = query.gte('base_price', filters.minPrice)
  }
  if (filters.maxPrice !== undefined) {
    query = query.lte('base_price', filters.maxPrice)
  }
  if (filters.search) {
    query = query.ilike('name_en', `%${filters.search}%`)
  }
  if (filters.featured) {
    query = query.eq('is_featured', true)
  }
  if (filters.onSale) {
    query = query.not('sale_price', 'is', null)
  }

  switch (filters.sort) {
    case 'price_asc':  query = query.order('base_price', { ascending: true });  break
    case 'price_desc': query = query.order('base_price', { ascending: false }); break
    case 'newest':     query = query.order('created_at', { ascending: false }); break
    default:           query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false })
  }

  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw new Error(`getProducts: ${error.message}`)

  return {
    products: (data ?? []) as unknown as ProductWithImages[],
    total: count ?? 0,
  }
}

export async function getProductBySlug(slug: string): Promise<
  | (ProductRow & {
      product_images: { storage_url: string; alt_text: string | null; sort_order: number; is_primary: boolean }[]
      product_specs:  { key_en: string; value_en: string; sort_order: number }[]
      product_variants: { id: string; name_en: string; price: number | null; sort_order: number; is_active: boolean }[]
      categories: Pick<CategoryRow, 'name_en' | 'slug'> | null
    })
  | null
> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_images(storage_url, alt_text, sort_order, is_primary),
      product_specs(key_en, value_en, sort_order),
      product_variants(id, name_en, price, sort_order, is_active),
      categories:category_id(name_en, slug)
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .is('deleted_at', null)
    .single()

  if (error) return null
  return data as ReturnType<typeof getProductBySlug> extends Promise<infer T> ? T : never
}

export async function getFeaturedProducts(limit = 6): Promise<ProductWithImages[]> {
  const { products } = await getProducts({ featured: true, pageSize: limit })
  return products
}

export async function getBestSellers(limit = 6): Promise<ProductWithImages[]> {
  // Phase 3 will use order_items aggregate. For now, return newest active products.
  const { products } = await getProducts({ sort: 'newest', pageSize: limit })
  return products
}

export async function getRelatedProducts(
  productId: string,
  categorySlug: string,
  limit = 4
): Promise<ProductWithImages[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('products')
    .select(`*, product_images(storage_url, alt_text, is_primary), categories:category_id(name_en, slug)`)
    .eq('is_active', true)
    .is('deleted_at', null)
    .eq('categories.slug', categorySlug)
    .neq('id', productId)
    .limit(limit)

  return (data ?? []) as unknown as ProductWithImages[]
}

export async function getCategories(): Promise<CategoryRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  if (error) throw new Error(`getCategories: ${error.message}`)
  return data ?? []
}

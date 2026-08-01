import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { buildCategoryTree, collectSubtreeIds } from '@/lib/utils/category-tree'
import type { CategoryNode } from '@/lib/utils/category-tree'
import type { ProductRow, CategoryRow } from '@/types/database'

// Re-exported so callers keep importing their category types from the query
// module they already use, rather than reaching into lib/utils for a type.
export type { CategoryNode }

export type ProductWithImages = ProductRow & {
  product_images: { storage_url: string; alt_text: string | null; is_primary: boolean }[]
  categories: Pick<CategoryRow, 'name_en' | 'name_rw' | 'slug'> | null
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

  // A category filter has to match the whole subtree: products hang off the
  // most specific category that fits them, so every basin is filed under
  // Bathroom and none directly under its parent, Plumbing. Filtering on the
  // embedded slug would return one PVC pipe for /shop?category=plumbing.
  let categoryIds: string[] | null = null
  if (filters.category) {
    categoryIds = await getCategorySubtreeIds(filters.category)
    if (categoryIds.length === 0) return { products: [], total: 0 }
  }

  let query = supabase
    .from('products')
    .select(
      '*, product_images(storage_url, alt_text, is_primary), categories:category_id(name_en, name_rw, slug)',
      { count: 'exact' }
    )
    .eq('is_active', true)
    .is('deleted_at', null)

  if (categoryIds) {
    query = query.in('category_id', categoryIds)
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

export type ProductDetail = ProductRow & {
  product_images: { storage_url: string; alt_text: string | null; sort_order: number; is_primary: boolean }[]
  product_specs:  { key_en: string; value_en: string; sort_order: number }[]
  product_variants: { id: string; name_en: string; price: number | null; sort_order: number; is_active: boolean }[]
  categories: Pick<CategoryRow, 'name_en' | 'name_rw' | 'slug'> | null
}

// cache() dedupes the fetch between generateMetadata and the page render.
export const getProductBySlug = cache(async (slug: string): Promise<ProductDetail | null> => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_images(storage_url, alt_text, sort_order, is_primary),
      product_specs(key_en, value_en, sort_order),
      product_variants(id, name_en, price, sort_order, is_active),
      categories:category_id(name_en, name_rw, slug)
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .is('deleted_at', null)
    .single()

  if (error) return null
  // Hand-written Database type carries no relationship metadata (see getProducts)
  return data as unknown as ProductDetail
})

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
    // `!inner` so the category filter removes parent rows (see getProducts)
    .select(`*, product_images(storage_url, alt_text, is_primary), categories:category_id!inner(name_en, name_rw, slug)`)
    .eq('is_active', true)
    .is('deleted_at', null)
    .eq('categories.slug', categorySlug)
    .neq('id', productId)
    .limit(limit)

  return (data ?? []) as unknown as ProductWithImages[]
}

// Active-product count per category id, computed in one round-trip. Direct
// members only — getCategoryTree() rolls these up through the subtree.
export const getCategoryProductCounts = cache(async (): Promise<Record<string, number>> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('category_id')
    .eq('is_active', true)
    .is('deleted_at', null)

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    if (row.category_id) counts[row.category_id] = (counts[row.category_id] ?? 0) + 1
  }
  return counts
})

// cache() so the layout, the page and the footer share one round-trip, and so
// getCategorySubtreeIds() below is free when the caller already loaded them.
export const getCategories = cache(async (): Promise<CategoryRow[]> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  if (error) throw new Error(`getCategories: ${error.message}`)
  return data ?? []
})

// A category plus everything nested under it. Returns [] for an unknown slug,
// which callers read as "no such category" rather than "no filter".
export async function getCategorySubtreeIds(slug: string): Promise<string[]> {
  return collectSubtreeIds(await getCategories(), slug)
}

// The active categories as a tree, each node carrying its subtree product
// count — the number a shopper expects to see after clicking it, which is what
// getProducts() returns for that slug.
export async function getCategoryTree(): Promise<CategoryNode[]> {
  const [categories, directCounts] = await Promise.all([
    getCategories(),
    getCategoryProductCounts(),
  ])

  return buildCategoryTree(categories, directCounts)
}

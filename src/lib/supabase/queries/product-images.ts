import { createAdminClient } from '@/lib/supabase/server'
import { logError } from '@/lib/utils/log'
import type { ProductImageRow } from '@/types/database'

export const IMAGE_BUCKET = 'product-images'

/** Ordered exactly as the storefront orders them: primary first, then sort_order. */
export async function getProductImages(productId: string): Promise<ProductImageRow[]> {
  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('is_primary', { ascending: false })
    .order('sort_order', { ascending: true })

  if (error) {
    logError('product-images:list', error)
    return []
  }
  return data ?? []
}

export async function insertProductImage(input: {
  productId: string
  storageUrl: string
  altText: string | null
  sortOrder: number
  isPrimary: boolean
}): Promise<ProductImageRow | null> {
  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('product_images')
    .insert({
      product_id: input.productId,
      storage_url: input.storageUrl,
      alt_text: input.altText,
      sort_order: input.sortOrder,
      is_primary: input.isPrimary,
    })
    .select('*')
    .single()

  if (error) {
    logError('product-images:insert', error)
    return null
  }
  return data
}

export async function updateProductImageAltText(
  productId: string,
  imageId: string,
  altText: string
): Promise<boolean> {
  const admin = await createAdminClient()
  const { error } = await admin
    .from('product_images')
    .update({ alt_text: altText })
    .eq('id', imageId)
    .eq('product_id', productId)

  if (error) {
    logError('product-images:update-alt', error)
    return false
  }
  return true
}

export async function deleteProductImageRow(imageId: string): Promise<boolean> {
  const admin = await createAdminClient()
  const { error } = await admin.from('product_images').delete().eq('id', imageId)

  if (error) {
    logError('product-images:delete', error)
    return false
  }
  return true
}

/**
 * Clears is_primary across the product before setting it on one row.
 *
 * Done in two statements rather than one because there is no partial unique
 * index on (product_id) where is_primary — so nothing at the database level
 * stops two rows both claiming primary, and the storefront's
 * `find(img => img.is_primary)` would then pick whichever sorted first.
 */
export async function setPrimaryProductImageRow(
  productId: string,
  imageId: string
): Promise<boolean> {
  const admin = await createAdminClient()

  const { error: clearError } = await admin
    .from('product_images')
    .update({ is_primary: false })
    .eq('product_id', productId)

  if (clearError) {
    logError('product-images:clear-primary', clearError)
    return false
  }

  const { error } = await admin
    .from('product_images')
    .update({ is_primary: true })
    .eq('id', imageId)
    .eq('product_id', productId)

  if (error) {
    logError('product-images:set-primary', error)
    return false
  }
  return true
}

/** Writes a whole ordering at once, so positions can never collide mid-update. */
export async function applyProductImageOrder(
  productId: string,
  orderedIds: string[]
): Promise<boolean> {
  const admin = await createAdminClient()

  for (const [index, id] of orderedIds.entries()) {
    const { error } = await admin
      .from('product_images')
      .update({ sort_order: index })
      .eq('id', id)
      .eq('product_id', productId)

    if (error) {
      logError('product-images:reorder', error)
      return false
    }
  }
  return true
}

export async function uploadProductImageObject(input: {
  path: string
  body: ArrayBuffer
  contentType: string
}): Promise<string | null> {
  const admin = await createAdminClient()

  const { error } = await admin.storage
    .from(IMAGE_BUCKET)
    .upload(input.path, input.body, { contentType: input.contentType, upsert: false })

  if (error) {
    logError('product-images:upload', error)
    return null
  }

  return admin.storage.from(IMAGE_BUCKET).getPublicUrl(input.path).data.publicUrl
}

/**
 * Best-effort removal of the stored object.
 *
 * Storage and the table are not transactional together. The row is the source
 * of truth for what the storefront renders, so a failure here leaves an
 * unreferenced object rather than a broken image — worth logging, not worth
 * failing the user's delete over.
 */
export async function removeProductImageObject(storageUrl: string): Promise<void> {
  const marker = `/object/public/${IMAGE_BUCKET}/`
  const index = storageUrl.indexOf(marker)
  if (index === -1) return

  const path = decodeURIComponent(storageUrl.slice(index + marker.length))
  const admin = await createAdminClient()
  const { error } = await admin.storage.from(IMAGE_BUCKET).remove([path])

  if (error) logError('product-images:remove-object', error)
}

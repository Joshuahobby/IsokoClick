'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminProductById } from '@/lib/supabase/queries/admin'
import { getPartnerByUserId } from '@/lib/supabase/queries/partners'
import {
  applyProductImageOrder,
  deleteProductImageRow,
  getProductImages,
  insertProductImage,
  removeProductImageObject,
  setPrimaryProductImageRow,
  updateProductImageAltText,
  uploadProductImageObject,
} from '@/lib/supabase/queries/product-images'
import {
  MAX_IMAGES_PER_PRODUCT,
  MAX_UPLOAD_BYTES,
  extensionFor,
  sniffImageType,
} from '@/lib/utils/image-upload'
import type { ProductRow } from '@/types/database'

export type ImageActionState = { error: string }

const OK: ImageActionState = { error: '' }

/**
 * The single authorization gate for every image mutation, shared by both
 * portals.
 *
 * Server actions are independently addressable endpoints — the proxy's /admin
 * and /partner path guards do not cover them, and every query below runs on
 * the service key with RLS bypassed. So ownership is checked here, once,
 * rather than trusting whichever page happened to render the form.
 *
 * Admins may manage any product. A partner may manage only products their own
 * partner record owns, and only while approved — a suspended partner editing
 * live listings is exactly what the status field exists to prevent.
 */
async function authorize(
  productId: string
): Promise<{ product: ProductRow } | { error: string }> {
  const t = await getTranslations('errors')
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: t('notAuthenticated') }

  // Read on the service key, not the caller's client: RLS on products only
  // exposes active rows, and both portals must be able to attach images to a
  // draft or deactivated listing. Ownership is enforced below instead.
  const product = await getAdminProductById(productId)
  if (!product) return { error: t('productNotFound') }

  if (user.app_metadata?.role === 'admin') return { product }

  const partner = await getPartnerByUserId(user.id)
  if (!partner) return { error: t('unauthorized') }
  if (partner.status !== 'approved') return { error: t('partnerNotApproved') }
  if (product.partner_id !== partner.id) return { error: t('unauthorized') }

  return { product }
}

/** Both portals list images on their own routes; refresh whichever applies. */
function revalidateFor(product: ProductRow) {
  revalidatePath(`/admin/products/${product.id}`)
  revalidatePath(`/partner/catalog/${product.id}`)
  revalidatePath(`/product/${product.slug}`)
}

export async function uploadProductImages(
  productId: string,
  _prev: ImageActionState,
  formData: FormData
): Promise<ImageActionState> {
  const t = await getTranslations('errors')
  const auth = await authorize(productId)
  if ('error' in auth) return auth

  const files = formData.getAll('files').filter((f): f is File => f instanceof File && f.size > 0)
  if (files.length === 0) return { error: t('imageNoneSelected') }

  const existing = await getProductImages(productId)
  if (existing.length + files.length > MAX_IMAGES_PER_PRODUCT) {
    return { error: t('imageTooMany', { max: MAX_IMAGES_PER_PRODUCT }) }
  }

  const altText = (formData.get('alt_text') as string | null)?.trim() || auth.product.name_en

  let sortOrder = existing.length
  let hasPrimary = existing.some((img) => img.is_primary)

  for (const file of files) {
    if (file.size > MAX_UPLOAD_BYTES) return { error: t('imageTooLarge') }

    const buffer = await file.arrayBuffer()
    // Trust the bytes, not the declared Content-Type — see sniffImageType.
    const type = sniffImageType(new Uint8Array(buffer.slice(0, 12)))
    if (!type) return { error: t('imageBadFormat') }

    const path = `${auth.product.slug}/${randomUUID()}.${extensionFor(type)}`
    const url = await uploadProductImageObject({ path, body: buffer, contentType: type })
    if (!url) return { error: t('imageUploadFailed') }

    const row = await insertProductImage({
      productId,
      storageUrl: url,
      altText,
      sortOrder,
      // The first image on a product with none becomes primary, so a product
      // can never end up with images but no hero.
      isPrimary: !hasPrimary,
    })

    if (!row) {
      // The object is already stored but nothing references it; drop it rather
      // than leave an orphan behind a failed insert.
      await removeProductImageObject(url)
      return { error: t('imageUploadFailed') }
    }

    hasPrimary = true
    sortOrder += 1
  }

  revalidateFor(auth.product)
  return OK
}

export async function deleteProductImage(
  productId: string,
  imageId: string
): Promise<ImageActionState> {
  const t = await getTranslations('errors')
  const auth = await authorize(productId)
  if ('error' in auth) return auth

  const images = await getProductImages(productId)
  const target = images.find((img) => img.id === imageId)
  if (!target) return { error: t('imageNotFound') }

  if (!(await deleteProductImageRow(imageId))) return { error: t('imageDeleteFailed') }
  await removeProductImageObject(target.storage_url)

  // Deleting the hero would otherwise leave the product with images but no
  // primary, so promote whatever now sorts first.
  const remaining = images.filter((img) => img.id !== imageId)
  if (target.is_primary && remaining.length > 0) {
    await setPrimaryProductImageRow(productId, remaining[0].id)
  }
  await applyProductImageOrder(productId, remaining.map((img) => img.id))

  revalidateFor(auth.product)
  return OK
}

export async function setPrimaryProductImage(
  productId: string,
  imageId: string
): Promise<ImageActionState> {
  const t = await getTranslations('errors')
  const auth = await authorize(productId)
  if ('error' in auth) return auth

  if (!(await setPrimaryProductImageRow(productId, imageId))) {
    return { error: t('imageUpdateFailed') }
  }

  revalidateFor(auth.product)
  return OK
}

export async function moveProductImage(
  productId: string,
  imageId: string,
  direction: 'up' | 'down'
): Promise<ImageActionState> {
  const t = await getTranslations('errors')
  const auth = await authorize(productId)
  if ('error' in auth) return auth

  const images = await getProductImages(productId)
  const index = images.findIndex((img) => img.id === imageId)
  const target = direction === 'up' ? index - 1 : index + 1
  if (index === -1 || target < 0 || target >= images.length) {
    return { error: t('imageNotFound') }
  }

  const reordered = [...images]
  ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]

  if (!(await applyProductImageOrder(productId, reordered.map((img) => img.id)))) {
    return { error: t('imageUpdateFailed') }
  }

  // Position is only meaningful relative to the hero: the storefront sorts
  // primary first regardless of sort_order, so moving an image into the lead
  // slot has to move the primary flag with it or the change looks ignored.
  if (reordered[0].id !== images.find((img) => img.is_primary)?.id) {
    await setPrimaryProductImageRow(productId, reordered[0].id)
  }

  revalidateFor(auth.product)
  return OK
}

export async function updateProductImageAlt(
  productId: string,
  imageId: string,
  altText: string
): Promise<ImageActionState> {
  const t = await getTranslations('errors')
  const auth = await authorize(productId)
  if ('error' in auth) return auth

  const trimmed = altText.trim()
  if (trimmed.length === 0) return { error: t('imageAltRequired') }
  if (trimmed.length > 200) return { error: t('imageAltTooLong') }

  if (!(await updateProductImageAltText(productId, imageId, trimmed))) {
    return { error: t('imageUpdateFailed') }
  }

  revalidateFor(auth.product)
  return OK
}

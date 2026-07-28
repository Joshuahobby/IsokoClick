'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { ArrowDown, ArrowUp, ImagePlus, Star, Trash2 } from 'lucide-react'
import {
  deleteProductImage,
  moveProductImage,
  setPrimaryProductImage,
  updateProductImageAlt,
  uploadProductImages,
} from '@/app/actions/product-images'
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGES_PER_PRODUCT } from '@/lib/utils/image-upload'
import { Label } from '@/components/ui/label'
import { downscaleImage } from './downscale'
import type { ProductImageRow } from '@/types/database'

type Props = {
  productId: string
  images: ProductImageRow[]
}

const ICON_BUTTON =
  'inline-flex h-8 w-8 items-center justify-center rounded-md border border-neutral-700 text-neutral-300 transition-colors hover:border-neutral-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40'

export function ProductImageManager({ productId, images }: Props) {
  const t = useTranslations('productImages')
  const [isPending, startTransition] = useTransition()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const busy = isPending || isProcessing
  const atCapacity = images.length >= MAX_IMAGES_PER_PRODUCT

  function run(action: () => Promise<{ error: string }>) {
    setConfirmingId(null)
    startTransition(async () => setError((await action()).error))
  }

  async function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    // Resetting here rather than after the upload lets the same file be picked
    // again — the input would otherwise fire no change event the second time.
    event.target.value = ''
    if (files.length === 0) return

    setError('')
    setIsProcessing(true)
    let payload: FormData
    try {
      const processed = await Promise.all(files.map(downscaleImage))
      payload = new FormData()
      for (const file of processed) payload.append('files', file)
    } finally {
      setIsProcessing(false)
    }

    startTransition(async () => {
      setError((await uploadProductImages(productId, { error: '' }, payload)).error)
    })
  }

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-neutral-300">{t('title')}</h2>
          <p className="mt-1 text-xs text-neutral-400">{t('subtitle')}</p>
        </div>
        <p className="text-xs text-neutral-400" aria-live="polite">
          {t('count', { used: images.length, max: MAX_IMAGES_PER_PRODUCT })}
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {images.length > 0 && (
        <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {images.map((image, index) => (
            <li
              key={image.id}
              className="flex gap-4 rounded-lg border border-neutral-800 bg-neutral-950/40 p-3"
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-neutral-800">
                <Image
                  src={image.storage_url}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                />
                {image.is_primary && (
                  <span className="absolute inset-x-0 bottom-0 bg-brand-primary py-0.5 text-center text-[10px] font-bold text-neutral-950">
                    {t('primary')}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <Label htmlFor={`alt-${image.id}`} className="text-xs text-neutral-400">
                  {t('altLabel')}
                </Label>
                <input
                  id={`alt-${image.id}`}
                  defaultValue={image.alt_text ?? ''}
                  maxLength={200}
                  disabled={busy}
                  onBlur={(e) => {
                    const value = e.target.value.trim()
                    if (value && value !== (image.alt_text ?? '')) {
                      run(() => updateProductImageAlt(productId, image.id, value))
                    }
                  }}
                  className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-xs text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50"
                  placeholder={t('altPlaceholder')}
                />

                <div className="mt-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    className={ICON_BUTTON}
                    disabled={busy || image.is_primary}
                    aria-label={t('setPrimaryAt', { position: index + 1 })}
                    onClick={() => run(() => setPrimaryProductImage(productId, image.id))}
                  >
                    <Star size={14} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={ICON_BUTTON}
                    disabled={busy || index === 0}
                    aria-label={t('moveUpAt', { position: index + 1 })}
                    onClick={() => run(() => moveProductImage(productId, image.id, 'up'))}
                  >
                    <ArrowUp size={14} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={ICON_BUTTON}
                    disabled={busy || index === images.length - 1}
                    aria-label={t('moveDownAt', { position: index + 1 })}
                    onClick={() => run(() => moveProductImage(productId, image.id, 'down'))}
                  >
                    <ArrowDown size={14} aria-hidden="true" />
                  </button>

                  {/* Two-step rather than window.confirm: deleting also drops
                      the stored object, and a stray click should not do that. */}
                  {confirmingId === image.id ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(() => deleteProductImage(productId, image.id))}
                      className="ml-auto rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-40"
                    >
                      {t('confirmRemove')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      aria-label={t('removeAt', { position: index + 1 })}
                      onClick={() => setConfirmingId(image.id)}
                      className={`${ICON_BUTTON} ml-auto hover:border-red-500 hover:text-red-400`}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 border-t border-neutral-800 pt-5">
        <Label htmlFor="product-images-input" className="text-xs text-neutral-400">
          {t('addLabel')}
        </Label>
        <input
          id="product-images-input"
          type="file"
          multiple
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          disabled={busy || atCapacity}
          onChange={handleFiles}
          className="mt-1.5 block w-full text-xs text-neutral-400 file:mr-3 file:rounded-md file:border-0 file:bg-brand-primary file:px-4 file:py-2 file:text-xs file:font-semibold file:text-neutral-950 hover:file:bg-amber-600 disabled:opacity-50"
        />
        <p className="mt-2 flex items-center gap-1.5 text-xs text-neutral-400">
          <ImagePlus size={13} aria-hidden="true" />
          {atCapacity ? t('atCapacity', { max: MAX_IMAGES_PER_PRODUCT }) : t('addHint')}
        </p>
        <p aria-live="polite" className="mt-1 text-xs text-brand-primary">
          {isProcessing ? t('processing') : isPending ? t('uploading') : ''}
        </p>
      </div>
    </section>
  )
}

'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Pause, Play, Smartphone, Truck } from 'lucide-react'
import { CategoryIcon } from '@/components/store/category-icon'

export type ShowcaseProduct = {
  slug: string
  name: string
  categoryName: string | null
  categorySlug: string | null
  /** Pre-formatted on the server so formatRwf stays out of the client bundle. */
  price: string
  unitLabel: string
  imageUrl: string | null
  imageAlt: string
}

type Props = {
  products: ShowcaseProduct[]
}

const ROTATE_MS = 5000
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

// Picks the next product to show: any of them except the one on screen, so the
// sequence is random without ever stalling on a repeat. Randomising the *step*
// rather than pre-shuffling the array is what keeps the server and client
// agreeing on the first card — the shuffle only ever happens in a timer
// callback, long after hydration.
function nextIndex(current: number, total: number) {
  const offset = 1 + Math.floor(Math.random() * (total - 1))
  return (current + offset) % total
}

export function HeroShowcase({ products }: Props) {
  const t = useTranslations('home')

  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)

  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false
  )

  // Rotation stops while a visitor is reading the card (hover or keyboard
  // focus), when they press pause, and entirely when the OS asks for reduced
  // motion — WCAG 2.2.2 wants a way out of content that moves on its own.
  const rotating = products.length > 1 && !paused && !hovered && !reducedMotion

  useEffect(() => {
    if (!rotating) return
    const timer = window.setInterval(
      () => setIndex((current) => nextIndex(current, products.length)),
      ROTATE_MS
    )
    return () => window.clearInterval(timer)
  }, [rotating, products.length])

  if (products.length === 0) return null

  const active = products[index] ?? products[0]

  return (
    <div
      aria-label={t('heroShowcase')}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHovered(false)
      }}
      className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6 shadow-2xl shadow-black/40 backdrop-blur"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
        {t('heroSpotlight')}
      </p>

      {/* Only the active product is mounted, so no off-screen card can take
          keyboard focus or be read out. `key` restarts the fade on each swap. */}
      <Link key={active.slug} href={`/product/${active.slug}`} className="group mt-4 block">
        <div className="arch-top relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-neutral-800 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
          {active.imageUrl ? (
            <Image
              src={active.imageUrl}
              alt={active.imageAlt}
              fill
              priority
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="400px"
            />
          ) : (
            <CategoryIcon slug={active.categorySlug} size={56} className="text-neutral-600" />
          )}
        </div>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-neutral-400">{active.categoryName}</p>
            <h2 className="mt-0.5 font-semibold text-white group-hover:text-neutral-200">
              {active.name}
            </h2>
          </div>
          <div className="shrink-0 text-right">
            <p className="price text-lg text-white">{active.price}</p>
            <p className="text-xs text-neutral-400">{active.unitLabel}</p>
          </div>
        </div>
      </Link>

      {products.length > 1 && (
        <div className="mt-5 flex items-center justify-between gap-4">
          <ul className="flex flex-wrap items-center gap-2">
            {products.map((product, slot) => {
              const current = slot === index

              return (
                <li key={product.slug} className="flex">
                  <button
                    type="button"
                    // Choosing a product is also a request to stop the
                    // rotation — otherwise the card a visitor just picked is
                    // swapped out from under them a few seconds later.
                    onClick={() => {
                      setIndex(slot)
                      setPaused(true)
                    }}
                    aria-label={t('heroShowcaseGoTo', { name: product.name })}
                    aria-current={current ? 'true' : undefined}
                    className={`h-2 rounded-full transition-all ${
                      current
                        ? 'w-6 bg-brand-primary'
                        : 'w-2 bg-neutral-600 hover:bg-neutral-400'
                    }`}
                  />
                </li>
              )
            })}
          </ul>

          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? t('heroShowcasePlay') : t('heroShowcasePause')}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
          >
            {paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}
          </button>
        </div>
      )}

      <div className="mt-5 space-y-2.5 border-t border-neutral-800 pt-5 text-sm text-neutral-300">
        <p className="flex items-center gap-2.5">
          <Truck size={16} className="shrink-0 text-brand-primary" aria-hidden="true" />
          {t('trustDelivery')}
        </p>
        <p className="flex items-center gap-2.5">
          <Smartphone size={16} className="shrink-0 text-brand-primary" aria-hidden="true" />
          {t('trustPayment')}
        </p>
      </div>
    </div>
  )
}

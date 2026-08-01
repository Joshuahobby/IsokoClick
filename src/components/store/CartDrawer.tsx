'use client'

import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ShoppingCart, X, Plus, Minus, Trash2 } from 'lucide-react'
import { useCartStore } from '@/hooks/use-cart'
import { formatRwf } from '@/lib/utils/currency'

const emptySubscribe = () => () => {}

export function CartDrawer() {
  const t = useTranslations('cart')
  const tCommon = useTranslations('common')
  const [isOpen, setIsOpen] = useState(false)
  // False during SSR and the hydration render, true after — the cart is
  // rehydrated from localStorage on the client, so the first client render
  // must match the server-rendered empty state.
  const hydrated = useSyncExternalStore(emptySubscribe, () => true, () => false)

  const items = useCartStore((state) => state.items)
  const removeItem = useCartStore((state) => state.removeItem)
  const updateQty = useCartStore((state) => state.updateQty)
  const totalItems = useCartStore((state) => state.totalItems())
  const totalPrice = useCartStore((state) => state.totalPrice())

  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const removeButtons = useRef(new Map<string, HTMLButtonElement>())
  const pendingRemovalIndex = useRef<number | null>(null)

  // Screen reader announcement for cart changes. Kept separate from the
  // trigger's aria-label because assistive tech does not announce attribute
  // changes on an element that does not have focus.
  const [announcement, setAnnouncement] = useState('')
  const lastAnnouncedTotal = useRef<number | null>(null)

  useEffect(() => {
    if (!hydrated) return
    // Seed on the first render that has a real (localStorage-rehydrated) count
    // so page load does not announce anything.
    if (lastAnnouncedTotal.current === null) {
      lastAnnouncedTotal.current = totalItems
      return
    }
    if (lastAnnouncedTotal.current === totalItems) return
    lastAnnouncedTotal.current = totalItems
    setAnnouncement(t('itemsInCart', { count: totalItems }))
  }, [hydrated, totalItems, t])

  // Removing an item unmounts the button that was just activated, which drops
  // focus to <body> — outside the modal. Move it deliberately instead: to the
  // row that shifted into the removed row's place, or to the close button when
  // the cart is now empty.
  useEffect(() => {
    const index = pendingRemovalIndex.current
    if (index === null) return
    pendingRemovalIndex.current = null

    if (items.length === 0) {
      closeButtonRef.current?.focus()
      return
    }

    const nextItem = items[Math.min(index, items.length - 1)]
    const nextButton = nextItem ? removeButtons.current.get(nextItem.id) : undefined
    ;(nextButton ?? closeButtonRef.current)?.focus()
  }, [items])

  function handleRemove(itemId: string) {
    pendingRemovalIndex.current = items.findIndex((item) => item.id === itemId)
    removeItem(itemId)
  }

  // Modal dialog behaviour: move focus in on open, trap Tab within the panel,
  // close on Escape, lock body scroll, and restore focus to the trigger on close.
  useEffect(() => {
    if (!isOpen) return

    previouslyFocused.current = document.activeElement as HTMLElement | null
    closeButtonRef.current?.focus()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        setIsOpen(false)
        return
      }
      if (e.key !== 'Tab') return

      const panel = panelRef.current
      if (!panel) return
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused.current?.focus()
    }
  }, [isOpen])

  // Rendered in the same position in both branches so the hydration flip does
  // not insert a fresh live region (which some screen readers announce).
  const liveRegion = (
    <span role="status" aria-live="polite" className="sr-only">
      {announcement}
    </span>
  )

  if (!hydrated) {
    return (
      <>
        <button aria-label={t('open')} className="relative text-neutral-300 hover:text-brand-primary">
          <ShoppingCart size={22} aria-hidden="true" />
        </button>
        {liveRegion}
      </>
    )
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label={t('openAria', { count: totalItems })}
        className="relative text-neutral-300 transition-colors hover:text-brand-primary"
      >
        <ShoppingCart size={22} aria-hidden="true" />
        {totalItems > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold text-neutral-950">
            {totalItems}
          </span>
        )}
      </button>
      {liveRegion}

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Drawer */}
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative w-full max-w-md border-l border-neutral-800 bg-neutral-900 shadow-2xl shadow-black/50 transition-transform flex flex-col h-full animate-in slide-in-from-right"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
              <h2 id={titleId} className="text-lg font-bold text-white flex items-center gap-2">
                <ShoppingCart size={20} className="text-brand-primary" aria-hidden="true" />
                {t('title')}
              </h2>
              <button
                ref={closeButtonRef}
                onClick={() => setIsOpen(false)}
                aria-label={t('close')}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <X size={24} aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingCart size={48} className="text-neutral-700 mb-4" aria-hidden="true" />
                  <p className="text-neutral-400">{t('emptyDrawer')}</p>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="mt-6 font-medium text-brand-primary hover:underline"
                  >
                    {t('continueShopping')}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-neutral-800 bg-neutral-800 flex items-center justify-center">
                        <span className="text-xs text-neutral-400">{tCommon('noImage')}</span>
                      </div>

                      <div className="flex flex-1 flex-col">
                        <div className="flex justify-between text-sm font-medium text-white">
                          <h3 className="line-clamp-2 pr-4">{item.name}</h3>
                          <p className="ml-4">{formatRwf(item.price * item.qty)}</p>
                        </div>
                        <p className="mt-1 text-sm text-neutral-400">{formatRwf(item.price)} /{item.unitType}</p>
                        
                        <div className="flex flex-1 items-end justify-between text-sm">
                          <div className="flex items-center rounded-md border border-neutral-700">
                            <button
                              onClick={() => item.qty > 1 && updateQty(item.id, item.qty - 1)}
                              aria-label={t('decreaseQty')}
                              // aria-disabled rather than disabled: a disabled
                              // button is blurred by the browser, so stepping
                              // 2 -> 1 would drop focus out of the dialog.
                              aria-disabled={item.qty <= 1}
                              className="p-1 text-neutral-400 hover:text-white aria-disabled:opacity-50 aria-disabled:hover:text-neutral-400"
                            >
                              <Minus size={14} aria-hidden="true" />
                            </button>
                            <span className="w-8 text-center font-medium text-white">{item.qty}</span>
                            <button
                              onClick={() => updateQty(item.id, item.qty + 1)}
                              aria-label={t('increaseQty')}
                              className="p-1 text-neutral-400 hover:text-white"
                            >
                              <Plus size={14} aria-hidden="true" />
                            </button>
                          </div>

                          <button
                            type="button"
                            ref={(el) => {
                              if (el) removeButtons.current.set(item.id, el)
                              else removeButtons.current.delete(item.id)
                            }}
                            onClick={() => handleRemove(item.id)}
                            aria-label={t('removeAria', { name: item.name })}
                            className="font-medium text-red-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-neutral-800 px-6 py-6 bg-neutral-950">
                <div className="flex justify-between text-base font-medium text-white mb-4">
                  <p>{t('subtotal')}</p>
                  <p>{formatRwf(totalPrice)}</p>
                </div>
                <p className="mt-0.5 text-sm text-neutral-400 mb-6">
                  {t('deliveryNote')}
                </p>
                <Link
                  href="/checkout"
                  onClick={() => setIsOpen(false)}
                  className="flex w-full items-center justify-center rounded-full border border-transparent bg-brand-primary px-6 py-3 text-base font-semibold text-neutral-950 shadow-sm transition-colors hover:bg-amber-600"
                >
                  {t('checkout')}
                </Link>
                <div className="mt-4 flex justify-center text-center text-sm text-neutral-400">
                  <p>
                    {t('or')}{' '}
                    <button
                      type="button"
                      className="font-medium text-brand-primary hover:text-brand-primary/80"
                      onClick={() => setIsOpen(false)}
                    >
                      {t('continueShopping')}
                      <span aria-hidden="true"> &rarr;</span>
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

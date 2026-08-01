'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ArrowRight, ChevronDown, Tag } from 'lucide-react'
import { CategoryIcon } from '@/components/store/category-icon'

// Main categories only. Subcategories exist in the database and are offered on
// the shop page's filter sidebar, but the header stays at one level — five
// entries a shopper can scan in a glance, not a tree to navigate.
export type CategoryNavItem = {
  slug: string
  label: string
  /** Products in this category and everything nested under it. */
  count: number
}

type Props = {
  categories: CategoryNavItem[]
}

// Desktop mega menu.
//
// Deliberately NOT a role="menu" widget: the panel holds links, and ARIA menus
// expect menuitem children plus arrow-key roving focus that shoppers do not
// expect from site navigation. A disclosure button controlling a list of links
// is the correct pattern — it also avoids the aria-required-children family of
// axe violations documented on the account dropdown in Header.tsx.
export function CategoryMegaMenu({ categories }: Props) {
  const t = useTranslations('nav')
  const panelId = useId()
  const buttonId = useId()
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  // True once the panel has been opened deliberately (click or keyboard) as
  // opposed to drifted into with the mouse. A pinned panel ignores pointer
  // leave and only closes on click, Escape, or a click outside.
  const pinnedRef = useRef(false)

  const close = useCallback((returnFocus = false) => {
    pinnedRef.current = false
    setOpen(false)
    if (returnFocus) buttonRef.current?.focus()
  }, [])

  // A mouse click is preceded by a pointerenter that has already opened the
  // panel, so a plain toggle here would shut it again on the way in — the
  // panel would look like it never opened. The first click on a
  // hover-opened panel pins it instead.
  function onTriggerClick() {
    if (open && !pinnedRef.current) {
      pinnedRef.current = true
      return
    }
    if (open) {
      close()
    } else {
      pinnedRef.current = true
      setOpen(true)
    }
  }

  // Escape closes from anywhere inside the panel and hands focus back to the
  // trigger, so keyboard users are never stranded at the end of the link list.
  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close(true)
    }
    function onPointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) close()
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open, close])

  if (categories.length === 0) return null

  return (
    <div
      ref={wrapperRef}
      className="relative"
      // Hover is a convenience for mice only — pointerType filters out the
      // synthetic mouse events touch screens fire, which would otherwise open
      // the panel on the tap that is already toggling it.
      onPointerEnter={(e) => e.pointerType === 'mouse' && setOpen(true)}
      onPointerLeave={(e) => {
        if (e.pointerType === 'mouse' && !pinnedRef.current) setOpen(false)
      }}
      // Tabbing past the last link closes the panel behind you.
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) close()
      }}
    >
      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onTriggerClick}
        className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white aria-expanded:bg-neutral-800 aria-expanded:text-white"
      >
        {t('categories')}
        <ChevronDown
          size={15}
          aria-hidden="true"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        id={panelId}
        aria-labelledby={buttonId}
        hidden={!open}
        className="absolute left-0 top-full z-50 w-[min(44rem,calc(100vw-3rem))] pt-3"
      >
        <div className="overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900 shadow-2xl shadow-black/60">
          <ul className="grid gap-1 p-3 sm:grid-cols-2">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/shop?category=${category.slug}`}
                  onClick={() => close()}
                  className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-neutral-800 focus-visible:bg-neutral-800"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary transition-colors group-hover:bg-brand-primary group-hover:text-neutral-950">
                    <CategoryIcon slug={category.slug} size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white">
                      {category.label}
                    </span>
                    <span className="block text-xs text-neutral-400">
                      {category.count > 0
                        ? t('categoryItems', { count: category.count })
                        : t('comingSoon')}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-neutral-800 bg-neutral-950/60 px-6 py-3.5">
            <Link
              href="/shop"
              onClick={() => close()}
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary transition-colors hover:text-amber-500"
            >
              {t('allProducts')}
              <ArrowRight
                size={14}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
            <Link
              href="/shop?sale=1"
              onClick={() => close()}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-300 transition-colors hover:text-white"
            >
              <Tag size={14} aria-hidden="true" />
              {t('shopDeals')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// Mobile counterpart: same links, rendered as an in-flow accordion inside the
// slide-down menu rather than an overlay panel.
export function CategoryAccordion({
  categories,
  onNavigate,
}: Props & { onNavigate: () => void }) {
  const t = useTranslations('nav')
  const panelId = useId()
  const [open, setOpen] = useState(false)

  if (categories.length === 0) return null

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-neutral-200 transition-colors hover:bg-neutral-800 hover:text-white"
      >
        {t('categories')}
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <ul id={panelId} hidden={!open} className="mb-1 ml-4 space-y-0.5 border-l border-neutral-800 pl-3">
        {categories.map((category) => (
          <li key={category.slug}>
            <Link
              href={`/shop?category=${category.slug}`}
              onClick={onNavigate}
              className="flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm text-neutral-200 transition-colors hover:bg-neutral-800 hover:text-white"
            >
              <span className="flex items-center gap-2.5">
                <CategoryIcon slug={category.slug} size={16} className="text-brand-primary" />
                {category.label}
              </span>
              <span className="text-xs text-neutral-400">
                {category.count > 0 ? category.count : t('comingSoon')}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

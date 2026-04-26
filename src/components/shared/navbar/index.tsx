'use client'

import Link from 'next/link'
import { ShoppingCart, Menu, X, Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import { NAV_LINKS, APP_NAME } from '@/constants/app'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/hooks/use-cart'

function CartBadge() {
  const [mounted, setMounted] = useState(false)
  const totalItems = useCartStore((s) => s.totalItems())

  useEffect(() => setMounted(true), [])

  if (!mounted || totalItems === 0) return null

  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold text-white">
      {totalItems > 99 ? '99+' : totalItems}
    </span>
  )
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-neutral-900/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary text-white text-sm font-black">
            IC
          </span>
          <span className="hidden sm:block">{APP_NAME}</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-1.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
            aria-label="Search"
          >
            <Search size={18} />
          </button>

          <Link
            href="/cart"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
            aria-label="Cart"
          >
            <ShoppingCart size={18} />
            <CartBadge />
          </Link>

          <Link href="/login" className="hidden sm:block">
            <Button variant="ghost" size="sm" className="text-neutral-300 hover:text-white">
              Login
            </Button>
          </Link>

          <Link href="/signup" className="hidden sm:block">
            <Button size="sm" className="bg-white text-neutral-900 hover:bg-neutral-100 rounded-full font-semibold">
              Sign up
            </Button>
          </Link>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileOpen && (
        <div className="border-t border-neutral-800 bg-neutral-900 px-4 pb-6 pt-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex gap-2">
            <Link href="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" className="w-full border-neutral-700 text-white">Login</Button>
            </Link>
            <Link href="/signup" className="flex-1" onClick={() => setMobileOpen(false)}>
              <Button className="w-full bg-brand-primary text-white hover:bg-amber-600">Sign up</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { User, Search, Menu, X, LogOut, LayoutDashboard } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { CartDrawer } from '@/components/store/CartDrawer'
import { LocaleSwitcher } from '@/components/shared/locale-switcher'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface HeaderProps {
  user: SupabaseUser | null
  portalLink: string
  portalLabel: string
}

export function Header({ user, portalLink, portalLabel }: HeaderProps) {
  const t = useTranslations('nav')
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')

  const navLinks = [
    { href: '/shop', label: t('shop') },
    { href: '/shop?sale=1', label: t('deals') },
    { href: '/partner/register', label: t('sellOnIsokoClick') },
  ]

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    router.push(q ? `/shop?search=${encodeURIComponent(q)}` : '/shop')
    setMobileOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

        <div className="flex items-center gap-6">
          <button
            type="button"
            className="text-neutral-300 transition-colors hover:text-white lg:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? t('closeMenu') : t('menu')}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <Link href="/" className="group flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary font-black text-white transition-transform group-hover:scale-105">
              IC
            </div>
            <span className="hidden text-xl font-bold tracking-tight text-white sm:block">
              IsokoClick
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label={t('menu')}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <form onSubmit={handleSearch} className="hidden flex-1 items-center justify-end px-4 lg:flex">
          <div className="relative w-full max-w-md">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full rounded-full border border-neutral-800 bg-neutral-900 py-2 pl-10 pr-4 text-sm text-white placeholder:text-neutral-500 transition-all focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            />
            <Search className="absolute left-3 top-2.5 text-neutral-500" size={18} aria-hidden="true" />
          </div>
        </form>

        <div className="flex items-center gap-3 sm:gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:bg-neutral-800">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800 text-neutral-300">
                    <User size={20} />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.user_metadata?.full_name || t('myAccount')}</p>
                    <p className="text-xs leading-none text-neutral-500">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={portalLink} className="flex cursor-pointer items-center">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>{portalLabel}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account/orders" className="cursor-pointer">{t('myOrders')}</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <form action="/auth/signout" method="POST">
                  <button type="submit" className="w-full">
                    <DropdownMenuItem className="cursor-pointer text-red-500 focus:text-red-500">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{t('logOut')}</span>
                    </DropdownMenuItem>
                  </button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 text-sm font-medium text-neutral-300 transition-colors hover:text-white"
            >
              <User size={20} />
              <span className="hidden sm:block">{t('signIn')}</span>
            </Link>
          )}

          <LocaleSwitcher className="hidden sm:flex" variant="dark" />

          <div className="hidden h-6 w-px bg-neutral-800 sm:block"></div>

          <CartDrawer />
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-neutral-800 bg-neutral-950 px-4 pb-6 pt-4 lg:hidden">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full rounded-full border border-neutral-800 bg-neutral-900 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-neutral-500 focus:border-brand-primary focus:outline-none"
              />
              <Search className="absolute left-3 top-3 text-neutral-500" size={18} aria-hidden="true" />
            </div>
          </form>
          <nav className="mt-4 flex flex-col gap-1" aria-label={t('menu')}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-neutral-200 transition-colors hover:bg-neutral-800 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 border-t border-neutral-800 pt-4 sm:hidden">
            <LocaleSwitcher variant="dark" />
          </div>
        </div>
      )}
    </header>
  )
}

'use client'

import Link from 'next/link'
import { User, Search, Menu, LogOut, LayoutDashboard } from 'lucide-react'
import { CartDrawer } from '@/components/store/CartDrawer'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type HeaderUser = {
  email?: string
  user_metadata?: { full_name?: string }
}

interface HeaderProps {
  user: HeaderUser | null
  portalLink: string
  portalLabel: string
}

export function Header({ user, portalLink, portalLabel }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center gap-4">
          <button className="lg:hidden text-neutral-600 hover:text-brand-primary">
            <Menu size={24} />
          </button>
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary font-black text-white transition-transform group-hover:scale-105">
              IC
            </div>
            <span className="hidden text-xl font-bold tracking-tight text-neutral-900 sm:block">
              IsokoClick
            </span>
          </Link>
        </div>

        <div className="hidden flex-1 items-center justify-center px-8 lg:flex">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Search products..."
              className="w-full rounded-full border border-neutral-200 bg-neutral-50 py-2 pl-10 pr-4 text-sm focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
            />
            <Search className="absolute left-3 top-2.5 text-neutral-400" size={18} />
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:bg-neutral-100" />
                }
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-200 text-neutral-600">
                  <User size={20} />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.user_metadata?.full_name || 'My Account'}</p>
                    <p className="text-xs leading-none text-neutral-500">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  render={<Link href={portalLink} className="flex cursor-pointer items-center" />}
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>{portalLabel}</span>
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/account/orders" className="cursor-pointer" />}>
                  My Orders
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <form action="/auth/signout" method="POST">
                  <DropdownMenuItem
                    variant="destructive"
                    render={<button type="submit" className="w-full cursor-pointer" />}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login" className="flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-brand-primary transition-colors">
              <User size={20} />
              <span className="hidden sm:block">Sign In</span>
            </Link>
          )}
          
          <div className="h-6 w-px bg-neutral-200 hidden sm:block"></div>
          
          <CartDrawer />
        </div>

      </div>
    </header>
  )
}

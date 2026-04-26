import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Wallet,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

const NAV = [
  { href: '/partner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/partner/catalog',   label: 'Catalog',   icon: Package },
  { href: '/partner/orders',    label: 'Orders',    icon: ShoppingBag },
  { href: '/partner/payouts',   label: 'Payouts',   icon: Wallet },
]

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'partner') redirect('/')

  return (
    <div className="flex min-h-screen bg-neutral-950">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-neutral-800 bg-neutral-900">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 border-b border-neutral-800 px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-xs font-black text-black">
            P
          </span>
          <span className="text-sm font-bold text-white">Partner Portal</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 p-3">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-neutral-800 p-3">
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-white"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  )
}

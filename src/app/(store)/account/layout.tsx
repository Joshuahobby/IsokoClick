import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { User, ShoppingBag, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'My Account' }

const NAV_LINKS = [
  { href: '/account/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/account/profile', label: 'Profile', icon: User },
  { href: '/account/settings', label: 'Settings', icon: Settings },
]

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/account/orders')

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <nav className="space-y-1 rounded-xl border border-neutral-800 bg-neutral-900 p-3">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
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
        </aside>

        {/* Content */}
        <div className="lg:col-span-3">{children}</div>
      </div>
    </div>
  )
}

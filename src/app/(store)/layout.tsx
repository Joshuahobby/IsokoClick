import Link from 'next/link'
import { User, Search, Menu } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getPartnerByUserId } from '@/lib/supabase/queries/partners'
import { CartDrawer } from '@/components/store/CartDrawer'

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let portalLink = '/auth/signin'
  let portalLabel = 'Sign In'

  if (user) {
    if (user.user_metadata?.role === 'admin') {
      portalLink = '/admin/dashboard'
      portalLabel = 'Admin'
    } else if (user.user_metadata?.role === 'partner') {
      portalLink = '/partner/dashboard'
      portalLabel = 'Partner'
    } else {
      portalLink = '/account' // Placeholder for customer account
      portalLabel = 'Account'
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-neutral-600 hover:text-brand-primary">
              <Menu size={24} />
            </button>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary font-black text-white">
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
                className="w-full rounded-full border border-neutral-300 bg-neutral-100 py-2 pl-10 pr-4 text-sm focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
              <Search className="absolute left-3 top-2.5 text-neutral-400" size={18} />
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <Link href={portalLink} className="flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-brand-primary">
              <User size={20} />
              <span className="hidden sm:block">{portalLabel}</span>
            </Link>
            
            <CartDrawer />
          </div>

        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary font-black text-white">
                  IC
                </div>
                <span className="text-xl font-bold text-neutral-900">IsokoClick</span>
              </div>
              <p className="text-sm text-neutral-500">
                Your premier destination for wholesale and dropship products in Rwanda.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 mb-4">Shop</h3>
              <ul className="space-y-2 text-sm text-neutral-500">
                <li><Link href="/" className="hover:text-brand-primary">All Products</Link></li>
                <li><Link href="/" className="hover:text-brand-primary">New Arrivals</Link></li>
                <li><Link href="/" className="hover:text-brand-primary">Featured</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-neutral-500">
                <li><Link href="/auth/partner/register" className="hover:text-brand-primary">Become a Partner</Link></li>
                <li><Link href="/" className="hover:text-brand-primary">About Us</Link></li>
                <li><Link href="/" className="hover:text-brand-primary">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-neutral-500">
                <li><Link href="/" className="hover:text-brand-primary">Terms of Service</Link></li>
                <li><Link href="/" className="hover:text-brand-primary">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-neutral-200 pt-8 text-center text-sm text-neutral-500">
            &copy; {new Date().getFullYear()} IsokoClick. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/store/Header'

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let portalLink = '/login'
  let portalLabel = 'Dashboard'

  if (user) {
    const role = user.user_metadata?.role
    if (role === 'admin') {
      portalLink = '/admin/dashboard'
      portalLabel = 'Admin Dashboard'
    } else if (role === 'partner') {
      portalLink = '/partner/dashboard'
      portalLabel = 'Partner Dashboard'
    } else {
      portalLink = '/orders' // Customer orders
      portalLabel = 'My Orders'
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900">
      <Header user={user} portalLink={portalLink} portalLabel={portalLabel} />

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t border-neutral-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
            <div className="space-y-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary font-black text-white">
                  IC
                </div>
                <span className="text-xl font-bold text-neutral-900">IsokoClick</span>
              </Link>
              <p className="text-sm leading-relaxed text-neutral-500">
                Rwanda&apos;s leading B2B and wholesale marketplace. Bridging the gap between verified partners and smart businesses.
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 mb-6">Shop</h3>
              <ul className="space-y-4 text-sm text-neutral-500">
                <li><Link href="/" className="hover:text-brand-primary transition-colors">All Products</Link></li>
                <li><Link href="/category/agriculture" className="hover:text-brand-primary transition-colors">Agriculture</Link></li>
                <li><Link href="/category/construction" className="hover:text-brand-primary transition-colors">Construction</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 mb-6">Support</h3>
              <ul className="space-y-4 text-sm text-neutral-500">
                <li><Link href="/partner/register" className="hover:text-brand-primary transition-colors">Sell on IsokoClick</Link></li>
                <li><Link href="/contact" className="hover:text-brand-primary transition-colors">Contact Support</Link></li>
                <li><Link href="/faq" className="hover:text-brand-primary transition-colors">Help Center</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 mb-6">Platform</h3>
              <ul className="space-y-4 text-sm text-neutral-500">
                <li><Link href="/login" className="hover:text-brand-primary transition-colors">Sign In</Link></li>
                <li><Link href="/partner/register" className="hover:text-brand-primary transition-colors">Partner Registration</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-16 border-t border-neutral-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-neutral-400">
              &copy; {new Date().getFullYear()} IsokoClick. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-xs text-neutral-400 hover:text-neutral-600">Privacy Policy</Link>
              <Link href="/terms" className="text-xs text-neutral-400 hover:text-neutral-600">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

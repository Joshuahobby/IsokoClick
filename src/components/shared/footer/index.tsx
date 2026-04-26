import Link from 'next/link'
import { APP_NAME, APP_TAGLINE } from '@/constants/app'

export function Footer() {
  return (
    <footer className="border-t border-neutral-800 bg-neutral-900 mt-20">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 font-bold text-lg text-white mb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-primary text-white text-xs font-black">IC</span>
              {APP_NAME}
            </div>
            <p className="text-sm text-neutral-400">{APP_TAGLINE}</p>
            <p className="text-xs text-neutral-600 mt-2">Kigali, Rwanda</p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Shop</h4>
            <ul className="space-y-2">
              {['All Products', 'Categories', 'New Arrivals', 'Best Sellers', 'Sale'].map((item) => (
                <li key={item}>
                  <Link href="/shop" className="text-sm text-neutral-400 hover:text-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Company</h4>
            <ul className="space-y-2">
              {['About Us', 'Blog', 'Careers', 'Press', 'Contact'].map((item) => (
                <li key={item}>
                  <Link href="/" className="text-sm text-neutral-400 hover:text-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Support</h4>
            <ul className="space-y-2">
              {['Help Center', 'Track Order', 'Returns', 'Become a Partner', 'B2B / Bulk Orders'].map((item) => (
                <li key={item}>
                  <Link href="/" className="text-sm text-neutral-400 hover:text-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-neutral-800 pt-6 sm:flex-row">
          <p className="text-xs text-neutral-600">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors">Privacy Policy</Link>
            <Link href="/" className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

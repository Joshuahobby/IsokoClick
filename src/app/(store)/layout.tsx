import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/store/Header'

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [tNav, tFooter] = await Promise.all([
    getTranslations('nav'),
    getTranslations('footer'),
  ])

  let portalLink = '/login'
  let portalLabel = tNav('dashboard')

  if (user) {
    const role = user.app_metadata?.role
    if (role === 'admin') {
      portalLink = '/admin/dashboard'
      portalLabel = tNav('adminDashboard')
    } else if (role === 'partner') {
      portalLink = '/partner/dashboard'
      portalLabel = tNav('partnerDashboard')
    } else {
      portalLink = '/orders' // Customer orders
      portalLabel = tNav('myOrders')
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
                {tFooter('description')}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 mb-6">{tFooter('shop')}</h3>
              <ul className="space-y-4 text-sm text-neutral-500">
                <li><Link href="/" className="hover:text-brand-primary transition-colors">{tFooter('allProducts')}</Link></li>
                <li><Link href="/category/agriculture" className="hover:text-brand-primary transition-colors">{tFooter('agriculture')}</Link></li>
                <li><Link href="/category/construction" className="hover:text-brand-primary transition-colors">{tFooter('construction')}</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 mb-6">{tFooter('support')}</h3>
              <ul className="space-y-4 text-sm text-neutral-500">
                <li><Link href="/partner/register" className="hover:text-brand-primary transition-colors">{tFooter('sellOnIsokoClick')}</Link></li>
                <li><Link href="/contact" className="hover:text-brand-primary transition-colors">{tFooter('contactSupport')}</Link></li>
                <li><Link href="/faq" className="hover:text-brand-primary transition-colors">{tFooter('helpCenter')}</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 mb-6">{tFooter('platform')}</h3>
              <ul className="space-y-4 text-sm text-neutral-500">
                <li><Link href="/login" className="hover:text-brand-primary transition-colors">{tFooter('signIn')}</Link></li>
                <li><Link href="/partner/register" className="hover:text-brand-primary transition-colors">{tFooter('partnerRegistration')}</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-16 border-t border-neutral-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-neutral-400">
              {tFooter('copyright', { year: new Date().getFullYear() })}
            </p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-xs text-neutral-400 hover:text-neutral-600">{tFooter('privacyPolicy')}</Link>
              <Link href="/terms" className="text-xs text-neutral-400 hover:text-neutral-600">{tFooter('termsOfService')}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

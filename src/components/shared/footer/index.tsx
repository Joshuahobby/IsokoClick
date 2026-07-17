import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { APP_NAME } from '@/constants/app'

export async function Footer() {
  const t = await getTranslations('footer')

  const shopLinks = [
    { href: '/shop', label: t('allMaterials') },
    { href: '/shop?category=structure', label: t('structure') },
    { href: '/shop?category=steel', label: t('steel') },
    { href: '/shop?category=finishes', label: t('finishes') },
    { href: '/shop?category=plumbing', label: t('plumbing') },
    { href: '/shop?sale=1', label: t('onSale') },
  ]

  const accountLinks = [
    { href: '/login', label: t('signIn') },
    { href: '/signup', label: t('createAccount') },
    { href: '/account/orders', label: t('myOrders') },
  ]

  const partnerLinks = [
    { href: '/partner/register', label: t('sellOnIsokoClick') },
    { href: '/partner/register', label: t('partnerRegistration') },
  ]

  return (
    <footer className="border-t border-neutral-800 bg-neutral-950">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">

          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary text-xs font-black text-white">
                IC
              </span>
              {APP_NAME}
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-neutral-400">{t('description')}</p>
            <p className="mt-3 text-xs text-neutral-400">{t('kigali')}</p>

            <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              {t('payWith')}
            </p>
            <div className="mt-2 flex gap-2">
              <span className="rounded-full border border-neutral-800 px-3 py-1 text-xs font-semibold text-neutral-300">
                MTN MoMo
              </span>
              <span className="rounded-full border border-neutral-800 px-3 py-1 text-xs font-semibold text-neutral-300">
                Airtel Money
              </span>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-sm font-semibold text-white">{t('shop')}</h4>
            <ul className="mt-4 space-y-2.5">
              {shopLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-neutral-400 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-sm font-semibold text-white">{t('account')}</h4>
            <ul className="mt-4 space-y-2.5">
              {accountLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-neutral-400 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Partners */}
          <div>
            <h4 className="text-sm font-semibold text-white">{t('partners')}</h4>
            <ul className="mt-4 space-y-2.5">
              {partnerLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-neutral-400 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-neutral-800 pt-6 sm:flex-row">
          <p className="text-xs text-neutral-400">{t('copyright', { year: new Date().getFullYear() })}</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-xs text-neutral-400 transition-colors hover:text-white">
              {t('privacyPolicy')}
            </Link>
            <Link href="/terms" className="text-xs text-neutral-400 transition-colors hover:text-white">
              {t('termsOfService')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

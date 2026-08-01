import { getLocale, getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { getCategoryTree } from '@/lib/supabase/queries/products'
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/shared/footer'
import { SkipLink, MainLandmark } from '@/components/shared/skip-link'
import { localize } from '@/lib/utils/localize'
import type { AppLocale } from '@/i18n/locales'

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const locale = (await getLocale()) as AppLocale
  const [tNav, categoryTree] = await Promise.all([
    getTranslations('nav'),
    getCategoryTree(),
  ])

  // Main categories only — subcategories stay out of the header and live on
  // the shop page's filter sidebar. The count is still the subtree total, so
  // Plumbing reads 21 and clicking it returns all 21.
  //
  // Ranges still waiting on stock are kept rather than hidden: the mega menu
  // labels those "coming soon", so the menu holds its shape as they fill up.
  const navCategories = categoryTree.map((category) => ({
    slug: category.slug,
    label: localize(locale, category.name_en, category.name_rw),
    count: category.productCount,
  }))

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
      portalLink = '/account/orders'
      portalLabel = tNav('myOrders')
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SkipLink />
      <Header
        user={user}
        portalLink={portalLink}
        portalLabel={portalLabel}
        categories={navCategories}
      />

      <MainLandmark className="flex-1">
        {children}
      </MainLandmark>

      <Footer />
    </div>
  )
}

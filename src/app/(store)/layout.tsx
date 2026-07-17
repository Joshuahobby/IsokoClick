import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/shared/footer'

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const tNav = await getTranslations('nav')

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
      <Header user={user} portalLink={portalLink} portalLabel={portalLabel} />

      <main className="flex-1">
        {children}
      </main>

      <Footer />
    </div>
  )
}

import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export const SUPPORTED_LOCALES = ['en', 'rw'] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

function isSupportedLocale(value: unknown): value is AppLocale {
  return value === 'en' || value === 'rw'
}

// Non-routed i18n: no /en or /rw URL prefix. The locale comes from the
// signed-in user's users.preferred_lang column, then a NEXT_LOCALE
// cookie for guests (set by a future language switcher); build-time
// prerendering falls back to English.
export default getRequestConfig(async () => {
  let locale: AppLocale = 'en'

  try {
    const cookieLocale = (await cookies()).get('NEXT_LOCALE')?.value
    if (isSupportedLocale(cookieLocale)) locale = cookieLocale

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('preferred_lang')
        .eq('auth_id', user.id)
        .single()
      const preferred = (profile as { preferred_lang?: string } | null)?.preferred_lang
      if (isSupportedLocale(preferred)) locale = preferred
    }
  } catch {
    // No request context (static prerender) or auth hiccup — default to en
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})

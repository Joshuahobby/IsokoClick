'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { SUPPORTED_LOCALES, type AppLocale } from '@/i18n/locales'

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

// Sets the guest-facing locale cookie and, for signed-in users, persists
// the choice to users.preferred_lang so it follows them across devices —
// both are read by src/i18n/request.ts on every request.
export async function setLocale(locale: string): Promise<void> {
  if (!SUPPORTED_LOCALES.includes(locale as AppLocale)) return

  const cookieStore = await cookies()
  cookieStore.set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: ONE_YEAR_SECONDS,
    sameSite: 'lax',
  })

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    await supabase.from('users').update({ preferred_lang: locale as AppLocale }).eq('auth_id', user.id)
  }
}

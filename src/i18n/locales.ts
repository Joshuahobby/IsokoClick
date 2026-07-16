// Locale constants shared by server (request.ts) and client (locale-switcher)
// code. Kept free of server-only imports (next/headers, supabase/server) so
// client components can import it without pulling those into the bundle.
export const SUPPORTED_LOCALES = ['en', 'rw'] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

export function isSupportedLocale(value: unknown): value is AppLocale {
  return value === 'en' || value === 'rw'
}

import type { AppLocale } from '@/i18n/locales'

// Products, categories, and specs carry parallel _en/_rw columns rather
// than a translations table. Falls back to the English value when the
// Kinyarwanda column is null (not every row has been translated yet).
export function localize(locale: AppLocale, en: string, rw: string | null | undefined): string {
  return locale === 'rw' && rw ? rw : en
}

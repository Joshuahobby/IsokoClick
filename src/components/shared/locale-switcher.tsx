'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { setLocale } from '@/lib/actions/locale'
import { SUPPORTED_LOCALES, type AppLocale } from '@/i18n/locales'
import { cn } from '@/lib/utils'

const LABELS: Record<AppLocale, string> = { en: 'EN', rw: 'RW' }

type Variant = 'light' | 'dark'

const VARIANT_CLASSES: Record<Variant, { divider: string; inactive: string }> = {
  light: { divider: 'text-neutral-300', inactive: 'text-neutral-600 hover:text-neutral-900' },
  dark: { divider: 'text-neutral-700', inactive: 'text-neutral-400 hover:text-white' },
}

export function LocaleSwitcher({
  className,
  variant = 'light',
}: {
  className?: string
  variant?: Variant
}) {
  const locale = useLocale() as AppLocale
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { divider, inactive } = VARIANT_CLASSES[variant]

  function handleSelect(next: AppLocale) {
    if (next === locale || isPending) return
    startTransition(async () => {
      await setLocale(next)
      router.refresh()
    })
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className={cn('flex items-center gap-1 text-xs font-semibold', className)}
    >
      {SUPPORTED_LOCALES.map((code, i) => (
        <span key={code} className="flex items-center gap-1">
          {i > 0 && <span className={divider} aria-hidden="true">/</span>}
          <button
            type="button"
            onClick={() => handleSelect(code)}
            disabled={isPending}
            aria-pressed={locale === code}
            className={cn(
              'rounded px-1 py-0.5 transition-colors disabled:opacity-50',
              locale === code ? 'text-brand-primary' : inactive
            )}
          >
            {LABELS[code]}
          </button>
        </span>
      ))}
    </div>
  )
}

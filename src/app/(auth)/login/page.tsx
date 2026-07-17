'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function LoginForm() {
  const t = useTranslations('auth')
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
      <h1 className="mb-1 text-2xl font-bold text-white">{t('welcomeBack')}</h1>
      <p className="mb-6 text-sm text-neutral-400">{t('signInSubtitle')}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-neutral-300">{t('email')}</Label>
          <Input
            id="email"
            type="email"
            placeholder={t('emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-brand-primary"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-neutral-300">{t('password')}</Label>
            <Link
              href="/reset-password"
              className="text-xs text-neutral-500 hover:text-brand-primary transition-colors"
            >
              {t('forgotPassword')}
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder={t('passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-brand-primary"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-primary font-semibold text-neutral-950 hover:bg-amber-600 disabled:opacity-50"
        >
          {loading ? t('signingIn') : t('login')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        {t('noAccount')}{' '}
        <Link href="/signup" className="text-brand-primary hover:text-amber-400 transition-colors">
          {t('signup')}
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  const t = useTranslations('common')

  return (
    <Suspense fallback={<div className="p-8 text-white">{t('loading')}</div>}>
      <LoginForm />
    </Suspense>
  )
}

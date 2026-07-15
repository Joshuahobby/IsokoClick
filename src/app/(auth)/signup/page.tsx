'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignupPage() {
  const t = useTranslations('auth')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/callback`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-center">
        <div className="mb-4 flex justify-center">
          <CheckCircle size={40} className="text-brand-primary" />
        </div>
        <h1 className="mb-2 text-xl font-bold text-white">{t('checkEmail')}</h1>
        <p className="text-sm text-neutral-400">
          {t.rich('confirmLinkSent', {
            email,
            strong: (chunks) => <span className="font-medium text-white">{chunks}</span>,
          })}
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm text-brand-primary hover:text-amber-400 transition-colors"
        >
          {t('backToLogin')}
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
      <h1 className="mb-1 text-2xl font-bold text-white">{t('signup')}</h1>
      <p className="mb-6 text-sm text-neutral-400">
        {t('signupSubtitle')}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullName" className="text-neutral-300">{t('fullName')}</Label>
          <Input
            id="fullName"
            type="text"
            placeholder={t('fullNamePlaceholder')}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
            className="border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-brand-primary"
          />
        </div>

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
          <Label htmlFor="password" className="text-neutral-300">{t('password')}</Label>
          <Input
            id="password"
            type="password"
            placeholder={t('passwordMinPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-brand-primary"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-primary font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
        >
          {loading ? t('creatingAccount') : t('signup')}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-neutral-600">
        {t('terms')}
      </p>

      <p className="mt-4 text-center text-sm text-neutral-500">
        {t('hasAccount')}{' '}
        <Link href="/login" className="text-brand-primary hover:text-amber-400 transition-colors">
          {t('login')}
        </Link>
      </p>
    </div>
  )
}

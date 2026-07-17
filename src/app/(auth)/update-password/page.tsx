'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function UpdatePasswordPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError(t('passwordsDontMatch'))
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.updateUser({ password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
      <h1 className="mb-1 text-2xl font-bold text-white">{t('newPasswordTitle')}</h1>
      <p className="mb-6 text-sm text-neutral-400">{t('newPasswordSubtitle')}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-neutral-300">{t('newPassword')}</Label>
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

        <div className="space-y-1.5">
          <Label htmlFor="confirm" className="text-neutral-300">{t('confirmPassword')}</Label>
          <Input
            id="confirm"
            type="password"
            placeholder={t('passwordPlaceholder')}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
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
          className="w-full bg-brand-primary font-semibold text-neutral-950 hover:bg-amber-600 disabled:opacity-50"
        >
          {loading ? t('updating') : t('updatePassword')}
        </Button>
      </form>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
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
        <h1 className="mb-2 text-xl font-bold text-white">Check your email</h1>
        <p className="text-sm text-neutral-400">
          We sent a password reset link to{' '}
          <span className="font-medium text-white">{email}</span>. The link
          expires in 1 hour.
        </p>
        <Link
          href="/auth/login"
          className="mt-6 inline-block text-sm text-brand-primary hover:text-amber-400 transition-colors"
        >
          Back to login
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
      <h1 className="mb-1 text-2xl font-bold text-white">Reset password</h1>
      <p className="mb-6 text-sm text-neutral-400">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-neutral-300">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-brand-primary"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-primary font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
        >
          {loading ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>

      <div className="mt-8 text-center">
        <Link href="/login" className="text-sm text-neutral-500 hover:text-brand-primary transition-colors">
          Back to login
        </Link>
      </div>
    </div>
  )
}

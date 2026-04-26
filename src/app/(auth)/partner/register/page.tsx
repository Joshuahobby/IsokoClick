'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { applyForPartner } from './actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const initialState = { error: '' }

export default function PartnerRegistrationPage() {
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await applyForPartner(formData)
      if (result?.error) {
        return { error: result.error }
      }
      return prevState
    },
    initialState
  )

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-8 shadow-xl">
        <div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-white">
            Become a Partner
          </h2>
          <p className="mt-2 text-center text-sm text-neutral-400">
            Join IsokoClick and start dropshipping your products to thousands of customers.
          </p>
        </div>

        <form className="mt-8 space-y-6" action={formAction}>
          {state.error && (
            <div className="rounded-lg bg-red-500/10 p-4 text-sm text-red-400">
              {state.error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="business_name" className="text-neutral-300">
                Business Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="business_name"
                name="business_name"
                type="text"
                required
                className="border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500 focus-visible:ring-brand-primary"
                placeholder="e.g. Kigali Wholesale"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-neutral-300">
                  Business Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500 focus-visible:ring-brand-primary"
                  placeholder="contact@company.rw"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-neutral-300">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  className="border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500 focus-visible:ring-brand-primary"
                  placeholder="078..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="tin_number" className="text-neutral-300">
                  TIN Number
                </Label>
                <Input
                  id="tin_number"
                  name="tin_number"
                  type="text"
                  className="border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500 focus-visible:ring-brand-primary"
                  placeholder="9-digit TIN"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="district" className="text-neutral-300">
                  District
                </Label>
                <Input
                  id="district"
                  name="district"
                  type="text"
                  className="border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500 focus-visible:ring-brand-primary"
                  placeholder="e.g. Gasabo"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-neutral-300">
                Physical Address
              </Label>
              <Input
                id="address"
                name="address"
                type="text"
                className="border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500 focus-visible:ring-brand-primary"
                placeholder="Street name, building, etc."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-neutral-300">
                Business Description
              </Label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-neutral-900"
                placeholder="What kinds of products do you sell?"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="flex w-full justify-center rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary disabled:opacity-50"
          >
            {isPending ? 'Submitting Application...' : 'Apply Now'}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-500">
          Already a partner?{' '}
          <Link href="/login" className="font-semibold text-brand-primary hover:text-brand-primary/80">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

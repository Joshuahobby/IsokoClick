'use client'

import { useActionState } from 'react'
import { updatePayoutInfo } from './actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function PayoutForm({ currentPhone }: { currentPhone: string | null }) {
  const [state, formAction, isPending] = useActionState(
    async (prevState: { error: string; success: boolean }, formData: FormData) => {
      const result = await updatePayoutInfo(formData)
      if (result?.error) {
        return { error: result.error, success: false }
      }
      return { error: '', success: true }
    },
    { error: '', success: false }
  )

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-lg bg-green-500/10 p-3 text-sm text-green-400">
          Payout settings updated successfully!
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="payout_phone" className="text-neutral-300">
          Mobile Money Phone Number
        </Label>
        <Input
          id="payout_phone"
          name="payout_phone"
          type="tel"
          defaultValue={currentPhone || ''}
          placeholder="078..."
          className="border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500 focus-visible:ring-brand-primary"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-neutral-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:opacity-50"
      >
        {isPending ? 'Updating...' : 'Update Payout Info'}
      </button>
    </form>
  )
}

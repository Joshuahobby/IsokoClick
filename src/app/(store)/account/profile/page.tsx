import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserProfileId } from '@/lib/supabase/queries/orders'

export const metadata: Metadata = { title: 'Profile' }

export default async function AccountProfilePage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login?redirectTo=/account/profile')

  const customerId = await getUserProfileId(authUser.id)
  if (!customerId) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, email, phone, role')
    .eq('id', customerId)
    .single()

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-white">Profile</h1>
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <dl className="space-y-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-neutral-500">Name</dt>
            <dd className="text-white">{(profile as { full_name: string } | null)?.full_name ?? '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-500">Email</dt>
            <dd className="text-white">{authUser.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-500">Phone</dt>
            <dd className="text-white">{(profile as { phone: string | null } | null)?.phone ?? '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-500">Account type</dt>
            <dd className="capitalize text-white">{(profile as { role: string } | null)?.role ?? '—'}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

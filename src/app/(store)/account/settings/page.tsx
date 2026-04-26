import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Settings' }

export default function AccountSettingsPage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-white">Settings</h1>
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <p className="text-sm text-neutral-500">Account settings coming soon.</p>
      </div>
    </div>
  )
}

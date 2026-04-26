import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Analytics — Admin' }

export default function AdminAnalyticsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">Analytics</h1>
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-8 text-center">
        <p className="text-neutral-500">Analytics dashboard coming in Phase 3.</p>
      </div>
    </div>
  )
}

import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

export const metadata = { title: 'Application Received | IsokoClick' }

export default function PartnerRegisterSuccessPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <CheckCircle2 size={32} className="text-green-600" />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">
        Application received!
      </h1>
      <p className="mt-3 text-neutral-500">
        Thanks for applying to become an IsokoClick partner. Our team reviews
        every application — you&apos;ll get access to the Partner Portal as soon
        as your account is approved.
      </p>
      <div className="mt-8">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-neutral-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-neutral-800"
        >
          Back to the store
        </Link>
      </div>
    </div>
  )
}

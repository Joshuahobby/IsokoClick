import { CheckoutClient } from './CheckoutClient'

export const metadata = { title: 'Checkout | IsokoClick' }

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Checkout</h1>
      </div>
      
      <CheckoutClient />
    </div>
  )
}

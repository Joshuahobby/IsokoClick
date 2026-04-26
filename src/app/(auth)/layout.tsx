import Link from 'next/link'
import { APP_NAME } from '@/constants/app'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 font-bold text-xl text-white">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary text-white text-sm font-black">
          IC
        </span>
        <span>{APP_NAME}</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}

import Link from 'next/link'
import { APP_NAME } from '@/constants/app'
import { LocaleSwitcher } from '@/components/shared/locale-switcher'
import { SkipLink, MainLandmark } from '@/components/shared/skip-link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-4 py-12">
      <SkipLink />
      <header className="mb-8 flex w-full max-w-md items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary text-neutral-950 text-sm font-black">
            IC
          </span>
          <span>{APP_NAME}</span>
        </Link>
        <LocaleSwitcher variant="dark" />
      </header>
      <MainLandmark className="w-full max-w-md">{children}</MainLandmark>
    </div>
  )
}

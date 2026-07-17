'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  currentPage: number
  totalPages: number
}

export function ShopPagination({ currentPage, totalPages }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    router.push(`${pathname}?${params.toString()}`)
  }

  // Show up to 5 page buttons around current
  const pages: (number | 'ellipsis')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage > 3) pages.push('ellipsis')
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i)
    }
    if (currentPage < totalPages - 2) pages.push('ellipsis')
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        disabled={currentPage <= 1}
        onClick={() => goToPage(currentPage - 1)}
        className="h-9 w-9 rounded-lg border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white disabled:opacity-30"
      >
        <ChevronLeft size={16} />
      </Button>

      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`e-${i}`} className="px-2 text-neutral-600">…</span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => goToPage(p)}
            className={`h-9 min-w-9 rounded-lg px-3 text-sm font-medium transition-colors ${
              p === currentPage
                ? 'bg-brand-primary text-neutral-950'
                : 'border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white'
            }`}
          >
            {p}
          </button>
        )
      )}

      <Button
        variant="ghost"
        size="icon"
        disabled={currentPage >= totalPages}
        onClick={() => goToPage(currentPage + 1)}
        className="h-9 w-9 rounded-lg border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white disabled:opacity-30"
      >
        <ChevronRight size={16} />
      </Button>
    </div>
  )
}

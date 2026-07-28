import { getTranslations } from 'next-intl/server'

// Rendered as the first focusable element in a layout so keyboard and screen
// reader users can jump past the header straight to the page content.
//
// The target element MUST carry `tabIndex={-1}`. A bare `id` is not enough:
// Safari does not move focus to a non-focusable fragment target at all, and
// Chrome/Firefox only move the sequential-focus starting point — so
// `document.activeElement` stays on <body> and a screen reader's virtual
// cursor is never repositioned. Use <MainLandmark> to get this right.
export async function SkipLink({ targetId = 'main' }: { targetId?: string }) {
  const t = await getTranslations('nav')

  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-brand-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-neutral-950"
    >
      {t('skipToContent')}
    </a>
  )
}

// The matching <main> landmark. Keeping the id and tabIndex together with the
// skip link means a layout cannot add one without the other.
export function MainLandmark({
  children,
  className,
  id = 'main',
}: {
  children: React.ReactNode
  className?: string
  id?: string
}) {
  return (
    <main id={id} tabIndex={-1} className={className}>
      {children}
    </main>
  )
}

import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ArrowRight, Clock, Video } from 'lucide-react'
import { VideoEmbed } from '@/components/store/video-embed'
import { VIDEO_ADS } from '@/constants/video-ads'

// Rendered dynamically like the rest of the store — see the note in
// src/app/(store)/page.tsx on why the cookie-based locale rules out ISR.
export async function generateMetadata() {
  const t = await getTranslations('videoAds')
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

export default async function VideoAdsPage() {
  const t = await getTranslations('videoAds')

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <header className="max-w-2xl">
        <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
            <Video size={22} aria-hidden="true" />
          </span>
          {t('title')}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-neutral-400">{t('subtitle')}</p>
      </header>

      {VIDEO_ADS.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-3xl border border-neutral-800 bg-neutral-900/50 px-6 py-24 text-center">
          <Video size={48} className="mb-4 text-neutral-700" aria-hidden="true" />
          <h2 className="text-lg font-medium text-white">{t('empty')}</h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-neutral-400">{t('emptyHint')}</p>
          <Link
            href="/shop"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-primary px-7 py-3 text-sm font-bold text-neutral-950 transition-colors hover:bg-amber-600"
          >
            {t('emptyCta')}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <ul className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {VIDEO_ADS.map((video) => (
            <li key={video.youtubeId}>
              <VideoEmbed youtubeId={video.youtubeId} title={video.title} />
              <h2 className="mt-4 text-base font-semibold leading-snug text-white">{video.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-neutral-400">{video.description}</p>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-neutral-400">
                <Clock size={13} aria-hidden="true" />
                <span className="sr-only">{t('duration')}: </span>
                {video.duration}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

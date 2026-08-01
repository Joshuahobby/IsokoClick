'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Play } from 'lucide-react'

type Props = {
  youtubeId: string
  title: string
}

// Click-to-load facade. YouTube's embed pulls roughly half a megabyte of player
// before a shopper has decided to watch anything, which on the 3G connections
// this storefront targets would make the page unusable with more than one or
// two videos. Until play is pressed this is a thumbnail and a button.
export function VideoEmbed({ youtubeId, title }: Props) {
  const t = useTranslations('videoAds')
  const [playing, setPlaying] = useState(false)

  if (playing) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-black">
        <iframe
          // autoplay so the press that swapped the facade for the player also
          // starts playback — otherwise it costs a second, blind click.
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={t('play', { title })}
      className="group relative block aspect-video w-full overflow-hidden rounded-2xl bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
    >
      {/* Decorative: the button already carries the video's title. */}
      <Image
        src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`}
        alt=""
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <span
        className="absolute inset-0 bg-neutral-950/40 transition-colors group-hover:bg-neutral-950/25"
        aria-hidden="true"
      />
      <span
        className="absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary text-neutral-950 shadow-lg transition-transform duration-200 group-hover:scale-110">
          <Play size={24} className="ml-0.5" fill="currentColor" />
        </span>
      </span>
    </button>
  )
}

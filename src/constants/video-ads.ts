/**
 * Videos shown on /video-ads.
 *
 * Held in code rather than the database on purpose: these are a handful of
 * marketing assets that change a few times a year, not catalog data, and a
 * code-owned list keeps them reviewable in a pull request without an admin
 * screen to build and secure first. Move them to a `videos` table when
 * partners need to upload their own.
 *
 * Only YouTube is supported. `youtubeId` is the 11-character id from the watch
 * URL — for https://www.youtube.com/watch?v=dQw4w9WgXcQ that is dQw4w9WgXcQ.
 * Nothing is fetched from YouTube until a shopper presses play (see
 * VideoEmbed), so an entry costs one thumbnail on 3G, not a player bundle.
 */
export type VideoAd = {
  youtubeId: string
  title: string
  /** One or two lines shown under the title. */
  description: string
  /** Human-readable runtime, e.g. "1:45". Shown as-is, not parsed. */
  duration: string
}

export const VIDEO_ADS: VideoAd[] = []

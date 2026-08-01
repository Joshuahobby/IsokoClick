/**
 * Technicians listed on /technicians.
 *
 * Held in code for the same reason as VIDEO_ADS: this is a vetted, hand-curated
 * roster, not user-generated data. Every entry here has been checked by the
 * IsokoClick team — do not add a profile that has not been, since the page
 * presents the list as vetted.
 *
 * Move to a `technicians` table with an admin approval flow once technicians
 * can apply for themselves.
 */
export type Technician = {
  slug: string
  name: string
  /** A registered business, or a sole trader working under their own name. */
  kind: 'company' | 'individual'
  /** Trades they take on, e.g. ['Tiling', 'Plumbing']. */
  trades: string[]
  /** Districts covered, e.g. ['Gasabo', 'Kicukiro']. */
  districts: string[]
  yearsExperience: number
  /** E.164, e.g. +250788123456. Rendered as a tel: link. */
  phone: string
  bio: string
}

export const TECHNICIANS: Technician[] = []

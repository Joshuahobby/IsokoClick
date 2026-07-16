export const APP_NAME = 'IsokoClick'
export const APP_TAGLINE = 'Rwanda\'s Construction Marketplace'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://isokoclick.com'
export const MIN_ORDER_VALUE = 5000
export const MAX_B2B_WITHOUT_APPROVAL = 1_000_000
export const VAT_RATE = 0.18
export const DEFAULT_COMMISSION_RATE = 10

export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'Categories', href: '/shop/categories' },
  { label: 'Sale', href: '/shop?filter=sale' },
  { label: 'B2B', href: '/b2b' },
  { label: 'Blog', href: '/blog' },
]

export const CONSTRUCTION_CATEGORIES = [
  { slug: 'structure', name_en: 'Structure & Concrete', icon: '🏗️' },
  { slug: 'finishes', name_en: 'Tiles & Finishes', icon: '🪨' },
  { slug: 'plumbing', name_en: 'Plumbing', icon: '🔧' },
  { slug: 'electrical', name_en: 'Electrical', icon: '⚡' },
  { slug: 'roofing', name_en: 'Roofing', icon: '🏠' },
  { slug: 'steel', name_en: 'Steel & Metal', icon: '⚙️' },
  { slug: 'paint', name_en: 'Paint & Coatings', icon: '🎨' },
  { slug: 'tools', name_en: 'Tools & Equipment', icon: '🔨' },
]

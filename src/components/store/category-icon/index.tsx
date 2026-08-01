import {
  Anvil,
  Bath,
  BrickWall,
  CookingPot,
  Grid2x2,
  Hammer,
  HardHat,
  HousePlus,
  Lightbulb,
  Package,
  PaintRoller,
  Trees,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react'

// Maps the category slugs seeded in the DB to line-style icons. Unknown slugs
// (new categories added by admins) fall back to a package icon.
//
// The first block is the live merchandising taxonomy from
// supabase/migrations/20260801000001_recategorize_catalog.sql; the second is
// the retired buckets, kept so an archived product still renders an icon.
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  bathroom: Bath,
  kitchen: CookingPot,
  tiles: Grid2x2,
  construction: BrickWall,
  plumbing: Wrench,
  lights: Lightbulb,
  roofing: HousePlus,
  finishes: PaintRoller,

  structure: BrickWall,
  steel: Anvil,
  electrical: Zap,
  tools: Hammer,
  safety: HardHat,
  landscaping: Trees,
}

type Props = {
  slug: string | null | undefined
  size?: number
  className?: string
}

export function CategoryIcon({ slug, size = 24, className }: Props) {
  const Icon = (slug && CATEGORY_ICONS[slug]) || Package
  return <Icon size={size} className={className} aria-hidden="true" />
}

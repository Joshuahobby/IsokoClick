import {
  Anvil,
  BrickWall,
  Hammer,
  HardHat,
  Package,
  PaintRoller,
  Trees,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react'

// Maps the construction category slugs seeded in the DB to line-style icons.
// Unknown slugs (new categories added by admins) fall back to a package icon.
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  structure: BrickWall,
  steel: Anvil,
  plumbing: Wrench,
  electrical: Zap,
  finishes: PaintRoller,
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

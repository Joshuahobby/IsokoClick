# IsokoClick — Design System

## Design Philosophy
IsokoClick speaks to contractors, builders, and construction buyers.
The visual language is: **dark, industrial, precise, trustworthy.**
Inspired by CHICX (dark editorial layout) and Onsko (clean product grid, bold hero),
adapted for a construction context — functional over decorative, confident over flashy.

---

## Color Palette

### Primary Colors
```
--color-brand-primary:     #E07B39   /* Amber Orange — action, CTA, accents */
--color-brand-secondary:   #1A1A1A   /* Near Black — primary backgrounds */
--color-brand-surface:     #242424   /* Dark Surface — cards, panels */
--color-brand-border:      #2E2E2E   /* Subtle borders */
```

### Neutral Scale
```
--color-neutral-950:  #0A0A0A   /* Deepest background */
--color-neutral-900:  #1A1A1A   /* Primary background */
--color-neutral-800:  #242424   /* Card background */
--color-neutral-700:  #2E2E2E   /* Borders, dividers */
--color-neutral-600:  #404040   /* Disabled state */
--color-neutral-400:  #737373   /* Placeholder, muted text */
--color-neutral-200:  #C4C4C4   /* Secondary text */
--color-neutral-50:   #F5F5F5   /* Primary text on dark */
--color-white:        #FFFFFF   /* Pure white */
```

### Semantic Colors
```
--color-success:   #22C55E   /* Stock available, order confirmed */
--color-warning:   #F59E0B   /* Low stock, pending payment */
--color-error:     #EF4444   /* Out of stock, payment failed */
--color-info:      #3B82F6   /* Informational badges */
```

### Partner / Source Badges
```
--color-internal:  #E07B39   /* IsokoClick warehouse — orange */
--color-dropship:  #8B5CF6   /* Partner dropship — purple */
```

---

## Typography

### Font Stack
```css
/* Headings — bold, geometric */
font-family: 'Inter', 'DM Sans', sans-serif;

/* Body — readable, neutral */
font-family: 'Inter', system-ui, sans-serif;

/* Prices / Numbers — tabular figures */
font-variant-numeric: tabular-nums;
```

### Scale
| Token | Size | Weight | Use |
|-------|------|--------|-----|
| `text-display` | 48–64px | 800 | Hero headlines |
| `text-h1` | 36px | 700 | Page titles |
| `text-h2` | 28px | 700 | Section headings |
| `text-h3` | 22px | 600 | Card headings |
| `text-h4` | 18px | 600 | Sub-headings |
| `text-body-lg` | 16px | 400 | Primary body |
| `text-body` | 14px | 400 | Secondary body |
| `text-small` | 12px | 400 | Labels, captions |
| `text-price` | 20px | 700 | Product prices |
| `text-price-lg` | 28px | 800 | Featured prices |

---

## Spacing System
Uses Tailwind's default 4px base scale.
Key breakpoints in use: `sm:640px`, `md:768px`, `lg:1024px`, `xl:1280px`, `2xl:1536px`

Container max-width: `1280px` (center-aligned with `px-4 md:px-8`)

---

## Component Patterns

### Navigation Bar
- Dark background (`bg-neutral-900`), sticky on scroll
- Left: IsokoClick logo (wordmark + icon)
- Center (desktop): Home, Shop, Categories, Sale, Blog, B2B
- Right: Search icon, Cart icon with count badge, Login, Sign Up button
- Mobile: hamburger → full-screen slide-in drawer
- Active link: white pill background (matching CHICX reference)

### Hero Section
- Full-width, dark background
- Eyebrow label in pill badge (e.g., "New Stock Arrived")
- Large bold headline, 2–3 lines max
- Sub-headline: muted gray, max 2 lines
- CTA button: white with dark text (primary) + ghost button (secondary)
- Background: subtle geometric texture or construction imagery

### Product Card
- Dark card (`bg-neutral-800`) with rounded-xl corners
- Arched top image container (matching CHICX reference) OR square with rounded top
- Image fills container, object-cover
- Bottom section: category tag, product name, unit price in RWF, stock badge
- Source badge: "Warehouse" (orange) or "Partner" (purple) — top-right corner
- Hover: subtle scale(1.02) + border highlight
- "Add to Cart" appears on hover (desktop) / always visible (mobile)

### Product Price Display
```
RWF 45,000          ← current price, bold
~~RWF 52,000~~      ← original price, strikethrough, muted (if on sale)
Per bag             ← unit label, small muted text
```

### Buttons
```
Primary:    bg-brand-primary text-white hover:bg-amber-600    (orange fill)
Secondary:  bg-white text-neutral-900 hover:bg-neutral-100    (white fill)
Ghost:      border border-neutral-600 text-white hover:border-white
Danger:     bg-red-600 text-white
Disabled:   bg-neutral-700 text-neutral-500 cursor-not-allowed
```
All buttons: `rounded-full`, `px-6 py-2.5`, `font-semibold`, `transition-all duration-200`

### Badges / Tags
```
Stock: Available     → green dot + "In Stock"
Stock: Low           → amber dot + "Low Stock (12 left)"
Stock: Out           → red dot + "Out of Stock"
Source: Warehouse    → orange pill "IsokoClick Stock"
Source: Partner      → purple pill "Partner: [Name]"
Sale                 → red pill "SALE"
New                  → blue pill "NEW"
Best Seller          → amber pill "BEST SELLER"
```

### Forms & Inputs
- Dark input: `bg-neutral-800 border border-neutral-700 text-white`
- Focus: `border-brand-primary ring-1 ring-brand-primary`
- Label: above input, `text-sm text-neutral-200 mb-1`
- Error state: `border-red-500` + red error message below
- All inputs `rounded-lg`

### Category Grid
- Construction categories displayed as icon cards
- Dark card + construction icon (SVG) + category name
- Grid: 4 cols desktop, 3 cols tablet, 2 cols mobile
- Icons: line-style, amber/orange color

---

## Layout Templates

### Store Pages
```
┌─────────────────────────────────────────┐
│              NAVBAR (sticky)             │
├─────────────────────────────────────────┤
│              HERO / BANNER               │
├─────────────────────────────────────────┤
│         CATEGORY QUICK LINKS            │
├─────────────────────────────────────────┤
│         FEATURED PRODUCTS GRID          │
├─────────────────────────────────────────┤
│           PROMOTIONAL BANNER            │
├─────────────────────────────────────────┤
│           BEST SELLERS GRID             │
├─────────────────────────────────────────┤
│         PARTNER BRANDS STRIP            │
├─────────────────────────────────────────┤
│               FOOTER                    │
└─────────────────────────────────────────┘
```

### Product Listing Page
```
┌───────────────┬─────────────────────────┐
│               │  SORT / FILTER BAR      │
│  FILTERS      ├─────────────────────────┤
│  SIDEBAR      │                         │
│               │   PRODUCT GRID          │
│  Category     │   (3 cols desktop,      │
│  Price        │    2 cols tablet,       │
│  Brand        │    1 col mobile)        │
│  Stock        │                         │
│  Source       ├─────────────────────────┤
│               │     PAGINATION          │
└───────────────┴─────────────────────────┘
```

### Product Detail Page
```
┌──────────────────┬───────────────────────┐
│                  │  Category > Name       │
│  IMAGE GALLERY   │  Product Title         │
│  (main + thumbs) │  Rating & Reviews      │
│                  │  Price (RWF)           │
│                  │  Unit selector         │
│                  │  Quantity picker       │
│                  │  Stock status          │
│                  │  Source badge          │
│                  │  [Add to Cart] [Buy]   │
│                  │  Delivery estimate     │
├──────────────────┴───────────────────────┤
│  TABS: Description | Specs | Reviews     │
├──────────────────────────────────────────┤
│  RELATED PRODUCTS                        │
└──────────────────────────────────────────┘
```

---

## Iconography
- Library: **Lucide React** (consistent with shadcn/ui)
- Size standards: `16px` (inline), `20px` (buttons), `24px` (navigation), `32px` (feature icons)
- Color: inherit from parent or `text-neutral-400` for muted icons
- Construction-specific icons: use SVG custom set for categories (cement, tile, steel, etc.)

---

## Motion & Animation
- Transitions: `duration-200` for hover states, `duration-300` for modals/drawers
- Easing: `ease-out` for enter, `ease-in` for exit
- No gratuitous animations — every motion has functional purpose
- Page transitions: subtle fade (avoid jarring full-page slides)
- Skeleton loaders on all async content (never show empty states during load)

---

## Responsive Breakpoints

| Breakpoint | Width | Primary Layout |
|-----------|-------|----------------|
| Mobile | <640px | Single column, bottom nav |
| Tablet | 640–1024px | 2-col product grid, sidebar collapses |
| Desktop | >1024px | 3-4 col grid, sidebar visible, full nav |

Mobile navigation: bottom tab bar with: Home, Shop, Cart, Orders, Account

---

## Dark / Light Mode
- **Default: Dark mode** (construction professional aesthetic)
- Light mode: available as user preference
- Use CSS custom properties (Tailwind `dark:` classes) throughout
- Never hardcode colors — always use design tokens

---

## Accessibility
- Minimum contrast ratio: 4.5:1 for body text, 3:1 for large text
- All interactive elements keyboard-navigable
- ARIA labels on icon-only buttons
- Focus rings visible in high-contrast mode
- Images have descriptive alt text (product name + key attributes)

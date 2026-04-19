# IsokoClick — Development Conventions

## Project Structure

```
IsokoClick/
├── CLAUDE.md                    # Claude AI instructions (always read first)
├── docs/                        # Project documentation
│   ├── architecture.md
│   ├── design-system.md
│   ├── database-schema.md
│   ├── api-integrations.md
│   └── conventions.md           # this file
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── (store)/             # Customer-facing store
│   │   │   ├── page.tsx         # Home page
│   │   │   ├── shop/
│   │   │   ├── product/[slug]/
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   ├── orders/
│   │   │   └── account/
│   │   ├── (admin)/             # Admin dashboard
│   │   │   ├── dashboard/
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   ├── inventory/
│   │   │   ├── partners/
│   │   │   ├── deliveries/
│   │   │   └── analytics/
│   │   ├── (partner)/           # Partner portal
│   │   │   ├── dashboard/
│   │   │   ├── catalog/
│   │   │   ├── orders/
│   │   │   └── payouts/
│   │   ├── (auth)/              # Auth pages (shared)
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── reset-password/
│   │   ├── api/                 # API routes
│   │   │   ├── payments/
│   │   │   │   └── pawapay/
│   │   │   │       └── webhook/
│   │   │   ├── orders/
│   │   │   ├── products/
│   │   │   └── whatsapp/
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                  # shadcn/ui — never edit directly
│   │   ├── shared/              # Used across all portals
│   │   │   ├── navbar/
│   │   │   ├── footer/
│   │   │   ├── loading/
│   │   │   └── error/
│   │   ├── store/               # Customer store components
│   │   │   ├── product-card/
│   │   │   ├── product-grid/
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   └── hero/
│   │   ├── admin/               # Admin dashboard components
│   │   └── partner/             # Partner portal components
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts        # createBrowserClient
│   │   │   ├── server.ts        # createServerClient
│   │   │   ├── middleware.ts    # session refresh
│   │   │   └── queries/         # typed query helpers
│   │   │       ├── products.ts
│   │   │       ├── orders.ts
│   │   │       ├── inventory.ts
│   │   │       └── users.ts
│   │   ├── pawapay/
│   │   ├── africas-talking/
│   │   └── utils/
│   │       ├── currency.ts      # RWF formatting
│   │       ├── date.ts          # UTC ↔ Africa/Kigali
│   │       └── validation.ts
│   ├── hooks/
│   │   ├── use-cart.ts
│   │   ├── use-auth.ts
│   │   └── use-realtime-order.ts
│   ├── types/
│   │   ├── database.ts          # Supabase generated types
│   │   ├── api.ts               # API request/response types
│   │   └── index.ts             # re-exports
│   └── constants/
│       ├── categories.ts
│       ├── delivery-zones.ts
│       └── app.ts
├── supabase/
│   ├── migrations/              # SQL migration files
│   └── seed.sql                 # Dev seed data
├── emails/                      # React Email templates
├── public/                      # Static assets
├── .env.local                   # Local secrets (never commit)
├── .env.example                 # Template for env vars
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Naming Conventions

### Files & Folders
| Type | Convention | Example |
|------|-----------|---------|
| Components | `kebab-case/index.tsx` | `product-card/index.tsx` |
| Pages | `page.tsx` (Next.js convention) | `app/(store)/shop/page.tsx` |
| API routes | `route.ts` (Next.js convention) | `api/orders/route.ts` |
| Hooks | `use-kebab-case.ts` | `use-cart.ts` |
| Utilities | `kebab-case.ts` | `currency.ts` |
| Types | `kebab-case.ts` | `api.ts` |
| DB queries | `table-name.ts` | `products.ts` |
| Migrations | `YYYYMMDDHHMMSS_description.sql` | `20260419120000_create_products.sql` |

### Variables & Functions
```typescript
// Variables: camelCase
const orderTotal = 45000
const isHeavyGoods = true

// Functions: camelCase verbs
function formatRwf(amount: number): string { ... }
async function fetchProductBySlug(slug: string) { ... }

// React components: PascalCase
function ProductCard({ product }: ProductCardProps) { ... }

// Types & interfaces: PascalCase
type OrderStatus = 'pending' | 'confirmed' | 'delivered'
interface ProductCardProps { product: Product; onAddToCart: () => void }

// Constants: SCREAMING_SNAKE_CASE
const MIN_ORDER_VALUE = 5000
const MAX_BULK_ORDER_WITHOUT_APPROVAL = 1_000_000

// Enums: PascalCase
enum UserRole { Customer = 'customer', Admin = 'admin', Partner = 'partner' }
```

### Database
- Tables: `snake_case` plural (`orders`, `order_items`, `delivery_zones`)
- Columns: `snake_case` (`created_at`, `order_number`, `is_active`)
- Indexes: `idx_{table}_{column(s)}` (`idx_products_category`)
- Migrations: `YYYYMMDDHHMMSS_verb_noun.sql` (`20260419_create_products_table.sql`)

---

## TypeScript Rules

- `strict: true` in tsconfig — no exceptions
- No `any` — use `unknown` + type narrowing if needed
- No type assertions (`as SomeType`) unless absolutely unavoidable — add a comment explaining why
- Prefer `type` over `interface` for object shapes (unless extending)
- Always type function return values explicitly for exported functions
- Generate Supabase types: `npx supabase gen types typescript --local > src/types/database.ts`

---

## React & Next.js Rules

### Server vs Client Components
```typescript
// Default: Server Component (no directive needed)
// Use "use client" ONLY when you need:
// - useState, useEffect, useReducer
// - Browser APIs (window, document)
// - Event handlers
// - Third-party client-only libraries

"use client"  // add this only when required
```

### Data Fetching
```typescript
// Server Components: fetch directly (no useEffect)
async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug)  // direct DB call
  return <ProductDetail product={product} />
}

// Client Components: TanStack Query
const { data: cart } = useQuery({
  queryKey: ['cart'],
  queryFn: fetchCart,
})
```

### Server Actions
```typescript
// Use for all form mutations
'use server'

export async function addToCart(productId: string, quantity: number) {
  const supabase = createServerClient()
  // ... mutation logic
  revalidatePath('/cart')
}
```

---

## Currency & Formatting

```typescript
// src/lib/utils/currency.ts

// Always store RWF as integers in DB
// Display with thousand separators, no decimals

export function formatRwf(amount: number): string {
  return `RWF ${amount.toLocaleString('en-RW')}`
  // Output: "RWF 45,000"
}

export function formatRwfCompact(amount: number): string {
  if (amount >= 1_000_000) return `RWF ${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `RWF ${(amount / 1_000).toFixed(0)}K`
  return formatRwf(amount)
}
```

---

## Date & Timezone

```typescript
// src/lib/utils/date.ts

// Store: UTC in DB
// Display: Africa/Kigali (UTC+2)
// Never display raw UTC to users

import { format, toZonedTime } from 'date-fns-tz'

const KIGALI_TZ = 'Africa/Kigali'

export function toKigaliTime(utcDate: string | Date): Date {
  return toZonedTime(new Date(utcDate), KIGALI_TZ)
}

export function formatOrderDate(utcDate: string): string {
  return format(toKigaliTime(utcDate), 'dd MMM yyyy, HH:mm', { timeZone: KIGALI_TZ })
  // Output: "19 Apr 2026, 14:30"
}
```

---

## Internationalization (i18n)

Using `next-intl`. All user-facing strings must use translation keys.

```typescript
// WRONG — hardcoded text
<h1>New Arrivals</h1>
<p>Out of stock</p>

// CORRECT — translation key
const t = useTranslations('product')
<h1>{t('newArrivals')}</h1>
<p>{t('outOfStock')}</p>
```

Locale files:
- `messages/en.json` — English
- `messages/rw.json` — Kinyarwanda

---

## Error Handling

```typescript
// API routes: always return typed error responses
export async function POST(request: Request) {
  try {
    // ... logic
    return Response.json({ data: result, error: null })
  } catch (error) {
    Sentry.captureException(error)
    return Response.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Never expose internal error details to clients
// Log full error to Sentry, return generic message to user
```

---

## Git Conventions

### Branch Naming
```
feature/  → new features        feature/product-catalog
fix/      → bug fixes            fix/cart-total-calculation
chore/    → config, deps         chore/setup-supabase-types
docs/     → documentation        docs/api-integration-guide
```

### Commit Messages (Conventional Commits)
```
feat: add PawaPay deposit initiation
fix: correct RWF formatting for amounts >1M
chore: generate Supabase TypeScript types
docs: update API integration guide
refactor: extract order routing to Edge Function
test: add checkout flow E2E test
```

### Pull Request Rules
- All PRs require passing: `lint`, `type-check`, `test`
- No direct pushes to `main`
- PR description must include: what changed, how to test, screenshots (UI changes)

---

## Environment Variables

### `.env.example` (commit this)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PAWAPAY_API_KEY=
PAWAPAY_WEBHOOK_SECRET=
AFRICAS_TALKING_API_KEY=
AFRICAS_TALKING_USERNAME=
RESEND_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
GOOGLE_MAPS_API_KEY=
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
```

### `.env.local` (never commit — in .gitignore)
Contains actual values for local development.

---

## Testing Strategy

### Unit Tests (Vitest)
- Test all `lib/utils/` functions
- Test order routing logic
- Test PawaPay webhook signature verification
- Test RWF formatting edge cases

### E2E Tests (Playwright)
Priority flows to cover:
1. Browse catalog → add to cart → checkout → PawaPay payment → order confirmation
2. Partner login → list product → fulfill order
3. Admin approves partner → partner product goes live
4. Order tracking page updates in real-time

### Running Tests
```bash
npm run test           # Vitest unit tests
npm run test:e2e       # Playwright E2E tests
npm run type-check     # TypeScript validation
npm run lint           # ESLint
```

---

## Performance Checklist (before every deploy)
- [ ] No N+1 queries (check Supabase logs for repeated identical queries)
- [ ] Images use `next/image` with explicit `width` and `height`
- [ ] No `useEffect` for data that can be fetched server-side
- [ ] Heavy components are lazy-loaded with `next/dynamic`
- [ ] API routes are protected with rate limiting
- [ ] No secrets in client-side code (`NEXT_PUBLIC_` only for safe values)

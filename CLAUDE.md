# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is
IsokoClick is an omnichannel construction materials marketplace serving the Rwandan market.
It runs a hybrid inventory model: IsokoClick's own warehouse stock (Internal Inventory) and
third-party partner fulfillment (Dropship Inventory).

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # TypeScript validation (tsc --noEmit)
npm run test         # Vitest unit tests (run once)
npm run test:watch   # Vitest in watch mode
npm run test:e2e     # Playwright E2E tests
```

After any schema migration, regenerate TypeScript types:
```bash
npx supabase gen types typescript --local > src/types/database.ts
```

## Tech Stack
- **Frontend:** Next.js 16 (App Router), Tailwind CSS v4, shadcn/ui
- **Backend/DB:** Supabase (Postgres + RLS, Auth, Storage, Edge Functions, Realtime)
- **Deployment:** Vercel (frontend), Supabase Cloud (backend)
- **Payments:** PawaPay API only — no MTN direct, no Airtel direct, no Flutterwave
- **SMS/WhatsApp:** Africa's Talking
- **Email:** Resend
- **Maps:** Google Maps API (delivery zones)
- **Testing:** Vitest (unit), Playwright (E2E)
- **CI/CD:** GitHub Actions + Vercel Preview Deploys
- **Monitoring:** Sentry + Vercel Analytics

## Market Context
- **Country:** Rwanda (Kigali-first rollout, then national)
- **Currency:** RWF (Rwandan Franc) — always display as `RWF` or `Frw`, never `$`
- **Languages:** English (primary), Kinyarwanda (secondary — i18n-ready from day one)
- **Connectivity:** Optimize for 3G — keep bundles small, lazy-load images, use PWA caching
- **Payments:** Mobile Money dominant — PawaPay handles MTN MoMo + Airtel Money

## Architecture

### Route Groups
Three separate portals under `src/app/` using Next.js route groups:
- `(store)/` — public customer-facing store (home, shop, product, cart, checkout, orders, account)
- `(admin)/` — internal staff dashboard (dashboard, products, orders, inventory, partners, analytics)
- `(partner)/` — dropship partner portal (dashboard, catalog, orders, payouts)
- `(auth)/` — shared login/signup/reset-password pages

### Middleware
Route protection lives in [src/proxy.ts](src/proxy.ts) (not the Next.js default `middleware.ts`). It reads the user's role from `user.user_metadata.role` and redirects unauthorized access. Public routes: `/`, `/shop`, `/product`, `/auth`. Role → route guards: `admin→/admin`, `partner→/partner`, `warehouse_staff→/warehouse`, `delivery_agent→/delivery`.

### Supabase Client Pattern
- **Browser/Client Components:** `createClient()` from `lib/supabase/client.ts`
- **Server Components & API Routes:** `createClient()` from `lib/supabase/server.ts`
- **Admin operations (service role):** `createAdminClient()` from `lib/supabase/server.ts` — server-side only, never expose to client
- All typed queries go through helpers in `lib/supabase/queries/`

### State Management
- **Server state:** TanStack Query (React Query) for async data in Client Components
- **Client state:** Zustand for cart and UI state
- **Realtime:** Supabase Realtime subscriptions for live order status updates
- Server Components fetch directly (no hooks, no useEffect)

### Rendering Strategy
| Page Type | Strategy |
|-----------|----------|
| Product catalog | ISR (revalidate 60s) |
| Product detail | ISR (revalidate 30s) |
| Cart / Checkout | CSR |
| Admin / Partner portal | SSR |
| Home / Landing | ISR (revalidate 300s) |

## User Roles
| Role | Key Capability |
|------|---------------|
| Guest | Browse, search, view prices |
| Customer (B2C) | Cart, checkout, order tracking, reviews |
| Customer (B2B) | Bulk orders, RFQ, credit terms, invoices |
| Dropship Partner | List products, fulfill orders, view payouts |
| Warehouse Staff | Manage stock, pick/pack, dispatch |
| Delivery Agent | View assignments, update delivery status |
| Super Admin | Full platform control |

## Inventory Logic
- Every product has a `source` field: `internal` or `dropship`
- Internal products pull stock from `inventory_internal` table
- Dropship products pull stock from `inventory_dropship` table
- A cart can contain items from both sources — the order splits at fulfillment
- Never mix fulfillment logic: internal orders go to warehouse staff, dropship orders go to partner

## Payment Flow (PawaPay)
1. Customer initiates checkout → backend calls PawaPay Deposits API
2. PawaPay sends USSD push to customer's phone
3. Customer approves on phone
4. PawaPay sends webhook to `/api/payments/pawapay/webhook`
5. Backend verifies signature, updates order status
6. Partner payouts use PawaPay Payouts API

Always verify PawaPay webhook signatures. Never trust unverified callbacks.

## Code Rules
- TypeScript strict mode everywhere — no `any`, use `unknown` + type narrowing instead
- No type assertions (`as SomeType`) unless unavoidable — add a comment explaining why
- All Supabase queries go through typed helpers in `lib/supabase/queries/`
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client; `createAdminClient()` is server-only
- RLS must be enabled on every table — never bypass with service key in client code
- All monetary values stored as integers (RWF cents) in the DB; use `formatRwf()` / `formatRwfCompact()` from `lib/utils/currency.ts` for display
- All dates stored as UTC in DB; convert to `Africa/Kigali` on display using helpers in `lib/utils/date.ts`
- i18n strings via `next-intl` — never hardcode user-facing text; locale files at `messages/en.json` and `messages/rw.json`
- No `console.log` in production code — use structured logging via Sentry

## API Response Envelope
All API routes return:
```json
{ "data": { ... }, "error": null, "meta": { "timestamp": "...", "requestId": "..." } }
```

## Naming Conventions
| Type | Pattern | Example |
|------|---------|---------|
| Components | `kebab-case/index.tsx` | `product-card/index.tsx` |
| Hooks | `use-kebab-case.ts` | `use-cart.ts` |
| DB query helpers | `table-name.ts` | `products.ts` |
| Migrations | `YYYYMMDDHHMMSS_verb_noun.sql` | `20260419_create_products.sql` |
| DB tables | `snake_case` plural | `order_items` |
| Constants | `SCREAMING_SNAKE_CASE` | `MIN_ORDER_VALUE` |

## Database Rules
- See [docs/database-schema.md](docs/database-schema.md) for full schema
- All tables have `created_at` and `updated_at` timestamps
- Soft deletes only — use `deleted_at` column, never hard `DELETE` on core entities
- Every financial transaction is append-only (no updates, only new records)
- Migrations live in `supabase/migrations/` — never edit the DB manually

## Key Business Rules
- Minimum order value: RWF 5,000
- Heavy goods (>500kg) require scheduled delivery — no same-day
- B2B orders >RWF 1,000,000 require admin approval before payment
- Partners must be approved by admin before their products go live
- Dropship partner commission: configurable per partner (default 10%)
- All prices are inclusive of VAT (18% in Rwanda)

## Git Conventions (Conventional Commits)
```
feat: add PawaPay deposit initiation
fix: correct RWF formatting for amounts >1M
chore: generate Supabase TypeScript types
docs: update API integration guide
refactor: extract order routing to Edge Function
test: add checkout flow E2E test
```

Branches: `feature/`, `fix/`, `chore/`, `docs/` prefixes. No direct pushes to `main`.

## Design Language
See [docs/design-system.md](docs/design-system.md) for full UI guidelines.
- Dark, industrial aesthetic with amber/orange accents
- Mobile-first, clean typography, generous whitespace
- Construction-grade feel — bold, trustworthy, efficient

## Environment Variables (never commit)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
PAWAPAY_API_KEY
PAWAPAY_WEBHOOK_SECRET
AFRICAS_TALKING_API_KEY
AFRICAS_TALKING_USERNAME
RESEND_API_KEY
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
GOOGLE_MAPS_API_KEY
SENTRY_DSN
NEXT_PUBLIC_SENTRY_DSN
NEXT_PUBLIC_APP_URL
```

## Reference Docs
- [Architecture](docs/architecture.md)
- [Design System](docs/design-system.md)
- [Database Schema](docs/database-schema.md)
- [API Integrations](docs/api-integrations.md)
- [Conventions](docs/conventions.md)

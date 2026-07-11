# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is
IsokoClick is an omnichannel construction materials marketplace serving the Rwandan market.
It runs a hybrid inventory model: IsokoClick's own warehouse stock (Internal Inventory) and
third-party partner fulfillment (Dropship Inventory).

## Implementation Status
This doc records both what exists and what is planned. Anything tagged **(planned)** is NOT installed or wired yet — do not import it or assume it runs.
- **Built:** store home + checkout + order confirmation, admin portal, partner portal, auth flows, PawaPay deposit + webhook (hand-rolled fetch), Zustand cart, 23-table schema migration with RLS
- **Planned:** shop/product/cart/account pages, warehouse & delivery portals, test configs + CI, next-intl wiring, TanStack Query, ISR, Sentry, Resend / Africa's Talking sending, Supabase Edge Functions

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run start        # Serve production build
npm run lint         # ESLint — bare `eslint` with flat config (eslint.config.mjs), not `next lint`
npm run type-check   # TypeScript validation (tsc --noEmit)
npm run test         # Vitest unit tests (run once)
npm run test:watch   # Vitest in watch mode
npm run test:e2e     # Playwright E2E tests
```

Test infrastructure is scaffolding-only: deps are installed but there is no `vitest.config.ts`, no `playwright.config.ts`, no setup files, and zero test files. Writing the first test means creating those configs (Vitest: jsdom environment + `@/` → `src/` alias; Playwright: e2e dir + baseURL).

After any schema migration, regenerate TypeScript types:
```bash
npx supabase gen types typescript --local > src/types/database.ts
```
Caveat: [src/types/database.ts](src/types/database.ts) is a hand-written placeholder mirroring all 23 tables in `supabase/migrations/` (nullability approximated), and there is no `supabase/config.toml` — `supabase init` / `supabase link` must happen before the command above works.

## Tech Stack

Installed and in use:
- **Frontend:** Next.js 16.2.4 (App Router), React 19, Tailwind CSS v4 (CSS-first — no tailwind.config file; theme lives in `src/app/globals.css`), shadcn/ui on **Base UI** (`@base-ui/react`, style `base-nova` — not Radix), lucide-react
- **Backend/DB:** Supabase via `@supabase/ssr` (Postgres + RLS, Auth)
- **State:** Zustand 5 (cart)
- **Payments:** PawaPay API only — hand-rolled `fetch`, no SDK; no MTN direct, no Airtel direct, no Flutterwave
- **Deployment:** Vercel (frontend), Supabase Cloud (backend)

Planned — NOT yet installed/wired (do not import until actually added):
- TanStack Query, next-intl, Sentry, Vercel Analytics, Supabase Edge Functions & Realtime, Google Maps (delivery zones)
- SMS/WhatsApp via Africa's Talking, email via Resend (env vars reserved; `emails/` dir is empty)
- Vitest/Playwright configs and GitHub Actions CI (no `.github/` directory exists yet)

## Market Context
- **Country:** Rwanda (Kigali-first rollout, then national)
- **Currency:** RWF (Rwandan Franc) — always display as `RWF` or `Frw`, never `$`
- **Languages:** English (primary), Kinyarwanda (secondary). Locale files `messages/en.json` + `messages/rw.json` exist but next-intl is not installed and nothing consumes them yet — UI text is currently hardcoded English
- **Connectivity:** Optimize for 3G — keep bundles small, lazy-load images, use PWA caching
- **Payments:** Mobile Money dominant — PawaPay handles MTN MoMo + Airtel Money

## Architecture

### Portals under src/app/
Only `(store)` and `(auth)` are route groups — `admin/` and `partner/` are plain URL segments:
- `(store)/` — public store: home, `checkout/`, `orders/[id]`. **Not built yet:** shop, product, cart, account pages (nav links and middleware public routes already reference them)
- `(auth)/` — login, signup, reset-password, update-password, partner/register, `callback/route.ts`; plus plain `auth/signout/route.ts` outside the group
- `admin/` — internal staff dashboard: dashboard, products, orders (+`[id]`), partners (+`[id]`), analytics
- `partner/` — dropship partner portal: dashboard, catalog (+`new`), orders, payouts
- `/warehouse` and `/delivery` are role-guarded in middleware but have no routes yet (planned)

### Middleware
Route protection lives in [src/proxy.ts](src/proxy.ts) (Next.js 16 convention — there is no `middleware.ts`). It delegates session refresh to `updateSession()` from [src/lib/supabase/middleware.ts](src/lib/supabase/middleware.ts), reads the role from `user.user_metadata.role`, and redirects unauthorized access. Public routes: `/`, `/shop`, `/product`, `/auth`, plus every auth page (`/login`, `/signup`, `/reset-password`, `/update-password`, `/callback`, `/partner/register`). `/api/*` is never redirected — API routes authenticate themselves via session cookies or webhook signatures. Unauthenticated users on other protected routes → `/login?redirectTo=<path>`. Role → route guards: `admin→/admin`, `partner→/partner`, `warehouse_staff→/warehouse`, `delivery_agent→/delivery` — the `admin` role passes every gate.

### Supabase Client Pattern
- **Browser/Client Components:** `createClient()` from `lib/supabase/client.ts`
- **Server Components & API Routes:** `createClient()` from `lib/supabase/server.ts`
- **Admin operations (service role):** `createAdminClient()` from `lib/supabase/server.ts` — server-side only, never expose to client
- All typed queries go through helpers in `lib/supabase/queries/` — currently `admin.ts`, `orders.ts`, `partners.ts`, `products.ts`, `store.ts`

### State Management
- **Server state:** Server Components fetch directly through `lib/supabase/queries/` (no hooks, no useEffect). TanStack Query for client-side server state is planned — not installed
- **Client state:** Zustand — the cart store is `useCartStore` in [src/hooks/use-cart.ts](src/hooks/use-cart.ts) (persisted, storage key `isokoclick-cart`)
- **Realtime:** Supabase Realtime subscriptions for live order status (planned — not wired)

### Rendering Strategy (planned)
No page currently sets `export const revalidate` — everything uses Next.js defaults, with imperative `revalidatePath()` in admin/partner server actions. Target once catalog pages exist:

| Page Type | Strategy |
|-----------|----------|
| Product catalog | ISR (revalidate 60s) |
| Product detail | ISR (revalidate 30s) |
| Cart / Checkout | CSR |
| Admin / Partner portal | SSR |
| Home / Landing | ISR (revalidate 300s) |

## User Roles
Role values (see `UserRole` in [src/types/database.ts](src/types/database.ts)): `customer`, `b2b_customer`, `partner`, `warehouse_staff`, `delivery_agent`, `admin` — stored in `user.user_metadata.role`.

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
The webhook ([route.ts](src/app/api/payments/pawapay/webhook/route.ts)) verifies HMAC-SHA256 of the `x-pawapay-signature` header and **fails closed** — it rejects with 500 when `PAWAPAY_WEBHOOK_SECRET` is unset, so the secret must be configured in every environment that receives callbacks. It responds with plain-text `OK`, not the JSON envelope. `PAWAPAY_ENVIRONMENT=production` switches the Deposits API from sandbox to live; anything else stays on sandbox.

## Code Rules
- TypeScript strict mode everywhere — no `any`, use `unknown` + type narrowing instead
- No type assertions (`as SomeType`) unless unavoidable — add a comment explaining why
- All Supabase queries go through typed helpers in `lib/supabase/queries/`
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client; `createAdminClient()` is server-only
- RLS must be enabled on every table — never bypass with service key in client code
- All monetary values are integers of **whole RWF** (RWF is a zero-decimal currency — never multiply or divide by 100); use `formatRwf()` / `formatRwfCompact()` from `lib/utils/currency.ts` for display
- All dates stored as UTC in DB; convert to `Africa/Kigali` on display using helpers in `lib/utils/date.ts`
- Business constants (`MIN_ORDER_VALUE`, `MAX_B2B_WITHOUT_APPROVAL`, `VAT_RATE`, `DEFAULT_COMMISSION_RATE`, construction categories) live in [src/constants/app.ts](src/constants/app.ts) — change them there, never inline
- i18n via `next-intl` (planned — not installed): locale files at `messages/en.json` and `messages/rw.json` are currently unwired and UI text is hardcoded English; once next-intl lands, never hardcode user-facing text
- No `console.log` in production code (currently zero in `src/`) — structured logging via Sentry once it is added (planned)

## API Response Envelope
All API routes return:
```json
{ "data": { ... }, "error": null, "meta": { "timestamp": "...", "requestId": "..." } }
```
Build responses with `apiResponse()` / `apiError()` from [src/lib/utils/api.ts](src/lib/utils/api.ts) — used by `/api/orders` and `/api/payments/status`. Exception: the PawaPay webhook returns plain-text `OK` (provider contract).

## Naming Conventions
| Type | Pattern | Example |
|------|---------|---------|
| Components | `kebab-case/index.tsx` | `product-card/index.tsx` |
| Hooks | `use-kebab-case.ts` | `use-cart.ts` |
| DB query helpers | `table-name.ts` | `products.ts` |
| Migrations | `YYYYMMDDHHMMSS_verb_noun.sql` | `20260419_create_products.sql` |
| DB tables | `snake_case` plural | `order_items` |
| Constants | `SCREAMING_SNAKE_CASE` | `MIN_ORDER_VALUE` |

Existing components are mixed (kebab-case dirs like `product-card/` alongside PascalCase files like `Header.tsx`) — all NEW components must follow `kebab-case/index.tsx`.

## Database Rules
- See [docs/database-schema.md](docs/database-schema.md) for full schema
- Current migrations: `20260419000001_initial_schema.sql` (23 tables, RLS policies), `20260419000002_seed_data.sql`, `20260711000001_add_order_items_select_policy.sql`
- Most tables have `created_at` and `updated_at`; some child tables (`order_items`, `product_images`, `product_specs`, `order_status_history`, `payment_events`, `notifications`, both inventory tables) carry only one of them
- `order_items` has no product-name snapshot — display names by joining `product:product_id(name_en)`; the line total lives in `total_price`, the quantity in `quantity`
- Soft deletes only — use `deleted_at` column, never hard `DELETE` on core entities
- Every financial transaction is append-only (no updates, only new records)
- Migrations live in `supabase/migrations/` — never edit the DB manually

## Key Business Rules
Numeric values below are defined in [src/constants/app.ts](src/constants/app.ts):
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
Documented in `.env.example` (tracked — `.gitignore` carves it out of the `.env*` ignore rule).
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
PAWAPAY_API_KEY
PAWAPAY_WEBHOOK_SECRET
PAWAPAY_ENVIRONMENT
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

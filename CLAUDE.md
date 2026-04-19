# IsokoClick — Claude Instructions

## What This Project Is
IsokoClick is an omnichannel construction materials marketplace serving the Rwandan market.
It runs a hybrid inventory model: IsokoClick's own warehouse stock (Internal Inventory) and
third-party partner fulfillment (Dropship Inventory).

## Primary Working Directory
`F:/Joe/GetRwanda/2026/IsokoClick`

## Tech Stack (Non-Negotiable)
- **Frontend:** Next.js 14 (App Router), Tailwind CSS, shadcn/ui
- **Backend/DB:** Supabase (Postgres, Auth, Storage, Edge Functions, Realtime)
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

## Design Language
See `docs/design-system.md` for full UI guidelines.
- Dark, industrial aesthetic with amber/orange accents
- Mobile-first, clean typography, generous whitespace
- Construction-grade feel — bold, trustworthy, efficient

## Folder Structure (enforced)
```
src/
  app/                  # Next.js App Router pages
    (store)/            # Customer-facing store
    (admin)/            # Admin dashboard
    (partner)/          # Partner portal
    (auth)/             # Auth pages
    api/                # API route handlers
  components/
    ui/                 # shadcn/ui base components (never edit directly)
    shared/             # Reusable across all portals
    store/              # Store-specific components
    admin/              # Admin-specific components
    partner/            # Partner-specific components
  lib/
    supabase/           # Supabase client, server, middleware
    pawapay/            # PawaPay SDK wrapper
    africas-talking/    # SMS/WhatsApp helpers
    utils/              # Pure utility functions
  hooks/                # Custom React hooks
  types/                # TypeScript types & Supabase generated types
  constants/            # App-wide constants (categories, zones, etc.)
```

## Code Rules
- TypeScript everywhere — no `any` types
- All Supabase queries go through typed helpers in `lib/supabase/`
- Never expose Supabase service role key to the client
- RLS must be enabled on every table — never bypass with service key in client code
- All monetary values stored as integers (RWF cents) in the DB
- All dates stored as UTC in the DB, converted to Africa/Kigali timezone on display
- i18n strings extracted via `next-intl` from day one — never hardcode user-facing text
- No `console.log` in production code — use structured logging via Sentry

## Database Rules
- See `docs/database-schema.md` for full schema
- All tables have `created_at` and `updated_at` timestamps
- Soft deletes only — use `deleted_at` column, never `DELETE` on core entities
- Every financial transaction is append-only (no updates, only new records)
- Migrations live in `supabase/migrations/` — never edit the DB manually

## Key Business Rules
- Minimum order value: RWF 5,000
- Heavy goods (>500kg) require scheduled delivery — no same-day
- B2B orders >RWF 1,000,000 require admin approval before payment
- Partners must be approved by admin before their products go live
- Dropship partner commission: configurable per partner (default 10%)
- All prices are inclusive of VAT (18% in Rwanda)

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
GOOGLE_MAPS_API_KEY
SENTRY_DSN
```

## Reference Docs
- [Architecture](docs/architecture.md)
- [Design System](docs/design-system.md)
- [Database Schema](docs/database-schema.md)
- [API Integrations](docs/api-integrations.md)
- [Conventions](docs/conventions.md)
- [Build Plan](docs/build-plan.md)

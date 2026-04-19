# IsokoClick — Technical Architecture

## System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                               │
│                                                                    │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │  Customer Store  │  │  Admin Dashboard  │  │ Partner Portal  │  │
│  │  (Next.js PWA)   │  │   (Next.js App)   │  │  (Next.js App)  │  │
│  └────────┬────────┘  └────────┬──────────┘  └───────┬─────────┘  │
└───────────┼────────────────────┼─────────────────────┼────────────┘
            │                    │                       │
            └────────────────────┼───────────────────────┘
                                 │ HTTPS
┌────────────────────────────────▼─────────────────────────────────┐
│                      NEXT.JS API LAYER                            │
│              /api/* Route Handlers (Server-side only)             │
│    Auth middleware │ PawaPay webhooks │ Partner sync │ Cron jobs  │
└────────────────────────────────┬─────────────────────────────────┘
                                 │
            ┌────────────────────┼───────────────────────┐
            │                    │                        │
┌───────────▼──────┐  ┌──────────▼──────────┐  ┌────────▼────────┐
│   Supabase DB    │  │  Supabase Storage    │  │ Supabase Auth   │
│   (Postgres)     │  │  (Product images,    │  │ (JWT, RLS,      │
│   + Realtime     │  │   invoices, docs)    │  │  OAuth)         │
└──────────────────┘  └─────────────────────┘  └─────────────────┘
            │
            │ External Integrations
            │
┌───────────▼────────────────────────────────────────────────────┐
│                    THIRD-PARTY SERVICES                          │
│                                                                  │
│  PawaPay (payments)     Africa's Talking (SMS/WhatsApp)         │
│  Resend (email)         Google Maps API (delivery zones)        │
│  Sentry (monitoring)    Vercel Analytics                        │
└──────────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Next.js 14 App Router Structure
- **Route Groups** separate the three portals without URL impact:
  - `(store)` — public customer-facing store
  - `(admin)` — internal IsokoClick staff dashboard
  - `(partner)` — dropship partner portal
  - `(auth)` — shared login/signup pages
- **Server Components** by default — only use `"use client"` when needed (interactivity, hooks)
- **Server Actions** for form submissions (product add to cart, checkout, partner uploads)
- **Middleware** handles role-based route protection before page render

### State Management
- **Server state:** TanStack Query (React Query) for all async data
- **Client state:** Zustand for cart, UI state only
- **No Redux** — overkill for this use case
- **Realtime:** Supabase Realtime subscriptions for order status updates

### Rendering Strategy
| Page Type | Strategy | Reason |
|-----------|----------|--------|
| Product catalog | ISR (revalidate 60s) | SEO + freshness balance |
| Product detail | ISR (revalidate 30s) | Stock changes frequently |
| Cart / Checkout | CSR | User-specific, no SEO needed |
| Admin dashboard | SSR | Always fresh data |
| Partner portal | SSR | Always fresh data |
| Home / Landing | ISR (revalidate 300s) | SEO priority |

---

## Backend Architecture

### Supabase as Backend
- **Postgres** is the single source of truth
- **Row Level Security (RLS)** enforces access at DB level — no data leaks even if API is bypassed
- **Edge Functions** (Deno) for:
  - PawaPay webhook processing
  - Scheduled inventory alerts
  - Partner payout triggers
  - Order routing logic
- **Realtime** for live order tracking (customer) and order queue (warehouse/partner)

### API Design
- Next.js `/api/*` routes handle all external integrations
- Supabase JS client used server-side via `createServerClient`
- Never use `createBrowserClient` in API routes
- All responses use consistent envelope:
```json
{
  "data": { ... },
  "error": null,
  "meta": { "timestamp": "...", "requestId": "..." }
}
```

---

## Hybrid Inventory Model

```
Product
  └── source: "internal" | "dropship"
        │
        ├── internal → inventory_internal
        │     └── warehouse_id, quantity, reserved_quantity, reorder_threshold
        │
        └── dropship → inventory_dropship
              └── partner_id, quantity, last_synced_at
```

### Order Routing Engine
```
Order placed
    │
    ▼
For each line item:
    ├── item.source === "internal"
    │       └── Create fulfillment → assign to warehouse
    │
    └── item.source === "dropship"
            └── Create fulfillment → notify partner via SMS + dashboard
```

---

## Authentication & Authorization

### Auth Flow
1. Supabase Auth handles JWT issuance
2. On login, user role is read from `users.role` column
3. Middleware checks JWT + role before serving protected routes
4. RLS policies enforce the same rules at DB level (defense in depth)

### Role → Route Mapping
| Role | Allowed Routes |
|------|---------------|
| guest | `/`, `/shop/*`, `/product/*`, `/auth/*` |
| customer | above + `/account/*`, `/orders/*`, `/checkout/*` |
| b2b_customer | above + `/b2b/*`, `/rfq/*` |
| partner | `/partner/*` |
| warehouse_staff | `/warehouse/*` |
| delivery_agent | `/delivery/*` |
| admin | `/admin/*` + all above |

---

## Performance Strategy

### Frontend
- Next.js Image component for all product images (auto WebP, lazy load)
- `next/font` for typography (zero layout shift)
- Route-level code splitting (automatic with App Router)
- PWA: service worker caches catalog pages for offline browsing
- Critical CSS inlined; non-critical loaded async

### Backend
- Supabase connection pooling (PgBouncer) enabled
- Indexes on: `products.category_id`, `products.source`, `orders.customer_id`, `orders.status`
- Materialized views for product listings with stock counts
- Cursor-based pagination (no OFFSET) on all list queries

---

## Security Architecture

- All secrets in environment variables — never in code
- PawaPay webhook signature verification on every callback
- CSRF protection on all mutation endpoints
- Rate limiting: 100 req/min per IP on public APIs, 20 req/min on auth endpoints
- SQL injection: impossible via parameterized Supabase queries
- XSS: Next.js escapes by default; DOMPurify for any user-generated HTML
- RLS: every table has policies — service role key only used server-side

---

## Deployment Architecture

```
GitHub (main branch)
    │
    ├── Push to main → Vercel Production Deploy
    ├── Push to branch → Vercel Preview Deploy (unique URL)
    └── PR checks → GitHub Actions (lint, type-check, tests)

Vercel (Frontend)
    └── Edge Network → global CDN
    └── Serverless Functions → Next.js API routes

Supabase Cloud
    └── Rwanda region (or nearest: us-east-1 initially)
    └── Daily backups enabled
    └── Connection pooling via PgBouncer
```

---

## Monitoring & Observability

| Tool | Purpose |
|------|---------|
| Sentry | Error tracking (frontend + API routes) |
| Vercel Analytics | Core Web Vitals, page performance |
| Supabase Dashboard | DB query performance, slow queries |
| PawaPay Dashboard | Payment success rates, failed transactions |
| Custom Admin Analytics | Business metrics (revenue, orders, partners) |

### Key Metrics to Track
- Payment success rate (target: >95%)
- Order fulfillment time (internal: <24h, dropship: <48h)
- Page load time on 3G (target: <3s LCP)
- Cart abandonment rate
- Partner fill rate

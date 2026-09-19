# IsokoClick

**Rwanda's construction materials marketplace.** IsokoClick is an omnichannel
storefront for building materials, plumbing, finishes and tools, serving
Kigali first and the rest of Rwanda after. It runs a hybrid inventory model:
IsokoClick's own warehouse stock (`internal`) sits alongside third-party
partner stock (`dropship`) in the same catalog and the same cart, and orders
split at fulfillment. Prices are in RWF and inclusive of 18% VAT, the UI ships
in English and Kinyarwanda, and checkout is mobile-money-first through PawaPay
(MTN MoMo and Airtel Money), with cash on delivery as the fallback.

This README is for developers working on the repo. For the target architecture
and the house rules, see [CLAUDE.md](CLAUDE.md) and [`docs/`](#documentation) —
and see [Status](#status-shipped-vs-planned) for what is actually built today.

---

## Tech stack

| Layer | What we use |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Styling | Tailwind CSS v4, shadcn/ui (`base-nova` style), `lucide-react` |
| Backend | Supabase — Postgres + RLS, Auth, Storage (via `@supabase/ssr`) |
| Client state | Zustand (cart, persisted) — server data is fetched in Server Components |
| i18n | `next-intl`, non-routed locale (no `/en` or `/rw` prefix) |
| Payments | PawaPay Deposits API + signed webhook |
| Testing | Vitest (unit), Playwright + axe-core (accessibility) |
| CI/CD | GitHub Actions, Vercel |

---

## Quick start

**Prerequisites:** Node 20 (what CI runs) and a Supabase project — either
Supabase Cloud or a local stack via the `supabase` CLI, which is already a
devDependency.

```bash
git clone https://github.com/Joshuahobby/IsokoClick.git
cd IsokoClick

# Use `npm install`, NOT `npm ci`.
npm install

cp .env.example .env.local   # then fill in the Supabase values
```

> **Why not `npm ci`?** It refuses this lockfile over two pre-existing
> optional/peer inconsistencies in the dependency graph. `npm install` resolves
> cleanly, and CI uses it for the same reason — the full explanation is in
> [`.github/workflows/ci.yml`](.github/workflows/ci.yml). Regenerating the
> lockfile from scratch (on Linux) is open follow-up work.

Apply the schema, then run the app:

```bash
supabase db reset     # local stack — applies every migration + seed migration
# or: supabase db push   # against a linked remote project

npm run dev           # http://localhost:3000
```

Two setup steps are **not** covered by migrations — see
[Database & seeding](#database--seeding): creating the `product-images` storage
bucket, and creating privileged users.

---

## Environment variables

Copy [`.env.example`](.env.example) to `.env.local`. Nothing here is committed.

| Variable | Status | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **Required** | Inlined into the client bundle |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Required** | Inlined into the client bundle |
| `SUPABASE_SERVICE_ROLE_KEY` | **Required** | **Server-only.** Never import into client code — it bypasses RLS |
| `NEXT_PUBLIC_APP_URL` | **Required** | Defaults to `http://localhost:3000` |
| `PAWAPAY_API_KEY` | Required for MoMo checkout | Bearer token for the Deposits API |
| `PAWAPAY_WEBHOOK_SECRET` | Required for MoMo checkout | Webhook HMAC key; the webhook **fails closed (503)** without it |
| `PAWAPAY_SANDBOX` | Required for MoMo checkout | `true` → `api.sandbox.pawapay.io`; `false` calls the **live** API |
| `AFRICAS_TALKING_API_KEY` | Reserved | SMS/WhatsApp — no code yet |
| `AFRICAS_TALKING_USERNAME` | Reserved | SMS/WhatsApp — no code yet |
| `RESEND_API_KEY` | Reserved | Email — no code yet |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Reserved | Delivery zones — no code yet |
| `GOOGLE_MAPS_API_KEY` | Reserved | Delivery zones — no code yet |
| `SENTRY_DSN` | Reserved | Monitoring — no code yet |
| `NEXT_PUBLIC_SENTRY_DSN` | Reserved | Monitoring — no code yet |

"Reserved" means the key is claimed in `.env.example` for a planned
integration; leaving it blank changes nothing today.

---

## Database & seeding

Six migrations in [`supabase/migrations/`](supabase/migrations), applied in
order:

| Migration | What it does |
|---|---|
| `20260419000001_initial_schema.sql` | 23 tables, the `update_updated_at()` trigger, and the first RLS policies |
| `20260419000002_seed_data.sql` | Baseline categories, delivery zones and sample products |
| `20260707000001_create_signup_user_sync.sql` | `handle_new_user()` — syncs `auth.users` → `public.users` on signup |
| `20260714000001_add_rls_policies_and_order_rpc.sql` | `jwt_role()`, `current_profile_id()`, the `create_order_with_items()` RPC, and the remaining policies |
| `20260801000001_recategorize_catalog.sql` | Reorganises the catalog around how customers actually shop |
| `20260801000002_nest_category_subtrees.sql` | Collapses the taxonomy to five main categories with nested subtrees |

Full table-by-table reference: [docs/database-schema.md](docs/database-schema.md).
Never edit the database by hand — add a migration.

### Manual steps no migration covers

1. **Create the `product-images` storage bucket.** Product image upload and
   `scripts/upload-product-images.mjs` both write to it
   (`IMAGE_BUCKET` in `src/lib/supabase/queries/product-images.ts`), but no
   migration creates it. Make it in the Supabase dashboard or via the CLI.

2. **Create admin and partner users by hand.** The signup trigger only honours
   `customer` / `b2b_customer` from `user_metadata`; privileged roles must be
   set in **`app_metadata`** using the service key, because
   [`src/proxy.ts`](src/proxy.ts) reads the role from there and `user_metadata`
   is client-controlled. Roles: `admin`, `partner`, `warehouse_staff`,
   `delivery_agent`, `customer`, `b2b_customer`.

3. **Optional catalog seed** — `node scripts/seed-sanitaryware.mjs` upserts the
   plumbing and finishes catalog with specs. It is idempotent.

> `supabase/config.toml` points `db.seed.sql_paths` at `./seed.sql`, which does
> not exist in the repo. Seeding happens through the migration above and the
> scripts, not that file.

After any schema change, regenerate the types:

```bash
npx supabase gen types typescript --local > src/types/database.ts
```

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run type-check` | `tsc --noEmit` |
| `npm run test` | Vitest, single run |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Playwright (the full `e2e/` directory) |
| `npm run test:a11y` | Playwright, accessibility specs only |

Two things that will bite you:

- **`type-check` exhausts the default Node heap** on this project. CI raises it,
  and locally you may need to as well:
  ```bash
  NODE_OPTIONS=--max-old-space-size=6144 npm run type-check
  ```
- **The Playwright suites build first.** `playwright.config.ts` runs
  `npm run build && npm run start` (deliberately a production build, so Next's
  dev overlay doesn't trip axe). Install the browser once with
  `npx playwright install --with-deps chromium`. To scan an already-deployed URL
  and skip the local build entirely, set `PLAYWRIGHT_BASE_URL`.

### Maintenance scripts

[`scripts/`](scripts) holds manual, one-off maintenance scripts — brand asset
and site imagery generation, catalog seeding, product image upload, and
`apply-catalog-taxonomy.mjs` for applying the taxonomy migrations to an
already-seeded database. None of them run in CI or at build time. See
[scripts/README.md](scripts/README.md) for what each one does, where they read
source images from, and why `sharp` is deliberately absent from
`package.json` (install it with `npm install --no-save sharp`).

---

## Project structure

```
src/
├─ app/
│  ├─ (auth)/        login, signup, password reset, OAuth callback, partner registration
│  ├─ (store)/       public storefront — home, shop, product, cart, checkout, orders
│  ├─ admin/         staff dashboard (plain directory, not a route group)
│  ├─ partner/       dropship partner portal (plain directory, not a route group)
│  ├─ api/           route handlers — orders, PawaPay webhook, payment status
│  └─ actions/       server actions (product images)
├─ components/       ui/ (shadcn primitives), store/, admin/, shared/
├─ constants/        app.ts (MIN_ORDER_VALUE, VAT_RATE, …), technicians.ts, video-ads.ts
├─ hooks/            use-cart.ts (Zustand, persisted)
├─ i18n/             locales.ts, request.ts, messages.test.ts
├─ lib/
│  ├─ supabase/      client.ts, server.ts, middleware.ts, require-role.ts, queries/
│  └─ utils/         currency, date, phone, api envelope, image upload, logging
├─ types/            database.ts (generated)
└─ proxy.ts          route protection middleware
```

> Only `(auth)` and `(store)` are Next.js route groups. `admin/` and `partner/`
> are plain directories, so their names appear in the URL.

### Route protection

[`src/proxy.ts`](src/proxy.ts) is the middleware — Next 16 names the export
`proxy()`, not `middleware()`. It refreshes the Supabase session, then guards by
role.

- The store is **public by default**. Only these prefixes require auth:
  `/admin`, `/partner`, `/warehouse`, `/delivery`, `/checkout`, `/orders`,
  `/account`. Unknown paths 404 instead of bouncing to login.
- `/partner/register` and `/api` are exempt; `/api` routes enforce their own
  auth and return JSON envelopes rather than HTML redirects.
- Unauthenticated requests to a protected path redirect to
  `/login?redirectTo=…`.
- Role guards: `/admin` → `admin`; `/partner` → `partner` or `admin`;
  `/warehouse` → `warehouse_staff` or `admin`; `/delivery` → `delivery_agent`
  or `admin`.
- **The role is read from `user.app_metadata.role` only** — `user_metadata` is
  client-controlled, so trusting it would let anyone claim admin.

Add any new authenticated area to `PROTECTED_ROUTES`.

---

## Routes

| Portal | Routes |
|---|---|
| Store | `/`, `/shop`, `/product/[slug]`, `/checkout`, `/orders/[id]`, `/account/orders`, `/technicians`, `/video-ads`, `/privacy`, `/terms` |
| Auth | `/login`, `/signup`, `/reset-password`, `/update-password`, `/callback`, `/auth/signout`, `/partner/register`, `/partner/register/success` |
| Admin | `/admin/dashboard`, `/admin/orders`, `/admin/orders/[id]`, `/admin/products`, `/admin/products/new`, `/admin/products/[id]`, `/admin/partners`, `/admin/partners/[id]`, `/admin/analytics` *(stub)* |
| Partner | `/partner/dashboard`, `/partner/catalog`, `/partner/catalog/new`, `/partner/catalog/[id]`, `/partner/orders`, `/partner/payouts` |
| API | `POST /api/orders`, `POST /api/payments/pawapay/webhook`, `GET /api/payments/status` |

`/technicians` and `/video-ads` are static content pages driven by
`src/constants/`, with no table behind them. Legacy `/auth/login`,
`/auth/signup`, `/auth/reset-password`, `/auth/update-password` and
`/auth/callback` URLs permanently redirect to their top-level equivalents
(`next.config.ts`).

All API routes return the same envelope, built by `src/lib/utils/api.ts`:

```json
{ "data": { }, "error": null, "meta": { "timestamp": "…", "requestId": "…" } }
```

---

## Payments (PawaPay)

Mobile money is the primary path; cash on delivery is supported and simply
leaves the payment pending.

1. `POST /api/orders` validates the cart, creates the order through the
   `create_order_with_items()` RPC, then calls the PawaPay **Deposits API** —
   `api.sandbox.pawapay.io` or `api.pawapay.cloud` depending on
   `PAWAPAY_SANDBOX`, with correspondent `MTN_MOMO_RWA` or `AIRTEL_OAPI_RWA`.
2. PawaPay sends a USSD push to the customer's phone.
3. The customer approves on their handset.
4. PawaPay calls `POST /api/payments/pawapay/webhook`. The handler verifies an
   HMAC-SHA256 of the **raw** body against the `x-pawapay-signature` header
   using `timingSafeEqual`, **fails closed with 503 if
   `PAWAPAY_WEBHOOK_SECRET` is unset**, rejects currency or amount mismatches,
   is idempotent on already-completed payments, and appends an audit row to the
   append-only `payment_events` table.
5. The checkout page polls `GET /api/payments/status`.

Never trust an unverified callback. Contract details are in
[docs/api-integrations.md](docs/api-integrations.md).

> **Payouts are not implemented.** `/partner/payouts` only lets a partner store
> their payout phone number — nothing calls the PawaPay Payouts API yet.

---

## Internationalization

`messages/en.json` and `messages/rw.json` each carry 632 keys across the same
namespaces. `src/i18n/messages.test.ts` enforces key parity, rejects empty
strings, and checks that interpolation placeholders match between locales — so
adding an English string without its Kinyarwanda counterpart fails the test
suite.

Locale resolution is **non-routed** — there is no `/en` or `/rw` URL prefix.
The locale comes from `users.preferred_lang`, then the `NEXT_LOCALE` cookie,
defaulting to `en`.

Never hardcode user-facing text. 37 Kinyarwanda strings were written without a
fluent speaker and are flagged for review in
[docs/i18n-kinyarwanda-review.md](docs/i18n-kinyarwanda-review.md).

---

## Testing & CI

**Unit (Vitest)** — five suites covering currency formatting, the category
tree, phone normalisation and operator detection, image magic-byte sniffing,
and i18n message parity. `vitest.config.ts` sets no global DOM environment, so
a component test must opt in per file with `// @vitest-environment jsdom`.

**End-to-end (Playwright)** — currently **accessibility only**. `e2e/a11y.spec.ts`
scans the public pages, the categories mega menu, skip links and the cart
drawer's focus trap against `wcag2a`, `wcag2aa`, `wcag21a` and `wcag21aa`.
`e2e/a11y-authenticated.spec.ts` covers the signed-in admin and partner shells
and **skips unless** `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` and
`E2E_PARTNER_EMAIL` / `E2E_PARTNER_PASSWORD` are set. There is no functional
checkout E2E yet.

**CI** — [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every
pull request and every push to `main`:

| Job | Steps | Configuration it needs |
|---|---|---|
| `verify` | `npm install` → lint → type-check → unit tests | None |
| `a11y` | `npm install` → Chromium → `npm run test:a11y`; uploads traces on failure | Either `PLAYWRIGHT_BASE_URL` (scan a deployment) **or** `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (build in CI) |

The `a11y` job hard-fails if neither option is configured — a gate that quietly
skips is the problem it was added to solve. The four `E2E_*` credentials are
repository **secrets**; when absent the signed-in scans skip with a visible
`::warning::` rather than silently passing. The Supabase pair carries the
`NEXT_PUBLIC_` prefix and is already in the client bundle, so repository
*variables* are appropriate; they are read as variables first with a secrets
fallback.

---

## Status: shipped vs. planned

[CLAUDE.md](CLAUDE.md) describes the **target** platform. This section is the
current state of record.

### Working today

Storefront with the five-category taxonomy and mega menu · product detail
pages · cart and checkout · PawaPay deposit initiation and signed webhook ·
cash on delivery · customer order tracking · admin products, orders and
partners · partner catalog, orders and payout details · product image upload
for both portals · full English/Kinyarwanda UI · axe-core accessibility gate in
CI.

### Planned, not yet wired

| Area | State |
|---|---|
| Warehouse & delivery portals | Roles and route guards exist; no pages |
| PawaPay Payouts API | Only the payout phone number is stored |
| Admin analytics | Stub page ("coming soon") |
| Admin inventory UI | Tables exist; no screens |
| B2B bulk orders, RFQ, credit terms, invoices | Not started |
| Reviews, promotions, notifications | Tables exist; no UI |
| Africa's Talking SMS/WhatsApp | Env keys reserved; no code |
| Resend email | Env keys reserved; no code |
| Google Maps delivery zones | Env keys reserved; no code |
| Sentry | Not installed — `src/lib/utils/log.ts` is a console-only placeholder |
| Supabase Realtime | Not used |
| Supabase Edge Functions | No `supabase/functions/` directory |
| PWA caching | No manifest, no service worker |
| ISR | Cookie-based locale rules it out; the store renders dynamically |
| TanStack Query | Not a dependency — server data is fetched in Server Components |

---

## Conventions

- **TypeScript strict.** No `any` — use `unknown` and narrow. Avoid type
  assertions; comment the ones you can't avoid.
- **All Supabase queries go through the typed helpers** in
  `src/lib/supabase/queries/`. `createAdminClient()` is server-only.
- **RLS on every table.** Never bypass it with the service key in client code.
- **Money is integers.** Display with `formatRwf()` / `formatRwfCompact()` from
  `src/lib/utils/currency.ts`. Write `RWF` or `Frw`, never `$`.
- **Dates are UTC in the database**, converted to `Africa/Kigali` for display
  via `src/lib/utils/date.ts`.
- **No `console.log` in production code** — route errors through
  `logError()` in `src/lib/utils/log.ts`.
- **Conventional Commits** (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`,
  `test:`), branches prefixed `feature/`, `fix/`, `chore/` or `docs/`. No direct
  pushes to `main`.

Business rules worth knowing: minimum order RWF 5,000 (`MIN_ORDER_VALUE`), VAT
18% included in displayed prices, default partner commission 10%, B2B orders
above RWF 1,000,000 need admin approval — all in `src/constants/app.ts`.

Full detail: [docs/conventions.md](docs/conventions.md).

---

## Documentation

| Document | Contents |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Target architecture and working rules for this repo |
| [docs/architecture.md](docs/architecture.md) | System overview and layer diagram |
| [docs/database-schema.md](docs/database-schema.md) | Full table-by-table schema reference |
| [docs/api-integrations.md](docs/api-integrations.md) | PawaPay and other third-party API contracts |
| [docs/design-system.md](docs/design-system.md) | Dark industrial design language, tokens, UI guidelines |
| [docs/conventions.md](docs/conventions.md) | Project structure and development conventions |
| [docs/i18n-kinyarwanda-review.md](docs/i18n-kinyarwanda-review.md) | Kinyarwanda strings awaiting native-speaker review |
| [scripts/README.md](scripts/README.md) | Manual maintenance scripts |

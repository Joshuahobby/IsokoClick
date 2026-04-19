# IsokoClick — API Integrations

## 1. PawaPay (Payments)

### Overview
PawaPay is the **sole payment provider** for IsokoClick. It aggregates:
- MTN Mobile Money (Rwanda)
- Airtel Money (Rwanda)

A single API, single webhook, single reconciliation — no direct operator integrations.

### Environment
- Sandbox: `https://api.sandbox.pawapay.io`
- Production: `https://api.pawapay.cloud`
- Auth: Bearer token via `PAWAPAY_API_KEY`

### Key Endpoints

#### Initiate Deposit (Customer Payment)
```
POST /deposits
Authorization: Bearer {PAWAPAY_API_KEY}
Content-Type: application/json

{
  "depositId": "uuid-v4",               // our internal payment.id
  "amount": "45000",                    // RWF as string
  "currency": "RWF",
  "correspondent": "MTN_MOMO_RWA",      // or "AIRTEL_OAPI_RWA"
  "payer": {
    "type": "MSISDN",
    "address": { "value": "250781234567" }  // customer phone
  },
  "customerTimestamp": "2026-04-19T10:00:00Z",
  "statementDescription": "IsokoClick Order IK-2026-00001"
}

Response 200:
{
  "depositId": "uuid-v4",
  "status": "INITIATED"
}
```

#### Check Deposit Status
```
GET /deposits/{depositId}

Response:
{
  "depositId": "...",
  "status": "COMPLETED" | "FAILED" | "INITIATED",
  "amount": "45000",
  "currency": "RWF",
  "correspondent": "MTN_MOMO_RWA",
  "failureReason": { "failureCode": "...", "failureMessage": "..." }
}
```

#### Initiate Payout (Partner Payment)
```
POST /payouts
{
  "payoutId": "uuid-v4",
  "amount": "120000",
  "currency": "RWF",
  "correspondent": "MTN_MOMO_RWA",
  "recipient": {
    "type": "MSISDN",
    "address": { "value": "250788000000" }   // partner MoMo number
  },
  "customerTimestamp": "2026-04-19T10:00:00Z",
  "statementDescription": "IsokoClick Partner Payout - April 2026"
}
```

### Webhook Handler
Endpoint: `POST /api/payments/pawapay/webhook`

```typescript
// Verify signature before processing
const signature = request.headers.get('x-pawapay-signature')
const isValid = verifyPawapaySignature(body, signature, PAWAPAY_WEBHOOK_SECRET)
if (!isValid) return Response.json({ error: 'Invalid signature' }, { status: 401 })

// Event types to handle:
// DEPOSIT_COMPLETED  → mark order as paid, trigger fulfillment
// DEPOSIT_FAILED     → notify customer, release reserved stock
// PAYOUT_COMPLETED   → update partner_payouts.status = 'paid'
// PAYOUT_FAILED      → alert admin, retry logic
```

### Correspondent Codes (Rwanda)
| Operator | Code |
|----------|------|
| MTN Mobile Money | `MTN_MOMO_RWA` |
| Airtel Money | `AIRTEL_OAPI_RWA` |

### Error Handling
- `INITIATED` status expires after 120 seconds — poll or rely on webhook
- On `FAILED`: surface `failureMessage` to customer in plain language
- Always idempotent: use our `payment.id` as `depositId` — safe to retry
- Log all raw webhook payloads to `payment_events` table

### Lib Wrapper: `src/lib/pawapay/`
```
pawapay/
  client.ts        # base fetch wrapper with auth headers
  deposits.ts      # initiate, check, list deposits
  payouts.ts       # initiate, check payouts
  webhooks.ts      # signature verification, event parsing
  types.ts         # PawaPay API TypeScript types
  constants.ts     # correspondent codes, status enums
```

---

## 2. Africa's Talking (SMS & WhatsApp)

### Overview
Used for: order confirmations, delivery updates, OTP (if needed), WhatsApp bot.

### Environment
- Sandbox username: `sandbox`
- Production username: from `AFRICAS_TALKING_USERNAME`
- API Key: `AFRICAS_TALKING_API_KEY`

### SMS

#### Send SMS
```typescript
import AfricasTalking from 'africastalking'

const client = AfricasTalking({
  apiKey: process.env.AFRICAS_TALKING_API_KEY,
  username: process.env.AFRICAS_TALKING_USERNAME,
})

await client.SMS.send({
  to: ['+250781234567'],
  message: 'Your IsokoClick order IK-2026-00001 has been confirmed.',
  from: 'IsokoClick',     // shortcode/alphanumeric sender ID
})
```

#### SMS Templates (i18n-ready)
| Event | English | Kinyarwanda |
|-------|---------|-------------|
| Order confirmed | `Order IK-{n} confirmed. Total: RWF {amount}. Track at isokoclick.rw/orders` | ... |
| Payment received | `Payment of RWF {amount} received for order IK-{n}.` | ... |
| Order dispatched | `Your order IK-{n} is on the way! Estimated delivery: {date}.` | ... |
| Order delivered | `Order IK-{n} delivered. Rate your experience: isokoclick.rw/review/{n}` | ... |
| Low stock alert (admin) | `Low stock: {product} has {qty} units left in warehouse.` | — |

### WhatsApp (Phase 7)
- Use Africa's Talking WhatsApp Business API
- Bot handles: product search, price check, order status queries
- Handoff to human agent for complex queries
- Webhook: `POST /api/whatsapp/webhook`

### Lib Wrapper: `src/lib/africas-talking/`
```
africas-talking/
  client.ts      # SDK initialization
  sms.ts         # send, bulk send helpers
  templates.ts   # SMS template strings (EN + RW)
  whatsapp.ts    # WhatsApp message handlers (Phase 7)
```

---

## 3. Supabase

### Client Setup
```typescript
// src/lib/supabase/server.ts  — for Server Components & API routes
import { createServerClient } from '@supabase/ssr'

// src/lib/supabase/client.ts  — for Client Components only
import { createBrowserClient } from '@supabase/ssr'

// NEVER use service role key in browser client
// Service role key only in Edge Functions and secure server-side operations
```

### Storage Buckets
| Bucket | Purpose | Public |
|--------|---------|--------|
| `product-images` | Product photos | Yes |
| `partner-logos` | Partner brand logos | Yes |
| `invoices` | PDF invoices | No (signed URLs) |
| `delivery-proofs` | Proof of delivery photos | No (signed URLs) |
| `partner-docs` | KYC documents | No (signed URLs) |

### Realtime Subscriptions
```typescript
// Order status updates (customer tracking page)
supabase
  .channel('order-updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'orders',
    filter: `id=eq.${orderId}`
  }, (payload) => updateOrderStatus(payload.new))
  .subscribe()

// Warehouse order queue (staff dashboard)
supabase
  .channel('warehouse-queue')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'order_fulfillments',
    filter: `source=eq.internal`
  }, (payload) => addToQueue(payload.new))
  .subscribe()
```

### Edge Functions
| Function | Trigger | Purpose |
|----------|---------|---------|
| `process-payment-webhook` | HTTP (PawaPay callback) | Verify + process payment events |
| `route-order` | DB trigger on orders INSERT | Auto-assign fulfillment source |
| `send-notifications` | DB trigger on order status UPDATE | Dispatch SMS/email/in-app |
| `inventory-alerts` | Cron (daily 7am) | Check low stock, notify admin |
| `process-partner-payouts` | Cron (1st of month) | Calculate + initiate partner payouts |

---

## 4. Resend (Transactional Email)

### Setup
```typescript
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

await resend.emails.send({
  from: 'IsokoClick <orders@isokoclick.rw>',
  to: customer.email,
  subject: `Order Confirmed — IK-2026-00001`,
  react: OrderConfirmationEmail({ order }),
})
```

### Email Templates (React Email components)
| Template | File | Trigger |
|----------|------|---------|
| Order Confirmation | `emails/order-confirmation.tsx` | Payment completed |
| Order Dispatched | `emails/order-dispatched.tsx` | Fulfillment dispatched |
| Order Delivered | `emails/order-delivered.tsx` | Delivery confirmed |
| Invoice | `emails/invoice.tsx` | B2B order placed |
| Partner Welcome | `emails/partner-welcome.tsx` | Partner approved |
| Partner Order Alert | `emails/partner-order.tsx` | New dropship order |
| Password Reset | `emails/password-reset.tsx` | Auth flow |
| Low Stock Alert | `emails/low-stock.tsx` | Admin alert |

---

## 5. Google Maps API

### Usage
- Delivery zone visualization on checkout (show which zone customer is in)
- Address autocomplete (Rwanda-specific: sector/district/province)
- Warehouse location display
- Delivery agent route view (Phase 4)

### Keys
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — browser-side (Maps JS API)
- `GOOGLE_MAPS_API_KEY` — server-side (Geocoding API)

### Restrictions
- Browser key: restrict to `isokoclick.rw` domain
- Server key: restrict to server IP, Geocoding API only

---

## 6. Sentry (Error Monitoring)

### Setup
```typescript
// next.config.js — Sentry webpack plugin
// sentry.client.config.ts — browser error capture
// sentry.server.config.ts — server/edge error capture
```

### Custom Context to Attach
- `user.id` and `user.role` on all authenticated errors
- `order.id` on payment and fulfillment errors
- `partner.id` on partner portal errors

---

## Integration Checklist (Phase 1 Setup)

- [ ] PawaPay sandbox account created, API key in `.env.local`
- [ ] PawaPay webhook URL registered in PawaPay dashboard
- [ ] Africa's Talking sandbox account, API key in `.env.local`
- [ ] Resend account, domain `isokoclick.rw` verified
- [ ] Supabase project created, URL + anon key in `.env.local`
- [ ] Supabase Storage buckets created with correct policies
- [ ] Google Maps API key created with correct restrictions
- [ ] Sentry project created, DSN in `.env.local`

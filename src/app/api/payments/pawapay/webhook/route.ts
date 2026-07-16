import crypto from 'crypto'
import {
  getPaymentByDepositId,
  recordPaymentEvent,
  updatePaymentAndOrderStatus,
} from '@/lib/supabase/queries/orders'
import { logError } from '@/lib/utils/log'
import type { PaymentStatus, OrderStatus, Json } from '@/types/database'

type PawaPayWebhookPayload = {
  depositId: string
  status: 'COMPLETED' | 'FAILED' | 'DUPLICATE_IGNORED'
  requestedAmount: string
  depositedAmount?: string
  currency: string
  failureReason?: { failureCode: string; failureMessage: string }
}

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  try {
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

function mapStatuses(pawapayStatus: string): { payment: PaymentStatus; order: OrderStatus } {
  if (pawapayStatus === 'COMPLETED') return { payment: 'completed', order: 'confirmed' }
  return { payment: 'failed', order: 'cancelled' }
}

export async function POST(request: Request) {
  const rawBody = await request.text()

  // The webhook secret is mandatory: with signature verification skipped,
  // anyone who finds this URL could mark arbitrary orders as paid. Fail
  // closed if the deployment is misconfigured.
  const secret = process.env.PAWAPAY_WEBHOOK_SECRET
  if (!secret) {
    logError('pawapay:webhook', new Error('PAWAPAY_WEBHOOK_SECRET is not set — webhook rejected'))
    return new Response('Webhook not configured', { status: 503 })
  }

  const signature = request.headers.get('x-pawapay-signature') ?? ''
  if (!verifySignature(rawBody, signature, secret)) {
    return new Response('Invalid signature', { status: 401 })
  }

  let payload: PawaPayWebhookPayload
  try {
    payload = JSON.parse(rawBody) as PawaPayWebhookPayload
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const { depositId, status } = payload
  if (!depositId || !status) return new Response('Missing fields', { status: 400 })

  // DUPLICATE_IGNORED means already processed — acknowledge and skip
  if (status === 'DUPLICATE_IGNORED') return new Response('OK', { status: 200 })

  const payment = await getPaymentByDepositId(depositId)
  if (!payment) return new Response('Unknown deposit', { status: 404 })

  // Keep an append-only audit trail of every verified callback
  await recordPaymentEvent(payment.id, `pawapay_${status.toLowerCase()}`, payload as unknown as Json)

  // Idempotency: a completed payment is final — never re-process
  if (payment.status === 'completed') return new Response('OK', { status: 200 })

  // The reported amount and currency must match what we asked PawaPay to
  // collect. A mismatch never marks the order paid.
  if (status === 'COMPLETED') {
    const reported = Number(payload.depositedAmount ?? payload.requestedAmount)
    if (payload.currency !== 'RWF' || !Number.isFinite(reported) || reported !== payment.amount) {
      logError(
        'pawapay:webhook',
        new Error(
          `Amount mismatch for deposit ${depositId}: expected ${payment.amount} RWF, got ${payload.depositedAmount ?? payload.requestedAmount} ${payload.currency}`
        )
      )
      return new Response('Amount mismatch', { status: 400 })
    }
  }

  const { payment: paymentStatus, order } = mapStatuses(status)
  const failureReason = payload.failureReason
    ? `${payload.failureReason.failureCode}: ${payload.failureReason.failureMessage}`
    : null
  const updated = await updatePaymentAndOrderStatus(depositId, paymentStatus, order, failureReason)
  if (!updated) return new Response('Update failed', { status: 500 })

  return new Response('OK', { status: 200 })
}

import crypto from 'crypto'
import { updatePaymentAndOrderStatus } from '@/lib/supabase/queries/orders'
import type { PaymentStatus, OrderStatus } from '@/types/database'

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

  // Verify PawaPay webhook signature — fail closed if the secret is not configured,
  // otherwise a misconfigured deployment would accept forged callbacks
  const secret = process.env.PAWAPAY_WEBHOOK_SECRET
  if (!secret) {
    return new Response('Webhook secret not configured', { status: 500 })
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

  const { payment, order } = mapStatuses(status)
  await updatePaymentAndOrderStatus(depositId, payment, order)

  return new Response('OK', { status: 200 })
}

import { createClient } from '@/lib/supabase/server'
import { getPaymentStatusByOrderId, getUserProfileId } from '@/lib/supabase/queries/orders'
import { apiResponse, apiError } from '@/lib/utils/api'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get('orderId')
  if (!orderId) return apiError('orderId is required')

  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) return apiError('Unauthorized', 401)

  const customerId = await getUserProfileId(authUser.id)
  if (!customerId) return apiError('User profile not found', 404)

  const status = await getPaymentStatusByOrderId(orderId, customerId)
  if (status === null) return apiError('Order not found', 404)

  return apiResponse({ orderId, status })
}

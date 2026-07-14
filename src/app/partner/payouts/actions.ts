'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getPartnerByUserId } from '@/lib/supabase/queries/partners'
import { logError } from '@/lib/utils/log'

export async function updatePayoutInfo(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'Not authenticated.' }
  }

  const partner = await getPartnerByUserId(user.id)
  if (!partner) {
    return { error: 'Partner profile not found.' }
  }

  const payoutPhone = formData.get('payout_phone') as string

  if (!payoutPhone) {
    return { error: 'Payout phone number is required.' }
  }

  // Basic validation for Rwandan phone number
  if (!payoutPhone.startsWith('07') || payoutPhone.length !== 10) {
    return { error: 'Please enter a valid 10-digit phone number starting with 07.' }
  }

  const { error } = await supabase
    .from('partners')
    .update({ payout_phone: payoutPhone })
    .eq('id', partner.id)

  if (error) {
    logError('partner:update-payout', error)
    return { error: 'Failed to update payout settings. Please try again.' }
  }

  revalidatePath('/partner/payouts')
  return { success: true }
}

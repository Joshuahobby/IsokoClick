'use server'

import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { getPartnerByUserId } from '@/lib/supabase/queries/partners'
import { logError } from '@/lib/utils/log'

export async function updatePayoutInfo(formData: FormData) {
  const t = await getTranslations('errors')
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: t('notAuthenticated') }
  }

  const partner = await getPartnerByUserId(user.id)
  if (!partner) {
    return { error: t('partnerNotFound') }
  }

  const payoutPhone = formData.get('payout_phone') as string

  if (!payoutPhone) {
    return { error: t('payoutPhoneRequired') }
  }

  // Basic validation for Rwandan phone number
  if (!payoutPhone.startsWith('07') || payoutPhone.length !== 10) {
    return { error: t('payoutPhoneInvalid') }
  }

  const { error } = await supabase
    .from('partners')
    .update({ payout_phone: payoutPhone })
    .eq('id', partner.id)

  if (error) {
    logError('partner:update-payout', error)
    return { error: t('payoutUpdateFailed') }
  }

  revalidatePath('/partner/payouts')
  return { success: true }
}

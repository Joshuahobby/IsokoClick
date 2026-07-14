'use server'

import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { logError } from '@/lib/utils/log'
import type { PartnerInsert } from '@/types/database'

export async function applyForPartner(formData: FormData) {
  const supabase = await createClient()

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'You must be logged in to apply.' }
  }

  const businessName = formData.get('business_name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const tinNumber = formData.get('tin_number') as string
  const district = formData.get('district') as string
  const address = formData.get('address') as string
  const description = formData.get('description') as string

  if (!businessName || !email || !phone) {
    return { error: 'Business name, email, and phone are required.' }
  }

  const admin = await createAdminClient()

  // One application per account
  const { data: existing } = await admin
    .from('partners')
    .select('id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()
  if (existing) {
    return { error: 'You already have a partner application on file.' }
  }

  // Generate a basic slug
  const baseSlug = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

  const newPartner: PartnerInsert = {
    user_id: user.id,
    business_name: businessName,
    slug: baseSlug,
    email,
    phone,
    tin_number: tinNumber || null,
    district: district || null,
    address: address || null,
    description: description || null,
    status: 'pending',
    commission_rate: 10, // Default platform commission
    payout_phone: null,
    logo_url: null,
    deleted_at: null,
  }

  let { error } = await admin.from('partners').insert(newPartner)

  // Slug collision (unique violation): retry once with a random suffix
  if (error?.code === '23505') {
    const suffixed = `${baseSlug}-${crypto.randomUUID().slice(0, 4)}`
    ;({ error } = await admin.from('partners').insert({ ...newPartner, slug: suffixed }))
  }

  if (error) {
    // Raw Postgres errors leak schema details — log server-side, keep
    // the client message generic.
    logError('partner:apply', error)
    return { error: 'Failed to submit your application. Please try again.' }
  }

  // The user's role is still 'customer' until an admin approves the
  // application, so the partner portal would bounce them — send them to
  // a public confirmation page instead.
  redirect('/partner/register/success')
}

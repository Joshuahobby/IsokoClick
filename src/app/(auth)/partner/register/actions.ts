'use server'

import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
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

  // Generate a basic slug
  const slug = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

  // Create the partner record
  const newPartner: PartnerInsert = {
    user_id: user.id,
    business_name: businessName,
    slug,
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

  const admin = await createAdminClient()
  const { error } = await admin
    .from('partners')
    .insert(newPartner)

  if (error) {
    // Basic unique constraint handling (e.g. if user already applied or slug taken)
    return { error: error.message }
  }

  // On success, redirect to a success page or dashboard showing pending status
  redirect('/partner/dashboard')
}

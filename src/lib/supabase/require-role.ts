import { createClient } from '@/lib/supabase/server'

// Server actions are independently addressable endpoints — middleware
// path checks don't protect them. Every privileged action must call
// this itself. Roles come from app_metadata (service-key only), never
// user_metadata (client-controlled).
export async function hasRole(...roles: string[]): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const role = user?.app_metadata?.role as string | undefined
  return role !== undefined && roles.includes(role)
}

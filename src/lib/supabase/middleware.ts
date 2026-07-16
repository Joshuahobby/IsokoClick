import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

// Supabase keeps the session JWT in `sb-<project-ref>-auth-token`, chunked
// across `.0`/`.1` suffixes when it outgrows the cookie size limit.
function hasAuthCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.includes('auth-token'))
}

export async function updateSession(request: NextRequest) {
  // getUser() is a blocking round-trip to Supabase Auth to validate the JWT.
  // Without an auth cookie there is no JWT to validate and no session to
  // refresh, so it can only resolve to null — skip it rather than make guests
  // browsing the public store pay for it on every navigation.
  if (!hasAuthCookie(request)) {
    return { supabaseResponse: NextResponse.next({ request }), user: null }
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  return { supabaseResponse, user }
}

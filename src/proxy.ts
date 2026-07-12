import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Note: the (auth) route group adds no URL segment — its pages resolve to
// top-level paths like /login, not /auth/login.

// Exemptions for public paths that live under a protected prefix, checked
// before PROTECTED_ROUTES. /api routes enforce their own auth (401 JSON
// envelopes) and include server-to-server callbacks like the PawaPay
// webhook — an HTML login redirect would break both.
const PUBLIC_EXEMPTIONS = [
  '/partner/register',
  '/api',
]

// The store is public by default: anything not under these prefixes passes
// through, so unknown paths get Next's 404 instead of a redirect to /login
// (crawlers probing /impressum, /kontakt, etc. were being bounced to the
// login page). New authenticated areas must be added here.
const PROTECTED_ROUTES = [
  '/admin',
  '/partner',
  '/warehouse',
  '/delivery',
  '/checkout',
  '/orders',
  '/account',
]

const ADMIN_ROUTES = ['/admin']
const PARTNER_ROUTES = ['/partner']
const WAREHOUSE_ROUTES = ['/warehouse']
const DELIVERY_ROUTES = ['/delivery']

function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some((r) => pathname === r || pathname.startsWith(r + '/'))
}

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  if (matchesRoute(pathname, PUBLIC_EXEMPTIONS)) return supabaseResponse
  if (!matchesRoute(pathname, PROTECTED_ROUTES)) return supabaseResponse

  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Role-based route protection — role must come from app_metadata, which is
  // only settable with the service key. user_metadata is client-controlled
  // (signup options / updateUser), so trusting it lets anyone claim admin.
  const role = user.app_metadata?.role as string | undefined

  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r)) && role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (PARTNER_ROUTES.some((r) => pathname.startsWith(r)) && role !== 'partner' && role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (WAREHOUSE_ROUTES.some((r) => pathname.startsWith(r)) && !['warehouse_staff', 'admin'].includes(role ?? '')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (DELIVERY_ROUTES.some((r) => pathname.startsWith(r)) && !['delivery_agent', 'admin'].includes(role ?? '')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

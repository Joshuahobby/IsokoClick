import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Note: the (auth) route group adds no URL segment — its pages resolve to
// top-level paths like /login, not /auth/login.
const PUBLIC_ROUTES = [
  '/',
  '/shop',
  '/product',
  '/auth',
  '/login',
  '/signup',
  '/reset-password',
  '/update-password',
  '/callback',
  '/partner/register',
]
const ADMIN_ROUTES = ['/admin']
const PARTNER_ROUTES = ['/partner']
const WAREHOUSE_ROUTES = ['/warehouse']
const DELIVERY_ROUTES = ['/delivery']

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))
}

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  if (isPublicRoute(pathname)) return supabaseResponse

  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Role-based route protection — role stored in user metadata
  const role = user.user_metadata?.role as string | undefined

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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

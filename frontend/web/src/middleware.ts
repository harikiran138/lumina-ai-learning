import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  getCanonicalPath,
  getRoleHome,
  normalizeRole,
} from '@/lib/role-routing'

/**
 * Decode JWT payload (no signature verification — Edge runtime only).
 * Returns null when the token is malformed or expired.
 */
function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')

    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )

    const payload = JSON.parse(jsonPayload)

    const exp = payload?.exp
    if (typeof exp === 'number' && Date.now() / 1000 > exp) {
      return null // expired
    }

    return payload
  } catch {
    return null
  }
}

// Protected path prefixes → the canonical role required to access them.
// super_admin can access every path (checked below).
// Protected path prefixes → the canonical role required to access them.
// super_admin can access every path (checked below).
const PROTECTED_PATHS: Record<string, string> = {
  '/dashboard/admin':       'ADMIN',
  '/dashboard/faculty':     'FACULTY',
  '/dashboard/hod':         'HOD',
  '/dashboard/student':     'STUDENT',
  '/dashboard/parent':      'PARENT',
  '/dashboard/counselor':   'COUNSELOR',
  '/dashboard/peer-mentor': 'PEER_MENTOR',
  '/dashboard/alumni':      'ALUMNI',
  '/dashboard/super-admin': 'SUPER_ADMIN',
}

const ADMIN_ALLOWED = new Set([
  'SUPER_ADMIN', 'ADMIN', 'HOD',
])

const AUDITOR_ALLOWED = new Set(['ADMIN', 'SUPER_ADMIN'])

// Public routes where guest session tracking applies
const PUBLIC_TRACKABLE_PATHS = ['/courses/catalog', '/courses']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── 1. Canonical path redirect (aliases → canonical) ─────────────────────────
  // Must happen before any auth check so legacy links always resolve.
  const canonical = getCanonicalPath(pathname)
  if (canonical) {
    const url = request.nextUrl.clone()
    url.pathname = canonical
    return NextResponse.redirect(url)
  }

  const accessToken  = request.cookies.get('access_token')?.value
  const refreshToken = request.cookies.get('refresh_token')?.value
  // Use whichever token is present to read the payload claims.
  const token = accessToken || refreshToken

  const isPublicPath =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/')

  // ── Guest session tracking ────────────────────────────────────────────────
  // Issue an anonymous session cookie for unauthenticated visitors on public
  // trackable routes (e.g. /courses/catalog) for conversion analytics.
  if (!token && PUBLIC_TRACKABLE_PATHS.some(p => pathname === p || pathname.startsWith(`${p}/`))) {
    const guestToken = request.cookies.get('lumina_guest')?.value ?? crypto.randomUUID()
    const res = NextResponse.next()

    res.cookies.set('lumina_guest', guestToken, {
      maxAge: 60 * 60 * 24 * 30,  // 30 days
      sameSite: 'lax',
      path: '/',
      httpOnly: false,  // client JS may read for UX purposes
    })

    // Fire-and-forget: log page visit to backend (never block rendering)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    if (apiUrl) {
      fetch(`${apiUrl}/api/guest/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_token: guestToken,
          path: pathname,
          referrer: request.headers.get('referer') ?? null,
        }),
      }).catch(() => {})
    }

    return res
  }

  // ── 2. Unauthenticated visitor ────────────────────────────────────────────────
  if (!token) {
    if (isPublicPath) return NextResponse.next()

    // Protected route — redirect to login.
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('reason', 'unauthorized')
    const response = NextResponse.redirect(url)
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
    return response
  }

  // ── 3. Decode and validate token ──────────────────────────────────────────────
  const payload = decodeToken(token)
  if (!payload) {
    // Token is present but expired or malformed.
    if (isPublicPath) return NextResponse.next()

    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('reason', 'session_expired')
    const response = NextResponse.redirect(url)
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
    return response
  }

  const rawRole = typeof payload.role === 'string' ? payload.role : null
  if (!rawRole) {
    // Malformed JWT — send back to login.
    if (isPublicPath) return NextResponse.next()

    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('reason', 'session_sync_required')
    const response = NextResponse.redirect(url)
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
    return response
  }

  const role = normalizeRole(rawRole)

  // Roles that may require a wizard-style onboarding.
  // If a role is NOT in this set, and onboardingCompleted is false, they go to /onboarding.
  const ONBOARDING_BYPASS_ROLES = new Set([
     'SUPER_ADMIN', 'ADMIN'
   ])
  const onboardingCompleted =
    payload.onboardingCompleted === true || ONBOARDING_BYPASS_ROLES.has(role)

  // ── 4. Authenticated user visiting a public page ──────────────────────────────
  if (isPublicPath) {
    // Redirect logged-in users away from /login and /register.
    if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
      // If they explicitly want to logout/switch account, allow them to see the page.
      if (request.nextUrl.searchParams.get('logout') === 'true') {
        return NextResponse.next()
      }

      const url = request.nextUrl.clone()
      url.pathname = onboardingCompleted ? getRoleHome(role) : '/onboarding'
      // Clear reason param so the destination doesn't see a stale reason.
      url.searchParams.delete('reason')
      const response = NextResponse.redirect(url)
      response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
      return response
    }
    return NextResponse.next()
  }

  // ── 5. Onboarding gate ────────────────────────────────────────────────────────
  if (!onboardingCompleted && !pathname.startsWith('/onboarding')) {
    const url = request.nextUrl.clone()
    url.pathname = '/onboarding'
    return NextResponse.redirect(url)
  }

  if (onboardingCompleted && pathname.startsWith('/onboarding')) {
    const url = request.nextUrl.clone()
    url.pathname = getRoleHome(role)
    return NextResponse.redirect(url)
  }

  // ── 6. Role-based access control ─────────────────────────────────────────────
  for (const [pathPrefix, expectedRole] of Object.entries(PROTECTED_PATHS)) {
    if (pathname === pathPrefix || pathname.startsWith(`${pathPrefix}/`)) {
      const allowed = role === 'SUPER_ADMIN' || role === expectedRole;

      if (!allowed) {
        const url = request.nextUrl.clone()
        url.pathname = getRoleHome(role)
        return NextResponse.redirect(url)
      }
      break
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Protected role paths
    '/student/:path*',
    '/teacher/:path*',
    '/admin/:path*',
    '/hod/:path*',
    '/college/:path*',
    '/parent/:path*',
    '/mentor/:path*',
    '/peer_tutor/:path*',
    '/counselor/:path*',
    '/content_creator/:path*',
    '/researcher/:path*',
    '/alumni/:path*',
    // Onboarding gate
    '/onboarding',
    '/onboarding/:path*',
    // Role aliases
    '/faculty/:path*',
    '/peer-tutor/:path*',
    '/creator/:path*',
    '/content-creator/:path*',
    // Redirect logged-in users away from auth pages
    '/login',
    '/register',
  ],
}

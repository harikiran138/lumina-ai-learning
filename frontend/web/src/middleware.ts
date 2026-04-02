import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  getCanonicalPath,
  getRoleHome,
  normalizeRole,
} from '@/lib/role-routing'

/**
 * Decode JWT (no signature verification for Edge runtime)
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
      return null
    }

    return payload
  } catch {
    return null
  }
}

/**
 * Path → Role mapping
 */
const PROTECTED_PATHS: Record<string, string> = {
  '/admin': 'super_admin',
  '/college': 'college_admin',
  '/hod': 'hod',
  '/faculty': 'faculty',
  '/student': 'student',
  '/parent': 'parent',
  '/mentor': 'mentor',
  '/peer_tutor': 'peer_tutor',
  '/counselor': 'counselor',
  '/content_creator': 'content_creator',
  '/researcher': 'researcher',
  '/alumni': 'alumni',
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ✅ Canonical redirects (aliases → correct routes)
  const canonical = getCanonicalPath(pathname)
  if (canonical) {
    const url = request.nextUrl.clone()
    url.pathname = canonical
    return NextResponse.redirect(url)
  }

  const isPublic =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname === '/'

  const accessToken = request.cookies.get('access_token')?.value

  // 🚫 Not logged in
  if (!accessToken) {
    if (!isPublic) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'

      const reason = request.cookies.get('refresh_token')?.value
        ? 'session_expired'
        : 'unauthorized'

      url.searchParams.set('reason', reason)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // 🔍 Decode token
  const payload = decodeToken(accessToken)
  if (!payload) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('reason', 'session_expired')
    return NextResponse.redirect(url)
  }

  const rawRole = typeof payload.role === 'string' ? payload.role : null
  if (!rawRole) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('reason', 'session_sync_required')
    return NextResponse.redirect(url)
  }

  const role = normalizeRole(rawRole)
  const onboardingCompleted = payload.onboardingCompleted === true

  // 🚧 Onboarding checks
  if (!onboardingCompleted && !pathname.startsWith('/onboarding') && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/onboarding'
    return NextResponse.redirect(url)
  }

  if (onboardingCompleted && pathname.startsWith('/onboarding')) {
    const url = request.nextUrl.clone()
    url.pathname = getRoleHome(role)
    return NextResponse.redirect(url)
  }

  // 🔐 Role-based access control
  for (const [pathPrefix, expectedRole] of Object.entries(PROTECTED_PATHS)) {
    if (pathname === pathPrefix || pathname.startsWith(`${pathPrefix}/`)) {
      if (role !== 'super_admin' && role !== expectedRole) {
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
    '/student/:path*',
    '/teacher/:path*',
    '/admin/:path*',
    '/hod/:path*',
    '/college/:path*',
    '/faculty/:path*',
    '/parent/:path*',
    '/mentor/:path*',
    '/peer_tutor/:path*',
    '/counselor/:path*',
    '/content_creator/:path*',
    '/researcher/:path*',
    '/alumni/:path*',
    '/onboarding',
  ],
}
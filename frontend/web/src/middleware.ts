import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  getCanonicalPath,
  getExpectedRoleForPath,
  getRoleHome,
  normalizeRole,
} from '@/lib/role-routing'

/**
 * Decodes a JWT payload WITHOUT verifying the signature (Edge runtime cannot use crypto libs).
 * Returns null if the token is malformed OR if it is expired.
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

    // Reject tokens whose `exp` claim has already passed.
    const exp = payload?.exp
    if (typeof exp === 'number' && Date.now() / 1000 > exp) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

// Maps each role to the URL prefix it is allowed to access.
// super_admin bypasses all path-role checks.
const ROLE_PATH_MAP: Record<string, string> = {
  super_admin:      '/admin',
  college_admin:    '/college',
  hod:              '/hod',
  faculty:          '/faculty',
  teacher:          '/faculty',
  student:          '/student',
  parent:           '/parent',
  mentor:           '/mentor',
  peer_tutor:       '/peer_tutor',
  counselor:        '/counselor',
  content_creator:  '/content_creator',
  researcher:       '/researcher',
  alumni:           '/alumni',
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Canonical redirect (e.g. /teacher → /faculty)
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

  // Only use the access_token for routing decisions.
  // The refresh_token is an opaque rotation credential — it must not be used to
  // infer role or session state; that is the backend's job at /api/auth/refresh.
  const accessToken = request.cookies.get('access_token')?.value

  if (!accessToken) {
    if (!isPublic) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      // If a refresh_token exists the client-side auth provider will call
      // /api/auth/refresh automatically after hydration.
      const reason = request.cookies.get('refresh_token')?.value
        ? 'session_expired'
        : 'unauthorized'
      url.searchParams.set('reason', reason)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  const payload = decodeToken(accessToken)
  if (!payload) {
    // Token present but expired or malformed — force re-login.
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

  // Enforce role ↔ path ownership for every protected route.
  for (const [pathRole, pathPrefix] of Object.entries(ROLE_PATH_MAP)) {
    if (!pathname.startsWith(pathPrefix)) continue

    // super_admin may visit any dashboard.
    if (role === 'super_admin') break

    if (role !== pathRole) {
      // Redirect the user to their own home rather than showing a 403.
      const url = request.nextUrl.clone()
      url.pathname = getRoleHome(role)
      return NextResponse.redirect(url)
    }
    break
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


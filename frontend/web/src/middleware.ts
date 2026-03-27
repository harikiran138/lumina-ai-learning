import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple JWT decoder for Edge Runtime
function decodeToken(token: string) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (e) {
    return null
  }
}

function normalizeRole(role: string): string {
  if (role === 'admin') return 'super_admin'
  if (role === 'teacher') return 'faculty'
  return role
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  const { pathname } = request.nextUrl

  const isPublic =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname === '/'

  if (!token) {
    if (!isPublic) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('reason', 'unauthorized')
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // Token exists - check role and onboarding
  const payload = decodeToken(token)
  if (!payload) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  const rawRole = payload.role || 'student'
  const role = normalizeRole(rawRole)
  const onboardingCompleted = payload.onboarding_completed || false

  // 1. Force onboarding if not completed
  if (!onboardingCompleted && !pathname.startsWith('/onboarding') && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/onboarding'
    return NextResponse.redirect(url)
  }

  // 2. Prevent accessing onboarding again if completed
  if (onboardingCompleted && pathname.startsWith('/onboarding')) {
    const url = request.nextUrl.clone()
    url.pathname = `/${role === 'super_admin' ? 'admin' : role}/dashboard`
    return NextResponse.redirect(url)
  }

  // 3. Role-based path protection
  const rolePaths = {
    super_admin: '/admin',
    college_admin: '/college',
    hod: '/hod',
    faculty: '/faculty',
    student: '/student',
  }

  // Check if trying to access a restricted path
  for (const [r, path] of Object.entries(rolePaths)) {
    if (pathname.startsWith(path)) {
      if (role !== 'super_admin' && role !== r) {
        // Redirect to their own dashboard
        const url = request.nextUrl.clone()
        url.pathname = `/${role === 'super_admin' ? 'admin' : role}/dashboard`
        return NextResponse.redirect(url)
      }
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
    '/onboarding'
  ],
}

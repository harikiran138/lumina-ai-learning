import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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
  } catch {
    return null
  }
}

function normalizeRole(role: string): string {
  if (role === 'admin') return 'super_admin'
  if (role === 'teacher') return 'faculty'
  return role
}

function getRoleHome(role: string): string {
  const normalized = normalizeRole(role)
  const rolePaths: Record<string, string> = {
    super_admin: '/admin',
    college_admin: '/college',
    hod: '/hod/dashboard',
    faculty: '/faculty/dashboard',
    student: '/student/dashboard',
  }
  return rolePaths[normalized] || '/'
}

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value
  const refreshToken = request.cookies.get('refresh_token')?.value
  const token = accessToken || refreshToken // use whichever is available to decode payload
  
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

  const payload = decodeToken(token)
  if (!payload) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
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

  const rolePaths = {
    super_admin: '/admin',
    college_admin: '/college',
    hod: '/hod',
    faculty: '/faculty',
    student: '/student',
  }

  for (const [expectedRole, path] of Object.entries(rolePaths)) {
    if (pathname.startsWith(path)) {
      if (role !== 'super_admin' && role !== expectedRole) {
        const url = request.nextUrl.clone()
        url.pathname = getRoleHome(role)
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
    '/onboarding',
  ],
}

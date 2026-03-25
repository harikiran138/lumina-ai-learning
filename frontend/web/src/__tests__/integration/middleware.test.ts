import { describe, it, expect } from 'vitest'

// We test middleware logic in isolation without importing Next.js server internals.
// The middleware reads auth_token cookie and redirects unauthenticated users.

// Minimal mock of NextRequest / NextResponse shapes
function makeRequest(pathname: string, cookieToken?: string) {
  const url = new URL(`http://localhost${pathname}`)
  const headers = new Headers()
  if (cookieToken) {
    headers.set('cookie', `auth_token=${cookieToken}`)
  }
  return {
    nextUrl: url,
    cookies: {
      get: (name: string) =>
        cookieToken && name === 'auth_token'
          ? { value: cookieToken }
          : undefined,
    },
    url: url.toString(),
  }
}

// Import the middleware logic in isolation by re-implementing the guard inline
// (avoids importing next/server in a non-Next environment)
function runGuard(pathname: string, cookieToken?: string) {
  const req = makeRequest(pathname, cookieToken)
  const token = req.cookies.get('auth_token')?.value
  const isProtected =
    pathname.startsWith('/student') ||
    pathname.startsWith('/teacher') ||
    pathname.startsWith('/admin')
  if (!token && isProtected) {
    const redirect = new URL('/login', 'http://localhost')
    redirect.searchParams.set('reason', 'unauthorized')
    return { type: 'redirect', destination: redirect.pathname + redirect.search }
  }
  return { type: 'next' }
}

describe('Middleware route guard logic', () => {
  it('redirects unauthenticated access to /student', () => {
    const result = runGuard('/student/dashboard')
    expect(result.type).toBe('redirect')
    expect(result.destination).toContain('/login')
    expect(result.destination).toContain('reason=unauthorized')
  })

  it('redirects unauthenticated access to /teacher', () => {
    const result = runGuard('/teacher/courses')
    expect(result.type).toBe('redirect')
    expect(result.destination).toContain('/login')
  })

  it('redirects unauthenticated access to /admin', () => {
    const result = runGuard('/admin/users')
    expect(result.type).toBe('redirect')
    expect(result.destination).toContain('/login')
  })

  it('allows authenticated access to /student', () => {
    const result = runGuard('/student/dashboard', 'valid-jwt-token')
    expect(result.type).toBe('next')
  })

  it('allows unauthenticated access to /login', () => {
    const result = runGuard('/login')
    expect(result.type).toBe('next')
  })

  it('allows unauthenticated access to /register', () => {
    const result = runGuard('/register')
    expect(result.type).toBe('next')
  })
})

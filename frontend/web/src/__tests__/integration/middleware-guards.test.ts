import { Buffer } from 'node:buffer'
import { describe, expect, it } from 'vitest'

import { middleware } from '@/middleware'

function encodeSegment(value: Record<string, unknown>) {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

function createToken(payload: Record<string, unknown>) {
  return `${encodeSegment({ alg: 'HS256', typ: 'JWT' })}.${encodeSegment(payload)}.signature`
}

function makeRequest(pathname: string, token?: string) {
  const sourceUrl = new URL(`http://localhost${pathname}`)
  return {
    cookies: {
      get: (name: string) => {
        if (name === 'access_token' && token) return { value: token }
        return undefined
      },
    },
    nextUrl: {
      pathname: sourceUrl.pathname,
      searchParams: sourceUrl.searchParams,
      clone: () => new URL(sourceUrl.toString()),
    },
  } as any
}

describe('Middleware session and role guards', () => {
  it('redirects unauthenticated protected requests to /login with unauthorized reason', () => {
    const response = middleware(makeRequest('/student/dashboard'))

    expect(response.headers.get('location')).toContain('/login?reason=unauthorized')
  })

  it('redirects expired token requests to /login with session_expired reason', () => {
    const expiredToken = createToken({
      role: 'student',
      exp: Math.floor(Date.now() / 1000) - 30,
    })

    const response = middleware(makeRequest('/student/dashboard', expiredToken))

    expect(response.headers.get('location')).toContain('/login?reason=session_expired')
  })

  it('redirects incomplete onboarding sessions to /onboarding', () => {
    const token = createToken({
      role: 'student',
      onboardingCompleted: false,
      adaptiveOnboardingCompleted: false,
      exp: Math.floor(Date.now() / 1000) + 3600,
    })

    const response = middleware(makeRequest('/student/dashboard', token))

    expect(response.headers.get('location')).toBe('http://localhost/onboarding')
  })

  it('redirects completed onboarding users away from /onboarding to their role home', () => {
    const token = createToken({
      role: 'student',
      onboardingCompleted: true,
      adaptiveOnboardingCompleted: true,
      exp: Math.floor(Date.now() / 1000) + 3600,
    })

    const response = middleware(makeRequest('/onboarding', token))

    expect(response.headers.get('location')).toBe('http://localhost/student/dashboard')
  })

  it('redirects role-mismatched access to the caller role home', () => {
    const token = createToken({
      role: 'student',
      onboardingCompleted: true,
      adaptiveOnboardingCompleted: true,
      exp: Math.floor(Date.now() / 1000) + 3600,
    })

    const response = middleware(makeRequest('/admin/dashboard', token))

    expect(response.headers.get('location')).toBe('http://localhost/student/dashboard')
  })

  it('allows matching role access to continue without redirect', () => {
    const token = createToken({
      role: 'faculty',
      onboardingCompleted: true,
      adaptiveOnboardingCompleted: true,
      exp: Math.floor(Date.now() / 1000) + 3600,
    })

    const response = middleware(makeRequest('/faculty/dashboard', token))

    expect(response.headers.get('location')).toBeNull()
  })

  it('keeps students inside /onboarding until adaptive calibration is complete', () => {
    const token = createToken({
      role: 'student',
      onboardingCompleted: false,
      adaptiveOnboardingCompleted: false,
      onboardingStep: 5,
      exp: Math.floor(Date.now() / 1000) + 3600,
    })

    const response = middleware(makeRequest('/onboarding', token))

    expect(response.headers.get('location')).toBeNull()
  })
})

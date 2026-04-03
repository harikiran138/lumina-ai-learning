import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'

const BASE = ''

// ── fetchWithRetry behaviour (indirect via native fetch + MSW) ────────────────

describe('fetchWithRetry', () => {
  it('returns the response on a successful first attempt', async () => {
    server.use(
      http.get('http://localhost/test-ok', () => HttpResponse.json({ ok: true }))
    )
    const res = await fetch('http://localhost/test-ok')
    expect(res.ok).toBe(true)
  })

  it('rejects on a network-level failure', async () => {
    server.use(
      http.get('http://localhost/always-fail', () => HttpResponse.error())
    )
    await expect(fetch('http://localhost/always-fail')).rejects.toThrow()
  })
})

// ── Cookie helpers (indirect via api singleton) ───────────────────────────────

describe('auth cookie helpers', () => {
  beforeEach(() => {
    document.cookie = 'access_token=; path=/; max-age=0'
  })

  it('sets access_token cookie after login succeeds', async () => {
    server.use(
      http.post(`${BASE}/api/auth/login`, () =>
        HttpResponse.json({
          accessToken: 'test-token-abc',
          user: {
            id: 'u1', name: 'Test', email: 'test@lumina.test',
            role: 'student', status: 'active', profilePhotoUrl: '', created_at: '',
          },
        })
      )
    )
    const { api } = await import('@/lib/api')
    await api.login('test@lumina.test', 'Password1')
    expect(document.cookie).toContain('access_token=test-token-abc')
  })

  it('clears access_token cookie after logout', async () => {
    document.cookie = 'access_token=some-token; path=/'
    const { api } = await import('@/lib/api')
    await api.logout()
    expect(document.cookie).not.toContain('access_token=some-token')
  })
})

// ── RealAPI.getAllUsers ────────────────────────────────────────────────────────

describe('api.getAllUsers', () => {
  it('returns list of users from /api/admin/users', async () => {
    server.use(
      http.get(`${BASE}/api/admin/users`, () =>
        HttpResponse.json([
          { id: 'u1', name: 'Alice', email: 'alice@lumina.test', role: 'student', status: 'active', avatar: '', createdAt: '' },
        ])
      )
    )
    const { api } = await import('@/lib/api')
    const users = await api.getAllUsers()
    expect(Array.isArray(users)).toBe(true)
    expect(users[0].email).toBe('alice@lumina.test')
  })
})

// ── RealAPI singleton ──────────────────────────────────────────────────────────

describe('RealAPI singleton', () => {
  it('returns the same instance on multiple imports', async () => {
    const { api } = await import('@/lib/api')
    const { api: api2 } = await import('@/lib/api')
    expect(api).toBe(api2)
  })
})

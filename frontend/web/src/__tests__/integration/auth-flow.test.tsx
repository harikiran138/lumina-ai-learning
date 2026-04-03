import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'

// Mock Next.js routing
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() })),
  useSearchParams: vi.fn(() => ({ get: vi.fn(() => null) })),
  usePathname: vi.fn(() => '/login'),
}))
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: any) => <a href={href} {...rest}>{children}</a>,
}))
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
  Toaster: () => null,
}))
vi.mock('next-themes', () => ({
  useTheme: vi.fn(() => ({ theme: 'dark', setTheme: vi.fn() })),
}))

import LoginPage from '@/app/login/page'

const BASE = ''

describe('Auth flow integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.cookie = 'access_token=; path=/; max-age=0'
    sessionStorage.clear()
  })

  it('shows inline validation error when required login fields are missing', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.click(screen.getByRole('button', { name: /^login$/i }))

    await waitFor(() => {
      expect(screen.getByText(/^Enter your email, roll number, or employee ID\.$/)).toBeInTheDocument()
    })
  })

  it('calls the API and persists the user session without exposing the access token', async () => {
    server.use(
      http.post(`${BASE}/api/auth/login`, () =>
        HttpResponse.json({
          accessToken: 'cookie-test-token',
          user: {
            id: 'u1', name: 'Alice', email: 'alice@lumina.test',
            role: 'student', status: 'active', profilePhotoUrl: '', created_at: '',
          },
        })
      )
    )

    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByPlaceholderText(/name@college\.edu or 22NU/i), 'alice@lumina.test')
    await user.type(screen.getByPlaceholderText(/enter your password/i), 'Password1')
    await user.click(screen.getByRole('button', { name: /^login$/i }))

    await waitFor(() => {
      expect(sessionStorage.getItem('lumina_token')).toBeNull()
      expect(sessionStorage.getItem('lumina_user')).toContain('alice@lumina.test')
    }, { timeout: 5000 })
  })

  it('displays an inline error when login returns 401', async () => {
    server.use(
      http.post(`${BASE}/api/auth/login`, () =>
        HttpResponse.json({ detail: 'Invalid credentials' }, { status: 401 })
      )
    )

    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByPlaceholderText(/name@college\.edu or 22NU/i), 'wrong@lumina.test')
    await user.type(screen.getByPlaceholderText(/enter your password/i), 'Password1')
    await user.click(screen.getByRole('button', { name: /^login$/i }))

    await waitFor(() => {
      expect(screen.getByText(/incorrect password for wrong@lumina\.test/i)).toBeInTheDocument()
    }, { timeout: 5000 })
  })
})

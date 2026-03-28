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
import { toast } from 'sonner'

const BASE = 'http://127.0.0.1:8000'

/**
 * The login page renders both sign-in and sign-up tabs simultaneously.
 * Use the autocomplete attribute to scope to the sign-in form's fields,
 * and target the submit button by type to avoid the tab-button ambiguity.
 */
function getSignInEmail() {
  return document.querySelector<HTMLInputElement>('input[autocomplete="email"]')
    || document.querySelector<HTMLInputElement>('input[type="email"]')!
}
function getSignInPassword() {
  return document.querySelector<HTMLInputElement>('input[autocomplete="current-password"]')!
}
function getSubmitButton() {
  return document.querySelector<HTMLButtonElement>('button[type="submit"]')!
}

describe('Auth flow integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.cookie = 'auth_token=; path=/; max-age=0'
  })

  it('shows inline validation error when email is invalid', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(getSignInEmail(), 'not-an-email')
    await user.type(getSignInPassword(), 'Password1')
    await user.click(getSubmitButton())

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument()
    })
  })

  it('calls the API and sets auth_token cookie on successful login', async () => {
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

    await user.type(getSignInEmail(), 'alice@lumina.test')
    await user.type(getSignInPassword(), 'Password1')
    await user.click(getSubmitButton())

    await waitFor(() => {
      expect(document.cookie).toContain('auth_token=cookie-test-token')
    }, { timeout: 5000 })
  })

  it('displays a toast error when login returns 401', async () => {
    server.use(
      http.post(`${BASE}/api/auth/login`, () =>
        HttpResponse.json({ detail: 'Invalid credentials' }, { status: 401 })
      )
    )

    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(getSignInEmail(), 'wrong@lumina.test')
    await user.type(getSignInPassword(), 'Password1')
    await user.click(getSubmitButton())

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled()
    }, { timeout: 5000 })
  })
})

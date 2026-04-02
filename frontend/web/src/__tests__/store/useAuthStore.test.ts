import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from '@/store/useAuthStore'

// Mock the api module so we can control its responses without network calls
vi.mock('@/lib/api', () => ({
  api: {
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}))

const mockUser = {
  id: 'u1',
  email: 'student@lumina.test',
  name: 'Test Student',
  role: 'student' as const,
}

beforeEach(async () => {
  // Reset all mocks and the store state before each test
  vi.clearAllMocks()
  useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false })
})

// ── initial state ─────────────────────────────────────────────────────────────

describe('useAuthStore – initial state', () => {
  it('starts with user as null', () => {
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('starts with isAuthenticated as false', () => {
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('starts with isLoading as false', () => {
    expect(useAuthStore.getState().isLoading).toBe(false)
  })
})

// ── setUser ───────────────────────────────────────────────────────────────────

describe('useAuthStore – setUser', () => {
  it('sets a user and marks isAuthenticated as true', () => {
    useAuthStore.getState().setUser(mockUser)
    const state = useAuthStore.getState()
    expect(state.user).toEqual(mockUser)
    expect(state.isAuthenticated).toBe(true)
  })

  it('clears the user and sets isAuthenticated to false when null is passed', () => {
    useAuthStore.setState({ user: mockUser, isAuthenticated: true })
    useAuthStore.getState().setUser(null)
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('sets isLoading to false after setting a user', () => {
    useAuthStore.setState({ isLoading: true })
    useAuthStore.getState().setUser(mockUser)
    expect(useAuthStore.getState().isLoading).toBe(false)
  })
})

// ── clearAuth ─────────────────────────────────────────────────────────────────

describe('useAuthStore – clearAuth', () => {
  it('resets user to null', () => {
    useAuthStore.setState({ user: mockUser, isAuthenticated: true })
    useAuthStore.getState().clearAuth()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('sets isAuthenticated to false', () => {
    useAuthStore.setState({ user: mockUser, isAuthenticated: true })
    useAuthStore.getState().clearAuth()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('sets isLoading to false', () => {
    useAuthStore.setState({ isLoading: true })
    useAuthStore.getState().clearAuth()
    expect(useAuthStore.getState().isLoading).toBe(false)
  })
})

// ── login ─────────────────────────────────────────────────────────────────────

describe('useAuthStore – login', () => {
  it('calls api.login with the correct credentials', async () => {
    const { api } = await import('@/lib/api')
    vi.mocked(api.login).mockResolvedValueOnce(mockUser as any)

    await useAuthStore.getState().login('student@lumina.test', 'Password1')
    expect(api.login).toHaveBeenCalledWith({
      identifier: 'student@lumina.test',
      password: 'Password1',
      role_hint: undefined,
      college_id: undefined,
    })
  })

  it('sets user and isAuthenticated on success', async () => {
    const { api } = await import('@/lib/api')
    vi.mocked(api.login).mockResolvedValueOnce(mockUser as any)

    await useAuthStore.getState().login('student@lumina.test', 'Password1')
    const state = useAuthStore.getState()
    expect(state.user).toEqual(mockUser)
    expect(state.isAuthenticated).toBe(true)
  })

  it('sets isLoading to false after successful login', async () => {
    const { api } = await import('@/lib/api')
    vi.mocked(api.login).mockResolvedValueOnce(mockUser as any)

    await useAuthStore.getState().login('student@lumina.test', 'Password1')
    expect(useAuthStore.getState().isLoading).toBe(false)
  })

  it('throws and sets isLoading to false on API error', async () => {
    const { api } = await import('@/lib/api')
    vi.mocked(api.login).mockRejectedValueOnce(new Error('Invalid credentials'))

    await expect(
      useAuthStore.getState().login('bad@lumina.test', 'wrong')
    ).rejects.toThrow('Invalid credentials')
    expect(useAuthStore.getState().isLoading).toBe(false)
  })

  it('passes optional roleHint and collegeId to api.login', async () => {
    const { api } = await import('@/lib/api')
    vi.mocked(api.login).mockResolvedValueOnce(mockUser as any)

    await useAuthStore.getState().login('student@lumina.test', 'Password1', 'student', 'college-1')
    expect(api.login).toHaveBeenCalledWith({
      identifier: 'student@lumina.test',
      password: 'Password1',
      role_hint: 'student',
      college_id: 'college-1',
    })
  })
})

// ── logout ────────────────────────────────────────────────────────────────────

describe('useAuthStore – logout', () => {
  it('clears user and isAuthenticated after logout', async () => {
    useAuthStore.setState({ user: mockUser, isAuthenticated: true })
    const { api } = await import('@/lib/api')
    vi.mocked(api.logout).mockResolvedValueOnce(undefined as any)

    await useAuthStore.getState().logout()
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('still clears state even when api.logout throws', async () => {
    useAuthStore.setState({ user: mockUser, isAuthenticated: true })
    const { api } = await import('@/lib/api')
    vi.mocked(api.logout).mockRejectedValueOnce(new Error('network error'))

    await useAuthStore.getState().logout()
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})

// ── refreshUser ───────────────────────────────────────────────────────────────

describe('useAuthStore – refreshUser', () => {
  it('updates user from api.getCurrentUser', async () => {
    const { api } = await import('@/lib/api')
    vi.mocked(api.getCurrentUser).mockResolvedValueOnce(mockUser as any)

    await useAuthStore.getState().refreshUser()
    const state = useAuthStore.getState()
    expect(state.user).toEqual(mockUser)
    expect(state.isAuthenticated).toBe(true)
  })

  it('clears auth when getCurrentUser returns null', async () => {
    useAuthStore.setState({ user: mockUser, isAuthenticated: true })
    const { api } = await import('@/lib/api')
    vi.mocked(api.getCurrentUser).mockResolvedValueOnce(null as any)

    await useAuthStore.getState().refreshUser()
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('clears auth when getCurrentUser throws', async () => {
    useAuthStore.setState({ user: mockUser, isAuthenticated: true })
    const { api } = await import('@/lib/api')
    vi.mocked(api.getCurrentUser).mockRejectedValueOnce(new Error('network'))

    await useAuthStore.getState().refreshUser()
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })
})

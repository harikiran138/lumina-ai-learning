/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from '../lib/api';

// Mock fetch globally
global.fetch = vi.fn();

describe('Auth API in frontend API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('should login successfully, fetch profile, and set session storage', async () => {
    // 1st call: /api/auth/token
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'fake-token-123' })
    });

    // 2nd call: /api/auth/me
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: '1',
        email: 'student@example.com',
        full_name: 'Student Name',
        role: 'student',
        created_at: '2023-01-01T00:00:00Z'
      })
    });

    const user = await api.login('student@example.com', 'password123');

    expect(user).toBeDefined();
    expect(user.role).toBe('student');
    expect(user.email).toBe('student@example.com');
    // Token is saved to session store
    expect(sessionStorage.getItem('lumina_token')).toBe('fake-token-123');
  });

  it('should throw an error on failed login', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: 'Incorrect email or password' })
    });

    await expect(api.login('student@example.com', 'wrongpassword')).rejects.toThrow('Incorrect email or password');
    expect(sessionStorage.getItem('lumina_token')).toBeNull();
  });
  
  it('should clear session correctly on logout', async () => {
     sessionStorage.setItem('lumina_token', 'test-token');
     sessionStorage.setItem('lumina_user', JSON.stringify({ name: 'Test' }));
     
     await api.logout();
     
     expect(sessionStorage.getItem('lumina_token')).toBeNull();
     expect(sessionStorage.getItem('lumina_user')).toBeNull();
  });
});

/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';

const BASE = 'http://127.0.0.1:8000';

describe('Auth API in frontend API Service', () => {
  beforeEach(() => {
    sessionStorage.clear();
    document.cookie = 'auth_token=; path=/; max-age=0';
  });

  it('should login successfully, fetch profile, and set auth cookie', async () => {
    server.use(
      http.post(`${BASE}/api/auth/login`, () =>
        HttpResponse.json({
          accessToken: 'fake-token-123',
          user: {
            id: '1',
            email: 'student@example.com',
            fullName: 'Student Name',
            name: 'Student Name',
            role: 'student',
            status: 'active',
            profilePhotoUrl: '',
            created_at: '2023-01-01T00:00:00Z',
          },
        })
      )
    );

    // Re-import to get the singleton (already instantiated)
    const { api } = await import('../lib/api');
    const user = await api.login('student@example.com', 'password123');

    expect(user).toBeDefined();
    expect(user.role).toBe('student');
    expect(user.email).toBe('student@example.com');
    // Token is now stored in cookie, not sessionStorage
    expect(document.cookie).toContain('auth_token=fake-token-123');
  });

  it('should throw an error on failed login', async () => {
    server.use(
      http.post(`${BASE}/api/auth/login`, () =>
        HttpResponse.json({ detail: 'Incorrect email or password' }, { status: 401 })
      )
    );

    const { api } = await import('../lib/api');
    await expect(api.login('student@example.com', 'wrongpassword'))
      .rejects.toThrow();
  });

  it('should clear session correctly on logout', async () => {
    sessionStorage.setItem('lumina_token', 'test-token');
    sessionStorage.setItem('lumina_user', JSON.stringify({ name: 'Test' }));
    document.cookie = 'auth_token=test-token; path=/';

    const { api } = await import('../lib/api');
    await api.logout();

    expect(sessionStorage.getItem('lumina_token')).toBeNull();
    expect(sessionStorage.getItem('lumina_user')).toBeNull();
  });
});

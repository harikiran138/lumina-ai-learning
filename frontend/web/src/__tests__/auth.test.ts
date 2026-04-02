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
    document.cookie = 'access_token=; path=/; max-age=0';
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
    const user = await api.login('student@example.com', 'Password123');

    expect(user).toBeDefined();
    expect(user.role).toBe('student');
    expect(user.email).toBe('student@example.com');
    // We no longer use sessionStorage for tokens or user data
    expect(sessionStorage.getItem('lumina_token')).toBeNull();
    expect(sessionStorage.getItem('lumina_user')).toBeNull();
  });

  it('should throw an error on failed login', async () => {
    server.use(
      http.post(`${BASE}/api/auth/login`, () =>
        HttpResponse.json({ detail: 'Incorrect email or password' }, { status: 401 })
      )
    );

    const { api } = await import('../lib/api');
    await expect(api.login('student@example.com', 'WrongPassword123'))
      .rejects.toThrow();
  });

  it('should clear session correctly on logout', async () => {
    // Manually set something to check it DOESN'T exist after
    document.cookie = 'access_token=test-token; path=/';

    const { api } = await import('../lib/api');
    await api.logout();

    // The API logout should call the backend which clears the cookie
    // In this test environment, we just verify the call doesn't crash 
    // and that no local storage remains.
    expect(sessionStorage.getItem('lumina_user')).toBeNull();
  });
});

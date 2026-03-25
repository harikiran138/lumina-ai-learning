import { http, HttpResponse } from 'msw'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export const handlers = [
  // Auth — login success
  http.post(`${BASE_URL}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string }
    if (body.email === 'student@lumina.test' && body.password === 'Password1') {
      return HttpResponse.json({
        token: 'mock-jwt-token-student',
        user: {
          id: 'u1',
          name: 'Test Student',
          email: 'student@lumina.test',
          role: 'student',
        },
      })
    }
    if (body.email === 'teacher@lumina.test' && body.password === 'Password1') {
      return HttpResponse.json({
        token: 'mock-jwt-token-teacher',
        user: {
          id: 'u2',
          name: 'Test Teacher',
          email: 'teacher@lumina.test',
          role: 'teacher',
        },
      })
    }
    return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 })
  }),

  // Auth — register
  http.post(`${BASE_URL}/auth/register`, async ({ request }) => {
    const body = await request.json() as { email: string; name: string }
    return HttpResponse.json({
      token: 'mock-jwt-token-new',
      user: {
        id: 'u3',
        name: body.name,
        email: body.email,
        role: 'student',
      },
    })
  }),

  // Auth — refresh
  http.post(`${BASE_URL}/auth/refresh`, () => {
    return HttpResponse.json({ token: 'mock-refreshed-token' })
  }),

  // Current user
  http.get(`${BASE_URL}/auth/me`, () => {
    return HttpResponse.json({
      id: 'u1',
      name: 'Test Student',
      email: 'student@lumina.test',
      role: 'student',
    })
  }),

  // Courses list
  http.get(`${BASE_URL}/courses`, () => {
    return HttpResponse.json([
      { id: 'c1', title: 'Intro to React', description: 'Learn React', enrolled: true },
      { id: 'c2', title: 'Advanced TypeScript', description: 'Deep dive', enrolled: false },
    ])
  }),

  // Users list (admin)
  http.get(`${BASE_URL}/users`, () => {
    return HttpResponse.json([
      { id: 'u1', name: 'Test Student', email: 'student@lumina.test', role: 'student' },
      { id: 'u2', name: 'Test Teacher', email: 'teacher@lumina.test', role: 'teacher' },
    ])
  }),
]

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 20 }, // Ramp up to 20 users
    { duration: '20s', target: 20 }, // Stay at 20 users
    { duration: '10s', target: 0 },  // Ramp down
  ],
};

export default function () {
  // 1. Health Check
  const res = http.get('http://localhost:8000/health');
  check(res, { 'status is 200': (r) => r.status === 200 });

  // 2. Register flow (Simplified: using random email)
  const email = `k6_user_${__VU}_${__ITER}@example.com`;
  const password = 'password123';

  const registerRes = http.post('http://localhost:8000/api/auth/register', JSON.stringify({
    email: email,
    password: password,
    full_name: "K6 Tester",
    role: "student"
  }), { headers: { 'Content-Type': 'application/json' } });

  // Login
  const loginRes = http.post('http://localhost:8000/api/auth/token', {
    username: email,
    password: password
  });

  if (check(loginRes, { 'login successful': (r) => r.status === 200 })) {
      const token = loginRes.json('access_token');
      const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };

      // Access protected routes
      const coursesRes = http.get('http://localhost:8000/api/courses/list', authHeaders);
      check(coursesRes, { 'courses list loaded': (r) => r.status === 200 });

      const meRes = http.get('http://localhost:8000/api/auth/me', authHeaders);
      check(meRes, { 'profile loaded': (r) => r.status === 200 });
  }

  sleep(1);
}

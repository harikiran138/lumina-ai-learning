import axios from 'axios';
import { getAuthToken } from './auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     if (error.response?.status === 401) {
//       // Redirect to login
//       window.location.href = '/auth/login';
//     }
//     return Promise.reject(error);
//   }
// );

export default api;

// Auth API
export const auth = {
  login: async (email: string, password: string) => {
    console.log('Mock login for', email);
    return Promise.resolve({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      user: { email, name: 'Test User' },
    });
  },
  register: async (name: string, email: string, password: string, role = 'student') => {
    const response = await api.post('/api/auth/register', { name, email, password, role });
    return response.data;
  },
  refreshToken: async (refreshToken: string) => {
    const response = await api.post('/api/auth/refresh', { refreshToken });
    return response.data;
  },
};

// Courses API
export const courses = {
  list: async () => {
    console.log('Mock courses.list');
    return Promise.resolve([
      {
        id: '1',
        name: 'Introduction to Mocking',
        description: 'Learn how to mock API calls.',
        teacher_id: '1',
        status: 'published' as 'published' | 'draft' | 'archived',
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Advanced Frontend Techniques',
        description: 'Dive deep into frontend development.',
        teacher_id: '1',
        status: 'draft' as 'published' | 'draft' | 'archived',
        created_at: new Date().toISOString(),
      },
    ]);
  },
  get: async (id: string) => {
    console.log('Mock courses.get for id', id);
    return Promise.resolve({
      id,
      name: 'Introduction to Mocking',
      description: 'Learn how to mock API calls.',
      teacher_id: '1',
      status: 'published' as 'published' | 'draft' | 'archived',
      created_at: new Date().toISOString(),
    });
  },
  create: async (data: { name: string; description?: string }) => {
    const response = await api.post('/api/courses', data);
    return response.data;
  },
  getLessons: async (courseId: string) => {
    console.log('Mock courses.getLessons for courseId', courseId);
    return Promise.resolve([
      { id: 1, title: 'Lesson 1: What is Mocking?', content: '...', order: 1, created_at: new Date().toISOString() },
      { id: 2, title: 'Lesson 2: How to Mock?', content: '...', order: 2, created_at: new Date().toISOString() },
    ]);
  },
};

// Progress API
export const progress = {
  getStudentProgress: async (studentId: string) => {
    const response = await api.get(`/api/progress/${studentId}`);
    return response.data;
  },
  updateProgress: async (studentId: string, data: {
    completed_lessons: number[];
    mastery_score?: number;
  }) => {
    const response = await api.post(`/api/progress/${studentId}`, data);
    return response.data;
  },
};

// Analytics API
export const analytics = {
  getClassAnalytics: async (courseId: string) => {
    const response = await api.get(`/api/class-analytics/${courseId}`);
    return response.data;
  },
  getStudentAnalytics: async (studentId: string) => {
    const response = await api.get(`/api/student-analytics/${studentId}`);
    return response.data;
  },
  getWeaknessDetection: async (courseId: string) => {
    const response = await api.get(`/api/weakness-detection/${courseId}`);
    return response.data;
  },
};

// Attendance API
export const attendance = {
  verifyAttendance: async (studentId: string, imageData: FormData) => {
    const response = await api.post(`/api/verify-attendance?student_id=${studentId}`, imageData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  getAttendanceReports: async (courseId: string) => {
    const response = await api.get(`/api/attendance-reports/${courseId}`);
    return response.data;
  },
};

// Content API
export const content = {
  upload: async (file: File, courseId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (courseId) {
      formData.append('course_id', courseId);
    }
    
    const response = await api.post('/api/upload-content', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
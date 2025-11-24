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
    console.log('Mock login for', email, password);
    return Promise.resolve({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      user: {
        id: '1',
        email,
        name: 'Test User',
        role: 'student',
      },
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
    console.log('Mock progress.getStudentProgress for studentId', studentId);
    return Promise.resolve({
      completed_lessons: [1],
      mastery_score: 85,
    });
  },
  updateProgress: async (studentId: string, data: {
    completed_lessons: number[];
    mastery_score?: number;
  }) => {
    console.log('Mock progress.updateProgress for studentId', studentId, data);
    return Promise.resolve({ success: true });
  },
};

// Analytics API
export const analytics = {
  getClassAnalytics: async (courseId: string) => {
    console.log('Mock analytics.getClassAnalytics for courseId', courseId);
    return Promise.resolve({
      average_score: 85,
      attendance_rate: 92,
      total_students: 25,
      recent_activities: [
        { id: '1', description: 'Quiz 1 completed', date: new Date().toISOString() },
        { id: '2', description: 'Lesson 3 started', date: new Date().toISOString() },
      ],
    });
  },
  getStudentAnalytics: async (studentId: string) => {
    console.log('Mock analytics.getStudentAnalytics for studentId', studentId);
    return Promise.resolve({
      current_streak: 5,
      average_score: 88,
      completed_courses: 2,
      recent_activity: [
        { id: '1', description: 'Completed Lesson 1', date: new Date().toISOString() },
        { id: '2', description: 'Started Course 2', date: new Date().toISOString() },
      ],
    });
  },
  getWeaknessDetection: async (courseId: string) => {
    console.log('Mock analytics.getWeaknessDetection for courseId', courseId);
    return Promise.resolve({
      weak_topics: ['State Management', 'React Hooks'],
      suggested_resources: [
        { title: 'React Hooks Guide', url: '#' },
        { title: 'Zustand Documentation', url: '#' },
      ],
    });
  },
};

// Attendance API
export const attendance = {
  verifyAttendance: async (studentId: string, imageData: FormData) => {
    console.log('Mock attendance.verifyAttendance for studentId', studentId);
    return Promise.resolve({ verified: true, confidence: 0.95 });
  },
  getAttendanceReports: async (courseId: string) => {
    console.log('Mock attendance.getAttendanceReports for courseId', courseId);
    return Promise.resolve([
      { student_id: '1', date: new Date().toISOString(), status: 'present' },
    ]);
  },
};

// Content API
export const content = {
  upload: async (file: File, courseId?: string) => {
    console.log('Mock content.upload', file.name, courseId);
    return Promise.resolve({ url: 'https://example.com/mock-file.pdf' });
  },
};
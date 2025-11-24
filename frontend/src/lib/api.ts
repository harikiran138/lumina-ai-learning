// Mock API implementation
// import axios from 'axios'; // Removed axios
import { getAuthToken } from './auth';

// Mock data
const MOCK_USER = {
  id: '1',
  name: 'Test Student',
  email: 'student@lumina.ai',
  role: 'student',
};

const MOCK_COURSES = [
  { id: '1', name: 'Introduction to AI', description: 'Learn the basics of AI', thumbnail: '/course1.jpg' },
  { id: '2', name: 'Advanced Machine Learning', description: 'Deep dive into ML', thumbnail: '/course2.jpg' },
];

const MOCK_LESSONS = [
  { id: '101', title: 'What is AI?', content: 'Intro content...' },
  { id: '102', title: 'Neural Networks', content: 'NN content...' },
];

// Mock delay helper
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock API object (kept for compatibility if used elsewhere, though we are replacing exports)
const api = {
  interceptors: {
    request: { use: () => { } },
    response: { use: () => { } }
  },
  get: async () => ({ data: {} }),
  post: async () => ({ data: {} }),
};

export default api;

// Auth API
export const auth = {
  login: async (email: string, password: string) => {
    await delay(500);
    if (email === 'student@lumina.ai' && password === 'password') {
      return { token: 'mock-jwt-token', user: MOCK_USER };
    }
    // Allow any login for testing convenience if specific creds aren't needed
    return { token: 'mock-jwt-token', user: { ...MOCK_USER, email } };
  },
  register: async (name: string, email: string, password: string, role = 'student') => {
    await delay(500);
    return { token: 'mock-jwt-token', user: { id: '2', name, email, role } };
  },
  refreshToken: async (refreshToken: string) => {
    await delay(200);
    return { token: 'new-mock-jwt-token' };
  },
};

// Courses API
export const courses = {
  list: async () => {
    await delay(500);
    return MOCK_COURSES;
  },
  get: async (id: string) => {
    await delay(300);
    return MOCK_COURSES.find(c => c.id === id) || MOCK_COURSES[0];
  },
  create: async (data: { name: string; description?: string }) => {
    await delay(500);
    return { id: '3', ...data };
  },
  getLessons: async (courseId: string) => {
    await delay(400);
    return MOCK_LESSONS;
  },
};

// Progress API
export const progress = {
  getStudentProgress: async (studentId: string) => {
    await delay(300);
    return {
      completed_lessons: ['101'],
      mastery_score: 85,
      streak: 5,
      total_lessons: 10
    };
  },
  updateProgress: async (studentId: string, data: {
    completed_lessons: number[];
    mastery_score?: number;
  }) => {
    await delay(300);
    return { success: true, ...data };
  },
};

// Analytics API
export const analytics = {
  getClassAnalytics: async (courseId: string) => {
    await delay(400);
    return {
      average_score: 78,
      attendance_rate: 92,
      active_students: 25
    };
  },
  getStudentAnalytics: async (studentId: string) => {
    await delay(400);
    return {
      learning_pace: 'Fast',
      weak_areas: ['Calculus', 'Probability'],
      strong_areas: ['Python', 'Logic']
    };
  },
  getWeaknessDetection: async (courseId: string) => {
    await delay(400);
    return [
      { topic: 'Gradient Descent', struggle_rate: 0.4 },
      { topic: 'Backpropagation', struggle_rate: 0.35 }
    ];
  },
};

// Attendance API
export const attendance = {
  verifyAttendance: async (studentId: string, imageData: FormData) => {
    await delay(1000);
    return { verified: true, confidence: 0.95, timestamp: new Date().toISOString() };
  },
  getAttendanceReports: async (courseId: string) => {
    await delay(400);
    return [
      { date: '2023-10-01', present: 20, absent: 2 },
      { date: '2023-10-02', present: 21, absent: 1 },
    ];
  },
};

// Content API
export const content = {
  upload: async (file: File, courseId?: string) => {
    await delay(1000);
    return { url: '/mock-content-url.pdf', filename: file.name };
  },
};
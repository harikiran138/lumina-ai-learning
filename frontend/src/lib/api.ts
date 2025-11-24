
// Mock API for frontend-only mode
const mockApi = {
  post: async (url: string, data?: any) => {
    console.log(`Mock POST to ${url}`, data);
    await new Promise(resolve => setTimeout(resolve, 500));
    if (url === '/api/auth/login') {
      return { data: { token: 'mock-token', refreshToken: 'mock-refresh-token' } };
    }
    if (url === '/api/auth/register') {
      return { data: { message: 'Registration successful' } };
    }
    return { data: {} };
  },
  get: async (url: string) => {
    console.log(`Mock GET from ${url}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    if (url === '/api/courses') {
      return {
        data: [
          {
            id: '1',
            name: 'Introduction to Mocking',
            description: 'Learn how to mock APIs in your frontend applications.',
            teacher_id: '1',
            status: 'published' as const,
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Advanced Frontend Techniques',
            description: 'Take your frontend skills to the next level.',
            teacher_id: '1',
            status: 'published' as const,
            created_at: new Date().toISOString()
          },
        ],
      };
    }
    if (url.startsWith('/api/courses/') && url.includes('/lessons')) {
      return {
        data: [
          { id: 1, title: "Introduction to Mocking", content: "Mock content", order: 1, created_at: new Date().toISOString() },
          { id: 2, title: "Advanced Mocking Techniques", content: "Advanced content", order: 2, created_at: new Date().toISOString() }
        ],
      };
    }
    if (url.startsWith('/api/courses/')) {
      const courseId = url.split('/')[3];
      return {
        data: {
          id: courseId,
          name: 'Introduction to Mocking',
          description: 'Learn how to mock APIs in your frontend applications.',
          teacher_id: '1',
          status: 'published' as const,
          created_at: new Date().toISOString()
        },
      };
    }
    return { data: {} };
  },
};

export default {
  create: () => mockApi
};

// Auth API
export const auth = {
  login: async (email: string, password: string) => {
    const response = await mockApi.post('/api/auth/login', { email, password });
    return response.data;
  },
  register: async (name: string, email: string, password: string, role = 'student') => {
    const response = await mockApi.post('/api/auth/register', { name, email, password, role });
    return response.data;
  },
  refreshToken: async (refreshToken: string) => {
    const response = await mockApi.post('/api/auth/refresh', { refreshToken });
    return response.data;
  },
};

// Courses API
export const courses = {
  list: async (): Promise<Array<{
    id: string;
    name: string;
    description: string;
    teacher_id: string;
    status: 'draft' | 'published' | 'archived';
    created_at: string;
  }>> => {
    const response = await mockApi.get('/api/courses');
    return response.data as Array<{
      id: string;
      name: string;
      description: string;
      teacher_id: string;
      status: 'draft' | 'published' | 'archived';
      created_at: string;
    }>;
  },
  get: async (id: string): Promise<{
    id: string;
    name: string;
    description: string;
    teacher_id: string;
    status: 'draft' | 'published' | 'archived';
    created_at: string;
  }> => {
    const response = await mockApi.get(`/api/courses/${id}`);
    return response.data as {
      id: string;
      name: string;
      description: string;
      teacher_id: string;
      status: 'draft' | 'published' | 'archived';
      created_at: string;
    };
  },
  create: async (data: { name: string; description?: string }) => {
    const response = await mockApi.post('/api/courses', data);
    return response.data;
  },
  getLessons: async (courseId: string): Promise<Array<{
    id: number;
    title: string;
    content: string;
    order: number;
    created_at: string;
  }>> => {
    const response = await mockApi.get(`/api/courses/${courseId}/lessons`);
    return response.data as Array<{
      id: number;
      title: string;
      content: string;
      order: number;
      created_at: string;
    }>;
  },
};

// Progress API
export const progress = {
  getStudentProgress: async (studentId: string) => {
    const response = await mockApi.get(`/api/progress/${studentId}`);
    return response.data;
  },
  updateProgress: async (studentId: string, data: {
    completed_lessons: number[];
    mastery_score?: number;
  }) => {
    const response = await mockApi.post(`/api/progress/${studentId}`, data);
    return response.data;
  },
};

// Analytics API
export const analytics = {
  getClassAnalytics: async (courseId: string) => {
    const response = await mockApi.get(`/api/class-analytics/${courseId}`);
    return response.data;
  },
  getStudentAnalytics: async (studentId: string) => {
    const response = await mockApi.get(`/api/student-analytics/${studentId}`);
    return response.data;
  },
  getWeaknessDetection: async (courseId: string) => {
    const response = await mockApi.get(`/api/weakness-detection/${courseId}`);
    return response.data;
  },
};

// Attendance API
export const attendance = {
  verifyAttendance: async (studentId: string, imageData: FormData) => {
    const response = await mockApi.post(`/api/verify-attendance?student_id=${studentId}`, imageData);
    return response.data;
  },
  getAttendanceReports: async (courseId: string) => {
    const response = await mockApi.get(`/api/attendance-reports/${courseId}`);
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

    const response = await mockApi.post('/api/upload-content', formData);
    return response.data;
  },
};

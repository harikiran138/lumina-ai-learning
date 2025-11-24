
// Mock API for frontend-only mode
const mockApi = {
  post: async (url: string, data?: unknown) => {
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

const api = {
  create: () => mockApi
};

export default api;

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
    console.log(`Mock progress for student ${studentId}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      completed_lessons: [1, 2, 3],
      mastery_score: 85,
      total_lessons: 10,
      progress_percentage: 30,
    };
  },
  updateProgress: async (studentId: string, data: {
    completed_lessons: number[];
    mastery_score?: number;
  }) => {
    console.log(`Mock update progress for student ${studentId}`, data);
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      message: 'Progress updated successfully',
    };
  },
};

// Analytics API
export const analytics = {
  getClassAnalytics: async (courseId: string) => {
    console.log(`Mock analytics for course ${courseId}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      current_streak: 7,
      average_score: 85,
      completed_courses: 3,
      recent_activity: [
        {
          id: 1,
          description: 'Completed lesson: Introduction to Mocking',
          date: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 2,
          description: 'Started course: Advanced Frontend Techniques',
          date: new Date(Date.now() - 172800000).toISOString(),
        },
        {
          id: 3,
          description: 'Achieved 90% on quiz',
          date: new Date(Date.now() - 259200000).toISOString(),
        },
      ],
    };
  },
  getStudentAnalytics: async (studentId: string) => {
    console.log(`Mock analytics for student ${studentId}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      current_streak: 7,
      average_score: 85,
      completed_courses: 3,
      recent_activity: [
        {
          id: 1,
          description: 'Completed lesson: Introduction to Mocking',
          date: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 2,
          description: 'Started course: Advanced Frontend Techniques',
          date: new Date(Date.now() - 172800000).toISOString(),
        },
        {
          id: 3,
          description: 'Achieved 90% on quiz',
          date: new Date(Date.now() - 259200000).toISOString(),
        },
      ],
    };
  },
  getWeaknessDetection: async (courseId: string) => {
    console.log(`Mock weakness detection for course ${courseId}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      weaknesses: [
        { topic: 'Arrays', confidence: 0.6 },
        { topic: 'Loops', confidence: 0.7 },
      ],
    };
  },
};

// Attendance API
export const attendance = {
  verifyAttendance: async (studentId: string, imageData: FormData) => {
    console.log(`Mock verify attendance for student ${studentId}`, imageData);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      verified: true,
      confidence: 0.95,
      message: 'Attendance verified successfully',
    };
  },
  getAttendanceReports: async (courseId: string) => {
    console.log(`Mock attendance reports for course ${courseId}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      total_sessions: 20,
      attended_sessions: 18,
      attendance_percentage: 90,
      recent_attendance: [
        { date: new Date(Date.now() - 86400000).toISOString(), status: 'present' },
        { date: new Date(Date.now() - 172800000).toISOString(), status: 'present' },
        { date: new Date(Date.now() - 259200000).toISOString(), status: 'absent' },
      ],
    };
  },
};

// Content API
export const content = {
  upload: async (file: File, courseId?: string) => {
    console.log(`Mock upload file: ${file.name}`, courseId);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      success: true,
      file_id: `mock-file-${Date.now()}`,
      file_name: file.name,
      file_size: file.size,
      message: 'File uploaded successfully',
    };
  },
};

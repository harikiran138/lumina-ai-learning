import { http, HttpResponse } from 'msw'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

type JsonObject = Record<string, unknown>

async function readJsonObject(request: Request): Promise<JsonObject> {
  const body = await request.json()
  return body && typeof body === 'object' ? (body as JsonObject) : {}
}

export const handlers = [
  // ==================== AUTH ENDPOINTS ====================
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
    if (body.email === 'admin@lumina.test' && body.password === 'Password1') {
      return HttpResponse.json({
        token: 'mock-jwt-token-admin',
        user: {
          id: 'u3',
          name: 'Test Admin',
          email: 'admin@lumina.test',
          role: 'admin',
        },
      })
    }
    return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 })
  }),

  // Auth — register
  http.post(`${BASE_URL}/auth/register`, async ({ request }) => {
    const body = await request.json() as { email: string; name: string; role?: string }
    return HttpResponse.json({
      token: 'mock-jwt-token-new',
      user: {
        id: 'u-new',
        name: body.name,
        email: body.email,
        role: body.role || 'student',
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

  // Logout
  http.post(`${BASE_URL}/auth/logout`, () => {
    return HttpResponse.json({ success: true })
  }),

  // ==================== STUDENT ENDPOINTS ====================
  // Student dashboard
  http.get(`${BASE_URL}/student/dashboard`, () => {
    return HttpResponse.json({
      stats: {
        assignments: 5,
        streak: 12,
        score: 85,
      },
      recentActivity: [
        { id: 'a1', title: 'Submitted React Assignment', date: '2026-03-24' },
        { id: 'a2', title: 'Completed TypeScript Quiz', date: '2026-03-23' },
      ],
      quickActions: [
        { label: 'Start Assignment', href: '/student/assignments' },
        { label: 'Ask AI Tutor', href: '/student/ai_tutor' },
      ],
    })
  }),

  // Student assignments
  http.get(`${BASE_URL}/student/assignments`, () => {
    return HttpResponse.json([
      {
        id: 'asm1',
        title: 'React Hooks Practice',
        course_id: 'c1',
        description: 'Complete exercises on useState and useEffect',
        due_date: '2026-03-28',
        status: 'pending',
        created_by: 'teacher1',
      },
      {
        id: 'asm2',
        title: 'TypeScript Basics',
        course_id: 'c2',
        description: 'Learn basic types and interfaces',
        due_date: '2026-04-01',
        status: 'pending',
        created_by: 'teacher2',
      },
      {
        id: 'asm3',
        title: 'CSS Fundamentals',
        course_id: 'c3',
        description: 'Master flexbox and grid layouts',
        due_date: '2026-03-20',
        status: 'completed',
        created_by: 'teacher1',
        user_submission: {
          submitted_at: '2026-03-19',
          grade: 92,
          feedback: 'Great work!',
        },
      },
    ])
  }),

  // Submit assignment
  http.post(`${BASE_URL}/student/assignments/:id/submit`, async ({ request, params }) => {
    return HttpResponse.json({
      id: params.id,
      status: 'success',
      message: 'Assignment submitted successfully',
    })
  }),

  // Student progress
  http.get(`${BASE_URL}/student/progress`, () => {
    return HttpResponse.json({
      stats: {
        currentStreak: 12,
        totalXP: 450,
        avgAccuracy: 87,
        learningTime: '8h 30m',
      },
      weeklyActivityDetail: [
        { label: 'Mon', minutes: 45, interactions: 12 },
        { label: 'Tue', minutes: 60, interactions: 18 },
        { label: 'Wed', minutes: 30, interactions: 8 },
        { label: 'Thu', minutes: 90, interactions: 25 },
        { label: 'Fri', minutes: 45, interactions: 15 },
        { label: 'Sat', minutes: 20, interactions: 5 },
        { label: 'Sun', minutes: 0, interactions: 0 },
      ],
      recentCourses: [
        { id: 'c1', courseName: 'React Fundamentals', progress: 75, mastery: 82, streak: 10 },
        { id: 'c2', courseName: 'TypeScript Basics', progress: 45, mastery: 68, streak: 5 },
      ],
      achievements: [
        { title: 'First Commit', desc: 'Submitted your first assignment', unlocked: true },
        { title: 'Week Streak', desc: '7 day learning streak', unlocked: true },
        { title: 'Perfect Score', desc: '100% on an assessment', unlocked: false },
      ],
      weakTopics: [
        { topic: 'useEffect', score: 55, confidence: 60, status: 'developing' },
        { topic: 'TypeScript Generics', score: 42, confidence: 45, status: 'urgent' },
      ],
      dueAssignments: [
        { id: 'asm1', title: 'React Hooks Practice', courseName: 'React Fundamentals', status: 'pending', daysRemaining: 3 },
      ],
      masteryBreakdown: [
        { topic: 'React', score: 82, confidence: 85, status: 'proficient' },
        { topic: 'TypeScript', score: 68, confidence: 70, status: 'developing' },
        { topic: 'CSS', score: 90, confidence: 92, status: 'proficient' },
      ],
      learningSignals: {
        behaviorLabel: 'engaged',
        cognitiveLoad: 45,
        engagementScore: 82,
        riskLevel: 'low',
        riskScore: 15,
      },
      nextAction: {
        title: 'Complete React Hooks',
        description: 'You have 3 pending exercises',
        ctaLabel: 'Continue Learning',
        href: '/student/assignments',
      },
      coachInsight: {
        title: 'Focus on useEffect',
        summary: 'Your useEffect understanding needs reinforcement. Try the interactive tutorial.',
        actionLabel: 'Start Tutorial',
        href: '/student/ai_tutor',
        priority: 'medium',
      },
    })
  }),

  // AI Tutor chat
  http.post(`${BASE_URL}/ai/chat`, async ({ request }) => {
    const body = await request.json() as { message: string }
    return HttpResponse.json({
      response: `Great question about "${body.message}"! Let me explain this concept...`,
      personalization: {
        cognitiveLoad: 40,
        mastery: { Analysis: 0.85, Synthesis: 0.78, Creativity: 0.72 },
      },
    })
  }),

  // Student profile
  http.get(`${BASE_URL}/student/profile`, () => {
    return HttpResponse.json({
      id: 'u1',
      name: 'Test Student',
      email: 'student@lumina.test',
      role: 'student',
      avatar: 'https://ui-avatars.com/api/?name=Test+Student',
    })
  }),

  http.put(`${BASE_URL}/student/profile`, async ({ request }) => {
    const body = await readJsonObject(request)
    return HttpResponse.json({
      ...body,
      id: 'u1',
    })
  }),

  // ==================== TEACHER ENDPOINTS ====================
  // Teacher dashboard
  http.get(`${BASE_URL}/teacher/dashboard`, () => {
    return HttpResponse.json({
      summary: {
        totalStudents: 24,
        activeCourses: 3,
        avgMastery: 78,
        pendingGrading: 7,
        atRiskStudents: 2,
        upcomingDeadlines: 4,
      },
      courses: [
        {
          id: 'tc1',
          title: 'Algebra I',
          code: 'MATH101',
          status: 'published',
          studentCount: 24,
          assignmentCount: 8,
          pendingGrading: 5,
          averageProgress: 72,
          averageMastery: 78,
          moduleCount: 6,
          nextDeadline: '2026-03-28',
          lastActivity: '2026-03-25T10:30:00Z',
          image: '/course-algebra.jpg',
          href: '/teacher/courses/tc1',
          attention: 'healthy',
        },
        {
          id: 'tc2',
          title: 'Geometry',
          code: 'MATH102',
          status: 'draft',
          studentCount: 18,
          assignmentCount: 5,
          pendingGrading: 2,
          averageProgress: 45,
          averageMastery: 65,
          moduleCount: 4,
          nextDeadline: '2026-04-01',
          lastActivity: '2026-03-24T14:00:00Z',
          image: '/course-geometry.jpg',
          href: '/teacher/courses/tc2',
          attention: 'watch',
        },
      ],
      recentAssignments: [
        {
          id: 'ta1',
          title: 'Algebra HW 1',
          courseName: 'Algebra I',
          description: 'Linear equations practice',
          dueDate: '2026-03-28',
          daysUntilDue: 3,
          submissionCount: 12,
          pendingGrading: 5,
          status: 'scheduled',
          href: '/teacher/assignments/ta1',
        },
      ],
      studentMomentum: [
        {
          id: 's1',
          name: 'Alice Chen',
          email: 'alice@student.lumina',
          avatar: 'https://ui-avatars.com/api/?name=Alice+Chen',
          status: 'on-track',
          courseCount: 3,
          courses: ['Algebra I', 'Geometry', 'Physics'],
          averageProgress: 85,
          averageMastery: 88,
          lastActive: '2026-03-25T09:00:00Z',
          focusArea: 'Algebra',
          href: '/teacher/students/s1',
        },
      ],
      priorityItems: [
        { id: 'p1', kind: 'grading', tone: 'urgent', title: '5 submissions pending', detail: 'Algebra HW 1 needs review', href: '/teacher/grading' },
      ],
      weeklySnapshot: {
        publishedCourses: 2,
        draftCourses: 1,
        assignmentsCreated: 3,
        submissionsReceived: 18,
      },
      interventionQueue: [],
      conceptHeatmap: [],
      supportClusters: [],
    })
  }),

  // Teacher students list
  http.get(`${BASE_URL}/teacher/students`, () => {
    return HttpResponse.json([
      {
        id: 's1',
        name: 'Alice Chen',
        email: 'alice@student.lumina',
        mastery: 88,
        engagement: 95,
        risk: 'low',
        lastActive: '2 mins ago',
        streak: 12,
      },
      {
        id: 's2',
        name: 'David Kim',
        email: 'david@student.lumina',
        mastery: 42,
        engagement: 65,
        risk: 'critical',
        lastActive: '5 hours ago',
        streak: 0,
      },
      {
        id: 's3',
        name: 'Charlie Day',
        email: 'charlie@student.lumina',
        mastery: 65,
        engagement: 82,
        risk: 'medium',
        lastActive: '1 day ago',
        streak: 4,
      },
    ])
  }),

  // Teacher student detail
  http.get(`${BASE_URL}/teacher/students/:id`, ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'Alice Chen',
      email: 'alice@student.lumina',
      mastery: 88,
      engagement: 95,
      risk: 'low',
      lastActive: '2 mins ago',
      streak: 12,
      assignmentCompletionRate: 92,
      courses: ['Algebra I', 'Geometry'],
    })
  }),

  // Teacher courses
  http.get(`${BASE_URL}/teacher/courses`, () => {
    return HttpResponse.json([
      { id: 'tc1', title: 'Algebra I', studentCount: 24, status: 'published' },
      { id: 'tc2', title: 'Geometry', studentCount: 18, status: 'draft' },
    ])
  }),

  http.post(`${BASE_URL}/teacher/courses`, async ({ request }) => {
    const body = await readJsonObject(request)
    const title = typeof body.title === 'string' ? body.title : ''
    if (!title) {
      return HttpResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    return HttpResponse.json({ id: 'tc-new', title, studentCount: 0, status: 'draft' }, { status: 201 })
  }),

  http.put(`${BASE_URL}/teacher/courses/:id`, async ({ request }) => {
    const body = await readJsonObject(request)
    return HttpResponse.json({ success: true, ...body })
  }),

  http.delete(`${BASE_URL}/teacher/courses/:id`, () => {
    return HttpResponse.json({ success: true })
  }),

  // Teacher assignments
  http.get(`${BASE_URL}/teacher/assignments`, () => {
    return HttpResponse.json([
      { id: 'ta1', title: 'Algebra HW 1', courseId: 'tc1', dueDate: '2026-03-28', status: 'published', submissionCount: 12 },
      { id: 'ta2', title: 'Geometry Quiz', courseId: 'tc2', dueDate: '2026-04-01', status: 'draft', submissionCount: 0 },
    ])
  }),

  http.post(`${BASE_URL}/teacher/assignments`, async ({ request }) => {
    const body = await readJsonObject(request)
    const title = typeof body.title === 'string' ? body.title : ''
    if (!title) {
      return HttpResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    return HttpResponse.json({ id: 'ta-new', ...body }, { status: 201 })
  }),

  // Teacher submissions
  http.get(`${BASE_URL}/teacher/submissions`, () => {
    return HttpResponse.json([
      { id: 'sub1', studentName: 'Alice Kumar', assignmentTitle: 'Algebra HW 1', submittedAt: '2026-03-24', status: 'unreviewed' },
      { id: 'sub2', studentName: 'Bob Patel', assignmentTitle: 'Algebra HW 1', submittedAt: '2026-03-23', status: 'reviewed', grade: 'A' },
    ])
  }),

  http.put(`${BASE_URL}/teacher/submissions/:id`, async ({ request }) => {
    const body = await readJsonObject(request)
    return HttpResponse.json({ success: true, ...body })
  }),

  // ==================== ADMIN ENDPOINTS ====================
  // Admin dashboard
  http.get(`${BASE_URL}/admin/dashboard`, () => {
    return HttpResponse.json({
      summary: {
        totalUsers: 150,
        totalStudents: 120,
        totalTeachers: 28,
        totalCourses: 45,
        activeCourses: 38,
        draftCourses: 7,
        totalInstitutions: 5,
        totalConnections: 12,
        systemHealthScore: 98,
        systemHealthLabel: '98%',
        securityAlerts: 0,
        attentionRequired: 2,
      },
      attentionQueue: [],
      systemServices: [],
      institutions: [],
      connections: [],
      recentUsers: [],
      activityFeed: [],
    })
  }),

  // Admin users
  http.get(`${BASE_URL}/admin/users`, () => {
    return HttpResponse.json([
      { id: 'au1', name: 'Test Student', email: 'student@lumina.test', role: 'student', status: 'active', avatar: 'https://ui-avatars.com/api/?name=Test+Student' },
      { id: 'au2', name: 'Test Teacher', email: 'teacher@lumina.test', role: 'teacher', status: 'active', avatar: 'https://ui-avatars.com/api/?name=Test+Teacher' },
      { id: 'au3', name: 'Test Admin', email: 'admin@lumina.test', role: 'admin', status: 'active', avatar: 'https://ui-avatars.com/api/?name=Test+Admin' },
    ])
  }),

  http.post(`${BASE_URL}/admin/users`, async ({ request }) => {
    const body = await readJsonObject(request)
    const name = typeof body.name === 'string' ? body.name : ''
    const email = typeof body.email === 'string' ? body.email : ''
    if (!name || !email) {
      return HttpResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }
    return HttpResponse.json({ id: 'au-new', ...body }, { status: 201 })
  }),

  http.put(`${BASE_URL}/admin/users/:id`, async ({ request }) => {
    const body = await readJsonObject(request)
    return HttpResponse.json({ success: true, ...body })
  }),

  http.delete(`${BASE_URL}/admin/users/:id`, () => {
    return HttpResponse.json({ success: true })
  }),

  // ==================== COURSES ENDPOINTS ====================
  http.get(`${BASE_URL}/courses`, () => {
    return HttpResponse.json([
      { id: 'c1', title: 'Intro to React', description: 'Learn React', enrolled: true },
      { id: 'c2', title: 'Advanced TypeScript', description: 'Deep dive', enrolled: false },
    ])
  }),

  // ==================== USERS ENDPOINTS ====================
  http.get(`${BASE_URL}/users`, () => {
    return HttpResponse.json([
      { id: 'u1', name: 'Test Student', email: 'student@lumina.test', role: 'student' },
      { id: 'u2', name: 'Test Teacher', email: 'teacher@lumina.test', role: 'teacher' },
    ])
  }),

  // Create user (for admin)
  http.post(`${BASE_URL}/users`, async ({ request }) => {
    const body = await readJsonObject(request)
    return HttpResponse.json({ id: 'u-new', ...body }, { status: 201 })
  }),
]

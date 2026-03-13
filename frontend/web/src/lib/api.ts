// Mock Data API - Optimized for Simple Frontend Demo

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "teacher" | "student";
  status: "active" | "suspended" | "inactive";
  avatar: string;
  createdAt: string;
  preferences?: any;
  password?: string; // Optional for internal use
  bio?: string;
  skills?: string[];
  location?: string;
}

// Authentication is now handled directly via FastAPI endpoints in this class

class RealAPI {
  private static instance: RealAPI;
  private currentUser: User | null = null;
  private token: string | null = null;

  private constructor() {
    if (typeof window !== "undefined") {
      this.token = sessionStorage.getItem("lumina_token");
      const storedUser = sessionStorage.getItem("lumina_user");
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
      }
    }
  }

  public static getInstance(): RealAPI {
    if (!RealAPI.instance) {
      RealAPI.instance = new RealAPI();
    }
    return RealAPI.instance;
  }

  private getApiBase(): string {
    return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  }

  private async fetchAuthorized(
    path: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const headers = new Headers(options.headers || {});
    if (this.token) {
      headers.set("Authorization", `Bearer ${this.token}`);
    }

    // Default Content-Type to JSON if body is present and not FormData
    if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${this.getApiBase()}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Handle unauthorized (maybe logout)
      console.warn("Unauthorized request to backend");
    }

    return response;
  }

  private getChatStorageKey(): string {
    return `lumina_chat_history_${this.currentUser?.id || "guest"}`;
  }

  private readChatHistory(): any[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(this.getChatStorageKey());
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeChatHistory(messages: any[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      this.getChatStorageKey(),
      JSON.stringify(messages.slice(-400)),
    );
  }

  async login(email: string, password?: string): Promise<User> {
    if (!password) {
      throw new Error("Password is required for login.");
    }

    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const res = await fetch(`${this.getApiBase()}/api/auth/token`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Authentication failed");
    }

    const tokenData = await res.json();
    this.token = tokenData.access_token;

    if (typeof window !== "undefined") {
      sessionStorage.setItem("lumina_token", this.token!);
    }

    // Fetch user details
    const userRes = await this.fetchAuthorized("/api/auth/me");
    if (!userRes.ok) throw new Error("Failed to fetch user profile");

    const userData = await userRes.json();
    const displayName = userData.name || userData.full_name || email.split("@")[0];
    this.currentUser = {
      id: userData.id,
      email: userData.email,
      name: displayName,
      role: userData.role,
      avatar:
        userData.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`,
      status: "active",
      createdAt: userData.created_at,
      preferences: userData.preferences || {},
    };

    if (typeof window !== "undefined") {
      sessionStorage.setItem("lumina_user", JSON.stringify(this.currentUser));
    }

    return this.currentUser;
  }

  async getCurrentUser(): Promise<User | null> {
    return this.currentUser;
  }

  async createUser(
    userData: Partial<User> & { password?: string },
  ): Promise<any> {
    if (!userData.password) {
      throw new Error("Password is required for signup.");
    }

    const res = await fetch(`${this.getApiBase()}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        full_name: userData.name,
        role: userData.role || "student",
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Registration failed");
    }

    // Auto-login
    return this.login(userData.email!, userData.password);
  }

  // Dashboard Data - Consolidated through Backend
  async getDashboardData(userRole: string): Promise<any> {
    if (!this.currentUser) return {};

    if (userRole === "student") {
      const res = await this.fetchAuthorized("/api/student/dashboard");
      if (!res.ok) return {};
      return await res.json();
    }

    if (userRole === "teacher") {
      const res = await this.fetchAuthorized("/api/courses/teacher/dashboard");
      if (!res.ok) return {};
      return await res.json();
    }

    if (userRole === "admin") {
      // Admin dashboard might still be in progress on backend, but let's try
      const res = await this.fetchAuthorized("/api/admin/dashboard");
      if (!res.ok) return {};
      return await res.json();
    }

    return {};
  }

  async getStudentProfile(): Promise<any> {
    const res = await this.fetchAuthorized("/api/student/profile");
    if (!res.ok) return null;
    return await res.json();
  }

  async getStudentProgress(): Promise<any> {
    const [dashboardRes, analyticsRes, profileRes] = await Promise.all([
      this.fetchAuthorized("/api/student/dashboard"),
      this.fetchAuthorized("/api/student/profile/analytics"),
      this.fetchAuthorized("/api/student/profile"),
    ]);

    if (!dashboardRes.ok) return null;

    const dashboard = await dashboardRes.json();
    const analytics = analyticsRes.ok ? await analyticsRes.json() : {};
    const profile = profileRes.ok ? await profileRes.json() : {};
    const enrolledCourses = Array.isArray(dashboard.enrolledCourses)
      ? dashboard.enrolledCourses
      : [];
    const weeklyActivity = Array.isArray(dashboard.weeklyActivity)
      ? dashboard.weeklyActivity
      : [];
    const achievementSummary = dashboard.achievementSummary || {};

    return {
      ...dashboard,
      stats: {
        currentStreak: dashboard.currentStreak || 0,
        totalXP: achievementSummary.unlockedCount
          ? achievementSummary.unlockedCount * 120
          : Math.round((dashboard.overallMastery || 0) * 8),
        avgAccuracy: Math.round(
          analytics.overallMastery
            ? Number(analytics.overallMastery) * 100
            : dashboard.overallMastery || 0,
        ),
        learningTime: `${Math.floor((dashboard.weeklyMinutes || 0) / 60)}h ${Math.round(
          (dashboard.weeklyMinutes || 0) % 60,
        )}m`,
      },
      weeklyActivity: weeklyActivity.map((item: any) => item.minutes || 0),
      weeklyActivityDetail: weeklyActivity,
      recentCourses: enrolledCourses
        .slice()
        .sort(
          (a: any, b: any) =>
            new Date(b.lastAccessed || 0).getTime() -
            new Date(a.lastAccessed || 0).getTime(),
        )
        .slice(0, 5)
        .map((course: any) => ({
          id: course.id,
          courseName: course.name || course.title || "Untitled Course",
          progress: Math.round(course.progress || 0),
          mastery: Math.round(course.mastery || 0),
          streak: course.streak || 0,
        })),
      achievements: (achievementSummary.highlights || []).map((item: any, index: number) => ({
        title: item.title,
        desc: item.detail,
        unlocked: item.completed,
        icon: index === 0 ? "Flame" : index === 1 ? "Target" : "Award",
        color: item.completed ? "text-lumina-primary" : "text-gray-500",
      })),
      weakTopics: dashboard.weakTopics || [],
      learningSignals: dashboard.learningSignals || {},
      coachInsight: dashboard.coachInsight || null,
      nextAction: dashboard.nextAction || null,
      todayPlan: dashboard.todayPlan || [],
      dueAssignments: dashboard.dueAssignments || [],
      masteryBreakdown: dashboard.masteryBreakdown || [],
      profile,
    };
  }

  async getStudentCertificates(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/student/certificates");
    if (!res.ok) return [];
    return await res.json();
  }

  async updateProfile(data: any): Promise<any> {
    const res = await this.fetchAuthorized("/api/student/profile/update", {
      method: "POST",
      body: JSON.stringify(data),
    });
    const payload = await res.json();

    if (res.ok && this.currentUser) {
      const nextUser = {
        ...this.currentUser,
        name: data.name || this.currentUser.name,
        avatar: data.avatar || this.currentUser.avatar,
        bio: data.bio ?? this.currentUser.bio,
        location: data.location ?? this.currentUser.location,
        preferences: {
          ...(this.currentUser.preferences || {}),
          ...(data.preferences || {}),
        },
      };
      this.currentUser = nextUser;
      if (typeof window !== "undefined") {
        sessionStorage.setItem("lumina_user", JSON.stringify(nextUser));
      }
    }

    return payload;
  }

  async completeLesson(
    courseId: string,
    moduleId: string, // ModuleId might be legacy in backend for now
    lessonId: string,
  ): Promise<any> {
    const res = await this.fetchAuthorized("/api/student/complete-lesson", {
      method: "POST",
      body: JSON.stringify({ course_id: courseId, lesson_id: lessonId }),
    });
    return await res.json();
  }

  async logActivity(courseId: string, durationMinutes: number): Promise<any> {
    const res = await this.fetchAuthorized("/api/student/log-activity", {
      method: "POST",
      body: JSON.stringify({
        course_id: courseId,
        duration_minutes: durationMinutes,
      }),
    });
    return await res.json();
  }

  async getAssignments(courseId?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (courseId) params.append("course_id", courseId);
    if (this.currentUser?.id) params.append("student_id", this.currentUser.id);

    const res = await this.fetchAuthorized(`/api/assignments/list?${params.toString()}`);
    if (!res.ok) return [];
    return await res.json();
  }

  async submitAssignment(assignmentId: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append("assignment_id", assignmentId);
    formData.append("file", file);

    const res = await this.fetchAuthorized("/api/assignments/submit", {
      method: "POST",
      body: formData,
    });
    return await res.json();
  }

  async uploadHandwriting(type: "assignment" | "note", file: File, assignmentId?: string): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    if (assignmentId) formData.append("assignment_id", assignmentId);
    if (this.currentUser?.id) formData.append("user_id", this.currentUser.id);

    const res = await this.fetchAuthorized("/api/handwriting/upload", {
      method: "POST",
      body: formData,
    });
    return await res.json();
  }

  async getStudentBadges(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/student/badges");
    if (!res.ok) return [];
    return await res.json();
  }

  async getStudentMastery(): Promise<any> {
    const res = await this.fetchAuthorized("/api/assessment/student/mastery");
    if (!res.ok) return {};
    return await res.json();
  }

  async getCourseDetails(courseId: string): Promise<any> {
    const res = await fetch(`${this.getApiBase()}/api/courses/${courseId}`);
    if (!res.ok) return null;
    return await res.json();
  }

  async getEnrolledCourses(): Promise<any> {
    const progress = await this.getStudentProgress();
    return progress?.enrolledCourses || [];
  }

  async getCommunityData(channelId?: string): Promise<any> {
    const res = await this.fetchAuthorized(
      `/api/community/data?channel_id=${channelId || "general"}`,
    );
    if (!res.ok) return { channels: [], messages: [] };
    return await res.json();
  }

  async sendCommunityMessage(channelId: string, content: string): Promise<any> {
    const res = await this.fetchAuthorized("/api/community/send", {
      method: "POST",
      body: JSON.stringify({ channel_id: channelId, content }),
    });
    return await res.json();
  }

  async getTeacherStudents(): Promise<any> {
    const res = await this.fetchAuthorized("/api/courses/teacher/students");
    if (!res.ok) return [];
    return await res.json();
  }

  async getTeacherCourses(): Promise<any> {
    const res = await this.fetchAuthorized("/api/courses/teacher/list");
    if (!res.ok) return [];
    return await res.json();
  }

  async createCourse(courseData: any): Promise<any> {
    const res = await this.fetchAuthorized("/api/courses", {
      method: "POST",
      body: JSON.stringify(courseData),
    });
    return await res.json();
  }

  async getAllCourses(): Promise<any[]> {
    const res = await fetch(`${this.getApiBase()}/api/courses`);
    if (!res.ok) return [];
    return await res.json();
  }

  async enrollInCourse(courseId: string): Promise<any> {
    const res = await this.fetchAuthorized("/api/student/enroll", {
      method: "POST",
      body: JSON.stringify({ course_id: courseId }),
    });
    return await res.json();
  }

  async getStudentCourses(): Promise<any[]> {
    const progress = await this.getStudentProgress();
    return progress?.enrolledCourses || [];
  }

  async getExploreCourses(): Promise<{ enrolled: any[]; recommended: any[] }> {
    const progress = await this.getStudentProgress();
    const enrolled = progress?.enrolledCourses || [];
    const all = await this.getAllCourses();
    const enrolledIds = new Set(enrolled.map((course: any) => String(course.id)));
    const focusTerms = (progress?.weakTopics || [])
      .map((item: any) => String(item.topic || "").toLowerCase())
      .filter(Boolean);

    const recommended = all
      .filter((course: any) => !enrolledIds.has(String(course.id)))
      .map((course: any) => {
        const haystack = `${course.name || ""} ${course.description || ""}`.toLowerCase();
        const topicalMatches = focusTerms.filter((term: string) => haystack.includes(term)).length;
        return {
          ...course,
          recommendationScore: topicalMatches * 10 + (course.rating || 0) + ((course.students || 0) / 1000),
        };
      })
      .sort((a: any, b: any) => b.recommendationScore - a.recommendationScore)
      .slice(0, 6);

    return { enrolled, recommended };
  }

  async publishCourse(courseId: string): Promise<any> {
    const res = await this.fetchAuthorized(`/api/courses/${courseId}/publish`, {
      method: "POST",
    });
    return await res.json();
  }

  async updateCourseStructure(courseId: string, modules: any[]): Promise<any> {
    const res = await this.fetchAuthorized(`/api/courses/${courseId}/modules`, {
      method: "PUT",
      body: JSON.stringify({ modules }),
    });
    return await res.json();
  }

  async inviteStudent(studentEmail: string, courseId: string): Promise<any> {
    const res = await this.fetchAuthorized(`/api/courses/${courseId}/invite`, {
      method: "POST",
      body: JSON.stringify({ email: studentEmail }),
    });
    return await res.json();
  }

  async addModule(courseId: string, title: string): Promise<any> {
    const res = await this.fetchAuthorized(`/api/courses/${courseId}/modules`, {
      method: "POST",
      body: JSON.stringify({ title }),
    });
    return await res.json();
  }

  async addLesson(
    courseId: string,
    moduleId: string,
    title: string,
    content: string = "",
    type: "text" | "video" | "quiz" = "text",
  ): Promise<any> {
    const res = await this.fetchAuthorized(
      `/api/courses/${courseId}/modules/${moduleId}/lessons`,
      {
        method: "POST",
        body: JSON.stringify({ title, content, type }),
      },
    );
    return await res.json();
  }

  async deleteCourse(courseId: string): Promise<any> {
    const res = await this.fetchAuthorized(`/api/courses/${courseId}`, {
      method: "DELETE",
    });
    return await res.json();
  }

  async deleteModule(courseId: string, moduleId: string): Promise<any> {
    const res = await this.fetchAuthorized(
      `/api/courses/${courseId}/modules/${moduleId}`,
      {
        method: "DELETE",
      },
    );
    return await res.json();
  }

  async deleteLesson(
    courseId: string,
    moduleId: string,
    lessonId: string,
  ): Promise<any> {
    const res = await this.fetchAuthorized(
      `/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
      {
        method: "DELETE",
      },
    );
    return await res.json();
  }

  async updateCourseDetails(courseId: string, updates: any): Promise<any> {
    const res = await this.fetchAuthorized(`/api/courses/${courseId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    return await res.json();
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    this.token = null;
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("lumina_user");
      sessionStorage.removeItem("lumina_token");
    }
  }

  async updateProgress(
    _courseId: string,
    _percentIncrement: number,
  ): Promise<any> {
    // Partial progress update
    void _courseId;
    void _percentIncrement;
    return { success: true };
  }

  async getChatHistory(): Promise<any[]> {
    try {
      return this.readChatHistory().sort(
        (a, b) =>
          new Date(a.timestamp || 0).getTime() -
          new Date(b.timestamp || 0).getTime(),
      );
    } catch {
      return [];
    }
  }

  async saveChatMessage(message: {
    sender: string;
    text: string;
    sessionId?: string;
  }): Promise<any> {
    const existing = this.readChatHistory();
    existing.push({
      id: `${message.sessionId || "session"}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sender: message.sender,
      text: message.text,
      sessionId: message.sessionId || "default-session",
      timestamp: new Date().toISOString(),
    });
    this.writeChatHistory(existing);
    return { success: true };
  }

  async saveNote(content: string, title?: string, subject?: string): Promise<any> {
    const res = await this.fetchAuthorized("/api/student/notes", {
      method: "POST",
      body: JSON.stringify({ content, title, subject }),
    });
    return await res.json();
  }

  async getNotes(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/student/notes");
    if (!res.ok) return [];
    return await res.json();
  }

  async createNote(noteData: any): Promise<any> {
    return this.saveNote(
      noteData.content || noteData,
      noteData.title,
      noteData.subject
    );
  }

  async deleteNote(noteId: string): Promise<any> {
    const res = await this.fetchAuthorized(`/api/student/notes/${noteId}`, {
      method: "DELETE",
    });
    return await res.json();
  }

  async updateNote(noteId: string, noteData: any): Promise<any> {
    const res = await this.fetchAuthorized(`/api/student/notes/${noteId}`, {
      method: "PUT",
      body: JSON.stringify({
        content: noteData.content,
        title: noteData.title,
        subject: noteData.subject,
      }),
    });
    return await res.json();
  }

  async chatWithAI(messages: any[]): Promise<any> {
    // This is often a separate direct call to tutor/chat
    const lastMsg = messages[messages.length - 1];
    const res = await this.fetchAuthorized("/api/tutor/chat", {
      method: "POST",
      body: JSON.stringify({
        message: lastMsg.content || lastMsg.text,
        user_id: this.currentUser?.id,
      }),
    });
    return await res.json();
  }

  // --- Admin API Methods ---

  async getAllUsers(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/admin/users");
    if (!res.ok) return [];
    return await res.json();
  }

  async adminCreateUser(userData: {
    name: string;
    email: string;
    password: string;
    role: "student" | "teacher" | "admin";
    phone?: string;
  }): Promise<any> {
    const res = await this.fetchAuthorized("/api/admin/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
    return await res.json();
  }

  async getAllCoursesAdmin(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/admin/courses");
    if (!res.ok) return [];
    return await res.json();
  }

  async getAllChatLogs(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/admin/logs/chat");
    if (!res.ok) return [];
    return await res.json();
  }

  async getAllAILogs(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/admin/logs/ai");
    if (!res.ok) return [];
    return await res.json();
  }

  async getAllStudentsWithProgress(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/admin/students-progress");
    if (!res.ok) return [];
    return await res.json();
  }

  async updateUserStatus(userId: string, status: string): Promise<any> {
    const res = await this.fetchAuthorized(
      `/api/admin/users/${userId}/status?status=${status}`,
      {
        method: "POST",
      },
    );
    return await res.json();
  }

  async updateUserRole(userId: string, role: string): Promise<any> {
    const res = await this.fetchAuthorized(
      `/api/admin/users/${userId}/role?role=${role}`,
      {
        method: "POST",
      },
    );
    return await res.json();
  }

  async logAIInteraction(prompt: string, response: string): Promise<any> {
    try {
      const res = await this.fetchAuthorized("/api/ai/log", {
        method: "POST",
        body: JSON.stringify({ prompt, response }),
      });
      if (!res.ok) {
        return { success: false };
      }
      return await res.json();
    } catch {
      return { success: false };
    }
  }

  async saveQuizResult(data: {
    topic: string;
    score: number;
    total_questions: number;
    correct_count: number;
    difficulty: string;
    course_id?: string;
    details?: any;
  }): Promise<any> {
    const res = await this.fetchAuthorized("/api/student/quiz-result", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return await res.json();
  }

  async deleteAILog(logId: string): Promise<any> {
    const res = await this.fetchAuthorized(`/api/admin/logs/ai/${logId}`, {
      method: "DELETE",
    });
    return await res.json();
  }

  async deleteUser(userId: string): Promise<any> {
    const res = await this.fetchAuthorized(`/api/admin/users/${userId}`, {
      method: "DELETE",
    });
    return await res.json();
  }

  // --- Institution & Connection Management ---

  async getInstitutions(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/admin/institutions");
    if (!res.ok) return [];
    return await res.json();
  }

  async createInstitution(data: any): Promise<any> {
    const res = await this.fetchAuthorized("/api/admin/institutions", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return await res.json();
  }

  async getDepartments(instId: string): Promise<any[]> {
    const res = await this.fetchAuthorized(`/api/admin/institutions/${instId}/departments`);
    if (!res.ok) return [];
    return await res.json();
  }

  async createDepartment(instId: string, data: any): Promise<any> {
    const res = await this.fetchAuthorized(`/api/admin/institutions/${instId}/departments`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return await res.json();
  }

  async linkStakeholder(data: any): Promise<any> {
    const res = await this.fetchAuthorized("/api/admin/connections/link", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return await res.json();
  }

  async getConnections(params?: { instId?: string; programId?: string }): Promise<any[]> {
    let url = "/api/admin/connections";
    const query = new URLSearchParams();
    if (params?.instId) query.append("inst_id", params.instId);
    if (params?.programId) query.append("program_id", params.programId);
    
    if (query.toString()) url += `?${query.toString()}`;
    
    const res = await this.fetchAuthorized(url);
    if (!res.ok) return [];
    return await res.json();
  }
}

export const api = RealAPI.getInstance();

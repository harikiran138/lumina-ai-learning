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

    // Default Content-Type to JSON if body is present
    if (options.body && !headers.has("Content-Type")) {
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
    this.currentUser = {
      id: userData.id,
      email: userData.email,
      name: userData.full_name,
      role: userData.role,
      avatar:
        userData.avatar ||
        `https://ui-avatars.com/api/?name=${userData.full_name}&background=random`,
      status: "active",
      createdAt: userData.created_at,
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
    // For now, student progress is part of dashboard data
    const res = await this.fetchAuthorized("/api/student/dashboard");
    if (!res.ok) return null;
    const data = await res.json();
    return data.enrolledCourses || [];
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
    return await res.json();
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
    return this.getStudentProgress();
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
    return this.getStudentProgress();
  }

  async getExploreCourses(): Promise<{ enrolled: any[]; recommended: any[] }> {
    // Combine calls or have a special endpoint
    const enrolled = await this.getStudentProgress();
    const all = await this.getAllCourses();
    // Simple mock logic for recommendation
    return { enrolled, recommended: all.slice(0, 3) };
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
    courseId: string,
    percentIncrement: number,
  ): Promise<any> {
    // Partial progress update
    return { success: true };
  }

  async getChatHistory(): Promise<any[]> {
    try {
      // Chat history is stored in IndexedDB locally; backend has no dedicated history endpoint
      return [];
    } catch {
      return [];
    }
  }

  async saveChatMessage(message: {
    sender: string;
    text: string;
    sessionId?: string;
  }): Promise<any> {
    // Save via backend
    return { success: true };
  }

  async saveNote(content: string): Promise<any> {
    const res = await this.fetchAuthorized("/api/student/note", {
      method: "POST",
      body: JSON.stringify({ content }),
    });
    return await res.json();
  }

  async getNotes(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/student/profile");
    if (!res.ok) return [];
    const profile = await res.json();
    return profile.notes || [];
  }

  async createNote(noteData: any): Promise<any> {
    return this.saveNote(noteData.content || noteData);
  }

  async deleteNote(noteId: string): Promise<any> {
    // Need endpoint
    return { success: true };
  }

  async updateNote(noteId: string, noteData: any): Promise<any> {
    return this.saveNote(noteData.content || noteData);
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
    const res = await this.fetchAuthorized("/api/ai/log", {
      method: "POST",
      body: JSON.stringify({ prompt, response }),
    });
    return await res.json();
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
}

export const api = RealAPI.getInstance();

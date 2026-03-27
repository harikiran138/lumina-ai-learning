// API client for the Lumina FastAPI backend
import localforage from "localforage";

// ── Cookie helpers for auth token ────────────────────────────────────────────
function setAuthCookie(token: string): void {
  if (typeof document === 'undefined') return
  document.cookie = `auth_token=${token}; path=/; SameSite=Strict; max-age=86400`
}

function clearAuthCookie(): void {
  if (typeof document === 'undefined') return
  document.cookie = 'auth_token=; path=/; max-age=0'
}

// ── Fetch with retry + timeout ────────────────────────────────────────────────
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  timeoutMs = 10000
): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      const reason =
        typeof DOMException !== 'undefined'
          ? new DOMException('Request timed out', 'AbortError')
          : 'Request timed out'
      controller.abort(reason as any)
    }, timeoutMs)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      return response
    } catch (err: unknown) {
      if (attempt === retries) throw err
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    } finally {
      clearTimeout(timeoutId)
    }
  }
  throw new Error('Max retries exceeded')
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "college_admin" | "admin" | "hod" | "faculty" | "teacher" | "student" | "parent" | "mentor" | "peer_tutor" | "counselor" | "content_creator" | "researcher" | "alumni";
  status: "active" | "suspended" | "inactive" | string;
  avatar: string;
  createdAt: string;
  onboardingCompleted?: boolean;
  onboardingStep?: number;
  collegeId?: string | null;
  deptId?: string | null;
  batchId?: string | null;
  mustChangePassword?: boolean;
  preferences?: any;
  password?: string;
  bio?: string;
  skills?: string[];
  location?: string;
}

export class RealAPI {
  private static instance: RealAPI;
  private currentUser: User | null = null;
  private token: string | null = null;

  private constructor() {
    if (typeof window !== "undefined") {
      const cookieToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1]
      this.token = cookieToken || sessionStorage.getItem("lumina_token") || null
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
    return (
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_API_BASE ||
      "http://127.0.0.1:8000"
    );
  }

  private async handleUnauthorized(): Promise<boolean> {
    try {
      const res = await fetch(`${this.getApiBase()}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
      if (res.ok) {
        const { accessToken } = await res.json()
        this.token = accessToken
        setAuthCookie(accessToken)
        return true
      }
    } catch { }
    this.logout()
    if (typeof window !== 'undefined') {
      window.location.href = '/login?reason=session_expired'
    }
    return false
  }

  private async fetchAuthorized(
    path: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const headers = new Headers(options.headers || {});
    if (this.token) {
      headers.set("Authorization", `Bearer ${this.token}`);
    }
    if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    const response = await fetchWithRetry(`${this.getApiBase()}${path}`, {
      ...options,
      headers,
    });
    if (response.status === 401) {
      const refreshed = await this.handleUnauthorized()
      if (refreshed) {
        headers.set("Authorization", `Bearer ${this.token}`);
        return fetchWithRetry(`${this.getApiBase()}${path}`, { ...options, headers })
      }
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
    } catch { return []; }
  }

  private writeChatHistory(messages: any[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.getChatStorageKey(), JSON.stringify(messages.slice(-400)));
  }

  async login(email: string, password?: string): Promise<User> {
    if (!password) throw new Error("Password is required for login.");
    const res = await fetchWithRetry(`${this.getApiBase()}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Authentication failed");
    }
    const tokenData = await res.json();
    this.token = tokenData.accessToken;
    setAuthCookie(this.token!)
    const userData = tokenData.user;
    const displayName = userData.fullName || userData.name || email.split("@")[0];
    this.currentUser = {
      id: userData.id,
      email: userData.email,
      name: displayName,
      role: userData.role,
      onboardingStep: userData.onboardingStep,
      onboardingCompleted: userData.onboardingCompleted,
      mustChangePassword: userData.mustChangePassword,
      collegeId: userData.collegeId,
      deptId: userData.deptId,
      batchId: userData.batchId,
      avatar: userData.profilePhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`,
      status: userData.status || "active",
      createdAt: userData.created_at || new Date().toISOString(),
      preferences: userData.preferences || {},
    };
    if (typeof window !== "undefined") {
      sessionStorage.setItem("lumina_user", JSON.stringify(this.currentUser));
    }
    return this.currentUser;
  }

  async getCurrentUser(): Promise<User | null> { return this.currentUser; }

  async createUser(userData: Partial<User> & { password?: string }): Promise<any> {
    if (!userData.password) throw new Error("Password is required for signup.");
    const res = await fetchWithRetry(`${this.getApiBase()}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        full_name: userData.name,
        role: userData.role || "student",
      }),
    });
    if (!res.ok) throw new Error((await res.json()).detail || "Registration failed");
    return this.login(userData.email!, userData.password);
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${this.getApiBase()}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore logout network errors
    }
    this.currentUser = null;
    this.token = null;
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("lumina_user");
      sessionStorage.removeItem("lumina_token");
    }
    clearAuthCookie()
  }

  async changePassword(newPassword: string): Promise<any> {
    const res = await this.fetchAuthorized("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ newPassword }),
    });
    return await res.json();
  }

  async forgotPassword(email: string): Promise<any> {
    const res = await fetch(`${this.getApiBase()}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return await res.json();
  }

  async resetPassword(token: string, newPassword: string): Promise<any> {
    const res = await fetch(`${this.getApiBase()}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
    return await res.json();
  }

  // --- Student Academic APIs ---
  async getStudentCourses(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/student/subjects");
    return res.ok ? await res.json() : [];
  }

  async getExploreCourses(): Promise<{ enrolled: any[]; recommended: any[] }> {
    const enrolled = await this.getStudentCourses();
    return { enrolled, recommended: [] };
  }

  async enrollInCourse(courseId: string): Promise<any> {
    return { success: true, courseId };
  }

  async getStudentAttendance(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/student/attendance");
    return res.ok ? await res.json() : [];
  }

  async getStudentAssignments(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/student/assignments");
    return res.ok ? await res.json() : [];
  }

  async submitStudentAssignment(assignmentId: string, payload: { content_url?: string; text_content?: string }): Promise<any> {
    const res = await this.fetchAuthorized(`/api/student/assignments/${assignmentId}/submit`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return await res.json();
  }

  async getStudentGrades(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/student/grades");
    return res.ok ? await res.json() : [];
  }

  async getStudentMaterials(courseId: string): Promise<any[]> {
    const res = await this.fetchAuthorized(`/api/student/materials/${courseId}`);
    return res.ok ? await res.json() : [];
  }

  // --- Faculty Academic APIs ---
  async getFacultyAssignments(): Promise<any[]> {
    return await this.getAssignments();
  }

  async getAssignmentSubmissions(assignmentId: string): Promise<any[]> {
    return await this.getSubmissions(assignmentId);
  }

  // --- Onboarding & Dashboard ---
  async updateOnboardingStep(step: number, data: any): Promise<any> {
    const res = await this.fetchAuthorized("/api/onboarding/step", {
      method: "PATCH",
      body: JSON.stringify({ step, data }),
    });
    return await res.json();
  }

  async completeOnboarding(): Promise<any> {
    const res = await this.fetchAuthorized("/api/onboarding/complete", { method: "POST" });
    return await res.json();
  }

  async getDashboardData(userRole: string): Promise<any> {
    const roleMap: Record<string, string> = {
      student: "/api/student/dashboard",
      teacher: "/api/courses/teacher/dashboard",
      faculty: "/api/courses/teacher/dashboard",
      college_admin: "/api/college/dashboard",
      hod: "/api/hod/dashboard"
    };
    const path = roleMap[userRole] || `/api/${userRole}/dashboard`;
    const res = await this.fetchAuthorized(path);
    return res.ok ? await res.json() : {};
  }

  // --- College Architecture Helpers ---
  async architectureUpdateCollege(collegeId: string, data: any) {
    const res = await this.fetchAuthorized(`/api/colleges/${collegeId}`, { method: "PATCH", body: JSON.stringify(data)});
    return await res.json();
  }
  async architectureCreateDepartment(collegeId: string, data: any) {
    const res = await this.fetchAuthorized(`/api/colleges/${collegeId}/departments`, { method: "POST", body: JSON.stringify(data)});
    return await res.json();
  }
  async architectureListDepartments(collegeId: string) {
    const res = await this.fetchAuthorized(`/api/colleges/${collegeId}/departments`);
    return res.ok ? await res.json() : [];
  }
  async architectureCreateBatch(deptId: string, data: any) {
    const res = await this.fetchAuthorized(`/api/departments/${deptId}/batches`, { method: "POST", body: JSON.stringify(data)});
    return await res.json();
  }
  async architectureListBatches(deptId: string) {
    const res = await this.fetchAuthorized(`/api/departments/${deptId}/batches`);
    return res.ok ? await res.json() : [];
  }
  async architectureCreateSubject(deptId: string, data: any) {
    const res = await this.fetchAuthorized(`/api/departments/${deptId}/subjects`, { method: "POST", body: JSON.stringify(data)});
    return await res.json();
  }
  async architectureListSubjects(deptId: string) {
    const res = await this.fetchAuthorized(`/api/departments/${deptId}/subjects`);
    return res.ok ? await res.json() : [];
  }
  async architectureInviteUser(collegeId: string, data: any) {
    const res = await this.fetchAuthorized(`/api/colleges/${collegeId}/invite`, { method: "POST", body: JSON.stringify(data)});
    return await res.json();
  }

  // Enrollment
  async redeemEnrollmentCode(code: string) {
    const res = await this.fetchAuthorized("/api/enroll/redeem", { method: "POST", body: JSON.stringify({ code })});
    return await res.json();
  }

  async listFacultyByDept(deptId: string) {
    const res = await this.fetchAuthorized(`/api/departments/${deptId}/faculty`);
    return res.ok ? await res.json() : [];
  }

  async getStudentProgress(): Promise<any> {
    const res = await this.fetchAuthorized("/api/student/dashboard");
    return res.ok ? await res.json() : null;
  }

  // --- Admin Hierarchy Management ---
  async getInstitutions(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/institutions");
    return res.ok ? await res.json() : [];
  }

  async getDepartments(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/admin/departments");
    return res.ok ? await res.json() : [];
  }

  async createAdminDepartment(data: any): Promise<any> {
    const res = await this.fetchAuthorized("/api/admin/departments", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return await res.json();
  }

  async deleteAdminDepartment(deptId: string): Promise<any> {
    const res = await this.fetchAuthorized(`/api/admin/departments/${deptId}`, {
      method: "DELETE",
    });
    return await res.json();
  }

  async getAdminClasses(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/admin/classes");
    return res.ok ? await res.json() : [];
  }

  async createAdminClass(data: any): Promise<any> {
    const res = await this.fetchAuthorized("/api/admin/classes", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return await res.json();
  }

  async deleteAdminClass(classId: string): Promise<any> {
    const res = await this.fetchAuthorized(`/api/admin/classes/${classId}`, {
      method: "DELETE",
    });
    return await res.json();
  }

  // --- Attendance ---
  async getAttendance(courseId: string, params?: { batchId?: string; section?: string; date?: string }) {
    const query = new URLSearchParams();
    if (params?.batchId) query.append("batch_id", params.batchId);
    if (params?.section) query.append("section", params.section);
    if (params?.date) query.append("date", params.date);
    const res = await this.fetchAuthorized(`/api/attendance/${courseId}?${query.toString()}`);
    return res.ok ? await res.json() : [];
  }

  async markAttendanceBulk(records: any[]) {
    const res = await this.fetchAuthorized("/api/attendance", {
      method: "POST",
      body: JSON.stringify({ records })
    });
    return await res.json();
  }

  // --- Assignments & Submissions ---
  async getAssignments(courseId?: string, studentId?: string) {
    const query = new URLSearchParams();
    if (courseId) query.append("course_id", courseId);
    if (studentId) query.append("student_id", studentId);
    const res = await this.fetchAuthorized(`/api/assignments/list?${query.toString()}`);
    return res.ok ? await res.json() : [];
  }

  async createAssignment(data: {
    title: string;
    course_id: string;
    description: string;
    due_date: string;
  }) {
    // Backend uses Form data
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("course_id", data.course_id);
    formData.append("description", data.description);
    formData.append("due_date", data.due_date);

    const res = await this.fetchAuthorized("/api/assignments/create", {
      method: "POST",
      body: formData
    });
    return await res.json();
  }

  async getSubmissions(assignmentId: string) {
    const res = await this.fetchAuthorized(`/api/assignments/${assignmentId}/submissions`);
    return res.ok ? await res.json() : [];
  }

  async gradeSubmission(assignmentId: string, submissionId: string, data: { score: number; feedback?: string }) {
    const res = await this.fetchAuthorized(`/api/assignments/${assignmentId}/submissions/${submissionId}/score`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
    return await res.json();
  }

  // --- College Architecture (Extended) ---
  async listStudents(collegeId: string, params?: { deptId?: string; batchId?: string; section?: string }) {
    const query = new URLSearchParams();
    query.append("role", "student");
    if (params?.deptId) query.append("dept_id", params.deptId);
    if (params?.batchId) query.append("batch_id", params.batchId);
    if (params?.section) query.append("section", params.section);
    
    const res = await this.fetchAuthorized(`/api/colleges/${collegeId}/users?${query.toString()}`);
    return res.ok ? await res.json() : [];
  }

  async listCourses(deptId?: string) {
    const url = deptId ? `/api/departments/${deptId}/subjects` : "/api/courses/list";
    const res = await this.fetchAuthorized(url);
    return res.ok ? await res.json() : [];
  }

  async getBatches(deptId: string) {
    const res = await this.fetchAuthorized(`/api/departments/${deptId}/batches`);
    return res.ok ? await res.json() : [];
  }

  // --- Aliases & Legacy ---
  async listSubjects(deptId: string) { return this.architectureListSubjects(deptId); }
  async listBatches(deptId: string) { return this.architectureListBatches(deptId); }
  async createBatch(deptId: string, data: any) { return this.architectureCreateBatch(deptId, data); }
  async createSubject(deptId: string, data: any) { return this.architectureCreateSubject(deptId, data); }
  async inviteUser(collegeId: string, data: any) { return this.architectureInviteUser(collegeId, data); }
}

export const api = RealAPI.getInstance();

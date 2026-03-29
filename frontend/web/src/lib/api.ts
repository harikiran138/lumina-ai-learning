// API client for the Lumina FastAPI backend

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

function getLocalServiceBase(port: number): string | null {
  if (typeof window === "undefined") return null;
  const hostname = window.location.hostname;
  if (!LOCAL_HOSTNAMES.has(hostname) && !hostname.includes("localhost")) return null;
  const protocol = window.location.protocol === "https:" ? "https" : "http";
  
  // Return the current hostname as preference, but 127.0.0.1 is the most reliable fallback
  if (hostname === "localhost") return `${protocol}://127.0.0.1:${port}`;
  return `${protocol}://${hostname}:${port}`;
}

export function getConfiguredApiBase(): string | null {
  const explicitBase =
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE?.trim();

  if (explicitBase) return explicitBase.replace(/\/+$/, "");
  return getLocalServiceBase(8000);
}

export function getConfiguredAuthBase(): string | null {
  const explicitBase = process.env.NEXT_PUBLIC_AUTH_URL?.trim();
  if (explicitBase) return explicitBase.replace(/\/+$/, "");
  return getLocalServiceBase(8000); // Default to backend port
}

export function requireApiBase(): string {
  const apiBase = getConfiguredApiBase();
  if (apiBase) return apiBase;
  throw new Error("API is not configured for this deployment. Set NEXT_PUBLIC_API_URL in Vercel.");
}

export function requireAuthBase(): string {
  const authBase = getConfiguredAuthBase();
  if (authBase) return authBase;
  throw new Error("Auth API is not configured. Set NEXT_PUBLIC_AUTH_URL");
}

// Cookies are now HttpOnly and managed by the Express backend.

// ── Fetch with retry + timeout ────────────────────────────────────────────────
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  timeoutMs = 30000
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

      // Retry on 5xx Server Errors
      if (!response.ok && response.status >= 500) {
        throw new Error(`Server Error: ${response.status}`);
      }

      return response
    } catch (err: any) {
      // If we failed to fetch from localhost, and it's a TypeError (Network Error), 
      // try failing over to 127.0.0.1 if the URL contains localhost.
      if (err instanceof TypeError && url.includes("localhost") && !url.includes("127.0.0.1")) {
        const fallbackUrl = url.replace("localhost", "127.0.0.1");
        console.warn(`Localhost fetch failed, trying fallback to 127.0.0.1: ${fallbackUrl}`);
        return fetchWithRetry(fallbackUrl, options, attempt); // retry immediate with fallback
      }

      if (attempt === retries) {
        if (err instanceof TypeError && err.message === "Failed to fetch") {
          console.error(`[Lumina API] Network Error: Failed to fetch from ${url}. Is the backend running on port 8000?`, err);
        } else {
          console.error(`Final fetch failure for ${url}:`, err);
        }
        throw err;
      }
      console.warn(`Fetch failed for ${url}, retrying... (Attempt ${attempt}/${retries})`, err);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    } finally {
      clearTimeout(timeoutId)
    }
  }
  throw new Error('Max retries exceeded')
}

// Safely parse JSON from a Response — returns null if the body is HTML or unparseable.
async function parseJsonSafe(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
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
      const storedUser = sessionStorage.getItem("lumina_user");
      const storedToken = sessionStorage.getItem("lumina_token");
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
      }
      if (storedToken) {
        this.token = storedToken;
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
    return requireApiBase();
  }

  private persistToken(token: string | null) {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) {
        sessionStorage.setItem("lumina_token", token);
      } else {
        sessionStorage.removeItem("lumina_token");
      }
    }
  }

  private async handleUnauthorized(): Promise<boolean> {
    try {
      const res = await fetch(`${requireAuthBase()}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
      if (res.ok) {
        const tokenData = await parseJsonSafe(res);
        if (tokenData?.accessToken) {
          this.persistToken(tokenData.accessToken);
        }
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
    const fullUrl = `${this.getApiBase()}${path}`;
    let response: Response;

    try {
      response = await fetchWithRetry(fullUrl, {
        ...options,
        headers,
        credentials: "include",
      });
    } catch (err) {
      console.error(`fetchAuthorized caught network/CORS error for ${path} (Full URL: ${fullUrl}):`, err);
      throw err;
    }

    if (response.status === 401) {
      const refreshed = await this.handleUnauthorized()
      if (refreshed) {
        if (this.token) {
          headers.set("Authorization", `Bearer ${this.token}`);
        } else {
          headers.delete("Authorization");
        }
        return fetchWithRetry(`${this.getApiBase()}${path}`, { ...options, headers })
      }
    }
    return response;
  }

  private async fetchJsonOrDefault<T>(
    path: string,
    fallback: T,
    options: RequestInit = {},
  ): Promise<T> {
    try {
      const res = await this.fetchAuthorized(path, options);
      return res.ok ? ((await res.json()) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  // --- Auth APIs ---
  async login(
    paramsOrIdentifier: {
      identifier: string;
      password?: string;
      role_hint?: string;
      college_id?: string;
    } | string,
    maybePassword?: string,
  ): Promise<User> {
    const params =
      typeof paramsOrIdentifier === "string"
        ? { identifier: paramsOrIdentifier, password: maybePassword }
        : paramsOrIdentifier;
    const { identifier, password, role_hint, college_id } = params;
    if (!password) throw new Error("Password is required for login.");

    const res = await fetchWithRetry(`${requireAuthBase()}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password, role_hint, college_id }),
      credentials: "include",
    });

    if (!res.ok) {
      const error = await parseJsonSafe(res);
      throw new Error(error?.error || error?.detail || `Authentication failed (${res.status})`);
    }

    const tokenData = await parseJsonSafe(res);
    if (tokenData?.accessToken) {
      this.persistToken(tokenData.accessToken);
    }
    
    // Express backend sets the cookies automatically.
    const userData = tokenData.user;
    if (!userData) throw new Error("Login failed: User data not found in response.");

    const displayName = userData.fullName || userData.name || identifier;
    this.currentUser = {
      id: userData.id,
      email: userData.email,
      name: displayName,
      role: userData.role,
      onboardingStep: userData.onboardingStep,
      onboardingCompleted: userData.onboardingStep >= 5,
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

  async getCurrentUser(): Promise<any> { return this.currentUser; }

  async createUser(userData: Partial<User> & { password?: string }): Promise<any> {
    if (!userData.password) throw new Error("Password is required for signup.");
    const res = await fetchWithRetry(`${requireAuthBase()}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        full_name: userData.name,
        role: userData.role || "student",
      }),
    });
    if (!res.ok) { const e = await parseJsonSafe(res); throw new Error(e?.error || e?.detail || "Registration failed"); }
    return this.login({ identifier: userData.email!, password: userData.password });
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${requireAuthBase()}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore logout network errors
    }
    this.currentUser = null;
    this.persistToken(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("lumina_user");
    }
  }

  async changePassword(tokenOrPassword: string | null, maybeNewPassword?: string): Promise<any> {
    const newPassword = maybeNewPassword ?? tokenOrPassword;
    const res = await this.fetchAuthorized("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ newPassword }),
    });
    if (!res.ok) { const e = await parseJsonSafe(res); throw new Error(e?.detail || "Failed to change password"); }
    return await parseJsonSafe(res);
  }

  async forgotPassword(email: string): Promise<any> {
    const res = await fetch(`${requireAuthBase()}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) { const e = await parseJsonSafe(res); throw new Error(e?.detail || "Failed to send reset email"); }
    return await parseJsonSafe(res);
  }

  async resetPassword(token: string, newPassword: string): Promise<any> {
    const res = await fetch(`${requireAuthBase()}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
    if (!res.ok) { const e = await parseJsonSafe(res); throw new Error(e?.detail || "Failed to reset password"); }
    return await parseJsonSafe(res);
  }

  // --- Onboarding & Status ---
  async getOnboardingStatus(): Promise<any> {
    const res = await this.fetchAuthorized("/api/onboarding/status");
    if (!res.ok) {
      const error = await parseJsonSafe(res);
      throw new Error(error?.detail || "Failed to load onboarding status");
    }
    return await res.json();
  }

  async getOnboardingSubjects(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/onboarding/subjects");
    return res.ok ? await res.json() : [];
  }

  async saveStudentPersonalDetails(payload: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender?: string;
    phoneNumber: string;
    email: string;
  }): Promise<any> {
    const res = await this.fetchAuthorized("/api/onboarding/personal", {
      method: "POST",
      body: JSON.stringify({
        first_name: payload.firstName,
        last_name: payload.lastName,
        date_of_birth: payload.dateOfBirth,
        gender: payload.gender,
        phone_number: payload.phoneNumber,
        email: payload.email,
      }),
    });
    if (!res.ok) {
      const error = await parseJsonSafe(res);
      throw new Error(error?.detail || "Failed to save personal details");
    }
    return await parseJsonSafe(res) ?? {};
  }

  async validateEnrollmentCode(enrollmentCode: string): Promise<any> {
    const res = await this.fetchAuthorized("/api/enrollment/validate", {
      method: "POST",
      body: JSON.stringify({ enrollmentCode }),
    });
    if (!res.ok) {
      const error = await parseJsonSafe(res);
      throw new Error(error?.detail || "Failed to validate enrollment code");
    }
    return await parseJsonSafe(res) ?? {};
  }

  async saveStudentEnrollment(enrollmentCode: string): Promise<any> {
    const res = await this.fetchAuthorized("/api/onboarding/enrollment", {
      method: "POST",
      body: JSON.stringify({ enrollment_code: enrollmentCode }),
    });
    if (!res.ok) {
      const error = await parseJsonSafe(res);
      throw new Error(error?.detail || "Failed to link enrollment");
    }
    return await parseJsonSafe(res) ?? {};
  }

  async getStudentOnboardingSubjects(batchId?: string): Promise<any[]> {
    const suffix = batchId ? `?batch_id=${encodeURIComponent(batchId)}` : "";
    const res = await this.fetchAuthorized(`/api/onboarding/student-subjects${suffix}`);
    if (!res.ok) {
      const error = await parseJsonSafe(res);
      throw new Error(error?.detail || "Failed to load onboarding subjects");
    }
    return (await parseJsonSafe(res)) ?? [];
  }

  async saveStudentSubjects(subjectIds: string[]): Promise<any> {
    const res = await this.fetchAuthorized("/api/onboarding/subjects", {
      method: "POST",
      body: JSON.stringify({ subject_ids: subjectIds }),
    });
    if (!res.ok) {
      const error = await parseJsonSafe(res);
      throw new Error(error?.detail || "Failed to save subject selection");
    }
    return await parseJsonSafe(res) ?? {};
  }

  async saveStudentProfile(form: FormData): Promise<any> {
    const res = await this.fetchAuthorized("/api/onboarding/profile", {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      const error = await parseJsonSafe(res);
      throw new Error(error?.detail || "Failed to save profile details");
    }
    return await parseJsonSafe(res) ?? {};
  }

  async saveStudentPreferences(payload: {
    learningStyles: string[];
    selfAssessment: "beginner" | "intermediate" | "advanced";
  }): Promise<any> {
    const res = await this.fetchAuthorized("/api/onboarding/preferences", {
      method: "POST",
      body: JSON.stringify({
        learning_styles: payload.learningStyles,
        self_assessment: payload.selfAssessment,
      }),
    });
    if (!res.ok) {
      const error = await parseJsonSafe(res);
      throw new Error(error?.detail || "Failed to save learning preferences");
    }
    return await parseJsonSafe(res) ?? {};
  }

  async getStudentOnboardingOptions(): Promise<any> {
    const res = await this.fetchAuthorized("/api/student/onboarding/options");
    if (!res.ok) {
      const error = await parseJsonSafe(res);
      throw new Error(error?.detail || "Failed to load student onboarding options");
    }
    return await parseJsonSafe(res) ?? {};
  }

  async completeStudentOnboarding(payload: any): Promise<any> {
    const res = await this.fetchAuthorized("/api/student/onboarding/complete", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const error = await parseJsonSafe(res);
      throw new Error(error?.detail || "Failed to complete student onboarding setup");
    }
    return await parseJsonSafe(res) ?? {};
  }

  async getFacultyOnboardingOptions(): Promise<any> {
    const res = await this.fetchAuthorized("/api/faculty/onboarding/options");
    if (!res.ok) {
      const error = await parseJsonSafe(res);
      throw new Error(error?.detail || "Failed to load faculty onboarding options");
    }
    return await parseJsonSafe(res) ?? {};
  }

  async completeFacultyOnboarding(payload: any): Promise<any> {
    const res = await this.fetchAuthorized("/api/faculty/onboarding/complete", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const error = await parseJsonSafe(res);
      throw new Error(error?.detail || "Failed to complete faculty onboarding setup");
    }
    return await parseJsonSafe(res) ?? {};
  }

  async updateOnboardingStep(step: number, data: any): Promise<any> {
    const res = await this.fetchAuthorized("/api/onboarding/step", {
      method: "PATCH",
      body: JSON.stringify({ step, data }),
    });
    if (!res.ok) {
      const error = await parseJsonSafe(res);
      throw new Error(error?.detail || "Failed to save onboarding step");
    }
    return await parseJsonSafe(res) ?? {};
  }

  async completeOnboarding(): Promise<any> {
    const res = await this.fetchAuthorized("/api/onboarding/complete", { method: "POST" });
    if (!res.ok) {
      const error = await parseJsonSafe(res);
      throw new Error(error?.detail || "Failed to complete onboarding");
    }
    return await parseJsonSafe(res) ?? {};
  }

  // --- Dashboard ---
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

  async getAdminQueueHealth(): Promise<any> {
    const res = await this.fetchAuthorized("/api/admin/queue-health");
    return res.ok ? (await parseJsonSafe(res) ?? {}) : {};
  }

  async getAdminGuardianSignals(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/admin/guardian");
    return res.ok ? (await parseJsonSafe(res) ?? []) : [];
  }

  async getAdminStudentsProgress(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/admin/students-progress");
    return res.ok ? (await parseJsonSafe(res) ?? []) : [];
  }

  async getAdminSystemHealth(): Promise<any> {
    const res = await this.fetchAuthorized("/api/admin/health");
    return res.ok ? (await parseJsonSafe(res) ?? {}) : {};
  }

  async getAdminInterventions(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/admin/interventions");
    return res.ok ? (await parseJsonSafe(res) ?? []) : [];
  }

  // --- Student Academic APIs ---
  async getStudentCourses(): Promise<any[]> {
    const [subjects, dashboard] = await Promise.all([
      this.fetchJsonOrDefault("/api/student/subjects", []),
      this.getDashboardData("student").catch(() => null),
    ]);

    const dashboardCourses = (dashboard?.enrolledCourses || []) as any[];
    const courseMap = new Map<string, any>();

    for (const course of dashboardCourses) {
      if (course?.id) {
        courseMap.set(String(course.id), course);
      }
    }

    for (const course of subjects || []) {
      if (!course?.id) continue;
      const existing = courseMap.get(String(course.id)) || {};
      courseMap.set(String(course.id), {
        ...existing,
        ...course,
        name: course.name || existing.name || existing.title,
        title: course.title || existing.title || course.name,
        description: course.description || existing.description || "",
        progress: course.progress ?? existing.progress ?? 0,
        mastery: course.mastery ?? existing.mastery ?? 0,
        streak: course.streak ?? existing.streak ?? 0,
      });
    }

    return Array.from(courseMap.values());
  }

  async getStudentAttendance(): Promise<any> {
    const res = await this.fetchAuthorized("/api/student/attendance");
    return res.ok ? await res.json() : { subjects: [], threshold: 75 };
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
    if (!res.ok) { const e = await parseJsonSafe(res); throw new Error(e?.detail || "Failed to submit assignment"); }
    return await parseJsonSafe(res);
  }

  async getStudentGrades(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/student/grades");
    return res.ok ? await res.json() : [];
  }

  async getStudentProgress(): Promise<any> {
    const res = await this.fetchAuthorized("/api/student/dashboard");
    return res.ok ? await res.json() : null;
  }

  // --- Faculty Academic APIs ---
  async getFacultyAssignments(): Promise<any[]> {
    return await this.getAssignments();
  }

  async getAssignmentSubmissions(assignmentId: string): Promise<any[]> {
    return await this.getSubmissions(assignmentId);
  }

  async markAttendanceBulk(records: any[]) {
    const res = await this.fetchAuthorized("/api/attendance", {
      method: "POST",
      body: JSON.stringify({ records })
    });
    if (!res.ok) { const e = await parseJsonSafe(res); throw new Error(e?.detail || "Failed to mark attendance"); }
    return await parseJsonSafe(res);
  }

  async gradeSubmission(assignmentId: string, submissionId: string, data: { score: number; feedback?: string }) {
    const res = await this.fetchAuthorized(`/api/assignments/${assignmentId}/submissions/${submissionId}/score`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
    if (!res.ok) { const e = await parseJsonSafe(res); throw new Error(e?.detail || "Failed to grade submission"); }
    return await parseJsonSafe(res);
  }

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

  // --- College Architecture Helpers ---
  async architectureUpdateCollege(collegeId: string, data: any) {
    const res = await this.fetchAuthorized(`/api/colleges/${collegeId}`, { method: "PATCH", body: JSON.stringify(data)});
    return await parseJsonSafe(res) ?? {};
  }
  async architectureCreateCollege(data: any) {
    const res = await this.fetchAuthorized("/api/colleges", { method: "POST", body: JSON.stringify(data)});
    return await parseJsonSafe(res) ?? {};
  }
  async architectureCreateDepartment(collegeId: string, data: any) {
    const res = await this.fetchAuthorized(`/api/colleges/${collegeId}/departments`, { method: "POST", body: JSON.stringify(data)});
    return await parseJsonSafe(res) ?? {};
  }
  async architectureListDepartments(collegeId: string) {
    const res = await this.fetchAuthorized(`/api/colleges/${collegeId}/departments`);
    return res.ok ? await res.json() : [];
  }
  async architectureCreateBatch(deptId: string, data: any) {
    const res = await this.fetchAuthorized(`/api/departments/${deptId}/batches`, { method: "POST", body: JSON.stringify(data)});
    return await parseJsonSafe(res) ?? {};
  }
  async architectureListBatches(deptId: string) {
    const res = await this.fetchAuthorized(`/api/departments/${deptId}/batches`);
    return res.ok ? await res.json() : [];
  }
  async architectureCreateSubject(deptId: string, data: any) {
    const res = await this.fetchAuthorized(`/api/departments/${deptId}/subjects`, { method: "POST", body: JSON.stringify(data)});
    return await parseJsonSafe(res) ?? {};
  }
  async architectureListSubjects(deptId: string) {
    const res = await this.fetchAuthorized(`/api/departments/${deptId}/subjects`);
    return res.ok ? await res.json() : [];
  }
  async architectureInviteUser(collegeId: string, data: any) {
    const res = await this.fetchAuthorized(`/api/colleges/${collegeId}/invite`, { method: "POST", body: JSON.stringify(data)});
    return await parseJsonSafe(res) ?? {};
  }

  async architectureUpdateDepartment(deptId: string, data: any) {
    const res = await this.fetchAuthorized(`/api/departments/${deptId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return await parseJsonSafe(res) ?? {};
  }

  async assignSubject(subjectId: string, data: any) {
    const res = await this.fetchAuthorized(`/api/subjects/${subjectId}/assign`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return await parseJsonSafe(res) ?? {};
  }

  async listCollegeUsers(
    collegeId: string,
    params?: { role?: string; deptId?: string; batchId?: string; section?: string },
  ) {
    const query = new URLSearchParams();
    if (params?.role) query.append("role", params.role);
    if (params?.deptId) query.append("dept_id", params.deptId);
    if (params?.batchId) query.append("batch_id", params.batchId);
    if (params?.section) query.append("section", params.section);

    const suffix = query.toString() ? `?${query.toString()}` : "";
    const res = await this.fetchAuthorized(`/api/colleges/${collegeId}/users${suffix}`);
    return res.ok ? await res.json() : [];
  }

  async getFacultySubjectAssignments(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/faculty/subjects");
    return res.ok ? await res.json() : [];
  }

  async refreshSession(): Promise<any> {
    const res = await fetch(`${requireAuthBase()}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) {
      const error = await parseJsonSafe(res);
      throw new Error(error?.detail || "Failed to refresh session");
    }

    const tokenData = await parseJsonSafe(res);
    if (tokenData?.accessToken) {
      this.persistToken(tokenData.accessToken);
      if (this.currentUser) {
        this.currentUser = {
          ...this.currentUser,
          onboardingCompleted: true,
          onboardingStep: 5,
        };
        if (typeof window !== "undefined") {
          sessionStorage.setItem("lumina_user", JSON.stringify(this.currentUser));
        }
      }
    }
    return tokenData ?? {};
  }

  // Enrollment
  async redeemEnrollmentCode(code: string) {
    const res = await this.fetchAuthorized("/api/enroll", { method: "POST", body: JSON.stringify({ code })});
    return await parseJsonSafe(res) ?? {};
  }

  // --- Admin Hierarchy Management ---
  async getInstitutions(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/admin/institutions");
    return res.ok ? await res.json() : [];
  }

  async createInstitution(data: any): Promise<any> {
    const res = await this.fetchAuthorized("/api/admin/institutions", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return await parseJsonSafe(res) ?? {};
  }

  async getAllUsers(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/admin/users");
    return res.ok ? await res.json() : [];
  }

  async adminCreateUser(data: { name: string; email: string; password: string; role: string }): Promise<any> {
    const res = await this.fetchAuthorized("/api/admin/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return await parseJsonSafe(res) ?? {};
  }

  async deleteUser(userId: string): Promise<any> {
    const res = await this.fetchAuthorized(`/api/admin/users/${userId}`, {
      method: "DELETE",
    });
    return res.ok ? { success: true } : (await parseJsonSafe(res) ?? { success: false });
  }

  async updateUserStatus(userId: string, status: string): Promise<any> {
    const res = await this.fetchAuthorized(
      `/api/admin/users/${userId}/status?status=${encodeURIComponent(status)}`,
      { method: "POST" },
    );
    return await parseJsonSafe(res) ?? {};
  }

  async updateUserRole(userId: string, role: string): Promise<any> {
    const res = await this.fetchAuthorized(
      `/api/admin/users/${userId}/role?role=${encodeURIComponent(role)}`,
      { method: "POST" },
    );
    return await parseJsonSafe(res) ?? {};
  }

  async getConnections(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/admin/connections");
    return res.ok ? await res.json() : [];
  }

  async linkStakeholder(data: any): Promise<any> {
    const res = await this.fetchAuthorized("/api/admin/connections/link", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return await parseJsonSafe(res) ?? {};
  }

  async getDepartments(institutionId?: string): Promise<any[]> {
    const path = institutionId
      ? `/api/admin/institutions/${institutionId}/departments`
      : "/api/admin/departments";
    const res = await this.fetchAuthorized(path);
    return res.ok ? await res.json() : [];
  }

  async createAdminDepartment(data: any): Promise<any> {
    const res = await this.fetchAuthorized("/api/admin/departments", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return await parseJsonSafe(res) ?? {};
  }

  async updateDepartment(institutionId: string, deptId: string, data: any): Promise<any> {
    const res = await this.fetchAuthorized(
      `/api/admin/institutions/${institutionId}/departments/${deptId}`,
      { method: "PATCH", body: JSON.stringify(data) },
    );
    return await parseJsonSafe(res) ?? {};
  }

  async assignHod(institutionId: string, deptId: string, hodId: string): Promise<any> {
    const res = await this.fetchAuthorized(
      `/api/admin/institutions/${institutionId}/departments/${deptId}/hod`,
      { method: "PATCH", body: JSON.stringify({ hod_id: hodId }) },
    );
    return await parseJsonSafe(res) ?? {};
  }

  async deleteAdminDepartment(deptId: string): Promise<any> {
    const res = await this.fetchAuthorized(`/api/admin/departments/${deptId}`, { method: "DELETE" });
    return res.ok ? { success: true } : (await parseJsonSafe(res) ?? { success: false });
  }

  async getPrograms(institutionId: string): Promise<any[]> {
    const res = await this.fetchAuthorized(`/api/admin/institutions/${institutionId}/programs`);
    return res.ok ? await res.json() : [];
  }

  async createProgram(institutionId: string, data: any): Promise<any> {
    const res = await this.fetchAuthorized(
      `/api/admin/institutions/${institutionId}/programs`,
      { method: "POST", body: JSON.stringify(data) },
    );
    return await parseJsonSafe(res) ?? {};
  }

  async getSemesters(programId: string): Promise<any[]> {
    const res = await this.fetchAuthorized(`/api/admin/programs/${programId}/semesters`);
    return res.ok ? await res.json() : [];
  }

  async createSemester(programId: string, data: any): Promise<any> {
    const res = await this.fetchAuthorized(
      `/api/admin/programs/${programId}/semesters`,
      { method: "POST", body: JSON.stringify(data) },
    );
    return await parseJsonSafe(res) ?? {};
  }

  async getClasses(programId?: string, semesterId?: string): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/admin/classes");
    if (!res.ok) return [];
    const all = await res.json();
    return all.filter((c: any) => {
      if (programId && c.program_id !== programId) return false;
      if (semesterId && c.semester_id !== semesterId) return false;
      return true;
    });
  }

  async getPublicClasses(programId?: string, semesterId?: string): Promise<any[]> {
    return this.getClasses(programId, semesterId);
  }

  async createAdminClass(data: any): Promise<any> {
    const res = await this.fetchAuthorized("/api/admin/classes", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return await parseJsonSafe(res) ?? {};
  }

  async updateClass(classId: string, data: any): Promise<any> {
    const res = await this.fetchAuthorized(`/api/admin/classes/${classId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return await parseJsonSafe(res) ?? {};
  }

  async deleteAdminClass(classId: string): Promise<any> {
    const res = await this.fetchAuthorized(`/api/admin/classes/${classId}`, { method: "DELETE" });
    return res.ok ? { success: true } : (await parseJsonSafe(res) ?? { success: false });
  }

  async getClassSummary(classId: string): Promise<any> {
    const res = await this.fetchAuthorized(`/api/admin/classes/${classId}/summary`);
    return res.ok ? await res.json() : {};
  }

  async getRoleMatrix(): Promise<any> {
    const res = await this.fetchAuthorized("/api/admin/roles/matrix");
    return res.ok ? await res.json() : { roles: [], permissions: {} };
  }

  async updateRoleMatrix(matrix: { roles: string[]; permissions: Record<string, string[]> }): Promise<any> {
    const res = await this.fetchAuthorized("/api/admin/roles/matrix", {
      method: "POST",
      body: JSON.stringify(matrix),
    });
    return await parseJsonSafe(res) ?? {};
  }

  async getSystemHealth(): Promise<any> {
    const res = await this.fetchAuthorized("/api/admin/health");
    return res.ok ? await res.json() : {};
  }

  async getGuardianSignals(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/admin/guardian");
    return res.ok ? await res.json() : [];
  }

  async getVerificationQueue(): Promise<any> {
    const res = await this.fetchAuthorized("/api/admin/queue-health");
    return res.ok ? await res.json() : {};
  }

  async getAdminCourses(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/admin/courses");
    return res.ok ? await res.json() : [];
  }

  async getAiPrompts(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/admin/ai/prompts");
    return res.ok ? await res.json() : [];
  }

  async getAiModels(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/admin/ai/models");
    return res.ok ? await res.json() : [];
  }

  async getAiCosts(): Promise<any> {
    const res = await this.fetchAuthorized("/api/admin/ai/costs");
    return res.ok ? await res.json() : {};
  }

  async getTeacherRequests(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/hod/requests");
    return res.ok ? await res.json() : [];
  }

  async updateTeacherRequest(requestId: string, status: string): Promise<any> {
    const res = await this.fetchAuthorized(`/api/hod/requests/${requestId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    return await parseJsonSafe(res) ?? {};
  }

  // --- Assignments & Submissions Internal ---
  async getAssignments(courseId?: string, studentId?: string) {
    const query = new URLSearchParams();
    if (courseId) query.append("course_id", courseId);
    if (studentId) query.append("student_id", studentId);
    const res = await this.fetchAuthorized(`/api/assignments/list?${query.toString()}`);
    return res.ok ? await res.json() : [];
  }

  async getSubmissions(assignmentId: string) {
    const res = await this.fetchAuthorized(`/api/assignments/${assignmentId}/submissions`);
    return res.ok ? await res.json() : [];
  }

  // --- Teacher / Faculty APIs ---

  /** GET /api/faculty/subjects — returns teacher's assigned courses */
  async getTeacherCourses(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/faculty/subjects");
    if (!res.ok) return [];
    const data = await res.json();
    // Transform { assignment, course } pairs into a flat course list
    return (data || []).map((item: any) => {
      const course = item.course || {};
      return {
        id: course.id || item.assignment?.course_id,
        title: course.name || course.title || "Untitled Course",
        status: course.status || "active",
        students: course.enrolled_count || 0,
        level: course.level || "Undergraduate",
        image: course.thumbnail_url || "",
        lastUpdated: course.updated_at ? new Date(course.updated_at).toLocaleDateString() : "N/A",
        code: course.code || "",
      };
    });
  }

  /** GET /api/faculty/students/{batchId} — returns students for a batch */
  async getTeacherStudents(batchId?: string): Promise<any[]> {
    if (batchId) {
      const res = await this.fetchAuthorized(`/api/faculty/students/${batchId}`);
      return res.ok ? await res.json() : [];
    }
    // No batchId: get subjects first, collect unique batch_ids from assignments
    const subjects = await this.fetchAuthorized("/api/faculty/subjects");
    if (!subjects.ok) return [];
    const data = await subjects.json();
    const batchIds = [...new Set((data || []).map((item: any) => item.assignment?.class_id).filter(Boolean))] as string[];
    if (!batchIds.length) return [];
    const allStudents = await Promise.all(
      batchIds.map(async (bid: string) => {
        const r = await this.fetchAuthorized(`/api/faculty/students/${bid}`);
        return r.ok ? await r.json() : [];
      })
    );
    // Merge and deduplicate by id
    const seen = new Set<string>();
    return allStudents.flat().filter((s: any) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }

  /** DELETE /api/courses/{id} — remove a course */
  async deleteCourse(courseId: string): Promise<any> {
    const res = await this.fetchAuthorized(`/api/courses/${courseId}`, { method: "DELETE" });
    return res.ok ? { success: true } : (await parseJsonSafe(res) ?? { success: false });
  }

  /** POST /api/assignments/create — create an assignment (form data) */
  async createAssignment(payload: { title: string; course_id: string; description: string; due_date: string }): Promise<any> {
    const form = new FormData();
    form.append("title", payload.title);
    form.append("course_id", payload.course_id);
    form.append("description", payload.description);
    form.append("due_date", payload.due_date);
    const res = await this.fetchAuthorized("/api/assignments/create", {
      method: "POST",
      body: form,
    });
    return res.ok ? await res.json() : null;
  }

  /** GET /api/teacher/students/{id}/analytics — student detail analytics */
  async getPersonalizationProfile(studentId: string): Promise<any> {
    const res = await this.fetchAuthorized(`/api/teacher/students/${studentId}/analytics`);
    return res.ok ? await res.json() : null;
  }

  /** GET /api/teacher/alerts — teacher at-risk alerts */
  async getTeacherAlerts(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/teacher/alerts");
    return res.ok ? await res.json() : [];
  }

  /** GET /api/teacher/verification/queue — teacher verification queue */
  async getTeacherVerificationQueue(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/teacher/verification/queue");
    return res.ok ? await res.json() : [];
  }

  // --- Legacy Compatibility ---
  async init(..._args: any[]): Promise<RealAPI> { return this; }
  async getAllCourses(..._args: any[]): Promise<any> { return this.listCourses(); }
  async getExploreCourses(..._args: any[]): Promise<any> {
    const [enrolled, catalog] = await Promise.all([
      this.getStudentCourses(),
      this.listCourses(this.currentUser?.deptId || undefined),
    ]);
    const enrolledIds = new Set((enrolled || []).map((course: any) => String(course.id)));
    const recommended = (catalog || [])
      .filter((course: any) => course?.id && !enrolledIds.has(String(course.id)))
      .map((course: any) => ({
        ...course,
        name: course.name || course.course_name || course.title,
        title: course.title || course.name || course.course_name,
        description: course.description || "",
      }));
    return { enrolled, recommended };
  }
  async searchCourses(query?: string, ..._args: any[]): Promise<any> {
    const courses = await this.listCourses();
    if (!query) return courses;
    const normalized = String(query).toLowerCase();
    return courses.filter((course: any) =>
      JSON.stringify(course).toLowerCase().includes(normalized),
    );
  }
  async getCourseDetails(courseId: string, ..._args: any[]): Promise<any> {
    return this.fetchJsonOrDefault(`/api/courses/${courseId}`, null);
  }
  async createCourse(data: any = {}, ..._args: any[]): Promise<any> {
    return this.fetchJsonOrDefault("/api/courses", { success: false }, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  async updateCourseDetails(courseId: string, data: any = {}, ..._args: any[]): Promise<any> {
    return this.fetchJsonOrDefault(`/api/courses/${courseId}`, { success: false }, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }
  async publishCourse(courseId: string, ..._args: any[]): Promise<any> {
    return this.fetchJsonOrDefault(`/api/courses/${courseId}/publish`, { success: false }, {
      method: "POST",
    });
  }
  async enrollInCourse(courseId: string, ..._args: any[]): Promise<any> {
    return this.fetchJsonOrDefault(`/api/student/enroll`, { success: false }, {
      method: "POST",
      body: JSON.stringify({ course_id: courseId }),
    });
  }
  async addModule(..._args: any[]): Promise<any> { return { success: false }; }
  async deleteModule(..._args: any[]): Promise<any> { return { success: false }; }
  async addLesson(..._args: any[]): Promise<any> { return { success: false }; }
  async deleteLesson(..._args: any[]): Promise<any> { return { success: false }; }
  async completeLesson(..._args: any[]): Promise<any> { return { success: true }; }
  async updateStudentProgress(..._args: any[]): Promise<any> { return { success: true }; }
  async saveQuizResult(..._args: any[]): Promise<any> { return { success: true }; }
  async uploadHandwriting(..._args: any[]): Promise<any> { return { success: false }; }
  async getStudentProfile(..._args: any[]): Promise<any> {
    return this.fetchJsonOrDefault("/api/student/profile", this.currentUser);
  }
  async getStudentBadges(..._args: any[]): Promise<any> {
    return this.fetchJsonOrDefault("/api/student/badges", []);
  }
  async getStudentCertificates(..._args: any[]): Promise<any> {
    return this.fetchJsonOrDefault("/api/student/certificates", []);
  }
  async getStudentMastery(..._args: any[]): Promise<any> {
    const payload = await this.fetchJsonOrDefault("/api/student/profile/mastery", {});
    return payload?.masteryMap || payload || {};
  }
  async getParentDashboard(..._args: any[]): Promise<any> { return this.getDashboardData("parent"); }
  async setParentGoal(..._args: any[]): Promise<any> { return { success: false }; }
  async getHODDashboard(..._args: any[]): Promise<any> { return this.getDashboardData("hod"); }
  async getMentorMatches(..._args: any[]): Promise<any> {
    return this.fetchJsonOrDefault("/api/mentor/matches", []);
  }
  async getMentorSessions(..._args: any[]): Promise<any> {
    return this.fetchJsonOrDefault("/api/mentor/sessions", []);
  }
  async submitPortfolioReview(payload: any = {}, ..._args: any[]): Promise<any> {
    return this.fetchJsonOrDefault("/api/mentor/portfolio-review", { success: false }, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
  async getAlumniPortfolio(..._args: any[]): Promise<any> {
    return this.fetchJsonOrDefault("/api/alumni/portfolio", null);
  }
  async getAlumniMentorshipMentees(..._args: any[]): Promise<any> { return []; }
  async getPeerTutorSessions(..._args: any[]): Promise<any> { return []; }
  async getPeerTutorTraining(..._args: any[]): Promise<any> { return []; }
  async getCounselorCases(..._args: any[]): Promise<any> { return []; }
  async logSafeguardingEvent(..._args: any[]): Promise<any> { return { success: true }; }
  async updateIntervention(..._args: any[]): Promise<any> { return { success: true }; }
  async getRiskAlerts(..._args: any[]): Promise<any> { return []; }
  async getMisconceptionClusters(..._args: any[]): Promise<any> { return []; }
  async getABTestPerformance(..._args: any[]): Promise<any> { return {}; }
  async getCurriculumScope(..._args: any[]): Promise<any> { return {}; }
  async getCreatorVerificationQueue(..._args: any[]): Promise<any> { return []; }
  async getContentCreatorBlueprints(..._args: any[]): Promise<any> { return []; }
  async getAnonymizedSnapshots(..._args: any[]): Promise<any> { return []; }
  async getCommunityData(channelId = "general", ..._args: any[]): Promise<any> {
    return this.fetchJsonOrDefault(`/api/community/data?channel_id=${encodeURIComponent(channelId)}`, {
      channels: [],
      messages: [],
    });
  }
  async getAllChatRooms(..._args: any[]): Promise<any> { return []; }
  async getChatMessages(..._args: any[]): Promise<any> { return []; }
  async getChatHistory(..._args: any[]): Promise<any> { return []; }
  async sendChatMessage(..._args: any[]): Promise<any> { return { success: false }; }
  async saveChatMessage(..._args: any[]): Promise<any> { return { success: false }; }
  async sendCommunityMessage(channelId: string, content: string, ..._args: any[]): Promise<any> {
    const res = await this.fetchAuthorized("/api/community/send", {
      method: "POST",
      body: JSON.stringify({ channel_id: channelId, content }),
    });
    if (!res.ok) {
      const e = await parseJsonSafe(res);
      throw new Error(e?.detail || "Failed to send community message");
    }
    return await parseJsonSafe(res) ?? { success: false };
  }
  async chatWithAI(..._args: any[]): Promise<any> { return { response: "" }; }
  async logAIInteraction(..._args: any[]): Promise<any> { return { success: true }; }
  async logActivity(data: { course_id: string; duration_minutes: number }, ..._args: any[]): Promise<any> {
    return this.fetchJsonOrDefault("/api/student/log-activity", { success: false }, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  async exportData(..._args: any[]): Promise<any> { return { success: false }; }
  async importData(..._args: any[]): Promise<any> { return { success: false }; }
  async getAllChatUsers(..._args: any[]): Promise<any> { return []; }
  async searchUsers(query?: string, ..._args: any[]): Promise<any> {
    const users = await this.getAllUsers();
    if (!query) return users;
    const normalized = String(query).toLowerCase();
    return users.filter((user: any) =>
      JSON.stringify(user).toLowerCase().includes(normalized),
    );
  }
  async listFacultyByDept(deptId?: string, ..._args: any[]): Promise<any> {
    if (!this.currentUser?.collegeId) return [];
    const users = await this.listCollegeUsers(this.currentUser.collegeId, { deptId });
    return users.filter((user: any) => ["faculty", "teacher", "hod"].includes(user.role));
  }
  async inviteStudent(..._args: any[]): Promise<any> { return { success: false }; }
  async approveTeacherRequest(requestId: string, ..._args: any[]): Promise<any> {
    return this.updateTeacherRequest(requestId, "approved");
  }
  async rejectTeacherRequest(requestId: string, ..._args: any[]): Promise<any> {
    return this.updateTeacherRequest(requestId, "rejected");
  }
  async requestTeacherAssignment(..._args: any[]): Promise<any> { return { success: false }; }
  async createNote(data: any = {}, ..._args: any[]): Promise<any> {
    return this.fetchJsonOrDefault("/api/student/notes", { success: false }, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  async updateNote(noteId: string, data: any = {}, ..._args: any[]): Promise<any> {
    return this.fetchJsonOrDefault(`/api/student/notes/${noteId}`, { success: false }, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
  async deleteNote(noteId: string, ..._args: any[]): Promise<any> {
    return this.fetchJsonOrDefault(`/api/student/notes/${noteId}`, { success: false }, {
      method: "DELETE",
    });
  }
  async getNotes(..._args: any[]): Promise<any> {
    return this.fetchJsonOrDefault("/api/student/notes", []);
  }
  async updateProfile(data: any = {}, ..._args: any[]): Promise<any> {
    const response = await this.fetchJsonOrDefault("/api/student/profile/update", null, {
      method: "POST",
      body: JSON.stringify(data),
    });
    const nextUser = this.currentUser ? { ...this.currentUser, ...data } : data;
    this.currentUser = nextUser;
    if (typeof window !== "undefined") {
      sessionStorage.setItem("lumina_user", JSON.stringify(nextUser));
    }
    return response ?? nextUser;
  }

  // --- Aliases & Legacy ---
  async listSubjects(deptId: string) { return this.architectureListSubjects(deptId); }
  async listBatches(deptId: string) { return this.architectureListBatches(deptId); }
  async createBatch(deptId: string, data: any) { return this.architectureCreateBatch(deptId, data); }
  async createSubject(deptId: string, data: any) { return this.architectureCreateSubject(deptId, data); }
  async inviteUser(collegeId: string, data: any) { return this.architectureInviteUser(collegeId, data); }
  async createCollege(data: any) { return this.architectureCreateCollege(data); }
  async updateCollege(collegeId: string, data: any) { return this.architectureUpdateCollege(collegeId, data); }
  async createDepartment(collegeId: string, data: any) { return this.architectureCreateDepartment(collegeId, data); }

  // --- Unit PDF Pipeline (Teacher Content Engine) ---
  async uploadUnitPDF(file: File, title?: string): Promise<{ unit: any; job: any }> {
    const form = new FormData();
    form.append("file", file);
    if (title) form.append("title", title);
    const res = await this.fetchAuthorized("/api/teacher/units/upload", { method: "POST", body: form });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || "Upload failed"); }
    return res.json();
  }

  async getUnit(unitId: string): Promise<any> {
    return this.fetchJsonOrDefault(`/api/teacher/units/${unitId}`, null);
  }

  async listUnits(): Promise<any[]> {
    return this.fetchJsonOrDefault("/api/teacher/units", []);
  }

  async generateUnitPresentation(unitId: string): Promise<any> {
    const res = await this.fetchAuthorized(`/api/teacher/units/${unitId}/generate-ppt`, { method: "POST" });
    return res.json().catch(() => ({}));
  }

  // --- Handwritten Assignment System ---
  async createHandwrittenAssignment(data: { title: string; description: string; total_marks: number }): Promise<any> {
    const form = new FormData();
    form.append("title", data.title);
    form.append("description", data.description);
    form.append("total_marks", String(data.total_marks));
    const res = await this.fetchAuthorized("/api/handwritten/assignments", { method: "POST", body: form });
    if (!res.ok) throw new Error("Failed to create assignment");
    return res.json();
  }

  async submitHandwrittenAssignment(assignmentId: string, file: File): Promise<any> {
    const form = new FormData();
    form.append("assignment_id", assignmentId);
    form.append("file", file);
    const res = await this.fetchAuthorized("/api/handwritten/submissions", { method: "POST", body: form });
    if (!res.ok) throw new Error("Failed to submit");
    return res.json();
  }

  async getHandwrittenSubmission(submissionId: string): Promise<any> {
    return this.fetchJsonOrDefault(`/api/handwritten/submissions/${submissionId}`, null);
  }

  async teacherGradeHandwritten(submissionId: string, questionId: string, score: number, feedback: string): Promise<any> {
    const res = await this.fetchAuthorized(
      `/api/handwritten/submissions/${submissionId}/questions/${questionId}/grade`,
      { method: "PUT", body: JSON.stringify({ teacher_score: score, teacher_feedback: feedback }) }
    );
    if (!res.ok) throw new Error("Grade save failed");
    return res.json();
  }
}

export const api = RealAPI.getInstance();

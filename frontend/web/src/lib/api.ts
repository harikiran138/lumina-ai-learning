// API client for the Lumina FastAPI backend

const LOCAL_API_BASE = "http://127.0.0.1:8000";
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);

export function getConfiguredApiBase(): string | null {
  const explicitBase =
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE?.trim();

  if (explicitBase) {
    return explicitBase.replace(/\/+$/, "");
  }

  if (
    typeof window !== "undefined" &&
    LOCAL_HOSTNAMES.has(window.location.hostname)
  ) {
    return LOCAL_API_BASE;
  }

  return null;
}

export function getConfiguredAuthBase(): string | null {
  const explicitBase = process.env.NEXT_PUBLIC_AUTH_URL?.trim();
  if (explicitBase) return explicitBase.replace(/\/+$/, "");
  
  // Default to API base for auth if not explicitly set
  return getConfiguredApiBase();
}

export function requireApiBase(): string {
  const apiBase = getConfiguredApiBase();
  if (apiBase) {
    return apiBase;
  }

  throw new Error(
    "API is not configured for this deployment. Set NEXT_PUBLIC_API_URL in Vercel.",
  );
}

export function requireAuthBase(): string {
  const authBase = getConfiguredAuthBase();
  if (authBase) return authBase;
  throw new Error("Auth API is not configured. Set NEXT_PUBLIC_AUTH_URL or NEXT_PUBLIC_API_URL");
}

// ── Cookie helpers for auth token ────────────────────────────────────────────
function setAuthCookie(token: string): void {
  if (typeof document === 'undefined') return
  // Align with middleware and backend name
  document.cookie = `access_token=${token}; path=/; SameSite=Lax; max-age=86400`
}

// ── Fetch with retry + timeout ────────────────────────────────────────────────
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  timeoutMs = 60000
): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.warn(`[API] Request timed out after ${timeoutMs}ms: ${url}`);
      const reason =
        typeof DOMException !== 'undefined'
          ? new DOMException(`Request timed out after ${timeoutMs}ms`, 'AbortError')
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
              setAuthCookie(token);
          } else {
            // Clear all possible auth cookies
            document.cookie = `access_token=; path=/; SameSite=Lax; max-age=0`;
            document.cookie = `refresh_token=; path=/; SameSite=Lax; max-age=0`;
            document.cookie = `auth_token=; path=/; SameSite=Lax; max-age=0`;
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
    timeoutMs?: number
  ): Promise<Response> {
    const fullUrl = `${this.getApiBase()}${path}`;

    try {
      let headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      };

      if (this.token) {
        headers = { ...headers, "Authorization": `Bearer ${this.token}` };
      }

      // If body is FormData, delete Content-Type to let browser set it with boundary
      if (options.body instanceof FormData) {
        if (headers instanceof Headers) {
          headers.delete("Content-Type");
        } else {
          delete (headers as any)["Content-Type"];
        }
      }

      let response = await fetchWithRetry(fullUrl, {
        ...options,
        headers,
        credentials: "include",
      }, 3, timeoutMs);

      if (response.status === 401) {
        const refreshed = await this.handleUnauthorized()
        if (refreshed) {
          const newHeaders = new Headers(headers);
          if (this.token) {
            newHeaders.set("Authorization", `Bearer ${this.token}`);
          } else {
            newHeaders.delete("Authorization");
          }
          return fetchWithRetry(fullUrl, {
            ...options,
            headers: newHeaders,
            credentials: "include",
          }, 3, timeoutMs)
        }
      }
      return response;
    } catch (err) {
      console.error(`fetchAuthorized caught network/CORS error for ${path}:`, err);
      throw err;
    }
  }

  private async fetchJsonOrDefault<T>(
    path: string,
    defaultValue: T,
    options: RequestInit = {},
    timeoutMs?: number
  ): Promise<T> {
    try {
      const res = await this.fetchAuthorized(path, options, timeoutMs);
      if (!res.ok) return defaultValue;
      return (await res.json()) as T;
    } catch (err) {
      console.error(`Error fetching ${path}:`, err);
      return defaultValue;
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
      throw new Error(error?.detail || `Authentication failed (${res.status})`);
    }
    const tokenData = await parseJsonSafe(res);
    if (tokenData.forcePasswordChange) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("temp_token", tokenData.tempToken);
      }
      const userEmail = tokenData.user?.email || identifier;
      const forcedUser: User = {
        id: tokenData.user?.id || "",
        email: userEmail,
        name: userEmail.split("@")[0],
        role: "student",
        status: "active",
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userEmail.split("@")[0])}&background=random`,
        createdAt: new Date().toISOString(),
        mustChangePassword: true,
      };
      this.currentUser = forcedUser;
      return forcedUser;
    }
    
    // Express backend sets the cookies automatically.
    const userData = tokenData.user;
    if (!userData) throw new Error("Login failed: User data not found in response.");

    // Some deployment configurations return the access token in the JSON response
    // body in addition to (or instead of) setting it as an HTTP-only cookie.
    // Persist it here so that fetchAuthorized can attach it as a Bearer header.
    if (tokenData.accessToken) {
      this.persistToken(tokenData.accessToken);
    }

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

    return this.currentUser;
  }

  async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) return this.currentUser;
    // After a page refresh the in-memory value is lost; re-hydrate from the
    // backend using the HTTP-only cookie that was already set during login.
    try {
      const res = await this.fetchAuthorized("/api/auth/me");
      if (res.ok) {
        const userData = await parseJsonSafe(res);
        if (userData?.id) {
          const displayName = userData.fullName || userData.name || userData.email;
          this.currentUser = {
            id: userData.id,
            email: userData.email,
            name: displayName,
            role: userData.role,
            onboardingStep: userData.onboardingStep ?? 0,
            onboardingCompleted: (userData.onboardingStep ?? 0) >= 5,
            mustChangePassword: userData.mustChangePassword ?? false,
            collegeId: userData.collegeId ?? null,
            deptId: userData.deptId ?? null,
            batchId: userData.batchId ?? null,
            avatar:
              userData.profilePhotoUrl ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`,
            status: userData.status || "active",
            createdAt: userData.created_at || new Date().toISOString(),
            preferences: userData.preferences || {},
          };
          return this.currentUser;
        }
      }
    } catch {
      // Network error or not authenticated – return null below
    }
    return null;
  }

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
    if (!res.ok) { const e = await parseJsonSafe(res); throw new Error(e?.detail || "Registration failed"); }
    return this.login(userData.email!, userData.password);
  }

  async logout(): Promise<void> {
    try {
      // 1. Clear Supabase session globally as requested
      const { supabase } = await import("@/lib/supabase");
      await supabase.auth.signOut();

      // 2. Call backend to clear HTTP-only cookies and blacklist token
      await fetch(`${requireAuthBase()}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.warn("Logout request failed:", err);
    } finally {
      // 3. Clear local state and client-side cookies
      this.currentUser = null;
      this.persistToken(null);
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
    if (!res.ok) return { success: false };
    return await parseJsonSafe(res) ?? {};
  }

  async completeOnboarding(): Promise<any> {
    const res = await this.fetchAuthorized("/api/onboarding/complete", { method: "POST" });
    if (!res.ok) return { success: false };
    return await parseJsonSafe(res) ?? {};
  }

  // --- Dashboard ---
  async getDashboardData(userRole: string): Promise<any> {
    const roleMap: Record<string, string> = {
      student: "/api/student/dashboard",
      teacher: "/api/teacher/dashboard",
      faculty: "/api/faculty/dashboard",
      admin: "/api/admin/dashboard",
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
  async architectureCreateCollege(data: any) {
    const res = await this.fetchAuthorized(`/api/colleges`, { method: "POST", body: JSON.stringify(data)});
    return await parseJsonSafe(res) ?? {};
  }
  async architectureUpdateCollege(collegeId: string, data: any) {
    const res = await this.fetchAuthorized(`/api/colleges/${collegeId}`, { method: "PATCH", body: JSON.stringify(data)});
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

  // Enrollment
  async redeemEnrollmentCode(code: string) {
    const res = await this.fetchAuthorized("/api/enroll/redeem", { method: "POST", body: JSON.stringify({ code })});
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

  /** GET /api/courses/teacher/students/{id}/analytics — student detail analytics */
  async getPersonalizationProfile(studentId: string): Promise<any> {
    const res = await this.fetchAuthorized(`/api/courses/teacher/students/${studentId}/analytics`);
    return res.ok ? await res.json() : null;
  }

  /** GET /api/courses/teacher/alerts — teacher at-risk alerts */
  async getTeacherAlerts(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/courses/teacher/alerts");
    return res.ok ? await res.json() : [];
  }

  /** GET /api/courses/teacher/verification/queue — teacher verification queue */
  async getTeacherVerificationQueue(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/courses/teacher/verification/queue");
    return res.ok ? await res.json() : [];
  }

  // --- Legacy Compatibility ---
  async init(..._args: any[]): Promise<RealAPI> { return this; }
  async getAllCourses(..._args: any[]): Promise<any> { return this.listCourses(); }
  async getExploreCourses(..._args: any[]): Promise<any> { return this.listCourses(); }
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
    return this.fetchJsonOrDefault(`/api/student/courses/${courseId}/enroll`, { success: false }, {
      method: "POST",
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
  async getStudentBadges(..._args: any[]): Promise<any> { return []; }
  async getStudentCertificates(..._args: any[]): Promise<any> { return []; }
  async getStudentMastery(..._args: any[]): Promise<any> { return {}; }
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
  async getAlumniSessions(..._args: any[]): Promise<any> { return []; }
  async getAlumniJobBoard(..._args: any[]): Promise<any> { return []; }
  async postAlumniJob(payload: any = {}, ..._args: any[]): Promise<any> {
    return this.fetchJsonOrDefault("/api/alumni/jobs", { success: false }, { method: "POST", body: JSON.stringify(payload) });
  }
  async getAlumniNetwork(..._args: any[]): Promise<any> { return []; }
  async getAlumniReports(..._args: any[]): Promise<any> { return {}; }
  async getAlumniNotifications(..._args: any[]): Promise<any> { return []; }
  async submitAlumniCurriculumFeedback(payload: any = {}, ..._args: any[]): Promise<any> {
    return this.fetchJsonOrDefault("/api/alumni/curriculum-feedback", { success: false }, { method: "POST", body: JSON.stringify(payload) });
  }
  async submitAlumniInterviewFeedback(payload: any = {}, ..._args: any[]): Promise<any> {
    return this.fetchJsonOrDefault("/api/alumni/interview-feedback", { success: false }, { method: "POST", body: JSON.stringify(payload) });
  }
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
  async getCommunityData(..._args: any[]): Promise<any> { return { channels: [], messages: [] }; }
  async getAllChatRooms(..._args: any[]): Promise<any> { return []; }
  async getChatMessages(..._args: any[]): Promise<any> { return []; }
  async getChatHistory(..._args: any[]): Promise<any> { return []; }
  async sendChatMessage(..._args: any[]): Promise<any> { return { success: false }; }
  async saveChatMessage(..._args: any[]): Promise<any> { return { success: false }; }
  async sendCommunityMessage(..._args: any[]): Promise<any> { return { success: false }; }
  async chatWithAI(..._args: any[]): Promise<any> { return { response: "" }; }
  async logAIInteraction(..._args: any[]): Promise<any> { return { success: true }; }
  async logActivity(..._args: any[]): Promise<any> { return { success: true }; }
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
  async listFacultyByDept(_deptId?: string, ..._args: any[]): Promise<any> { return []; }
  async inviteStudent(..._args: any[]): Promise<any> { return { success: false }; }
  async approveTeacherRequest(requestId: string, ..._args: any[]): Promise<any> {
    return this.updateTeacherRequest(requestId, "approved");
  }
  async rejectTeacherRequest(requestId: string, ..._args: any[]): Promise<any> {
    return this.updateTeacherRequest(requestId, "rejected");
  }
  async requestTeacherAssignment(..._args: any[]): Promise<any> { return { success: false }; }
  async createNote(..._args: any[]): Promise<any> { return { success: false }; }
  async updateNote(..._args: any[]): Promise<any> { return { success: false }; }
  async deleteNote(..._args: any[]): Promise<any> { return { success: false }; }
  async getNotes(..._args: any[]): Promise<any> { return []; }
  async updateProfile(data: any = {}, ..._args: any[]): Promise<any> {
    const nextUser = this.currentUser ? { ...this.currentUser, ...data } : data;
    this.currentUser = nextUser;
    if (typeof window !== "undefined") {
      sessionStorage.setItem("lumina_user", JSON.stringify(nextUser));
    }
    return nextUser;
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
    const res = await this.fetchAuthorized("/api/teacher/units/upload", { method: "POST", body: form }, 180000);
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
    const res = await this.fetchAuthorized(`/api/teacher/units/${unitId}/generate-ppt`, { method: "POST" }, 120000);
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

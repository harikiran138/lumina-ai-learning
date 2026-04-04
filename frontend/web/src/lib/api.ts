// API client for the Lumina FastAPI backend

const HOSTED_API_BASE = "/api";
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);

export function getConfiguredApiBase(): string | null {
  const explicitBase =
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE?.trim();

  if (typeof window !== "undefined") {
    const isLocalHost = LOCAL_HOSTNAMES.has(window.location.hostname);
    if (isLocalHost) {
      return explicitBase ? explicitBase.replace(/\/+$/, "") : HOSTED_API_BASE;
    }

    if (!explicitBase) {
      return HOSTED_API_BASE;
    }

    if (explicitBase.startsWith("/")) {
      return explicitBase.replace(/\/+$/, "") || "/";
    }

    try {
      const parsed = new URL(explicitBase);
      if (parsed.origin !== window.location.origin && parsed.hostname.endsWith(".onrender.com")) {
        // Prefer same-origin `/api` on hosted frontends so cookies and auth flows
        // work through the Vercel rewrite instead of cross-origin browser CORS.
        return HOSTED_API_BASE;
      }
    } catch {
      return explicitBase.replace(/\/+$/, "");
    }

    return explicitBase.replace(/\/+$/, "");
  }

  return explicitBase ? explicitBase.replace(/\/+$/, "") : null;
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

function hasCookie(name: string): boolean {
  if (typeof document === "undefined") return false;
  const prefix = `${name}=`;
  return document.cookie.split(";").some((part) => part.trim().startsWith(prefix));
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

      // Stop retrying on 429 Too Many Requests
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please wait a moment before trying again.");
      }

      // Retry on 5xx Server Errors - but include response body for better debugging
      if (!response.ok && response.status >= 500) {
        const clonedResponse = response.clone();
        const errorBody = await clonedResponse.text().catch(() => "");
        console.error(`[API] Server Error ${response.status}:`, errorBody.substring(0, 500));
        throw new Error(`Server Error: ${response.status} - ${errorBody || 'Internal server error'}`)
      }

      return response
    } catch (err: any) {
      // Robust Local Hostname Fallback:
      // On some OS environments (especially macOS), a process may bind only to IPv4 (127.0.0.1) 
      // but the browser resolves 'localhost' to IPv6 (::1). Fallback bi-directionally.
      if (err instanceof TypeError && (url.includes("localhost") || url.includes("127.0.0.1"))) {
        const isCurrentlyLocalhost = url.includes("localhost")
        const fallbackUrl = isCurrentlyLocalhost 
          ? url.replace("localhost", "127.0.0.1") 
          : url.replace("127.0.0.1", "localhost")
        
        if (attempt <= retries) {
          console.warn(`[Lumina API] Fetch failed for ${url}, trying fallback to ${fallbackUrl}`)
          // Call recursive but decrement from the ORIGINAL budget, don't restart attempts.
          // Since we're halfway through an attempt, this is part of the current attempt's recovery.
          return fetchWithRetry(fallbackUrl, options, retries - 1, timeoutMs)
        }
      }

      if (attempt === retries) {
        if (err instanceof TypeError && err.message === "Failed to fetch") {
          const isLocal = url.includes("localhost") || url.includes("127.0.0.1") || url.includes(":8000");
          const msg = isLocal 
            ? `[Lumina API] Network Error: Failed to fetch from ${url}. Is the local backend running on port 8000?`
            : `[Lumina API] Network Error: Failed to connect to ${url}. This may be a CORS issue or the server may be down.`;
          console.error(msg, err);
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

function formatApiIssue(issue: any): string | null {
  if (!issue) return null;
  if (typeof issue === "string") return issue;

  const rawMessage = issue?.msg || issue?.message || issue?.detail;
  if (typeof rawMessage !== "string" || !rawMessage.trim()) return null;

  return rawMessage.replace(/^Value error,\s*/i, "").trim();
}

function extractApiErrorMessage(payload: any, fallback: string): string {
  if (!payload) return fallback;
  if (typeof payload === "string" && payload.trim()) return payload;

  const directMessage =
    (typeof payload?.detail === "string" && payload.detail) ||
    (typeof payload?.message === "string" && payload.message) ||
    (typeof payload?.error === "string" && payload.error);

  if (directMessage?.trim()) {
    return directMessage.trim();
  }

  const issues = Array.isArray(payload?.detail)
    ? payload.detail
    : Array.isArray(payload?.errors)
      ? payload.errors
      : [];

  const formattedIssues = issues
    .map((issue: any) => formatApiIssue(issue))
    .filter((message: string | null): message is string => Boolean(message));

  if (formattedIssues.length > 0) {
    return formattedIssues.join(" ");
  }

  return fallback;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "college_admin" | "admin" | "hod" | "teacher" | "student" | "parent" | "mentor" | "peer_tutor" | "counselor" | "content_creator" | "researcher" | "alumni";
  status: "active" | "suspended" | "inactive" | string;
  avatar: string;
  createdAt: string;
  onboardingCompleted?: boolean;
  adaptiveOnboardingCompleted?: boolean;
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
  private isLoggingOut = false;

  private constructor() {
  }

  private buildUrl(base: string, path: string): string {
    const b = base.replace(/\/+$/, "");
    const p = path.replace(/^\/+/, "");
    
    // If base is .../api and path is api/auth/login, we want .../api/auth/login
    // Similarly for /auth if the base already includes it.
    if (b.endsWith("/api") && p.startsWith("api/")) {
        return `${b}/${p.substring(4)}`;
    }
    
    return `${b}/${p}`;
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
        localStorage.setItem("auth_token", token);
      } else {
        localStorage.removeItem("auth_token");
        // Clear all possible auth cookies with common variations
        const names = ["access_token", "refresh_token", "auth_token"];
        const paths = ["/", "/api"];
        const domains = [window.location.hostname, `.${window.location.hostname}`, ""];

        names.forEach((name) => {
          paths.forEach((path) => {
            domains.forEach((domain) => {
              const base = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0`;
              document.cookie = base;
              if (domain) document.cookie = `${base}; domain=${domain}`;
              document.cookie = `${base}; SameSite=Lax`;
              document.cookie = `${base}; SameSite=None; Secure`;
            });
          });
        });
      }
    }
  }

  private toUser(userData: any, fallbackName?: string): User {
    const displayName = userData.fullName || userData.name || userData.email || fallbackName || "Lumina User";
    const onboardingStep = userData.onboardingStep ?? 0;
    const adaptiveCompleted = userData.adaptiveOnboardingCompleted ?? (userData.role !== "student");

    return {
      id: userData.id,
      email: userData.email,
      name: displayName,
      role: userData.role,
      onboardingStep,
      onboardingCompleted: userData.onboardingCompleted ?? (
        onboardingStep >= 5 && adaptiveCompleted
      ),
      adaptiveOnboardingCompleted: adaptiveCompleted,
      mustChangePassword: userData.mustChangePassword,
      collegeId: userData.collegeId,
      deptId: userData.deptId,
      batchId: userData.batchId,
      avatar:
        userData.profilePhotoUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`,
      status: userData.status || "active",
      createdAt: userData.created_at || new Date().toISOString(),
      preferences: userData.preferences || {},
    };
  }

  private async handleUnauthorized(): Promise<boolean> {
    if (this.isLoggingOut) return false;

    const isAuthPage =
      typeof window !== "undefined" &&
      (window.location.pathname.startsWith("/login") || window.location.pathname.startsWith("/register"));

    // Avoid a /me -> /refresh -> /login redirect storm on public auth pages
    // when the browser simply has no session cookies yet.
    if (!this.token && !hasCookie("refresh_token") && !hasCookie("access_token")) {
      if (!isAuthPage) {
        await this.logout();
      }
      return false;
    }

    try {
      const url = this.buildUrl(requireAuthBase(), "/api/auth/refresh");
      const res = await fetch(url, {
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

    if (!isAuthPage) {
      this.logout()
    }

    if (typeof window !== 'undefined' && !isAuthPage) {
      window.location.href = '/login?reason=session_expired'
    }
    return false
  }

  public async fetchAuthorized(
    path: string,
    options: RequestInit = {},
    timeoutMs?: number
  ): Promise<Response> {
    const fullUrl = this.buildUrl(this.getApiBase(), path);

    try {
      let headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      };

      const hasAuth = options.headers && (
        (options.headers instanceof Headers && options.headers.has("Authorization")) ||
        (Array.isArray(options.headers) && options.headers.some(([k]) => k.toLowerCase() === "authorization")) ||
        (typeof options.headers === "object" && Object.keys(options.headers).some(k => k.toLowerCase() === "authorization"))
      );

      if (this.token && !hasAuth) {
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

  private extractNumericStat(stats: any[], label: string): number {
    const match = (stats || []).find((item) => item?.label === label);
    const rawValue = match?.value;
    if (typeof rawValue === "number") return rawValue;
    if (typeof rawValue === "string") {
      const parsed = Number.parseFloat(rawValue.replace(/[^\d.-]/g, ""));
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  }

  private toArray(payload: any): any[] {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  }

  private normalizeTeacherDashboard(
    dashboard: any,
    courses: any[],
    assignments: any[],
    interventions: any[],
    aiQueue: any[],
  ): any {
    // Support both the new {summary, courses, weeklySnapshot} shape (backend v2)
    // and the legacy {stats: [...]} shape so the frontend is forward-compatible.
    const stats           = dashboard?.stats           || [];
    const backendSummary  = dashboard?.summary         ?? null;
    const backendCourses  = dashboard?.courses         ?? null;
    const backendSnapshot = dashboard?.weeklySnapshot  ?? null;

    const today = new Date();
    const normalizedAiQueue       = this.toArray(aiQueue);
    const normalizedInterventions = this.toArray(interventions);

    const recentAssignments = (assignments || []).map((assignment: any) => {
      const dueDate = assignment?.due_date || null;
      const parsedDue = dueDate ? new Date(dueDate) : null;
      const daysUntilDue =
        parsedDue && !Number.isNaN(parsedDue.getTime())
          ? Math.ceil((parsedDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          : null;
      const pendingGrading = Number(assignment?.submission_count || 0);

      return {
        id: assignment?.id,
        title: assignment?.title || "Untitled Assignment",
        courseName: assignment?.course_name || "Course",
        description: assignment?.description || "",
        dueDate,
        daysUntilDue,
        submissionCount: Number(assignment?.submission_count || 0),
        pendingGrading,
        status:
          daysUntilDue == null
            ? "scheduled"
            : daysUntilDue < 0
              ? "overdue"
              : daysUntilDue <= 2
                ? "due-soon"
                : "scheduled",
        href: `/teacher/assignments/${assignment?.id}/submissions`,
      };
    });

    const assignmentsByCourse = new Map<string, any[]>();
    for (const assignment of recentAssignments) {
      const courseId = String(
        (assignments || []).find((item: any) => item?.id === assignment.id)?.course_id || "",
      );
      const list = assignmentsByCourse.get(courseId) || [];
      list.push(assignment);
      assignmentsByCourse.set(courseId, list);
    }

    // Prefer course list from backend response; fall back to separately fetched courses.
    const sourceCourses = backendCourses && backendCourses.length > 0 ? backendCourses : (courses || []);

    const courseCards = sourceCourses.map((course: any) => {
      const courseAssignments = assignmentsByCourse.get(String(course?.id)) || [];
      const pendingGrading = courseAssignments.reduce(
        (sum: number, item: any) => sum + Number(item?.pendingGrading || 0),
        0,
      );

      return {
        id: course?.id,
        title: course?.title || course?.name || course?.course_name || "Untitled Course",
        code: course?.code || course?.course_code || "",
        description: course?.description || "",
        status: course?.status || "active",
        studentCount: Number(course?.students || course?.studentCount || 0),
        assignmentCount: courseAssignments.length,
        pendingGrading,
        averageProgress: 0,
        averageMastery: backendSummary?.avgMastery ?? this.extractNumericStat(stats, "Avg. Performance"),
        moduleCount: 0,
        nextDeadline:
          courseAssignments.map((item: any) => item?.dueDate).filter(Boolean).sort()[0] || null,
        lastActivity: null,
        image: course?.image || "",
        href: `/teacher/courses/${course?.id}`,
        attention: pendingGrading > 0 ? "watch" : "healthy",
      };
    });

    const pendingGrading = recentAssignments.reduce(
      (sum: number, item: any) => sum + Number(item?.pendingGrading || 0),
      0,
    );
    const upcomingDeadlines = recentAssignments.filter(
      (item: any) => item?.daysUntilDue != null && item.daysUntilDue >= 0 && item.daysUntilDue <= 7,
    ).length;

    const priorityItems = [
      ...recentAssignments
        .filter((item: any) => Number(item?.pendingGrading || 0) > 0)
        .slice(0, 3)
        .map((item: any) => ({
          id: `grading-${item.id}`,
          kind: "grading",
          tone: "watch",
          title: item.title,
          detail: `${item.pendingGrading} submission(s) waiting for review`,
          href: item.href,
        })),
      ...normalizedAiQueue.slice(0, 2).map((item: any, index: number) => ({
        id: item?.id || item?.queue_id || `ai-${index}`,
        kind: "deadline",
        tone: "urgent",
        title: item?.question_text || item?.title || "AI answer awaiting review",
        detail: item?.student_question || item?.detail || "Approve or edit before the student sees it.",
        href: "/teacher/verification-queue",
      })) as any[],
    ];

    const interventionQueue = normalizedInterventions.map((item: any) => ({
      id: item?.id,
      studentId: item?.user_id || item?.student_id || "",
      studentName: item?.student_name || item?.studentName || "Student",
      riskLevel: item?.risk_level || item?.riskLevel || "medium",
      topicId: item?.topic_id || item?.topicId || null,
      priority: item?.priority || "medium",
      status: item?.status || "open",
      recommendedAction: item?.recommended_action || item?.recommendedAction || "Review learner progress",
      reason: item?.reason || "Intervention recommended",
      confidence: Number(item?.confidence || 0),
      evidence: item?.evidence || {},
      suggestedMessage: item?.suggested_message || item?.suggestedMessage,
      misconceptions: item?.misconceptions || [],
      weakTopics: item?.weak_topics || item?.weakTopics || [],
    }));

    // ── Build summary — prefer backend values, fall back to computed/legacy ───
    const summary = {
      totalStudents:        backendSummary?.totalStudents        ?? this.extractNumericStat(stats, "Active Students"),
      activeCourses:        backendSummary?.activeCourses        ?? courseCards.length,
      avgMastery:           backendSummary?.avgMastery           ?? this.extractNumericStat(stats, "Avg. Performance"),
      pendingGrading:       backendSummary?.pendingGrading       ?? pendingGrading,
      atRiskStudents:       backendSummary?.atRiskStudents       ?? interventionQueue.length,
      upcomingDeadlines:    backendSummary?.upcomingDeadlines    ?? upcomingDeadlines,
      pendingAIVerifications: backendSummary?.pendingAIVerifications ?? normalizedAiQueue.length,
    };

    // ── Build weeklySnapshot — prefer backend values, fall back to computed ──
    const weeklySnapshot = backendSnapshot ?? {
      publishedCourses:    courseCards.filter((c: any) => c.status !== "draft").length,
      draftCourses:        courseCards.filter((c: any) => c.status === "draft").length,
      assignmentsCreated:  recentAssignments.length,
      submissionsReceived: recentAssignments.reduce(
        (sum: number, item: any) => sum + Number(item?.submissionCount || 0),
        0,
      ),
    };

    return {
      summary,
      courses: courseCards,
      recentAssignments,
      studentMomentum: [],
      priorityItems,
      weeklySnapshot,
      interventionQueue,
      conceptHeatmap: [],
      supportClusters: [],
      raw: dashboard,
    };
  }

  private normalizeHodDashboard(
    dashboard: any,
    teachers: any[],
    programs: any[],
    requests: any[],
  ): any {
    const stats = dashboard?.stats || [];
    return {
      department: dashboard?.meta?.department || { id: "", department_name: "Department", code: "" },
      summary: {
        totalTeachers: this.extractNumericStat(stats, "Teachers"),
        totalStudents: this.extractNumericStat(stats, "Total Students"),
        totalPrograms: this.extractNumericStat(stats, "Programs"),
        pendingRequests: this.extractNumericStat(stats, "Pending Requests"),
      },
      teachers: (teachers || []).map((teacher: any) => ({
        id: teacher?.id,
        name: teacher?.full_name || teacher?.name || teacher?.email || "Teacher",
        email: teacher?.email || "",
        status: teacher?.status || "active",
      })),
      programs: (programs || []).map((program: any) => ({
        id: program?.id,
        name: program?.program_name || program?.name || "Program",
        code: program?.code || program?.program_code || "",
        level: program?.level || program?.degree || "",
      })),
      requests: (requests || []).map((request: any) => ({
        id: request?.id,
        teacher_name: request?.teacher_name || request?.teacherName || "Teacher",
        program_name: request?.program_name || request?.programName || "Program",
        semester_number: request?.semester_number || request?.semesterNumber || 0,
        course_name: request?.course_name || request?.courseName || "Course",
        status: request?.status || "PENDING_HOD",
      })),
      raw: dashboard,
    };
  }

  private async getTeacherDashboardData(): Promise<any> {
    const [dashboard, courses, assignments, interventions, aiQueue] = await Promise.all([
      this.fetchJsonOrDefault("/api/teacher/dashboard", {}),
      this.getTeacherCourses().catch(() => []),
      this.getAssignments().catch(() => []),
      this.fetchJsonOrDefault("/api/teacher/interventions/queue", []),
      this.fetchJsonOrDefault("/api/teacher/ai-queue", { items: [], total_pending: 0 }),
    ]);

    const aiQueueItems = Array.isArray(aiQueue) ? aiQueue : (aiQueue as any)?.items ?? [];
    return this.normalizeTeacherDashboard(dashboard, courses, assignments, interventions, aiQueueItems);
  }

  private async getHodDashboardData(): Promise<any> {
    const [department, teachers, programs, requests] = await Promise.all([
      this.fetchJsonOrDefault("/api/hod/department", null),
      this.fetchJsonOrDefault("/api/hod/teachers", []),
      this.fetchJsonOrDefault("/api/hod/programs", []),
      this.fetchJsonOrDefault("/api/hod/requests", []),
    ]);

    const dashboard = {
      stats: [
        { label: "Teachers", value: String(this.toArray(teachers).length) },
        { label: "Total Students", value: "0" },
        { label: "Programs", value: String(this.toArray(programs).length) },
        { label: "Pending Requests", value: String(this.toArray(requests).length) },
      ],
      meta: {
        department: department || { id: "", department_name: "Department", code: "" },
      },
    };

    return this.normalizeHodDashboard(dashboard, teachers, programs, requests);
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

    const url = this.buildUrl(requireAuthBase(), "/api/auth/login");
    const res = await fetchWithRetry(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password, role_hint, college_id }),
      credentials: "include",
    });

    if (!res.ok) {
      const error = await parseJsonSafe(res);
      throw new Error(extractApiErrorMessage(error, `Authentication failed (${res.status})`));
    }
    const tokenData = await parseJsonSafe(res);
    if (!tokenData) {
      throw new Error(`Authentication server returned an invalid response (${res.status}). Please try again later.`);
    }

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

    this.currentUser = this.toUser(userData, identifier);

    return this.currentUser;
  }

  async getCurrentUser(forceRefresh = false): Promise<User | null> {
    if (this.currentUser && !forceRefresh) return this.currentUser;
    // After a page refresh the in-memory value is lost; re-hydrate from the
    // backend using the HTTP-only cookie that was already set during login.
    try {
      const res = await this.fetchAuthorized("/api/auth/me");
      if (res.ok) {
        const userData = await parseJsonSafe(res);
        if (userData?.id) {
          this.currentUser = this.toUser(userData);
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
    const url = this.buildUrl(requireAuthBase(), "/api/auth/register");
    const res = await fetchWithRetry(url, {
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
    if (!res.ok) {
      const error = await parseJsonSafe(res);
      throw new Error(extractApiErrorMessage(error, "Registration failed"));
    }
    return this.login(userData.email!, userData.password);
  }

  async logout(): Promise<void> {
    if (this.isLoggingOut) return;
    this.isLoggingOut = true;

    try {
      // 1. Clear Supabase session globally
      const { supabase } = await import("@/lib/supabase");
      await supabase.auth.signOut().catch(() => {});

      // 2. Call backend to clear HTTP-only cookies and blacklist token
      const url = this.buildUrl(requireAuthBase(), "/api/auth/logout");
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }).catch(() => {});
    } catch (err) {
      console.warn("Logout request failed:", err);
    } finally {
      // 3. Clear local state and client-side cookies
      this.currentUser = null;
      this.token = null;
      this.persistToken(null);
      
      // Force immediate redirect to login to avoid any other background tasks continuing
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  }

  async changePassword(newPassword: string, token?: string | null): Promise<any> {
    const headers: any = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const res = await this.fetchAuthorized("/api/auth/change-password", {
      method: "POST",
      headers,
      body: JSON.stringify({ newPassword }),
    });
    if (!res.ok) { const e = await parseJsonSafe(res); throw new Error(e?.detail || "Failed to change password"); }
    return await parseJsonSafe(res);
  }

  async forgotPassword(email: string): Promise<any> {
    const url = this.buildUrl(requireAuthBase(), "/api/auth/forgot-password");
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) { const e = await parseJsonSafe(res); throw new Error(e?.detail || "Failed to send reset email"); }
    return await parseJsonSafe(res);
  }

  async resetPassword(token: string, newPassword: string): Promise<any> {
    const url = this.buildUrl(requireAuthBase(), "/api/auth/reset-password");
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
    if (!res.ok) { const e = await parseJsonSafe(res); throw new Error(e?.detail || "Failed to reset password"); }
    return await parseJsonSafe(res);
  }

  // --- Onboarding & Status ---
  async getOnboardingStatus(): Promise<any> {
    try {
      const res = await this.fetchAuthorized("/api/onboarding/status");
      if (!res.ok) {
        console.warn(`[api] Onboarding API failed with status ${res.status}`);
        return { status: "not_started", step: 0, isComplete: false, progress: {} };
      }
      return await res.json();
    } catch (error) {
      console.error("[api] getOnboardingStatus failed:", error);
      return { status: "not_started", step: 0, isComplete: false, progress: {} };
    }
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
    const res = await this.fetchAuthorized("/api/onboarding/enrollment/validate", {
      method: "POST",
      body: JSON.stringify({ enrollment_code: enrollmentCode }),
    });
    if (!res.ok) {
      const error = await parseJsonSafe(res);
      throw new Error(error?.detail || "Failed to validate enrollment code");
    }
    return await parseJsonSafe(res) ?? {};
  }

  async saveStudentEnrollment(enrollmentCode: string): Promise<any> {
    try {
      const res = await this.fetchAuthorized("/api/onboarding/enrollment", {
        method: "POST",
        body: JSON.stringify({ enrollment_code: enrollmentCode }),
      });
      if (!res.ok) {
        const error = await parseJsonSafe(res);
        const message = error?.detail || error?.message || `Enrollment failed (${res.status})`;
        console.error("Enrollment API error:", { status: res.status, error });
        throw new Error(message);
      }
      return await parseJsonSafe(res) ?? {};
    } catch (err: any) {
      // Map generic 500s to a message that doesn't blame the enrollment code
      // (the code was already validated — a 500 here is a server-side issue).
      if (err.message?.includes("500") || err.message?.toLowerCase().includes("server error")) {
        console.error("[enrollment] server error saving enrollment:", err);
        throw new Error("A server error occurred while saving your enrollment. Please retry in a moment.");
      }
      throw err;
    }
  }

  async getStudentOnboardingSubjects(batchId?: string): Promise<any[]> {
    // Guard: no batchId means no subjects possible
    if (!batchId) {
      return [];
    }

    const suffix = `?batch_id=${encodeURIComponent(batchId)}`;
    try {
      const res = await this.fetchAuthorized(`/api/onboarding/student-subjects${suffix}`);

      // If response is not OK, log and return empty
      if (!res.ok) {
        // Lower log level for pre-fetch errors which might be expected (e.g. 409)
        const error = await parseJsonSafe(res);
        if (res.status === 409 || res.status === 403) {
          console.debug("[onboarding] subject pre-fetch skipped (access restricted):", error);
        } else {
          console.warn("[onboarding] subject fetch returned error:", { status: res.status, error });
        }
        return [];
      }

      const data = await parseJsonSafe(res);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      // Swallowing error - getStudentOnboardingSubjects is often a pre-fetch
      // and shouldn't crash the onboarding flow if it fails.
      console.warn("[onboarding] subjects pre-fetch failed silently:", err);
      return [];
    }
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

  async startAdaptiveOnboarding(payload: {
    role?: string;
    forceRestart?: boolean;
  } = {}): Promise<any> {
    const res = await this.fetchAuthorized("/api/onboarding/start", {
      method: "POST",
      body: JSON.stringify({
        role: payload.role,
        force_restart: payload.forceRestart ?? false,
      }),
    });
    if (!res.ok) {
      const error = await parseJsonSafe(res);
      throw new Error(error?.detail || "Failed to start adaptive onboarding");
    }
    return await parseJsonSafe(res) ?? {};
  }

  async answerAdaptiveOnboarding(payload: {
    sessionId: string;
    questionId: string;
    answer: any;
    confidence?: number;
    timeTakenSeconds?: number;
  }): Promise<any> {
    const res = await this.fetchAuthorized("/api/onboarding/answer", {
      method: "POST",
      body: JSON.stringify({
        session_id: payload.sessionId,
        question_id: payload.questionId,
        answer: payload.answer,
        confidence: payload.confidence,
        time_taken_seconds: payload.timeTakenSeconds,
      }),
    });
    if (!res.ok) {
      const error = await parseJsonSafe(res);
      throw new Error(error?.detail || "Failed to submit adaptive onboarding answer");
    }
    return await parseJsonSafe(res) ?? {};
  }

  async getAdaptiveOnboardingResult(sessionId?: string): Promise<any> {
    const suffix = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : "";
    const res = await this.fetchAuthorized(`/api/onboarding/result${suffix}`);
    if (!res.ok) {
      const error = await parseJsonSafe(res);
      throw new Error(error?.detail || "Failed to load adaptive onboarding result");
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

  async getTeacherOnboardingOptions(): Promise<any> {
    const res = await this.fetchAuthorized("/api/teacher/onboarding/options");
    if (!res.ok) {
      const error = await parseJsonSafe(res);
      throw new Error(error?.detail || "Failed to load teacher onboarding options");
    }
    return await parseJsonSafe(res) ?? {};
  }

  async completeTeacherOnboarding(payload: any): Promise<any> {
    const res = await this.fetchAuthorized("/api/teacher/onboarding/complete", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const error = await parseJsonSafe(res);
      throw new Error(error?.detail || "Failed to complete teacher onboarding setup");
    }
    return await parseJsonSafe(res) ?? {};
  }

  async updateParentOnboarding(data: { fullName: string; relationship: string; user_id: string }): Promise<any> {
    const res = await this.fetchAuthorized("/api/parent/onboarding", {
      method: "POST",
      body: JSON.stringify({
        full_name: data.fullName,
        relationship: data.relationship,
        user_id: data.user_id,
      }),
    });
    if (!res.ok) {
      const error = await parseJsonSafe(res);
      return { success: false, error: error?.detail || "Failed to update parent onboarding" };
    }
    return { success: true, ...(await parseJsonSafe(res)) };
  }

  async updateOnboardingStep(step: number, data: any): Promise<any> {
    const res = await this.fetchAuthorized("/api/onboarding/step", {
      method: "PATCH",
      body: JSON.stringify({ step, data }),
    });
    if (!res.ok) return { success: false };
    const result = await parseJsonSafe(res) ?? {};
    if (result.accessToken) {
      this.persistToken(result.accessToken);
    }
    return result;
  }

  async completeOnboarding() {
    try {
      const res = await this.fetchAuthorized("/api/onboarding/complete", {
        method: "POST"
      });
      if (!res.ok) {
        throw new Error("Failed to complete onboarding");
      }
      const data = await parseJsonSafe(res);
      
      // Update session token if provided so middleware/JWT checks reflect status
      if (data?.accessToken) {
        this.persistToken(data.accessToken);
      }
      
      // Refresh user so subsequent state checks see onboardingCompleted: true
      await this.getCurrentUser(true);
      
      return data;
    } catch (error) {
      console.error("completeOnboarding failed:", error);
      throw error;
    }
  }

  // --- Dashboard ---
  async getDashboardData(userRole: string): Promise<any> {
    if (userRole === "teacher") {
      return this.getTeacherDashboardData();
    }
    if (userRole === "hod") {
      return this.getHodDashboardData();
    }
    const roleMap: Record<string, string> = {
      student: "/api/student/dashboard",
      teacher: "/api/teacher/dashboard",
      admin: "/api/admin/dashboard",
      hod: "/api/hod/dashboard"
    };
    const path = roleMap[userRole] || `/api/${userRole}/dashboard`;
    const res = await this.fetchAuthorized(path);
    if (!res.ok) return { stats: [], alerts: [], feed: [], meta: {} };
    const data = await res.json();
    const normalized = {
      stats: Array.isArray(data?.stats) ? data.stats : [],
      alerts: Array.isArray(data?.alerts) ? data.alerts : [],
      feed: Array.isArray(data?.feed) ? data.feed : [],
      meta: data?.meta || {},
    };
    return { ...data, ...normalized };
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

  // --- Teacher Academic APIs ---
  async getTeacherAssignments(): Promise<any[]> {
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

  // --- Content Designer APIs ---
  async getDesignerQueue(): Promise<any[]> {
    return await this.fetchJsonOrDefault("/api/content-designer/queue", []);
  }

  async getCourseById(courseId: string): Promise<any> {
    const res = await this.fetchAuthorized(`/api/courses/${courseId}`);
    if (!res.ok) throw new Error("Course not found");
    return await res.json();
  }

  async approveCourse(courseId: string): Promise<void> {
    const res = await this.fetchAuthorized(`/api/content-designer/courses/${courseId}/approve`, {
      method: "POST",
    });
    if (!res.ok) {
        const e = await parseJsonSafe(res);
        throw new Error(e?.detail || "Failed to approve course");
    }
  }

  async rejectCourse(courseId: string, feedback: string): Promise<void> {
    const res = await this.fetchAuthorized(`/api/content-designer/courses/${courseId}/reject`, {
      method: "POST",
      body: JSON.stringify({ feedback }),
    });
    if (!res.ok) {
        const e = await parseJsonSafe(res);
        throw new Error(e?.detail || "Failed to reject course");
    }
  }

  // --- Teacher Specific ---
  async getTeacherCourse(courseId: string): Promise<any> {
    const res = await this.fetchAuthorized(`/api/courses/${courseId}`);
    if (!res.ok) {
      const error = await parseJsonSafe(res);
      throw new Error(error?.detail || "Failed to load teacher course details");
    }
    return await res.json();
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

  // --- teacher / teacher APIs ---

  /** GET /api/teacher/subjects — returns teacher's assigned courses */
  async getTeacherCourses(): Promise<any[]> {
    const res = await this.fetchAuthorized("/api/teacher/subjects");
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

  /** GET /api/teacher/students/{batchId} — returns students for a batch */
  async getTeacherStudents(batchId?: string): Promise<any[]> {
    if (batchId) {
      const res = await this.fetchAuthorized(`/api/teacher/students/${batchId}`);
      return res.ok ? await res.json() : [];
    }
    // No batchId: get subjects first, collect unique batch_ids from assignments
    const subjects = await this.fetchAuthorized("/api/teacher/subjects");
    if (!subjects.ok) return [];
    const data = await subjects.json();
    const batchIds = [...new Set((data || []).map((item: any) => item.assignment?.class_id).filter(Boolean))] as string[];
    if (!batchIds.length) return [];
    const allStudents = await Promise.all(
      batchIds.map(async (bid: string) => {
        const r = await this.fetchAuthorized(`/api/teacher/students/${bid}`);
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

  /** GET /api/teacher/ai-queue — teacher verification queue (real AI answer queue) */
  async getTeacherVerificationQueue(): Promise<{ items: any[]; total_pending: number }> {
    const res = await this.fetchAuthorized("/api/teacher/ai-queue");
    if (res.ok) return res.json();
    return { items: [], total_pending: 0 };
  }

  /** POST /api/teacher/ai-queue/{id}/approve */
  async approveQueueItem(queueId: string): Promise<any> {
    return this.fetchJsonOrDefault(`/api/teacher/ai-queue/${queueId}/approve`, { success: false }, { method: "POST" });
  }

  /** POST /api/teacher/ai-queue/{id}/edit-approve */
  async editApproveQueueItem(queueId: string, finalAnswer: string, teacherNote?: string): Promise<any> {
    return this.fetchJsonOrDefault(`/api/teacher/ai-queue/${queueId}/edit-approve`, { success: false }, {
      method: "POST",
      body: JSON.stringify({ final_answer: finalAnswer, teacher_note: teacherNote }),
    });
  }

  /** POST /api/teacher/ai-queue/{id}/reject */
  async rejectQueueItem(queueId: string, note: string): Promise<any> {
    return this.fetchJsonOrDefault(`/api/teacher/ai-queue/${queueId}/reject`, { success: false }, {
      method: "POST",
      body: JSON.stringify({ teacher_note: note }),
    });
  }

  /** GET student question statuses from the AI answer queue — best-effort, returns [] on any failure */
  async getStudentQuestions(): Promise<any[]> {
    try {
      // Pull all courses the student is enrolled in, then aggregate questions across them.
      // If that fails, fall back to an empty list so the UI degrades gracefully.
      const coursesRes = await this.fetchAuthorized("/api/student/courses");
      if (!coursesRes.ok) return [];
      const courses: any[] = await coursesRes.json();
      const questions: any[] = [];
      await Promise.allSettled(
        (courses || []).slice(0, 10).map(async (course: any) => {
          const courseId = course.id || course.course_id;
          if (!courseId) return;
          try {
            const qRes = await this.fetchAuthorized(`/api/courses/${courseId}/questions`);
            if (qRes.ok) {
              const items: any[] = await qRes.json();
              questions.push(...(items || []));
            }
          } catch {
            // best-effort per course
          }
        }),
      );
      return questions;
    } catch {
      return [];
    }
  }

  /** Get chat history from localStorage */
  async getChatHistory(): Promise<any[]> {
    try {
      if (typeof window === "undefined") return [];
      const stored = localStorage.getItem("lumina_chat_history");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /** Persist a chat message to localStorage */
  async saveChatMessage(message: any): Promise<void> {
    try {
      if (typeof window === "undefined") return;
      const history = await this.getChatHistory();
      history.push(message);
      localStorage.setItem("lumina_chat_history", JSON.stringify(history.slice(-200)));
    } catch {
      // best-effort
    }
  }

  /** Fire-and-forget AI interaction log (persisted via saveChatMessage) */
  async logAIInteraction(_userMessage: string, _aiResponse: string): Promise<void> {
    // Chat messages are already saved via saveChatMessage; no separate backend call.
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
  async updateIntervention(interventionId: string, data: any): Promise<any> {
    const tryPaths = [
      `/api/teacher/interventions/${interventionId}`,
      `/api/teacher/interventions/${interventionId}`,
    ];

    let lastError = "Failed to update intervention";
    for (const path of tryPaths) {
      const res = await this.fetchAuthorized(path, {
        method: "PATCH",
        body: JSON.stringify(data || {}),
      });
      if (res.ok) {
        return await parseJsonSafe(res) ?? {};
      }
      const parsed = await parseJsonSafe(res);
      lastError = parsed?.detail || lastError;
      if (res.status !== 404) {
        throw new Error(lastError);
      }
    }

    throw new Error(lastError);
  }
  async getRiskAlerts(..._args: any[]): Promise<any> { return []; }
  async getMisconceptionClusters(..._args: any[]): Promise<any> { return []; }
  async getABTestPerformance(..._args: any[]): Promise<any> { return {}; }
  async getCurriculumScope(..._args: any[]): Promise<any> { return {}; }
  async getCreatorVerificationQueue(..._args: any[]): Promise<any> { return []; }
  async getContentCreatorBlueprints(..._args: any[]): Promise<any> { return []; }
  async getAnonymizedSnapshots(..._args: any[]): Promise<any> { return []; }
  async getCommunityData(..._args: any[]): Promise<any> { return { channels: [], messages: [] }; }
  async getAllChatRooms(..._args: any[]): Promise<any> { return []; }
  async sendCommunityMessage(..._args: any[]): Promise<any> { return { success: false }; }
  async chatWithAI(..._args: any[]): Promise<any> { return { response: "" }; }
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
  async listTeachersByDept(_deptId?: string, ..._args: any[]): Promise<any> { return []; }
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
    const res = await this.fetchAuthorized("/api/teacher/content/upload", { method: "POST", body: form }, 180000);
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

  /** POST /api/content-designer/courses/{id}/submit — submit course for review */
  async submitCourseReview(courseId: string): Promise<any> {
    const res = await this.fetchAuthorized(`/api/content-designer/courses/${courseId}/submit`, {
      method: "POST"
    });
    if (!res.ok) {
      const e = await parseJsonSafe(res);
      throw new Error(e?.detail || "Failed to submit course for review");
    }
    return await parseJsonSafe(res);
  }

  /** POST /api/generation/blueprint-from-pdf — generate course blueprint from PDF */
  async generateBlueprintFromPdf(file: File): Promise<any> {
    const form = new FormData();
    form.append("file", file);
    const res = await this.fetchAuthorized("/api/generation/blueprint-from-pdf", {
      method: "POST",
      body: form,
    }, 180000); // 3-minute timeout for PDF parsing + LLM analysis
    if (!res.ok) {
      const e = await parseJsonSafe(res);
      throw new Error(e?.detail || "Blueprint generation failed");
    }
    return await res.json();
  }
}

export const api = RealAPI.getInstance();

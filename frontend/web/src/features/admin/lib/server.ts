import { cookies } from "next/headers";

import type { AdminDashboardResponse, AdminUser } from "@/features/admin/types";

async function serverFetch(path: string): Promise<Response> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "") ||
    process.env.NEXT_PUBLIC_API_BASE?.trim().replace(/\/+$/, "") ||
    "";

  const url = apiBase
    ? `${apiBase}${path}`
    : `http://localhost:8000${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    headers["Cookie"] = `access_token=${token}`;
  }

  return fetch(url, { headers, cache: "no-store" });
}

async function fetchJson<T>(path: string, defaultValue: T): Promise<T> {
  try {
    const res = await serverFetch(path);
    if (!res.ok) return defaultValue;
    const text = await res.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      return defaultValue;
    }
  } catch {
    return defaultValue;
  }
}

type RawUserResponse = {
  id?: string;
  name?: string;
  fullName?: string;
  full_name?: string;
  email?: string;
  role?: string;
  avatar?: string | null;
  profilePhotoUrl?: string | null;
  status?: string;
  college_id?: string | null;
  collegeId?: string | null;
  dept_id?: string | null;
  deptId?: string | null;
} | null;

export async function getAdminViewer(): Promise<AdminUser> {
  const user = await fetchJson<RawUserResponse>("/api/auth/me", null);
  if (!user?.id) {
    return { id: "", name: "Admin", email: "", role: "admin" };
  }
  return {
    id: String(user.id),
    name: user.fullName || user.name || user.full_name || user.email || "Admin",
    email: user.email || "",
    role: user.role || "admin",
    avatar: user.profilePhotoUrl ?? user.avatar ?? null,
    status: user.status || "active",
    collegeId: user.collegeId ?? user.college_id ?? null,
    deptId: user.deptId ?? user.dept_id ?? null,
  };
}

export async function getAdminDashboardData(): Promise<AdminDashboardResponse> {
  return fetchJson<AdminDashboardResponse>("/api/admin/dashboard", {});
}

type AiCostsData = {
  breakdown_by_model?: Array<{ model: string; tokens: string; cost: string }>;
  total_tokens?: number;
  total_cost?: string;
  monthly_budget?: string;
  usage_percentage?: string;
};

type QueueHealthData = {
  total_pending?: number;
  total_verified?: number;
  avg_verification_time?: string;
  backlog_trend?: string;
};

export async function getAdminAiUsageData(): Promise<{
  costs: AiCostsData;
  queue: QueueHealthData;
}> {
  const [costs, queue] = await Promise.all([
    fetchJson<AiCostsData>("/api/admin/ai/costs", {}),
    fetchJson<QueueHealthData>("/api/admin/queue-health", {}),
  ]);
  return { costs, queue };
}

type ComplianceData = {
  summary?: {
    open_deletions?: number;
    completed_deletions?: number;
    audit_events?: number;
    high_severity_events?: number;
  };
  deletion_requests?: Array<{
    id?: string | number;
    user_id?: string;
    email?: string;
    created_at?: string;
    status?: string;
  }>;
  audit_logs?: Array<{
    id?: string | number;
    action?: string;
    event?: string;
    description?: string;
    resource_id?: string;
    severity?: string;
    level?: string;
    created_at?: string;
  }>;
};

export async function getAdminComplianceData(): Promise<ComplianceData> {
  return fetchJson<ComplianceData>("/api/admin/compliance", {});
}

type CourseRow = {
  id: string;
  title?: string;
  name?: string;
  code?: string;
  course_code?: string;
  teacher_id?: string;
  is_published?: boolean;
  status?: string;
  review_status?: string;
  modules?: unknown[];
  updated_at?: string;
  created_at?: string;
};

export async function getAdminCoursesData(): Promise<CourseRow[]> {
  return fetchJson<CourseRow[]>("/api/admin/courses", []);
}

type TeacherRow = {
  teacher_id: string;
  name: string;
  email: string;
  courses_count?: number;
  students_count?: number;
  avg_mastery?: number;
  risk_score?: number;
  utilization?: number;
  last_active?: string;
};

export async function getAdminTeachersData(): Promise<TeacherRow[]> {
  return fetchJson<TeacherRow[]>("/api/admin/teachers", []);
}

type StudentRow = {
  id: string;
  name: string;
  email: string;
  coursesEnrolled?: number;
  avgProgress?: number;
  avgMastery?: number;
  status?: string;
  lastActive?: string;
};

export async function getAdminStudentsData(): Promise<StudentRow[]> {
  return fetchJson<StudentRow[]>("/api/admin/students", []);
}

type AdminConfig = {
  guardian_mode?: string;
  api_rate_limit?: number;
};

type RoleMatrix = {
  roles?: string[];
  permissions?: Record<string, string[]>;
};

export async function getAdminSettingsData(): Promise<{
  config: AdminConfig;
  roleMatrix: RoleMatrix;
}> {
  const [config, roleMatrix] = await Promise.all([
    fetchJson<AdminConfig>("/api/admin/settings", {}),
    fetchJson<RoleMatrix>("/api/admin/roles/matrix", { roles: [], permissions: {} }),
  ]);
  return { config, roleMatrix };
}

type ReportsData = {
  summary?: {
    totalUsers?: number;
    totalInstitutions?: number;
    securityAlerts?: number;
  };
  attention_queue?: Array<{
    id: string;
    title: string;
    detail: string;
    severity: string;
  }>;
  activity_feed?: Array<{
    id: string;
    title: string;
    detail: string;
    timestamp?: string;
  }>;
  guardian_events?: Array<{
    id: string;
    message?: string;
    type?: string;
    severity?: string;
    timestamp?: string;
  }>;
  ai_usage?: { total_cost?: string; usage_percentage?: string };
  generated_at?: string;
};

export async function getAdminReportsData(): Promise<ReportsData> {
  return fetchJson<ReportsData>("/api/admin/reports", {});
}

type GuardianLogEntry = {
  id: string;
  message?: string;
  signal_type?: string;
  type?: string;
  source?: string;
  status?: string;
  severity?: string;
  timestamp?: string;
  created_at?: string;
};

export async function getGuardianLogData(): Promise<GuardianLogEntry[]> {
  return fetchJson<GuardianLogEntry[]>("/api/admin/guardian", []);
}

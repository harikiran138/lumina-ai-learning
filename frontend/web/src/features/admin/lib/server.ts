import { cookies } from "next/headers";

import type { AdminDashboardResponse, AdminUser } from "@/features/admin/types";

function getApiBase(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    process.env.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, "") ||
    ""
  );
}

async function serverFetch(path: string): Promise<Response | null> {
  const base = getApiBase();
  if (!base) return null;

  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    return await fetch(`${base}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(allCookies ? { Cookie: allCookies } : {}),
      },
      cache: "no-store",
    });
  } catch {
    return null;
  }
}

async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await serverFetch(path);
    if (!res || !res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export async function getAdminViewer(): Promise<AdminUser> {
  const user = await fetchJson<any>("/api/auth/me", null);
  return {
    id: user?.id || "",
    name: user?.name || user?.full_name || "Admin",
    email: user?.email || "",
    role: user?.role || "admin",
    avatar: user?.avatar ?? null,
    status: user?.status,
    collegeId: user?.college_id ?? null,
    deptId: user?.dept_id ?? null,
  };
}

export async function getAdminDashboardData(): Promise<AdminDashboardResponse> {
  return fetchJson<AdminDashboardResponse>("/api/admin/dashboard", {});
}

export async function getAdminAiUsageData(): Promise<{
  costs: {
    breakdown_by_model?: Array<{ model: string; tokens: string; cost: string }>;
    total_tokens?: number;
    total_cost?: string;
    monthly_budget?: string;
    usage_percentage?: string;
  };
  queue: {
    total_pending?: number;
    total_verified?: number;
    avg_verification_time?: string;
    backlog_trend?: string;
  };
}> {
  const [costs, queue] = await Promise.all([
    fetchJson<any>("/api/admin/ai/costs", {}),
    fetchJson<any>("/api/admin/queue-health", {}),
  ]);
  return { costs, queue };
}

export async function getAdminComplianceData(): Promise<{
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
}> {
  return fetchJson<any>("/api/admin/compliance", {});
}

export async function getAdminTeachersData(): Promise<
  Array<{
    teacher_id: string;
    name: string;
    email: string;
    courses_count?: number;
    students_count?: number;
    avg_mastery?: number;
    risk_score?: number;
    utilization?: number;
    last_active?: string;
  }>
> {
  return fetchJson<any[]>("/api/admin/teachers", []);
}

export async function getAdminStudentsData(): Promise<
  Array<{
    id: string;
    name: string;
    email: string;
    coursesEnrolled?: number;
    avgProgress?: number;
    avgMastery?: number;
    status?: string;
    lastActive?: string;
  }>
> {
  return fetchJson<any[]>("/api/admin/students", []);
}

export async function getAdminReportsData(): Promise<{
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
}> {
  return fetchJson<any>("/api/admin/reports", {});
}

export async function getAdminSettingsData(): Promise<{
  config: {
    guardian_mode?: string;
    api_rate_limit?: number;
  };
  roleMatrix: {
    roles?: string[];
    permissions?: Record<string, string[]>;
  };
}> {
  const [config, roleMatrix] = await Promise.all([
    fetchJson<any>("/api/admin/config", {}),
    fetchJson<any>("/api/admin/roles/matrix", {}),
  ]);
  return { config, roleMatrix };
}

export async function getAdminCoursesData(): Promise<
  Array<{
    id: string;
    title?: string;
    name?: string;
    code?: string;
    course_code?: string;
    teacher_id?: string;
    is_published?: boolean;
    status?: string;
    review_status?: string;
    modules?: any[];
    updated_at?: string;
    created_at?: string;
  }>
> {
  return fetchJson<any[]>("/api/admin/courses", []);
}

export async function getGuardianLogData(): Promise<
  Array<{
    id: string;
    message?: string;
    signal_type?: string;
    type?: string;
    source?: string;
    status?: string;
    severity?: string;
    timestamp?: string;
    created_at?: string;
  }>
> {
  return fetchJson<any[]>("/api/admin/guardian", []);
}

import { cookies } from "next/headers";

import type { AdminDashboardResponse, AdminUser } from "@/features/admin/types";

async function serverFetch(path: string): Promise<Response> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  const devApiBase =
    process.env.API_URL?.trim().replace(/\/+$/, "") ||
    process.env.API_BASE_URL?.trim().replace(/\/+$/, "") ||
    "http://localhost:9000";

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "") ||
    process.env.NEXT_PUBLIC_API_BASE?.trim().replace(/\/+$/, "") ||
    devApiBase;

  const url = `${apiBase}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    headers["Cookie"] = `access_token=${token}`;
  }

  return fetch(url, { headers, cache: "no-store" });
}

async function fetchJsonOrDefault<T>(path: string, defaultValue: T): Promise<T> {
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

export async function getAdminViewer(): Promise<AdminUser> {
  const data = await fetchJsonOrDefault<any>("/api/auth/me", null);
  if (!data?.id) {
    return { id: "", name: "Admin", email: "", role: "admin" };
  }
  return {
    id: String(data.id),
    name: data.fullName || data.name || data.email || "Admin",
    email: data.email || "",
    role: data.role || "admin",
    avatar: data.profilePhotoUrl || null,
    status: data.status || "active",
    collegeId: data.collegeId ?? null,
    deptId: data.deptId ?? null,
  };
}

export async function getAdminDashboardData(): Promise<AdminDashboardResponse> {
  const raw = await fetchJsonOrDefault<any>("/api/admin/dashboard", {});

  const summary =
    raw?.summary && !Array.isArray(raw.summary)
      ? raw.summary
      : {};
  const attentionQueue = Array.isArray(raw?.attentionQueue)
    ? raw.attentionQueue
    : Array.isArray(raw?.alerts)
      ? raw.alerts
      : [];
  const activityFeed = Array.isArray(raw?.activityFeed)
    ? raw.activityFeed
    : Array.isArray(raw?.activity)
      ? raw.activity
      : [];
  const systemServices = Array.isArray(raw?.systemServices)
    ? raw.systemServices
    : Array.isArray(raw?.services)
      ? raw.services
      : [];

  return {
    ...raw,
    summary,
    attentionQueue,
    activityFeed,
    systemServices,
    courseOverview: Array.isArray(raw?.courseOverview) ? raw.courseOverview : [],
    charts: raw?.charts || { userGrowth: [], roleDistribution: [] },
    institutions: Array.isArray(raw?.institutions) ? raw.institutions : [],
    connections: Array.isArray(raw?.connections) ? raw.connections : [],
  };
}

export async function getAdminAiUsageData(): Promise<{
  costs: any;
  queue: any;
}> {
  const [costs, queue] = await Promise.all([
    fetchJsonOrDefault<any>("/api/admin/ai/costs", {}),
    fetchJsonOrDefault<any>("/api/admin/queue-health", {}),
  ]);
  return { costs, queue };
}

export async function getAdminComplianceData(): Promise<any> {
  return fetchJsonOrDefault<any>("/api/admin/compliance", {});
}

export async function getAdminCoursesData(): Promise<any[]> {
  return fetchJsonOrDefault<any[]>("/api/admin/courses", []);
}

export async function getAdminTeachersData(): Promise<any[]> {
  return fetchJsonOrDefault<any[]>("/api/admin/teachers", []);
}

export async function getAdminStudentsData(): Promise<any[]> {
  return fetchJsonOrDefault<any[]>("/api/admin/students", []);
}

export async function getAdminSettingsData(): Promise<{
  config: Record<string, any>;
  roleMatrix: { roles?: string[]; permissions?: Record<string, string[]> };
}> {
  const [config, roleMatrix] = await Promise.all([
    fetchJsonOrDefault<Record<string, any>>("/api/admin/settings", {}),
    fetchJsonOrDefault<{ roles?: string[]; permissions?: Record<string, string[]> }>(
      "/api/admin/roles/matrix",
      { roles: [], permissions: {} },
    ),
  ]);
  return { config, roleMatrix };
}

export async function getAdminReportsData(): Promise<any> {
  return fetchJsonOrDefault<any>("/api/admin/reports", {});
}

export async function getGuardianLogData(): Promise<any[]> {
  return fetchJsonOrDefault<any[]>("/api/admin/guardian", []);
}

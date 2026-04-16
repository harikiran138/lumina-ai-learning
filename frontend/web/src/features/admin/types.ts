export type AdminRole =
  | "super_admin"
  | "system_admin"
  | "college_admin"
  | "institution_admin"
  | "admin";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
  status?: string;
  collegeId?: string | null;
  deptId?: string | null;
}

export interface AdminShellStats {
  totalStudents?: number;
  totalTeachers?: number;
  totalCourses?: number;
  attentionRequired?: number;
  systemHealthLabel?: string;
  aiUsagePercentage?: string;
}

export interface AdminDashboardResponse {
  summary?: AdminShellStats & {
    totalUsers?: number;
    totalInstitutions?: number;
    totalConnections?: number;
    activeCourses?: number;
    draftCourses?: number;
    securityAlerts?: number;
    systemHealthScore?: number;
    activeUsers?: number;
    systemStatus?: string;
  };
  attentionQueue?: Array<{
    id: string;
    severity: string;
    title: string;
    detail: string;
    href?: string;
  }>;
  activityFeed?: Array<{
    id: string;
    title: string;
    detail: string;
    timestamp?: string | null;
    tone?: string;
    href?: string;
  }>;
  systemServices?: Array<{
    name: string;
    status: string;
    metric: string;
    detail: string;
  }>;
  courseOverview?: Array<{
    id: string;
    title: string;
    status: string;
    studentCount: number;
    moduleCount: number;
    assignmentCount: number;
    pendingGrading: number;
  }>;
  charts?: {
    userGrowth?: Array<{
      month: string;
      users: number;
    }>;
    roleDistribution?: Array<{
      role: string;
      count: number;
    }>;
  };
  institutions?: Array<{
    id: string;
    institution_name?: string;
    departmentCount?: number;
    programCount?: number;
    stakeholderCount?: number;
    health?: string;
  }>;
  connections?: Array<{
    id: string;
    userName?: string;
    userEmail?: string;
    userRole?: string;
    institutionName?: string;
    programName?: string;
    created_at?: string | null;
  }>;
}

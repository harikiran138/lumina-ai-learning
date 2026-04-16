import { Role } from './rbac/roles';

export const ROLE_HOME_ROUTES: Record<string, string> = {
  [Role.STUDENT]: "/dashboard/student",
  [Role.FACULTY]: "/dashboard/faculty",
  [Role.HOD]: "/dashboard/hod",
  [Role.ADMIN]: "/dashboard/admin",
  [Role.PARENT]: "/dashboard/parent",
  [Role.COUNSELOR]: "/dashboard/counselor",
  [Role.MENTOR]: "/dashboard/mentor",
  [Role.PEER_TUTOR]: "/dashboard/peer-tutor",
  [Role.RESEARCHER]: "/dashboard/researcher",
  [Role.ALUMNI]: "/dashboard/alumni",
  [Role.CONTENT_CREATOR]: "/dashboard/content-creator",
  [Role.SUPER_ADMIN]: "/dashboard/super-admin"
};

const ROLE_PATH_PREFIXES: Record<string, string[]> = {
  [Role.STUDENT]: ["/dashboard/student", "/student"],
  [Role.FACULTY]: ["/dashboard/faculty", "/teacher"],
  [Role.HOD]: ["/dashboard/hod", "/hod"],
  [Role.ADMIN]: ["/dashboard/admin", "/admin"],
  [Role.PARENT]: ["/dashboard/parent", "/parent"],
  [Role.COUNSELOR]: ["/dashboard/counselor", "/counselor"],
  [Role.MENTOR]: ["/dashboard/mentor", "/mentor"],
  [Role.PEER_TUTOR]: ["/dashboard/peer-tutor", "/peer-tutor", "/peer_tutor"],
  [Role.RESEARCHER]: ["/dashboard/researcher", "/researcher"],
  [Role.ALUMNI]: ["/dashboard/alumni", "/alumni"],
  [Role.CONTENT_CREATOR]: ["/dashboard/content-creator", "/content-creator", "/content_creator"],
  [Role.SUPER_ADMIN]: ["/dashboard/super-admin", "/super-admin"],
};

export function normalizeRole(role?: string | null): string {
  if (!role) return Role.STUDENT;
  const raw = role.toUpperCase().replace("-", "_");
  
  if (raw === "TEACHER") return Role.FACULTY;
  if (raw === "MENTOR") return Role.PEER_MENTOR;
  if (raw === "PEER TUTOR") return Role.PEER_MENTOR;
  if (raw === "PEER_TUTOR") return Role.PEER_MENTOR;
  
  // Direct match
  if (Object.values(Role).includes(raw as Role)) {
    return raw;
  }
  
  // Catch case-insensitive or mixed cases
  const normalized = raw as Role;
  if (Object.values(Role).some(r => r === normalized)) {
      return normalized;
  }

  return Role.STUDENT;
}

export function getRoleHome(role?: string | null): string {
  const normalized = normalizeRole(role)
  return ROLE_HOME_ROUTES[normalized] || "/"
}

export function getRolePathPrefixes(role?: string | null): string[] {
  const normalized = normalizeRole(role)
  return ROLE_PATH_PREFIXES[normalized] || []
}

export function getExpectedRoleForPath(pathname: string): string | null {
  for (const [role, prefixes] of Object.entries(ROLE_PATH_PREFIXES)) {
    if (prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
      return normalizeRole(role)
    }
  }
  return null
}

export function getCanonicalPath(pathname: string): string | null {
  if (pathname.startsWith("/teacher/")) return pathname.replace("/teacher/", "/dashboard/faculty/");
  if (pathname.startsWith("/student/")) return pathname.replace("/student/", "/dashboard/student/");
  if (pathname.startsWith("/hod/")) return pathname.replace("/hod/", "/dashboard/hod/");
  if (pathname.startsWith("/admin/")) return pathname.replace("/admin/", "/dashboard/admin/");
  if (pathname.startsWith("/parent/")) return pathname.replace("/parent/", "/dashboard/parent/");
  if (pathname.startsWith("/counselor/")) return pathname.replace("/counselor/", "/dashboard/counselor/");
  if (pathname.startsWith("/mentor/")) return pathname.replace("/mentor/", "/dashboard/mentor/");
  if (pathname.startsWith("/peer-tutor/")) return pathname.replace("/peer-tutor/", "/dashboard/peer-tutor/");
  if (pathname.startsWith("/peer_tutor/")) return pathname.replace("/peer_tutor/", "/dashboard/peer-tutor/");
  if (pathname.startsWith("/researcher/")) return pathname.replace("/researcher/", "/dashboard/researcher/");
  if (pathname.startsWith("/alumni/")) return pathname.replace("/alumni/", "/dashboard/alumni/");
  if (pathname.startsWith("/content-creator/")) return pathname.replace("/content-creator/", "/dashboard/content-creator/");
  if (pathname.startsWith("/content_creator/")) return pathname.replace("/content_creator/", "/dashboard/content-creator/");
  if (pathname.startsWith("/super-admin/")) return pathname.replace("/super-admin/", "/dashboard/super-admin/");

  return null;
}

export const ROLE_HOME_ROUTES: Record<string, string> = {
  super_admin: "/admin/dashboard",
  admin: "/admin/dashboard",
  college_admin: "/college",
  hod: "/hod/dashboard",
  faculty: "/faculty/dashboard",
  teacher: "/faculty/dashboard",
  student: "/student/dashboard",
  parent: "/parent/dashboard",
  mentor: "/mentor/dashboard",
  peer_tutor: "/peer_tutor/dashboard",
  "peer-tutor": "/peer_tutor/dashboard",
  counselor: "/counselor/dashboard",
  content_creator: "/content_creator/dashboard",
  researcher: "/researcher/dashboard",
  alumni: "/alumni/dashboard",
}

const ROLE_PATH_PREFIXES: Record<string, string[]> = {
  super_admin: ["/admin"],
  college_admin: ["/college"],
  hod: ["/hod"],
  teacher: ["/teacher"],
  faculty: ["/faculty"],
  student: ["/student"],
  parent: ["/parent"],
  mentor: ["/mentor"],
  peer_tutor: ["/peer_tutor", "/peer-tutor"],
  counselor: ["/counselor"],
  content_creator: ["/content-creator", "/content_creator", "/creator"],
  researcher: ["/researcher"],
  alumni: ["/alumni"],
}

export function normalizeRole(role?: string | null): string {
  if (role === "faculty") return "teacher"
  if (role === "peer-tutor") return "peer_tutor"
  return role || ""
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
  if (pathname === "/content_creator/studio" || pathname.startsWith("/content_creator/studio/")) {
    return pathname.replace("/content_creator/studio", "/content_creator/dashboard")
  }

  if (pathname === "/researcher/portal" || pathname.startsWith("/researcher/portal/")) {
    return pathname.replace("/researcher/portal", "/researcher/dashboard")
  }

  if (pathname === "/teacher" || pathname.startsWith("/teacher/")) {
    return pathname.replace("/teacher", "/faculty")
  }
  if (pathname === "/peer-tutor" || pathname.startsWith("/peer-tutor/")) {
    return pathname.replace("/peer-tutor", "/peer_tutor")
  }

  if (pathname === "/creator" || pathname.startsWith("/creator/")) {
    return pathname.replace("/creator", "/content_creator")
  }

  if (pathname === "/content-creator" || pathname.startsWith("/content-creator/")) {
    return pathname.replace("/content-creator", "/content_creator")
  }

  return null
}

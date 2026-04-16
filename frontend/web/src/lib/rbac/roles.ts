/**
 * Lumina AI LMS — Role-Based Access Control
 * Frontend role hierarchy, permissions, and type definitions.
 */

export const ROLE_HIERARCHY = {
  super_admin: 100,
  system_admin: 95,
  college_admin: 90,
  institution_admin: 85,
  admin: 80,
  hod: 60,
  supervisor: 50,    // Between HOD and teacher — faculty coordinator
  auditor: 45,
  teacher: 40,
  finance: 35,
  counselor: 35,
  content_creator: 35,
  researcher: 30,
  mentor: 30,
  peer_tutor: 25,
  student: 20,
  parent: 15,
  alumni: 10,
  guest: 0,
} as const;

export type UserRole = keyof typeof ROLE_HIERARCHY;

/** Returns true if roleA has strictly higher authority than roleB */
export function hasHigherAuthority(roleA: string, roleB: string): boolean {
  const a = ROLE_HIERARCHY[roleA as UserRole] ?? 0;
  const b = ROLE_HIERARCHY[roleB as UserRole] ?? 0;
  return a > b;
}

/** Returns true if the given role meets the minimum level */
export function meetsMinimumRole(role: string, minimum: UserRole): boolean {
  const actual = ROLE_HIERARCHY[role as UserRole] ?? 0;
  const required = ROLE_HIERARCHY[minimum];
  return actual >= required;
}

// ─── Supervisor-specific permissions ─────────────────────────────────────────

export const SUPERVISOR_PERMISSIONS = [
  'grades:override',
  'templates:edit_master',
  'courses:view_all_sections',
  'verification_queue:manage',
  'teacher:grade_review',
] as const;

export type SupervisorPermission = (typeof SUPERVISOR_PERMISSIONS)[number];

// ─── Auditor permissions (read-only) ─────────────────────────────────────────

export const AUDITOR_PERMISSIONS = [
  'audit_logs:read',
  'security_events:read',
  'reports:read',
] as const;

// ─── Role groups ─────────────────────────────────────────────────────────────

/** All roles that can access /admin/* routes */
export const ADMIN_ROLES: UserRole[] = [
  'super_admin', 'system_admin', 'college_admin', 'institution_admin', 'admin',
];

/** All faculty roles (teacher-level and above) */
export const FACULTY_ROLES: UserRole[] = [
  'super_admin', 'system_admin', 'college_admin', 'institution_admin', 'admin',
  'hod', 'supervisor', 'teacher',
];

/** Roles that can review/grade student work */
export const GRADING_ROLES: UserRole[] = [
  'super_admin', 'system_admin', 'college_admin', 'institution_admin', 'admin',
  'hod', 'supervisor', 'teacher',
];

/** Roles that can approve AI answers in TILA queue */
export const TILA_REVIEWER_ROLES: UserRole[] = [
  'super_admin', 'system_admin', 'college_admin', 'institution_admin', 'admin',
  'hod', 'supervisor', 'teacher',
];

// ─── Route access map ─────────────────────────────────────────────────────────

export const ROLE_ROUTE_MAP: Record<string, UserRole[]> = {
  '/teacher/verification-queue': ['supervisor', 'hod', 'admin', 'college_admin', 'institution_admin', 'system_admin', 'super_admin'],
  '/teacher/coordination':       ['supervisor', 'hod', 'admin', 'college_admin', 'institution_admin', 'system_admin', 'super_admin'],
  '/teacher/courses':            ['supervisor', 'teacher', 'hod', 'admin', 'college_admin', 'institution_admin', 'system_admin', 'super_admin'],
  '/teacher/grading':            ['supervisor', 'teacher', 'hod', 'admin', 'college_admin', 'institution_admin', 'system_admin', 'super_admin'],
  '/teacher/video-analysis':     ['supervisor', 'teacher', 'hod', 'admin', 'college_admin', 'institution_admin', 'system_admin', 'super_admin'],
  '/auditor/dashboard':          ['auditor', 'super_admin', 'system_admin'],
  '/auditor/logs':               ['auditor', 'super_admin', 'system_admin'],
  '/auditor/security':           ['auditor', 'super_admin', 'system_admin'],
};

/** Supervisor nav items (appended to teacher nav) */
export const SUPERVISOR_EXTRA_NAV = [
  { label: 'Faculty Coordination', href: '/teacher/coordination',         icon: 'Users'          },
  { label: 'Verification Queue',   href: '/teacher/verification-queue',   icon: 'ClipboardCheck' },
  { label: 'Coordinator Courses',  href: '/teacher/courses/coordinator',  icon: 'BookMarked'     },
] as const;

/** Auditor nav items */
export const AUDITOR_NAV = [
  { label: 'Dashboard',      href: '/auditor/dashboard', icon: 'LayoutDashboard' },
  { label: 'Audit Logs',     href: '/auditor/logs',      icon: 'ScrollText'      },
  { label: 'Security Events', href: '/auditor/security',  icon: 'ShieldAlert'     },
  { label: 'Reports Gallery', href: '/reports/gallery',   icon: 'BarChart3'       },
  { label: 'Course Catalog',  href: '/courses/catalog',   icon: 'BookOpen'        },
] as const;

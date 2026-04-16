/**
 * Lumina AI LMS — Role-Based Access Control
 * Frontend role hierarchy, permissions, and type definitions.
 */

export enum Role {
  STUDENT = 'STUDENT',
  FACULTY = 'FACULTY',
  HOD = 'HOD',
  ADMIN = 'ADMIN',
  PARENT = 'PARENT',
  COUNSELOR = 'COUNSELOR',
  MENTOR = 'MENTOR',
  PEER_TUTOR = 'PEER_TUTOR',
  RESEARCHER = 'RESEARCHER',
  ALUMNI = 'ALUMNI',
  CONTENT_CREATOR = 'CONTENT_CREATOR',
  PEER_MENTOR = 'PEER_MENTOR',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.SUPER_ADMIN]: 100,
  [Role.ADMIN]: 80,
  [Role.HOD]: 60,
  [Role.FACULTY]: 50,
  [Role.RESEARCHER]: 45,
  [Role.COUNSELOR]: 40,
  [Role.CONTENT_CREATOR]: 35,
  [Role.MENTOR]: 30,
  [Role.PEER_MENTOR]: 28,
  [Role.PEER_TUTOR]: 25,
  [Role.STUDENT]: 20,
  [Role.ALUMNI]: 15,
  [Role.PARENT]: 10,
};

export type UserRole = Role;

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
export const ADMIN_ROLES: Role[] = [
  Role.SUPER_ADMIN, Role.ADMIN,
];

/** All faculty roles (faculty-level and above) */
export const FACULTY_ROLES: Role[] = [
  Role.SUPER_ADMIN, Role.ADMIN, Role.HOD, Role.FACULTY,
];

/** Roles that can review/grade student work */
export const GRADING_ROLES: Role[] = [
  Role.SUPER_ADMIN, Role.ADMIN, Role.HOD, Role.FACULTY,
];

/** Roles that can approve AI answers in TILA queue */
export const TILA_REVIEWER_ROLES: Role[] = [
  Role.SUPER_ADMIN, Role.ADMIN, Role.HOD, Role.FACULTY,
];

// ─── Route access map ─────────────────────────────────────────────────────────

export const ROLE_ROUTE_MAP: Record<string, Role[]> = {
  '/teacher/verification-queue': [Role.HOD, Role.ADMIN, Role.SUPER_ADMIN],
  '/teacher/coordination':       [Role.HOD, Role.ADMIN, Role.SUPER_ADMIN],
  '/teacher/courses':            [Role.FACULTY, Role.HOD, Role.ADMIN, Role.SUPER_ADMIN],
  '/teacher/grading':            [Role.FACULTY, Role.HOD, Role.ADMIN, Role.SUPER_ADMIN],
  '/teacher/video-analysis':     [Role.FACULTY, Role.HOD, Role.ADMIN, Role.SUPER_ADMIN],
  '/counselor/dashboard':        [Role.COUNSELOR, Role.SUPER_ADMIN],
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

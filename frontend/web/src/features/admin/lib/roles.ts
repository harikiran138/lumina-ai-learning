import type { AdminRole } from "@/features/admin/types";

const ADMIN_ROLES: AdminRole[] = [
  "super_admin",
  "college_admin",
  "institution_admin",
  "admin",
];

const ADMIN_ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  college_admin: "College Admin",
  institution_admin: "Institution Admin",
  admin: "Admin",
};

export function isAdminRole(role?: string | null): boolean {
  return ADMIN_ROLES.includes(role as AdminRole);
}

export function getAdminRoleLabel(role?: string | null): string {
  if (!role) return "No Role";
  return ADMIN_ROLE_LABELS[role] ?? role;
}

import type { AdminRole } from "@/features/admin/types";

const ADMIN_ROLES: Set<string> = new Set<AdminRole>([
  "super_admin",
  "system_admin",
  "college_admin",
  "institution_admin",
  "admin",
]);

const ADMIN_ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  system_admin: "System Admin",
  college_admin: "College Admin",
  institution_admin: "Institution Admin",
  admin: "Admin",
};

export function isAdminRole(role?: string | null): boolean {
  if (!role) return false;
  return ADMIN_ROLES.has(role);
}

export function getAdminRoleLabel(role?: string | null): string {
  if (!role) return "Admin";
  return ADMIN_ROLE_LABELS[role] ?? "Admin";
}

import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Bot,
  FileBarChart2,
  LayoutDashboard,
  Scale,
  Settings,
  ShieldAlert,
  Users,
} from "lucide-react";

import type { AdminRole } from "@/features/admin/types";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: AdminRole[];
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Teachers", href: "/admin/teachers", icon: Users },
  { label: "Students", href: "/admin/students", icon: Users },
  { label: "Courses", href: "/admin/courses", icon: BookOpen },
  { label: "AI Usage", href: "/admin/ai-usage", icon: Bot },
  { label: "Reports", href: "/admin/reports", icon: FileBarChart2 },
  { label: "Compliance", href: "/admin/compliance", icon: Scale },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export const ADMIN_SECONDARY_LINKS: AdminNavItem[] = [
  {
    label: "Guardian Log",
    href: "/admin/guardian-log",
    icon: ShieldAlert,
    roles: ["super_admin", "college_admin"],
  },
];

export const ADMIN_PAGE_TITLES: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/teachers": "Teachers",
  "/admin/students": "Students",
  "/admin/courses": "Courses",
  "/admin/ai-usage": "AI Usage",
  "/admin/reports": "Reports",
  "/admin/compliance": "Compliance",
  "/admin/settings": "Settings",
  "/admin/guardian-log": "Guardian Log",
};


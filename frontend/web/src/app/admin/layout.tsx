import type { ReactNode } from "react";

import AdminShell from "@/components/dashboard/AdminShell";

export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}

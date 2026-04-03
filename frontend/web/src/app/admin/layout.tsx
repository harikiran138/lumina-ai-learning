import type { ReactNode } from "react";

import { AdminShell } from "@/features/admin/components/admin-shell";
import { getAdminViewer } from "@/features/admin/lib/server";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getAdminViewer();

  return <AdminShell initialUser={user}>{children}</AdminShell>;
}

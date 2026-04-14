"use client";

import { RoleGuard } from "@/components/shared/RoleGuard";
import { InstitutionGuard } from "@/components/shared/InstitutionGuard";

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={["faculty"]}>
      <InstitutionGuard>
        <div className="faculty-layout">
          {/* TODO: Implement Faculty Sidebar with links to departments and analytics */}
          {children}
        </div>
      </InstitutionGuard>
    </RoleGuard>
  );
}

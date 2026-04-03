import { Suspense } from "react";
import { Activity, AlertTriangle, GraduationCap, Users } from "lucide-react";

import { AdminRefreshButton } from "@/features/admin/components/action-buttons";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPageSkeleton,
  AdminPanel,
  AdminStatCard,
  AdminStatusBadge,
  formatCompactNumber,
  formatDateTime,
  formatPercent,
} from "@/features/admin/components/primitives";
import { getAdminTeachersData } from "@/features/admin/lib/server";

export default function AdminTeachersPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <TeachersContent />
    </Suspense>
  );
}

async function TeachersContent() {
  const teachers = await getAdminTeachersData();

  const totalStudents = teachers.reduce(
    (sum, teacher) => sum + Number(teacher.students_count || 0),
    0,
  );
  const averageMastery =
    teachers.reduce((sum, teacher) => sum + Number(teacher.avg_mastery || 0), 0) /
    (teachers.length || 1);
  const highRiskCount = teachers.filter((teacher) => Number(teacher.risk_score || 0) >= 50).length;
  const averageUtilization =
    teachers.reduce((sum, teacher) => sum + Number(teacher.utilization || 0), 0) /
    (teachers.length || 1);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Faculty Operations"
        title="Teachers"
        description="Review educator workload, mastery impact, and early risk signals pulled directly from the admin analytics backend."
        icon={Users}
        actions={<AdminRefreshButton />}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Educators"
          value={formatCompactNumber(teachers.length)}
          helper="Teachers and HODs currently in scope"
          icon={Users}
        />
        <AdminStatCard
          label="Students Reached"
          value={formatCompactNumber(totalStudents)}
          helper="Learners linked through course activity"
          icon={GraduationCap}
        />
        <AdminStatCard
          label="Avg Mastery"
          value={formatPercent(averageMastery)}
          helper="Average student mastery under each educator"
          icon={Activity}
        />
        <AdminStatCard
          label="High Risk"
          value={`${highRiskCount}`}
          helper={`${formatPercent(averageUtilization)} average capacity utilization`}
          icon={AlertTriangle}
        />
      </div>

      <AdminPanel
        title="Teacher Roster"
        description="The admin API returns one row per educator with utilization and risk context."
      >
        {teachers.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs uppercase tracking-[0.2em] text-gray-500">
                  <th className="pb-4">Educator</th>
                  <th className="pb-4">Load</th>
                  <th className="pb-4">Mastery</th>
                  <th className="pb-4">Risk</th>
                  <th className="pb-4">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {teachers.map((teacher) => (
                  <tr key={teacher.teacher_id}>
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-white">{teacher.name}</p>
                      <p className="text-xs text-gray-400">{teacher.email}</p>
                    </td>
                    <td className="py-4 pr-4 text-gray-300">
                      {teacher.courses_count} course(s), {teacher.students_count} learners
                    </td>
                    <td className="py-4 pr-4">
                      <div className="space-y-2">
                        <p className="font-semibold text-white">
                          {formatPercent(teacher.avg_mastery)}
                        </p>
                        <div className="h-2 w-40 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                            style={{ width: `${Math.min(Number(teacher.avg_mastery || 0), 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <AdminStatusBadge
                        label={`${Math.round(Number(teacher.risk_score || 0))}% risk`}
                        tone={
                          Number(teacher.risk_score || 0) >= 50
                            ? "high"
                            : Number(teacher.risk_score || 0) >= 25
                              ? "medium"
                              : "healthy"
                        }
                      />
                    </td>
                    <td className="py-4 text-gray-400">
                      {formatDateTime(teacher.last_active)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AdminEmptyState
            title="No teachers returned"
            description="The admin analytics endpoint has not reported teacher rows yet. Once teachers are linked to courses, they will appear here automatically."
          />
        )}
      </AdminPanel>
    </div>
  );
}

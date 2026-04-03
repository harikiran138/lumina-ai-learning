import { Suspense } from "react";
import { AlertTriangle, BookOpen, Gauge, GraduationCap } from "lucide-react";

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
import { getAdminStudentsData } from "@/features/admin/lib/server";

export default function AdminStudentsPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <StudentsContent />
    </Suspense>
  );
}

async function StudentsContent() {
  const students = await getAdminStudentsData();

  const averageProgress =
    students.reduce((sum, student) => sum + Number(student.avgProgress || 0), 0) /
    (students.length || 1);
  const averageMastery =
    students.reduce((sum, student) => sum + Number(student.avgMastery || 0), 0) /
    (students.length || 1);
  const atRiskCount = students.filter((student) => student.status !== "on-track").length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Student Oversight"
        title="Students"
        description="View learner momentum, risk posture, and recent activity from the centralized admin student snapshot."
        icon={GraduationCap}
        actions={<AdminRefreshButton />}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Students"
          value={formatCompactNumber(students.length)}
          helper="Learners returned by `/api/admin/students`"
          icon={GraduationCap}
        />
        <AdminStatCard
          label="Avg Progress"
          value={formatPercent(averageProgress)}
          helper="Average course completion signal"
          icon={Gauge}
        />
        <AdminStatCard
          label="Avg Mastery"
          value={formatPercent(averageMastery)}
          helper="Mastery score aggregated across learners"
          icon={BookOpen}
        />
        <AdminStatCard
          label="Needs Review"
          value={`${atRiskCount}`}
          helper="Students flagged as watch or at-risk"
          icon={AlertTriangle}
        />
      </div>

      <AdminPanel
        title="Student Snapshot"
        description="Each row includes progress, mastery, recent activity, and a simple risk label."
      >
        {students.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs uppercase tracking-[0.2em] text-gray-500">
                  <th className="pb-4">Student</th>
                  <th className="pb-4">Courses</th>
                  <th className="pb-4">Progress</th>
                  <th className="pb-4">Risk</th>
                  <th className="pb-4">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {students.map((student) => {
                  const riskScore = Math.max(0, 100 - Number(student.avgMastery || 0));
                  return (
                    <tr key={student.id}>
                      <td className="py-4 pr-4">
                        <p className="font-semibold text-white">{student.name}</p>
                        <p className="text-xs text-gray-400">{student.email}</p>
                      </td>
                      <td className="py-4 pr-4 text-gray-300">
                        {student.coursesEnrolled} course(s)
                      </td>
                      <td className="py-4 pr-4">
                        <div className="space-y-2">
                          <p className="font-semibold text-white">
                            {formatPercent(student.avgProgress)}
                          </p>
                          <div className="h-2 w-40 overflow-hidden rounded-full bg-white/5">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400"
                              style={{ width: `${Math.min(Number(student.avgProgress || 0), 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <AdminStatusBadge
                          label={`${Math.round(riskScore)}% risk`}
                          tone={student.status === "at-risk" ? "high" : student.status === "watch" ? "medium" : "healthy"}
                        />
                      </td>
                      <td className="py-4 text-gray-400">
                        {formatDateTime(student.lastActive)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <AdminEmptyState
            title="No students returned"
            description="The backend student snapshot is empty. Student activity will appear once learners are enrolled and progress rows exist."
          />
        )}
      </AdminPanel>
    </div>
  );
}

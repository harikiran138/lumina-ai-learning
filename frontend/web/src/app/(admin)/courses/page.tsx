import { Suspense } from "react";
import { BookOpen, CheckCircle2, Clock3, FileSearch } from "lucide-react";

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
} from "@/features/admin/components/primitives";
import { getAdminCoursesData, getAdminTeachersData } from "@/features/admin/lib/server";

export default function AdminCoursesPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <CoursesContent />
    </Suspense>
  );
}

function getAuditStatus(course: {
  review_status?: string;
  is_published?: boolean;
  status?: string;
}) {
  if (course.review_status) return String(course.review_status);
  if (course.is_published) return "published";
  return String(course.status || "draft").toLowerCase();
}

async function CoursesContent() {
  const [courses, teachers] = await Promise.all([
    getAdminCoursesData(),
    getAdminTeachersData(),
  ]);

  const teacherMap = new Map(teachers.map((teacher) => [teacher.teacher_id, teacher.name]));
  const publishedCourses = courses.filter((course) => course.is_published).length;
  const reviewCourses = courses.filter((course) => getAuditStatus(course).includes("review")).length;
  const draftCourses = courses.length - publishedCourses;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Curriculum Oversight"
        title="Courses"
        description="Track course inventory, publishing posture, and audit status across the institution."
        icon={BookOpen}
        actions={<AdminRefreshButton />}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Catalog Size"
          value={formatCompactNumber(courses.length)}
          helper="All courses returned by `/api/admin/courses`"
          icon={BookOpen}
        />
        <AdminStatCard
          label="Published"
          value={`${publishedCourses}`}
          helper="Visible to learning workflows"
          icon={CheckCircle2}
        />
        <AdminStatCard
          label="In Review"
          value={`${reviewCourses}`}
          helper="Pending content approval or audit"
          icon={FileSearch}
        />
        <AdminStatCard
          label="Draft"
          value={`${draftCourses}`}
          helper="Still being prepared by faculty"
          icon={Clock3}
        />
      </div>

      <AdminPanel
        title="Course Inventory"
        description="Audit-ready course metadata with teacher linkage and publishing state."
      >
        {courses.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs uppercase tracking-[0.2em] text-gray-500">
                  <th className="pb-4">Course</th>
                  <th className="pb-4">Instructor</th>
                  <th className="pb-4">Audit Status</th>
                  <th className="pb-4">Modules</th>
                  <th className="pb-4">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {courses.map((course) => {
                  const auditStatus = getAuditStatus(course);
                  return (
                    <tr key={course.id}>
                      <td className="py-4 pr-4">
                        <p className="font-semibold text-white">
                          {course.title || course.name || "Untitled Course"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {course.code || course.course_code || "No course code"}
                        </p>
                      </td>
                      <td className="py-4 pr-4 text-gray-300">
                        {teacherMap.get(course.teacher_id || "") || "Unassigned"}
                      </td>
                      <td className="py-4 pr-4">
                        <AdminStatusBadge
                          label={auditStatus}
                          tone={
                            auditStatus.includes("publish")
                              ? "healthy"
                              : auditStatus.includes("review")
                                ? "medium"
                                : "warning"
                          }
                        />
                      </td>
                      <td className="py-4 pr-4 text-gray-300">
                        {course.modules?.length || 0}
                      </td>
                      <td className="py-4 text-gray-400">
                        {formatDateTime(course.updated_at || course.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <AdminEmptyState
            title="No course rows yet"
            description="Once curriculum records exist in the backend course store, they will appear here with audit status and teacher assignment."
          />
        )}
      </AdminPanel>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ClipboardCheck,
  Mail,
  RefreshCw,
  Search,
  UserCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";

type TeacherRecord = {
  id: string;
  name: string;
  email: string;
  status?: string;
  is_active?: boolean;
  onboarding_step?: number;
};

export default function TeacherManagementPage() {
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [departmentName, setDepartmentName] = useState("Department");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTeachers = async (showRefreshState = false) => {
    try {
      if (showRefreshState) setRefreshing(true);
      const [dashboard, teacherList, requests] = await Promise.all([
        api.getHODDashboard(),
        api.listTeachersByDept(),
        api.getTeacherRequests(),
      ]);

      setDepartmentName(dashboard?.department?.department_name || "Department");
      setTeachers(Array.isArray(teacherList) ? teacherList : []);
      setPendingRequests(Array.isArray(requests) ? requests : []);
    } catch (error: any) {
      toast.error(error?.message || "Failed to fetch teacher list");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const filteredTeachers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return teachers;

    return teachers.filter((teacher) =>
      [teacher.name, teacher.email, teacher.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [searchQuery, teachers]);

  const activeTeachers = teachers.filter((teacher) =>
    teacher.is_active ?? String(teacher.status || "").toLowerCase() === "active",
  ).length;

  const pendingTeachers = Math.max(teachers.length - activeTeachers, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-6 rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-white">
            <Users className="h-8 w-8 text-lumina-primary" />
            Teacher Directory
          </h1>
          <p className="mt-1 font-medium text-gray-400">
            Real faculty accounts mapped to {departmentName}. This view stays aligned with the HOD department scope.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => fetchTeachers(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-white transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            href="/hod/dashboard"
            className="inline-flex items-center gap-2 rounded-2xl bg-lumina-primary px-5 py-3 font-black text-black transition-all hover:scale-[1.02]"
          >
            <ClipboardCheck className="h-4 w-4" />
            Review Requests
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="flex items-center gap-5 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lumina-primary/10 text-lumina-primary">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Total Teachers</p>
            <p className="text-2xl font-black text-white">{teachers.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-5 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10 text-green-400">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Active Accounts</p>
            <p className="text-2xl font-black text-white">{activeTeachers}</p>
          </div>
        </div>
        <div className="flex items-center gap-5 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Pending Requests</p>
            <p className="text-2xl font-black text-white">{pendingRequests.length}</p>
            <p className="text-xs text-gray-500">{pendingTeachers} account(s) still inactive</p>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 border-b border-white/10 p-6 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, email, or status..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-sm font-medium text-white outline-none transition-all focus:border-lumina-primary"
            />
          </div>
          <p className="text-sm text-gray-400">
            Teacher invitations are centrally managed. HOD approval here focuses on department-scoped staff visibility and request review.
          </p>
        </div>

        {loading ? (
          <div className="px-6 py-16 text-center text-gray-500">Loading teacher directory...</div>
        ) : filteredTeachers.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-500">No teachers found for this department.</div>
        ) : (
          <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredTeachers.map((teacher) => {
              const isActive =
                teacher.is_active ?? String(teacher.status || "").toLowerCase() === "active";
              const statusLabel = String(teacher.status || (isActive ? "active" : "pending")).replaceAll("_", " ");

              return (
                <article
                  key={teacher.id}
                  className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5 transition-all hover:border-white/20 hover:bg-black/30"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lumina-primary/10 font-black text-lumina-primary">
                      {teacher.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-lg font-black text-white">{teacher.name}</p>
                      <p className="truncate text-sm text-gray-400">{teacher.email}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Account Status</p>
                      <p className={`mt-2 font-bold ${isActive ? "text-green-400" : "text-amber-400"}`}>
                        {statusLabel}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Onboarding Step</p>
                      <p className="mt-2 font-bold text-white">{teacher.onboarding_step ?? 0}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Department Scoped</span>
                    <a
                      href={`mailto:${teacher.email}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-gray-200 transition-all hover:bg-white/10"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      Email
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

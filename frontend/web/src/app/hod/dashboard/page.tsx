"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  GraduationCap,
  PlusCircle,
  Sparkles,
  TrendingUp,
  Users,
  ShieldCheck,
  Building,
  CheckCircle,
  XCircle,
} from "lucide-react";

import { StatCard } from "@/components/dashboard/StatCard";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface DepartmentInfo {
  id: string;
  name: string;
  code: string;
}

interface HODSummary {
  totalTeachers: number;
  totalStudents: number;
  totalPrograms: number;
  pendingRequests: number;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  status: string;
}

interface Program {
  id: string;
  name: string;
  code: string;
  level: string;
}

interface TeacherRequest {
  id: string;
  teacher_name: string;
  program_name: string;
  semester_number: number;
  course_name: string;
  status: string;
}

interface HODDashboardData {
  department: DepartmentInfo;
  summary: HODSummary;
  teachers: Teacher[];
  programs: Program[];
  requests: TeacherRequest[];
}

function Panel({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("glass-v2 border-white/5 overflow-hidden", className)}>
      <div className="flex items-start justify-between gap-4 border-b border-white/5 p-6">
        <div>
          <h2 className="text-xl font-display font-bold text-white">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-gray-400">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function EmptyState({
  icon: Icon,
  title,
  detail,
  compact = false,
}: {
  icon: any;
  title: string;
  detail: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", compact ? "py-4" : "py-12")}>
      <div className="rounded-full bg-white/5 p-4 text-gray-400">
        <Icon className={cn(compact ? "h-6 w-6" : "h-10 w-10")} />
      </div>
      <h3 className={cn("mt-4 font-semibold text-white", compact ? "text-sm" : "text-lg")}>{title}</h3>
      <p className={cn("mt-2 text-gray-400 max-w-sm mx-auto", compact ? "text-xs" : "text-sm")}>{detail}</p>
    </div>
  );
}

export default function HODDashboard() {
  const [data, setData] = useState<HODDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  const load = async () => {
    try {
      const payload = await api.getHODDashboard();
      setData(payload);
    } catch (err: any) {
      console.error("hod_dashboard_load_failed", err);
      setError(err?.message || "Unable to load HOD dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRequestAction = async (requestId: string, approve: boolean) => {
    setProcessingRequestId(requestId);
    try {
      if (approve) {
        await api.approveTeacherRequest(requestId);
      } else {
        await api.rejectTeacherRequest(requestId);
      }
      await load(); // Reload data
    } catch (err: any) {
      console.error("request_action_failed", err);
      alert(err?.message || "Action failed");
    } finally {
      setProcessingRequestId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-amber-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-v2 border border-red-400/20 p-8 text-center">
        <AlertTriangle className="mx-auto mb-4 h-8 w-8 text-red-400" />
        <h1 className="text-xl font-semibold text-white">HOD dashboard unavailable</h1>
        <p className="mt-2 text-sm text-gray-400">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      <section className="glass-v2 border-white/5 overflow-hidden">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="rounded-2xl bg-lumina-highlight/10 p-4 border border-lumina-highlight/20 text-lumina-highlight">
              <Building className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-lumina-highlight">
                Departmental Command Center
              </p>
              <h1 className="text-3xl font-display font-bold text-white">
                {data.department.name} ({data.department.code})
              </h1>
            </div>
          </div>
          
          <p className="max-w-2xl text-lg text-gray-400 leading-relaxed">
            Oversee faculty assignments, manage programs, and monitor academic performance across your department.
          </p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-4">
        <StatCard
          title="Teachers"
          value={data.summary.totalTeachers}
          subtitle="Departmental Faculty"
          icon={Users}
          color="gold"
        />
        <StatCard
          title="Students"
          value={data.summary.totalStudents}
          subtitle="Enrolled Learners"
          icon={GraduationCap}
          color="gold"
        />
        <StatCard
          title="Programs"
          value={data.summary.totalPrograms}
          subtitle="Undergraduate / Graduate"
          icon={BookOpen}
          color="gold"
        />
        <StatCard
          title="Pending Requests"
          value={data.summary.pendingRequests}
          subtitle="Teacher course assignments"
          icon={ClipboardCheck}
          color="amber"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="Teacher Requests"
          subtitle="Course and section assignment approval requests from faculty."
        >
          {data.requests.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No pending requests"
              detail="All teacher assignment requests have been processed."
              compact
            />
          ) : (
            <div className="space-y-4">
              {data.requests.map((request) => (
                <div key={request.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-white">{request.teacher_name}</p>
                    <p className="text-sm text-gray-400">
                      {request.course_name} • Sem {request.semester_number}
                    </p>
                    <p className="text-xs text-lumina-highlight/80">{request.program_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRequestAction(request.id, true)}
                      disabled={processingRequestId === request.id}
                      className="p-2 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors"
                      title="Approve"
                    >
                      <CheckCircle className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleRequestAction(request.id, false)}
                      disabled={processingRequestId === request.id}
                      className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                      title="Reject"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Faculty Overview"
          subtitle="Current teaching staff in the department."
        >
           {data.teachers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No teachers found"
              detail="No faculty members are currently assigned to this department."
              compact
            />
          ) : (
            <div className="space-y-3">
              {data.teachers.map((teacher) => (
                <div key={teacher.id} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="h-10 w-10 rounded-full bg-lumina-highlight/10 flex items-center justify-center text-lumina-highlight font-bold">
                    {teacher.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{teacher.name}</p>
                    <p className="text-xs text-gray-400">{teacher.email}</p>
                  </div>
                  <div className="ml-auto">
                     <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-white/5 border border-white/10 text-gray-400">
                       {teacher.status}
                     </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel
          title="Department Programs"
          subtitle="Active academic programs managed by this department."
        >
          {data.programs.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No programs yet"
              detail="Define programs and curricula to begin academic operations."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.programs.map((program) => (
                <div key={program.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-white/20 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-lumina-highlight px-2 py-0.5 rounded bg-lumina-highlight/10 border border-lumina-highlight/20">
                      {program.level}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">{program.code}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white truncate">{program.name}</h3>
                  <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                    <GraduationCap className="h-4 w-4" />
                    <span>Curriculum Assigned</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
    </div>
  );
}

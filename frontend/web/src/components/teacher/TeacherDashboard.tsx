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
  UserCheck,
} from "lucide-react";

import { StatCard } from "@/components/dashboard/StatCard";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import AttendanceTracker from "./AttendanceTracker";

// --- Types ---
interface TeacherSummary {
  totalStudents: number;
  activeCourses: number;
  avgMastery: number;
  pendingGrading: number;
  atRiskStudents: number;
  upcomingDeadlines: number;
  pendingAIVerifications: number;
}

interface TeacherCourseCard {
  id: string;
  title: string;
  code?: string;
  description?: string;
  status: string;
  studentCount: number;
  assignmentCount: number;
  pendingGrading: number;
  averageProgress: number;
  averageMastery: number;
  moduleCount: number;
  nextDeadline?: string | null;
  lastActivity?: string | null;
  image?: string;
  href: string;
  attention: "healthy" | "watch";
}

interface TeacherAssignmentCard {
  id: string;
  title: string;
  courseName: string;
  dueDate?: string | null;
  daysUntilDue?: number | null;
  submissionCount: number;
  pendingGrading: number;
  status: "scheduled" | "due-soon" | "overdue";
  href: string;
}

interface TeacherStudentMomentum {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: "needs-attention" | "watch" | "on-track";
  courseCount: number;
  courses: string[];
  averageProgress: number;
  averageMastery: number;
  lastActive?: string | null;
  focusArea: string;
  href: string;
}

interface TeacherPriorityItem {
  id: string;
  kind: string;
  tone: "urgent" | "watch" | "info" | "watch"; // watch is special for grading
  title: string;
  detail: string;
  href: string;
}

interface TeacherIntervention {
  id: string;
  studentId: string;
  studentName: string;
  riskLevel: string;
  topicId?: string | null;
  priority: string;
  status: string;
}

interface WeeklySnapshot {
  publishedCourses: number;
  draftCourses: number;
  assignmentsCreated: number;
  submissionsReceived: number;
}

interface TeacherDashboardData {
  summary: TeacherSummary;
  courses: TeacherCourseCard[];
  recentAssignments: TeacherAssignmentCard[];
  studentMomentum: TeacherStudentMomentum[];
  priorityItems?: TeacherPriorityItem[];
  weeklySnapshot: WeeklySnapshot;
  interventionQueue?: TeacherIntervention[];
}

// --- Constants ---
const EMPTY_SUMMARY: TeacherSummary = {
  totalStudents: 0,
  activeCourses: 0,
  avgMastery: 0,
  pendingGrading: 0,
  atRiskStudents: 0,
  upcomingDeadlines: 0,
  pendingAIVerifications: 0,
};

// --- Helper Components ---
function SectionPanel({
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
          <h2 className="text-xl font-display font-bold text-white tracking-tight">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-gray-400 font-medium">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function GradingCard({ assignment }: { assignment: TeacherAssignmentCard }) {
  return (
    <div className="flex items-center justify-between p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 group">
      <div className="flex items-center gap-5">
        <div
          className={cn(
            "p-3 rounded-2xl shadow-inner",
            assignment.status === "overdue"
              ? "bg-red-500/10 text-red-400"
              : "bg-lumina-highlight/10 text-lumina-highlight"
          )}
        >
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-bold text-white flex items-center gap-2 text-base">
            {assignment.title}
          </h4>
          <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5 font-medium">
            <BookOpen className="w-3.5 h-3.5" />
            {assignment.courseName}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-xl font-black text-white tracking-tight">
            {assignment.pendingGrading}
          </p>
          <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest leading-none">
            Pending
          </p>
        </div>
        <Link
          href={assignment.href}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-lumina-highlight text-black text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-lumina-highlight/20"
        >
          Review
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

// --- Main Component ---
export default function TeacherDashboardContent() {
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let isFetching = true;

    const loadData = async () => {
      try {
        const payload = await api.getDashboardData("teacher");
        if (isFetching) setData(payload);
      } catch (err: any) {
        console.error("Dashboard intel failed", err);
        if (isFetching) setError(err?.message || "Critical failure in dashboard intelligence synchronization.");
      } finally {
        if (isFetching) setLoading(false);
      }
    };

    loadData();
    return () => { isFetching = false; };
  }, []);

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="flex h-[75vh] items-center justify-center glass-v2 border border-white/5 rounded-3xl">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-lumina-highlight/20 border-t-lumina-highlight" />
          <p className="text-sm font-black uppercase tracking-widest text-gray-500 animate-pulse">Syncing Intelligence...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 rounded-3xl border border-red-500/20 bg-red-500/5 text-center">
        <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Sync Error</h3>
        <p className="text-gray-400 max-w-md mx-auto">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold rounded-xl border border-red-500/30 transition-all text-sm"
        >
          Recall Interface
        </button>
      </div>
    );
  }

  const {
    summary = EMPTY_SUMMARY,
    courses = [],
    recentAssignments = [],
    studentMomentum = [],
    priorityItems = [],
    weeklySnapshot,
    interventionQueue = [],
  } = data || {};

  const needsGrading = recentAssignments.filter(a => a.pendingGrading > 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Weekly Snapshot Panel - Quick Data View */}
      {weeklySnapshot && (
        <div className="p-1 gap-1 flex flex-wrap glass-v2 border-white/5 rounded-2xl overflow-hidden">
          <div className="flex-1 min-w-[120px] p-4 text-center border-r border-white/5 last:border-none">
            <p className="text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Published</p>
            <p className="text-xl font-black text-white">{weeklySnapshot.publishedCourses}</p>
          </div>
          <div className="flex-1 min-w-[120px] p-4 text-center border-r border-white/5 last:border-none">
            <p className="text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1 font-medium">Drafts</p>
            <p className="text-xl font-black text-lumina-highlight">{weeklySnapshot.draftCourses}</p>
          </div>
          <div className="flex-1 min-w-[120px] p-4 text-center border-r border-white/5 last:border-none">
            <p className="text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Assignments</p>
            <p className="text-xl font-black text-white">{weeklySnapshot.assignmentsCreated}</p>
          </div>
          <div className="flex-1 min-w-[120px] p-4 text-center border-r border-white/5 last:border-none">
            <p className="text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Submissions</p>
            <p className="text-xl font-black text-white">{weeklySnapshot.submissionsReceived}</p>
          </div>
        </div>
      )}
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={GraduationCap}
          title="Total Students"
          value={summary.totalStudents}
          trend={{ value: "+12%", isPositive: true }}
          color="gold"
        />
        <StatCard
          icon={TrendingUp}
          title="Avg Mastery"
          value={`${summary.avgMastery}%`}
          color="amber"
        />
        <StatCard
          icon={ClipboardCheck}
          title="Needs Grading"
          value={summary.pendingGrading}
          trend={{ value: "-5%", isPositive: false }}
          color="default"
        />
        <StatCard
          icon={AlertTriangle}
          title="At Risk"
          value={summary.atRiskStudents}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Section */}
        <div className="xl:col-span-2 space-y-8">
          {/* Quick Tasks */}
          {priorityItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {priorityItems.slice(0, 3).map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "group p-5 rounded-2xl border bg-gradient-to-br transition-all duration-300 hover:-translate-y-1",
                    item.tone === "urgent" 
                      ? "from-red-500/20 to-red-500/5 border-red-500/20"
                      : item.tone === "watch"
                      ? "from-lumina-highlight/20 to-lumina-highlight/5 border-lumina-highlight/20"
                      : "from-blue-500/20 to-blue-500/5 border-blue-500/20"
                  )}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">{item.kind}</p>
                  <h4 className="text-sm font-bold text-white mb-1 group-hover:text-lumina-highlight transition-colors">{item.title}</h4>
                  <p className="text-xs text-gray-400 line-clamp-1">{item.detail}</p>
                </Link>
              ))}
            </div>
          )}

          {/* Grading Hub */}
          {needsGrading.length > 0 && (
            <SectionPanel 
              title="Grading Hub" 
              subtitle="Assignments awaiting teacher intelligence."
              action={
                <Link href="/teacher/gradebook" className="text-xs font-black uppercase tracking-widest text-lumina-highlight hover:underline decoration-thickness-2 flex items-center gap-1">
                  Full Gradebook <ChevronRight size={14} />
                </Link>
              }
            >
              <div className="space-y-4">
                {needsGrading.slice(0, 3).map(a => <GradingCard key={a.id} assignment={a} />)}
              </div>
            </SectionPanel>
          )}

          {/* Attendance Intel Hub */}
          <SectionPanel 
            title="Attendance Intel" 
            subtitle="Quick attendance session for active streams."
            className="border-lumina-highlight/10 shadow-[0_20px_50px_rgba(245,158,11,0.05)]"
          >
            <AttendanceTracker standalone={false} className="p-0 border-none bg-transparent shadow-none" />
          </SectionPanel>
          
          {/* Active Courses */}
          <SectionPanel title="Active Course Streams" subtitle="Monitor your global academic streams.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {courses.slice(0, 4).map((course) => (
                <div key={course.id} className="p-5 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-white/20 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lumina-highlight to-amber-700 flex items-center justify-center text-black font-black">
                      {course.code || "CS"}
                    </div>
                    <div className="flex flex-col items-end">
                      <p className="text-xl font-black text-white">{course.studentCount}</p>
                      <p className="text-[10px] font-black uppercase tracking-tighter text-gray-500">Learners</p>
                    </div>
                  </div>
                  <h4 className="font-bold text-white mb-4 line-clamp-1">{course.title}</h4>
                  <div className="space-y-3">
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-lumina-highlight rounded-full" style={{ width: `${course.averageProgress}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      <span>Progress</span>
                      <span className="text-lumina-highlight">{course.averageProgress}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionPanel>
        </div>

        {/* Sidebar Section */}
        <div className="space-y-8">
          {/* Support clusters */}
          <SectionPanel title="Intervention Queue" subtitle="Priority support required.">
            {interventionQueue.length > 0 ? (
              <div className="space-y-4">
                {interventionQueue.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      item.riskLevel.toLowerCase() === "high" ? "bg-red-500 animate-pulse" : "bg-lumina-highlight"
                    )} />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">{item.studentName}</p>
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{item.status}</p>
                    </div>
                    <button className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-all">
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck className="text-gray-600" />
                </div>
                <p className="text-xs text-gray-500 font-medium">All students on-track.</p>
              </div>
            )}
          </SectionPanel>

          {/* Student Momentum */}
          <SectionPanel title="Student Momentum">
            <div className="space-y-6">
              {studentMomentum.slice(0, 5).map((student) => (
                <div key={student.id} className="flex items-center gap-4 group">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 overflow-hidden border border-white/10">
                      {student.avatar ? (
                        <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{student.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className={cn(
                      "absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-black",
                      student.status === "on-track" ? "bg-green-500" : student.status === "watch" ? "bg-lumina-highlight" : "bg-red-500"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{student.name}</p>
                    <p className="text-[10px] text-gray-500 font-medium">{student.focusArea}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-lumina-highlight">{student.averageMastery}%</p>
                    <p className="text-[9px] text-gray-600 uppercase font-black tracking-tighter">Mastery</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionPanel>

          {/* Snapshot Action */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-lumina-highlight to-amber-700 text-black">
             <h3 className="text-xl font-display font-black leading-tight mb-2">Create New Intelligence Hub</h3>
             <p className="text-sm font-bold opacity-80 mb-6">Launch a new course stream or curriculum module instantly.</p>
             <Link 
               href="/teacher/create-course"
               className="w-full py-3 bg-black text-white font-black uppercase tracking-widest text-xs rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl text-center block"
             >
               Initialize HUB
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

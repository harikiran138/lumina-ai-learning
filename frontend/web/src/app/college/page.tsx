"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { 
  Building2, 
  BookOpen, 
  Users, 
  Settings, 
  Activity, 
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  Sparkles,
  AlertTriangle,
  GraduationCap
} from "lucide-react";
import { api } from "@/lib/api";
import { StatCard } from "@/components/dashboard/StatCard";
import { cn } from "@/lib/utils";

interface CollegeSummary {
  totalDepartments: number;
  totalPrograms: number;
  totalFaculty: number;
  totalStudents: number;
  onboardingProgress: number;
  activeAlerts: number;
}

interface CollegeDashboardData {
  summary?: Partial<CollegeSummary>;
  recentActivity?: any[];
  departments?: any[];
}

export default function CollegeDashboard() {
  const [data, setData] = useState<CollegeDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [userData, dashboardData] = await Promise.all([
          api.getCurrentUser(),
          api.getDashboardData("college")
        ]);
        setUser(userData);
        setData(dashboardData);
      } catch (err) {
        console.error("college_dashboard_load_failed", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-lumina-highlight" />
      </div>
    );
  }

  const summary = data?.summary || {
    totalDepartments: 0,
    totalPrograms: 0,
    totalFaculty: 0,
    totalStudents: 0,
    onboardingProgress: 0,
    activeAlerts: 0
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <section className="glass-v2 border-white/5 overflow-hidden">
        <div className="grid gap-6 p-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-lumina-highlight">
              College Admin
            </p>
            <h1 className="max-w-3xl text-4xl font-display font-bold tracking-tight text-white md:text-5xl">
              Institutional <span className="text-lumina-highlight border-b-4 border-lumina-highlight/30">Control Center.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-gray-400 leading-relaxed">
              Manage your institution's academic architecture, from departments and programs 
              to user onboarding and faculty assignments.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <QuickAction
                href="/college/departments"
                icon={Building2}
                title="Academic Units"
                description="Manage departments and assign HODs."
                tone="gold"
              />
              <QuickAction
                href="/college/users"
                icon={Users}
                title="Stakeholders"
                description="Invite faculty, HODs, and bulk enroll students."
                tone="gold"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm font-semibold text-white">Onboarding Status</p>
                <p className="mt-2 text-4xl font-display font-bold text-white">
                  {summary.onboardingProgress || 0}%
                </p>
              </div>
              <div className="rounded-2xl border border-lumina-highlight/20 bg-lumina-highlight/10 px-4 py-2 text-sm font-semibold text-lumina-highlight">
                Live
              </div>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 mb-4">
              <div 
                className="bg-lumina-highlight h-2 rounded-full transition-all duration-500" 
                style={{ width: `${summary.onboardingProgress || 0}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-widest text-center">
              Institutional Setup Progress
            </p>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid gap-6 xl:grid-cols-4">
        <StatCard
          title="Departments"
          value={summary.totalDepartments || 0}
          subtitle="Academic Units"
          icon={Building2}
          color="gold"
        />
        <StatCard
          title="Programs"
          value={summary.totalPrograms || 0}
          subtitle="Degrees & Courses"
          icon={BookOpen}
          color="gold"
        />
        <StatCard
          title="Faculty"
          value={summary.totalFaculty || 0}
          subtitle="Active Educators"
          icon={Users}
          color="gold"
        />
        <StatCard
          title="Students"
          value={summary.totalStudents || 0}
          subtitle="Enrolled Learners"
          icon={GraduationCap} // From Lucide, will fix if missing
          color="gold"
        />
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Core Management"
          subtitle="Primary administrative modules for your institution."
        >
          <div className="grid gap-4">
            <LinkCard
              href="/college/departments"
              icon={Building2}
              title="Departments"
              description="Define organizational structure and HOD leadership."
            />
            <LinkCard
              href="/college/classes"
              icon={BookOpen}
              title="Programs & Classes"
              description="Set up academic years, batches, and specific sections."
            />
            <LinkCard
              href="/college/users"
              icon={Users}
              title="User Management"
              description="Control access for all institutional stakeholders."
            />
            <LinkCard
              href="/college/settings"
              icon={Settings}
              title="Institution Settings"
              description="Configure college profile and login policies."
            />
          </div>
        </Panel>

        <Panel
          title="Platform Activity"
          subtitle="Recent updates across your institution."
          action={
            <Link
              href="/college/activity"
              className="inline-flex items-center gap-2 text-sm font-semibold text-lumina-highlight hover:text-white transition-colors"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        >
          <div className="space-y-4">
            {data?.recentActivity?.length ? (
              data.recentActivity.map((activity: any, idx: number) => (
                <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                  <div className="p-2 rounded-xl bg-lumina-highlight/10 text-lumina-highlight">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01]">
                <Sparkles className="h-8 w-8 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No recent activity detected.</p>
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
  tone,
}: {
  href: string;
  icon: any;
  title: string;
  description: string;
  tone: "gold";
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 p-4 rounded-2xl border border-lumina-highlight/10 bg-gradient-to-br from-lumina-highlight/5 to-transparent hover:border-lumina-highlight/30 transition-all"
    >
      <div className="p-3 rounded-xl bg-black/40 text-lumina-highlight group-hover:scale-110 transition-transform">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
        <p className="text-xs text-gray-400 mt-1 leading-relaxed">{description}</p>
      </div>
    </Link>
  );
}

function LinkCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-lumina-highlight/20 hover:bg-white/[0.04] transition-all"
    >
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-xl bg-white/5 text-gray-400 group-hover:text-lumina-highlight transition-colors">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-lumina-highlight group-hover:translate-x-1 transition-all" />
    </Link>
  );
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

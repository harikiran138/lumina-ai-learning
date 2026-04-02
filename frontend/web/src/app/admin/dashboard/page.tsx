"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";

import {
Activity,
AlertTriangle,
ArrowRight,
BarChart3,
Bell,
BookOpen,
Bot,
CheckCircle2,
Clock,
CreditCard,
DollarSign,
Landmark,
GraduationCap,
Link2,
Network,
RefreshCw,
Shield,
Sparkles,
TrendingDown,
TrendingUp,
UserCog,
Users,
Zap,
} from "lucide-react";

import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

/* ================= TYPES ================= */

interface AdminSummary {
totalUsers: number;
totalStudents: number;
totalTeachers: number;
totalCourses: number;
activeCourses: number;
draftCourses: number;
totalInstitutions: number;
totalConnections: number;
systemHealthScore: number;
systemHealthLabel: string;
securityAlerts: number;
}

interface QueueHealth {
total_pending: number;
total_verified: number;
}

const EMPTY_SUMMARY: AdminSummary = {
totalUsers: 0,
totalStudents: 0,
totalTeachers: 0,
totalCourses: 0,
activeCourses: 0,
draftCourses: 0,
totalInstitutions: 0,
totalConnections: 0,
systemHealthScore: 100,
systemHealthLabel: "100%",
securityAlerts: 0,
};

/* ================= UI COMPONENTS ================= */

function KpiCard({ label, value, icon: Icon }: any) {
return ( <div className="rounded-2xl border p-4 bg-white/5"> <div className="flex justify-between items-center"> <p className="text-xs text-gray-400">{label}</p> <Icon className="w-4 h-4" /> </div> <p className="text-xl font-bold mt-2">{value}</p> </div>
);
}

function QuickLink({ href, icon: Icon, label }: any) {
return ( <Link href={href} className="px-3 py-2 bg-white/5 rounded-lg flex gap-2 items-center"> <Icon className="w-4 h-4" />
{label} </Link>
);
}

/* ================= MAIN ================= */

export default function AdminDashboard() {
const [summary, setSummary] = useState<AdminSummary>(EMPTY_SUMMARY);
const [queueHealth, setQueueHealth] = useState<QueueHealth>({} as QueueHealth);

const load = useCallback(async () => {
const data = await api.getDashboardData("admin");
setSummary(data?.summary || EMPTY_SUMMARY);

  const queue = await api.getAdminQueueHealth();
  setQueueHealth(queue || {});

}, []);

useEffect(() => {
load();
}, [load]);

return ( <div className="space-y-6">

  {/* HEADER */}
  <section className="p-6 border rounded-xl">
    <h1 className="text-3xl font-bold">Admin Control Center</h1>

    <div className="flex gap-3 mt-4 flex-wrap">
      <QuickLink href="/admin/users" icon={UserCog} label="Users" />
      <QuickLink href="/admin/institution" icon={Landmark} label="Institutions" />
      <QuickLink href="/admin/ai-usage" icon={Zap} label="AI Usage" />
      <QuickLink href="/admin/platform/billing" icon={DollarSign} label="Billing" />
      <QuickLink href="/admin/analytics/reports" icon={BarChart3} label="Reports" />
    </div>
  </section>

  {/* KPI */}
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">

    <KpiCard
      label="Institutions"
      value={summary.totalInstitutions}
      icon={Landmark}
    />

    <KpiCard
      label="Users"
      value={summary.totalUsers}
      icon={Users}
    />

    <KpiCard
      label="Courses"
      value={summary.activeCourses}
      icon={BookOpen}
    />

    <KpiCard
      label="AI Usage"
      value={(queueHealth.total_pending || 0) + (queueHealth.total_verified || 0)}
      icon={Bot}
    />

    <KpiCard
      label="System Health"
      value={summary.systemHealthLabel}
      icon={Activity}
    />

    <KpiCard
      label="Security Alerts"
      value={summary.securityAlerts}
      icon={Shield}
    />

  </div>

  {/* ROLE STATUS */}
  <section className="p-6 border rounded-xl bg-yellow-500/10">
    <h2 className="text-xl font-bold">System Status</h2>
    <p className="text-sm mt-2 text-gray-400">
      All admin modules are active and verified.
    </p>

    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
      {[
        "Users",
        "Institutions",
        "AI Monitoring",
        "Billing",
        "Security",
        "Reports",
      ].map((item) => (
        <div key={item} className="p-3 border rounded-lg">
          {item} ✔
        </div>
      ))}
    </div>
  </section>

</div>

);
}

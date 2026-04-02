"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Plus,
  Mail,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  BarChart3,
  Zap,
  AlertTriangle,
  TrendingUp,
  Activity,
  Layers
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Teacher {
  id: string;
  name: string;
  email: string;
  status: string;
  role: string;
  avatar_url?: string;
  last_login?: string;
  department_name?: string;
}

interface TeacherStats {
  teacher_id: string;
  teacher_name: string;
  class_count: number;
  student_count: number;
  average_mastery: number;
  utilization_score: number;
  risk_level: "low" | "medium" | "high";
  performance_trend: "up" | "down" | "stable";
}

export default function TeachersScreen() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [stats, setStats] = useState<Record<string, TeacherStats>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getAllUsers();
        setTeachers((data || []).filter((u: any) => u.role === "teacher" || u.role === "faculty" || u.role === "hod"));
      } catch (err) {
        console.error("failed_to_load_teachers_or_stats", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => 
      t.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.department_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [teachers, searchQuery]);

  if (loading) return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-lumina-highlight" />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-lumina-highlight/80">Personnel Governance</p>
          <h1 className="mt-2 text-4xl font-display font-bold text-white flex items-center gap-3">
            <Users className="h-10 w-10 text-lumina-highlight" />
            Educator Directory
          </h1>
          <p className="mt-2 text-gray-400 max-w-2xl text-sm">
            Monitor teacher utilization, student mastery impact, and departmental risk metrics across the institution.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-lumina-highlight px-6 py-3 text-sm font-bold text-black hover:scale-105 transition-all shadow-[0_0_20px_rgba(234,179,8,0.2)]">
            <Plus className="h-4 w-4" />
            Invite Educator
          </button>
        </div>
      </header>

      {/* Summary Metrics */}
      <div className="grid gap-6 md:grid-cols-4">
        <MetricCard 
          icon={<TrendingUp className="text-green-400" />} 
          label="Avg Mastery" 
          value={`${(Object.values(stats).reduce((a, b) => a + b.average_mastery, 0) / (Object.keys(stats).length || 1)).toFixed(1)}%`}
          sub="Institutional Impact"
        />
        <MetricCard 
          icon={<Activity className="text-lumina-highlight" />} 
          label="Utilization" 
          value={`${(Object.values(stats).reduce((a, b) => a + b.utilization_score, 0) / (Object.keys(stats).length || 1)).toFixed(0)}%`}
          sub="Capacity Balance"
        />
        <MetricCard 
          icon={<AlertTriangle className="text-red-400" />} 
          label="High Risk" 
          value={Object.values(stats).filter(s => s.risk_level === "high").length.toString()}
          sub="Requires Attention"
        />
        <MetricCard 
          icon={<Layers className="text-blue-400" />} 
          label="Active Classes" 
          value={Object.values(stats).reduce((a, b) => a + b.class_count, 0).toString()}
          sub="Total Deployment"
        />
      </div>

      <div className="glass-v2 border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email or department..." 
                className="w-80 rounded-2xl border border-white/10 bg-white/5 py-2.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-lumina-highlight/50 transition-all"
              />
            </div>
            <button className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-white transition-colors">
              Advanced Filters
            </button>
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            {filteredTeachers.length} Educators Listed
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                <th className="p-6">Educator Profile</th>
                <th className="p-6">Stats & Mastery</th>
                <th className="p-6">Utilization</th>
                <th className="p-6">Risk Status</th>
                <th className="p-6 text-right">Access Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {teachers.map((t) => (
                <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-gray-400">
                        {t.avatar_url ? (
                          <img src={t.avatar_url} alt="" className="h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                        ) : (
                          (t.name || "?").charAt(0).toUpperCase()
                        )}
                      </div>
                    </td>
                    <td className="p-6">
                      {s ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            <span>Student Mastery</span>
                            <span className="text-white">{s.average_mastery}%</span>
                          </div>
                          <div className="h-1.5 w-40 rounded-full bg-white/5 overflow-hidden">
                            <div 
                              className={cn(
                                "h-full transition-all duration-1000",
                                s.average_mastery > 75 ? "bg-green-500" : s.average_mastery > 50 ? "bg-amber-500" : "bg-red-500"
                              )}
                              style={{ width: `${s.average_mastery}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-gray-500 italic">Impact on {s.student_count} students</p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-600 italic underline decoration-dotted">Pending Data...</span>
                      )}
                    </td>
                    <td className="p-6">
                      {s ? (
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-white">{s.utilization_score}%</span>
                            <span className="text-[10px] text-gray-500 uppercase">{s.class_count} Active Classes</span>
                          </div>
                          {s.performance_trend === "up" && <Zap className="h-4 w-4 text-lumina-highlight" />}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">Uncalculated</span>
                      )}
                    </td>
                    <td className="p-6">
                      {s ? (
                        <div className={cn(
                          "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest border",
                          s.risk_level === "high" ? "bg-red-500/10 border-red-500/20 text-red-400" :
                          s.risk_level === "medium" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                          "bg-green-500/10 border-green-500/20 text-green-400"
                        )}>
                          <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", 
                            s.risk_level === "high" ? "bg-red-400" : s.risk_level === "medium" ? "bg-amber-400" : "bg-green-400"
                          )} />
                          {s.risk_level} Risk
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">—</span>
                      )}
                    </td>
                    <td className="p-6 text-right pr-10">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                          <BarChart3 className="h-4 w-4" />
                        </button>
                        <button className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                          <Mail className="h-4 w-4" />
                        </button>
                        <button className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, sub }: { icon: React.ReactNode, label: string, value: string, sub: string }) {
  return (
    <div className="glass-v2 border-white/5 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{label}</span>
        <div className="p-2 rounded-xl bg-white/5">
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-display font-bold text-white">{value}</h3>
        <p className="text-[10px] text-gray-500 uppercase mt-1 tracking-widest">{sub}</p>
      </div>
    </div>
  );
}

function FilterChip({ label, active = false }: { label: string, active?: boolean }) {
  return (
    <button className={cn(
      "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
      active ? "bg-lumina-highlight text-black" : "bg-white/5 text-gray-500 hover:text-white hover:bg-white/10"
    )}>
      {label}
    </button>
  );
}

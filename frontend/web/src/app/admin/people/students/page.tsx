"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Plus,
  MoreHorizontal,
  GraduationCap,
  Activity,
  Award,
  BookOpen
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Student {
  id: string;
  name: string;
  email: string;
  status: string;
  role: string;
  avatar_url?: string;
  engagement_score?: number;
}

export default function StudentsScreen() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getAllUsers();
        setStudents((data || []).filter((u: any) => u.role === "student"));
      } catch (err) {
        console.error("failed_to_load_students", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-amber-400" />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-amber-500" />
            Student Database
          </h1>
          <p className="mt-1 text-gray-400">Comprehensive view of learner enrollment, progress, and platform engagement.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-500 transition-colors">
            <Plus className="h-4 w-4" />
            Register Student
          </button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-4">
        <StatCard label="Total Students" value={students.length.toString()} sub="Across all institutions" icon={Users} color="gold" />
        <StatCard label="Active" value={students.filter(s => s.status === "active").length.toString()} sub="Currently active accounts" icon={Activity} color="gold" />
        <StatCard
          label="Avg. Engagement"
          value={students.some(s => s.engagement_score != null)
            ? `${Math.round(students.reduce((sum, s) => sum + (s.engagement_score ?? 0), 0) / students.filter(s => s.engagement_score != null).length)}%`
            : "—"}
          sub="Based on activity score"
          icon={Award}
          color="gold"
        />
        <StatCard label="Suspended" value={students.filter(s => s.status === "suspended").length.toString()} sub="Accounts suspended" icon={BookOpen} color="amber" />
      </div>

      <div className="glass-v2 border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search students..." 
                className="w-full rounded-xl border border-white/10 bg-white/5 py-1.5 pl-10 pr-4 text-xs text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <th className="p-4 pl-6">Learner</th>
                <th className="p-4">Affiliation</th>
                <th className="p-4">Engagement</th>
                <th className="p-4">Courses</th>
                <th className="p-4 text-right pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-gray-400">
                        {s.avatar_url ? (
                          <img src={s.avatar_url} alt="" className="h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                        ) : (
                          (s.name || "?").charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{s.name}</p>
                        <p className="text-[10px] text-gray-500">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Global Campus</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: '75%' }} />
                      </div>
                      <span className="text-[10px] font-bold text-white">75%</span>
                    </div>
                  </td>
                  <td className="p-4 text-xs text-gray-300">3 Active</td>
                  <td className="p-4 text-right pr-6">
                    <button className="p-2 text-gray-500 hover:text-white transition-colors">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, color }: any) {
  const colors: any = {
    blue: "text-amber-400 bg-amber-500/5 border-amber-500/10",
    emerald: "text-yellow-400 bg-yellow-500/5 border-yellow-500/10",
    purple: "text-yellow-400 bg-yellow-500/5 border-yellow-500/10",
    amber: "text-amber-400 bg-amber-500/5 border-amber-500/10",
    gold: "text-amber-400 bg-amber-500/5 border-amber-500/10",
  };
  return (
    <div className={cn("glass-v2 border p-5", colors[color])}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</span>
        <Icon className="h-4 w-4 opacity-50" />
      </div>
      <p className="text-2xl font-display font-bold text-white">{value}</p>
      <p className="mt-1 text-[10px] text-gray-500">{sub}</p>
    </div>
  );
}

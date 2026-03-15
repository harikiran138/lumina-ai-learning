"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal,
  Mail,
  GraduationCap,
  Activity,
  Award,
  BookOpen
} from "lucide-react";
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
        const res = await fetch("/api/admin/users");
        const data = await res.json();
        setStudents(data.filter((u: any) => u.role === "student"));
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
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-400" />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-blue-500" />
            Student Database
          </h1>
          <p className="mt-1 text-gray-400">Comprehensive view of learner enrollment, progress, and platform engagement.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 transition-colors">
            <Plus className="h-4 w-4" />
            Register Student
          </button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-4">
        <StatCard label="Total Students" value={students.length.toString()} sub="Across all institutions" icon={Users} color="blue" />
        <StatCard label="Active Now" value="1,240" sub="Concurrent users" icon={Activity} color="emerald" />
        <StatCard label="Avg. Engagement" value="84%" sub="+2% this month" icon={Award} color="purple" />
        <StatCard label="Enrolled Courses" value="450" sub="Total offerings" icon={BookOpen} color="amber" />
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
                      <div className="h-10 w-10 rounded-xl overflow-hidden bg-white/5 border border-white/10">
                        <img src={s.avatar_url} alt="" className="h-full w-full object-cover" />
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
                        <div className="h-full bg-blue-500" style={{ width: '75%' }} />
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
    blue: "text-blue-400 bg-blue-500/5 border-blue-500/10",
    emerald: "text-emerald-400 bg-emerald-500/5 border-emerald-500/10",
    purple: "text-purple-400 bg-purple-500/5 border-purple-500/10",
    amber: "text-amber-400 bg-amber-500/5 border-amber-500/10",
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

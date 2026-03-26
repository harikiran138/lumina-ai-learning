"use client";

import { useEffect, useState } from "react";
import { 
  Plus, 
  Search, 
  Layers, 
  GraduationCap, 
  Calendar, 
  Users,
  Settings2,
  Filter,
  MoreVertical,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RealAPI } from "@/lib/api";

interface ClassSection {
  id: string;
  program_id: string;
  semester_id: string;
  section_name: string;
  academic_year: string;
  batch_name: string;
  program_name?: string;
  semester_number?: number;
  student_count?: number;
}

export default function ClassManagement() {
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [loading, setLoading] = useState(true);
  const api = RealAPI.getInstance();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getClasses();
        setClasses(data);
      } catch (err) {
        console.error("failed_to_load_classes", err);
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
            <Layers className="h-8 w-8 text-amber-500" />
            Class Management
          </h1>
          <p className="mt-1 text-gray-400">Manage sections, batches, and student group assignments.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-500 transition-colors">
            <Plus className="h-4 w-4" />
            Add Section
          </button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <StatCard label="Total Sections" value={classes.length.toString()} sub="Across all programs" icon={Layers} />
        <StatCard label="Avg Students/Class" value="42" sub="Optimal target is 40" icon={Users} />
        <StatCard label="Active Batches" value="4" sub="2021-25 to 2024-28" icon={Calendar} />
      </div>

      <div className="glass-v2 border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                placeholder="Filter sections..." 
                className="w-full rounded-xl border border-white/10 bg-white/5 py-1.5 pl-10 pr-4 text-xs text-white placeholder:text-gray-500 focus:outline-none"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-[10px] font-bold text-gray-400 hover:text-white transition-colors">
              <Filter className="h-3.3 w-3 h-3.5 w-3.5" />
              Advanced Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/[0.02]">
                <th className="px-6 py-4">Section / Batch</th>
                <th className="px-6 py-4">Program & Semester</th>
                <th className="px-6 py-4">Students</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {classes.map((cls) => (
                <tr key={cls.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Section {cls.section_name}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-medium">{cls.batch_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <p className="text-xs text-gray-300 font-semibold">{cls.program_name || 'Generic Program'}</p>
                      <p className="text-[10px] text-amber-500/80 font-bold uppercase tracking-tight">Semester {cls.semester_number || '1'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <div className="flex -space-x-2">
                          {[1,2,3].map(i => (
                            <div key={i} className="h-6 w-6 rounded-full border-2 border-[#0B0F1A] bg-gray-600 overflow-hidden">
                               <img src={`https://ui-avatars.com/api/?name=S${i}&background=random`} alt="stub" />
                            </div>
                          ))}
                       </div>
                       <p className="text-xs font-bold text-white ml-1">{cls.student_count || '0'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                        <Settings2 className="h-4 w-4" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {classes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic text-sm">
                    No sections found. Start by adding a new section.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon }: any) {
  return (
    <div className="glass-v2 border-white/5 p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
        <Icon className="h-16 w-16 text-amber-400" />
      </div>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</p>
      <p className="mt-2 text-3xl font-display font-bold text-white">{value}</p>
      <p className="mt-1 text-[10px] text-gray-500">{sub}</p>
    </div>
  );
}

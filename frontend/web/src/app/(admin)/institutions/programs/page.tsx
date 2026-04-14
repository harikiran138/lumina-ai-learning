"use client";

import { useEffect, useState } from "react";
import { 
  GraduationCap, 
  Search, 
  Settings2, 
  Plus, 
  Calendar, 
  Clock,
  BookMarked,
  Layers,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Program {
  id: string;
  program_name: string;
  institution_id: string;
  duration?: string;
  status: string;
  students_count?: number;
}

export default function ProgramControl() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const institutions = await api.getInstitutions();
        const instId = institutions?.[0]?.id;
        const programData = instId ? await api.getPrograms(instId) : [];
        setPrograms(programData || []);
      } catch (err) {
        console.error("failed_to_load_programs", err);
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
            Program Control
          </h1>
          <p className="mt-1 text-gray-400">Configure learning tracks, degree paths, and curriculum modularity.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-500 transition-colors">
            <Plus className="h-4 w-4" />
            New Program
          </button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <StatCard label="Total Programs" value={programs.length.toString()} sub="Active learning tracks" icon={Layers} />
        <StatCard label="Enrolled Students" value="—" sub="Requires analytics endpoint" icon={Calendar} />
        <StatCard label="System Throughput" value="—" sub="Requires analytics endpoint" icon={CheckCircle2} />
      </div>

      <div className="glass-v2 border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                placeholder="Filter programs..." 
                className="w-full rounded-xl border border-white/10 bg-white/5 py-1.5 pl-10 pr-4 text-xs text-white placeholder:text-gray-500 focus:outline-none"
              />
            </div>
          </div>
          <p className="text-[10px] font-bold text-gray-500 uppercase">Managing 10 Departments</p>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <div key={program.id} className="glass-v2 border-white/5 p-5 hover:bg-white/[0.02] transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <BookMarked className="h-5 w-5" />
                </div>
                <div className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border",
                  program.status === "active" ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                )}>
                  {program.status}
                </div>
              </div>
              <h3 className="text-sm font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">{program.program_name}</h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-6">ID: {program.id}</p>
              
              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-semibold uppercase">
                  <Calendar className="h-3 w-3" />
                  {program.duration}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-yellow-400 font-semibold uppercase">
                  <Settings2 className="h-3 w-3" />
                  Configure
                </div>
              </div>
            </div>
          ))}
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

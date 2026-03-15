"use client";

import { useEffect, useState } from "react";
import { 
  Network, 
  Building2, 
  School, 
  BookOpen, 
  Plus, 
  MoreVertical,
  ChevronRight,
  ChevronDown,
  Users,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Department {
  id: string;
  name: string;
}

interface Program {
  id: string;
  program_name: string;
}

interface Institution {
  id: string;
  institution_name: string;
  type: string;
  departments?: Department[];
  programs?: Program[];
}

export default function InstitutionMap() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/institutions");
        const data = await res.json();
        
        // Fetch departments and programs for each institution
        const enriched = await Promise.all(data.map(async (inst: any) => {
          const [dRes, pRes] = await Promise.all([
            fetch(`/api/admin/institutions/${inst.id}/departments`),
            fetch(`/api/admin/connections?inst_id=${inst.id}`) // Using connections to find programs loosely for now or adding a new endpoint
          ]);
          return {
            ...inst,
            departments: await dRes.json(),
            programs: [] // Placeholder until clarified
          };
        }));
        
        setInstitutions(enriched);
      } catch (err) {
        console.error("failed_to_load_institutions", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggle = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

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
            <Network className="h-8 w-8 text-blue-500" />
            Institution Map
          </h1>
          <p className="mt-1 text-gray-400">Hierarchical overview of multi-tenant scaling and logical boundaries.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 transition-colors">
            <Plus className="h-4 w-4" />
            Add Institution
          </button>
        </div>
      </header>

      <div className="glass-v2 border-white/5 p-6 min-h-[500px]">
        <div className="flex items-center justify-between mb-8">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search hierarchy..." 
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
            <div className="flex items-center gap-1.5"><Building2 className="h-3 w-3 text-blue-400" /> Institution</div>
            <div className="flex items-center gap-1.5"><School className="h-3 w-3 text-purple-400" /> Department</div>
            <div className="flex items-center gap-1.5"><BookOpen className="h-3 w-3 text-emerald-400" /> Program</div>
          </div>
        </div>

        <div className="space-y-4">
          {institutions.map((inst) => (
            <div key={inst.id} className="group">
              <div 
                onClick={() => toggle(inst.id)}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer",
                  expanded[inst.id] ? "bg-white/5 border-white/10" : "bg-transparent border-white/5 hover:bg-white/[0.02]"
                )}
              >
                <div className="flex items-center gap-4">
                  {expanded[inst.id] ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{inst.institution_name}</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">{inst.type || "University"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 pr-4">
                  <div className="text-center">
                    <p className="text-xs font-bold text-white">{inst.departments?.length || 0}</p>
                    <p className="text-[9px] text-gray-500 uppercase">Depts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-white">{inst.programs?.length || 0}</p>
                    <p className="text-[9px] text-gray-500 uppercase">Programs</p>
                  </div>
                  <button className="p-2 text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {expanded[inst.id] && (
                <div className="ml-12 mt-2 space-y-2 border-l border-white/5 pl-6 animate-in slide-in-from-left-2 duration-300">
                  {inst.departments?.map((dept) => (
                    <div key={dept.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.02] border border-transparent hover:border-white/5 transition-all group/dept">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                          <School className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-semibold text-gray-300">{dept.name}</span>
                      </div>
                      <div className="flex items-center gap-3 px-3">
                        <Users className="h-3 w-3 text-gray-600" />
                        <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">340 Users</span>
                        <button className="opacity-0 group-hover/dept:opacity-100 p-1 text-gray-600 hover:text-white">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!inst.departments || inst.departments.length === 0) && (
                    <p className="text-[10px] text-gray-600 italic py-2">No departments registered</p>
                  )}
                  <button className="flex items-center gap-2 text-[10px] font-bold text-blue-500/70 hover:text-blue-400 py-2 px-3 transition-colors">
                    <Plus className="h-3 w-3" />
                    REGISTER NEW UNIT
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

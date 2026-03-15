"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal,
  Link2,
  Building2,
  GraduationCap,
  Shield,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Connection {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  institution_name: string;
  program_name: string;
  role: string;
}

export default function StakeholderMatrix() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/connections");
        const data = await res.json();
        setConnections(data);
      } catch (err) {
        console.error("failed_to_load_connections", err);
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
            <Users className="h-8 w-8 text-blue-500" />
            Stakeholder Matrix
          </h1>
          <p className="mt-1 text-gray-400">Map and manage the intricate graph of people, institutions, and roles.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 transition-colors">
            <Link2 className="h-4 w-4" />
            Link Stakeholder
          </button>
        </div>
      </header>

      <div className="glass-v2 border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search stakeholders..." 
                className="w-full rounded-xl border border-white/10 bg-white/5 py-1.5 pl-10 pr-4 text-xs text-white focus:outline-none"
              />
            </div>
            <button className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-white transition-colors">
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Global Synced</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <th className="p-4 pl-6">Stakeholder</th>
                <th className="p-4">Global Role</th>
                <th className="p-4">Affiliation</th>
                <th className="p-4">Program Bound</th>
                <th className="p-4">Access Level</th>
                <th className="p-4 text-right pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {connections.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 text-blue-400 group-hover:border-blue-500/30 transition-all">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{c.user_name}</p>
                        <p className="text-[10px] text-gray-500">{c.user_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-bold text-blue-400 uppercase">
                      {c.user_role || "User"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-xs text-gray-300">
                      <Building2 className="h-3.3 w-3.3 text-gray-500" />
                      {c.institution_name || "N/A"}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <GraduationCap className="h-3.3 w-3.3 text-gray-600" />
                      <span className="truncate max-w-[140px]">{c.program_name || "Enterprise Wide"}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3 w-3 text-purple-400" />
                      <span className="text-[10px] font-bold text-purple-400 uppercase">{c.role || "MEMBER"}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right pr-6">
                    <button className="p-2 text-gray-500 hover:text-white transition-colors">
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {connections.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center text-gray-600">
                        <Search className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-semibold text-gray-500">No stakeholder connections found.</p>
                      <button className="text-xs font-bold text-blue-500 hover:text-blue-400 uppercase tracking-widest mt-2">
                        Initialize Stakeholder Link
                      </button>
                    </div>
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

"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical,
  Mail,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Teacher {
  id: string;
  name: string;
  email: string;
  status: string;
  role: string;
  avatar_url?: string;
  last_login?: string;
}

export default function TeachersScreen() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/users");
        const data = await res.json();
        setTeachers(data.filter((u: any) => u.role === "teacher" || u.role === "admin"));
      } catch (err) {
        console.error("failed_to_load_teachers", err);
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
            Teacher Directory
          </h1>
          <p className="mt-1 text-gray-400">Manage educator accounts, permissions, and platform access.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 transition-colors">
            <Plus className="h-4 w-4" />
            Invite Teacher
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
                placeholder="Search teachers..." 
                className="w-full rounded-xl border border-white/10 bg-white/5 py-1.5 pl-10 pr-4 text-xs text-white focus:outline-none"
              />
            </div>
            <button className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-white transition-colors">
              <Filter className="h-4 w-4" />
              Advanced Filters
            </button>
          </div>
          <p className="text-[10px] font-bold text-gray-500 uppercase">Found {teachers.length} Educators</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <th className="p-4 pl-6">Profile</th>
                <th className="p-4">Status</th>
                <th className="p-4">Global Role</th>
                <th className="p-4">Last Active</th>
                <th className="p-4 text-right pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {teachers.map((t) => (
                <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl overflow-hidden bg-white/5 border border-white/10">
                        <img src={t.avatar_url} alt="" className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{t.name}</p>
                        <p className="text-[10px] text-gray-500 flex items-center gap-1">
                          <Mail className="h-2.5 w-2.5" />
                          {t.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {t.status === "active" ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <XCircle className="h-3 w-3 text-gray-500" />
                      )}
                      <span className={cn(
                        "text-[10px] font-bold uppercase",
                        t.status === "active" ? "text-emerald-400" : "text-gray-500"
                      )}>{t.status}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3 w-3 text-blue-400" />
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">{t.role}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                      <Clock className="h-3 w-3" />
                      {t.last_login ? new Date(t.last_login).toLocaleDateString() : "Never"}
                    </div>
                  </td>
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

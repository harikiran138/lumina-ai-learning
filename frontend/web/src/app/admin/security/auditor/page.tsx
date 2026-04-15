"use client";

import { useEffect, useState } from "react";
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Download, 
  User, 
  Globe, 
  AlertCircle,
  Clock,
  ExternalLink,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface AuditLog {
  id: string;
  admin_user_id: string;
  institution_id?: string;
  action_type: string;
  resource_name: string;
  ip_address: string;
  payload: any;
  created_at: string;
}

export default function SecurityAuditor() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const rows = await api.getAdminSecurityAuditLogs();
        const normalized: AuditLog[] = (rows || []).map((row: any, idx: number) => ({
          id: String(row.id || `audit-${idx}`),
          admin_user_id: String(row.admin_user_id || row.user_id || "admin"),
          institution_id: row.institution_id || undefined,
          action_type: String(row.action_type || row.action || "UNKNOWN"),
          resource_name: String(row.resource_name || row.resource || "system"),
          ip_address: String(row.ip_address || "N/A"),
          payload: row.payload || {},
          created_at: String(row.created_at || new Date().toISOString()),
        }));
        setLogs(normalized);
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <Lock className="h-8 w-8 text-amber-500" />
            Security Auditor
          </h1>
          <p className="mt-1 text-gray-400">Immutable trace of all administrative actions and system events.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
            <Download className="h-4 w-4" />
            Export Logs
          </button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-4">
        <AuditSummaryCard label="Total Events" value="12,450" icon={Activity} color="gold" />
        <AuditSummaryCard label="Critical Actions" value="124" icon={AlertCircle} color="amber" />
        <AuditSummaryCard label="Active Admins" value="8" icon={User} color="gold" />
        <AuditSummaryCard label="Unique IPs" value="45" icon={Globe} color="gold" />
      </div>

      <div className="glass-v2 border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search logs..." 
                className="w-full rounded-xl border border-white/10 bg-white/5 py-1.5 pl-10 pr-4 text-xs text-white placeholder:text-gray-500 focus:outline-none"
              />
            </div>
            <button className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-white transition-colors">
              <Filter className="h-3 w-3" />
              Advanced Filters
            </button>
          </div>
          <p className="text-[10px] font-bold text-gray-500 uppercase">Snapshot: Last 24 Hours</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <th className="p-4 pl-6">Timestamp</th>
                <th className="p-4">Admin</th>
                <th className="p-4">Action</th>
                <th className="p-4">Resource</th>
                <th className="p-4">IP Address</th>
                <th className="p-4 text-right pr-6">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-2 text-xs text-gray-300">
                      <Clock className="h-3 w-3 text-gray-500" />
                      {new Date(log.created_at).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-white/5 flex items-center justify-center">
                        <User className="h-3 w-3 text-amber-400" />
                      </div>
                      <span className="text-xs text-white">{log.admin_user_id}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                      log.action_type.includes("LOGIN") ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" :
                      log.action_type.includes("EXPORT") ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                      "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    )}>
                      {log.action_type}
                    </span>
                  </td>
                  <td className="p-4">
                    <code className="text-[10px] text-gray-400 font-mono">{log.resource_name}</code>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                      <Globe className="h-3 w-3" />
                      {log.ip_address}
                    </div>
                  </td>
                  <td className="p-4 text-right pr-6">
                    <button className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 ml-auto">
                      View Payload
                      <ExternalLink className="h-2.5 w-2.5" />
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

function AuditSummaryCard({ label, value, icon: Icon, color }: any) {
  const colors: any = {
    blue: "text-amber-400 bg-amber-500/5 border-amber-500/10",
    amber: "text-amber-400 bg-amber-500/5 border-amber-500/10",
    emerald: "text-yellow-400 bg-yellow-500/5 border-yellow-500/10",
    purple: "text-yellow-400 bg-yellow-500/5 border-yellow-500/10",
  };
  return (
    <div className={cn("glass-v2 border p-5", colors[color])}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</span>
        <Icon className="h-4 w-4 opacity-50" />
      </div>
      <p className="text-2xl font-display font-bold text-white">{value}</p>
    </div>
  );
}

function Activity(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

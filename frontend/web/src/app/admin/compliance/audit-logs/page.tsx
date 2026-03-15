"use client";

import { useEffect, useState } from "react";
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  User, 
  Clock, 
  FileText,
  ShieldCheck,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ComplianceLog {
  id: string;
  action: string;
  user: string;
  impact_area: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
}

export default function ComplianceAuditLogs() {
  const [logs, setLogs] = useState<ComplianceLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mocking compliance audit logs
    const mockData: ComplianceLog[] = [
      {
        id: "cl-1",
        action: "Exported Grade Snapshot",
        user: "Admin (Hari)",
        impact_area: "Student Records",
        timestamp: "10m ago",
        severity: "low"
      },
      {
        id: "cl-2",
        action: "Modified Retention Policy",
        user: "System Architect",
        impact_area: "Database Infrastructure",
        timestamp: "2h ago",
        severity: "high"
      },
      {
        id: "cl-3",
        action: "Authorized Data Deletion",
        user: "Compliance Officer",
        impact_area: "User Privacy",
        timestamp: "5h ago",
        severity: "medium"
      }
    ];
    setLogs(mockData);
    setLoading(false);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <History className="h-8 w-8 text-blue-500" />
            Compliance Audit Traces
          </h1>
          <p className="mt-1 text-gray-400">Granular view of all actions affecting data privacy and system configuration.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
            <Download className="h-4 w-4" />
            Export for External Audit
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
                placeholder="Filter trace logs..." 
                className="w-full rounded-xl border border-white/10 bg-white/5 py-1.5 pl-10 pr-4 text-xs text-white focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            < ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">WORM Storage Active</span>
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {logs.map((log) => (
            <div key={log.id} className="p-5 hover:bg-white/[0.01] transition-colors flex items-center justify-between group">
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center gap-1 min-w-[60px]">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{log.timestamp}</span>
                  <div className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    log.severity === 'high' ? "bg-red-500" : log.severity === 'medium' ? "bg-amber-500" : "bg-blue-500"
                  )} />
                </div>
                <div className="h-10 w-px bg-white/5" />
                <div>
                  <h3 className="text-sm font-bold text-white mb-0.5">{log.action}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-500 flex items-center gap-1.5 font-bold uppercase tracking-tighter">
                      <User className="h-3 w-3" />
                      {log.user}
                    </span>
                    <span className="text-[10px] text-gray-500 flex items-center gap-1.5 font-bold uppercase tracking-tighter">
                      <FileText className="h-3 w-3" />
                      {log.impact_area}
                    </span>
                  </div>
                </div>
              </div>
              <button className="p-2 text-gray-600 hover:text-white transition-colors">
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

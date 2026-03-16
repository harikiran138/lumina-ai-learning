"use client";

import { useEffect, useState } from "react";
import { 
  Trash2, 
  Search, 
  Filter, 
  User, 
  Clock, 
  AlertTriangle,
  FileText,
  ShieldX,
  CheckCircle2,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DeletionRequest {
  id: string;
  user_email: string;
  requested_at: string;
  status: 'pending' | 'processing' | 'completed';
  type: 'full_purge' | 'pii_redaction';
  sla_deadline: string;
}

export default function DeletionRequests() {
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mocking deletion requests
    const mockData: DeletionRequest[] = [
      {
        id: "del-901",
        user_email: "st123@university.edu",
        requested_at: "2 hours ago",
        status: "pending",
        type: "full_purge",
        sla_deadline: "29 days left"
      },
      {
        id: "del-905",
        user_email: "t.jones@college.in",
        requested_at: "1 day ago",
        status: "processing",
        type: "pii_redaction",
        sla_deadline: "28 days left"
      },
      {
        id: "del-880",
        user_email: "alum.99@school.org",
        requested_at: "5 days ago",
        status: "completed",
        type: "full_purge",
        sla_deadline: "N/A"
      }
    ];
    setRequests(mockData);
    setLoading(false);
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
            <Trash2 className="h-8 w-8 text-red-500" />
            Deletion Requests
          </h1>
          <p className="mt-1 text-gray-400">Manage user right-to-be-forgotten requests and data retention policies.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
            <ShieldX className="h-5 w-5" />
            <div className="text-left">
              <p className="text-xs font-bold leading-none">Global Retention Policy</p>
              <p className="text-[10px] mt-1 opacity-70">Active: 7 Years Financial / 2 Years Activity</p>
            </div>
          </div>
        </div>
      </header>

      <div className="glass-v2 border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search requests..." 
                className="w-full rounded-xl border border-white/10 bg-white/5 py-1.5 pl-10 pr-4 text-xs text-white focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">SLA Monitoring Active</span>
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {requests.map((req) => (
            <div key={req.id} className="p-6 hover:bg-white/[0.01] transition-colors flex items-center justify-between group">
              <div className="flex items-center gap-6">
                <div className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center border",
                  req.status === 'completed' ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500" :
                  req.status === 'processing' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                  "bg-amber-500/10 border-amber-500/20 text-amber-500"
                )}>
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">{req.user_email}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-gray-600" />
                      <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">Requested: {req.requested_at}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3 w-3 text-gray-600" />
                      <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">{req.type.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className={cn(
                    "text-xs font-bold font-mono",
                    req.status === 'pending' ? "text-amber-500" : "text-gray-500"
                  )}>
                    {req.sla_deadline}
                  </p>
                  <p className="text-[9px] text-gray-600 uppercase font-bold tracking-widest">{req.status === 'completed' ? 'PURGED' : 'SLA REMAINING'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className={cn(
                    "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all",
                    req.status === 'completed' ? "bg-yellow-500/10 text-yellow-400 cursor-default" : "bg-amber-600 text-white hover:bg-amber-500"
                  )}>
                    {req.status === 'completed' ? 'Verified' : 'Process Request'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-amber-500/5 border border-amber-500/10 p-5 flex items-start gap-4">
        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-amber-500 uppercase tracking-wider">Critical Warning</h4>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            Full purges are <span className="text-amber-400 font-bold underline">irreversible</span>. Once the processing stage is complete, all associated records in PostgreSQL and MinIO will be scrubbed. Ensure ID verification is performed before manual approval.
          </p>
        </div>
      </div>
    </div>
  );
}

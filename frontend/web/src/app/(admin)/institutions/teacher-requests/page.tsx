"use client";

import { useEffect, useState } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  UserCheck, 
  Clock, 
  Search,
  Filter,
  GraduationCap,
  BookOpen,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RealAPI } from "@/lib/api";

interface TeacherRequest {
  id: string;
  teacher_id: string;
  course_id: string;
  class_id: string;
  status: string;
  created_at: string;
  teacher_name?: string;
  course_name?: string;
  section_name?: string;
}

export default function TeacherRequestDashboard() {
  const [requests, setRequests] = useState<TeacherRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const api = RealAPI.getInstance();

  const loadRequests = async () => {
    try {
      const data = await api.getTeacherRequests();
      setRequests(data);
    } catch (err) {
      console.error("failed_to_load_requests", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAction = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    setProcessingId(requestId);
    try {
      await api.updateTeacherRequest(requestId, status);
      await loadRequests();
    } catch (err) {
      console.error("failed_to_update_request", err);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-amber-400" />
    </div>
  );

  const pending = requests.filter(r => r.status === 'PENDING');
  const history = requests.filter(r => r.status !== 'PENDING');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
          <UserCheck className="h-8 w-8 text-amber-500" />
          Teacher Access Requests
        </h1>
        <p className="mt-1 text-gray-400">Review and authorize curriculum ownership for specific class sections.</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-sm font-bold text-amber-500/80 uppercase tracking-widest flex items-center gap-2">
           <Clock className="h-4 w-4" />
           Pending Approval ({pending.length})
        </h2>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pending.map((req) => (
            <div key={req.id} className="glass-v2 border-white/5 p-5 hover:bg-white/[0.02] transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tabular-nums">
                  {new Date(req.created_at).toLocaleDateString()}
                </div>
              </div>

              <h3 className="text-sm font-bold text-white mb-1 group-hover:text-amber-400 transition-colors uppercase tracking-tight">
                {req.teacher_name || 'Teacher Request'}
              </h3>
              
              <div className="space-y-2 mt-4 pb-4 border-b border-white/5">
                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-semibold uppercase">
                   <BookOpen className="h-3 w-3 text-amber-500/50" />
                   {req.course_name || 'Generic Course'}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-semibold uppercase">
                   <GraduationCap className="h-3 w-3 text-amber-500/50" />
                   Section {req.section_name || 'A'}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                 <button 
                  onClick={() => handleAction(req.id, 'APPROVED')}
                  disabled={processingId === req.id}
                  className="flex-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 py-2 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2"
                 >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Approve
                 </button>
                 <button 
                  onClick={() => handleAction(req.id, 'REJECTED')}
                  disabled={processingId === req.id}
                  className="flex-1 rounded-xl bg-red-500/10 border border-red-500/20 py-2 text-[11px] font-bold text-red-400 hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                 >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                 </button>
              </div>
            </div>
          ))}

          {pending.length === 0 && (
            <div className="col-span-full py-8 text-center glass-v2 border-dashed border-white/10 text-gray-500 text-sm italic">
               No pending requests at the moment.
            </div>
          )}
        </div>
      </section>

      {history.length > 0 && (
        <section className="space-y-4 pt-8">
           <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">
              Request History
           </h2>
           <div className="glass-v2 border-white/5 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 text-[9px] font-bold text-gray-600 uppercase tracking-widest bg-white/[0.01]">
                    <th className="px-6 py-3">Teacher</th>
                    <th className="px-6 py-3">Course / Section</th>
                    <th className="px-6 py-3">Outcome</th>
                    <th className="px-6 py-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {history.map(req => (
                    <tr key={req.id} className="text-[11px] text-gray-300">
                      <td className="px-6 py-3 font-semibold text-white">{req.teacher_name}</td>
                      <td className="px-6 py-3">
                         <span className="text-gray-400">{req.course_name}</span>
                         <span className="mx-2 text-gray-600">→</span>
                         <span className="text-amber-500/80 font-bold uppercase">Sec {req.section_name}</span>
                      </td>
                      <td className="px-6 py-3">
                         <span className={cn(
                           "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border",
                           req.status === 'APPROVED' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                         )}>
                            {req.status}
                         </span>
                      </td>
                      <td className="px-6 py-3 text-right text-gray-500 font-medium tabular-nums">
                         {new Date(req.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </section>
      )}
    </div>
  );
}

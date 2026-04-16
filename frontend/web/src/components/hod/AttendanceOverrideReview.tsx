"use client";

import { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  UserCircle2, 
  AlertCircle,
  Loader2,
  Filter,
  ArrowRightLeft
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AttendanceOverrideReview() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const response = await api.getPendingOverrideRequests();
      setRequests(response || []);
    } catch (e) {
      console.error("Failed to fetch override requests", e);
      toast.error("Failed to load pending override requests");
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (requestId: string, status: "APPROVED" | "REJECTED") => {
    setProcessingId(requestId);
    try {
      await api.reviewOverrideRequest(requestId, status);
      toast.success(`Request ${status.toLowerCase()} successfully`);
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (e) {
      console.error("Failed to review request", e);
      toast.error("Failed to process request");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 bg-surface-elevated/40 rounded-3xl border border-border">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-text-secondary font-medium animate-pulse">Scanning Override Requests...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-surface-elevated/20 rounded-3xl border border-dashed border-border p-8">
        <div className="w-16 h-16 rounded-full bg-surface-elevated flex items-center justify-center mb-4 border border-border">
          <CheckCircle2 className="w-8 h-8 text-text-muted" />
        </div>
        <h3 className="text-lg font-bold text-text mb-1">Queue Clear</h3>
        <p className="text-sm text-text-secondary max-w-xs mx-auto italic">
          No pending attendance override requests require your review.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
          <ArrowRightLeft size={16} />
          Pending Overrides ({requests.length})
        </h3>
      </div>

      <div className="grid gap-3">
        {requests.map((request) => (
          <div 
            key={request.id}
            className="group bg-surface border border-border rounded-2xl p-4 hover:border-primary/30 transition-all shadow-sm"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-surface-elevated flex items-center justify-center border border-border text-primary shrink-0 transition-colors group-hover:bg-primary/5">
                  <UserCircle2 size={24} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-text leading-none">
                      Student UID: {request.student_id.substring(0, 8)}...
                    </p>
                    <span className="px-2 py-0.5 rounded-full bg-surface-elevated border border-border text-[9px] font-black uppercase text-text-muted">
                      Req by Counselor
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-red-500 font-bold uppercase text-[10px] bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                      {request.original_status}
                    </span>
                    <ChevronRight size={14} className="text-text-muted" />
                    <span className="text-green-500 font-bold uppercase text-[10px] bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">
                      {request.requested_status}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed max-w-md italic mt-1 border-l-2 border-primary/20 pl-2 py-1 bg-primary/5 rounded-r-lg">
                    "{request.reason}"
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <button
                  onClick={() => handleReview(request.id, "REJECTED")}
                  disabled={processingId === request.id}
                  className="p-2.5 rounded-xl bg-red-400/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-400/20 transition-all disabled:opacity-50"
                  title="Reject"
                >
                  <XCircle size={20} />
                </button>
                <button
                  onClick={() => handleReview(request.id, "APPROVED")}
                  disabled={processingId === request.id}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:brightness-110 text-primary-foreground font-black rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50 text-sm"
                >
                  {processingId === request.id ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    <CheckCircle2 size={18} />
                  )}
                  Approve
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChevronRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

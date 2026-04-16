"use client";

import { useState } from "react";
import { 
  X, 
  Send, 
  AlertCircle, 
  Loader2, 
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RequestOverrideModalProps {
  student: {
    id: string;
    full_name: string;
    student_roll?: string;
  };
  currentStatus: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function RequestOverrideModal({
  student,
  currentStatus,
  onClose,
  onSuccess
}: RequestOverrideModalProps) {
  const [requestedStatus, setRequestedStatus] = useState(currentStatus === "absent" ? "present" : "absent");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("Please provide a justification for the override");
      return;
    }

    setSubmitting(true);
    try {
      await api.requestAttendanceOverride({
        student_id: student.id,
        original_status: currentStatus,
        requested_status: requestedStatus,
        reason: reason.trim()
      });
      
      toast.success("Override request submitted for HOD review");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Override request failed", err);
      toast.error(err.message || "Failed to submit override request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-surface border border-border rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border bg-surface-elevated/40">
          <div>
            <h2 className="text-xl font-bold text-text">Attendance Override</h2>
            <p className="text-xs text-text-secondary mt-0.5">Formal request for status modification</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-surface-elevated text-text-muted transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Student Info Card */}
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
              {student.full_name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold text-text leading-tight">{student.full_name}</p>
              <p className="text-[10px] text-text-muted mt-0.5 font-mono">{student.student_roll || "N/A"}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 p-3 bg-surface-elevated rounded-2xl border border-border">
              <div className="text-center flex-1">
                <p className="text-[9px] font-black uppercase text-text-muted mb-1">Current</p>
                <span className="px-3 py-1 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-black uppercase tracking-wider">
                  {currentStatus}
                </span>
              </div>
              <ArrowRight className="text-text-muted" size={16} />
              <div className="text-center flex-1">
                <p className="text-[9px] font-black uppercase text-text-muted mb-1">Requested</p>
                <select
                  value={requestedStatus}
                  onChange={(e) => setRequestedStatus(e.target.value)}
                  className="bg-green-500/10 text-green-500 border border-green-500/20 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg outline-none cursor-pointer"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1 flex items-center gap-1.5">
                <AlertCircle size={12} className="text-primary" />
                Justification for Override
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this status needs to be changed (e.g., Medical leave verification, Technical error...)"
                className="w-full h-32 p-4 bg-surface border border-border rounded-2xl text-sm text-text outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all resize-none italic"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-border hover:bg-surface-elevated text-text-secondary font-bold rounded-2xl transition-all text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:brightness-110 text-primary-foreground font-black rounded-2xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50 text-sm"
            >
              {submitting ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                <Send size={16} />
              )}
              {submitting ? "Sending..." : "Request Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

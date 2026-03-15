"use client";

import { useEffect, useState } from "react";
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  Lock, 
  EyeOff, 
  Trash2, 
  FileCheck,
  Download,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ComplianceDashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
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
            <ShieldAlert className="h-8 w-8 text-blue-500" />
            Compliance Dashboard
          </h1>
          <p className="mt-1 text-gray-400">Monitor data privacy, GDPR compliance, and legal audit readiness across Lumina.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
            <Download className="h-4 w-4" />
            Compliance Certificate
          </button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <ComplianceMetric label="GDPR Health" value="100%" sub="All regions compliant" state="success" />
        <ComplianceMetric label="Pending Deletions" value="14" sub="7-day SLA active" state="warning" />
        <ComplianceMetric label="Access Requests" value="3" sub="SARs in progress" state="info" />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Active Compliance Audits
          </h2>
          <div className="space-y-4">
            <AuditItem title="Annual Data Privacy Impact Assessment (DPIA)" status="Signed" date="March 12, 2026" />
            <AuditItem title="Student Information Security Audit" status="In Progress" date="Target: April 2026" />
            <AuditItem title="Third-Party Processor Review" status="Expired" date="Action Required" isUrgent />
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Privacy Controls
          </h2>
          <div className="glass-v2 border-white/5 p-6 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">PII Redaction</p>
                  <p className="text-[10px] text-gray-500">Automated masking in logs</p>
                </div>
                <div className="h-6 w-11 rounded-full bg-blue-600 relative cursor-pointer shadow-[0_0_10px_rgba(37,99,235,0.4)]">
                  <div className="h-4 w-4 rounded-full bg-white absolute top-1 right-1" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Geo-Fencing</p>
                  <p className="text-[10px] text-gray-500">Restrict data to EU/IN</p>
                </div>
                <div className="h-6 w-11 rounded-full bg-white/5 border border-white/10 relative cursor-pointer">
                  <div className="h-4 w-4 rounded-full bg-gray-600 absolute top-1 left-1" />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Quick Actions</h4>
              <div className="grid gap-2">
                <button className="flex items-center gap-3 w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-xs font-bold text-white text-left group">
                  <EyeOff className="h-4 w-4 text-gray-500 group-hover:text-blue-400" />
                  Request Data Obfuscation
                </button>
                <button className="flex items-center gap-3 w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-xs font-bold text-white text-left group">
                  <Trash2 className="h-4 w-4 text-gray-500 group-hover:text-red-400" />
                  Execute Batch Purge
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComplianceMetric({ label, value, sub, state }: any) {
  const colors: any = {
    success: "text-emerald-400 bg-emerald-500/5 border-emerald-500/10 shadow-[0_4px_20px_rgba(16,185,129,0.05)]",
    warning: "text-amber-400 bg-amber-500/5 border-amber-500/10 shadow-[0_4px_20px_rgba(245,158,11,0.05)]",
    info: "text-blue-400 bg-blue-500/5 border-blue-500/10 shadow-[0_4px_20px_rgba(59,130,246,0.05)]",
  };
  return (
    <div className={cn("glass-v2 border p-6 relative overflow-hidden group", colors[state])}>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</p>
      <div className="flex items-baseline gap-2 mt-2">
        <p className="text-3xl font-display font-bold text-white">{value}</p>
        <span className="text-[10px] uppercase font-bold text-gray-500">{sub}</span>
      </div>
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <ShieldAlert className="h-16 w-16" />
      </div>
    </div>
  );
}

function AuditItem({ title, status, date, isUrgent }: any) {
  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:bg-white/[0.04] transition-all">
      <div className="flex items-center gap-4">
        <div className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center border",
          isUrgent ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-white/5 border-white/10 text-gray-500"
        )}>
          {status === 'Signed' ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <AlertCircle className="h-5 w-5" />}
        </div>
        <div>
          <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{title}</h4>
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter mt-1">{date}</p>
        </div>
      </div>
      <div className={cn(
        "px-2 py-0.5 rounded-lg border text-[9px] font-bold uppercase",
        status === 'Signed' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
        isUrgent ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-white/5 border-white/10 text-gray-500"
      )}>
        {status}
      </div>
    </div>
  );
}

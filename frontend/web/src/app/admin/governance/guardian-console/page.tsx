"use client";

import { useEffect, useState } from "react";
import { 
  ShieldAlert, 
  ShieldCheck, 
  UserX, 
  MessageSquareOff, 
  Lock,
  ArrowRight,
  RefreshCw,
  Terminal,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GuardianSignal {
  id: string;
  flag_type: string;
  severity: string;
  user_id: string;
  institution_id?: string;
  context: any;
  resolved: boolean;
  created_at: string;
}

export default function GuardianConsole() {
  const [signals, setSignals] = useState<GuardianSignal[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSignals = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/guardian");
      const data = await res.json();
      setSignals(data);
    } catch (err) {
      console.error("failed_to_load_guardian_signals", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSignals();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-amber-500" />
            Guardian Console
          </h1>
          <p className="mt-1 text-gray-400">Autonomous safety agent monitoring system-wide activity.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadSignals}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Sync Signals
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-500 transition-colors">
            Configure Agent
          </button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <MonitorBox 
          title="Protection Status" 
          value="Active" 
          status="online"
          detail="All models monitored"
          icon={ShieldCheck}
        />
        <MonitorBox 
          title="Flag Rate" 
          value="1.2%" 
          status="normal"
          detail="-0.4% from last week"
          icon={Activity}
        />
        <MonitorBox 
          title="Active Blocks" 
          value="14" 
          status="warning"
          detail="8 requires review"
          icon={Lock}
        />
      </div>

      <div className="glass-v2 border-white/5 overflow-hidden">
        <div className="border-b border-white/5 p-4 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Live Security Signal Feed</h2>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-bold text-red-500/80 uppercase">Realtime</span>
          </div>
        </div>
        <div className="divide-y divide-white/5">
          {signals.map((signal) => (
            <div key={signal.id} className="p-6 transition-colors hover:bg-white/[0.02]">
              <div className="flex items-start gap-4">
                <div className={cn(
                  "mt-1 rounded-full p-2 border",
                  signal.severity === "high" ? "bg-red-500/10 border-red-500/20 text-red-400" :
                  signal.severity === "medium" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                  "bg-amber-500/10 border-amber-500/20 text-amber-400"
                )}>
                  {signal.flag_type === "PII" ? <UserX className="h-4 w-4" /> : 
                   signal.flag_type === "INAPPROPRIATE" ? <MessageSquareOff className="h-4 w-4" /> : 
                   <ShieldAlert className="h-4 w-4" />}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{signal.flag_type} Detected</span>
                      <span className="text-xs text-gray-500">• {new Date(signal.created_at).toLocaleString()}</span>
                    </div>
                    <div className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                      signal.severity === "high" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                    )}>
                      {signal.severity}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">
                    User <code className="text-amber-400">{signal.user_id.slice(0, 8)}</code> triggered a security flag in institution <code className="text-amber-400">{signal.institution_id?.slice(0, 8) || "System"}</code>.
                  </p>
                  <div className="flex items-center gap-4 pt-2">
                    <button className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1">
                      View Context <Terminal className="h-3 w-3" />
                    </button>
                    <button className="text-xs font-bold text-yellow-400 hover:underline flex items-center gap-1">
                      Resolve <ShieldCheck className="h-3 w-3" />
                    </button>
                    <button className="text-xs font-bold text-red-400 hover:underline flex items-center gap-1">
                      Hard Block <Lock className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {(!signals || signals.length === 0) && (
            <div className="p-12 text-center text-gray-500 italic">
              Guardian is currently silent. No active signals detected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MonitorBox({ title, value, status, detail, icon: Icon }: any) {
  return (
    <div className="glass-v2 border-white/5 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400 ring-1 ring-amber-500/20">
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-sm font-semibold text-gray-400">{title}</span>
        </div>
        <div className={cn(
          "h-2 w-2 rounded-full",
          status === "online" ? "bg-yellow-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : 
          status === "warning" ? "bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" : 
          "bg-amber-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
        )} />
      </div>
      <div>
        <div className="text-3xl font-display font-bold text-white">{value}</div>
        <div className="mt-1 text-xs text-gray-500">{detail}</div>
      </div>
    </div>
  );
}

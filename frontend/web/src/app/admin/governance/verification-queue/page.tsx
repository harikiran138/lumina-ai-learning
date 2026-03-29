"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Search,
  Filter,
  ArrowRight
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface QueueItem {
  id: string;
  student_id: string;
  teacher_id: string;
  student_question: string;
  ai_generated_answer: string;
  ai_confidence: number;
  status: string;
  created_at: string;
}

interface QueueStats {
  total_pending: number;
  total_verified: number;
  avg_verification_time: string;
  backlog_trend: string;
  queue_items: QueueItem[];
}

export default function VerificationQueue() {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getVerificationQueue();
        setStats(data);
      } catch (err) {
        console.error("failed_to_load_queue", err);
      } finally {
        setLoading(false);
      }
    };
    load();
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
          <h1 className="text-3xl font-display font-bold text-white">Verification Queue</h1>
          <p className="mt-1 text-gray-400">Audit AI-generated answers for quality and compliance.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search questions..." 
              className="w-64 rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            />
          </div>
          <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-4">
        <StatItem 
          label="Pending Audit" 
          value={stats?.total_pending || 0} 
          icon={Clock} 
          color="amber" 
        />
        <StatItem 
          label="Verified Today" 
          value={stats?.total_verified || 0} 
          icon={CheckCircle2} 
          color="gold" 
        />
        <StatItem 
          label="Avg Wait" 
          value={stats?.avg_verification_time || "1.4h"} 
          icon={Activity} 
          color="gold" 
        />
        <StatItem 
          label="Backlog Trend" 
          value={stats?.backlog_trend || "Stable"} 
          icon={ShieldCheck} 
          color="gold" 
        />
      </div>

      <div className="glass-v2 border-white/5 overflow-hidden">
        <div className="border-b border-white/5 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Tab label="Pending" active={filter === "pending"} onClick={() => setFilter("pending")} count={stats?.total_pending} />
            <Tab label="Verified" active={filter === "verified"} onClick={() => setFilter("verified")} />
            <Tab label="Flagged" active={filter === "flagged"} onClick={() => setFilter("flagged")} />
          </div>
        </div>
        <div className="divide-y divide-white/5">
          {stats?.queue_items.filter(item => item.status === filter || filter === "all").map((item) => (
            <div key={item.id} className="p-6 transition-colors hover:bg-white/[0.02]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Question</span>
                    <span className="text-xs text-gray-500">• {new Date(item.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-lg font-medium text-white">{item.student_question}</p>
                  <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
                    <p className="text-sm text-gray-300 line-clamp-2">{item.ai_generated_answer}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3 min-w-[140px]">
                  <div className={cn(
                    "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]",
                    item.ai_confidence > 0.8 ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  )}>
                    {Math.round(item.ai_confidence * 100)}% Match
                  </div>
                  <button className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white transition-transform hover:scale-105 active:scale-95">
                    Verify
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {(!stats?.queue_items || stats.queue_items.length === 0) && (
            <div className="p-12 text-center text-gray-500">
              No items in the queue.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value, icon: Icon, color }: any) {
  const colors: any = {
    amber: "from-amber-500/20 to-amber-500/5 text-amber-300 border-amber-400/20",
    emerald: "from-yellow-500/20 to-yellow-500/5 text-yellow-300 border-yellow-400/20",
    blue: "from-amber-500/20 to-amber-500/5 text-amber-300 border-amber-400/20",
    purple: "from-yellow-500/20 to-yellow-500/5 text-yellow-300 border-yellow-400/20",
    gold: "from-amber-400/20 to-amber-400/5 text-amber-200 border-amber-400/20",
  };
  return (
    <div className={cn("glass-v2 bg-gradient-to-br p-6 border", colors[color])}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold opacity-80 text-white">{label}</p>
        <Icon className="h-5 w-5 opacity-80" />
      </div>
      <p className="mt-4 text-3xl font-display font-bold text-white">{value}</p>
    </div>
  );
}

function Tab({ label, active, onClick, count }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "relative py-4 px-2 text-sm font-semibold transition-colors",
        active ? "text-white" : "text-gray-500 hover:text-gray-300"
      )}
    >
      {label}
      {count ? <span className="ml-2 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400 border border-amber-500/20">{count}</span> : null}
      {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />}
    </button>
  );
}


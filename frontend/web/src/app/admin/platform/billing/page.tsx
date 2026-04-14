"use client";

import { useEffect, useState } from "react";
import { 
  CreditCard, 
  Search, 
  Filter, 
  Zap, 
  Clock, 
  ArrowUpRight,
  Download,
  ShieldCheck,
  TrendingUp,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function BillingSubscription() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
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
            <CreditCard className="h-8 w-8 text-amber-500" />
            Billing & Fiscal Control
          </h1>
          <p className="mt-1 text-gray-400">Manage institutional licenses, token usage billing, and platform revenue.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
            <Download className="h-4 w-4" />
            Tax Invoices
          </button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-4">
        <FiscalMetric label="MRR" value="$142.5k" trend="+12%" />
        <FiscalMetric label="Token Cost" value="$12.2k" trend="-4%" isGoodNeg />
        <FiscalMetric label="Active Seats" value="14,250" trend="+850" />
        <FiscalMetric label="LTV/CAC" value="4.8x" trend="+0.2" />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Usage Overview */}
        <div className="lg:col-span-2 glass-v2 border-white/5 p-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-sm font-bold text-white">AI Resource Utilization</h3>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">Token burns & Provider costs</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs font-bold text-white">64.2M</p>
                <p className="text-[9px] text-gray-600 uppercase font-bold">Total Tokens</p>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="text-right">
                <p className="text-xs font-bold text-amber-400">$3.4k</p>
                <p className="text-[9px] text-gray-600 uppercase font-bold">Unbilled</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <UsageBar label="GPT-4o (Reasoning)" value={78} color="gold" cost="$8,450" />
            <UsageBar label="Claude 3.5 (Design)" value={42} color="gold" cost="$2,120" />
            <UsageBar label="Standard Vector Ops" value={22} color="gold" cost="$450" />
          </div>
        </div>

        {/* Plan Tiers */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Plan Distribution
          </h3>
          <div className="glass-v2 border-white/5 p-6 space-y-4">
            <PlanItem label="Enterprise Elite" count={12} color="gold" />
            <PlanItem label="University Wide" count={42} color="gold" />
            <PlanItem label="Institutional Pilot" count={28} color="gold" />
          </div>
          
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Auto-Scale Active</span>
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed">System is automatically provisioning resources for Semester Start surge. Current headroom: 32%.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FiscalMetric({ label, value, trend, isGoodNeg }: any) {
  const isUp = trend.startsWith('+');
  const positive = isGoodNeg ? !isUp : isUp;
  return (
    <div className="glass-v2 border-white/5 p-6 relative group overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
        <BarChart3 className="h-16 w-16" />
      </div>
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-2xl font-display font-bold text-white">{value}</p>
        <span className={cn(
          "text-[9px] font-bold px-1 py-0.5 rounded",
          positive ? "text-yellow-400 bg-yellow-500/10" : "text-red-400 bg-red-500/10"
        )}>
          {trend}
        </span>
      </div>
    </div>
  );
}

function UsageBar({ label, value, color, cost }: any) {
  const colors: any = {
    blue: "bg-amber-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]",
    purple: "bg-yellow-500 shadow-[0_0_10px_rgba(147,51,234,0.3)]",
    emerald: "bg-yellow-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]",
    gold: "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]",
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-white">{label}</span>
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-gray-500 font-bold">{value}% QUOTA</span>
          <span className="text-xs font-mono font-bold text-gray-400">{cost}</span>
        </div>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div className={cn("h-full transition-all duration-1000", colors[color])} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function PlanItem({ label, count, color }: any) {
  const bgColors: any = {
    blue: "bg-amber-500/20 text-amber-400",
    purple: "bg-yellow-500/20 text-yellow-400",
    emerald: "bg-yellow-500/20 text-yellow-400",
    gold: "bg-amber-400/20 text-amber-300",
  };
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
      <span className="text-xs font-bold text-gray-300">{label}</span>
      <span className={cn("px-2 py-0.5 rounded-lg text-[10px] font-bold", bgColors[color])}>{count}</span>
    </div>
  );
}

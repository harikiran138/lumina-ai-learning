"use client";

import { useEffect, useState } from "react";
import {
  Cpu,
  Zap,
  Settings,
  BarChart3,
  Layers,
  Activity,
  CheckCircle2,
  DollarSign,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface AIModel {
  id: string;
  provider: string;
  status: string;
  avg_latency: string;
  token_usage: string;
  success_rate: string;
  cost_per_1k: string;
  active: boolean;
}

interface AICosts {
  total_tokens: number;
  total_cost: string;
  monthly_budget: string;
  usage_percentage: string;
  breakdown_by_model: { model: string; tokens: string; cost: string }[];
}

const PALETTE = ["bg-amber-500", "bg-yellow-400", "bg-orange-500", "bg-yellow-600", "bg-amber-300"];

function parseLatencyMs(latency: string): number {
  const match = latency?.match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : 0;
}

function computeAggregateLatency(models: AIModel[]): string {
  if (!models.length) return "—";
  const avg = models.reduce((sum, m) => sum + parseLatencyMs(m.avg_latency), 0) / models.length;
  return `${avg.toFixed(2)}s`;
}

function computeBreakdownWidths(breakdown: AICosts["breakdown_by_model"]): { model: string; width: string; cost: string }[] {
  if (!breakdown?.length) return [];
  const parseCost = (c: string) => parseFloat(c.replace(/[$,]/g, "")) || 0;
  const total = breakdown.reduce((sum, b) => sum + parseCost(b.cost), 0);
  if (total === 0) return breakdown.map((b) => ({ model: b.model, width: "0%", cost: b.cost }));
  return breakdown.map((b) => ({
    model: b.model,
    width: `${((parseCost(b.cost) / total) * 100).toFixed(1)}%`,
    cost: b.cost,
  }));
}

export default function AIModelHub() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [costs, setCosts] = useState<AICosts | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [fetchedModels, fetchedCosts] = await Promise.all([
        api.getAiModels(),
        api.getAiCosts(),
      ]);
      setModels(fetchedModels || []);
      setCosts(fetchedCosts || null);
    } catch (err) {
      console.error("failed_to_load_ai_data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-amber-400" />
    </div>
  );

  const activeCount = models.filter((m) => m.active !== false && m.status !== "down").length;
  const aggregateLatency = computeAggregateLatency(models);
  const breakdown = computeBreakdownWidths(costs?.breakdown_by_model || []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <Cpu className="h-8 w-8 text-amber-500" />
            AI Model Hub
          </h1>
          <p className="mt-1 text-gray-400">Manage LLM providers, benchmarks, and inference infrastructure.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </button>
          <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
            <Settings className="h-4 w-4" />
            Provider Settings
          </button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="glass-v2 border-white/5 p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Zap className="h-16 w-16 text-amber-400" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Aggregate Inference</p>
          <p className="mt-2 text-3xl font-display font-bold text-white">{aggregateLatency}</p>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-yellow-400">
            <Activity className="h-3 w-3" />
            Avg across {models.length} model{models.length !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="glass-v2 border-white/5 p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <DollarSign className="h-16 w-16 text-yellow-400" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Monthly Burn</p>
          <p className="mt-2 text-3xl font-display font-bold text-white font-mono">{costs?.total_cost || "$0.00"}</p>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-amber-400">
            <ArrowUpRight className="h-3 w-3" />
            {costs?.usage_percentage || "0%"} of budget
          </div>
        </div>

        <div className="glass-v2 border-white/5 p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Layers className="h-16 w-16 text-yellow-400" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Providers</p>
          <p className="mt-2 text-3xl font-display font-bold text-white">
            {activeCount} / {models.length}
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-yellow-400">
            <CheckCircle2 className="h-3 w-3" />
            {activeCount === models.length && models.length > 0 ? "All systems operational" : "Check provider status"}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Live Model Performance
          </h2>
          <div className="grid gap-4">
            {models.length === 0 && (
              <p className="text-sm text-gray-600 italic py-4">No model configurations loaded.</p>
            )}
            {models.map((model) => (
              <div key={model.id} className="glass-v2 border-white/5 p-5 hover:bg-white/[0.02] transition-all group border-l-2 border-l-amber-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
                      <Cpu className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{model.id}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">{model.provider}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="text-[10px] font-bold text-yellow-400 uppercase">Operational</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-4">
                  <div>
                    <p className="text-[9px] font-bold text-gray-500 uppercase">Latency</p>
                    <p className="text-sm font-mono text-white">{model.avg_latency}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-500 uppercase">Success</p>
                    <p className="text-sm font-mono text-white">{model.success_rate}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-500 uppercase">Cost/1k</p>
                    <p className="text-sm font-mono text-white">{model.cost_per_1k}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Cost Distribution
          </h2>
          <div className="glass-v2 border-white/5 p-6 space-y-6">
            <div className="space-y-4">
              <p className="text-sm text-gray-400">Cost by model</p>
              {breakdown.length > 0 ? (
                <>
                  <div className="h-4 w-full bg-white/5 rounded-full flex overflow-hidden">
                    {breakdown.map((b, i) => (
                      <div key={b.model} className={cn("h-full", PALETTE[i % PALETTE.length])} style={{ width: b.width }} />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-4 pt-2">
                    {breakdown.map((b, i) => (
                      <LegendItem key={b.model} label={b.model} color={PALETTE[i % PALETTE.length]} value={b.cost} />
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-xs text-gray-600 italic">No cost breakdown available yet.</p>
              )}
            </div>

            <div className="border-t border-white/5 pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Budget Utilization</span>
                <span className="text-xs font-bold text-gray-400">{costs?.usage_percentage || "0%"}</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-500" style={{ width: costs?.usage_percentage || "0%" }} />
              </div>
            </div>
          </div>
          
          <button className="w-full glass-v2 border-white/5 p-4 flex items-center justify-center gap-2 text-sm font-bold text-amber-400 hover:bg-white/[0.05] transition-colors">
            <BarChart3 className="h-4 w-4" />
            Export Detailed Audit
          </button>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ label, color, value }: any) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("h-2 w-2 rounded-full", color)} />
      <span className="text-[10px] font-bold text-gray-500 uppercase whitespace-nowrap">{label}</span>
      <span className="text-[10px] font-bold text-white">{value}</span>
    </div>
  );
}

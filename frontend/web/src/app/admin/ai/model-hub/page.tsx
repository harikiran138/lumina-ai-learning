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
  ArrowUpRight
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
  breakdown_by_model: any[];
}

export default function AIModelHub() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [costs, setCosts] = useState<AICosts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [models, costs] = await Promise.all([
          api.getAiModels(),
          api.getAiCosts(),
        ]);
        setModels(models || []);
        setCosts(costs || {});
      } catch (err) {
        console.error("failed_to_load_ai_data", err);
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
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <Cpu className="h-8 w-8 text-amber-500" />
            AI Model Hub
          </h1>
          <p className="mt-1 text-gray-400">Manage LLM providers, benchmarks, and inference infrastructure.</p>
        </div>
        <div className="flex items-center gap-3">
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
          <p className="mt-2 text-3xl font-display font-bold text-white">0.82s</p>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-yellow-400">
            <Activity className="h-3 w-3" />
            Optimal Latency
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
            {costs?.usage_percentage} of budget
          </div>
        </div>

        <div className="glass-v2 border-white/5 p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Layers className="h-16 w-16 text-yellow-400" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Providers</p>
          <p className="mt-2 text-3xl font-display font-bold text-white">3 / 5</p>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-yellow-400">
            <CheckCircle2 className="h-3 w-3" />
            High Reliability
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
              <p className="text-sm text-gray-400">Usage by token volume</p>
              <div className="h-4 w-full bg-white/5 rounded-full flex overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: '65%' }} />
                <div className="h-full bg-yellow-500" style={{ width: '25%' }} />
                <div className="h-full bg-yellow-500" style={{ width: '10%' }} />
              </div>
              <div className="flex flex-wrap gap-4 pt-2">
                <LegendItem label="GPT-4o" color="bg-amber-500" value="65%" />
                <LegendItem label="Claude 3.5" color="bg-yellow-500" value="25%" />
                <LegendItem label="Llama 3" color="bg-yellow-500" value="10%" />
              </div>
            </div>

            <div className="border-t border-white/5 pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Budget Utilization</span>
                <span className="text-xs font-bold text-gray-400">{costs?.usage_percentage}</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-500" style={{ width: costs?.usage_percentage || '0%' }} />
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

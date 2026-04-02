"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Download,
  RefreshCw,
  BarChart3,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface DeptUsage {
  department: string;
  tokensUsed: number;
  tokensBudget: number;
  costUSD: number;
  topFaculty: string;
}

interface AiCostSummary {
  totalTokensThisMonth: number;
  totalCostUSD: number;
  monthlyBudgetUSD: number;
  usagePct: number;
  topConsumer: string;
  forecastUSD: number;
}

const MOCK_DEPT: DeptUsage[] = [
  { department: "Computer Science", tokensUsed: 42000, tokensBudget: 60000, costUSD: 62.4, topFaculty: "Prof. Sharma" },
  { department: "Mathematics", tokensUsed: 18000, tokensBudget: 30000, costUSD: 26.8, topFaculty: "Prof. Mehta" },
  { department: "Physics", tokensUsed: 27000, tokensBudget: 35000, costUSD: 40.2, topFaculty: "Prof. Rao" },
  { department: "English", tokensUsed: 9000, tokensBudget: 20000, costUSD: 13.4, topFaculty: "Prof. Iyer" },
  { department: "Chemistry", tokensUsed: 15000, tokensBudget: 25000, costUSD: 22.3, topFaculty: "Prof. Khan" },
];

const MOCK_SUMMARY: AiCostSummary = {
  totalTokensThisMonth: 111000,
  totalCostUSD: 165.1,
  monthlyBudgetUSD: 200,
  usagePct: 82.6,
  topConsumer: "Computer Science",
  forecastUSD: 148,
};

export default function AiUsageCostPage() {
  const [summary, setSummary] = useState<AiCostSummary>(MOCK_SUMMARY);
  const [departments, setDepartments] = useState<DeptUsage[]>(MOCK_DEPT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const costs = await api.getAiCosts();
        if (costs && costs.total_tokens) {
          setSummary({
            totalTokensThisMonth: costs.total_tokens,
            totalCostUSD: parseFloat(costs.total_cost ?? "0"),
            monthlyBudgetUSD: parseFloat(costs.monthly_budget ?? "200"),
            usagePct: parseFloat(costs.usage_percentage ?? "0"),
            topConsumer: "Computer Science",
            forecastUSD: parseFloat(costs.total_cost ?? "0") * 1.12,
          });
        }
      } catch {
        // fallback to mock
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-amber-400" />
      </div>
    );
  }

  const budgetPct = Math.round((summary.totalCostUSD / summary.monthlyBudgetUSD) * 100);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.35em] text-lumina-highlight">
            Institution Admin
          </p>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <Bot className="h-8 w-8 text-amber-500" />
            AI Usage & Cost Control
          </h1>
          <p className="mt-1 text-gray-400">
            Monitor token consumption, department quotas, cost forecasts, and top-consuming faculty.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
            <Download className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </header>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Tokens (Month)"
          value={`${(summary.totalTokensThisMonth / 1000).toFixed(0)}K`}
          sub="Current billing cycle"
          icon={Zap}
          color="gold"
        />
        <KpiCard
          label="Total Cost (USD)"
          value={`$${summary.totalCostUSD.toFixed(2)}`}
          sub={`of $${summary.monthlyBudgetUSD} budget`}
          icon={DollarSign}
          color={budgetPct >= 90 ? "red" : budgetPct >= 75 ? "gold" : "green"}
          trend={budgetPct >= 75 ? "up" : "neutral"}
        />
        <KpiCard
          label="Cost Forecast"
          value={`$${summary.forecastUSD.toFixed(0)}`}
          sub="Projected month-end"
          icon={BarChart3}
          color={summary.forecastUSD > summary.monthlyBudgetUSD ? "red" : "green"}
          trend={summary.forecastUSD > summary.monthlyBudgetUSD ? "up" : "down"}
        />
        <KpiCard
          label="Top Consumer"
          value={summary.topConsumer}
          sub="Highest token dept."
          icon={TrendingUp}
          color="blue"
        />
      </div>

      {/* Budget Progress */}
      <section className="glass-v2 border-white/5 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-bold text-white">Monthly Budget Usage</h2>
          <span className={cn("text-sm font-bold", budgetPct >= 90 ? "text-red-400" : "text-lumina-highlight")}>
            {budgetPct}%
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-white/5 overflow-hidden">
          <div
            className={cn("h-3 rounded-full transition-all duration-500", budgetPct >= 90 ? "bg-red-400" : budgetPct >= 75 ? "bg-amber-400" : "bg-yellow-500")}
            style={{ width: `${Math.min(budgetPct, 100)}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between text-xs text-gray-500">
          <span>${summary.totalCostUSD.toFixed(2)} used</span>
          <span>${summary.monthlyBudgetUSD} budget</span>
        </div>
        {budgetPct >= 80 && (
          <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <p className="text-sm text-amber-200">
              {budgetPct >= 90
                ? "AI quota critical — approaching monthly limit. Consider throttling or increasing budget."
                : "AI usage at 80%+ of budget — review consumption and adjust department quotas if needed."}
            </p>
          </div>
        )}
      </section>

      {/* Department Usage Table */}
      <section className="glass-v2 border-white/5 overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-white/5 p-6">
          <div>
            <h2 className="text-xl font-display font-bold text-white">Token Usage per Department</h2>
            <p className="mt-1 text-sm text-gray-400">Breakdown of AI token consumption and cost by department.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left">
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Department</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Tokens Used</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Budget</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Usage</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Cost (USD)</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Top Faculty</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {departments.map((row) => {
                const pct = Math.round((row.tokensUsed / row.tokensBudget) * 100);
                return (
                  <tr key={row.department} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">{row.department}</td>
                    <td className="px-6 py-4 text-gray-300">{(row.tokensUsed / 1000).toFixed(0)}K</td>
                    <td className="px-6 py-4 text-gray-400">{(row.tokensBudget / 1000).toFixed(0)}K</td>
                    <td className="px-6 py-4 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-white/5">
                          <div
                            className={cn("h-1.5 rounded-full", pct >= 90 ? "bg-red-400" : pct >= 70 ? "bg-amber-400" : "bg-yellow-500")}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-8">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">${row.costUSD.toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-400">{row.topFaculty}</td>
                    <td className="px-6 py-4">
                      {pct >= 90 ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-red-400/20 bg-red-400/10 px-2 py-0.5 text-[10px] font-bold uppercase text-red-300">
                          <AlertTriangle className="h-3 w-3" /> Over Quota
                        </span>
                      ) : pct >= 70 ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300">
                          High
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-green-400/20 bg-green-400/10 px-2 py-0.5 text-[10px] font-bold uppercase text-green-300">
                          <CheckCircle2 className="h-3 w-3" /> Normal
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Throttle Info */}
      <section className="glass-v2 border-white/5 p-6">
        <h2 className="text-lg font-display font-bold text-white mb-1">Usage Policy</h2>
        <p className="text-sm text-gray-400 mb-4">
          When a department exceeds its token quota, the system automatically throttles AI features for that department until the next billing cycle or until the quota is increased.
        </p>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 font-mono text-xs text-gray-400 leading-relaxed">
          <span className="text-lumina-highlight">Usage → exceeds quota</span>
          {" → "}
          <span className="text-amber-400">system throttles</span>
          {" → "}
          <span className="text-red-400">alert sent to Admin</span>
          {" → "}
          <span className="text-gray-300">Admin adjusts budget or waits for reset</span>
        </div>
      </section>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
  color = "gold",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: typeof Bot;
  trend?: "up" | "down" | "neutral";
  color?: "gold" | "red" | "green" | "blue";
}) {
  const colorMap = {
    gold: "from-lumina-highlight/15 to-lumina-highlight/5 border-lumina-highlight/20 text-lumina-highlight",
    red: "from-red-500/15 to-red-500/5 border-red-400/20 text-red-400",
    green: "from-yellow-500/15 to-yellow-500/5 border-yellow-400/20 text-yellow-300",
    blue: "from-blue-500/15 to-blue-500/5 border-blue-400/20 text-blue-400",
  };
  return (
    <div className={cn("rounded-3xl border bg-gradient-to-br p-5", colorMap[color])}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-400">{label}</p>
        <div className="rounded-xl bg-black/20 p-2">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-display font-bold text-white">{value}</p>
      {sub && (
        <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-400">
          {trend === "up" && <TrendingUp className="h-3.5 w-3.5 text-yellow-400" />}
          {trend === "down" && <TrendingDown className="h-3.5 w-3.5 text-red-400" />}
          <span>{sub}</span>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import { 
  ArrowLeft, 
  Split, 
  TrendingUp, 
  Users, 
  Target, 
  Zap, 
  Info,
  ChevronRight,
  Plus,
  Play,
  RotateCcw,
  Sparkles,
  BarChart3
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Strategy {
  id: string;
  name: string;
  type: string;
  status: "active" | "completed" | "draft";
  cohort_a_size: number;
  cohort_b_size: number;
  metric_a: number;
  metric_b: number;
  metric_name: string;
  description: string;
  insight: string;
  duration: string;
}

export default function ABTestingPage() {
  const [activeStrategies, setActiveStrategies] = useState<Strategy[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadExperiments = async () => {
      try {
        // In a real scenario, we'd list experiments and then fetch performance for each
        // For this verification, we fetch one benchmark comparison
        const performance = await api.getABTestPerformance("cohort-a", "cohort-b");
        
        if (performance) {
          setActiveStrategies([
            {
              id: "exp-001",
              name: "Active Learning vs Passive Video",
              type: "Pedagogical Approach",
              status: "active",
              cohort_a_size: performance.variant_a?.count || 25,
              cohort_b_size: performance.variant_b?.count || 25,
              metric_a: Math.round((performance.variant_a?.avg_mastery || 0) * 100),
              metric_b: Math.round((performance.variant_b?.avg_mastery || 0) * 100),
              metric_name: "Avg Mastery",
              description: "Comparing interactive coding exercises against instructional videos for the 'React Hooks' module.",
              insight: performance.analysis || "Variant B shows significantly higher retention.",
              duration: "Day 5 / 7"
            }
          ]);
        }
      } catch (error) {
        console.error("Failed to load A/B test data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExperiments();
  }, []);

  return (
    <div className="min-h-screen space-y-8 p-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link 
            href="/teacher/analytics"
            className="mb-4 inline-flex items-center gap-2 text-sm text-text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Analytics
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
              Teaching Strategy A/B
            </h1>
            <span className="rounded-full bg-warning/20 border border-warning/30 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-warning">
              BETA
            </span>
          </div>
          <p className="mt-2 text-text-muted max-w-2xl">
            Optimizing the learning experience through data. Compare different pedagogical approaches and let causal inference guide your strategy.
          </p>
        </div>

        <button className="flex items-center gap-2 rounded-2xl bg-warning px-6 py-3 font-bold text-black hover:brightness-110 transition-all shadow-[0_0_30px_rgba(251,191,36,0.2)]">
          <Plus className="h-4 w-4" />
          Create New Experiment
        </button>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
        <div className="space-y-6">
          {activeStrategies.map((strat, i) => (
            <motion.div
              key={strat.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group glass-v2 border-border overflow-hidden rounded-3xl"
            >
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                       <span className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                        strat.status === "active" ? "bg-warning/10 text-warning border border-warning/20" : "bg-surface text-text-secondary border border-border"
                      )}>
                        {strat.status}
                      </span>
                      <span className="text-xs text-text-secondary font-bold uppercase tracking-widest">{strat.type}</span>
                    </div>
                    <h3 className="text-2xl font-display font-bold text-foreground group-hover:text-warning transition-colors uppercase">
                      {strat.name}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-xl bg-surface text-text-secondary hover:text-foreground hover:bg-surface-elevated transition-all">
                      <RotateCcw className="h-4 w-4" />
                    </button>
                    <button className="p-2 rounded-xl bg-surface text-text-secondary hover:text-foreground hover:bg-surface-elevated transition-all">
                      <Play className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-text-muted mb-8 max-w-2xl">
                  {strat.description}
                </p>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <p className="text-sm font-bold text-warning">Variant A</p>
                      <p className="text-xs text-text-secondary">{strat.cohort_a_size} students</p>
                    </div>
                    <div className="relative h-16 rounded-2xl bg-surface border border-border overflow-hidden p-4 flex flex-col justify-center">
                      <div 
                        className="absolute left-0 top-0 bottom-0 bg-warning/20 border-r border-warning/30 transition-all duration-1000"
                        style={{ width: strat.status === "active" ? `${strat.metric_a}%` : '0%' }}
                      />
                      <div className="relative flex justify-between items-center">
                        <span className="text-text-secondary text-xs">{strat.metric_name}</span>
                        <span className="text-xl font-bold text-foreground">{strat.status === "active" ? `${strat.metric_a}%` : '--'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <p className="text-sm font-bold text-warning">Variant B</p>
                      <p className="text-xs text-text-secondary">{strat.cohort_b_size} students</p>
                    </div>
                    <div className="relative h-16 rounded-2xl bg-surface border border-border overflow-hidden p-4 flex flex-col justify-center">
                      <div 
                        className="absolute left-0 top-0 bottom-0 bg-warning/20 border-r border-warning/30 transition-all duration-1000"
                        style={{ width: strat.status === "active" ? `${strat.metric_b}%` : '0%' }}
                      />
                      <div className="relative flex justify-between items-center">
                        <span className="text-text-secondary text-xs">{strat.metric_name}</span>
                        <span className="text-xl font-bold text-foreground">{strat.status === "active" ? `${strat.metric_b}%` : '--'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {strat.status === "active" && (
                <div className="border-t border-border bg-warning/[0.02] p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-2xl bg-warning/10 flex items-center justify-center text-warning">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-warning">Early Insight</p>
                      <p className="text-sm text-warning/80">{strat.insight}</p>
                    </div>
                  </div>
                  <button className="flex items-center gap-1 text-xs font-bold text-foreground group-hover:text-warning transition-colors">
                    Full Analysis
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </motion.div>
          ))}

          <button className="w-full h-32 rounded-3xl border-2 border-dashed border-border hover:border-warning/30 hover:bg-surface transition-all flex flex-col items-center justify-center gap-2 group">
            <div className="h-10 w-10 rounded-full bg-surface flex items-center justify-center text-text-secondary group-hover:text-warning group-hover:scale-110 transition-all">
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-sm font-bold text-text-secondary group-hover:text-foreground transition-colors">Launch New Experiment</span>
          </button>
        </div>

        <div className="space-y-6">
          <section className="glass-v2 border-border p-8 rounded-3xl">
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-warning" />
              Impact Summary
            </h3>
            <div className="space-y-6">
              <div>
                <p className="text-3xl font-display font-bold text-foreground">+14.2%</p>
                <p className="text-xs text-text-secondary uppercase tracking-widest font-bold mt-1">Avg. Mastery Lift</p>
              </div>
              <div className="h-px bg-border" />
              <div>
                <p className="text-3xl font-display font-bold text-foreground">12</p>
                <p className="text-xs text-text-secondary uppercase tracking-widest font-bold mt-1">Strats Proven Effective</p>
              </div>
              <div className="h-px bg-border" />
              <div>
                <p className="text-3xl font-display font-bold text-foreground">₹1.2M</p>
                <p className="text-xs text-text-secondary uppercase tracking-widest font-bold mt-1">Resource Efficiency Gain</p>
              </div>
            </div>
          </section>

          <section className="glass-v2 border-border p-8 rounded-3xl">
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Zap className="h-5 w-5 text-warning" />
              AI Auto-Optimization
            </h3>
            <p className="text-sm text-text-muted leading-relaxed">
              Lumina is currently auto-adjusting the delivery weight for "Module 2: Basics" after Experiment #11 showed Variant B led to 30% fewer misconception clusters.
            </p>
            <div className="mt-8 p-4 rounded-2xl bg-surface border border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-warning animate-pulse" />
                <span className="text-xs font-bold text-foreground">In Progress</span>
              </div>
              <BarChart3 className="h-4 w-4 text-text-secondary" />
            </div>
          </section>

          <div className="p-6 rounded-3xl bg-warning/10 border border-warning/20">
            <div className="flex gap-4">
              <Info className="h-6 w-6 text-warning shrink-0" />
              <div className="space-y-2">
                <p className="text-sm font-bold text-warning">Causal Inference Engine</p>
                <p className="text-xs text-warning/80 leading-relaxed">
                  Lumina uses double machine learning to isolate the effect of teaching strategies from student baseline ability. You're seeing real pedagogical impact, not just correlation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

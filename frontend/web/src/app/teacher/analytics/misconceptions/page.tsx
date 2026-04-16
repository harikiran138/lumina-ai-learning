"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  AlertCircle, 
  Users, 
  MessageSquare, 
  Target,
  ChevronRight,
  TrendingDown,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Misconception {
  id: string;
  title: string;
  description: string;
  student_count: number;
  severity: "high" | "medium" | "low";
  category: string;
  root_cause: string;
  suggested_action: string;
  affected_students: { id: string, name: string, mastery: number }[];
}

export default function MisconceptionMapPage() {
  const [misconceptions, setMisconceptions] = useState<Misconception[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  useEffect(() => {
    const loadMisconceptions = async () => {
      try {
        const data = await api.getMisconceptionClusters();
        // Map backend data to frontend interface if needed
        const mappedData: Misconception[] = data.map((item: any) => ({
          id: item.id || `m-${Math.random().toString(36).substr(2, 9)}`,
          title: item.title || "Unknown Pattern",
          description: item.description || "No description available",
          student_count: item.student_count || 0,
          severity: item.severity || "medium",
          category: item.category || "General",
          root_cause: item.root_cause || "Analyzing...",
          suggested_action: item.suggested_action || "Remediation pending",
          affected_students: item.affected_students || []
        }));
        setMisconceptions(mappedData);
      } catch (error) {
        console.error("Failed to load misconceptions:", error);
      }
    };

    loadMisconceptions();
  }, []);

  const categories = ["All", "Concurrency", "Memory Management", "Algorithmic Thinking", "Syntax"];

  const filtered = misconceptions.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen space-y-8 p-8">
      <header>
        <Link 
          href="/teacher/analytics"
          className="mb-4 inline-flex items-center gap-2 text-sm text-text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Analytics
        </Link>
        <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
          Misconception Map
        </h1>
        <p className="mt-2 text-text-muted max-w-2xl">
          AI-clustered patterns of student errors. Identifying the "why" behind low test scores to drive targeted remediation.
        </p>
      </header>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between glass-v2 p-4 rounded-2xl border-border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
          <input 
            type="text"
            placeholder="Search patterns..."
            className="w-full rounded-xl bg-surface border border-border py-2 pl-10 pr-4 text-sm text-foreground focus:border-warning/50 focus:outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <Filter className="h-4 w-4 text-text-secondary mr-2 shrink-0" />
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                selectedCategory === cat 
                  ? "bg-warning text-warning-foreground shadow-[0_0_12px_rgba(251,191,36,0.3)]" 
                  : "bg-surface text-text-muted hover:bg-surface-elevated hover:text-foreground"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group glass-v2 border-border overflow-hidden rounded-3xl flex flex-col"
          >
            <div className="p-6 space-y-4 flex-1">
              <div className="flex items-start justify-between gap-4">
                <div className={cn(
                  "rounded-2xl p-3",
                  item.severity === "high" ? "bg-danger/10 text-danger" : "bg-warning/10 text-warning"
                )}>
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary bg-surface px-2 py-0.5 rounded-full mb-1">
                    {item.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-foreground">
                    <Users className="h-3 w-3 text-warning" />
                    {item.student_count} students
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground group-hover:text-warning transition-colors uppercase">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-text-muted leading-relaxed line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="rounded-2xl bg-surface border border-border p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1">Root Cause</p>
                  <p className="text-xs text-foreground italic">"{item.root_cause}"</p>
                </div>
                <div className="rounded-2xl bg-warning/5 border border-warning/10 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-warning mb-1 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI Recommendation
                  </p>
                  <p className="text-xs text-text-muted">{item.suggested_action}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-border p-4 bg-background/20">
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {item.affected_students.slice(0, 3).map((s, i) => (
                    <div 
                      key={s.id}
                      className="h-8 w-8 rounded-full border-2 border-background bg-gradient-to-br from-surface to-surface-elevated flex items-center justify-center text-[10px] font-bold text-foreground"
                      title={s.name}
                    >
                      {s.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  ))}
                  {item.student_count > 3 && (
                    <div className="h-8 w-8 rounded-full border-2 border-background bg-surface flex items-center justify-center text-[10px] font-bold text-text-muted">
                      +{item.student_count - 3}
                    </div>
                  )}
                </div>
                <button className="flex items-center gap-1 text-xs font-bold text-warning hover:text-foreground transition-colors">
                  View Cluster
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        <div className="glass-v2 border-dashed border-border rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-surface flex items-center justify-center text-text-secondary">
            <Target className="h-8 w-8" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-foreground">Searching for patterns...</h4>
            <p className="text-sm text-text-muted mt-1 max-w-[200px]">
              AI is currently analyzing the latest assignment submissions for new clusterings.
            </p>
          </div>
          <div className="h-1 w-32 rounded-full bg-surface overflow-hidden">
            <motion.div 
              className="h-full bg-warning"
              animate={{ x: [-128, 128] }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="glass-v2 border-border p-8 rounded-3xl">
          <h3 className="text-xl font-bold text-foreground mb-6">Cohort Health Trend</h3>
          <div className="h-48 flex items-end justify-between gap-1">
            {[45, 52, 48, 61, 55, 68, 72, 65, 78, 82, 75, 88].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${val}%` }}
                  className={cn(
                    "w-full rounded-t-lg transition-all",
                    i === 11 ? "bg-warning shadow-[0_0_12px_rgba(251,191,36,0.3)]" : "bg-surface"
                  )}
                />
                <span className="text-[10px] text-text-secondary font-bold">{i+1}m</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-danger" />
              <span className="text-text-muted">Error rate decreasing</span>
            </div>
            <span className="text-foreground font-bold">-14% vs last week</span>
          </div>
        </section>

        <section className="glass-v2 border-border p-8 rounded-3xl">
          <h3 className="text-xl font-bold text-foreground mb-6">Top Support Clusters</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-border">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center text-warning">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Async Logic</p>
                  <p className="text-xs text-text-secondary">8 students affected</p>
                </div>
              </div>
              <button className="rounded-lg bg-warning/20 px-3 py-1.5 text-xs font-bold text-warning hover:bg-warning/30 transition-all">
                Broadcast Tips
              </button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-border">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center text-warning">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Memory Models</p>
                  <p className="text-xs text-text-secondary">5 students affected</p>
                </div>
              </div>
              <button className="rounded-lg bg-warning/20 px-3 py-1.5 text-xs font-bold text-warning hover:bg-warning/30 transition-all">
                Assign Refresher
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

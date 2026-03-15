"use client";

import { useState, useEffect } from "react";
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
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Analytics
        </Link>
        <h1 className="text-4xl font-display font-bold text-white tracking-tight">
          Misconception Map
        </h1>
        <p className="mt-2 text-gray-400 max-w-2xl">
          AI-clustered patterns of student errors. Identifying the "why" behind low test scores to drive targeted remediation.
        </p>
      </header>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between glass-v2 p-4 rounded-2xl border-white/5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input 
            type="text"
            placeholder="Search patterns..."
            className="w-full rounded-xl bg-white/5 border border-white/10 py-2 pl-10 pr-4 text-sm text-white focus:border-amber-400/50 focus:outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <Filter className="h-4 w-4 text-gray-500 mr-2 shrink-0" />
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                selectedCategory === cat 
                  ? "bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.3)]" 
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
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
            className="group glass-v2 border-white/5 overflow-hidden rounded-3xl flex flex-col"
          >
            <div className="p-6 space-y-4 flex-1">
              <div className="flex items-start justify-between gap-4">
                <div className={cn(
                  "rounded-2xl p-3",
                  item.severity === "high" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"
                )}>
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-white/5 px-2 py-0.5 rounded-full mb-1">
                    {item.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-white">
                    <Users className="h-3 w-3 text-blue-400" />
                    {item.student_count} students
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors uppercase">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-gray-400 leading-relaxed line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="rounded-2xl bg-white/5 border border-white/5 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Root Cause</p>
                  <p className="text-xs text-gray-300 italic">"{item.root_cause}"</p>
                </div>
                <div className="rounded-2xl bg-amber-400/5 border border-amber-400/10 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-1 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI Recommendation
                  </p>
                  <p className="text-xs text-amber-200/80">{item.suggested_action}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 p-4 bg-white/[0.02]">
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {item.affected_students.slice(0, 3).map((s, i) => (
                    <div 
                      key={s.id}
                      className="h-8 w-8 rounded-full border-2 border-black bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-[10px] font-bold text-white"
                      title={s.name}
                    >
                      {s.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  ))}
                  {item.student_count > 3 && (
                    <div className="h-8 w-8 rounded-full border-2 border-black bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-400">
                      +{item.student_count - 3}
                    </div>
                  )}
                </div>
                <button className="flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-white transition-colors">
                  View Cluster
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        <div className="glass-v2 border-dashed border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center text-gray-500">
            <Target className="h-8 w-8" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-white">Searching for patterns...</h4>
            <p className="text-sm text-gray-500 mt-1 max-w-[200px]">
              AI is currently analyzing the latest assignment submissions for new clusterings.
            </p>
          </div>
          <div className="h-1 w-32 rounded-full bg-white/10 overflow-hidden">
            <motion.div 
              className="h-full bg-amber-400"
              animate={{ x: [-128, 128] }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="glass-v2 border-white/5 p-8 rounded-3xl">
          <h3 className="text-xl font-bold text-white mb-6">Cohort Health Trend</h3>
          <div className="h-48 flex items-end justify-between gap-1">
            {[45, 52, 48, 61, 55, 68, 72, 65, 78, 82, 75, 88].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${val}%` }}
                  className={cn(
                    "w-full rounded-t-lg transition-all",
                    i === 11 ? "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.3)]" : "bg-white/10"
                  )}
                />
                <span className="text-[10px] text-gray-600 font-bold">{i+1}m</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-400" />
              <span className="text-gray-400">Error rate decreasing</span>
            </div>
            <span className="text-white font-bold">-14% vs last week</span>
          </div>
        </section>

        <section className="glass-v2 border-white/5 p-8 rounded-3xl">
          <h3 className="text-xl font-bold text-white mb-6">Top Support Clusters</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-white">Async Logic</p>
                  <p className="text-xs text-gray-500">8 students affected</p>
                </div>
              </div>
              <button className="rounded-lg bg-blue-500/20 px-3 py-1.5 text-xs font-bold text-blue-300 hover:bg-blue-500/30 transition-all">
                Broadcast Tips
              </button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-white">Memory Models</p>
                  <p className="text-xs text-gray-500">5 students affected</p>
                </div>
              </div>
              <button className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition-all">
                Assign Refresher
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

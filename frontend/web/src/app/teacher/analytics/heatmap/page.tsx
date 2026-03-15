"use client";

import { useEffect, useState, useRef } from "react";
import { 
  Users, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  ArrowLeft,
  RefreshCw,
  Zap
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface HeatmapCell {
  student_id: string;
  student_name: string;
  topic_id: string;
  mastery: number; // 0 to 1
  status: "active" | "idle" | "away";
  last_updated: string;
}

interface DeltaUpdate {
  type: "delta";
  changes: Partial<HeatmapCell>[];
}

interface FullState {
  type: "full";
  data: HeatmapCell[];
}

type WSMessage = DeltaUpdate | FullState;

export default function LiveHeatmapPage() {
  const [cells, setCells] = useState<HeatmapCell[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [students, setStudents] = useState<{id: string, name: string}[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Simulation for demo purposes if backend is not ready
  useEffect(() => {
    const mockTopics = ["Foundations", "Logic", "Variables", "Loops", "Functions", "Objects", "Arrays", "Async"];
    const mockStudents = Array.from({ length: 12 }, (_, i) => ({
      id: `s${i+1}`,
      name: `Student ${String.fromCharCode(65 + i)}`
    }));
    
    setTopics(mockTopics);
    setStudents(mockStudents);

    const initialData: HeatmapCell[] = [];
    mockStudents.forEach(s => {
      mockTopics.forEach(t => {
        initialData.push({
          student_id: s.id,
          student_name: s.name,
          topic_id: t,
          mastery: Math.random(),
          status: Math.random() > 0.2 ? "active" : "idle",
          last_updated: new Date().toISOString()
        });
      });
    });
    setCells(initialData);

    // Simulated WebSocket updates
    const interval = setInterval(() => {
      const numChanges = Math.floor(Math.random() * 3) + 1;
      setCells(prev => {
        const next = [...prev];
        for (let i = 0; i < numChanges; i++) {
          const idx = Math.floor(Math.random() * next.length);
          next[idx] = {
            ...next[idx],
            mastery: Math.max(0, Math.min(1, next[idx].mastery + (Math.random() * 0.2 - 0.1))),
            last_updated: new Date().toISOString()
          };
        }
        return next;
      });
      setLastMessage(`Updated ${numChanges} cells @ ${new Date().toLocaleTimeString()}`);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getMasteryColor = (mastery: number) => {
    if (mastery < 0.4) return "bg-red-500/40 border-red-500/20";
    if (mastery < 0.7) return "bg-amber-500/40 border-amber-500/20";
    return "bg-emerald-500/40 border-emerald-500/20";
  };

  const getCellFor = (studentId: string, topicId: string) => {
    return cells.find(c => c.student_id === studentId && c.topic_id === topicId);
  };

  return (
    <div className="min-h-screen space-y-8 p-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link 
            href="/teacher/analytics"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Analytics
          </Link>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            Live Class Heatmap
          </h1>
          <p className="mt-2 text-gray-400 max-w-2xl">
            Real-time mastery visualization. Cells update instantly as students progress through lessons and assignments.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <div className={cn(
            "h-3 w-3 rounded-full animate-pulse",
            isConnected ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]" : "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.5)]"
          )} />
          <div>
            <p className="text-sm font-semibold text-white">
              {isConnected ? "Live Connection Active" : "Simulated Stream"}
            </p>
            <p className="text-xs text-gray-400">
              {lastMessage || "Waiting for delta updates..."}
            </p>
          </div>
          <button className="ml-4 rounded-xl bg-white/10 p-2 text-white hover:bg-white/20 transition-all">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="glass-v2 border-white/5 overflow-hidden rounded-3xl">
          <div className="overflow-x-auto p-6">
            <div className="min-w-[800px]">
              {/* Header row with topics */}
              <div className="mb-4 flex">
                <div className="w-40 shrink-0" />
                {topics.map(topic => (
                  <div key={topic} className="flex-1 px-1 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 rotate-[-45deg] origin-bottom-left mb-8 block h-12">
                      {topic}
                    </p>
                  </div>
                ))}
              </div>

              {/* Rows with students */}
              <div className="space-y-2">
                {students.map(student => (
                  <div key={student.id} className="flex items-center group">
                    <div className="w-40 shrink-0 pr-4">
                      <p className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors truncate">
                        {student.name}
                      </p>
                    </div>
                    {topics.map(topic => {
                      const cell = getCellFor(student.id, topic);
                      return (
                        <div key={`${student.id}-${topic}`} className="flex-1 px-1">
                          <motion.div
                            layoutId={`${student.id}-${topic}`}
                            className={cn(
                              "relative h-12 rounded-xl border transition-all duration-500 cursor-help",
                              cell ? getMasteryColor(cell.mastery) : "bg-white/5 border-white/5"
                            )}
                            whileHover={{ scale: 1.1, zIndex: 10 }}
                          >
                            {cell && cell.mastery > 0 && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                  {Math.round(cell.mastery * 100)}%
                                </span>
                              </div>
                            )}
                            {cell && cell.mastery < 0.3 && (
                              <div className="absolute -top-1 -right-1">
                                <AlertTriangle className="h-3 w-3 text-red-400 fill-red-400/20" />
                              </div>
                            )}
                          </motion.div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 bg-white/[0.02] p-6 flex flex-wrap gap-8 items-center justify-between">
            <div className="flex gap-6 items-center">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Legend:</p>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-emerald-500/40 border border-emerald-500/20" />
                <span className="text-xs text-gray-400">Mastered (70%+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-amber-500/40 border border-amber-500/20" />
                <span className="text-xs text-gray-400">Reviewing (40-70%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-red-500/40 border border-red-500/20" />
                <span className="text-xs text-gray-400">Critical ({"<"}40%)</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 italic">
              <Zap className="h-3 w-3 text-amber-400" />
              Showing delta updates only to optimize performance.
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <section className="glass-v2 border-white/5 p-6 rounded-3xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-amber-400" />
              Live Insights
            </h3>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Bottleneck Topic</p>
                <p className="text-xl font-bold text-white">Asynchronous JS</p>
                <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  4 students struggling here
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Most Improved</p>
                <p className="text-xl font-bold text-white">Student G</p>
                <p className="mt-2 text-sm text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  +25% mastery in 20m
                </p>
              </div>
            </div>
          </section>

          <section className="glass-v2 border-white/5 p-6 rounded-3xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              Class Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold text-white">74%</p>
                <p className="text-xs text-gray-500 uppercase">Avg Mastery</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">12/12</p>
                <p className="text-xs text-gray-500 uppercase">Active Now</p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Syllabus Coverage</span>
                <span className="text-white">62%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] w-[62%]" />
              </div>
            </div>
          </section>

          <div className="p-4 rounded-2xl bg-amber-400/10 border border-amber-400/20">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-200">Recommendation</p>
                <p className="text-xs text-amber-100/70 mt-1">
                  Break for a 5-minute sync on "Loops". 3 students are repeatedly failing the same assessment node.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

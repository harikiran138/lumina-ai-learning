"use client";

import { useState } from "react";
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Star, 
  MessageSquare, 
  Save, 
  ChevronRight, 
  ChevronLeft,
  BookOpen,
  FileText,
  User,
  History,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Submission {
  id: string;
  student_name: string;
  assignment_name: string;
  status: "graded" | "pending" | "late";
  score: number | null;
  max_score: number;
  submitted_at: string;
  ai_feedback: string;
  student_answer: string;
}

export default function GradingPage() {
  const [selectedId, setSelectedId] = useState<string | null>("s1");
  const [grade, setGrade] = useState<number>(4.5);
  const [feedback, setFeedback] = useState("");

  const [submissions] = useState<Submission[]>([
    {
      id: "s1",
      student_name: "Alice Chen",
      assignment_name: "Module 3: Async JS Quiz",
      status: "pending",
      score: null,
      max_score: 5,
      submitted_at: "2 hours ago",
      ai_feedback: "Student demonstrates clear understanding of the event loop and closure pointers. Some ambiguity in explaining the garbage collection triggers.",
      student_answer: "The event loop works by checking the call stack. If it's empty, it takes the first task from the task queue. Closures keep variables in memory because the inner function holds a reference to the outer scope's variables, preventing GC from disposing them even after the outer function finishes."
    },
    {
      id: "s2",
      student_name: "Bob Smith",
      assignment_name: "Module 3: Async JS Quiz",
      status: "graded",
      score: 3.5,
      max_score: 5,
      submitted_at: "5 hours ago",
      ai_feedback: "Correct on Event Loop basics. Missed the distinction between Microtasks and Macrotasks.",
      student_answer: "Async code runs separately. The browser handles it and then puts it back into the stack when it's done."
    }
  ]);

  const selectedSub = submissions.find(s => s.id === selectedId) || submissions[0];

  return (
    <div className="min-h-screen space-y-8 p-8 flex flex-col">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            Grading Hub
          </h1>
          <p className="mt-2 text-gray-400 max-w-2xl">
            Streamlined assessment interface. Review submissions, override AI scores, and provide high-impact personalized feedback.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-8 w-8 rounded-full border-2 border-black bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-400">
                {String.fromCharCode(64 + i)}
              </div>
            ))}
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">12 Pending</p>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[400px_1fr] flex-1 overflow-hidden">
        <aside className="glass-v2 border-white/5 rounded-3xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/5 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input 
                type="text"
                placeholder="Search students..."
                className="w-full rounded-xl bg-white/5 border border-white/10 py-2 pl-10 pr-4 text-xs text-white focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-between overflow-x-auto pb-2 gap-2">
              {["All", "Pending", "Graded", "Flags"].map(filter => (
                <button 
                  key={filter}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                    filter === "Pending" ? "bg-amber-400 text-black" : "text-gray-500 hover:text-white"
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {submissions.map(sub => (
              <div
                key={sub.id}
                onClick={() => setSelectedId(sub.id)}
                className={cn(
                  "p-4 rounded-2xl cursor-pointer transition-all border flex items-center justify-between group",
                  selectedId === sub.id ? "bg-amber-400/10 border-amber-400/30" : "bg-white/[0.02] border-white/5 hover:border-white/10"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-amber-400 transition-colors">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white uppercase">{sub.student_name}</p>
                    <p className="text-[10px] text-gray-600 font-bold uppercase">{sub.submitted_at}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                   {sub.status === "graded" ? (
                     <span className="text-xs font-bold text-yellow-400">{sub.score}/{sub.max_score}</span>
                   ) : (
                     <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                   )}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="glass-v2 border-white/5 rounded-3xl overflow-hidden flex flex-col">
          <div className="p-8 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-bold text-white uppercase tracking-tight">{selectedSub.student_name}</h3>
                <p className="text-sm font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  {selectedSub.assignment_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-3 rounded-2xl bg-white/5 text-gray-500 hover:text-white transition-all border border-white/10">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button className="p-3 rounded-2xl bg-white/5 text-gray-500 hover:text-white transition-all border border-white/10">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 grid gap-8 lg:grid-cols-2">
            <div className="space-y-6">
               <section>
                <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <FileText className="h-3 w-3" />
                  Student Response
                </h4>
                <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 text-white leading-relaxed text-sm">
                  {selectedSub.student_answer}
                </div>
              </section>

              <div className="p-6 rounded-3xl bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex gap-4">
                  <Sparkles className="h-6 w-6 text-yellow-400 shrink-0" />
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-yellow-100 uppercase tracking-wider">AI Evaluation</p>
                    <p className="text-xs text-yellow-200/60 leading-relaxed italic">
                      {selectedSub.ai_feedback}
                    </p>
                  </div>
                </div>
              </div>

              <section>
                <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <History className="h-3 w-3" />
                   Recent Performance
                </h4>
                <div className="grid grid-cols-3 gap-3">
                   {[85, 78, 92].map((v, i) => (
                     <div key={i} className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                        <p className="text-xs font-bold text-white">{v}%</p>
                        <p className="text-[10px] text-gray-700 font-bold uppercase mt-1">Quiz {i+1}</p>
                     </div>
                   ))}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="glass-v2 border-white/10 p-8 rounded-3xl bg-amber-400/[0.02]">
                <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Star className="h-3 w-3" />
                  Assigned Score
                </h4>
                <div className="flex items-center justify-between gap-8 mb-8">
                  <div className="flex-1">
                    <input 
                      type="range" 
                      min="0" 
                      max={selectedSub.max_score} 
                      step="0.5" 
                      value={grade}
                      onChange={(e) => setGrade(parseFloat(e.target.value))}
                      className="w-full accent-amber-400"
                    />
                  </div>
                  <div className="shrink-0 w-24 text-center p-4 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-2xl font-display font-bold text-white uppercase">{grade}</p>
                    <p className="text-[10px] text-gray-700 font-bold uppercase">/ {selectedSub.max_score}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare className="h-3 w-3" />
                    Personalized Feedback
                  </h4>
                  <textarea 
                    className="w-full h-32 rounded-2xl bg-black/40 border border-white/10 p-4 text-sm text-white focus:border-amber-400/50 focus:outline-none transition-all resize-none"
                    placeholder="Type feedback here or use AI suggestions..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                   <div className="flex gap-2">
                    <button className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition-all">
                      <Zap className="h-3 w-3 text-amber-400" />
                      Suggest Feedback
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-400 py-2.5 text-xs font-bold text-black hover:bg-amber-300 transition-all shadow-[0_0_20px_rgba(251,191,36,0.2)]">
                      <Save className="h-3 w-3" />
                      Release Grade
                    </button>
                  </div>
                </div>
              </section>

              <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex gap-4">
                  <AlertCircle className="h-6 w-6 text-amber-400 shrink-0" />
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-amber-100 uppercase tracking-wider">Semantic Similarity Low</p>
                    <p className="text-xs text-amber-200/60 leading-relaxed italic">
                      This student's answer deviate significantly from the reference key. We recommend double-checking the definition of 'pointer closure'.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

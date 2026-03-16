"use client";

import { useState } from "react";
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  MoreVertical,
  ChevronRight,
  Database,
  Tag,
  BookOpen,
  LayoutGrid,
  List,
  Target
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  type: "MCQ" | "Short Answer" | "Interactive";
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
  question_text: string;
  status: "verified" | "flagged" | "new";
  usage_count: number;
  success_rate: number;
}

export default function QuestionBankPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const [questions] = useState<Question[]>([
    {
      id: "q1",
      type: "MCQ",
      difficulty: "Medium",
      topic: "Asynchronous JS",
      question_text: "What is the output of the following event loop snippet involving setTimeout(0) and Promise.resolve()?",
      status: "verified",
      usage_count: 124,
      success_rate: 64
    },
    {
      id: "q2",
      type: "Short Answer",
      difficulty: "Hard",
      topic: "Closures",
      question_text: "Examine this memory leak scenario. Explain why the inner variable scope is not being garbage collected.",
      status: "verified",
      usage_count: 85,
      success_rate: 42
    },
    {
      id: "q3",
      type: "Interactive",
      difficulty: "Medium",
      topic: "DOM Manipulation",
      question_text: "Build a debounced search input using only vanilla JS. The solution must handle rapid keypresses correctly.",
      status: "flagged",
      usage_count: 12,
      success_rate: 28
    },
    {
      id: "q4",
      type: "MCQ",
      difficulty: "Easy",
      topic: "Basics",
      question_text: "Which of the following is a primitive data type in JavaScript?",
      status: "verified",
      usage_count: 312,
      success_rate: 92
    }
  ]);

  return (
    <div className="min-h-screen space-y-8 p-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link 
            href="/teacher/content"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Content
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-display font-bold text-white tracking-tight">
              Question Bank
            </h1>
            <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-300">
              {questions.length * 12} Items
            </span>
          </div>
          <p className="mt-2 text-gray-400 max-w-2xl">
            Central repository of all assessment items. AI-generated variants and performance metrics for every question.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-all">
            <Sparkles className="h-4 w-4 text-amber-400" />
            Bulk Generate
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-black hover:bg-amber-300 transition-all shadow-[0_0_20px_rgba(251,191,36,0.2)]">
            <Plus className="h-4 w-4" />
            New Question
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between glass-v2 p-4 rounded-2xl border-white/5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input 
            type="text"
            placeholder="Search questions, topics, or IDs..."
            className="w-full rounded-xl bg-white/5 border border-white/10 py-2 pl-10 pr-4 text-sm text-white focus:border-amber-400/50 focus:outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
            <button 
              onClick={() => setViewMode("grid")}
              className={cn("p-1.5 rounded-lg transition-all", viewMode === "grid" ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-400")}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={cn("p-1.5 rounded-lg transition-all", viewMode === "list" ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-400")}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-gray-400 hover:text-white transition-all">
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>
      </div>

      <div className={cn(
        "grid gap-6",
        viewMode === "grid" ? "md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
      )}>
        {questions.map((q, i) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group glass-v2 border-white/5 p-6 rounded-3xl flex flex-col"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex flex-wrap gap-2">
                <span className={cn(
                  "rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  q.difficulty === "Easy" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
                  q.difficulty === "Medium" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                  "bg-red-500/10 text-red-400 border border-red-500/20"
                )}>
                  {q.difficulty}
                </span>
                <span className="rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  {q.type}
                </span>
              </div>
              <button className="text-gray-600 hover:text-white transition-colors">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 mb-6">
              <h3 className="text-lg font-bold text-white line-clamp-3 group-hover:text-amber-300 transition-colors uppercase leading-tight">
                {q.question_text}
              </h3>
              <div className="mt-4 flex items-center gap-4 text-xs text-gray-500 font-bold uppercase tracking-widest">
                <div className="flex items-center gap-1.5">
                  <Tag className="h-3 w-3" />
                  {q.topic}
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-[10px] font-bold text-gray-600 uppercase">Usage</p>
                  <p className="text-sm font-bold text-white">{q.usage_count}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-600 uppercase">Success</p>
                  <p className={cn(
                    "text-sm font-bold",
                    q.success_rate > 70 ? "text-yellow-400" : q.success_rate > 40 ? "text-amber-400" : "text-red-400"
                  )}>{q.success_rate}%</p>
                </div>
              </div>
              <div className={cn(
                "rounded-full p-2",
                q.status === "verified" ? "bg-yellow-500/10 text-yellow-400" : "bg-amber-500/10 text-amber-400"
              )}>
                {q.status === "verified" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="glass-v2 border-white/5 p-8 rounded-3xl lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white">Bank Health Overview</h3>
            <Database className="h-5 w-5 text-gray-600" />
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-amber-400/10 flex items-center justify-center text-amber-400">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-3xl font-display font-bold text-white">84%</p>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Syllabus Coverage</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Most topics are well-covered. Missing depth in 'Advanced Concurrency'.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-amber-400/10 flex items-center justify-center text-amber-400">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-3xl font-display font-bold text-white">1.2k</p>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Active Questions</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                42 new variants generated by AI in the last 24 hours.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                 <button className="flex-1 flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                  <span className="text-xs font-bold text-white">Flagged Items</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-red-400">12</span>
                    <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-white transition-all" />
                  </div>
                 </button>
              </div>
            </div>
          </div>
        </section>

        <section className="glass-v2 border-white/10 p-8 rounded-3xl bg-gradient-to-br from-amber-600/10 to-transparent">
          <h3 className="text-xl font-bold text-white mb-6">AI Variant Engine</h3>
          <p className="text-sm text-gray-400 leading-relaxed mb-8">
            Automatically generate variations of your top questions to prevent cheating and ensure deep understanding.
          </p>
          <div className="space-y-4">
            <button className="w-full rounded-2xl bg-white text-black py-4 font-bold hover:bg-gray-200 transition-all">
              Launch Variant Wizard
            </button>
            <div className="flex items-center gap-2 justify-center text-[10px] font-bold text-gray-600 uppercase tracking-widest">
              <Sparkles className="h-3 w-3" />
              Powered by Lumina Genesis
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

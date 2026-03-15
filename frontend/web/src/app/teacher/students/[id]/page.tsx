"use client";

import { useState } from "react";
import { 
  ArrowLeft, 
  Target, 
  TrendingUp, 
  Clock, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Sparkles,
  Zap,
  Activity,
  Calendar,
  Mail,
  MoreVertical
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function StudentProfilePage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState("Mastery");

  const student = {
    name: "Alice Chen",
    id: params.id || "STU-8821",
    grade: "Grade 11",
    email: "alice.chen@lumina.edu",
    status: "At Risk",
    overall_mastery: 68,
    attendance: 94,
    predicted_dropout_prob: 0.12,
    strengths: ["Logical Logic", "Data Structures"],
    weaknesses: ["Asynchronous Execution", "Resource Management"],
    recent_activity: [
      { action: "Submited Quiz", item: "Module 3: Async JS", score: "4.5/5", date: "2 hours ago" },
      { action: "Joined Live Class", item: "Event Loop Deep-dive", duration: "42m", date: "1 day ago" },
      { action: "Spent 2h on Resource", item: "MDN Guide: Closures", date: "2 days ago" }
    ]
  };

  return (
    <div className="min-h-screen space-y-8 p-8">
      <header className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-6">
          <Link 
            href="/teacher/students"
            className="mt-2 p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-display font-bold text-white tracking-tight uppercase">
                {student.name}
              </h1>
              <span className={cn(
                "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest",
                student.status === "At Risk" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              )}>
                {student.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1"><GraduationCap className="h-4 w-4" /> {student.grade}</span>
              <div className="h-1 w-1 rounded-full bg-gray-800" />
              <span className="flex items-center gap-1"><Mail className="h-4 w-4" /> {student.email}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-all">
            <MessageSquare className="h-4 w-4" />
            Message Parent
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-black hover:bg-amber-300 transition-all shadow-[0_0_20px_rgba(251,191,36,0.2)]">
            <Sparkles className="h-4 w-4" />
            Gen. Intervention
          </button>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-4">
        {[
          { label: "Overall Mastery", value: `${student.overall_mastery}%`, icon: Target, color: "text-amber-400", trend: "+3.2% vs avg" },
          { label: "Attendance", value: `${student.attendance}%`, icon: Calendar, color: "text-blue-400", trend: "High Consistency" },
          { label: "Dropout Risk", value: `${student.predicted_dropout_prob * 100}%`, icon: AlertTriangle, color: "text-red-400", trend: "Stability Low" },
          { label: "Engagement", value: "8.4h", icon: Clock, color: "text-emerald-400", trend: "Last 7 Days" }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="glass-v2 border-white/5 p-6 rounded-3xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1">{stat.label}</p>
                <h3 className="text-2xl font-display font-bold text-white">{stat.value}</h3>
              </div>
              <div className={cn("p-2.5 rounded-xl bg-white/5", stat.color)}>
                <stat.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-4 text-[10px] font-bold text-gray-700 uppercase tracking-widest">{stat.trend}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-8">
           <section className="glass-v2 border-white/5 rounded-3xl overflow-hidden">
             <div className="border-b border-white/5 flex">
               {["Mastery", "Activity", "Assessments"].map(tab => (
                 <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-8 py-4 text-xs font-bold uppercase tracking-widest transition-all relative",
                      activeTab === tab ? "text-amber-400" : "text-gray-500 hover:text-white"
                    )}
                 >
                   {tab}
                   {activeTab === tab && (
                     <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />
                   )}
                 </button>
               ))}
             </div>
             <div className="p-8">
               {activeTab === "Mastery" && (
                 <div className="space-y-8">
                   <div className="flex items-center justify-between mb-4">
                     <h3 className="text-xl font-bold text-white uppercase tracking-tight">Concept Mastery Radar</h3>
                     <TrendingUp className="h-5 w-5 text-gray-600" />
                   </div>
                   <div className="space-y-6">
                     {[
                       { name: "Asynchronous Logic", score: 42, color: "bg-red-400" },
                       { name: "Structural Logic", score: 88, color: "bg-emerald-400" },
                       { name: "Memory Management", score: 64, color: "bg-amber-400" },
                       { name: "DOM Interfaces", score: 75, color: "bg-blue-400" }
                     ].map((item, i) => (
                       <div key={i} className="space-y-2">
                         <div className="flex justify-between text-xs font-bold mb-1">
                           <span className="text-white uppercase">{item.name}</span>
                           <span className="text-gray-500">{item.score}%</span>
                         </div>
                         <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                           <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${item.score}%` }}
                              className={cn("h-full rounded-full", item.color)}
                           />
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
               {activeTab === "Activity" && (
                 <div className="space-y-6">
                   {student.recent_activity.map((act, i) => (
                     <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/5 transition-all">
                       <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-amber-400">
                          {act.action.includes("Quiz") ? <CheckCircle2 className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
                       </div>
                       <div className="flex-1">
                         <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-white uppercase">{act.action}</p>
                            <span className="text-[10px] text-gray-700 font-bold uppercase">{act.date}</span>
                         </div>
                         <p className="text-xs text-gray-500 mt-1">{act.item} {act.score && `• ${act.score}`}</p>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           </section>

           <div className="grid gap-6 md:grid-cols-2">
             <section className="glass-v2 border-white/5 p-8 rounded-3xl bg-emerald-500/[0.02]">
               <h3 className="text-lg font-bold text-white mb-6 uppercase flex items-center gap-2">
                 <Zap className="h-5 w-5 text-emerald-400" />
                 Cognitive Strengths
               </h3>
               <div className="space-y-3">
                 {student.strengths.map((str, i) => (
                   <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/5">
                     <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                     <span className="text-xs font-bold text-gray-300 uppercase">{str}</span>
                   </div>
                 ))}
               </div>
             </section>
             <section className="glass-v2 border-white/5 p-8 rounded-3xl bg-red-500/[0.02]">
               <h3 className="text-lg font-bold text-white mb-6 uppercase flex items-center gap-2">
                 <AlertTriangle className="h-5 w-5 text-red-500" />
                 Learning Frictions
               </h3>
               <div className="space-y-3">
                 {student.weaknesses.map((weak, i) => (
                   <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/5">
                     <XCircle className="h-4 w-4 text-red-400" />
                     <span className="text-xs font-bold text-gray-300 uppercase">{weak}</span>
                   </div>
                 ))}
               </div>
             </section>
           </div>
        </div>

        <div className="space-y-6">
          <section className="glass-v2 border-white/5 p-8 rounded-3xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-tight">
              <Sparkles className="h-5 w-5 text-amber-400" />
              AI Insight
            </h3>
            <div className="p-4 rounded-2xl bg-amber-400/5 border border-amber-400/10 space-y-4">
              <p className="text-xs text-amber-200/80 leading-relaxed italic">
                "{student.name}'s mastery in Concurrency dipped significantly after Lesson 3.2. Patterns suggest they are misinterpreting Microtasks as synchronous calls."
              </p>
              <div className="h-px bg-amber-400/20" />
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Recommended Action</p>
              <p className="text-xs text-amber-100/90 leading-relaxed">
                Assign the "Microtask Visual Tracer" interactive lab. It has a 88% success rate for students with similar profiles.
              </p>
              <button className="w-full py-2.5 rounded-xl bg-amber-400 text-black text-xs font-bold hover:bg-amber-300 transition-all">
                Execute Intervention
              </button>
            </div>
          </section>

          <section className="glass-v2 border-white/5 p-8 rounded-3xl">
             <h3 className="text-lg font-bold text-white mb-6 uppercase flex items-center justify-between">
               Parent Connection
               <MoreVertical className="h-4 w-4 text-gray-600" />
             </h3>
             <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-gray-500 font-bold">
                    MC
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white uppercase">Mei Chen</p>
                    <p className="text-[10px] text-gray-600 font-bold uppercase">Mother • Last seen 2d ago</p>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 italic text-[11px] text-gray-500">
                  "Alice has been working extra hard on her laptop lately. Is there anything specific we should focus on at home?"
                </div>
                <button className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4" />
                  Compose Reply
                </button>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function XCircle({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}

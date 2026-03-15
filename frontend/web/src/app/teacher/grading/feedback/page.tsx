"use client";

import { useState } from "react";
import { 
  MessageSquare, 
  RotateCcw, 
  Send, 
  User, 
  CheckCircle, 
  Clock, 
  ArrowRight,
  ChevronDown,
  ChevronUp,
  History,
  Zap,
  MoreHorizontal,
  Mail,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface FeedbackThread {
  id: string;
  studentName: string;
  assignment: string;
  status: "pending-teacher" | "pending-student" | "resolved";
  lastMessage: string;
  updatedAt: string;
  messages: {
    id: string;
    sender: "teacher" | "student" | "ai";
    content: string;
    timestamp: string;
  }[];
}

export default function FeedbackLoopPage() {
  const [selectedThread, setSelectedThread] = useState<string>("t1");
  const [threads, setThreads] = useState<FeedbackThread[]>([
    {
      id: "t1",
      studentName: "Alice Chen",
      assignment: "React State Lab",
      status: "pending-teacher",
      lastMessage: "I updated the useMemo logic, can you check again?",
      updatedAt: "10 mins ago",
      messages: [
        { id: "m1", sender: "ai", content: "Suggestion: Optimization required in the dependency array.", timestamp: "2 days ago" },
        { id: "m2", sender: "teacher", content: "You should use useMemo here to prevent expensive re-renders.", timestamp: "1 day ago" },
        { id: "m3", sender: "student", content: "I updated the useMemo logic, can you check again?", timestamp: "10 mins ago" }
      ]
    },
    {
      id: "t2",
      studentName: "David Kim",
      assignment: "Intro to CSS",
      status: "resolved",
      lastMessage: "Thanks for the help with Flexbox!",
      updatedAt: "3 hours ago",
      messages: [
        { id: "m4", sender: "teacher", content: "Excellent use of space-between here.", timestamp: "5 hours ago" },
        { id: "m5", sender: "student", content: "Thanks for the help with Flexbox!", timestamp: "3 hours ago" }
      ]
    }
  ]);

  return (
    <div className="min-h-screen space-y-8 p-8 max-w-[1400px] mx-auto">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight italic uppercase">Feedback Loop</h1>
          <p className="mt-2 text-gray-400">Iterative dialogue and refinement between teacher, student, and AI.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="px-4 py-2 rounded-xl bg-amber-400/10 border border-amber-400/20 text-[10px] font-bold text-amber-400 uppercase tracking-widest">
             8 Active Loops
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[800px]">
        {/* Thread Sidebar */}
        <div className="lg:col-span-4 glass-v2 border-white/5 rounded-3xl flex flex-col overflow-hidden">
           <div className="p-6 border-b border-white/5">
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                 <input type="text" placeholder="Search threads..." className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none" />
              </div>
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {threads.map(thread => (
                 <button 
                   key={thread.id}
                   onClick={() => setSelectedThread(thread.id)}
                   className={cn(
                     "w-full text-left p-4 rounded-2xl border transition-all duration-300 group",
                     selectedThread === thread.id ? "bg-amber-400/10 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.05)]" : "bg-white/[0.02] border-white/5 hover:border-white/10"
                   )}
                 >
                    <div className="flex justify-between items-start mb-2">
                       <p className={cn("text-xs font-bold uppercase tracking-tight", selectedThread === thread.id ? "text-amber-400" : "text-white")}>
                          {thread.studentName}
                       </p>
                       <span className="text-[8px] text-gray-600 font-bold uppercase">{thread.updatedAt}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">{thread.assignment}</p>
                    <p className="text-xs text-gray-400 line-clamp-1 italic">"{thread.lastMessage}"</p>
                    <div className="mt-4 flex items-center justify-between">
                       <div className={cn(
                         "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase border",
                         thread.status === 'pending-teacher' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                         thread.status === 'pending-student' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                         "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                       )}>
                          <div className={cn("h-1 w-1 rounded-full", 
                             thread.status === 'pending-teacher' ? "bg-amber-400" :
                             thread.status === 'pending-student' ? "bg-blue-400" : "bg-emerald-400"
                          )} />
                          {thread.status.replace('-', ' ')}
                       </div>
                       <div className="flex -space-x-1 px-2">
                          {[1, 2].map(i => <div key={i} className="h-4 w-4 rounded-full border border-black bg-gray-800" />)}
                       </div>
                    </div>
                 </button>
              ))}
           </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-8 glass-v2 border-white/5 rounded-3xl flex flex-col overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.02)_0%,transparent_100%)]">
           <AnimatePresence mode="wait">
             {threads.filter(t => t.id === selectedThread).map(thread => (
               <motion.div 
                 key={thread.id}
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="flex flex-col h-full"
               >
                  <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                     <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xs font-bold text-black italic italic">
                           {thread.studentName[0]}
                        </div>
                        <div>
                           <h3 className="text-sm font-bold text-white uppercase tracking-tight">{thread.studentName}</h3>
                           <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{thread.assignment}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                        <button className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-all">
                           <History className="h-4 w-4" />
                        </button>
                        <button className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-all">
                           <CheckCircle className="h-4 w-4" />
                        </button>
                        <button className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-all">
                           <MoreHorizontal className="h-4 w-4" />
                        </button>
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 space-y-6">
                     {thread.messages.map((msg, i) => (
                        <div key={msg.id} className={cn(
                           "flex",
                           msg.sender === 'teacher' ? "justify-end" : "justify-start"
                        )}>
                           <div className={cn(
                              "max-w-[80%] rounded-2xl p-4 relative",
                              msg.sender === 'teacher' ? "bg-amber-400 text-black font-bold text-xs" : 
                              msg.sender === 'ai' ? "bg-blue-500/10 border border-blue-500/20 text-blue-400 italic text-[11px]" :
                              "bg-white/5 border border-white/10 text-gray-300 text-sm"
                           )}>
                              {msg.sender === 'ai' && <Zap className="h-3 w-3 absolute -top-1.5 -left-1.5 text-blue-400" />}
                              <p className="leading-relaxed">{msg.content}</p>
                              <span className={cn(
                                 "text-[8px] block mt-2 uppercase font-bold",
                                 msg.sender === 'teacher' ? "text-black/60 text-right" : "text-gray-600"
                              )}>
                                 {msg.sender} • {msg.timestamp}
                              </span>
                           </div>
                        </div>
                     ))}
                  </div>

                  <div className="p-6 border-t border-white/5 bg-white/[0.01]">
                     <div className="relative">
                        <textarea 
                           placeholder="Type feedback, suggestions, or technical advice..."
                           className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 pr-32 text-sm text-white focus:outline-none focus:border-amber-400 transition-all resize-none h-24"
                        />
                        <div className="absolute bottom-4 right-4 flex items-center gap-2">
                           <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-all">
                              <RotateCcw className="h-4 w-4" />
                           </button>
                           <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-400 text-black font-bold text-[10px] uppercase tracking-widest hover:bg-amber-300 transition-all shadow-[0_0_20px_rgba(251,191,36,0.1)]">
                              <Send className="h-4 w-4" />
                              Send
                           </button>
                        </div>
                     </div>
                  </div>
               </motion.div>
             ))}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { 
  Search, 
  Filter, 
  Download, 
  MoreVertical, 
  User, 
  Mail, 
  TrendingUp, 
  TrendingDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Zap
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Student {
  id: string;
  name: string;
  email: string;
  mastery: number;
  engagement: number;
  risk: "low" | "medium" | "high" | "critical";
  lastActive: string;
  streak: number;
}

export default function StudentMasterListPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const students: Student[] = [
    { id: "s1", name: "Alice Chen", email: "alice@student.lumina", mastery: 88, engagement: 95, risk: "low", lastActive: "2 mins ago", streak: 12 },
    { id: "s2", name: "David Kim", email: "david@student.lumina", mastery: 42, engagement: 65, risk: "critical", lastActive: "5 hours ago", streak: 0 },
    { id: "s3", name: "Charlie Day", email: "charlie@student.lumina", mastery: 65, engagement: 82, risk: "medium", lastActive: "1 day ago", streak: 4 },
    { id: "s4", name: "Eva Rodriguez", email: "eva@student.lumina", mastery: 94, engagement: 98, risk: "low", lastActive: "Just now", streak: 25 },
    { id: "s5", name: "Frank Miller", email: "frank@student.lumina", mastery: 58, engagement: 74, risk: "high", lastActive: "3 days ago", streak: 1 },
  ];

  return (
    <div className="min-h-screen space-y-8 p-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">Student Master List</h1>
          <p className="mt-2 text-gray-400">Total Enrollment: 124 students across 4 courses.</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition-all">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
           <button className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold text-black hover:bg-amber-300 transition-all">
            <User className="h-4 w-4" />
            Add Student
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between glass-v2 p-4 rounded-2xl border-white/5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input 
            type="text"
            placeholder="Search name, email, or course..."
            className="w-full rounded-xl bg-white/5 border border-white/10 py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none placeholder:text-gray-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white">
            <Filter className="h-4 w-4" />
            Filters
          </button>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            {["All", "At-Risk", "Top Performers"].map(t => (
               <button key={t} className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-all">
                 {t}
               </button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-v2 border-white/5 rounded-3xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.01]">
              <th className="px-8 py-6 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Student</th>
              <th className="px-8 py-6 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Risk Level</th>
              <th className="px-8 py-6 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Mastery</th>
              <th className="px-8 py-6 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Engagement</th>
              <th className="px-8 py-6 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Last Active</th>
              <th className="px-8 py-6 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {students.map((student, i) => (
              <motion.tr 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                key={student.id} 
                className="group hover:bg-white/[0.02] transition-all cursor-pointer"
              >
                <td className="px-8 py-6">
                  <Link href={`/teacher/students/${student.id}`} className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-sm font-bold text-white uppercase italic">
                      {student.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-bold text-white uppercase tracking-tight group-hover:text-amber-400 transition-colors">
                        {student.name}
                      </p>
                      <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-0.5">
                        {student.email}
                      </p>
                    </div>
                  </Link>
                </td>
                <td className="px-8 py-6">
                   <div className={cn(
                     "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                     student.risk === "low" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                     student.risk === "medium" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                     student.risk === "high" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                     "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                   )}>
                     <div className={cn("h-1.5 w-1.5 rounded-full", 
                        student.risk === "low" ? "bg-emerald-500" :
                        student.risk === "medium" ? "bg-blue-500" :
                        student.risk === "high" ? "bg-amber-500" : "bg-red-500"
                     )} />
                     {student.risk}
                   </div>
                </td>
                <td className="px-8 py-6">
                   <div className="space-y-2 max-w-[120px]">
                      <div className="flex justify-between text-[10px] font-bold text-gray-500">
                        <span className="text-white">{student.mastery}%</span>
                        <TrendingUp className="h-3 w-3 text-emerald-400" />
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400" style={{ width: `${student.mastery}%` }} />
                      </div>
                   </div>
                </td>
                <td className="px-8 py-6">
                   <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-gray-600 uppercase mb-0.5">EngAGE</p>
                        <p className="text-sm font-bold text-white">{student.engagement}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-gray-600 uppercase mb-0.5">Streak</p>
                        <p className="text-sm font-bold text-amber-500">{student.streak}d</p>
                      </div>
                   </div>
                </td>
                <td className="px-8 py-6">
                  <p className="text-xs text-gray-500 font-medium">{student.lastActive}</p>
                </td>
                <td className="px-8 py-6 text-right">
                  <button className="p-2 text-gray-600 hover:text-white transition-all">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between p-4">
         <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Showing 1-5 of 124 students</p>
         <div className="flex items-center gap-2">
            <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-white hover:bg-white/10">PREV</button>
            <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-white hover:bg-white/10">NEXT</button>
         </div>
      </div>
    </div>
  );
}

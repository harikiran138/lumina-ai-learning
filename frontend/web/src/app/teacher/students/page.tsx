"use client";

import { useState, useEffect } from "react";
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
import { api } from "@/lib/api";

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
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  interface RawStudent {
    id: string;
    full_name?: string;
    name?: string;
    email?: string;
    mastery_score?: number;
    average_mastery?: number;
    engagement_score?: number;
    engagement?: number;
    risk_level?: Student["risk"];
    last_active?: string;
    updated_at?: string;
    streak?: number;
  }

  useEffect(() => {
    api.getTeacherStudents().then((data) => {
      const mapped: Student[] = (data || []).map((s: RawStudent) => ({
        id: s.id,
        name: s.full_name || s.name || "Student",
        email: s.email || "",
        mastery: s.mastery_score || s.average_mastery || 0,
        engagement: s.engagement_score || s.engagement || 0,
        risk: s.risk_level || "low",
        lastActive: s.last_active || s.updated_at || "N/A",
        streak: s.streak || 0,
      }));
      setStudents(mapped);
    }).catch((err) => {
      console.error("failed_to_load_students", err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-warning" />
    </div>
  );

  return (
    <div className="min-h-screen space-y-8 p-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">Student Master List</h1>
          <p className="mt-2 text-text-muted">Total Enrollment: {students.length} students.</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="flex items-center gap-2 rounded-xl bg-surface border border-border px-4 py-2.5 text-xs font-bold text-foreground hover:bg-surface-elevated transition-all">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
           <button className="flex items-center gap-2 rounded-xl bg-warning px-4 py-2.5 text-xs font-bold text-warning-foreground hover:bg-warning/80 transition-all">
            <User className="h-4 w-4" />
            Add Student
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between glass-v2 p-4 rounded-2xl border-border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
          <input 
            type="text"
            placeholder="Search name, email, or course..."
            className="w-full rounded-xl bg-surface border border-border py-2.5 pl-10 pr-4 text-sm text-foreground focus:outline-none placeholder:text-text-muted"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-foreground">
            <Filter className="h-4 w-4" />
            Filters
          </button>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            {["All", "At-Risk", "Top Performers"].map(t => (
               <button key={t} className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-foreground transition-all">
                 {t}
               </button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-v2 border-border rounded-3xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-8 py-6 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Student</th>
              <th className="px-8 py-6 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Risk Level</th>
              <th className="px-8 py-6 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Mastery</th>
              <th className="px-8 py-6 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Engagement</th>
              <th className="px-8 py-6 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Last Active</th>
              <th className="px-8 py-6 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {students.map((student, i) => (
              <motion.tr 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                key={student.id} 
                className="group hover:bg-surface transition-all cursor-pointer"
              >
                <td className="px-8 py-6">
                  <Link href={`/teacher/students/${student.id}`} className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-surface to-surface-elevated flex items-center justify-center text-sm font-bold text-foreground uppercase italic">
                      {student.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-bold text-foreground uppercase tracking-tight group-hover:text-warning transition-colors">
                        {student.name}
                      </p>
                      <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mt-0.5">
                        {student.email}
                      </p>
                    </div>
                  </Link>
                </td>
                <td className="px-8 py-6">
                   <div className={cn(
                     "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                     student.risk === "low" ? "bg-warning/10 text-warning border-warning/20" :
                     student.risk === "medium" ? "bg-warning/10 text-warning border-warning/20" :
                     student.risk === "high" ? "bg-warning/10 text-warning border-warning/20" :
                     "bg-danger/10 text-danger border-danger/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                   )}>
                     <div className={cn("h-1.5 w-1.5 rounded-full", 
                        student.risk === "low" ? "bg-warning" :
                        student.risk === "medium" ? "bg-warning" :
                        student.risk === "high" ? "bg-warning" : "bg-danger"
                     )} />
                     {student.risk}
                   </div>
                </td>
                <td className="px-8 py-6">
                   <div className="space-y-2 max-w-[120px]">
                      <div className="flex justify-between text-[10px] font-bold text-text-muted">
                        <span className="text-foreground">{student.mastery}%</span>
                        <TrendingUp className="h-3 w-3 text-warning" />
                      </div>
                      <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
                        <div className="h-full bg-warning" style={{ width: `${student.mastery}%` }} />
                      </div>
                   </div>
                </td>
                <td className="px-8 py-6">
                   <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-text-secondary uppercase mb-0.5">EngAGE</p>
                        <p className="text-sm font-bold text-foreground">{student.engagement}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-text-secondary uppercase mb-0.5">Streak</p>
                        <p className="text-sm font-bold text-warning">{student.streak}d</p>
                      </div>
                   </div>
                </td>
                <td className="px-8 py-6">
                  <p className="text-xs text-text-secondary font-medium">{student.lastActive}</p>
                </td>
                <td className="px-8 py-6 text-right">
                  <button className="p-2 text-text-secondary hover:text-foreground transition-all">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between p-4">
        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Showing {students.length} students</p>
         <div className="flex items-center gap-2">
          <button className="px-4 py-2 rounded-xl bg-surface border border-border text-[10px] font-bold text-foreground hover:bg-surface-elevated">PREV</button>
          <button className="px-4 py-2 rounded-xl bg-surface border border-border text-[10px] font-bold text-foreground hover:bg-surface-elevated">NEXT</button>
         </div>
      </div>
    </div>
  );
}

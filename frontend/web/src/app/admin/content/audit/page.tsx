"use client";

import { useEffect, useState } from "react";
import { 
  FileSearch, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  BarChart3,
  Clock,
  Layers,
  Zap,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditCourse {
  id: string;
  title: string;
  code: string;
  status: 'reviewed' | 'pending' | 'flagged';
  last_audit: string;
  quality_score: number;
}

export default function CourseAudit() {
  const [courses, setCourses] = useState<AuditCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mocking audit data
    const mockData: AuditCourse[] = [
      {
        id: "c-1",
        title: "Introduction to Advanced Algorithms",
        code: "CS402",
        status: "reviewed",
        last_audit: "2 days ago",
        quality_score: 98
      },
      {
        id: "c-2",
        title: "Ethical AI & Society",
        code: "PHI201",
        status: "flagged",
        last_audit: "5 hours ago",
        quality_score: 64
      },
      {
        id: "c-3",
        title: "Principles of Macroeconomics",
        code: "ECON101",
        status: "pending",
        last_audit: "Never",
        quality_score: 0
      }
    ];
    setCourses(mockData);
    setLoading(false);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <FileSearch className="h-8 w-8 text-amber-500" />
            Curriculum Audit
          </h1>
          <p className="mt-1 text-gray-400">Validate AI knowledge mapping, course quality, and structural integrity.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
            <BarChart3 className="h-4 w-4" />
            Global Quality Report
          </button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-4">
        <AuditSummaryCard label="Global Score" value="84.2%" sub="System Average" icon={Zap} color="gold" />
        <AuditSummaryCard label="Verified Nodes" value="4,250" sub="Mapped knowledge" icon={Layers} color="gold" />
        <AuditSummaryCard label="Flagged Content" value="24" sub="Action Required" icon={AlertCircle} color="red" />
        <AuditSummaryCard label="Review Queue" value="12" sub="Pending Audits" icon={Clock} color="amber" />
      </div>

      <div className="glass-v2 border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search audit trail..." 
                className="w-full rounded-xl border border-white/10 bg-white/5 py-1.5 pl-10 pr-4 text-xs text-white focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              <span className="h-2 w-2 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
              Review Mode: Active
            </div>
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {courses.map((course) => (
            <div key={course.id} className="p-6 hover:bg-white/[0.02] transition-colors flex items-center justify-between group">
              <div className="flex items-center gap-6">
                <div className={cn(
                  "h-14 w-14 rounded-2xl flex items-center justify-center border",
                  course.status === 'reviewed' ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" :
                  course.status === 'flagged' ? "bg-red-500/10 border-red-500/20 text-red-500" :
                  "bg-amber-500/10 border-amber-500/20 text-amber-500"
                )}>
                  <Layers className="h-7 w-7" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">{course.title}</h3>
                    <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-gray-500 uppercase">
                      {course.code}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-gray-600" />
                      <span className="text-[10px] font-bold text-gray-500 uppercase">Audit: {course.last_audit}</span>
                    </div>
                    {course.status === 'reviewed' && (
                      <div className="flex items-center gap-1.5 text-yellow-400">
                        <CheckCircle2 className="h-3 w-3" />
                        <span className="text-[10px] font-bold uppercase">Verified Quality</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-12">
                <div className="text-right">
                  <p className={cn(
                    "text-lg font-display font-bold",
                    course.quality_score > 90 ? "text-yellow-400" : course.quality_score > 70 ? "text-amber-400" : "text-red-400"
                  )}>
                    {course.quality_score > 0 ? `${course.quality_score}%` : 'N/A'}
                  </p>
                  <p className="text-[9px] text-gray-600 uppercase font-bold tracking-widest">Score</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100">
                  Full Audit
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AuditSummaryCard({ label, value, sub, icon: Icon, color }: any) {
  const colors: any = {
    blue: "text-amber-400 bg-amber-500/5 border-amber-500/10",
    purple: "text-yellow-400 bg-yellow-500/5 border-yellow-500/10",
    red: "text-red-400 bg-red-500/5 border-red-500/10",
    amber: "text-amber-400 bg-amber-500/5 border-amber-500/10",
  };
  return (
    <div className={cn("glass-v2 border p-6", colors[color])}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</span>
        <Icon className="h-4 w-4 opacity-50" />
      </div>
      <p className="text-2xl font-display font-bold text-white">{value}</p>
      <p className="mt-1 text-[10px] text-gray-500">{sub}</p>
    </div>
  );
}

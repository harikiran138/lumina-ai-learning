"use client";

import { useEffect, useState } from "react";
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  Bell, 
  User, 
  ArrowDownRight, 
  BarChart3,
  MessageSquare,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AtRiskStudent {
  id: string;
  name: string;
  risk_level: 'high' | 'medium' | 'low';
  last_activity: string;
  trend: 'declining' | 'stable';
  indicators: string[];
}

export default function AtRiskOverview() {
  const [atRisk, setAtRisk] = useState<AtRiskStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mocking data for intervention overview
    const mockData: AtRiskStudent[] = [
      {
        id: "s-101",
        name: "James Wilson",
        risk_level: "high",
        last_activity: "4 days ago",
        trend: "declining",
        indicators: ["Low Quiz Scores", "Inactive 4+ Days"]
      },
      {
        id: "s-202",
        name: "Sarah Chen",
        risk_level: "high",
        last_activity: "2 days ago",
        trend: "declining",
        indicators: ["High Misconception Flag", "Guardian Signal"]
      },
      {
        id: "s-303",
        name: "Marcus Thorne",
        risk_level: "medium",
        last_activity: "1 day ago",
        trend: "stable",
        indicators: ["Declining Participation"]
      }
    ];
    setAtRisk(mockData);
    setLoading(false);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            At-Risk Overview
          </h1>
          <p className="mt-1 text-gray-400">Predictive analysis of student retention and engagement drop-offs.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-red-600/10 border border-red-500/20 px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-600/20 transition-colors">
            <Bell className="h-4 w-4" />
            Alert Teachers
          </button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <RiskCard label="Critical Risk" value="42" sub="Immediate intervention needed" color="red" />
        <RiskCard label="Declining Trend" value="156" sub="+12% since last week" color="amber" />
        <RiskCard label="Interventions" value="89" sub="Resolved this month" color="emerald" />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Active Intervention Queue</h2>
            <div className="flex items-center gap-3">
              <Search className="h-4 w-4 text-gray-600" />
              <Filter className="h-4 w-4 text-gray-600" />
            </div>
          </div>
          
          <div className="space-y-4">
            {atRisk.map((student) => (
              <div key={student.id} className="glass-v2 border-white/5 p-5 hover:bg-white/[0.02] transition-all group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center border",
                      student.risk_level === 'high' ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    )}>
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{student.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Last Active: {student.last_activity}</span>
                        <div className="h-1 w-1 rounded-full bg-gray-700" />
                        <span className={cn(
                          "text-[10px] font-bold uppercase flex items-center gap-1",
                          student.trend === 'declining' ? "text-red-400" : "text-gray-500"
                        )}>
                          <ArrowDownRight className="h-3 w-3" />
                          {student.trend}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {student.indicators.map((ind, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-bold text-gray-400 uppercase">
                      {ind}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Risk Attribution</h2>
          <div className="glass-v2 border-white/5 p-6 space-y-6">
            <div className="space-y-4">
              <RiskFactor label="Academic Performance" percentage={65} color="bg-red-500" />
              <RiskFactor label="Platform Activity" percentage={25} color="bg-amber-500" />
              <RiskFactor label="Submission Delays" percentage={10} color="bg-blue-500" />
            </div>
            
            <div className="pt-6 border-t border-white/5">
              <div className="rounded-xl bg-blue-500/5 border border-blue-500/10 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-bold text-white">Lumina Insight</span>
                </div>
                <p className="text-[10px] leading-relaxed text-gray-400">
                  Engagement drop-offs typically precede grade decline by <span className="text-blue-400 font-bold">12.4 days</span>. Automated interventions are scheduled for students with a &gt;40% risk score.
                </p>
              </div>
            </div>

            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-all">
              <MessageSquare className="h-4 w-4" />
              Schedule Batch Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RiskCard({ label, value, sub, color }: any) {
  const colors: any = {
    red: "bg-red-500/5 border-red-500/10 text-red-400",
    amber: "bg-amber-500/5 border-amber-500/10 text-amber-400",
    emerald: "bg-emerald-500/5 border-emerald-500/10 text-emerald-400",
  };
  return (
    <div className={cn("glass-v2 border p-6", colors[color])}>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</p>
      <p className="mt-2 text-3xl font-display font-bold text-white">{value}</p>
      <p className="mt-1 text-[10px] text-gray-500">{sub}</p>
    </div>
  );
}

function RiskFactor({ label, percentage, color }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
        <span className="text-gray-400">{label}</span>
        <span className="text-white">{percentage}%</span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div className={cn("h-full", color)} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

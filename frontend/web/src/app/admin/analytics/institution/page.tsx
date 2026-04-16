"use client";

import { useEffect, useState } from "react";
import { 
  BarChart3, 
  Download, 
  Globe, 
  Users, 
  BookOpen, 
  TrendingUp,
  Brain,
  Scale
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function InstitutionAnalytics() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
  }, []);

  if (loading) return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-amber-400" />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-amber-500" />
            Institution Analytics
          </h1>
          <p className="mt-1 text-gray-400">Macro-level insights into academic performance, equity gaps, and institutional ROI.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
            <Download className="h-4 w-4" />
            Full Institutional Report
          </button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-4">
        <MetricCard label="Academic ROI" value="+18.4%" trend="up" icon={TrendingUp} />
        <MetricCard label="Equity Gap" value="2.4%" trend="down" icon={Scale} />
        <MetricCard label="AI Adoption" value="92%" trend="up" icon={Brain} />
        <MetricCard label="Market Reach" value="12" trend="stable" icon={Globe} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="glass-v2 border-white/5 p-6 flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Enrollment Growth</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-[10px] font-bold text-gray-500">2023</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <span className="text-[10px] font-bold text-gray-500">2024</span>
              </div>
            </div>
          </div>
          <div className="flex-1 flex items-end justify-between gap-4 px-4 pb-4">
            {[45, 60, 48, 75, 90, 65, 80].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full flex justify-center gap-1">
                  <div className="w-2.5 bg-amber-500/20 rounded-t-sm group-hover:bg-amber-500/40 transition-all" style={{ height: `${val-10}%` }} />
                  <div className="w-2.5 bg-amber-500 rounded-t-sm group-hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all" style={{ height: `${val}%` }} />
                </div>
                <span className="text-[9px] font-bold text-gray-600 uppercase">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-v2 border-white/5 p-6 flex flex-col h-[400px]">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-8">Competency Matrix</h3>
          <div className="flex-1 relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <div className="h-64 w-64 rounded-full border border-gray-500/50" />
              <div className="h-48 w-48 rounded-full border border-gray-500/50 absolute" />
              <div className="h-32 w-32 rounded-full border border-gray-500/50 absolute" />
            </div>
            <div className="grid grid-cols-2 gap-20 relative z-10 w-full px-12">
              <CompetencyNode label="CRITICAL THINKING" value="8.4" />
              <CompetencyNode label="ADAPTABILITY" value="9.1" />
              <CompetencyNode label="CODE ACCURACY" value="7.2" />
              <CompetencyNode label="CREATIVITY" value="6.8" />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-v2 border-white/5 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Institutional Leaders</h3>
          <button className="text-[10px] font-bold text-amber-400 hover:text-amber-300 transition-colors uppercase">View All Units</button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <LeaderUnit name="Engineering" efficiency="94%" users="4,250" courses="24" />
          <LeaderUnit name="Business" efficiency="88%" users="3,120" courses="18" />
          <LeaderUnit name="Design" efficiency="91%" users="1,850" courses="12" />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, trend, icon: Icon }: any) {
  return (
    <div className="glass-v2 border-white/5 p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
        <Icon className="h-16 w-16 text-amber-400" />
      </div>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</p>
      <div className="flex items-baseline gap-2 mt-2">
        <p className="text-2xl font-display font-bold text-white">{value}</p>
        <span className={cn(
          "text-[10px] font-bold px-1.5 py-0.5 rounded-md border",
          trend === 'up' ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" :
          trend === 'down' ? "bg-red-500/10 border-red-500/20 text-red-400" :
          "bg-white/5 border-white/10 text-gray-500"
        )}>
          {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
        </span>
      </div>
    </div>
  );
}

function CompetencyNode({ label, value }: any) {
  return (
    <div className="text-center group">
      <p className="text-xs font-bold text-gray-500 tracking-wider mb-1 group-hover:text-amber-400 transition-colors">{label}</p>
      <p className="text-2xl font-display font-bold text-white group-hover:scale-110 transition-transform">{value}</p>
    </div>
  );
}

function LeaderUnit({ name, efficiency, users, courses }: any) {
  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold text-white">{name}</span>
        <span className="px-2 py-0.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-[9px] font-bold text-yellow-400">{efficiency} EFFICIENCY</span>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Users className="h-3 w-3 text-gray-600" />
          <span className="text-[10px] font-bold text-gray-500">{users}</span>
        </div>
        <div className="flex items-center gap-2">
          <BookOpen className="h-3 w-3 text-gray-600" />
          <span className="text-[10px] font-bold text-gray-500">{courses} Courses</span>
        </div>
      </div>
    </div>
  );
}

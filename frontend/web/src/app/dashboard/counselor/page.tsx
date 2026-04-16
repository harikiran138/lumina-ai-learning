"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  HeartPulse,
  AlertCircle,
  MessageCircle,
  Bot,
  ArrowRight,
  TrendingDown,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import { api } from "@/lib/api";
import { StandardDashboard } from "@/components/dashboard/StandardDashboard";
import { cn } from "@/lib/utils";

export default function CounselorDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.getDashboardData("counselor");
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#090909]"><HeartPulse className="w-12 h-12 text-primary animate-pulse" /></div>;

  return (
    <StandardDashboard
      data={data}
      title="Wellness Sentinel"
      subtitle="Safeguarding terminal for identifying and supporting at-risk students."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <MetricSmall label="Open Cases" value="8" icon={AlertCircle} tone="danger" />
        <MetricSmall label="Resolved (Week)" value="12" icon={ShieldCheck} tone="success" />
        <MetricSmall label="Sentiment Index" value="Neutral" icon={Bot} />
      </div>

      <div className="mt-12">
        <div className="glass-v2-gold rounded-[2.5rem] p-8 border border-white/10">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-2xl font-bold">Priority At-Risk Feed</h3>
             <span className="text-[10px] text-gray-500 font-mono uppercase">Live AI monitoring active</span>
          </div>
          <div className="space-y-6">
             <RiskCase 
                name="Saisree J." 
                reason="High fatigue + performance drop (30%) in OS" 
                score="84" 
                time="2m ago" 
                priority="Critical" 
             />
             <RiskCase 
                name="Rahul K." 
                reason="Absent for 3 consecutive AI Tutor sessions" 
                score="71" 
                time="1h ago" 
                priority="High" 
             />
             <RiskCase 
                name="Ananya P." 
                reason="Expressed frustration in course forum" 
                score="62" 
                time="3h ago" 
                priority="Medium" 
             />
          </div>
        </div>
      </div>
    </StandardDashboard>
  );
}

function MetricSmall({ label, value, icon: Icon, tone = "primary" }: any) {
    const colors = {
        primary: "bg-primary/10 text-primary border-primary/20",
        success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        danger: "bg-red-500/10 text-red-500 border-red-500/20",
    };
    return (
        <div className="glass-v2-gold rounded-3xl p-6 border border-white/10 flex items-center gap-6">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border", colors[tone as keyof typeof colors])}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
            </div>
        </div>
    );
}

function RiskCase({ name, reason, score, time, priority }: any) {
    const priorities = {
        Critical: "bg-red-500/10 text-red-500 border-red-500/20",
        High: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        Medium: "bg-primary/10 text-primary border-primary/20",
    };
    return (
        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-white/20 transition-all cursor-pointer">
           <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                 <h4 className="font-bold">{name}</h4>
                 <span className={cn("px-2 py-0.5 rounded-full text-[8px] uppercase font-black border", priorities[priority as keyof typeof priorities])}>{priority}</span>
              </div>
              <p className="text-sm text-gray-400">{reason}</p>
           </div>
           <div className="flex items-center gap-10 text-right">
              <div>
                  <p className="text-[10px] text-gray-600 uppercase font-black">Risk Score</p>
                  <p className={cn("font-bold text-xl", parseInt(score) > 80 ? "text-red-500" : "text-amber-500")}>{score}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-700 group-hover:text-primary transition-colors" />
           </div>
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Heart,
  Calendar,
  Zap,
  Bot,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Smartphone
} from "lucide-react";
import { api } from "@/lib/api";
import { StandardDashboard } from "@/components/dashboard/StandardDashboard";
import { cn } from "@/lib/utils";

export default function ParentDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.getDashboardData("parent");
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#090909]"><Heart className="w-12 h-12 text-primary animate-pulse" /></div>;

  const meta = data?.meta || {};

  return (
    <StandardDashboard
      data={data}
      title="Parent Sentinel"
      subtitle={`Monitoring ${meta?.studentName || "your child"}'s academic growth and wellbeing.`}
      headerAction={
        <Link href="/parent/reports" className="h-14 px-8 rounded-2xl bg-white text-black font-black flex items-center gap-3 hover:scale-105 transition-all mt-4">
          Weekly Summary <TrendingUp className="w-5 h-5" />
        </Link>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="glass-v2-gold rounded-[2.5rem] p-8 border border-white/10">
            <h3 className="text-2xl font-bold mb-8">Recent Activity</h3>
            <div className="space-y-6">
                <ActivityItem 
                    title="Started Machine Learning session" 
                    time="14 minutes ago" 
                    icon={Bot} 
                    detail="AI Tutor focus: Backpropagation"
                />
                <ActivityItem 
                    title="Completed Calculus Quiz" 
                    time="2 hours ago" 
                    score="92%" 
                    icon={Zap} 
                />
                <ActivityItem 
                    title="Submitted Project Draft" 
                    time="Yesterday" 
                    icon={ShieldCheck} 
                    detail="Subject: Software Engineering"
                />
            </div>
         </div>

         <div className="space-y-8">
            <div className="glass-v2-gold rounded-3xl p-8 border border-white/10 bg-primary/5">
                <div className="flex items-center gap-4 mb-4">
                    <Heart className="w-8 h-8 text-primary" />
                    <h3 className="text-xl font-bold">Wellbeing Pulse</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                    {meta?.studentName || "Your child"} reports feeling <b>Confident</b> and <b>Engaged</b>. No significant fatigue patterns detected by AI.
                </p>
                <div className="flex gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] uppercase font-bold border border-emerald-500/20">Stable</span>
                    <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-[10px] uppercase font-bold border border-primary/20">High Momentum</span>
                </div>
            </div>

            <div className="glass-v2-gold rounded-3xl p-8 border border-white/10">
                <div className="flex items-center gap-4 mb-4">
                    <Smartphone className="w-8 h-8 text-gray-500" />
                    <h3 className="text-xl font-bold">Mobile Sync</h3>
                </div>
                <p className="text-gray-400 text-sm mb-6">Receive real-time mobile alerts for critical performance drops or achievement milestones.</p>
                <button className="text-primary text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                    Link Mobile Device <ArrowRight className="w-4 h-4" />
                </button>
            </div>
         </div>
      </div>
    </StandardDashboard>
  );
}

function ActivityItem({ title, time, score, icon: Icon, detail }: any) {
    return (
        <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-sm">{title}</h4>
                    {score && <span className="text-emerald-400 font-bold text-sm">{score}</span>}
                </div>
                <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">{detail || "Interaction recorded"}</p>
                    <p className="text-[10px] text-gray-700 font-mono">{time}</p>
                </div>
            </div>
        </div>
    );
}

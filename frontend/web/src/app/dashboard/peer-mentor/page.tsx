"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  MessageSquare,
  Award,
  Zap,
  ArrowRight,
  Bot,
  Terminal,
  Trophy
} from "lucide-react";
import { api } from "@/lib/api";
import { StandardDashboard } from "@/components/dashboard/StandardDashboard";
import { cn } from "@/lib/utils";

export default function PeerMentorDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.getDashboardData("peer_mentor");
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#090909]"><Zap className="w-12 h-12 text-primary animate-bounce" /></div>;

  return (
    <StandardDashboard
      data={data}
      title="Knowledge Shepherd"
      subtitle="Guiding fellow scholars through complex cognitive domains."
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard label="Mentees" value="14" icon={Users} />
        <MetricCard label="Q&A Reputation" value="1,420" icon={Award} tone="success" />
        <MetricCard label="Forum Activity" value="High" icon={MessageSquare} />
        <MetricCard label="Mentor Level" value="Lvl 4" icon={Trophy} tone="accent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        <div className="glass-v2-gold rounded-[2.5rem] p-8 border border-white/10">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-2xl font-bold">Unanswered Queries</h3>
          </div>
          <div className="space-y-4">
             <QuestionItem 
                topic="Operating Systems: Semaphore Implementation" 
                user="Scholar Ankit" 
                tags={["OS", "CS"]} 
             />
             <QuestionItem 
                topic="Data Structures: Time Complexity of Red-Black Trees" 
                user="Scholar Sonia" 
                tags={["DSA"]} 
             />
          </div>
        </div>

        <div className="space-y-8">
           <div className="glass-v2-gold rounded-3xl p-8 border border-white/10 bg-primary/5">
              <div className="flex items-center gap-4 mb-4">
                 <Bot className="w-8 h-8 text-primary" />
                 <h3 className="text-xl font-bold">Training Terminal</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                 Complete the advanced mentoring module to unlock specialized tutoring tools and earn larger reputation rewards.
              </p>
              <button className="text-primary text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all">
                Enter Training <ArrowRight className="w-4 h-4" />
              </button>
           </div>
        </div>
      </div>
    </StandardDashboard>
  );
}

function MetricCard({ label, value, icon: Icon, tone = "primary" }: any) {
  const tones = {
    primary: "text-primary bg-primary/10 border-primary/20",
    success: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    accent: "text-lumina-highlight bg-lumina-highlight/10 border-lumina-highlight/20",
  };
  return (
    <div className="glass-v2-gold rounded-3xl p-6 border border-white/10">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border mb-4", tones[tone as keyof typeof tones])}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function QuestionItem({ topic, user, tags }: any) {
    return (
        <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group cursor-pointer hover:bg-white/[0.08] transition-all">
            <div>
                <h4 className="font-bold text-sm mb-2">{topic}</h4>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-500 uppercase font-black">Asked by {user}</span>
                    <div className="flex gap-1">
                        {tags.map((t: string) => <span key={t} className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[8px] font-bold">{t}</span>)}
                    </div>
                </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-800 group-hover:text-primary transition-colors" />
        </div>
    );
}

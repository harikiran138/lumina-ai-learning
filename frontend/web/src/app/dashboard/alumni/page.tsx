"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Briefcase,
  Network,
  Calendar,
  Zap,
  ArrowRight,
  Bot,
  Star,
  UserPlus
} from "lucide-react";
import { api } from "@/lib/api";
import { StandardDashboard } from "@/components/dashboard/StandardDashboard";
import { cn } from "@/lib/utils";

export default function AlumniDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.getDashboardData("alumni");
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#090909]"><GraduationCap className="w-12 h-12 text-primary animate-pulse" /></div>;

  return (
    <StandardDashboard
      data={data}
      title="Legacy Terminal"
      subtitle="Connecting institutional history with the professional future."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <AlumniMetric label="Mentees Guided" value="4" icon={UserPlus} />
        <AlumniMetric label="Legacy Score" value="A+" icon={Star} tone="accent" />
        <AlumniMetric label="Network Size" value="840" icon={Network} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        <div className="glass-v2-gold rounded-[2.5rem] p-8 border border-white/10">
           <h3 className="text-2xl font-bold mb-8">Professional Network Insights</h3>
           <div className="space-y-6">
              <p className="text-gray-400 text-sm leading-relaxed">
                 AI matched your profile with 3 students seeking guidance in <b>Artificial Intelligence</b> and <b>Product Management</b>.
              </p>
              <button className="w-full py-5 bg-primary text-black font-black rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all">
                Schedule Mock Interviews <ArrowRight className="w-5 h-5" />
              </button>
           </div>
        </div>

        <div className="glass-v2-gold rounded-[2.5rem] p-8 border border-white/10 bg-white/5">
           <div className="flex items-center gap-3 mb-6">
              <Briefcase className="w-8 h-8 text-gray-400" />
              <h3 className="text-2xl font-bold">Industry Portal</h3>
           </div>
           <p className="text-gray-400 text-sm mb-8">
              Post job opportunities directly to the institutional board and identify top-performing final year students using AI score matching.
           </p>
           <button className="px-8 py-3 border border-white/10 rounded-xl font-bold text-xs uppercase tracking-widest hover:border-primary transition-all">
              Post Opportunity
           </button>
        </div>
      </div>
    </StandardDashboard>
  );
}

function AlumniMetric({ label, value, icon: Icon, tone = "primary" }: any) {
  return (
    <div className="glass-v2-gold rounded-3xl p-8 border border-white/5 flex items-center gap-8 group hover:bg-white/[0.02] transition-all">
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border", tone === "accent" ? "bg-lumina-highlight/10 text-lumina-highlight border-lumina-highlight/20" : "bg-primary/10 text-primary border-primary/20")}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">{label}</p>
        <p className="text-3xl font-black">{value}</p>
      </div>
    </div>
  );
}

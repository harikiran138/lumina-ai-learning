"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  AlertOctagon,
  FileText,
  BarChart,
  Bot,
  Settings,
  ArrowRight,
  ShieldAlert
} from "lucide-react";
import { api } from "@/lib/api";
import { StandardDashboard } from "@/components/dashboard/StandardDashboard";
import { cn } from "@/lib/utils";

export default function HODDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.getDashboardData("hod");
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#090909]"><ShieldAlert className="w-12 h-12 text-primary animate-pulse" /></div>;

  return (
    <StandardDashboard
      data={data}
      title="Department Governance"
      subtitle={`Overseeing ${data?.meta?.departmentName || "Engineering"} Department performance and faculty output.`}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatBlock label="Faculty Members" value="24" icon={Users} />
        <StatBlock label="Active Batches" value="8" icon={LayoutDashboard} />
        <StatBlock label="Avg. Syllabus Sync" value="92%" icon={FileText} tone="success" />
        <StatBlock label="At-Risk Students" value="14" icon={AlertOctagon} tone="danger" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
        <div className="lg:col-span-2 glass-v2-gold rounded-[2.5rem] p-8 border border-white/10">
          <h3 className="text-2xl font-bold mb-8">Faculty Performance Terminal</h3>
          <div className="space-y-4">
             <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold">JD</div>
                  <div>
                    <h4 className="font-bold">Dr. John Doe</h4>
                    <p className="text-xs text-gray-400">Computer Science • CS-A Section</p>
                  </div>
                </div>
                <div className="flex items-center gap-12">
                   <div className="text-center">
                     <p className="text-[10px] text-gray-500 uppercase font-black">Velocity</p>
                     <p className="text-primary font-bold">High</p>
                   </div>
                   <div className="text-center">
                     <p className="text-[10px] text-gray-500 uppercase font-black">Engagement</p>
                     <p className="text-emerald-500 font-bold">98%</p>
                   </div>
                   <ArrowRight className="w-5 h-5 text-gray-700" />
                </div>
             </div>
             {/* Repeat for others */}
          </div>
        </div>

        <div className="glass-v2-gold rounded-[2.5rem] p-8 border border-white/10 bg-red-500/5">
          <div className="flex items-center gap-3 mb-6">
            <ShieldAlert className="w-8 h-8 text-red-500" />
            <h3 className="text-2xl font-bold">Risk Insights</h3>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            AI detected abnormal performance drops across 3 courses. Administrative intervention recommended for Batch 2024.
          </p>
          <button className="w-full py-5 bg-red-500 text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-red-600 transition-all">
            Review Alerts <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </StandardDashboard>
  );
}

function StatBlock({ label, value, icon: Icon, tone = "primary" }: any) {
    const colors = {
        primary: "bg-primary/10 text-primary border-primary/20",
        success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        danger: "bg-red-500/10 text-red-500 border-red-500/20",
    };
    return (
        <div className="glass-v2-gold rounded-3xl p-6 border border-white/10">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 border", colors[tone as keyof typeof colors])}>
                <Icon className="w-6 h-6" />
            </div>
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">{label}</p>
            <p className="text-3xl font-bold">{value}</p>
        </div>
    );
}

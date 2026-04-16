"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Building,
  Key,
  Database,
  Cpu,
  Activity,
  CreditCard,
  Settings,
  ArrowRight,
  Server
} from "lucide-react";
import { api } from "@/lib/api";
import { StandardDashboard } from "@/components/dashboard/StandardDashboard";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.getDashboardData("admin");
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#090909]"><Server className="w-12 h-12 text-primary animate-spin" /></div>;

  return (
    <StandardDashboard
      data={data}
      title="Institutional Command Center"
      subtitle="Lifecycle management and AI infrastructure control hub."
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatTile label="Active Seats" value="1,240 / 2,000" icon={Users} progress={62} />
        <StatTile label="AI Tokens Used" value="8.4M" icon={Cpu} tone="accent" />
        <StatTile label="Auth Latency" value="12ms" icon={Activity} tone="success" />
        <StatTile label="Storage" value="42GB" icon={Database} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
        <div className="lg:col-span-2 space-y-8">
           <AdminToolCard title="Department Lifecycle" description="Initialize, modify, or archive institutional branches." icon={Building} action="Manage Departments" />
           <AdminToolCard title="Policy Control" description="Set global rules for AI interaction and data privacy." icon={ShieldCheck} action="Edit Policies" />
           <AdminToolCard title="Access Keys" description="Generate and rotate API keys and institutional secrets." icon={Key} action="View Keys" />
        </div>

        <div className="glass-v2-gold rounded-[2.5rem] p-8 border border-white/10 flex flex-col justify-between">
           <div>
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="w-8 h-8 text-primary" />
                <h3 className="text-2xl font-bold">Billing & Usage</h3>
              </div>
              <div className="space-y-6">
                 <div>
                    <div className="flex justify-between text-xs uppercase tracking-widest text-gray-500 mb-2">
                       <span>Monthly Credits</span>
                       <span>84%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-primary w-[84%]" />
                    </div>
                 </div>
                 <p className="text-gray-400 text-sm leading-relaxed">
                    Institutional AI quota is nearing the threshold. Consider upgrading or setting consumption limits per department.
                 </p>
              </div>
           </div>
           <button className="w-full py-5 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-3 mt-8 hover:bg-gray-200 transition-all">
              Upgrade Quota <ArrowRight className="w-5 h-5" />
           </button>
        </div>
      </div>
    </StandardDashboard>
  );
}

function Users(props: any) { return <Server {...props} />; } // Proxy for usage

function StatTile({ label, value, icon: Icon, tone = "primary", progress }: any) {
    const colors = {
        primary: "text-primary",
        accent: "text-lumina-highlight",
        success: "text-emerald-400",
    };
    return (
        <div className="glass-v2-gold rounded-3xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
                <Icon className={cn("w-6 h-6", colors[tone as keyof typeof colors])} />
                {progress && <span className="text-[10px] font-black text-gray-600">{progress}% utilized</span>}
            </div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">{label}</p>
            <p className="text-2xl font-black">{value}</p>
        </div>
    );
}

function AdminToolCard({ title, description, icon: Icon, action }: any) {
    return (
        <div className="glass-v2-gold rounded-3xl p-8 border border-white/5 flex items-center justify-between hover:bg-white/[0.02] transition-all group">
            <div className="flex items-center gap-8">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors" />
                </div>
                <div>
                    <h4 className="text-xl font-bold mb-1">{title}</h4>
                    <p className="text-gray-500 text-sm max-w-md">{description}</p>
                </div>
            </div>
            <button className="px-6 py-3 border border-white/10 rounded-xl font-bold bg-white/5 text-xs uppercase tracking-widest hover:border-primary/50 hover:text-primary transition-all">
                {action}
            </button>
        </div>
    );
}

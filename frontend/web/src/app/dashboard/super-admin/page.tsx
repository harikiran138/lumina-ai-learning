"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Server,
  Activity,
  Globe,
  Database,
  Lock,
  Zap,
  ArrowRight,
  Cpu,
  BarChart3
} from "lucide-react";
import { api } from "@/lib/api";
import { StandardDashboard } from "@/components/dashboard/StandardDashboard";
import { cn } from "@/lib/utils";

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.getDashboardData("super_admin");
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#090909]"><Lock className="w-12 h-12 text-primary animate-pulse" /></div>;

  return (
    <StandardDashboard
      data={data}
      title="Global Nexus Control"
      subtitle="System-wide health, multi-institutional deployment monitoring, and root security."
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <HealthMetric label="Global Uptime" value="99.98%" icon={Activity} tone="success" />
        <HealthMetric label="Total Instances" value="42" icon={Globe} />
        <HealthMetric label="DB Latency" value="4ms" icon={Database} tone="success" />
        <HealthMetric label="Security Events" value="0" icon={ShieldAlert} tone="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
        <div className="lg:col-span-2 glass-v2-gold rounded-[2.5rem] p-8 border border-white/10">
          <h3 className="text-2xl font-bold mb-8">Institutional Infrastructure Hub</h3>
          <div className="space-y-4">
             <InstanceItem name="Stanford Engineering" location="US-WEST-2" status="Healthy" users="14.2k" />
             <InstanceItem name="IIT Bombay" location="AP-SOUTH-1" status="Healthy" users="8.4k" />
             <InstanceItem name="MIT Lab" location="US-EAST-1" status="Maintenance" users="1.2k" />
          </div>
        </div>

        <div className="space-y-8">
           <div className="glass-v2-gold rounded-3xl p-8 border border-white/10 bg-primary/5">
              <div className="flex items-center gap-4 mb-4">
                 <Cpu className="w-8 h-8 text-primary" />
                 <h3 className="text-xl font-bold">Model Deployment</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                 Running Llama-3-70B on internal institutional inference engine. 24% cost optimization detected vs GPT-4.
              </p>
              <button className="w-full py-4 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-all">
                Config Inference <Settings className="w-4 h-4" />
              </button>
           </div>

           <div className="glass-v2-gold rounded-3xl p-8 border border-white/10">
              <div className="flex items-center gap-4 mb-4">
                 <BarChart3 className="w-8 h-8 text-gray-400" />
                 <h3 className="text-xl font-bold">Global Audit</h3>
              </div>
              <p className="text-gray-400 text-sm mb-6">Review system-wide access logs and data movement patterns for compliance.</p>
              <button className="text-primary text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all">
                Enter Audit Logs <ArrowRight className="w-4 h-4" />
              </button>
           </div>
        </div>
      </div>
    </StandardDashboard>
  );
}

function Settings(props: any) { return <Zap {...props} />; }

function HealthMetric({ label, value, icon: Icon, tone = "primary" }: any) {
    const col = tone === "success" ? "text-emerald-400 border-emerald-400/20" : "text-primary border-primary/20";
    return (
        <div className="glass-v2-gold rounded-3xl p-6 border border-white/10">
            <Icon className={cn("w-6 h-6 mb-4", col)} />
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">{label}</p>
            <p className="text-2xl font-black">{value}</p>
        </div>
    );
}

function InstanceItem({ name, location, status, users }: any) {
    const colors = {
        Healthy: "bg-emerald-500/20 text-emerald-400 border-emerald-500/20",
        Maintenance: "bg-amber-500/20 text-amber-400 border-amber-500/20",
    };
    return (
        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group hover:bg-white/[0.08] transition-all cursor-pointer">
            <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-primary/50 transition-colors">
                    <Server className="w-5 h-5 text-gray-500 group-hover:text-primary" />
                </div>
                <div>
                   <h4 className="font-bold">{name}</h4>
                   <p className="text-xs text-gray-500 font-mono">{location} • {users} Users</p>
                </div>
            </div>
            <div className="flex items-center gap-8 text-right">
                <span className={cn("px-3 py-1 rounded-full text-[8px] uppercase font-black border", colors[status as keyof typeof colors])}>{status}</span>
                <ArrowRight className="w-5 h-5 text-gray-800" />
            </div>
        </div>
    );
}

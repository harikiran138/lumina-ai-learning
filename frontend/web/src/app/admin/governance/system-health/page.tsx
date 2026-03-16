"use client";

import { useEffect, useState } from "react";
import { 
  Activity, 
  Server, 
  Database, 
  Zap, 
  Cpu,
  Globe,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SystemHealth {
  api_latency: string;
  db_connections: number;
  cache_hit_rate: string;
  storage_usage: string;
  services: {
    name: string;
    status: string;
    uptime: string;
  }[];
  last_incident: string;
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  const loadHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/health");
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      console.error("failed_to_load_system_health", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  if (loading && !health) return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-amber-400" />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">System Health</h1>
          <p className="mt-1 text-gray-400">Real-time infrastructure monitoring and service status.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadHealth}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh Status
          </button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-4">
        <HealthMetric 
          label="API Latency" 
          value={health?.api_latency || "0ms"} 
          icon={Zap} 
          trend="optimal"
        />
        <HealthMetric 
          label="DB Connections" 
          value={health?.db_connections || 0} 
          icon={Database} 
          trend="stable"
        />
        <HealthMetric 
          label="Cache Hit Rate" 
          value={health?.cache_hit_rate || "0%"} 
          icon={Activity} 
          trend="optimal"
        />
        <HealthMetric 
          label="Storage Usage" 
          value={health?.storage_usage || "0%"} 
          icon={Server} 
          trend="stable"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-v2 border-white/5 overflow-hidden">
            <div className="border-b border-white/5 p-4 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Core Services</h2>
              <span className="text-[10px] font-bold text-yellow-400 border border-yellow-500/20 bg-yellow-500/5 px-2 py-0.5 rounded-full uppercase">All Systems Normal</span>
            </div>
            <div className="divide-y divide-white/5">
              {health?.services.map((service) => (
                <div key={service.name} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "rounded-lg p-2 border",
                      service.status === "operational" ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    )}>
                      {service.status === "operational" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{service.name}</p>
                      <p className="text-xs text-gray-500">Service is responding as expected</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-400">Uptime</p>
                    <p className="text-sm font-mono text-white">{service.uptime}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-v2 border-white/5 p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Globe className="h-4 w-4 text-amber-400" />
              Infrastructure Detail
            </h3>
            <div className="space-y-4">
              <ResourceItem label="CPU Cluster" value={42} />
              <ResourceItem label="Memory Load" value={68} />
              <ResourceItem label="Network In" value={24} />
              <ResourceItem label="Disk IOPS" value={12} />
            </div>
          </div>

          <div className="glass-v2 border-white/5 p-6 space-y-4 bg-gradient-to-br from-amber-500/5 to-transparent">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              Incidents
            </h3>
            <p className="text-sm text-gray-400 italic">
              {health?.last_incident || "No incidents reported in the last 30 days."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthMetric({ label, value, icon: Icon }: any) {
  return (
    <div className="glass-v2 border-white/5 p-6">
      <div className="flex items-center gap-3 text-gray-400 mb-3">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-display font-bold text-white">{value}</div>
    </div>
  );
}

function ResourceItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
        <span className="text-gray-500">{label}</span>
        <span className="text-white">{value}%</span>
      </div>
      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full transition-all duration-1000",
            value > 80 ? "bg-red-500" : value > 60 ? "bg-amber-500" : "bg-amber-500"
          )} 
          style={{ width: `${value}%` }} 
        />
      </div>
    </div>
  );
}

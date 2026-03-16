"use client";

import { useEffect, useState } from "react";
import { 
  Settings, 
  Search, 
  Filter, 
  Save, 
  Power, 
  Globe, 
  Bell, 
  Cpu,
  Database,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PlatformConfiguration() {
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
            <Settings className="h-8 w-8 text-amber-500" />
            Platform Control
          </h1>
          <p className="mt-1 text-gray-400">Manage global system settings, feature flags, and infrastructure status.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-500 transition-colors">
            <Save className="h-4 w-4" />
            Apply Changes
          </button>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Core Infrastructure */}
        <div className="lg:col-span-2 space-y-6">
          <SectionHeader icon={Cpu} label="System State" />
          <div className="glass-v2 border-white/5 p-6 space-y-8">
            <ToggleOption 
              title="Maintenance Mode" 
              desc="Redirect all non-admin traffic to service page" 
              isActive={false} 
              isWarning 
            />
            <ToggleOption 
              title="Public Registration" 
              desc="Allow new users to create accounts without invite" 
              isActive={true} 
            />
            <ToggleOption 
              title="AI Personalization Hub" 
              desc="Enable dynamic curriculum generation" 
              isActive={true} 
            />
          </div>

          <SectionHeader icon={Globe} label="Localization & API" />
          <div className="glass-v2 border-white/5 p-6 grid gap-6 md:grid-cols-2">
            <InputGroup label="Default Language" value="English (US)" />
            <InputGroup label="System Timezone" value="UTC" />
            <InputGroup label="API Rate Limit" value="10,000 req/hr" />
            <InputGroup label="CDN Region" value="Global Edge" />
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
          <SectionHeader icon={Bell} label="Notifications" />
          <div className="glass-v2 border-white/5 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">System Alerts</span>
              <div className="h-5 w-9 rounded-full bg-amber-600 relative cursor-pointer">
                <div className="h-3 w-3 rounded-full bg-white absolute top-1 right-1" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Security Webhooks</span>
              <div className="h-5 w-9 rounded-full bg-amber-600 relative cursor-pointer">
                <div className="h-3 w-3 rounded-full bg-white absolute top-1 right-1" />
              </div>
            </div>
          </div>

          <SectionHeader icon={Database} label="Infrastructure Status" />
          <div className="glass-v2 border-white/5 p-6 space-y-4">
            <StatusIndicator label="PostgreSQL Core" status="Operational" />
            <StatusIndicator label="MinIO Vector Store" status="Operational" />
            <StatusIndicator label="Redis Cache" status="Degraded" isWarning />
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, label }: any) {
  return (
    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
      <Icon className="h-4 w-4" />
      {label}
    </h2>
  );
}

function ToggleOption({ title, desc, isActive, isWarning }: any) {
  return (
    <div className="flex items-center justify-between group">
      <div>
        <p className={cn("text-sm font-bold", isWarning ? "text-amber-500" : "text-white")}>{title}</p>
        <p className="text-[10px] text-gray-500">{desc}</p>
      </div>
      <div className={cn(
        "h-6 w-11 rounded-full relative cursor-pointer transition-all border",
        isActive ? "bg-amber-600 border-amber-500 shadow-[0_0_10px_rgba(37,99,235,0.4)]" : "bg-white/5 border-white/10"
      )}>
        <div className={cn(
          "h-4 w-4 rounded-full bg-white absolute top-1 transition-all shadow-sm",
          isActive ? "right-1" : "left-1 bg-gray-600"
        )} />
      </div>
    </div>
  );
}

function InputGroup({ label, value }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{label}</label>
      <input 
        type="text" 
        defaultValue={value} 
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
      />
    </div>
  );
}

function StatusIndicator({ label, status, isWarning }: any) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <div className={cn("h-1.5 w-1.5 rounded-full shadow-[0_0_8px]", isWarning ? "bg-amber-500 shadow-amber-500/50" : "bg-yellow-500 shadow-yellow-500/50")} />
        <span className={cn("text-[9px] font-bold uppercase", isWarning ? "text-amber-500" : "text-yellow-500")}>{status}</span>
      </div>
    </div>
  );
}

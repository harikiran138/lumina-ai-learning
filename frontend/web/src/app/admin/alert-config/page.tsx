"use client";

import { useState } from "react";
import {
  Bell,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Users,
  Bot,
  Shield,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: string;
  duration: string;
  notifyRoles: string[];
  channel: "email" | "in-app" | "both";
  active: boolean;
  category: "academic" | "ai" | "security" | "system";
}

const DEFAULT_RULES: AlertRule[] = [
  {
    id: "ar-1",
    name: "Low Mastery Alert",
    condition: "Student mastery score falls below threshold for specified duration",
    threshold: "40%",
    duration: "7 days",
    notifyRoles: ["Parent", "Counselor", "HOD"],
    channel: "both",
    active: true,
    category: "academic",
  },
  {
    id: "ar-2",
    name: "AI Quota Exceeded",
    condition: "Department token usage exceeds budget quota",
    threshold: "95%",
    duration: "Immediate",
    notifyRoles: ["Admin", "HOD"],
    channel: "both",
    active: true,
    category: "ai",
  },
  {
    id: "ar-3",
    name: "Unauthorized Access Attempt",
    condition: "User attempts to access restricted resource",
    threshold: "3 attempts",
    duration: "10 minutes",
    notifyRoles: ["Admin"],
    channel: "email",
    active: true,
    category: "security",
  },
  {
    id: "ar-4",
    name: "Policy Violation",
    condition: "Action flagged as policy breach",
    threshold: "Any",
    duration: "Immediate",
    notifyRoles: ["Admin", "Compliance Officer"],
    channel: "both",
    active: false,
    category: "security",
  },
  {
    id: "ar-5",
    name: "System Error Spike",
    condition: "Error rate exceeds normal baseline",
    threshold: "5% error rate",
    duration: "5 minutes",
    notifyRoles: ["Admin"],
    channel: "in-app",
    active: true,
    category: "system",
  },
];

const CATEGORY_META: Record<AlertRule["category"], { label: string; icon: any; color: string }> = {
  academic: { label: "Academic", icon: Users, color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  ai: { label: "AI", icon: Bot, color: "text-lumina-highlight bg-lumina-highlight/10 border-lumina-highlight/20" },
  security: { label: "Security", icon: Shield, color: "text-red-400 bg-red-400/10 border-red-400/20" },
  system: { label: "System", icon: Activity, color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
};

export default function AlertConfigPage() {
  const [rules, setRules] = useState<AlertRule[]>(DEFAULT_RULES);
  const [saved, setSaved] = useState(false);
  const [activeFilter, setActiveFilter] = useState<AlertRule["category"] | "all">("all");

  const toggleRule = (id: string) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));
    setSaved(false);
  };

  const deleteRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const filtered = activeFilter === "all" ? rules : rules.filter((r) => r.category === activeFilter);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.35em] text-lumina-highlight">
            Institution Admin
          </p>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <Bell className="h-8 w-8 text-amber-500" />
            Alert Configuration
          </h1>
          <p className="mt-1 text-gray-400">
            Define custom alert rules for academic risk, AI quota limits, security events, and system health.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-lumina-highlight/30 bg-lumina-highlight/10 px-4 py-2 text-sm font-semibold text-lumina-highlight hover:bg-lumina-highlight/20 transition-colors">
            <Plus className="h-4 w-4" />
            New Rule
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
          >
            <Save className="h-4 w-4" />
            Save All
          </button>
        </div>
      </header>

      {saved && (
        <div className="rounded-2xl border border-green-400/20 bg-green-500/10 px-4 py-3 flex items-center gap-3">
          <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
          <p className="text-sm font-semibold text-green-200">Alert rules saved successfully.</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {(["all", "academic", "ai", "security", "system"] as const).slice(1).map((cat) => {
          const meta = CATEGORY_META[cat];
          const count = rules.filter((r) => r.category === cat).length;
          const activeCount = rules.filter((r) => r.category === cat && r.active).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={cn(
                "rounded-3xl border p-4 text-left transition-all",
                meta.color,
                activeFilter === cat ? "ring-2 ring-lumina-highlight/40" : "hover:bg-white/5",
              )}
            >
              <meta.icon className="h-5 w-5 mb-2" />
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{meta.label}</p>
              <p className="text-2xl font-display font-bold text-white mt-1">{activeCount}<span className="text-sm font-normal text-gray-500">/{count}</span></p>
              <p className="text-xs text-gray-500">Active rules</p>
            </button>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["all", "academic", "ai", "security", "system"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={cn(
              "rounded-xl px-4 py-1.5 text-sm font-semibold capitalize transition-all",
              activeFilter === f
                ? "bg-lumina-highlight/15 text-lumina-highlight border border-lumina-highlight/30"
                : "text-gray-400 hover:text-gray-200 border border-transparent",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {filtered.map((rule) => {
          const meta = CATEGORY_META[rule.category];
          return (
            <div key={rule.id} className="glass-v2 border-white/5 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  <div className={cn("rounded-xl border p-2.5 shrink-0", meta.color)}>
                    <meta.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-display font-bold text-white">{rule.name}</h3>
                      <span className={cn("rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest", meta.color)}>
                        {meta.label}
                      </span>
                      {rule.active ? (
                        <span className="rounded-full border border-green-400/20 bg-green-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-green-300">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full border border-gray-600/20 bg-gray-600/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-gray-500">
                          Disabled
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-400">{rule.condition}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span>
                        <span className="font-semibold text-gray-400">Threshold:</span> {rule.threshold}
                      </span>
                      <span>
                        <span className="font-semibold text-gray-400">Duration:</span> {rule.duration}
                      </span>
                      <span>
                        <span className="font-semibold text-gray-400">Channel:</span> {rule.channel}
                      </span>
                      <span>
                        <span className="font-semibold text-gray-400">Notify:</span>{" "}
                        {rule.notifyRoles.join(", ")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={cn(
                      "rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all",
                      rule.active
                        ? "border-red-400/20 bg-red-400/10 text-red-300 hover:bg-red-400/20"
                        : "border-green-400/20 bg-green-400/10 text-green-300 hover:bg-green-400/20",
                    )}
                  >
                    {rule.active ? "Disable" : "Enable"}
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="rounded-xl border border-white/10 bg-white/5 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Example Rule Logic */}
      <section className="glass-v2 border-white/5 p-6">
        <h2 className="text-lg font-display font-bold text-white mb-3">Example Rule Logic</h2>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 font-mono text-xs text-gray-400 leading-loose">
          <span className="text-lumina-highlight">IF</span>{" "}
          <span className="text-white">mastery</span>{" "}
          <span className="text-amber-400">&lt; 40%</span>{" "}
          <span className="text-lumina-highlight">for</span>{" "}
          <span className="text-white">7 days</span>
          <br />
          <span className="text-lumina-highlight pl-4">→ notify</span>{" "}
          <span className="text-white">parent</span>{" "}
          <span className="text-gray-500">+</span>{" "}
          <span className="text-white">counselor</span>
          <br />
          <span className="text-lumina-highlight pl-4">→ flag</span>{" "}
          <span className="text-white">student</span>{" "}
          <span className="text-red-400">at-risk</span>
        </div>
      </section>
    </div>
  );
}

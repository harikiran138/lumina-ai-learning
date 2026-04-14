"use client";

import { useState } from "react";
import {
  Link2,
  CheckCircle2,
  AlertCircle,
  Settings2,
  ExternalLink,
  Zap,
  CreditCard,
  Video,
  Database,
  Book,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Integration {
  id: string;
  name: string;
  description: string;
  category: "erp" | "lms" | "video" | "payment" | "other";
  status: "connected" | "disconnected" | "error";
  icon: typeof Link2;
  connectedSince?: string;
  docsUrl?: string;
}

const INTEGRATIONS: Integration[] = [
  {
    id: "int-erp-1",
    name: "SAP ERP",
    description: "Sync student records, enrollment data, and financial ledgers with your institution's ERP system.",
    category: "erp",
    status: "connected",
    icon: Database,
    connectedSince: "Jan 2024",
  },
  {
    id: "int-erp-2",
    name: "Oracle ERP Cloud",
    description: "Enterprise resource planning integration for HR, finance, and academic administration.",
    category: "erp",
    status: "disconnected",
    icon: Database,
  },
  {
    id: "int-video-1",
    name: "Zoom",
    description: "Launch and manage virtual classes, office hours, and meetings directly from Lumina.",
    category: "video",
    status: "connected",
    icon: Video,
    connectedSince: "Feb 2024",
  },
  {
    id: "int-video-2",
    name: "Microsoft Teams",
    description: "Integrate Teams for collaborative learning, class notifications, and department channels.",
    category: "video",
    status: "disconnected",
    icon: Video,
  },
  {
    id: "int-lms-1",
    name: "Moodle LMS",
    description: "Bidirectional sync of course content, assignments, grades, and student activity.",
    category: "lms",
    status: "error",
    icon: Book,
    connectedSince: "Mar 2024",
  },
  {
    id: "int-lms-2",
    name: "Google Classroom",
    description: "Import classrooms, assignments, and roster data from Google Workspace for Education.",
    category: "lms",
    status: "disconnected",
    icon: Book,
  },
  {
    id: "int-pay-1",
    name: "Razorpay",
    description: "Collect fee payments, manage subscriptions, and issue receipts through the platform.",
    category: "payment",
    status: "connected",
    icon: CreditCard,
    connectedSince: "Nov 2023",
  },
  {
    id: "int-pay-2",
    name: "Stripe",
    description: "International payment gateway for collecting fees, institutional licenses, and subscriptions.",
    category: "payment",
    status: "disconnected",
    icon: CreditCard,
  },
];

const CATEGORY_META: Record<Integration["category"], { label: string; icon: typeof Link2 }> = {
  erp: { label: "ERP Systems", icon: Database },
  lms: { label: "LMS", icon: Book },
  video: { label: "Video / Meetings", icon: Video },
  payment: { label: "Payment Gateways", icon: CreditCard },
  other: { label: "Other", icon: Zap },
};

const STATUS_STYLE: Record<Integration["status"], { label: string; cls: string }> = {
  connected: { label: "Connected", cls: "border-green-400/20 bg-green-400/10 text-green-300" },
  disconnected: { label: "Not Connected", cls: "border-gray-600/20 bg-gray-600/10 text-gray-500" },
  error: { label: "Connection Error", cls: "border-red-400/20 bg-red-400/10 text-red-300" },
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>(INTEGRATIONS);
  const [activeFilter, setActiveFilter] = useState<Integration["category"] | "all">("all");

  const toggleConnection = (id: string) => {
    setIntegrations((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        if (i.status === "connected") return { ...i, status: "disconnected" as const, connectedSince: undefined };
        return { ...i, status: "connected" as const, connectedSince: "Now" };
      }),
    );
  };

  const filtered = activeFilter === "all" ? integrations : integrations.filter((i) => i.category === activeFilter);
  const connectedCount = integrations.filter((i) => i.status === "connected").length;
  const errorCount = integrations.filter((i) => i.status === "error").length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.35em] text-lumina-highlight">
            Institution Admin
          </p>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <Link2 className="h-8 w-8 text-amber-500" />
            Integrations
          </h1>
          <p className="mt-1 text-gray-400">
            Connect Lumina with your ERP, LMS, video conferencing, and payment systems.
          </p>
        </div>
      </header>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-green-400/20 bg-green-400/10 p-5">
          <CheckCircle2 className="h-5 w-5 text-green-400 mb-2" />
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Connected</p>
          <p className="text-3xl font-display font-bold text-white mt-1">{connectedCount}</p>
        </div>
        <div className="rounded-3xl border border-gray-600/20 bg-white/5 p-5">
          <Link2 className="h-5 w-5 text-gray-500 mb-2" />
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Available</p>
          <p className="text-3xl font-display font-bold text-white mt-1">{integrations.length}</p>
        </div>
        <div className={cn("rounded-3xl border p-5", errorCount > 0 ? "border-red-400/20 bg-red-400/10" : "border-green-400/20 bg-green-400/10")}>
          {errorCount > 0 ? (
            <AlertCircle className="h-5 w-5 text-red-400 mb-2" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-green-400 mb-2" />
          )}
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Errors</p>
          <p className="text-3xl font-display font-bold text-white mt-1">{errorCount}</p>
        </div>
      </div>

      {errorCount > 0 && (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 flex items-center gap-3">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-200">
            {errorCount} integration{errorCount > 1 ? "s have" : " has"} a connection error. Please review and reconnect.
          </p>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["all", "erp", "lms", "video", "payment"] as const).map((f) => (
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
            {f === "all" ? "All" : CATEGORY_META[f].label}
          </button>
        ))}
      </div>

      {/* Integration Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((intg) => {
          const status = STATUS_STYLE[intg.status];
          return (
            <div key={intg.id} className="glass-v2 border-white/5 p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <intg.icon className="h-5 w-5 text-lumina-highlight" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-white">{intg.name}</p>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
                      {CATEGORY_META[intg.category].label}
                    </span>
                  </div>
                </div>
                <span className={cn("rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest shrink-0", status.cls)}>
                  {status.label}
                </span>
              </div>
              <p className="text-sm text-gray-400">{intg.description}</p>
              {intg.connectedSince && (
                <p className="text-xs text-gray-500">Connected since: {intg.connectedSince}</p>
              )}
              <div className="flex items-center gap-2 mt-auto pt-2">
                <button
                  onClick={() => toggleConnection(intg.id)}
                  className={cn(
                    "flex-1 rounded-xl border px-4 py-2 text-sm font-semibold transition-all",
                    intg.status === "connected"
                      ? "border-red-400/20 bg-red-400/10 text-red-300 hover:bg-red-400/20"
                      : intg.status === "error"
                        ? "border-amber-400/20 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20"
                        : "border-lumina-highlight/20 bg-lumina-highlight/10 text-lumina-highlight hover:bg-lumina-highlight/20",
                  )}
                >
                  {intg.status === "connected" ? "Disconnect" : intg.status === "error" ? "Reconnect" : "Connect"}
                </button>
                <button className="rounded-xl border border-white/10 bg-white/5 p-2 text-gray-400 hover:text-gray-200 hover:bg-white/10 transition-all">
                  <Settings2 className="h-4 w-4" />
                </button>
                <button className="rounded-xl border border-white/10 bg-white/5 p-2 text-gray-400 hover:text-gray-200 hover:bg-white/10 transition-all">
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Info,
  Zap,
  Shield,
  CreditCard,
  Activity,
  Landmark,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NotifSeverity = "critical" | "warning" | "info" | "success";

interface Notification {
  id: string;
  severity: NotifSeverity;
  category: string;
  title: string;
  detail: string;
  time: string;
  read: boolean;
}

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    severity: "critical",
    category: "System",
    title: "System Outage — API Gateway",
    detail: "API gateway experienced elevated error rates (>5%) for 3 minutes. Auto-recovered.",
    time: "2 min ago",
    read: false,
  },
  {
    id: "2",
    severity: "critical",
    category: "AI",
    title: "AI Failure Spike Detected",
    detail: "Guardian AI flagged 14 responses in a 10-minute window on Institution #7.",
    time: "18 min ago",
    read: false,
  },
  {
    id: "3",
    severity: "warning",
    category: "Billing",
    title: "Cost Anomaly — Token Usage",
    detail: "Token consumption 2.4× above daily baseline. Review AI Model Control settings.",
    time: "1 hr ago",
    read: false,
  },
  {
    id: "4",
    severity: "warning",
    category: "Security",
    title: "Multiple Failed Login Attempts",
    detail: "12 failed login attempts detected from IP 192.168.10.44 over 5 minutes.",
    time: "2 hr ago",
    read: true,
  },
  {
    id: "5",
    severity: "info",
    category: "Institutions",
    title: "New Institution Onboarded",
    detail: "Westlake University has completed onboarding. 820 users provisioned.",
    time: "4 hr ago",
    read: true,
  },
  {
    id: "6",
    severity: "success",
    category: "Billing",
    title: "Invoice Paid — Enterprise Tier",
    detail: "Summit College Ltd paid invoice #INV-2024-0042 ($4,800).",
    time: "6 hr ago",
    read: true,
  },
  {
    id: "7",
    severity: "info",
    category: "AI",
    title: "AI Model Updated Globally",
    detail: "Platform-wide switch from GPT-4o to GPT-4o-mini completed with zero downtime.",
    time: "Yesterday",
    read: true,
  },
  {
    id: "8",
    severity: "success",
    category: "System",
    title: "System Health — All Services Operational",
    detail: "Full platform health check passed. API latency: 142 ms. Uptime: 99.98%.",
    time: "Yesterday",
    read: true,
  },
];

const severityConfig: Record<NotifSeverity, { icon: typeof Bell; border: string; bg: string; text: string; badge: string }> = {
  critical: {
    icon: AlertTriangle,
    border: "border-red-400/20",
    bg: "bg-red-500/5",
    text: "text-red-400",
    badge: "border-red-400/20 bg-red-400/10 text-red-300",
  },
  warning: {
    icon: Zap,
    border: "border-amber-400/20",
    bg: "bg-amber-400/5",
    text: "text-amber-400",
    badge: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  },
  info: {
    icon: Info,
    border: "border-blue-400/20",
    bg: "bg-blue-500/5",
    text: "text-blue-400",
    badge: "border-blue-400/20 bg-blue-400/10 text-blue-300",
  },
  success: {
    icon: CheckCircle2,
    border: "border-green-400/20",
    bg: "bg-green-500/5",
    text: "text-green-400",
    badge: "border-green-400/20 bg-green-400/10 text-green-300",
  },
};

const categoryIcon: Record<string, typeof Bell> = {
  System: Activity,
  AI: Zap,
  Billing: CreditCard,
  Security: Shield,
  Institutions: Landmark,
};

type FilterType = "all" | "unread" | NotifSeverity;

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(DEMO_NOTIFICATIONS);
  const [filter, setFilter] = useState<FilterType>("all");

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const markRead = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );

  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    return n.severity === filter;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filterButtons: { label: string; value: FilterType }[] = [
    { label: "All", value: "all" },
    { label: "Unread", value: "unread" },
    { label: "Critical", value: "critical" },
    { label: "Warnings", value: "warning" },
    { label: "Info", value: "info" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <Bell className="h-8 w-8 text-lumina-highlight" />
            Notifications
            {unreadCount > 0 && (
              <span className="rounded-full border border-red-400/30 bg-red-400/15 px-2.5 py-0.5 text-sm font-bold text-red-400">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="mt-1 text-gray-400">
            Platform-wide alerts for system health, AI anomalies, billing events, and security incidents.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" />
            Mark all as read
          </button>
        )}
      </header>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        {(["critical", "warning", "info", "success"] as NotifSeverity[]).map((sev) => {
          const count = notifications.filter((n) => n.severity === sev).length;
          const cfg = severityConfig[sev];
          return (
            <button
              key={sev}
              onClick={() => setFilter(sev)}
              className={cn(
                "rounded-2xl border p-4 text-left transition-all",
                cfg.border,
                cfg.bg,
                filter === sev ? "ring-1 ring-white/20" : "hover:bg-white/5",
              )}
            >
              <cfg.icon className={cn("h-5 w-5 mb-2", cfg.text)} />
              <p className="text-xl font-bold text-white">{count}</p>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 capitalize">
                {sev}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {filterButtons.map((btn) => (
          <button
            key={btn.value}
            onClick={() => setFilter(btn.value)}
            className={cn(
              "rounded-xl border px-4 py-1.5 text-sm font-semibold transition-all",
              filter === btn.value
                ? "border-lumina-highlight/30 bg-lumina-highlight/15 text-lumina-highlight"
                : "border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10",
            )}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-gray-500" />
            <p className="text-white font-semibold">No notifications</p>
            <p className="text-sm text-gray-400 mt-1">You're all caught up.</p>
          </div>
        )}
        {filtered.map((notif) => {
          const cfg = severityConfig[notif.severity];
          const CatIcon = categoryIcon[notif.category] ?? Bell;
          return (
            <div
              key={notif.id}
              onClick={() => markRead(notif.id)}
              className={cn(
                "flex items-start gap-4 rounded-2xl border p-5 transition-all cursor-pointer",
                notif.read
                  ? "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
                  : cn("border", cfg.border, cfg.bg, "hover:brightness-110"),
              )}
            >
              <div className={cn("mt-0.5 rounded-xl p-2 shrink-0", cfg.bg, cfg.border, "border")}>
                <cfg.icon className={cn("h-4 w-4", cfg.text)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className={cn("font-semibold", notif.read ? "text-gray-300" : "text-white")}>
                    {notif.title}
                  </p>
                  {!notif.read && (
                    <span className="h-2 w-2 rounded-full bg-lumina-highlight shrink-0" />
                  )}
                </div>
                <p className="text-sm text-gray-400">{notif.detail}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]", cfg.badge)}>
                    {notif.severity}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <CatIcon className="h-3 w-3" />
                    {notif.category}
                  </span>
                  <span className="text-xs text-gray-600">{notif.time}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

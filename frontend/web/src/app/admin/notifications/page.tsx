"use client";

import { useState } from "react";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Users,
  GraduationCap,
  Bot,
  Activity,
  Clock,
  Trash2,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  category: "system" | "academic" | "ai" | "user";
  timestamp: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n-1",
    title: "AI Quota Alert",
    message: "Computer Science department has consumed 95% of its monthly AI token budget.",
    type: "warning",
    category: "ai",
    timestamp: "10 minutes ago",
    read: false,
  },
  {
    id: "n-2",
    title: "New Faculty Added",
    message: "Prof. Ananya Sharma has been successfully onboarded to the Physics department.",
    type: "success",
    category: "user",
    timestamp: "1 hour ago",
    read: false,
  },
  {
    id: "n-3",
    title: "Student At-Risk Flag",
    message: "3 students in B.Tech CSE Sem 3 have been flagged as at-risk due to low mastery scores.",
    type: "warning",
    category: "academic",
    timestamp: "3 hours ago",
    read: true,
  },
  {
    id: "n-4",
    title: "Moodle LMS Connection Error",
    message: "The Moodle LMS integration has lost connection. Please reconnect in Integrations.",
    type: "error",
    category: "system",
    timestamp: "5 hours ago",
    read: false,
  },
  {
    id: "n-5",
    title: "Compliance Report Generated",
    message: "Monthly NAAC compliance report has been generated and is ready for download.",
    type: "success",
    category: "system",
    timestamp: "1 day ago",
    read: true,
  },
  {
    id: "n-6",
    title: "Bulk User Import Complete",
    message: "142 students were successfully imported from the uploaded CSV file.",
    type: "info",
    category: "user",
    timestamp: "2 days ago",
    read: true,
  },
  {
    id: "n-7",
    title: "System Health Restored",
    message: "All platform services are operating normally after brief maintenance window.",
    type: "success",
    category: "system",
    timestamp: "2 days ago",
    read: true,
  },
  {
    id: "n-8",
    title: "Policy Violation Detected",
    message: "Unauthorized data export attempt blocked and logged for Audit review.",
    type: "error",
    category: "system",
    timestamp: "3 days ago",
    read: true,
  },
];

const TYPE_STYLE: Record<Notification["type"], { icon: typeof Bell; cls: string }> = {
  info: { icon: Info, cls: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  warning: { icon: AlertTriangle, cls: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  success: { icon: CheckCircle2, cls: "text-green-400 bg-green-400/10 border-green-400/20" },
  error: { icon: AlertTriangle, cls: "text-red-400 bg-red-400/10 border-red-400/20" },
};

const CATEGORY_META: Record<Notification["category"], { label: string; icon: typeof Bell }> = {
  system: { label: "System", icon: Activity },
  academic: { label: "Academic", icon: GraduationCap },
  ai: { label: "AI", icon: Bot },
  user: { label: "Users", icon: Users },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState<Notification["category"] | "all" | "unread">("all");

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotif = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const filtered =
    activeFilter === "all"
      ? notifications
      : activeFilter === "unread"
        ? notifications.filter((n) => !n.read)
        : notifications.filter((n) => n.category === activeFilter);

  const unreadCount = notifications.filter((n) => !n.read).length;

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
            Notifications
            {unreadCount > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="mt-1 text-gray-400">
            System alerts, academic events, AI usage notices, and user activity across the platform.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark All Read
            </button>
          )}
          <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
            <Settings2 className="h-4 w-4" />
            Preferences
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {(["system", "academic", "ai", "user"] as const).map((cat) => {
          const meta = CATEGORY_META[cat];
          const total = notifications.filter((n) => n.category === cat).length;
          const unread = notifications.filter((n) => n.category === cat && !n.read).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={cn(
                "rounded-3xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:bg-white/8",
                activeFilter === cat && "ring-2 ring-lumina-highlight/40 bg-lumina-highlight/5 border-lumina-highlight/20",
              )}
            >
              <meta.icon className="h-5 w-5 text-lumina-highlight mb-2" />
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{meta.label}</p>
              <p className="text-2xl font-display font-bold text-white mt-1">
                {unread > 0 ? <span className="text-red-400">{unread}</span> : total}
                <span className="text-sm font-normal text-gray-500">/{total}</span>
              </p>
              <p className="text-xs text-gray-500">Unread / Total</p>
            </button>
          );
        })}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["all", "unread", "system", "academic", "ai", "user"] as const).map((f) => (
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
            {f === "unread" ? `Unread (${unreadCount})` : f}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="glass-v2 border-white/5 p-12 text-center">
            <CheckCircle2 className="h-8 w-8 text-gray-600 mx-auto mb-3" />
            <p className="font-semibold text-gray-400">No notifications here</p>
          </div>
        )}
        {filtered.map((notif) => {
          const style = TYPE_STYLE[notif.type];
          const catMeta = CATEGORY_META[notif.category];
          return (
            <div
              key={notif.id}
              onClick={() => markRead(notif.id)}
              className={cn(
                "glass-v2 border-white/5 p-5 flex items-start gap-4 transition-all cursor-pointer hover:border-white/10",
                !notif.read && "border-lumina-highlight/10 bg-lumina-highlight/[0.02]",
              )}
            >
              <div className={cn("rounded-xl border p-2.5 shrink-0", style.cls)}>
                <style.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={cn("font-display font-bold", notif.read ? "text-gray-300" : "text-white")}>
                    {notif.title}
                  </p>
                  {!notif.read && (
                    <span className="h-1.5 w-1.5 rounded-full bg-lumina-highlight shrink-0" />
                  )}
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 border border-white/10 rounded-full px-2 py-0.5">
                    {catMeta.label}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-400">{notif.message}</p>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-600">
                  <Clock className="h-3 w-3" />
                  <span>{notif.timestamp}</span>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteNotif(notif.id); }}
                className="rounded-xl p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

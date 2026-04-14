"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  Activity,
  Filter,
  ShieldCheck,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

const allAlerts = [
  {
    id: "1",
    type: "low_mastery",
    title: "Low Mastery Alert",
    message: "Physics mastery has dropped below 45%. Immediate attention recommended.",
    child: "Alex",
    severity: "high",
    read: false,
    time: "2 hours ago",
    date: "2024-04-02",
  },
  {
    id: "2",
    type: "missing_assignment",
    title: "Assignment Not Submitted",
    message: "'Newton's Laws – Lab Report' was not submitted before the deadline.",
    child: "Alex",
    severity: "high",
    read: false,
    time: "5 hours ago",
    date: "2024-04-02",
  },
  {
    id: "3",
    type: "inactivity",
    title: "Inactivity Detected",
    message: "No study activity detected for 48 hours. Alex has not logged in.",
    child: "Alex",
    severity: "medium",
    read: false,
    time: "1 day ago",
    date: "2024-04-01",
  },
  {
    id: "4",
    type: "low_mastery",
    title: "Biology Mastery Warning",
    message: "Biology mastery is at 39%, below the recommended 45% threshold.",
    child: "Alex",
    severity: "high",
    read: true,
    time: "2 days ago",
    date: "2024-03-31",
  },
  {
    id: "5",
    type: "attendance",
    title: "Session Absence",
    message: "Alex was absent from the Chemistry session on March 29.",
    child: "Alex",
    severity: "medium",
    read: true,
    time: "4 days ago",
    date: "2024-03-29",
  },
  {
    id: "6",
    type: "improvement",
    title: "Performance Improved",
    message: "Great news! Mathematics mastery increased from 65% to 78% this week.",
    child: "Alex",
    severity: "info",
    read: true,
    time: "5 days ago",
    date: "2024-03-28",
  },
]

const severityConfig = {
  high: {
    bg: "bg-red-500/5",
    border: "border-red-500/20",
    badge: "bg-red-500/20 text-red-400 border-red-500/30",
    icon: AlertTriangle,
    iconColor: "text-red-400",
    label: "Critical",
  },
  medium: {
    bg: "bg-yellow-500/5",
    border: "border-yellow-500/20",
    badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    icon: Clock,
    iconColor: "text-yellow-400",
    label: "Warning",
  },
  info: {
    bg: "bg-green-500/5",
    border: "border-green-500/20",
    badge: "bg-green-500/20 text-green-400 border-green-500/30",
    icon: Activity,
    iconColor: "text-green-400",
    label: "Info",
  },
}

export default function ParentAlertsPage() {
  const [filter, setFilter] = useState<"all" | "unread" | "high" | "medium" | "info">("all")
  const [readIds, setReadIds] = useState<Set<string>>(
    new Set(allAlerts.filter((a) => a.read).map((a) => a.id))
  )

  const markRead = (id: string) => setReadIds((prev) => new Set([...prev, id]))
  const markAllRead = () => setReadIds(new Set(allAlerts.map((a) => a.id)))

  const filtered = allAlerts.filter((a) => {
    if (filter === "unread") return !readIds.has(a.id)
    if (filter === "high") return a.severity === "high"
    if (filter === "medium") return a.severity === "medium"
    if (filter === "info") return a.severity === "info"
    return true
  })

  const unreadCount = allAlerts.filter((a) => !readIds.has(a.id)).length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            Alerts
            {unreadCount > 0 && (
              <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs">{unreadCount} new</Badge>
            )}
          </h2>
          <p className="text-gray-400 text-sm">Early warning system — stay informed before issues escalate.</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs text-lumina-highlight hover:text-lumina-highlight/80 transition-colors shrink-0 mt-1"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Alert Trigger Reference */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <h4 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-lumina-highlight" />
          Trigger Conditions
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="text-red-400">🔴</span> Subject mastery falls below 45%
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-400">🔴</span> Assignment not submitted by deadline
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">🟡</span> No activity for 48+ hours
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">🟡</span> Session absence recorded
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-gray-500 shrink-0" />
        {(["all", "unread", "high", "medium", "info"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
              filter === f
                ? "bg-lumina-highlight text-black"
                : "bg-white/5 border border-white/10 text-gray-400 hover:text-white"
            }`}
          >
            {f === "unread" ? `Unread (${unreadCount})` : f}
          </button>
        ))}
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {filtered.map((alert, idx) => {
          const cfg = severityConfig[alert.severity as keyof typeof severityConfig]
          const Icon = cfg.icon
          const isUnread = !readIds.has(alert.id)

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => markRead(alert.id)}
              className={`flex gap-4 p-4 rounded-xl border cursor-pointer transition-all ${cfg.bg} ${cfg.border} hover:opacity-90 ${isUnread ? "ring-1 ring-white/10" : "opacity-75"}`}
            >
              <div className={`mt-0.5 shrink-0 ${cfg.iconColor}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="text-sm font-semibold text-white">{alert.title}</h4>
                  <Badge className={`${cfg.badge} border text-[10px] px-1.5`}>{cfg.label}</Badge>
                  {isUnread && (
                    <span className="h-1.5 w-1.5 rounded-full bg-lumina-highlight shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{alert.message}</p>
                <p className="text-[11px] text-gray-600 mt-1">{alert.time} · {alert.child}</p>
              </div>
              {!isUnread && (
                <CheckCircle className="h-4 w-4 text-gray-600 shrink-0 mt-0.5" />
              )}
            </motion.div>
          )
        })}

        {filtered.length === 0 && (
          <div className="bg-white/5 border border-dashed border-white/10 p-10 rounded-xl text-center">
            <Bell className="h-7 w-7 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No alerts for this filter.</p>
          </div>
        )}
      </div>
    </div>
  )
}

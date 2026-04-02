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
Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ================= TYPES ================= */

type Severity = "critical" | "warning" | "info" | "success";

interface Notification {
id: string;
title: string;
message: string;
severity: Severity;
category: "system" | "academic" | "ai" | "user";
timestamp: string;
read: boolean;
}

/* ================= DATA ================= */

const MOCK_NOTIFICATIONS: Notification[] = [
{
id: "1",
title: "AI Quota Alert",
message: "CS dept used 95% tokens",
severity: "warning",
category: "ai",
timestamp: "10 min ago",
read: false,
},
{
id: "2",
title: "System Error",
message: "API downtime detected",
severity: "critical",
category: "system",
timestamp: "1 hr ago",
read: false,
},
{
id: "3",
title: "New Faculty",
message: "Faculty added",
severity: "success",
category: "user",
timestamp: "2 hr ago",
read: true,
},
];

/* ================= CONFIG ================= */

const TYPE_STYLE = {
critical: "text-red-400 bg-red-400/10",
warning: "text-amber-400 bg-amber-400/10",
info: "text-blue-400 bg-blue-400/10",
success: "text-green-400 bg-green-400/10",
};

const CATEGORY_ICON = {
system: Activity,
academic: GraduationCap,
ai: Bot,
user: Users,
};

/* ================= COMPONENT ================= */

export default function NotificationsPage() {
const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
const [filter, setFilter] = useState<"all" | "unread" | Severity>("all");

const markRead = (id: string) =>
setNotifications((prev) =>
prev.map((n) => (n.id === id ? { ...n, read: true } : n))
);

const markAllRead = () =>
setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

const deleteNotif = (id: string) =>
setNotifications((prev) => prev.filter((n) => n.id !== id));

const filtered = notifications.filter((n) => {
if (filter === "all") return true;
if (filter === "unread") return !n.read;
return n.severity === filter;
});

const unreadCount = notifications.filter((n) => !n.read).length;

return ( <div className="space-y-6">

```
  {/* HEADER */}
  <div className="flex justify-between items-center">
    <h1 className="text-2xl font-bold flex items-center gap-2">
      <Bell /> Notifications
      {unreadCount > 0 && (
        <span className="bg-red-500 text-white px-2 rounded">
          {unreadCount}
        </span>
      )}
    </h1>

    <div className="flex gap-2">
      <button onClick={markAllRead}>Mark All</button>
      <button><Settings2 /></button>
    </div>
  </div>

  {/* FILTER */}
  <div className="flex gap-2">
    {["all", "unread", "critical", "warning", "info"].map((f) => (
      <button key={f} onClick={() => setFilter(f as any)}>
        {f}
      </button>
    ))}
  </div>

  {/* LIST */}
  <div className="space-y-3">
    {filtered.map((n) => {
      const Icon = CATEGORY_ICON[n.category];

      return (
        <div
          key={n.id}
          onClick={() => markRead(n.id)}
          className="p-4 border rounded flex justify-between cursor-pointer"
        >
          <div>
            <div className="flex gap-2 items-center">
              <Icon />
              <b>{n.title}</b>
            </div>
            <p>{n.message}</p>
            <small>{n.timestamp}</small>
          </div>

          <button onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }}>
            <Trash2 />
          </button>
        </div>
      );
    })}
  </div>

</div>
```

);
}

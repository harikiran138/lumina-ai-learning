"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ScrollText,
  ShieldAlert,
  BarChart3,
  LayoutDashboard,
  BookOpen,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertTriangle,
  Building2,
  Activity,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AuditLogEntry {
  id: string;
  user_id: string;
  institution_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  ip_address: string | null;
  created_at: string;
}

interface SecurityAnomaly {
  user_id: string;
  mutation_count: number;
  institution_id: string | null;
  first_seen: string;
  last_seen: string;
}

interface InstitutionStats {
  institution_id: string;
  institution_name: string | null;
  mutation_count: number;
}

const ENTITY_TYPES = ["all", "users", "courses", "enrollments", "submissions", "ai_answer_queue"];
const ACTIONS = ["all", "POST", "PATCH", "PUT", "DELETE"];

const NAV_ITEMS = [
  { label: "Dashboard",       href: "/auditor/dashboard", icon: LayoutDashboard },
  { label: "Audit Logs",      href: "/auditor/logs",      icon: ScrollText },
  { label: "Security Events",  href: "/auditor/security",  icon: ShieldAlert },
  { label: "Reports Gallery",  href: "/reports/gallery",   icon: BarChart3 },
  { label: "Course Catalog",   href: "/courses/catalog",   icon: BookOpen },
];

export default function AuditorDashboard() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [anomalies, setAnomalies] = useState<SecurityAnomaly[]>([]);
  const [institutionStats, setInstitutionStats] = useState<InstitutionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "25",
        ...(entityFilter !== "all" && { entity_type: entityFilter }),
        ...(actionFilter !== "all" && { action: actionFilter }),
        ...(dateFrom && { date_from: dateFrom }),
        ...(dateTo && { date_to: dateTo }),
      });

      const [logsRes, anomaliesRes, statsRes] = await Promise.allSettled([
        fetch(`/api/auditor/logs?${params}`),
        fetch("/api/auditor/security/anomalies"),
        fetch("/api/auditor/stats/institutions"),
      ]);

      if (logsRes.status === "fulfilled" && logsRes.value.ok) {
        const data = await logsRes.value.json();
        setLogs(data.items ?? []);
        setTotalPages(data.total_pages ?? 1);
      }

      if (anomaliesRes.status === "fulfilled" && anomaliesRes.value.ok) {
        const data = await anomaliesRes.value.json();
        setAnomalies(data.anomalies ?? []);
      }

      if (statsRes.status === "fulfilled" && statsRes.value.ok) {
        const data = await statsRes.value.json();
        setInstitutionStats(data.institutions ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [page, entityFilter, actionFilter, dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const actionColor = (action: string) => {
    if (action.includes("DELETE")) return "text-red-400 bg-red-500/10 border-red-500/20";
    if (action.includes("PATCH") || action.includes("PUT")) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    if (action.includes("POST")) return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    return "text-muted-foreground bg-white/5 border-white/10";
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-white/8 bg-surface-950 pt-4 pb-6 px-3">
        <div className="px-3 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="text-sm font-semibold text-white">Auditor</span>
          </div>
          <p className="text-[10px] text-amber-400 pl-9">Read-only access</p>
        </div>
        <nav className="space-y-0.5">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors",
                href === "/auditor/dashboard"
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6 space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Audit Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              System-wide audit logs and security monitoring
            </p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-muted-foreground text-xs hover:text-white transition-colors"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Refresh
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-surface-900 border border-white/8 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Log Entries</span>
            </div>
            <p className="text-2xl font-bold text-white">{loading ? "—" : logs.length * totalPages}</p>
          </div>
          <div className="rounded-xl bg-surface-900 border border-white/8 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Security Anomalies</span>
            </div>
            <p className="text-2xl font-bold text-white">{loading ? "—" : anomalies.length}</p>
          </div>
          <div className="rounded-xl bg-surface-900 border border-white/8 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Institutions</span>
            </div>
            <p className="text-2xl font-bold text-white">{loading ? "—" : institutionStats.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Audit Log Feed */}
          <div className="col-span-2 rounded-2xl bg-surface-900 border border-white/8 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-semibold text-white">Audit Log Feed</h2>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-3 h-3 text-muted-foreground" />
                <select
                  value={entityFilter}
                  onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
                  className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-muted-foreground focus:outline-none"
                >
                  {ENTITY_TYPES.map(t => <option key={t} value={t}>{t === "all" ? "All entities" : t}</option>)}
                </select>
                <select
                  value={actionFilter}
                  onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                  className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-muted-foreground focus:outline-none"
                >
                  {ACTIONS.map(a => <option key={a} value={a}>{a === "all" ? "All actions" : a}</option>)}
                </select>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                  className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-muted-foreground focus:outline-none"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading audit logs…</span>
              </div>
            ) : (
              <>
                <div className="divide-y divide-white/5 max-h-[420px] overflow-y-auto">
                  {logs.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-10">No log entries match the filter</p>
                  )}
                  {logs.map((log) => (
                    <div key={log.id} className="px-5 py-3 flex items-start gap-3 hover:bg-white/2 transition-colors">
                      <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded border flex-shrink-0 mt-0.5", actionColor(log.action))}>
                        {log.action.split(":")[0]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white truncate">{log.action}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {log.entity_type && <span className="mr-2">{log.entity_type}</span>}
                          {log.entity_id && <span className="mr-2 font-mono">{log.entity_id.slice(0, 8)}…</span>}
                          {log.ip_address && <span>{log.ip_address}</span>}
                        </p>
                      </div>
                      <time className="text-[10px] text-muted-foreground flex-shrink-0">
                        {new Date(log.created_at).toLocaleString([], {
                          month: "short", day: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </time>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
                  <span className="text-[11px] text-muted-foreground">Page {page} of {totalPages}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Security Anomaly Panel */}
            <div className="rounded-2xl bg-surface-900 border border-red-500/15 overflow-hidden">
              <div className="px-4 py-3 border-b border-red-500/15 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <h2 className="text-sm font-semibold text-white">Security Anomalies</h2>
              </div>
              <div className="p-4 space-y-3">
                {loading && <p className="text-xs text-muted-foreground text-center py-4">Loading…</p>}
                {!loading && anomalies.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No anomalies detected</p>
                )}
                {anomalies.map((a) => (
                  <div key={a.user_id} className="rounded-lg bg-red-500/5 border border-red-500/15 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono text-white">{a.user_id.slice(0, 12)}…</span>
                      <span className="text-[10px] font-bold text-red-400">{a.mutation_count} mutations/hr</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(a.first_seen).toLocaleTimeString()} – {new Date(a.last_seen).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Multi-tenant aggregate view */}
            <div className="rounded-2xl bg-surface-900 border border-white/8 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/8 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white">Mutations by Institution</h2>
              </div>
              <div className="p-4 space-y-2">
                {loading && <p className="text-xs text-muted-foreground text-center py-4">Loading…</p>}
                {!loading && institutionStats.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No data</p>
                )}
                {institutionStats.map((s) => (
                  <div key={s.institution_id} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground flex-1 truncate">
                      {s.institution_name ?? s.institution_id.slice(0, 12) + "…"}
                    </span>
                    <span className="text-xs font-medium text-white">{s.mutation_count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

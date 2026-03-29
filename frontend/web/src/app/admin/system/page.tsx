"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  RefreshCw,
  Server,
  Shield,
  Wifi,
  XCircle,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface HealthData {
  status?: string;
  database?: string;
  redis?: string;
  neo4j?: string;
  ml_service?: string;
  uptime_seconds?: number;
  [key: string]: any;
}

interface QueueData {
  pending?: number;
  processing?: number;
  completed_today?: number;
  failed_today?: number;
  avg_wait_seconds?: number;
  [key: string]: any;
}

interface ConfigData {
  maintenance_mode?: boolean;
  public_registration?: boolean;
  ai_tutor_enabled?: boolean;
  guardian_mode?: string;
  api_rate_limit?: number;
  [key: string]: any;
}

function formatUptime(seconds?: number) {
  if (!seconds) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function StatusBadge({ value }: { value?: string | boolean }) {
  const ok =
    value === true || value === "ok" || value === "healthy" || value === "connected" || value === "active";
  const degraded = value === "degraded" || value === "slow";

  if (ok)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-300">
        <CheckCircle className="h-3 w-3" /> Healthy
      </span>
    );
  if (degraded)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
        <AlertTriangle className="h-3 w-3" /> Degraded
      </span>
    );
  if (value === false || value === "down" || value === "error")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">
        <XCircle className="h-3 w-3" /> Down
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-gray-400">
      <Clock className="h-3 w-3" /> {String(value ?? "Unknown")}
    </span>
  );
}

function ServiceRow({
  icon: Icon,
  label,
  status,
}: {
  icon: typeof Server;
  label: string;
  status?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/10 px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-white/5 p-2">
          <Icon className="h-4 w-4 text-gray-400" />
        </div>
        <span className="text-sm font-medium text-gray-200">{label}</span>
      </div>
      <StatusBadge value={status} />
    </div>
  );
}

function StatTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "warn" | "good";
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/10 p-5">
      <p className="text-xs uppercase tracking-[0.22em] text-gray-500">{label}</p>
      <p
        className={cn(
          "mt-2 text-2xl font-semibold",
          tone === "warn" ? "text-amber-300" : tone === "good" ? "text-green-300" : "text-white",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function ToggleTile({
  label,
  description,
  enabled,
}: {
  label: string;
  description: string;
  enabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/10 px-5 py-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <span
        className={cn(
          "ml-4 shrink-0 rounded-full px-3 py-1 text-xs font-bold",
          enabled
            ? "bg-green-500/10 text-green-300"
            : "bg-red-500/10 text-red-300",
        )}
      >
        {enabled ? "ON" : "OFF"}
      </span>
    </div>
  );
}

export default function SystemAdminPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [queue, setQueue] = useState<QueueData | null>(null);
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshedAt, setRefreshedAt] = useState<Date>(new Date());

  const load = async () => {
    setLoading(true);
    try {
      const [h, q, c] = await Promise.allSettled([
        api.getAdminSystemHealth(),
        api.getAdminQueueHealth(),
        (api as any).fetchAuthorized?.("/api/admin/config").then((r: Response) =>
          r.ok ? r.json() : {}
        ),
      ]);
      if (h.status === "fulfilled") setHealth(h.value);
      if (q.status === "fulfilled") setQueue(q.value);
      if (c.status === "fulfilled") setConfig(c.value);
    } finally {
      setLoading(false);
      setRefreshedAt(new Date());
    }
  };

  useEffect(() => {
    load();
  }, []);

  const overallOk =
    health?.database !== "error" &&
    health?.redis !== "error" &&
    health?.ml_service !== "error";

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="glass-v2 border-white/5 overflow-hidden">
        <div className="flex items-start justify-between gap-4 p-8">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-amber-300/80">
              System Administration
            </p>
            <h1 className="text-4xl font-display font-bold tracking-tight text-white">
              Platform Health &amp; Configuration
            </h1>
            <p className="mt-3 max-w-2xl text-base text-gray-300">
              Live service status, AI verification queue depth, and active feature flags.
            </p>
          </div>
          <div className="flex flex-col items-end gap-3 shrink-0">
            <div
              className={cn(
                "flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold",
                overallOk
                  ? "bg-green-500/10 text-green-300"
                  : "bg-red-500/10 text-red-300",
              )}
            >
              <Activity className="h-4 w-4" />
              {loading ? "Checking…" : overallOk ? "All systems operational" : "Degraded — check services"}
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-gray-300 transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Refresh
            </button>
            <p className="text-[10px] text-gray-600">
              Last refreshed {refreshedAt.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </section>

      {/* Service Status */}
      <section className="glass-v2 border-white/5 p-6">
        <h2 className="mb-5 text-sm font-bold uppercase tracking-[0.28em] text-gray-400">
          Service Status
        </h2>
        {loading ? (
          <div className="flex min-h-[180px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-amber-400" />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ServiceRow icon={Database} label="PostgreSQL (Supabase)" status={health?.database} />
            <ServiceRow icon={Zap} label="Redis Cache" status={health?.redis} />
            <ServiceRow icon={Server} label="ML / AI Service" status={health?.ml_service} />
            <ServiceRow icon={Wifi} label="Neo4j Knowledge Graph" status={health?.neo4j} />
            <ServiceRow icon={Shield} label="Guardian Agent" status={health?.guardian ?? (config?.guardian_mode === "active" ? "active" : "inactive")} />
            <ServiceRow icon={Cpu} label="API Server" status={health?.status ?? "ok"} />
          </div>
        )}
      </section>

      {/* Uptime + Queue Stats */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass-v2 border-white/5 p-6">
          <h2 className="mb-5 text-sm font-bold uppercase tracking-[0.28em] text-gray-400">
            Server Uptime
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <StatTile label="Uptime" value={formatUptime(health?.uptime_seconds)} tone="good" />
            <StatTile label="API Rate Limit" value={config?.api_rate_limit ? `${config.api_rate_limit}/min` : "—"} />
          </div>
        </section>

        <section className="glass-v2 border-white/5 p-6">
          <h2 className="mb-5 text-sm font-bold uppercase tracking-[0.28em] text-gray-400">
            AI Verification Queue
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <StatTile label="Pending" value={queue?.pending ?? 0} tone={(queue?.pending ?? 0) > 20 ? "warn" : "default"} />
            <StatTile label="Processing" value={queue?.processing ?? 0} />
            <StatTile label="Completed Today" value={queue?.completed_today ?? 0} tone="good" />
            <StatTile label="Failed Today" value={queue?.failed_today ?? 0} tone={(queue?.failed_today ?? 0) > 0 ? "warn" : "default"} />
          </div>
        </section>
      </div>

      {/* Feature Flags */}
      {config && (
        <section className="glass-v2 border-white/5 p-6">
          <h2 className="mb-5 text-sm font-bold uppercase tracking-[0.28em] text-gray-400">
            Platform Feature Flags
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleTile
              label="Maintenance Mode"
              description="Locks the platform to admins only"
              enabled={config.maintenance_mode}
            />
            <ToggleTile
              label="Public Registration"
              description="Allow new users to self-register"
              enabled={config.public_registration}
            />
            <ToggleTile
              label="AI Tutor"
              description="Enables the conversational AI tutor for students"
              enabled={config.ai_tutor_enabled}
            />
            <ToggleTile
              label="Guardian Mode"
              description="AI safety monitoring layer"
              enabled={config.guardian_mode === "active"}
            />
          </div>
        </section>
      )}
    </div>
  );
}

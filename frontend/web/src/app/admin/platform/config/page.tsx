"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle,
  Cpu,
  Database,
  Globe,
  Save,
  Settings,
  XCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface PlatformConfig {
  maintenance_mode: boolean;
  public_registration: boolean;
  ai_tutor_enabled: boolean;
  guardian_mode: string;
  api_rate_limit: number;
  [key: string]: any;
}

interface HealthData {
  database?: string;
  redis?: string;
  ml_service?: string;
  neo4j?: string;
  [key: string]: any;
}

export default function PlatformConfiguration() {
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.allSettled([
      api.getAdminSystemHealth(),
      api.fetchWithAuth("/api/admin/config").then((r: Response) =>
        r.ok ? r.json() : null,
      ),
    ]).then(([healthRes, configRes]) => {
      if (healthRes.status === "fulfilled") setHealth(healthRes.value);
      if (configRes.status === "fulfilled" && configRes.value) {
        setConfig(configRes.value);
      } else {
        // Sensible defaults if backend has nothing yet
        setConfig({
          maintenance_mode: false,
          public_registration: true,
          ai_tutor_enabled: true,
          guardian_mode: "active",
          api_rate_limit: 10000,
        });
      }
    }).finally(() => setLoading(false));
  }, []);

  const toggle = (key: keyof PlatformConfig) => {
    setSaved(false);
    setConfig((prev) => prev ? { ...prev, [key]: !prev[key] } : prev);
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setError(null);
    try {
      await api.fetchWithAuth("/api/admin/config", {
        method: "POST",
        body: JSON.stringify(config),
      });
      setSaved(true);
    } catch (err: any) {
      setError(err?.message || "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-amber-400" />
      </div>
    );

  const infra = [
    { label: "PostgreSQL Core", status: health?.database },
    { label: "Redis Cache", status: health?.redis },
    { label: "ML / AI Service", status: health?.ml_service },
    { label: "Neo4j Graph", status: health?.neo4j },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <Settings className="h-8 w-8 text-amber-500" />
            Platform Control
          </h1>
          <p className="mt-1 text-gray-400">
            Manage global system settings, feature flags, and infrastructure status.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !config}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white transition-colors",
            saved ? "bg-green-600 hover:bg-green-500" : "bg-amber-600 hover:bg-amber-500",
            saving && "cursor-not-allowed opacity-60",
          )}
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : saved ? "Saved" : "Apply Changes"}
        </button>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <SectionHeader icon={Cpu} label="System State" />
          <div className="glass-v2 border-white/5 p-6 space-y-8">
            <ToggleOption
              title="Maintenance Mode"
              desc="Redirect all non-admin traffic to service page"
              isActive={!!config?.maintenance_mode}
              isWarning
              onToggle={() => toggle("maintenance_mode")}
            />
            <ToggleOption
              title="Public Registration"
              desc="Allow new users to create accounts without invite"
              isActive={!!config?.public_registration}
              onToggle={() => toggle("public_registration")}
            />
            <ToggleOption
              title="AI Tutor"
              desc="Enable dynamic AI-powered tutoring for students"
              isActive={!!config?.ai_tutor_enabled}
              onToggle={() => toggle("ai_tutor_enabled")}
            />
            <ToggleOption
              title="Guardian Mode"
              desc="AI safety and content moderation layer"
              isActive={config?.guardian_mode === "active"}
              onToggle={() =>
                setConfig((prev) =>
                  prev
                    ? {
                        ...prev,
                        guardian_mode:
                          prev.guardian_mode === "active" ? "inactive" : "active",
                      }
                    : prev,
                )
              }
            />
          </div>

          <SectionHeader icon={Globe} label="Localization & API" />
          <div className="glass-v2 border-white/5 p-6 grid gap-6 md:grid-cols-2">
            <InputGroup label="Default Language" value="English (US)" readOnly />
            <InputGroup label="System Timezone" value="UTC" readOnly />
            <InputGroup
              label="API Rate Limit (req/hr)"
              value={String(config?.api_rate_limit ?? 10000)}
              onChange={(v: string) =>
                setConfig((prev) =>
                  prev ? { ...prev, api_rate_limit: parseInt(v) || prev.api_rate_limit } : prev,
                )
              }
            />
            <InputGroup label="CDN Region" value="Global Edge" readOnly />
          </div>
        </div>

        <div className="space-y-6">
          <SectionHeader icon={Bell} label="Notifications" />
          <div className="glass-v2 border-white/5 p-6 space-y-4 text-sm text-gray-400">
            <p>Notification channels are configured per-role in Settings → Alerts.</p>
          </div>

          <SectionHeader icon={Database} label="Infrastructure Status" />
          <div className="glass-v2 border-white/5 p-6 space-y-4">
            {infra.map((item) => (
              <StatusIndicator key={item.label} label={item.label} status={item.status} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, label }: { icon: typeof Settings; label: string }) {
  return (
    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
      <Icon className="h-4 w-4" />
      {label}
    </h2>
  );
}

function ToggleOption({
  title,
  desc,
  isActive,
  isWarning,
  onToggle,
}: {
  title: string;
  desc: string;
  isActive: boolean;
  isWarning?: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between group">
      <div>
        <p className={cn("text-sm font-bold", isWarning ? "text-amber-500" : "text-white")}>
          {title}
        </p>
        <p className="text-[10px] text-gray-500">{desc}</p>
      </div>
      <button
        onClick={onToggle}
        className={cn(
          "h-6 w-11 rounded-full relative transition-all border",
          isActive
            ? "bg-amber-600 border-amber-500 shadow-[0_0_10px_rgba(217,119,6,0.4)]"
            : "bg-white/5 border-white/10",
        )}
        aria-pressed={isActive}
      >
        <div
          className={cn(
            "h-4 w-4 rounded-full bg-white absolute top-1 transition-all shadow-sm",
            isActive ? "right-1" : "left-1 bg-gray-600",
          )}
        />
      </button>
    </div>
  );
}

function InputGroup({
  label,
  value,
  readOnly,
  onChange,
}: {
  label: string;
  value: string;
  readOnly?: boolean;
  onChange?: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
        {label}
      </label>
      <input
        type="text"
        defaultValue={value}
        readOnly={readOnly}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className={cn(
          "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50",
          readOnly && "opacity-50 cursor-not-allowed",
        )}
      />
    </div>
  );
}

function StatusIndicator({ label, status }: { label: string; status?: string }) {
  const ok =
    status === "ok" || status === "healthy" || status === "connected" || status === "active";
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        {ok ? (
          <CheckCircle className="h-3.5 w-3.5 text-green-400" />
        ) : status ? (
          <XCircle className="h-3.5 w-3.5 text-red-400" />
        ) : (
          <div className="h-1.5 w-1.5 rounded-full bg-gray-600" />
        )}
        <span
          className={cn(
            "text-[9px] font-bold uppercase",
            ok ? "text-green-400" : status ? "text-red-400" : "text-gray-600",
          )}
        >
          {status ?? "Unknown"}
        </span>
      </div>
    </div>
  );
}

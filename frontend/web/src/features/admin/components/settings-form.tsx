"use client";

import { useMemo, useState, useTransition } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { AdminPanel } from "@/features/admin/components/primitives";

interface SettingsFormProps {
  initialConfig: Record<string, unknown>;
}

const CONFIG_LABELS: Record<string, string> = {
  maintenance_mode: "Maintenance mode",
  public_registration: "Public registration",
  ai_tutor_enabled: "AI tutor enabled",
};

export function SettingsForm({ initialConfig }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [config, setConfig] = useState<Record<string, unknown>>(initialConfig);

  const toggles = useMemo(
    () =>
      Object.entries(CONFIG_LABELS).map(([key, label]) => ({
        key,
        label,
        enabled: Boolean(config[key]),
      })),
    [config],
  );

  const saveConfig = () => {
    startTransition(async () => {
      try {
        const response = await api.fetchWithAuth("/api/admin/config", {
          method: "POST",
          body: JSON.stringify(config),
        });

        if (!response.ok) {
          throw new Error("Unable to save admin settings");
        }

        toast.success("Platform settings updated");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Unable to save admin settings",
        );
      }
    });
  };

  return (
    <AdminPanel
      title="Platform Controls"
      description="Update operational flags without leaving the dashboard."
      action={
        <button
          type="button"
          onClick={saveConfig}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-amber-300 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Saving..." : "Save settings"}
        </button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        {toggles.map((item) => (
          <label
            key={item.key}
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
          >
            <div>
              <p className="text-sm font-semibold text-white">{item.label}</p>
              <p className="text-xs text-gray-400">Stored in `/api/admin/config`.</p>
            </div>
            <input
              type="checkbox"
              checked={item.enabled}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  [item.key]: event.target.checked,
                }))
              }
              className="h-5 w-5 accent-amber-400"
            />
          </label>
        ))}

        <label className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
          <p className="text-sm font-semibold text-white">Guardian mode</p>
          <p className="mt-1 text-xs text-gray-400">
            Switch moderation posture for sensitive AI flows.
          </p>
          <select
            value={String(config.guardian_mode || "active")}
            onChange={(event) =>
              setConfig((current) => ({
                ...current,
                guardian_mode: event.target.value,
              }))
            }
            className="mt-4 w-full rounded-xl border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white"
          >
            <option value="active">Active</option>
            <option value="monitor">Monitor</option>
            <option value="paused">Paused</option>
          </select>
        </label>

        <label className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
          <p className="text-sm font-semibold text-white">API rate limit</p>
          <p className="mt-1 text-xs text-gray-400">
            Requests allowed before the admin throttle policy engages.
          </p>
          <input
            type="number"
            min={100}
            step={100}
            value={Number(config.api_rate_limit || 10000)}
            onChange={(event) =>
              setConfig((current) => ({
                ...current,
                api_rate_limit: Number(event.target.value),
              }))
            }
            className="mt-4 w-full rounded-xl border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white"
          />
        </label>
      </div>
    </AdminPanel>
  );
}


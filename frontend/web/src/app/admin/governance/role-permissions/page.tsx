"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  Lock,
  Save,
  Shield,
  UserCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface RoleMatrix {
  roles: string[];
  permissions: Record<string, string[]>;
}

export default function RolePermissions() {
  const [matrix, setMatrix] = useState<RoleMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getRoleMatrix()
      .then(setMatrix)
      .catch((err) => setError(err?.message || "Failed to load permissions"))
      .finally(() => setLoading(false));
  }, []);

  const togglePermission = (perm: string, role: string) => {
    if (!matrix) return;
    setSaved(false);
    setMatrix((prev) => {
      if (!prev) return prev;
      const current = prev.permissions[perm] ?? [];
      const next = current.includes(role)
        ? current.filter((r) => r !== role)
        : [...current, role];
      return {
        ...prev,
        permissions: { ...prev.permissions, [perm]: next },
      };
    });
  };

  const handleSave = async () => {
    if (!matrix) return;
    setSaving(true);
    setError(null);
    try {
      await (api as any).updateRoleMatrix(matrix);
      setSaved(true);
    } catch (err: any) {
      setError(err?.message || "Failed to save permissions");
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <Shield className="h-8 w-8 text-amber-500" />
            Role Permissions
          </h1>
          <p className="mt-1 text-gray-400">
            Toggle permissions per role. Changes take effect after saving.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white transition-colors",
            saved
              ? "bg-green-600 hover:bg-green-500"
              : "bg-amber-600 hover:bg-amber-500",
            saving && "cursor-not-allowed opacity-60",
          )}
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : saved ? "Saved" : "Save Changes"}
        </button>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="glass-v2 border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="p-6 text-sm font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap min-w-[240px]">
                  Resource / Action
                </th>
                {matrix?.roles.map((role) => (
                  <th key={role} className="p-6 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="rounded-full bg-amber-500/10 p-2 text-amber-400">
                        <UserCircle className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        {role}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {Object.entries(matrix?.permissions || {}).map(([perm, roles]) => (
                <tr key={perm} className="hover:bg-white/[0.01] transition-colors">
                  <td className="p-6">
                    <div>
                      <p className="text-sm font-bold text-white capitalize">
                        {perm.replace(/_/g, " ")}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-tighter">
                        PERMISSION_ID: {perm.toUpperCase()}
                      </p>
                    </div>
                  </td>
                  {matrix?.roles.map((role) => {
                    const hasAccess = roles.includes(role);
                    return (
                      <td key={`${perm}-${role}`} className="p-6 text-center">
                        <button
                          onClick={() => togglePermission(perm, role)}
                          title={
                            hasAccess
                              ? `Remove ${role} from ${perm}`
                              : `Grant ${role} access to ${perm}`
                          }
                          className={cn(
                            "mx-auto flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                            hasAccess
                              ? "bg-yellow-500/10 text-yellow-400 shadow-[inset_0_0_12px_rgba(16,185,129,0.1)] hover:bg-red-500/10 hover:text-red-400"
                              : "bg-white/5 text-gray-600 hover:text-yellow-400 hover:bg-yellow-500/10",
                          )}
                        >
                          {hasAccess ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Lock className="h-3 w-3" />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 flex items-start gap-4">
        <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-bold text-white">Dynamic RBAC Enforcement</p>
          <p className="text-sm text-gray-400 leading-relaxed">
            Changes to the permission matrix are applied to the backend middleware on save.
            Audit the impact on "Institutional Stakeholders" before restricting{" "}
            <code className="text-amber-400">analytics_view</code>.
          </p>
        </div>
      </div>
    </div>
  );
}

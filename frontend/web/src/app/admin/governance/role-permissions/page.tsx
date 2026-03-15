"use client";

import { useEffect, useState } from "react";
import { 
  Shield, 
  UserCircle, 
  Lock, 
  Check, 
  X,
  Search,
  Save,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RoleMatrix {
  roles: string[];
  permissions: {
    [key: string]: string[];
  };
}

export default function RolePermissions() {
  const [matrix, setMatrix] = useState<RoleMatrix | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/roles/matrix");
        const data = await res.json();
        setMatrix(data);
      } catch (err) {
        console.error("failed_to_load_role_matrix", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-400" />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-500" />
            Role Permissions
          </h1>
          <p className="mt-1 text-gray-400">Map system permissions to various Lumina roles (RBAC).</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 transition-colors">
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </header>

      <div className="glass-v2 border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="p-6 text-sm font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap min-w-[240px]">Resource / Action</th>
                {matrix?.roles.map((role) => (
                  <th key={role} className="p-6 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="rounded-full bg-blue-500/10 p-2 text-blue-400">
                        <UserCircle className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-bold text-white uppercase tracking-wider">{role}</span>
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
                      <p className="text-sm font-bold text-white capitalize">{perm.replace(/_/g, ' ')}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-tighter">PERMISSION_ID: {perm.toUpperCase()}</p>
                    </div>
                  </td>
                  {matrix?.roles.map((role) => {
                    const hasAccess = roles.includes(role);
                    return (
                      <td key={`${perm}-${role}`} className="p-6 text-center">
                        <button className={cn(
                          "mx-auto flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                          hasAccess 
                            ? "bg-emerald-500/10 text-emerald-400 shadow-[inset_0_0_12px_rgba(16,185,129,0.1)] hover:bg-emerald-500/20" 
                            : "bg-white/5 text-gray-600 hover:text-gray-400 hover:bg-white/10"
                        )}>
                          {hasAccess ? <Check className="h-4 w-4" /> : <Lock className="h-3 w-3" />}
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

      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 flex items-start gap-4">
        <AlertCircle className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-bold text-white">Dynamic RBAC Enforcement</p>
          <p className="text-sm text-gray-400 leading-relaxed">
            Changes to the permission matrix are applied instantly to the backend middleware. 
            Ensure you audit the impact on "Institutional Stakeholders" before restricting <code className="text-blue-400">analytics_view</code>.
          </p>
        </div>
      </div>
    </div>
  );
}

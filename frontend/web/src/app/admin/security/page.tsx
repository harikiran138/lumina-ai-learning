"use client";

import { useState } from "react";
import { Shield, Key, AlertTriangle, CheckCircle } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AdminSecurity() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw new Error(error.message);
      }
      setSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <section className="glass-v2 border-white/5 overflow-hidden">
        <div className="grid gap-6 p-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(340px,1fr)]">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-amber-300/80">
              Security Protocol
            </p>
            <h1 className="text-4xl font-display font-bold tracking-tight text-white">
              Administrate sensitive access settings.
            </h1>
            <p className="mt-4 max-w-xl text-base text-gray-300">
              Change your central administrative password to maintain security.
              This direct DB update enforces immediate credential invalidation.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 flex flex-col justify-center items-center text-center">
             <Shield className="h-12 w-12 text-amber-500 mb-2 opacity-80" />
             <p className="text-sm font-semibold text-white">System Secured</p>
             <p className="text-xs text-gray-500 mt-1 mt-1">Updates propagate immediately across cluster endpoints.</p>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-4 flex items-center gap-3 text-red-200 shadow-lg">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-green-400/20 bg-green-500/10 px-4 py-4 flex items-center gap-3 text-green-200 shadow-lg">
          <CheckCircle className="h-5 w-5 text-green-400" />
          <p className="text-sm font-semibold">Password updated securely. You can now log in with the new credentials.</p>
        </div>
      )}

      <section className="glass-v2 border-white/5 p-8">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Key className="h-5 w-5 text-amber-500" />
          Update Password
        </h2>
        
        <form onSubmit={handlePasswordUpdate} className="space-y-5 max-w-sm">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-white outline-none transition-colors focus:border-amber-400/40"
              placeholder="Min. 8 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-white outline-none transition-colors focus:border-amber-400/40"
              placeholder="Re-type password"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
          >
            {loading ? "Updating Credentials..." : "Enforce Password Update"}
          </button>
        </form>
      </section>
    </div>
  );
}

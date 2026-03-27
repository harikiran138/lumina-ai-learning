"use client";

import { useState } from "react";
import { Lock, Shield, Key, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function AdminSettings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.changePassword(newPassword);
      if (res.error) throw new Error(res.error);
      setMessage({ type: "success", text: "Password updated successfully" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update password" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-display font-bold text-white">System Settings</h1>
        <p className="mt-2 text-gray-400">Manage your administrative security and global configurations.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <section className="glass-v2 border-white/5 p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="rounded-2xl bg-lumina-highlight/10 p-3">
                <Lock className="text-lumina-highlight h-6 w-6" />
              </div>
              <h2 className="text-xl font-semibold text-white">Security & Password</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-lumina-highlight/50 transition-all"
                  placeholder="••••••••"
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-lumina-highlight/50 transition-all"
                    placeholder="Minimal 8 chars"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-lumina-highlight/50 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {message && (
                <div className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm",
                  message.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                )}>
                  {message.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto inline-flex items-center justify-center gap-3 rounded-2xl bg-lumina-highlight px-8 py-3 font-semibold text-black transition-all hover:bg-white disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Key className="h-5 w-5" />}
                Update Password
              </button>
            </form>
          </section>
        </div>

        <div className="space-y-8">
          <section className="glass-v2 border-white/5 p-6 h-full">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="text-emerald-400 h-5 w-5" />
              <h3 className="font-semibold text-white text-sm uppercase tracking-wider">Security Tip</h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Ensure your password is at least 12 characters long and includes symbols, numbers, and both uppercase and lowercase letters for maximum security.
            </p>
            <div className="mt-8 pt-8 border-t border-white/5">
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-4">Account Status</p>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <span className="text-sm text-white font-medium">Secured by Lumina v3.0</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

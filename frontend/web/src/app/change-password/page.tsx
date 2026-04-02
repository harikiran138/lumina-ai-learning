"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, getConfiguredApiBase } from "@/lib/api";
import { toast } from "sonner";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setSaving(true);
    try {
      const tempToken =
        typeof window !== "undefined" ? sessionStorage.getItem("temp_token") : null;
      if (tempToken) {
        const apiBase = getConfiguredApiBase();
        if (!apiBase) {
          throw new Error("Password service is not configured for this deployment.");
        }
        const res = await fetch(`${apiBase}/api/auth/change-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tempToken}`,
          },
          body: JSON.stringify({ newPassword: password, confirmPassword: confirm }),
        });
        if (!res.ok) {
          let detail = "Unable to update password";
          try { detail = (await res.json())?.detail || detail; } catch { /* ignore */ }
          throw new Error(detail);
        }
        sessionStorage.removeItem("temp_token");
        toast.success("Password updated — completing your profile setup");
        router.push("/onboarding");
      } else {
        await api.changePassword(password);
        toast.success("Password updated");
        // Route back to the user's own dashboard based on their role
        const user = await api.getCurrentUser();
        const roleRoutes: Record<string, string> = {
          super_admin: "/admin/dashboard",
          admin: "/admin/dashboard",
          college_admin: "/college",
          hod: "/hod",
          faculty: "/faculty",
          teacher: "/teacher/dashboard",
          student: "/student/dashboard",
        };
        router.push(user?.role ? (roleRoutes[user.role] || "/student/dashboard") : "/login");
      }
    } catch (err: any) {
      toast.error(err?.message || "Unable to update password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl">
        <h1 className="text-2xl font-semibold">Change Password</h1>
        <p className="mt-2 text-sm text-gray-400">
          Set a new password to continue.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm"
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm"
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-lumina-highlight px-4 py-3 text-sm font-semibold text-black"
            disabled={saving}
          >
            {saving ? "Saving..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

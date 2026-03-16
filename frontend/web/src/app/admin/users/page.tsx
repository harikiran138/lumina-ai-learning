"use client";

import { FormEvent, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  Plus,
  Search,
  Shield,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "student" | "teacher" | "admin";
  status: "active" | "inactive" | "suspended";
  avatar: string;
  createdAt?: string | null;
}

const DEFAULT_FORM = {
  name: "",
  email: "",
  password: "",
  role: "student" as "student" | "teacher" | "admin",
};

function formatDate(value?: string | null) {
  if (!value) return "Unknown";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await api.getAllUsers();
      setUsers(payload || []);
    } catch (err: any) {
      console.error("admin_users_load_failed", err);
      setError(err?.message || "Unable to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchTerm ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const roleCounts = {
    admin: users.filter((item) => item.role === "admin").length,
    teacher: users.filter((item) => item.role === "teacher").length,
    student: users.filter((item) => item.role === "student").length,
  };

  const statusCounts = {
    active: users.filter((item) => item.status === "active").length,
    suspended: users.filter((item) => item.status === "suspended").length,
    inactive: users.filter((item) => item.status === "inactive").length,
  };

  const updateRole = async (userId: string, nextRole: AdminUser["role"]) => {
    setSavingUserId(userId);
    try {
      await api.updateUserRole(userId, nextRole);
      setUsers((current) =>
        current.map((user) =>
          user.id === userId ? { ...user, role: nextRole } : user,
        ),
      );
    } finally {
      setSavingUserId(null);
    }
  };

  const updateStatus = async (
    userId: string,
    nextStatus: AdminUser["status"],
  ) => {
    setSavingUserId(userId);
    try {
      await api.updateUserStatus(userId, nextStatus);
      setUsers((current) =>
        current.map((user) =>
          user.id === userId ? { ...user, status: nextStatus } : user,
        ),
      );
    } finally {
      setSavingUserId(null);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Delete this user and their local progress records?")) return;
    setDeletingUserId(userId);
    try {
      await api.deleteUser(userId);
      setUsers((current) => current.filter((user) => user.id !== userId));
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleCreateUser = async (event: FormEvent) => {
    event.preventDefault();
    setSavingUserId("create");
    setError(null);
    try {
      const response = await api.adminCreateUser(formData);
      if (response?.detail) {
        throw new Error(response.detail);
      }
      setFormData(DEFAULT_FORM);
      setIsAddModalOpen(false);
      await loadUsers();
    } catch (err: any) {
      setError(err?.message || "Unable to create user");
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <div className="space-y-8">
      <section className="glass-v2 border-white/5 overflow-hidden">
        <div className="grid gap-6 p-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(340px,1fr)]">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-amber-300/80">
              User Governance
            </p>
            <h1 className="text-4xl font-display font-bold tracking-tight text-white">
              Manage access without breaking the admin session.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-gray-300">
              Account creation, role updates, and status changes now run through
              admin-specific APIs, so governance actions do not hijack your own login.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm font-semibold text-white">Current access footprint</p>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <SummaryTile label="Admins" value={roleCounts.admin} />
              <SummaryTile label="Teachers" value={roleCounts.teacher} />
              <SummaryTile label="Students" value={roleCounts.student} />
              <SummaryTile label="Active" value={statusCounts.active} />
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-amber-500"
            >
              <UserPlus className="h-4 w-4" />
              Add user
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <section className="glass-v2 border-white/5 p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name or email"
              className="w-full rounded-2xl border border-white/10 bg-black/10 py-3 pl-11 pr-4 text-white outline-none transition-colors placeholder:text-gray-500 focus:border-amber-400/40"
            />
          </label>

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-white outline-none transition-colors focus:border-amber-400/40"
          >
            <option value="all">All roles</option>
            <option value="admin">Admins</option>
            <option value="teacher">Teachers</option>
            <option value="student">Students</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-white outline-none transition-colors focus:border-amber-400/40"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </section>

      <section className="glass-v2 border-white/5 overflow-hidden">
        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-amber-400" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead className="border-b border-white/10 bg-black/10 text-xs uppercase tracking-[0.24em] text-gray-500">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((user) => {
                  const busy = savingUserId === user.id || deletingUserId === user.id;
                  return (
                    <tr key={user.id} className="align-top">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="h-12 w-12 rounded-2xl border border-white/10 object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white">{user.name}</p>
                            <p className="truncate text-sm text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <select
                          value={user.role}
                          disabled={busy}
                          onChange={(event) =>
                            updateRole(user.id, event.target.value as AdminUser["role"])
                          }
                          className="rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-amber-400/40 disabled:opacity-50"
                        >
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-5">
                        <select
                          value={user.status}
                          disabled={busy}
                          onChange={(event) =>
                            updateStatus(user.id, event.target.value as AdminUser["status"])
                          }
                          className="rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-amber-400/40 disabled:opacity-50"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-400">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button
                          onClick={() => deleteUser(user.id)}
                          disabled={busy}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
                            busy
                              ? "cursor-not-allowed border-white/10 bg-white/5 text-gray-500"
                              : "border-red-400/20 bg-red-500/10 text-red-200 hover:bg-red-500/20",
                          )}
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SignalCard
          icon={Shield}
          label="Suspended accounts"
          value={statusCounts.suspended}
          tone={statusCounts.suspended > 0 ? "warning" : "stable"}
        />
        <SignalCard
          icon={AlertTriangle}
          label="Inactive accounts"
          value={statusCounts.inactive}
          tone={statusCounts.inactive > 0 ? "warning" : "stable"}
        />
        <SignalCard
          icon={Users}
          label="Filtered results"
          value={filteredUsers.length}
          tone="stable"
        />
      </section>

      {isAddModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-display font-bold text-white">Create user</h2>
                <p className="mt-1 text-sm text-gray-400">
                  This stays inside the admin session and provisions the account directly.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="mt-6 space-y-4">
              <FormField label="Full name">
                <input
                  required
                  value={formData.name}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, name: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-white outline-none transition-colors placeholder:text-gray-500 focus:border-amber-400/40"
                  placeholder="Ada Lovelace"
                />
              </FormField>

              <FormField label="Email address">
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, email: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-white outline-none transition-colors placeholder:text-gray-500 focus:border-amber-400/40"
                  placeholder="ada@lumina.ai"
                />
              </FormField>

              <FormField label="Temporary password">
                <input
                  required
                  type="password"
                  value={formData.password}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, password: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-white outline-none transition-colors placeholder:text-gray-500 focus:border-amber-400/40"
                  placeholder="Choose a secure temporary password"
                />
              </FormField>

              <FormField label="Role">
                <select
                  value={formData.role}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      role: event.target.value as AdminUser["role"],
                    }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-white outline-none transition-colors focus:border-amber-400/40"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </FormField>

              <button
                type="submit"
                disabled={savingUserId === "create"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                {savingUserId === "create" ? "Creating user..." : "Create user"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-300">{label}</span>
      {children}
    </label>
  );
}

function EmptyState() {
  return (
    <div className="p-10 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-gray-400">
        <Users className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold text-white">No users match the current filters</h3>
      <p className="mt-2 text-sm text-gray-400">
        Try widening the search or clearing the role and status filters.
      </p>
    </div>
  );
}

function SignalCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Shield;
  label: string;
  value: number;
  tone: "warning" | "stable";
}) {
  return (
    <div className="glass-v2 border-white/5 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="mt-2 text-3xl font-display font-bold text-white">{value}</p>
        </div>
        <div
          className={cn(
            "rounded-2xl p-3",
            tone === "warning"
              ? "bg-amber-400/10 text-amber-300"
              : "bg-yellow-400/10 text-yellow-300",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

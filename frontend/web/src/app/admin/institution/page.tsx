"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Building2,
  CheckCircle2,
  Link2,
  Loader2,
  MapPin,
  Plus,
  Users,
  X,
} from "lucide-react";

import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface InstitutionRecord {
  id: string;
  institution_name: string;
  institution_type?: string;
  city?: string;
  state?: string;
  onboarding_status?: string;
}

interface ConnectionRecord {
  id: string;
  user_name?: string;
  user_email?: string;
  user_role?: string | null;
  institution_id?: string | null;
  institution_name?: string | null;
  program_name?: string | null;
  category: string;
  created_at?: string | null;
}

const DEFAULT_INSTITUTION = {
  institution_name: "",
  institution_type: "Private",
  city: "",
  state: "",
};

function formatDateTime(value?: string | null) {
  if (!value) return "No timestamp";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "No timestamp";
  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function InstitutionManagementPage() {
  const [institutions, setInstitutions] = useState<InstitutionRecord[]>([]);
  const [connections, setConnections] = useState<ConnectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newInstitution, setNewInstitution] = useState(DEFAULT_INSTITUTION);
  const [savingInstitution, setSavingInstitution] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [institutionRecords, connectionRecords] = await Promise.all([
        api.getInstitutions(),
        api.getConnections(),
      ]);
      setInstitutions(institutionRecords || []);
      setConnections(connectionRecords || []);
    } catch (err: any) {
      console.error("institution_page_load_failed", err);
      setError(err?.message || "Unable to load institutions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const connectionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const connection of connections) {
      const institutionId = connection.institution_id;
      if (!institutionId) continue;
      counts.set(institutionId, (counts.get(institutionId) || 0) + 1);
    }
    return counts;
  }, [connections]);

  const connectedInstitutions = institutions.filter(
    (institution) => (connectionCounts.get(institution.id) || 0) > 0,
  ).length;

  const createInstitution = async () => {
    setSavingInstitution(true);
    setError(null);
    try {
      const response = await api.createInstitution(newInstitution);
      if (response?.detail) {
        throw new Error(response.detail);
      }
      setNewInstitution(DEFAULT_INSTITUTION);
      setShowAddModal(false);
      await load();
    } catch (err: any) {
      setError(err?.message || "Unable to create institution");
    } finally {
      setSavingInstitution(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="glass-v2 border-white/5 overflow-hidden">
        <div className="grid gap-6 p-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(360px,1fr)]">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-lumina-highlight/80">
              Institution Graph
            </p>
            <h1 className="text-4xl font-display font-bold tracking-tight text-white">
              Build the organization layer around the platform.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-gray-300">
              Institutions, stakeholder connections, and onboarding state are now
              visible together, so you can see which tenants are actually wired in.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm font-semibold text-white">Graph snapshot</p>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <SummaryTile label="Institutions" value={institutions.length} />
              <SummaryTile label="Connected" value={connectedInstitutions} />
              <SummaryTile label="Live links" value={connections.length} />
              <SummaryTile
                label="Empty shells"
                value={institutions.length - connectedInstitutions}
              />
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-lumina-primary px-4 py-3 font-semibold text-black transition-colors hover:bg-lumina-secondary shadow-gold-glow"
            >
              <Plus className="h-4 w-4" />
              Add institution
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <ConnectionComposer onCreated={load} />

      <section className="glass-v2 border-white/5 overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-white/5 p-6">
          <div>
            <h2 className="text-xl font-display font-bold text-white">
              Institutions
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Stakeholder counts make it obvious which tenants are connected and which still need setup.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-yellow-400" />
          </div>
        ) : institutions.length === 0 ? (
          <EmptyInstitutions />
        ) : (
          <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
            {institutions.map((institution) => {
              const stakeholderCount = connectionCounts.get(institution.id) || 0;
              return (
                <div
                  key={institution.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
                        {institution.institution_type || "Institution"}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-white">
                        {institution.institution_name}
                      </h3>
                    </div>
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                        stakeholderCount > 0
                          ? "border-lumina-primary/20 bg-lumina-primary/10 text-lumina-primary"
                          : "border-lumina-highlight/20 bg-lumina-highlight/10 text-lumina-highlight"
,
                      )}
                    >
                      {stakeholderCount > 0 ? "Connected" : "Needs links"}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-gray-400">
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      {[institution.city, institution.state].filter(Boolean).join(", ") || "Location pending"}
                    </p>
                    <p className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      {stakeholderCount} stakeholder connection(s)
                    </p>
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                      Onboarding
                    </p>
                    <p className="mt-2 text-sm font-medium text-white">
                      {institution.onboarding_status || "PENDING"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="glass-v2 border-white/5 overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-white/5 p-6">
          <div>
            <h2 className="text-xl font-display font-bold text-white">
              Live connections
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              The most recent user-to-institution links, including role and category.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-yellow-400" />
          </div>
        ) : connections.length === 0 ? (
          <EmptyConnections />
        ) : (
          <div className="space-y-3 p-6">
            {connections.slice(0, 8).map((connection) => (
              <div
                key={connection.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">
                      {connection.user_name || "Unassigned user"}
                    </p>
                    <p className="mt-1 text-sm text-gray-400">
                      {connection.user_email || "No email"} • {connection.user_role || connection.category}
                    </p>
                  </div>
                  <span className="rounded-full border border-lumina-primary/20 bg-lumina-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-lumina-primary">
                    {connection.category}
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-300">
                  {connection.institution_name || "Institution"}{connection.program_name ? ` • ${connection.program_name}` : ""}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Linked {formatDateTime(connection.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {showAddModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-display font-bold text-white">
                  Add institution
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  Create a new tenant shell and then wire stakeholders into it.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <Field label="Institution name">
                <input
                  value={newInstitution.institution_name}
                  onChange={(event) =>
                    setNewInstitution((current) => ({
                      ...current,
                      institution_name: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-white outline-none transition-colors placeholder:text-gray-500 focus:border-yellow-400/40"
                  placeholder="Lumina Academy"
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="City">
                  <input
                    value={newInstitution.city}
                    onChange={(event) =>
                      setNewInstitution((current) => ({
                        ...current,
                        city: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-white outline-none transition-colors placeholder:text-gray-500 focus:border-yellow-400/40"
                    placeholder="Bengaluru"
                  />
                </Field>
                <Field label="State">
                  <input
                    value={newInstitution.state}
                    onChange={(event) =>
                      setNewInstitution((current) => ({
                        ...current,
                        state: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-white outline-none transition-colors placeholder:text-gray-500 focus:border-yellow-400/40"
                    placeholder="Karnataka"
                  />
                </Field>
              </div>

              <Field label="Institution type">
                <select
                  value={newInstitution.institution_type}
                  onChange={(event) =>
                    setNewInstitution((current) => ({
                      ...current,
                      institution_type: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-white outline-none transition-colors focus:border-yellow-400/40"
                >
                  <option value="Private">Private</option>
                  <option value="Government">Government</option>
                  <option value="Trust">Trust</option>
                  <option value="Autonomous">Autonomous</option>
                </select>
              </Field>

              <button
                onClick={createInstitution}
                disabled={savingInstitution || !newInstitution.institution_name.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingInstitution ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {savingInstitution ? "Creating..." : "Create institution"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ConnectionComposer({ onCreated }: { onCreated: () => Promise<void> | void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedInstitution, setSelectedInstitution] = useState("");
  const [category, setCategory] = useState("Teacher");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [userRecords, institutionRecords] = await Promise.all([
          api.getAllUsers(),
          api.getInstitutions(),
        ]);
        setUsers(userRecords || []);
        setInstitutions(institutionRecords || []);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const createConnection = async () => {
    if (!selectedUser || !selectedInstitution) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const user = users.find((item) => item.id === selectedUser);
      const response = await api.linkStakeholder({
        user_id: selectedUser,
        institution_id: selectedInstitution,
        name: user?.name,
        email: user?.email,
        category,
        feedback_enabled: true,
      });
      if (response?.detail) {
        throw new Error(response.detail);
      }
      setMessage("Connection saved");
      setSelectedUser("");
      setSelectedInstitution("");
      await onCreated();
    } catch (err: any) {
      setMessage(err?.message || "Unable to save connection");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="glass-v2 border-white/5 overflow-hidden">
      <div className="border-b border-white/5 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-yellow-500/10 p-3 text-yellow-300">
            <Link2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white">
              Create connection
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Link a user to an institution. Repeated saves update the existing edge instead of duplicating it.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <Field label="User">
          <select
            value={selectedUser}
            onChange={(event) => setSelectedUser(event.target.value)}
            disabled={loading || submitting}
            className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-white outline-none transition-colors focus:border-yellow-400/40 disabled:opacity-60"
          >
            <option value="">Select a user</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.role})
              </option>
            ))}
          </select>
        </Field>

        <Field label="Institution">
          <select
            value={selectedInstitution}
            onChange={(event) => setSelectedInstitution(event.target.value)}
            disabled={loading || submitting}
            className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-white outline-none transition-colors focus:border-yellow-400/40 disabled:opacity-60"
          >
            <option value="">Select an institution</option>
            {institutions.map((institution) => (
              <option key={institution.id} value={institution.id}>
                {institution.institution_name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Category">
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            disabled={loading || submitting}
            className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-white outline-none transition-colors focus:border-yellow-400/40 disabled:opacity-60"
          >
            <option value="Teacher">Teacher</option>
            <option value="Student">Student</option>
            <option value="Admin">Admin</option>
            <option value="Alumni">Alumni</option>
            <option value="Industry">Industry</option>
          </select>
        </Field>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/5 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="text-sm text-gray-400">
          {message ? (
            <span className="inline-flex items-center gap-2 text-yellow-200">
              <CheckCircle2 className="h-4 w-4" />
              {message}
            </span>
          ) : (
            "Use this to connect platform identities to institution tenants for role-aware management."
          )}
        </div>

        <button
          onClick={createConnection}
          disabled={loading || submitting || !selectedUser || !selectedInstitution}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading || submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Link2 className="h-4 w-4" />
          )}
          {submitting ? "Saving..." : "Save connection"}
        </button>
      </div>
    </section>
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

function Field({
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

function EmptyInstitutions() {
  return (
    <div className="p-10 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-gray-400">
        <Building2 className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold text-white">No institutions yet</h3>
      <p className="mt-2 text-sm text-gray-400">
        Add an institution to start building tenant-level connections.
      </p>
    </div>
  );
}

function EmptyConnections() {
  return (
    <div className="p-10 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-gray-400">
        <Link2 className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold text-white">No stakeholder links</h3>
      <p className="mt-2 text-sm text-gray-400">
        Create a connection above to link users into an institution.
      </p>
    </div>
  );
}

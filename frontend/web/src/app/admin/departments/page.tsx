"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Building2, CheckCircle2, Loader2, Plus, Users } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface DepartmentDraft {
  department_name?: string;
  description?: string;
  code?: string;
  teacher_limit?: number | "";
  class_limit?: number | "";
  course_limit?: number | "";
}

export default function AdminDepartmentsPage() {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedInstitution, setSelectedInstitution] = useState<string>("");
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, DepartmentDraft>>({});

  const [newDepartment, setNewDepartment] = useState<DepartmentDraft>({
    department_name: "",
    description: "",
    code: "",
    teacher_limit: "",
    class_limit: "",
    course_limit: "",
  });

  const load = async (instId?: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const instRecords = await api.getInstitutions();
      setInstitutions(instRecords || []);
      const inst = instId || instRecords?.[0]?.id || "";
      setSelectedInstitution(inst);

      if (inst) {
        const [deptRecords, programRecords, userRecords] = await Promise.all([
          api.getDepartments(inst),
          api.getPrograms(inst),
          api.getAllUsers(),
        ]);
        setDepartments(deptRecords || []);
        setPrograms(programRecords || []);
        setUsers(userRecords || []);
      } else {
        setDepartments([]);
        setPrograms([]);
        setUsers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const programCountByDept = useMemo(() => {
    const map = new Map<string, number>();
    programs.forEach((prog) => {
      if (!prog.department_id) return;
      map.set(prog.department_id, (map.get(prog.department_id) || 0) + 1);
    });
    return map;
  }, [programs]);

  const teacherCountByDept = useMemo(() => {
    const map = new Map<string, number>();
    users.forEach((user) => {
      if (!user.department_id || user.role !== "teacher") return;
      map.set(user.department_id, (map.get(user.department_id) || 0) + 1);
    });
    return map;
  }, [users]);

  const hodOptions = useMemo(() => {
    return users.filter((user) => user.role === "teacher" || user.role === "hod");
  }, [users]);

  const handleDraftChange = (deptId: string, patch: DepartmentDraft) => {
    setDrafts((current) => ({
      ...current,
      [deptId]: { ...current[deptId], ...patch },
    }));
  };

  const handleSave = async (deptId: string) => {
    if (!selectedInstitution) return;
    setSaving(true);
    setMessage(null);
    try {
      const payload = drafts[deptId] || {};
      const response = await api.updateDepartment(selectedInstitution, deptId, payload);
      if (response?.detail) throw new Error(response.detail);
      setMessage("Department updated");
      await load(selectedInstitution);
      setDrafts((current) => {
        const next = { ...current };
        delete next[deptId];
        return next;
      });
    } catch (err: any) {
      setMessage(err?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleAssignHod = async (deptId: string, hodId: string) => {
    if (!selectedInstitution || !hodId) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await api.assignHod(selectedInstitution, deptId, hodId);
      if (response?.detail) throw new Error(response.detail);
      setMessage("HOD assigned");
      await load(selectedInstitution);
    } catch (err: any) {
      setMessage(err?.message || "Unable to assign HOD");
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedInstitution || !newDepartment.department_name?.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        department_name: newDepartment.department_name,
        description: newDepartment.description,
        code: newDepartment.code,
        teacher_limit: newDepartment.teacher_limit === "" ? null : newDepartment.teacher_limit,
        class_limit: newDepartment.class_limit === "" ? null : newDepartment.class_limit,
        course_limit: newDepartment.course_limit === "" ? null : newDepartment.course_limit,
      };
      const response = await api.createDepartment(selectedInstitution, payload);
      if (response?.detail) throw new Error(response.detail);
      setNewDepartment({ department_name: "", description: "", code: "", teacher_limit: "", class_limit: "", course_limit: "" });
      setShowAdd(false);
      await load(selectedInstitution);
    } catch (err: any) {
      setMessage(err?.message || "Create failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="glass-v2 border-white/5 p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-lumina-highlight/80">
              Admin Onboarding
            </p>
            <h1 className="mt-3 text-4xl font-display font-bold text-white">
              Department Governance
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-gray-400">
              Define the academic hierarchy, set staffing limits, and assign HODs. This is the control layer that keeps
              departments clean and accountable.
            </p>
            {selectedInstitution && (
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-gray-500">
                {institutions.find((inst) => inst.id === selectedInstitution)?.institution_name || "Primary institution"}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-lumina-highlight px-4 py-2 text-sm font-bold text-black transition-all hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            Add Department
          </button>
        </div>
        {message && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200">
            {message}
          </div>
        )}
      </section>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-yellow-400" />
        </div>
      ) : departments.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center text-gray-400">
          No departments created yet.
        </div>
      ) : (
        <div className="grid gap-6">
          {departments.map((dept) => {
            const draft = drafts[dept.id] || {};
            const teacherCount = teacherCountByDept.get(dept.id) || 0;
            const programCount = programCountByDept.get(dept.id) || 0;
            const hodUser = users.find((u) => u.id === dept.hod_id);
            const limitTeacher = draft.teacher_limit ?? dept.teacher_limit ?? "";
            const limitClass = draft.class_limit ?? dept.class_limit ?? "";
            const limitCourse = draft.course_limit ?? dept.course_limit ?? "";

            return (
              <div key={dept.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <div className="flex flex-wrap items-start justify-between gap-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Department</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">
                      {dept.department_name}
                    </h2>
                    <p className="mt-2 text-sm text-gray-400">{dept.description || "Add a focus statement."}</p>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                    <Users className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Teachers</p>
                      <p className="text-lg font-semibold text-white">{teacherCount}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                    <Building2 className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Programs</p>
                      <p className="text-lg font-semibold text-white">{programCount}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <Field label="Department code">
                    <input
                      value={draft.code ?? dept.code ?? ""}
                      onChange={(event) => handleDraftChange(dept.id, { code: event.target.value })}
                      className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-2 text-white outline-none focus:border-lumina-primary/50"
                      placeholder="CSE"
                    />
                  </Field>
                  <Field label="Teacher limit">
                    <input
                      type="number"
                      value={limitTeacher}
                      onChange={(event) => handleDraftChange(dept.id, { teacher_limit: event.target.value === "" ? "" : Number(event.target.value) })}
                      className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-2 text-white outline-none focus:border-lumina-primary/50"
                      placeholder="No limit"
                    />
                  </Field>
                  <Field label="Class limit">
                    <input
                      type="number"
                      value={limitClass}
                      onChange={(event) => handleDraftChange(dept.id, { class_limit: event.target.value === "" ? "" : Number(event.target.value) })}
                      className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-2 text-white outline-none focus:border-lumina-primary/50"
                      placeholder="No limit"
                    />
                  </Field>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <Field label="Course limit">
                    <input
                      type="number"
                      value={limitCourse}
                      onChange={(event) => handleDraftChange(dept.id, { course_limit: event.target.value === "" ? "" : Number(event.target.value) })}
                      className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-2 text-white outline-none focus:border-lumina-primary/50"
                      placeholder="No limit"
                    />
                  </Field>
                  <Field label="HOD assignment">
                    <select
                      value={dept.hod_id || ""}
                      onChange={(event) => handleAssignHod(dept.id, event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-2 text-white outline-none focus:border-lumina-primary/50"
                    >
                      <option value="">Select HOD</option>
                      {hodOptions.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.role})
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-gray-500">
                      Current: {hodUser?.name || "Unassigned"}
                    </p>
                  </Field>
                  <Field label="Description">
                    <input
                      value={draft.description ?? dept.description ?? ""}
                      onChange={(event) => handleDraftChange(dept.id, { description: event.target.value })}
                      className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-2 text-white outline-none focus:border-lumina-primary/50"
                      placeholder="Focus area"
                    />
                  </Field>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {dept.updated_at ? `Updated ${new Date(dept.updated_at).toLocaleDateString()}` : ""}
                  </div>
                  <button
                    onClick={() => handleSave(dept.id)}
                    disabled={saving}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold",
                      saving
                        ? "bg-white/10 text-gray-400"
                        : "bg-lumina-primary/20 text-lumina-primary hover:bg-lumina-primary/30",
                    )}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Save changes
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-display font-bold text-white">Add Department</h2>
                <p className="mt-1 text-sm text-gray-400">Set limits and ownership upfront.</p>
              </div>
              <button
                onClick={() => setShowAdd(false)}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <Field label="Department name">
                <input
                  value={newDepartment.department_name || ""}
                  onChange={(event) => setNewDepartment((current) => ({ ...current, department_name: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-2 text-white outline-none focus:border-lumina-primary/50"
                  placeholder="Computer Science & Engineering"
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Code">
                  <input
                    value={newDepartment.code || ""}
                    onChange={(event) => setNewDepartment((current) => ({ ...current, code: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-2 text-white outline-none focus:border-lumina-primary/50"
                    placeholder="CSE"
                  />
                </Field>
                <Field label="Teacher limit">
                  <input
                    type="number"
                    value={newDepartment.teacher_limit ?? ""}
                    onChange={(event) => setNewDepartment((current) => ({ ...current, teacher_limit: event.target.value === "" ? "" : Number(event.target.value) }))}
                    className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-2 text-white outline-none focus:border-lumina-primary/50"
                    placeholder="No limit"
                  />
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Class limit">
                  <input
                    type="number"
                    value={newDepartment.class_limit ?? ""}
                    onChange={(event) => setNewDepartment((current) => ({ ...current, class_limit: event.target.value === "" ? "" : Number(event.target.value) }))}
                    className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-2 text-white outline-none focus:border-lumina-primary/50"
                    placeholder="No limit"
                  />
                </Field>
                <Field label="Course limit">
                  <input
                    type="number"
                    value={newDepartment.course_limit ?? ""}
                    onChange={(event) => setNewDepartment((current) => ({ ...current, course_limit: event.target.value === "" ? "" : Number(event.target.value) }))}
                    className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-2 text-white outline-none focus:border-lumina-primary/50"
                    placeholder="No limit"
                  />
                </Field>
              </div>
              <Field label="Description">
                <input
                  value={newDepartment.description || ""}
                  onChange={(event) => setNewDepartment((current) => ({ ...current, description: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-2 text-white outline-none focus:border-lumina-primary/50"
                  placeholder="Department focus"
                />
              </Field>

              <button
                onClick={handleCreate}
                disabled={saving || !newDepartment.department_name?.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-lumina-highlight px-4 py-3 font-semibold text-black transition-all hover:scale-105 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {saving ? "Saving..." : "Create Department"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-300">{label}</span>
      {children}
    </label>
  );
}

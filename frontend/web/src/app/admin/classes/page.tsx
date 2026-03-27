"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, GraduationCap, Loader2, Plus, Users, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ClassDraft {
  class_name?: string;
  section_name?: string;
  batch_name?: string;
  academic_year?: string;
  student_limit?: number | "";
  teacher_limit?: number | "";
}

export default function AdminClassesPage() {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [classSummaries, setClassSummaries] = useState<Record<string, any>>({});
  const [users, setUsers] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [selectedInstitution, setSelectedInstitution] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");

  const [newProgram, setNewProgram] = useState({ name: "", degree: "B.Tech", department_id: "" });
  const [newSemester, setNewSemester] = useState({ title: "", semester_number: 1 });
  const [newClass, setNewClass] = useState<ClassDraft>({
    class_name: "",
    section_name: "",
    batch_name: "",
    academic_year: "",
    student_limit: "",
    teacher_limit: "",
  });

  const [drafts, setDrafts] = useState<Record<string, ClassDraft>>({});

  const load = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const instRecords = await api.getInstitutions();
      setInstitutions(instRecords || []);
      const instId = instRecords?.[0]?.id || "";
      setSelectedInstitution(instId);

      if (instId) {
        const [deptRecords, programRecords, userRecords] = await Promise.all([
          api.getDepartments(instId),
          api.getPrograms(instId),
          api.getAllUsers(),
        ]);
        setDepartments(deptRecords || []);
        setPrograms(programRecords || []);
        setUsers(userRecords || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const refresh = async () => {
      if (!selectedInstitution) return;
      const [deptRecords, programRecords, userRecords] = await Promise.all([
        api.getDepartments(selectedInstitution),
        api.getPrograms(selectedInstitution),
        api.getAllUsers(),
      ]);
      setDepartments(deptRecords || []);
      setPrograms(programRecords || []);
      setUsers(userRecords || []);
    };
    refresh();
  }, [selectedInstitution]);

  const filteredPrograms = useMemo(() => {
    if (!selectedDepartment) return programs;
    return programs.filter((prog) => prog.department_id === selectedDepartment);
  }, [programs, selectedDepartment]);

  useEffect(() => {
    const fetchSemesters = async () => {
      if (!selectedProgram) {
        setSemesters([]);
        setSelectedSemester("");
        return;
      }
      const data = await api.getSemesters(selectedProgram);
      setSemesters(data || []);
    };
    fetchSemesters();
  }, [selectedProgram]);

  useEffect(() => {
    const fetchClasses = async () => {
      if (!selectedProgram || !selectedSemester) {
        setClasses([]);
        setClassSummaries({});
        return;
      }
      const classRecords = await api.getClasses(selectedProgram, selectedSemester);
      setClasses(classRecords || []);
    };
    fetchClasses();
  }, [selectedProgram, selectedSemester]);

  useEffect(() => {
    const fetchSummaries = async () => {
      if (!classes.length) {
        setClassSummaries({});
        return;
      }
      const entries = await Promise.all(
        classes.map(async (cls: any) => [cls.id, await api.getClassSummary(cls.id)]),
      );
      const map: Record<string, any> = {};
      entries.forEach(([id, summary]) => {
        map[id as string] = summary;
      });
      setClassSummaries(map);
    };
    fetchSummaries();
  }, [classes]);

  const handleCreateProgram = async () => {
    if (!selectedInstitution || !newProgram.name.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await api.createProgram(selectedInstitution, {
        program_name: newProgram.name,
        degree: newProgram.degree,
        department_id: newProgram.department_id || selectedDepartment || null,
      });
      if (response?.detail) throw new Error(response.detail);
      setNewProgram({ name: "", degree: "B.Tech", department_id: "" });
      await load();
      setMessage("Program created");
    } catch (err: any) {
      setMessage(err?.message || "Program creation failed");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSemester = async () => {
    if (!selectedProgram) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await api.createSemester(selectedProgram, newSemester);
      if (response?.detail) throw new Error(response.detail);
      setNewSemester({ title: "", semester_number: 1 });
      const data = await api.getSemesters(selectedProgram);
      setSemesters(data || []);
      setMessage("Semester added");
    } catch (err: any) {
      setMessage(err?.message || "Semester creation failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDraftChange = (classId: string, patch: ClassDraft) => {
    setDrafts((current) => ({
      ...current,
      [classId]: { ...current[classId], ...patch },
    }));
  };

  const handleCreateClass = async () => {
    if (!selectedProgram || !selectedSemester) return;
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        program_id: selectedProgram,
        semester_id: selectedSemester,
        department_id: selectedDepartment || "",
        class_name: newClass.class_name || "",
        batch_name: newClass.batch_name || "",
        student_limit: newClass.student_limit === "" ? undefined : Number(newClass.student_limit),
        teacher_limit: newClass.teacher_limit === "" ? undefined : Number(newClass.teacher_limit),
      };
      // Use consolidated admin API
      const response = await api.createAdminClass(payload);
      if (response?.detail) throw new Error(response.detail);
      
      setNewClass({ class_name: "", section_name: "", batch_name: "", academic_year: "", student_limit: "", teacher_limit: "" });
      
      // Refresh list
      const classRecords = await api.getPublicClasses(selectedProgram, selectedSemester);
      setClasses(classRecords || []);
      setMessage("Class created successfully");
    } catch (err: any) {
      setMessage(err?.message || "Class creation failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!window.confirm("Are you sure? This will delete the class and all its associations.")) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await api.deleteAdminClass(classId);
      if (response?.detail) throw new Error(response.detail);
      
      setMessage("Class deleted");
      const classRecords = await api.getPublicClasses(selectedProgram, selectedSemester);
      setClasses(classRecords || []);
    } catch (err: any) {
      setMessage(err?.message || "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateClass = async (classId: string) => {
    // ... existing logic ...
    setSaving(true);
    setMessage(null);
    try {
      const payload = drafts[classId] || {};
      const response = await api.updateClass(classId, payload);
      if (response?.detail) throw new Error(response.detail);
      setMessage("Class updated");
      const classRecords = await api.getPublicClasses(selectedProgram, selectedSemester);
      setClasses(classRecords || []);
    } catch (err: any) {
      setMessage(err?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const teacherMap = useMemo(() => {
    const map = new Map<string, any>();
    users.forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  return (
    <div className="space-y-8">
      <section className="glass-v2 border-white/5 p-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-lumina-highlight/80">
            Admin Onboarding
          </p>
          <h1 className="mt-3 text-4xl font-display font-bold text-white">
            Program & Class Control
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-gray-400">
            Build programs, semesters, and class limits. Track how many teachers and courses are attached to each class.
          </p>
        </div>
        {message && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200">
            {message}
          </div>
        )}
      </section>

      <section className="glass-v2 border-white/5 p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Institution">
            <select
              value={selectedInstitution}
              onChange={(event) => setSelectedInstitution(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-2 text-white outline-none"
            >
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.institution_name || inst.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Department">
            <select
              value={selectedDepartment}
              onChange={(event) => setSelectedDepartment(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-2 text-white outline-none"
            >
              <option value="">All departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.department_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Program">
            <select
              value={selectedProgram}
              onChange={(event) => setSelectedProgram(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-2 text-white outline-none"
            >
              <option value="">Select program</option>
              {filteredPrograms.map((prog) => (
                <option key={prog.id} value={prog.id}>
                  {prog.program_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Semester">
            <select
              value={selectedSemester}
              onChange={(event) => setSelectedSemester(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-2 text-white outline-none"
            >
              <option value="">Select semester</option>
              {semesters.map((sem) => (
                <option key={sem.id} value={sem.id}>
                  {sem.title || `Semester ${sem.semester_number}`}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="glass-v2 border-white/5 p-6">
          <h2 className="text-lg font-display font-semibold text-white">Add Program</h2>
          <p className="mt-1 text-sm text-gray-400">Attach a new program to the selected institution.</p>
          <div className="mt-4 space-y-3">
            <Field label="Program name">
              <input
                value={newProgram.name}
                onChange={(event) => setNewProgram((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-2 text-white outline-none"
                placeholder="B.Tech Computer Science"
              />
            </Field>
            <Field label="Degree">
              <input
                value={newProgram.degree}
                onChange={(event) => setNewProgram((current) => ({ ...current, degree: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-2 text-white outline-none"
                placeholder="B.Tech"
              />
            </Field>
            <Field label="Department">
              <select
                value={newProgram.department_id}
                onChange={(event) => setNewProgram((current) => ({ ...current, department_id: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-2 text-white outline-none"
              >
                <option value="">Use current selection</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.department_name}
                  </option>
                ))}
              </select>
            </Field>
            <button
              onClick={handleCreateProgram}
              disabled={saving || !newProgram.name.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-lumina-highlight px-4 py-3 font-semibold text-black transition-all hover:scale-105 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create program
            </button>
          </div>
        </div>

        <div className="glass-v2 border-white/5 p-6">
          <h2 className="text-lg font-display font-semibold text-white">Add Semester</h2>
          <p className="mt-1 text-sm text-gray-400">Define the term structure for the selected program.</p>
          <div className="mt-4 space-y-3">
            <Field label="Semester number">
              <input
                type="number"
                value={newSemester.semester_number}
                onChange={(event) => setNewSemester((current) => ({ ...current, semester_number: Number(event.target.value) }))}
                className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-2 text-white outline-none"
                min={1}
              />
            </Field>
            <Field label="Title">
              <input
                value={newSemester.title}
                onChange={(event) => setNewSemester((current) => ({ ...current, title: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-2 text-white outline-none"
                placeholder="Semester 1"
              />
            </Field>
            <button
              onClick={handleCreateSemester}
              disabled={saving || !selectedProgram}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-lumina-primary/20 px-4 py-3 font-semibold text-lumina-primary transition-all hover:bg-lumina-primary/30 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add semester
            </button>
          </div>
        </div>

        <div className="glass-v2 border-white/5 p-6">
          <h2 className="text-lg font-display font-semibold text-white">Add Class</h2>
          <p className="mt-1 text-sm text-gray-400">Set the batch + section and capacity limits.</p>
          <div className="mt-4 space-y-3">
            <Field label="Class name">
              <input
                value={newClass.class_name || ""}
                onChange={(event) => setNewClass((current) => ({ ...current, class_name: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-2 text-white outline-none"
                placeholder="CSE-A"
              />
            </Field>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Section">
                <input
                  value={newClass.section_name || ""}
                  onChange={(event) => setNewClass((current) => ({ ...current, section_name: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-2 text-white outline-none"
                  placeholder="A"
                />
              </Field>
              <Field label="Batch">
                <input
                  value={newClass.batch_name || ""}
                  onChange={(event) => setNewClass((current) => ({ ...current, batch_name: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-2 text-white outline-none"
                  placeholder="2023-27"
                />
              </Field>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Academic year">
                <input
                  value={newClass.academic_year || ""}
                  onChange={(event) => setNewClass((current) => ({ ...current, academic_year: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-2 text-white outline-none"
                  placeholder="2023-2027"
                />
              </Field>
              <Field label="Student limit">
                <input
                  type="number"
                  value={newClass.student_limit ?? ""}
                  onChange={(event) => setNewClass((current) => ({ ...current, student_limit: event.target.value === "" ? "" : Number(event.target.value) }))}
                  className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-2 text-white outline-none"
                  placeholder="60"
                />
              </Field>
            </div>
            <Field label="Teacher limit">
              <input
                type="number"
                value={newClass.teacher_limit ?? ""}
                onChange={(event) => setNewClass((current) => ({ ...current, teacher_limit: event.target.value === "" ? "" : Number(event.target.value) }))}
                className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-2 text-white outline-none"
                placeholder="6"
              />
            </Field>
            <button
              onClick={handleCreateClass}
              disabled={saving || !selectedProgram || !selectedSemester}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500/20 px-4 py-3 font-semibold text-emerald-200 transition-all hover:bg-emerald-500/30 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create class
            </button>
          </div>
        </div>
      </section>

      <section className="glass-v2 border-white/5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-semibold text-white">Class Limits & Teacher Load</h2>
        </div>
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-yellow-400" />
          </div>
        ) : classes.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-gray-400">
            Select a program and semester to view classes.
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {classes.map((cls: any) => {
              const summary = classSummaries[cls.id] || {};
              const draft = drafts[cls.id] || {};
              const studentLimit = draft.student_limit ?? cls.student_limit ?? "";
              const teacherLimit = draft.teacher_limit ?? cls.teacher_limit ?? "";

              const teacherCount = summary.teachers_count || 0;
              const studentCount = summary.students_count || 0;
              const overTeacher = teacherLimit !== "" && teacherCount > Number(teacherLimit);
              const overStudent = studentLimit !== "" && studentCount > Number(studentLimit);

              return (
                <div key={cls.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                  <div className="flex flex-wrap items-start justify-between gap-6">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Class</p>
                      <h3 className="mt-2 text-xl font-semibold text-white">
                        {cls.class_name || cls.section_name || "Section"}
                      </h3>
                      <p className="mt-1 text-sm text-gray-400">
                        Batch {cls.batch_name || cls.batch || cls.academic_year || "—"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <StatBadge
                        icon={<Users className="h-4 w-4" />}
                        label="Students"
                        value={studentCount}
                        muted={!overStudent}
                        warning={overStudent}
                      />
                      <StatBadge
                        icon={<GraduationCap className="h-4 w-4" />}
                        label="Teachers"
                        value={teacherCount}
                        muted={!overTeacher}
                        warning={overTeacher}
                      />
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <Field label="Student limit">
                      <input
                        type="number"
                        value={studentLimit}
                        onChange={(event) => handleDraftChange(cls.id, { student_limit: event.target.value === "" ? "" : Number(event.target.value) })}
                        className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-2 text-white outline-none"
                        placeholder="No limit"
                      />
                    </Field>
                    <Field label="Teacher limit">
                      <input
                        type="number"
                        value={teacherLimit}
                        onChange={(event) => handleDraftChange(cls.id, { teacher_limit: event.target.value === "" ? "" : Number(event.target.value) })}
                        className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-2 text-white outline-none"
                        placeholder="No limit"
                      />
                    </Field>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <Field label="Class name">
                      <input
                        value={draft.class_name ?? cls.class_name ?? ""}
                        onChange={(event) => handleDraftChange(cls.id, { class_name: event.target.value })}
                        className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-2 text-white outline-none"
                      />
                    </Field>
                    <Field label="Section">
                      <input
                        value={draft.section_name ?? cls.section_name ?? ""}
                        onChange={(event) => handleDraftChange(cls.id, { section_name: event.target.value })}
                        className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-2 text-white outline-none"
                      />
                    </Field>
                  </div>

                  {summary.assignments?.length ? (
                    <div className="mt-6">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Teacher assignments</p>
                      <div className="mt-3 grid gap-2">
                        {summary.assignments.map((item: any) => {
                          const teacher = teacherMap.get(item.teacher_id);
                          const course = (summary.courses || []).find((c: any) => c.id === item.course_id);
                          const courseName = course?.title || course?.course_name || course?.name || "Course";
                          return (
                            <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-gray-200">
                              <span className="font-semibold text-white">
                                {teacher?.name || "Teacher"}
                              </span>
                              <span className="text-gray-400"> • {courseName}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-400">
                      No teacher assignments yet for this class.
                    </div>
                  )}

                  <div className="mt-6 flex justify-between gap-4">
                    <button
                      onClick={() => handleDeleteClass(cls.id)}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-400/10"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      Delete class
                    </button>
                    <button
                      onClick={() => handleUpdateClass(cls.id)}
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
      </section>
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

function StatBadge({
  icon,
  label,
  value,
  muted,
  warning,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  muted?: boolean;
  warning?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-4 py-2",
        warning
          ? "border-red-500/30 bg-red-500/10 text-red-200"
          : muted
          ? "border-white/10 bg-black/20 text-gray-300"
          : "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
      )}
    >
      <div className="rounded-full bg-black/40 p-2 text-sm">{icon}</div>
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-gray-400">{label}</p>
        <p className="text-lg font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}

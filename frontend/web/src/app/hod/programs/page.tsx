"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  GraduationCap,
  Layers,
  Plus,
  RefreshCw,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";

export default function ProgramManagementPage() {
  const [department, setDepartment] = useState<any | null>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddBatch, setShowAddBatch] = useState(false);

  const [newBatch, setNewBatch] = useState({
    year: new Date().getFullYear().toString(),
    label: `${new Date().getFullYear()}-${new Date().getFullYear() + 4}`,
    sections: "A,B",
    current_semester: "1",
  });

  const fetchData = async (showRefreshState = false) => {
    try {
      if (showRefreshState) setRefreshing(true);

      const hodDepartment = await api.getHodDepartment();
      if (!hodDepartment?.id) {
        throw new Error("No department is linked to this HOD account");
      }

      const [programList, batchList] = await Promise.all([
        api.getHodPrograms(),
        api.listBatches(hodDepartment.id),
      ]);

      setDepartment(hodDepartment);
      setPrograms(Array.isArray(programList) ? programList : []);
      setBatches(Array.isArray(batchList) ? batchList : []);
    } catch (error: any) {
      toast.error(error?.message || "Failed to fetch program data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBatch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!department?.id) {
      toast.error("Department scope is unavailable");
      return;
    }

    try {
      await api.createBatch(department.id, {
        year: Number(newBatch.year),
        label: newBatch.label.trim(),
        sections: newBatch.sections.split(",").map((section) => section.trim()).filter(Boolean),
        current_semester: Number(newBatch.current_semester),
      });

      toast.success("Batch created successfully");
      setShowAddBatch(false);
      await fetchData(true);
    } catch (error: any) {
      toast.error(error?.message || "Failed to create batch");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-6 rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-white">
            <GraduationCap className="h-8 w-8 text-lumina-primary" />
            Program & Batch Management
          </h1>
          <p className="mt-1 font-medium text-gray-400">
            {department?.department_name || "Department"} programs, academic batches, and running semester structure.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-white transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddBatch(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-4 font-black text-black transition-all hover:scale-[1.02]"
          >
            <Plus className="h-5 w-5" />
            New Academic Batch
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="flex items-center gap-5 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lumina-primary/10 text-lumina-primary">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Programs</p>
            <p className="text-2xl font-black text-white">{programs.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-5 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Batches</p>
            <p className="text-2xl font-black text-white">{batches.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-5 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Sections</p>
            <p className="text-2xl font-black text-white">
              {batches.reduce((total, batch) => total + (Array.isArray(batch.sections) ? batch.sections.length : 0), 0)}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-lumina-primary border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white">Academic Programs</h2>
                <p className="text-sm text-gray-400">Programs currently linked to this HOD department.</p>
              </div>
            </div>

            {programs.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 px-6 py-14 text-center text-gray-500">
                No programs are assigned to this department yet.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {programs.map((program) => (
                  <article
                    key={program.id}
                    className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5 transition-all hover:border-white/20 hover:bg-black/30"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full border border-lumina-primary/20 bg-lumina-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-lumina-primary">
                        {program.degree || program.level || "Program"}
                      </span>
                      <span className="font-mono text-xs text-gray-500">{program.code || "N/A"}</span>
                    </div>
                    <h3 className="mt-4 text-xl font-black text-white">
                      {program.program_name || program.name || "Untitled Program"}
                    </h3>
                    <p className="mt-2 text-sm text-gray-400">
                      Department-linked curriculum container for semesters, batches, and course planning.
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
            <div className="mb-6">
              <h2 className="text-xl font-black text-white">Academic Batches</h2>
              <p className="text-sm text-gray-400">Live intake cycles available under the current department scope.</p>
            </div>

            {batches.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 px-6 py-14 text-center text-gray-500">
                No batches configured yet.
              </div>
            ) : (
              <div className="space-y-4">
                {batches.map((batch, index) => (
                  <motion.article
                    key={batch.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-black text-white">{batch.label}</h3>
                        <p className="mt-1 text-xs font-bold uppercase tracking-widest text-gray-500">
                          Intake {batch.year || "N/A"}
                        </p>
                      </div>
                      <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-400">
                        Semester {batch.current_semester || "N/A"}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Sections</p>
                        <p className="mt-2 font-bold text-white">
                          {Array.isArray(batch.sections) && batch.sections.length > 0
                            ? batch.sections.join(", ")
                            : "None"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Type</p>
                        <p className="mt-2 font-bold text-white">
                          {batch.is_lateral ? "Lateral Entry" : "Regular Intake"}
                        </p>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <AnimatePresence>
        {showAddBatch && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddBatch(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl rounded-[2.5rem] border border-white/10 bg-[#0A0A0A] p-10 shadow-2xl"
            >
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-lumina-primary/20 bg-lumina-primary/10">
                  <Plus className="h-7 w-7 text-lumina-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">Configure New Batch</h2>
                  <p className="text-sm font-medium text-gray-500">Create a department-scoped academic intake.</p>
                </div>
              </div>

              <form onSubmit={handleCreateBatch} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="ml-1 text-xs font-bold uppercase tracking-widest text-gray-500">Admission Year</label>
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-medium text-white outline-none transition-all focus:border-lumina-primary"
                      value={newBatch.year}
                      onChange={(event) => setNewBatch((current) => ({ ...current, year: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="ml-1 text-xs font-bold uppercase tracking-widest text-gray-500">Batch Label</label>
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-medium text-white outline-none transition-all focus:border-lumina-primary"
                      value={newBatch.label}
                      onChange={(event) => setNewBatch((current) => ({ ...current, label: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="ml-1 text-xs font-bold uppercase tracking-widest text-gray-500">Sections</label>
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-medium text-white outline-none transition-all focus:border-lumina-primary"
                    placeholder="A, B, C"
                    value={newBatch.sections}
                    onChange={(event) => setNewBatch((current) => ({ ...current, sections: event.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="ml-1 text-xs font-bold uppercase tracking-widest text-gray-500">Initial Semester</label>
                  <select
                    className="w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-medium text-white outline-none transition-all focus:border-lumina-primary"
                    value={newBatch.current_semester}
                    onChange={(event) =>
                      setNewBatch((current) => ({ ...current, current_semester: event.target.value }))
                    }
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                      <option key={semester} value={semester} className="bg-black text-white">
                        Semester {semester}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddBatch(false)}
                    className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-4 font-bold text-gray-400 transition-all hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] rounded-2xl bg-lumina-primary py-4 font-black text-black transition-all hover:scale-[1.02]"
                  >
                    Create Batch
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

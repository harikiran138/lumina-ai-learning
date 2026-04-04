"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { 
  BookOpen, 
  Plus, 
  Search, 
  MoreVertical, 
  User, 
  Layers, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  BookMarked,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function CurriculumMapPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  
  const [newSubject, setNewSubject] = useState({
    code: "",
    name: "",
    credits: "4",
    type: "Theory",
    batch_id: "",
    faculty_id: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const user = await api.getCurrentUser();
      if (user?.deptId) {
        const [subjData, teachData, batchData] = await Promise.all([
          api.listSubjects(user.deptId),
          api.listTeachersByDept(user.deptId),
          api.listBatches(user.deptId)
        ]);
        setSubjects(subjData || []);
        setTeachers(teachData || []);
        setBatches(batchData || []);
      }
    } catch (error: any) {
      toast.error("Failed to fetch curriculum data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.batch_id || !newSubject.name) {
        toast.error("Please fill required fields");
        return;
    }

    setIsAssigning(true);
    try {
        const user = await api.getCurrentUser();
        await api.createSubject(user.deptId, {
            code: newSubject.code,
            name: newSubject.name,
            credits: Number(newSubject.credits),
            type: newSubject.type,
            batch_id: newSubject.batch_id,
            faculty_id: newSubject.faculty_id || null
        });
        toast.success("Subject added and assigned");
        setShowAddSubject(false);
        fetchData();
    } catch (error: any) {
        toast.error(error.message || "Failed to add subject");
    } finally {
        setIsAssigning(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <BookMarked className="w-8 h-8 text-lumina-primary" />
            Curriculum Map
          </h1>
          <p className="text-gray-400 mt-1 font-medium">Map departmental subjects to batches and assign faculty owners.</p>
        </div>
        <button 
          onClick={() => setShowAddSubject(true)}
          className="bg-lumina-primary text-black px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-lg shadow-lumina-primary/20"
        >
          <Plus className="w-5 h-5" />
          ADD SUBJECT
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
             <div className="w-12 h-12 border-4 border-lumina-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-6">
            {batches.map((batch) => {
                const batchSubjects = subjects.filter(s => s.batch_id === batch.id);
                return (
                    <section key={batch.id} className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-sm">
                        <div className="p-8 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-lumina-primary/10 rounded-xl border border-lumina-primary/20">
                                    <Layers className="w-6 h-6 text-lumina-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black">{batch.label}</h2>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Semester {batch.current_semester || "N/A"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-black">{batchSubjects.length} SUBJECTS</p>
                                    <div className="w-24 h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                                        <div className="h-full bg-lumina-primary w-full" />
                                    </div>
                                </div>
                                <button className="p-2 hover:bg-white/10 rounded-xl transition-all">
                                    <ChevronRight className="w-6 h-6 text-gray-400" />
                                </button>
                            </div>
                        </div>

                        <div className="p-4 sm:p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {batchSubjects.length === 0 ? (
                                    <div className="col-span-full py-12 text-center text-gray-500 font-medium border-2 border-dashed border-white/5 rounded-3xl">
                                        No subjects mapped to this batch.
                                    </div>
                                ) : (
                                    batchSubjects.map((subject) => (
                                        <div key={subject.id} className="group bg-white/5 border border-white/5 rounded-2xl p-6 hover:bg-white/[0.08] transition-all hover:border-white/10">
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <span className="px-2 py-0.5 bg-lumina-primary/10 border border-lumina-primary/20 rounded text-[10px] font-black text-lumina-primary uppercase tracking-tighter mb-2 inline-block">
                                                        {subject.code}
                                                    </span>
                                                    <h3 className="text-lg font-black text-white">{subject.name}</h3>
                                                </div>
                                                <div className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreVertical className="w-5 h-5 text-gray-500" />
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden">
                                                        {subject.faculty_id ? (
                                                            <img 
                                                                src={`https://ui-avatars.com/api/?name=${teachers.find(f => f.id === subject.faculty_id)?.full_name || 'T'}&background=random`}
                                                                className="w-full h-full object-cover"
                                                                alt="Teacher"
                                                            />
                                                        ) : (
                                                            <User className="w-4 h-4 text-gray-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 font-black uppercase">Assignee</p>
                                                        <p className="text-sm font-bold text-white">
                                                            {teachers.find(f => f.id === subject.faculty_id)?.full_name || "Unassigned"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-gray-500 font-black uppercase">Credits</p>
                                                    <p className="text-sm font-black text-lumina-primary">{subject.credits}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </section>
                );
            })}
        </div>
      )}

      {/* Add Subject & Assign Faculty Modal */}
      <AnimatePresence>
        {showAddSubject && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddSubject(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-lumina-primary/10 rounded-2xl flex items-center justify-center border border-lumina-primary/20">
                        <BookOpen className="w-7 h-7 text-lumina-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black">Subject Mapping</h2>
                        <p className="text-gray-500 text-sm font-medium">Add a course to curriculum and assign an instructor.</p>
                    </div>
                </div>

                <form onSubmit={handleAddSubject} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Subject Code</label>
                            <input 
                                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-lumina-primary transition-all text-white font-medium shadow-inner" 
                                placeholder="CS101"
                                value={newSubject.code}
                                onChange={e => setNewSubject({...newSubject, code: e.target.value})}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Credits</label>
                            <input 
                                type="number"
                                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-lumina-primary transition-all text-white font-medium" 
                                value={newSubject.credits}
                                onChange={e => setNewSubject({...newSubject, credits: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Subject Name</label>
                        <input 
                            className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-lumina-primary transition-all text-white font-medium" 
                            placeholder="Data Structures & Algorithms"
                            value={newSubject.name}
                            onChange={e => setNewSubject({...newSubject, name: e.target.value})}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Assign to Batch</label>
                            <select 
                                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-lumina-primary transition-all text-white font-medium appearance-none"
                                value={newSubject.batch_id}
                                onChange={e => setNewSubject({...newSubject, batch_id: e.target.value})}
                                required
                            >
                                <option value="" className="bg-black">Select Batch</option>
                                {batches.map(b => (
                                    <option key={b.id} value={b.id} className="bg-black">{b.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Assign Teacher (Optional)</label>
                            <select 
                                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-lumina-primary transition-all text-white font-medium appearance-none"
                                value={newSubject.faculty_id}
                                onChange={e => setNewSubject({...newSubject, faculty_id: e.target.value})}
                            >
                                <option value="" className="bg-black text-gray-500">Unassigned</option>
                                {teachers.map(f => (
                                    <option key={f.id} value={f.id} className="bg-black">{f.full_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className="flex gap-4 pt-4">
                        <button 
                            type="button"
                            onClick={() => setShowAddSubject(false)}
                            className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-gray-400 hover:bg-white/10 transition-all font-display"
                        >
                            CANCEL
                        </button>
                        <button 
                            type="submit"
                            disabled={isAssigning}
                            className="flex-[2] py-4 bg-lumina-primary text-black font-black rounded-2xl hover:scale-[1.02] transition-all shadow-lg shadow-lumina-primary/20 disabled:opacity-50"
                        >
                            {isAssigning ? "PROCESSING..." : "CONFIRM ASSIGNMENT"}
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

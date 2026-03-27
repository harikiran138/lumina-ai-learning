"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { 
  GraduationCap, 
  Plus, 
  Calendar, 
  Users, 
  LayoutGrid, 
  ChevronRight, 
  Settings2,
  MoreVertical,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function ProgramManagementPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddBatch, setShowAddBatch] = useState(false);
  
  const [newBatch, setNewBatch] = useState({
    year: new Date().getFullYear().toString(),
    label: `${new Date().getFullYear()}-${new Date().getFullYear()+4}`,
    sections: "A,B",
    current_semester: "1"
  });

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const user = await api.getCurrentUser();
      if (user?.deptId) {
        const data = await api.listBatches(user.deptId);
        setBatches(data || []);
      }
    } catch (error: any) {
      toast.error("Failed to fetch batches");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await api.getCurrentUser();
      await api.createBatch(user.deptId, {
        year: Number(newBatch.year),
        label: newBatch.label,
        sections: newBatch.sections.split(",").map(s => s.trim()).filter(Boolean),
        current_semester: Number(newBatch.current_semester)
      });
      toast.success("Batch created successfully");
      setShowAddBatch(false);
      fetchBatches();
    } catch (error: any) {
      toast.error(error.message || "Failed to create batch");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-lumina-primary" />
            Program Management
          </h1>
          <p className="text-gray-400 mt-1 font-medium">Define academic batches, intake years, and curriculum cycles.</p>
        </div>
        <button 
          onClick={() => setShowAddBatch(true)}
          className="bg-white text-black px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
        >
          <Plus className="w-5 h-5" />
          NEW ACADEMIC BATCH
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
             <div className="w-12 h-12 border-4 border-lumina-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map((batch, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={batch.id} 
              className="group bg-white/5 border border-white/10 rounded-[2rem] p-8 hover:bg-white/[0.08] transition-all hover:border-lumina-primary/30 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 hover:bg-white/10 rounded-xl">
                        <MoreVertical className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-lumina-primary/10 rounded-2xl flex items-center justify-center border border-lumina-primary/20">
                        <Calendar className="w-7 h-7 text-lumina-primary" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black">{batch.label}</h3>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Intake: {batch.year}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                        <p className="text-[10px] text-gray-500 font-black uppercase mb-1">Semester</p>
                        <p className="text-xl font-black text-white">{batch.current_semester || "N/A"}</p>
                    </div>
                    <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                        <p className="text-[10px] text-gray-500 font-black uppercase mb-1">Sections</p>
                        <p className="text-xl font-black text-white">{batch.sections?.length || 0}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                        <Users className="w-4 h-4" />
                        <span className="font-bold">240 Students</span>
                    </div>
                    <button className="flex items-center gap-1 text-lumina-primary font-black hover:gap-2 transition-all">
                        VIEW DETAILS <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Batch Modal */}
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
              className="relative w-full max-w-xl bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl"
            >
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-lumina-primary/10 rounded-2xl flex items-center justify-center border border-lumina-primary/20">
                        <Plus className="w-7 h-7 text-lumina-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black">Configure New Batch</h2>
                        <p className="text-gray-500 text-sm font-medium">Set academic boundaries for the incoming intake.</p>
                    </div>
                </div>

                <form onSubmit={handleCreateBatch} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Admission Year</label>
                            <input 
                                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-lumina-primary transition-all text-white font-medium" 
                                value={newBatch.year}
                                onChange={e => setNewBatch({...newBatch, year: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Batch Label</label>
                            <input 
                                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-lumina-primary transition-all text-white font-medium" 
                                value={newBatch.label}
                                onChange={e => setNewBatch({...newBatch, label: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Sections (comma separated)</label>
                        <input 
                            className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-lumina-primary transition-all text-white font-medium" 
                            placeholder="A, B, C, D"
                            value={newBatch.sections}
                            onChange={e => setNewBatch({...newBatch, sections: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Initial Semester</label>
                        <select 
                            className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-lumina-primary transition-all text-white font-medium appearance-none"
                            value={newBatch.current_semester}
                            onChange={e => setNewBatch({...newBatch, current_semester: e.target.value})}
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                <option key={s} value={s} className="bg-black text-white">Semester {s}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="flex gap-4 pt-4">
                        <button 
                            type="button"
                            onClick={() => setShowAddBatch(false)}
                            className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-gray-400 hover:bg-white/10 transition-all font-display"
                        >
                            CANCEL
                        </button>
                        <button 
                            type="submit"
                            className="flex-[2] py-4 bg-lumina-primary text-black font-black rounded-2xl hover:scale-[1.02] transition-all shadow-lg shadow-lumina-primary/20"
                        >
                            CREATE BATCH
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

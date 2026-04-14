"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreVertical, 
  Mail, 
  Shield, 
  CheckCircle2, 
  Clock, 
  Filter,
  ArrowUpDown,
  Trash2,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function TeacherManagementPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const user = await api.getCurrentUser();
      if (user?.deptId) {
        const data = await api.listTeachersByDept(user.deptId);
        setTeachers(data || []);
      }
    } catch (error: any) {
      toast.error("Failed to fetch teacher list");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    
    setIsInviting(true);
    try {
      const user = await api.getCurrentUser();
      await api.inviteUser(user.collegeId, {
        email: inviteEmail,
        role: "teacher",
        deptId: user.deptId
      });
      toast.success(`Invitation sent to ${inviteEmail}`);
      setShowInviteModal(false);
      setInviteEmail("");
      fetchTeachers(); // Refresh list to show pending
    } catch (error: any) {
      toast.error(error.message || "Failed to send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  const filteredTeachers = teachers.filter(f => 
    f.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-lumina-primary" />
            Teacher Directory
          </h1>
          <p className="text-gray-400 mt-1 font-medium">Manage departmental staff, workloads, and system access.</p>
        </div>
        <button 
          onClick={() => setShowInviteModal(true)}
          className="bg-lumina-primary text-black px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-lg shadow-lumina-primary/20 active:scale-95"
        >
          <UserPlus className="w-5 h-5" />
          INVITE TEACHER
        </button>
      </div>

      {/* Stats Quick Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Active Teachers", val: teachers.filter(f => f.is_active).length, icon: CheckCircle2, color: "text-green-400" },
          { label: "Pending Invites", val: teachers.filter(f => !f.is_active).length, icon: Clock, color: "text-amber-400" },
          { label: "Total Strength", val: teachers.length, icon: Shield, color: "text-lumina-primary" }
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-5">
            <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black">{stat.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden backdrop-blur-xl">
        <div className="p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative group flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-lumina-primary transition-colors" />
                <input 
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-lumina-primary transition-all text-sm font-medium"
                />
            </div>
            <div className="flex items-center gap-3">
                <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all">
                    <Filter className="w-5 h-5" />
                </button>
                <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all">
                    <ArrowUpDown className="w-5 h-5" />
                </button>
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Teacher Member</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Specialization</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Load</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {loading ? (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500 animate-pulse">Loading directory...</td>
                        </tr>
                    ) : filteredTeachers.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No teachers found.</td>
                        </tr>
                    ) : (
                        filteredTeachers.map((item) => (
                            <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-lumina-primary/10 border border-lumina-primary/20 flex items-center justify-center text-lumina-primary font-bold">
                                            {item.full_name?.charAt(0) || "F"}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">{item.full_name || "Pending Account"}</p>
                                            <p className="text-xs text-gray-500 font-medium">{item.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-gray-300">
                                        {item.specialization || "Unassigned"}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {item.is_active ? (
                                        <span className="flex items-center gap-1.5 text-xs font-bold text-green-400">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                                            <Clock className="w-3.5 h-3.5" /> PENDING
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm font-bold text-white">4 Subjects</p>
                                    <div className="w-24 h-1.5 bg-white/5 rounded-full mt-1 overflow-hidden">
                                        <div className="h-full bg-lumina-primary w-[70%]" />
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all">
                                            <ExternalLink className="w-4 h-4" />
                                        </button>
                                        <button className="p-2 hover:bg-red-500/10 rounded-lg text-red-400 transition-all">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-all">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Invitation Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInviteModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl"
            >
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-lumina-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-lumina-primary/20">
                        <Mail className="w-10 h-10 text-lumina-primary" />
                    </div>
                    <h2 className="text-3xl font-black text-white">Invite Teacher</h2>
                    <p className="text-gray-400 mt-2 font-medium leading-relaxed">
                        Send a secure access token to a teacher. They will be prompted to set up their profile.
                    </p>
                </div>

                <form onSubmit={handleInvite} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
                        <input 
                            autoFocus
                            type="email" 
                            required
                            placeholder="faculty.member@lumina.edu"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-lumina-primary transition-all text-white font-medium"
                        />
                    </div>
                    
                    <div className="flex gap-4">
                        <button 
                            type="button"
                            onClick={() => setShowInviteModal(false)}
                            className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-gray-400 hover:bg-white/10 transition-all"
                        >
                            CANCEL
                        </button>
                        <button 
                            type="submit"
                            disabled={isInviting}
                            className="flex-[2] py-4 bg-lumina-primary text-black font-black rounded-2xl hover:scale-[1.02] transition-all shadow-lg shadow-lumina-primary/20 disabled:opacity-50"
                        >
                            {isInviting ? "SENDING..." : "SEND INVITATION"}
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

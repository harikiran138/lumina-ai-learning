"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Plus, User, Building, Landmark, Link, Check, Search, Filter } from "lucide-react";

export default function ConnectionCreator() {
  const [users, setUsers] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedInstitution, setSelectedInstitution] = useState<string>("");
  const [category, setCategory] = useState<string>("Student");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [u, i] = await Promise.all([
      api.getAllUsers(),
      api.getInstitutions()
    ]);
    setUsers(u);
    setInstitutions(i);
  };

  const handleConnect = async () => {
    if (!selectedUser || !selectedInstitution) return;
    
    setLoading(true);
    try {
      const user = users.find(u => u.id === selectedUser);
      await api.linkStakeholder({
        user_id: selectedUser,
        institution_id: selectedInstitution,
        name: user.name,
        email: user.email,
        category: category,
        feedback_enabled: true
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Connection failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
          <Link className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            Connect Thing Creator
          </h2>
          <p className="text-white/40">Link users to institutions with premium intelligence</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* User Selection */}
        <div className="space-y-4">
          <label className="text-sm font-medium text-white/60 flex items-center gap-2">
            <User className="w-4 h-4" /> Select User
          </label>
          <div className="relative group">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all hover:bg-white/10"
            >
              <option value="" className="bg-slate-900">Choose a colleague...</option>
              {users.map(u => (
                <option key={u.id} value={u.id} className="bg-slate-900">
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Institution Selection */}
        <div className="space-y-4">
          <label className="text-sm font-medium text-white/60 flex items-center gap-2">
            <Building className="w-4 h-4" /> Select Institution
          </label>
          <div className="relative group">
            <select
              value={selectedInstitution}
              onChange={(e) => setSelectedInstitution(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all hover:bg-white/10"
            >
              <option value="" className="bg-slate-900">Select target institution...</option>
              {institutions.map(i => (
                <option key={i.id} value={i.id} className="bg-slate-900">
                  {i.institution_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Selection */}
        <div className="space-y-4">
          <label className="text-sm font-medium text-white/60 flex items-center gap-2">
            <Filter className="w-4 h-4" /> Access Level / Role
          </label>
          <div className="flex flex-wrap gap-2">
            {["Student", "Teacher", "Admin", "Alumni", "Industry"].map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  category === cat
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                    : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12">
        <button
          onClick={handleConnect}
          disabled={loading || !selectedUser || !selectedInstitution}
          className={`w-full relative overflow-hidden group py-4 rounded-2xl font-bold text-lg transition-all ${
            success
              ? "bg-emerald-500 text-white"
              : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40"
          } ${(loading || !selectedUser || !selectedInstitution) ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <div className="relative z-10 flex items-center justify-center gap-3">
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : success ? (
              <>
                <Check className="w-6 h-6" /> Success! Connection Created
              </>
            ) : (
              <>
                <Plus className="w-6 h-6" /> Establish Connection
              </>
            )}
          </div>
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </button>
      </div>

      <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between text-white/30 text-xs">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /> Verified Node</span>
          <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /> RLS Protected</span>
        </div>
        <span>Lumina Multi-Agent Network v2.0</span>
      </div>
    </div>
  );
}

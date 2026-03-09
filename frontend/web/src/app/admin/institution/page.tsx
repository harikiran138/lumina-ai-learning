"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import ConnectionCreator from "@/components/admin/ConnectionCreator";
import { Building, Plus, GraduationCap, Users, MapPin, Globe, ChevronRight, LayoutDashboard } from "lucide-react";

export default function InstitutionManagementPage() {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newInst, setNewInst] = useState({
    institution_name: "",
    institution_type: "Private",
    city: "",
    state: "",
  });

  useEffect(() => {
    loadInstitutions();
  }, []);

  const loadInstitutions = async () => {
    const data = await api.getInstitutions();
    setInstitutions(data);
  };

  const handleCreate = async () => {
    await api.createInstitution(newInst);
    setShowAddModal(false);
    loadInstitutions();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-5xl font-extrabold tracking-tight mb-2">
              Institutional <span className="text-indigo-500">Intelligence</span>
            </h1>
            <p className="text-white/40 text-lg">Manage multi-tenant structures and knowledge nodes</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-white text-slate-950 px-6 py-3 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
          >
            <Plus className="w-5 h-5" /> Add Institution
          </button>
        </div>

        {/* Connection Creator Section */}
        <section>
          <ConnectionCreator />
        </section>

        {/* Institutions Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Building className="w-6 h-6 text-indigo-400" /> Active Institutions
            </h2>
            <div className="text-white/30 text-sm">Showing {institutions.length} nodes</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {institutions.map((inst) => (
              <div
                key={inst.id}
                className="group relative p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/[0.08] transition-all hover:border-indigo-500/50"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-indigo-500/10 rounded-2xl">
                    <Landmark className="w-6 h-6 text-indigo-400" />
                  </div>
                  <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold tracking-widest uppercase text-white/40">
                    {inst.institution_type}
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-2 group-hover:text-indigo-400 transition-colors">
                  {inst.institution_name}
                </h3>
                
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-white/40 text-sm">
                    <MapPin className="w-4 h-4" /> {inst.city}, {inst.state}
                  </div>
                  <div className="flex items-center gap-2 text-white/40 text-sm">
                    <Users className="w-4 h-4" /> 0 Registered Stakeholders
                  </div>
                </div>

                <button className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all">
                  Manage Institution <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}

            {institutions.length === 0 && (
              <div className="col-span-full py-20 bg-white/5 border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-white/20">
                <Building className="w-12 h-12 mb-4 opacity-20" />
                <p>No institutions registered yet</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Add Modal Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Register Institution</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Institution Name"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white"
                value={newInst.institution_name}
                onChange={e => setNewInst({...newInst, institution_name: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="City"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white"
                  value={newInst.city}
                  onChange={e => setNewInst({...newInst, city: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="State"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white"
                  value={newInst.state}
                  onChange={e => setNewInst({...newInst, state: e.target.value})}
                />
              </div>
              <button
                onClick={handleCreate}
                className="w-full bg-indigo-600 py-4 rounded-xl font-bold mt-4"
              >
                Onboard Node
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-full text-white/40 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Landmark({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <line x1="3" y1="22" x2="21" y2="22"></line>
      <line x1="6" y1="18" x2="6" y2="11"></line>
      <line x1="10" y1="18" x2="10" y2="11"></line>
      <line x1="14" y1="18" x2="14" y2="11"></line>
      <line x1="18" y1="18" x2="18" y2="11"></line>
      <polygon points="12 2 3 7 3 11 21 11 21 7 12 2"></polygon>
    </svg>
  );
}

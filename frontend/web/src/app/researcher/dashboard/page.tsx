"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Beaker, 
  Database, 
  ShieldCheck, 
  Search, 
  Filter, 
  FileJson, 
  BarChart3, 
  ChevronRight, 
  Lock, 
  Eye, 
  EyeOff, 
  History, 
  Zap, 
  Info,
  Activity,
  Network,
  Share2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import Link from 'next/link';

const GlassCard: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    className={cn(
      'rounded-3xl border border-white/5 bg-white/[0.03] backdrop-blur-2xl shadow-premium overflow-hidden',
      className
    )}
  >
    {children}
  </motion.div>
);

const kAnonymityData = [
  { name: 'Cohort A', k: 8 },
  { name: 'Cohort B', k: 12 },
  { name: 'Cohort C', k: 5 },
  { name: 'Cohort D', k: 15 },
  { name: 'Cohort E', k: 10 }
];

export default function ResearcherDashboard() {
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSnapshots = async () => {
      try {
        const s = await api.getAnonymizedSnapshots();
        setSnapshots(s);
      } catch (err) {
        console.error("Error fetching snapshots:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSnapshots();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 rounded-2xl bg-lumina-highlight/10 border border-lumina-highlight/20 flex items-center justify-center">
              <Beaker className="w-8 h-8 text-lumina-highlight" />
           </div>
           <div>
              <h1 className="text-3xl font-display font-bold text-white tracking-tight lowercase">
                Research <span className="gradient-text">Lab</span>
              </h1>
              <p className="text-gray-400 mt-1 font-medium italic text-xs uppercase tracking-widest">Ethical Data Insight & K-Anonymity Verified Environment</p>
           </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all font-bold text-sm uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4 text-lumina-highlight" /> Ethics Audit
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-lumina-highlight text-black font-bold text-sm hover:scale-105 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <Search className="w-4 h-4" /> New Query
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           {/* K-Anonymity Status */}
           <GlassCard className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-lumina-highlight/10">
                    <Network className="w-6 h-6 text-lumina-highlight" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white lowercase tracking-tighter">Cohort Anonymity</h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">K-Value Verification across active datasets</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold uppercase">
                   <ShieldCheck className="w-4 h-4" /> Secure
                </div>
              </div>

              <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={kAnonymityData}>
                       <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                       <XAxis dataKey="name" stroke="#ffffff30" fontSize={10} axisLine={false} tickLine={false} />
                       <YAxis stroke="#ffffff30" fontSize={10} axisLine={false} tickLine={false} />
                       <Tooltip 
                         cursor={{fill: '#ffffff05'}}
                         contentStyle={{backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px'}}
                       />
                       <Bar dataKey="k" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
              <div className="mt-8 flex items-center gap-3 p-4 rounded-2xl bg-lumina-highlight/5 border border-lumina-highlight/10">
                 <Info className="w-4 h-4 text-lumina-highlight shrink-0" />
                 <p className="text-[10px] text-gray-500 font-medium italic leading-relaxed">
                   Current policy requires <span className="text-white font-bold">k ≥ 5</span> for all exported snapshots. All active cohorts currently meet or exceed this requirement.
                 </p>
              </div>
           </GlassCard>

           {/* Dataset Snapshots */}
           <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                 <h2 className="text-2xl font-bold text-white lowercase tracking-tighter">Available Snapshots</h2>
                 <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Active Archives: 24</span>
              </div>

              <div className="space-y-4">
                 {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-32 bg-white/5 rounded-3xl animate-pulse"></div>)
                 ) : snapshots.length > 0 ? (
                    snapshots.map((snap, idx) => (
                      <GlassCard key={idx} className="p-6 group hover:border-lumina-highlight/20 transition-all cursor-pointer">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                               <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                                  <FileJson className="w-6 h-6 text-gray-500 group-hover:text-lumina-highlight transition-colors" />
                               </div>
                               <div>
                                  <h4 className="text-lg font-bold text-white lowercase tracking-tighter mb-1 truncate">{snap.name || "Snapshot_2024_Q1"}</h4>
                                  <div className="flex items-center gap-4">
                                     <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{snap.size || "124MB"} CSV</span>
                                     <span className="text-[10px] text-gray-700 font-bold uppercase tracking-widest">•</span>
                                     <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">P-Value Verified</span>
                                  </div>
                               </div>
                            </div>
                            <div className="flex items-center gap-3">
                               <button className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-gray-600 hover:text-white transition-all">
                                  <Share2 className="w-4 h-4" />
                               </button>
                               <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-lumina-highlight text-black font-bold text-[10px] hover:scale-105 transition-all shadow-lg shadow-lumina-highlight/20 uppercase tracking-widest">
                                  Process Query
                               </button>
                            </div>
                         </div>
                      </GlassCard>
                    ))
                 ) : (
                    <div className="py-12 text-center opacity-30 italic font-display text-gray-500 border-2 border-dashed border-white/5 rounded-3xl">No research snapshots detected.</div>
                 )}
              </div>
           </div>
        </div>

        {/* Researcher Sidebar */}
        <div className="space-y-8">
           <GlassCard className="p-8 bg-gradient-to-br from-lumina-highlight/10 to-transparent">
              <h3 className="text-2xl font-bold text-white lowercase tracking-tighter mb-8">Snapshot Builder</h3>
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Population Filter</label>
                    <select className="w-full px-4 py-3 rounded-xl glass-v2 border-white/10 text-white text-[10px] font-bold appearance-none">
                       <option>Computer Science Core</option>
                       <option>Undergraduate Wellness</option>
                       <option>Global Peer Network</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Anonymization Level</label>
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold mb-1">
                       <span>k=1</span>
                       <span>k=20</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden relative">
                       <div className="h-full bg-gold-500 w-[60%] shadow-premium"></div>
                       <div className="absolute top-1/2 left-[60%] -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-gold-500 shadow-xl"></div>
                    </div>
                    <p className="text-[9px] text-gold-400 font-bold mt-2 uppercase tracking-widest text-right">Target k=12</p>
                 </div>
                 <button className="w-full py-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all group">
                    Schedule Generation <ChevronRight className="w-4 h-4 inline ml-1 group-hover:translate-x-1 transition-transform" />
                 </button>
              </div>
           </GlassCard>

           <GlassCard className="p-8">
              <div className="flex items-center gap-3 mb-6">
                 <History className="w-5 h-5 text-yellow-400" />
                 <h4 className="font-bold text-white text-xs uppercase tracking-widest">Recent Queries</h4>
              </div>
              <ul className="space-y-5">
                 {[
                   'Average sentiment per subject cohort',
                   'Peer tutor credit-to-outcome ratio',
                   'Engagement vs burnout markers y3'
                 ].map((query, i) => (
                    <li key={i} className="flex items-start gap-3 group cursor-pointer">
                       <Zap className="w-3.5 h-3.5 text-gray-700 group-hover:text-gold-400 shrink-0 mt-0.5" />
                       <span className="text-[11px] text-gray-500 group-hover:text-white transition-colors font-medium leading-tight italic line-clamp-2">{query}</span>
                    </li>
                 ))}
              </ul>
           </GlassCard>

           <GlassCard className="p-8 border-l-4 border-lumina-highlight/30">
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Ethical Reminder</h4>
              <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                 All data exports are strictly controlled. Any attempt to de-anonymize student data will be logged and may result in immediate revocation of research privileges.
              </p>
           </GlassCard>
        </div>
      </div>
    </div>
  );
}

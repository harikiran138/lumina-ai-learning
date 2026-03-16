"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  Search, 
  Filter, 
  Download, 
  FileJson, 
  Table as TableIcon, 
  ChevronRight, 
  Lock, 
  ShieldCheck,
  History,
  Archive,
  BarChart3,
  ExternalLink,
  MoreVertical,
  Info,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

const GlassCard: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn(
      'rounded-3xl border border-white/5 bg-white/[0.03] backdrop-blur-2xl shadow-premium overflow-hidden',
      className
    )}
  >
    {children}
  </motion.div>
);

export default function DatasetExplorer() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        // Simulating datasets for research
        setTimeout(() => {
          setDatasets([
            { id: 'DS-001', name: 'Global Engagement Metrics 2025', size: '4.2GB', rows: '1.2M', entropy: '0.94', status: 'verified' },
            { id: 'DS-002', name: 'STEM Peer Tutoring Outcomes', size: '150MB', rows: '450k', entropy: '0.82', status: 'verified' },
            { id: 'DS-003', name: 'Implicit Bias Anonymized Survey', size: '24MB', rows: '50k', entropy: '0.75', status: 'locked' }
          ]);
          setLoading(false);
        }, 800);
      } catch (err) {
        console.error("Error fetching datasets:", err);
      }
    };
    fetchDatasets();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            Dataset <span className="gradient-text">Explorer</span>
          </h1>
          <p className="text-gray-400 mt-1 font-medium italic">Discover and analyze k-anonymized learning repositories</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all font-bold text-sm uppercase tracking-widest">
            <Archive className="w-4 h-4" /> Request Archive
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              <input 
                type="text" 
                placeholder="Search datasets..." 
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl glass-v2 border-white/10 text-sm text-white focus:outline-none focus:border-gold-500/50 transition-all font-medium shadow-inner"
              />
           </div>

           <GlassCard className="p-8">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-6">Discovery Filters</h3>
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1">Domain</label>
                    <div className="flex flex-wrap gap-2">
                       {['STEM', 'Humanities', 'Wellness', 'System'].map(d => (
                         <button key={d} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-gray-500 hover:text-white transition-all">{d}</button>
                       ))}
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1">Verification</label>
                    <div className="space-y-2">
                       {['P-Value Verified', 'Entropy Audited', 'Differentially Private'].map(v => (
                          <label key={v} className="flex items-center gap-3 cursor-pointer group">
                             <div className="w-4 h-4 rounded border border-white/10 bg-white/5 flex items-center justify-center group-hover:border-gold-500 transition-all">
                                <div className="w-2 h-2 rounded-sm bg-gold-500 opacity-0 group-hover:opacity-40 transition-opacity"></div>
                             </div>
                             <span className="text-[10px] text-gray-500 group-hover:text-gray-300 font-bold uppercase tracking-widest">{v}</span>
                          </label>
                       ))}
                    </div>
                 </div>
              </div>
           </GlassCard>

           <div className="p-6 rounded-3xl border border-gold-500/10 bg-gold-500/[0.02] flex items-center gap-4">
              <ShieldCheck className="w-6 h-6 text-gold-400" />
              <div>
                 <p className="text-[10px] text-white font-bold uppercase tracking-widest leading-none">Safe Environment</p>
                 <p className="text-[9px] text-gray-500 mt-1">Research token active</p>
              </div>
           </div>
        </div>

        {/* Datasets List */}
        <div className="lg:col-span-3 space-y-4">
           {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-40 bg-white/5 rounded-3xl animate-pulse"></div>)
           ) : datasets.length > 0 ? (
             datasets.map((ds) => (
               <GlassCard key={ds.id} className="p-8 group hover:border-gold-500/20 transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                     <div className="flex items-start gap-6">
                        <div className={cn(
                          "w-16 h-16 rounded-2xl border flex items-center justify-center shrink-0 shadow-premium",
                          ds.status === 'verified' ? "bg-gold-500/10 text-gold-400 border-gold-500/20" : "bg-white/5 text-gray-600 border-white/10"
                        )}>
                           <Database className="w-8 h-8" />
                        </div>
                        <div>
                           <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-2xl font-bold text-white lowercase tracking-tighter transition-all group-hover:gradient-text">{ds.name}</h3>
                              <span className="px-2 py-0.5 rounded-lg bg-white/5 text-[9px] text-gray-600 font-bold uppercase tracking-widest">{ds.id}</span>
                           </div>
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                              <div>
                                 <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-0.5">Size</p>
                                 <p className="text-xs font-bold text-white">{ds.size}</p>
                              </div>
                              <div>
                                 <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-0.5">Entropy</p>
                                 <p className="text-xs font-bold text-white">{ds.entropy}</p>
                              </div>
                              <div>
                                 <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-0.5">Records</p>
                                 <p className="text-xs font-bold text-white">{ds.rows}</p>
                              </div>
                              <div>
                                 <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-0.5">Stat Verification</p>
                                 <div className="flex items-center gap-1 text-gold-500">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span className="text-[9px] font-bold uppercase">Passed</span>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="flex items-center gap-3">
                        <button className="p-3 rounded-2xl bg-white/5 border border-white/5 text-gray-600 hover:text-white transition-all">
                           <ExternalLink className="w-5 h-5" />
                        </button>
                        <button className={cn(
                          "px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all",
                          ds.status === 'verified' ? "bg-gold-600 text-white shadow-lg shadow-gold-600/20 hover:scale-105" : "bg-white/5 text-gray-600 cursor-not-allowed"
                        )}>
                           {ds.status === 'verified' ? 'Explore Data' : 'Locked'}
                        </button>
                     </div>
                  </div>
               </GlassCard>
             ))
           ) : (
             <div className="h-64 flex flex-col items-center justify-center glass-v2 rounded-3xl opacity-30 italic text-gray-500">No matching datasets available for exploration.</div>
           )}
        </div>
      </div>

      {/* Lab Tips Section */}
      <GlassCard className="p-10 bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent flex flex-col md:flex-row items-center gap-10">
         <div className="p-5 rounded-3xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
            <Info className="w-10 h-10" />
         </div>
         <div className="flex-1">
            <h4 className="text-xl font-bold text-white mb-2 lowercase tracking-tighter">Researcher Guidelines</h4>
            <p className="text-sm text-gray-400 font-medium leading-relaxed italic">
               Lumina datasets are k-anonymized at source using our nightly snapshot builder. If you require higher granularity data for a specific thesis, please submit an Identity Access (IA) request to the Administrative Ethics Committee.
            </p>
         </div>
         <button className="px-8 py-4 rounded-3xl bg-white/5 border border-white/10 text-white font-bold text-xs uppercase tracking-[0.2em] hover:bg-white/10 transition-all">
            Ethics Protocol
         </button>
      </GlassCard>
    </div>
  );
}

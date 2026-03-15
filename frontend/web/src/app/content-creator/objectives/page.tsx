"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, 
  Plus, 
  ChevronRight, 
  Search, 
  Trophy, 
  Zap, 
  BookOpen, 
  Brain,
  CheckCircle2,
  MoreVertical,
  History,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

export default function LearningObjectives() {
  const [objectives, setObjectives] = useState([
    { id: '1', title: 'Gradient Descent Convergence', level: 'Advanced', mapping: 'L4.2', status: 'verified' },
    { id: '2', title: 'Hyperparameter Tuning Analytics', level: 'Intermediate', mapping: 'L3.8', status: 'verified' },
    { id: '3', title: 'Attention Mechanism Logic', level: 'Advanced', mapping: 'L5.1', status: 'draft' }
  ]);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            Learning <span className="gradient-text">Objectives</span>
          </h1>
          <p className="text-gray-400 mt-1 font-medium italic">Defining the measurable outcomes of your learning architecture</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all font-bold text-sm uppercase tracking-widest">
            <History className="w-4 h-4" /> Revision History
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-lumina-primary text-black font-bold text-sm hover:scale-105 transition-all shadow-gold-glow">
            <Plus className="w-4 h-4" /> Add Objective
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              <input 
                type="text" 
                placeholder="Search learning objectives or KSAs..." 
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl glass-v2 border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all shadow-inner font-medium"
              />
           </div>

           <div className="space-y-4">
              {objectives.map((obj) => (
                <GlassCard key={obj.id} className="p-6 group hover:border-indigo-500/20 transition-all flex items-center justify-between gap-6">
                   <div className="flex items-center gap-5">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0",
                        obj.status === 'verified' ? "bg-teal-500/10 text-teal-400 border-teal-500/20" : "bg-white/5 text-gray-500 border-white/10"
                      )}>
                         <Target className="w-6 h-6" />
                      </div>
                      <div>
                         <div className="flex items-center gap-3 mb-1">
                            <h4 className="text-lg font-bold text-white lowercase tracking-tighter">{obj.title}</h4>
                            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{obj.mapping}</span>
                         </div>
                         <div className="flex items-center gap-4">
                            <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest">{obj.level} Level</span>
                            <div className="flex items-center gap-1.5">
                               {obj.status === 'verified' ? <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                               <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{obj.status}</span>
                            </div>
                         </div>
                      </div>
                   </div>
                   <button className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-gray-600 hover:text-white transition-all">
                      <MoreVertical className="w-5 h-5" />
                   </button>
                </GlassCard>
              ))}
           </div>
        </div>

        <div className="space-y-8">
           <GlassCard className="p-8">
              <div className="flex items-center gap-3 mb-8">
                 <Brain className="w-6 h-6 text-indigo-400" />
                 <h2 className="text-2xl font-bold text-white lowercase tracking-tighter">Taxonomy Alignment</h2>
              </div>
              <div className="space-y-8">
                 {[
                   { label: 'Bloom\'s Taxonomy', value: 'Create', color: 'bg-indigo-500' },
                   { label: 'Deep Knowledge', value: 'Synthesis', color: 'bg-teal-500' },
                   { label: 'Cognitive Load', value: 'Moderate', color: 'bg-amber-500' }
                 ].map((tax, i) => (
                    <div key={i}>
                       <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{tax.label}</span>
                          <span className="text-[10px] text-white font-bold">{tax.value}</span>
                       </div>
                       <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className={cn("h-full w-4/5 shadow-premium", tax.color)}></div>
                       </div>
                    </div>
                 ))}
              </div>
           </GlassCard>

           <GlassCard className="p-8 bg-gradient-to-br from-indigo-500/10 to-transparent">
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">Objective Audit</h4>
              <p className="text-[11px] text-gray-400 font-medium leading-relaxed italic mb-8">
                 "3 objectives are currently unmapped to any lesson modules. Consider updating your 'Optimization' blueprint."
              </p>
              <button className="w-full py-2.5 rounded-xl border border-white/10 text-[10px] font-bold text-white hover:bg-white/5 transition-all uppercase tracking-widest">
                 Run AI Audit
              </button>
           </GlassCard>
        </div>
      </div>
    </div>
  );
}

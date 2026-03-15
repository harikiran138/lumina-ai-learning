"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  BookOpen, 
  Award, 
  CheckCircle2, 
  Lock, 
  ChevronRight, 
  Star, 
  Zap, 
  Trophy,
  Brain,
  MessageSquare,
  Search,
  BookMarked
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

const GlassCard: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className={cn(
      'rounded-3xl border border-white/5 bg-white/[0.03] backdrop-blur-2xl shadow-premium overflow-hidden',
      className
    )}
  >
    {children}
  </motion.div>
);

export default function PeerTutorTraining() {
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<any>(null);

  useEffect(() => {
    const fetchTraining = async () => {
      try {
        const t = await api.getPeerTutorTraining();
        setModules(t);
      } catch (err) {
        console.error("Error fetching training:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTraining();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            Tutor <span className="gradient-text">Academy</span>
          </h1>
          <p className="text-gray-400 mt-1 font-medium italic">Master the art of teaching and unlock new subjects</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
             <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] block mb-1">Rank</span>
             <span className="text-lg font-bold text-indigo-400 uppercase tracking-tighter">Elite Explainer</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-400">
             <Trophy className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text"
              placeholder="Search training modules or subject certifications..."
              className="w-full pl-12 pr-6 py-4 rounded-3xl glass-v2 border-white/10 text-white font-medium focus:outline-none focus:border-indigo-500/50 transition-all shadow-inner"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              [1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-white/5 rounded-3xl animate-pulse"></div>)
            ) : modules.length > 0 ? (
               modules.map((mod) => (
                 <GlassCard key={mod.id} className="p-6 group hover:border-white/10 transition-all cursor-pointer shadow-premium" onClick={() => setSelectedModule(mod)}>
                    <div className="flex items-start justify-between mb-6">
                       <div className={cn(
                        "p-4 rounded-2xl transition-all",
                        mod.status === 'certified' ? "bg-green-500/10 text-green-400" : "bg-indigo-500/10 text-indigo-400"
                       )}>
                          {mod.status === 'certified' ? <CheckCircle2 className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                       </div>
                       <div className="text-right">
                          <span className="text-2xl font-bold text-white">{mod.progress || 0}%</span>
                          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">COMPleted</p>
                       </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:gradient-text transition-all leading-snug uppercase tracking-tighter">{mod.title}</h3>
                    <p className="text-xs text-gray-500 font-medium line-clamp-2 mb-6 italic leading-relaxed font-display">
                      Learn the core techniques used by top {mod.title?.split(' ')[0]} experts to explain complex concepts.
                    </p>

                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                        <div className="flex items-center gap-1.5">
                           <Zap className="w-3.5 h-3.5 text-lumina-primary" />
                           <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">+{mod.credits || 150} Credits</span>
                        </div>
                        <button className="flex items-center gap-1 text-xs font-bold text-indigo-400 group-hover:gap-2 transition-all">
                          {mod.status === 'certified' ? 'Recap Module' : 'Start Module'} <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                 </GlassCard>
               ))
            ) : (
                <div className="col-span-full py-12 text-center opacity-40 italic font-display text-gray-500">No training modules found...</div>
            )}
          </div>
        </div>

        <div className="space-y-8">
           <GlassCard className="p-8 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent">
              <div className="flex items-center gap-3 mb-8">
                 <Brain className="w-6 h-6 text-indigo-400" />
                 <h2 className="text-2xl font-bold text-white lowercase tracking-tighter">Your Journey</h2>
              </div>
              
              <div className="space-y-10 relative before:absolute before:left-2.5 before:top-2 before:bottom-0 before:w-px before:bg-white/5">
                 {[
                   { title: 'Explainability Master', status: 'completed', date: 'Jan 12' },
                   { title: 'Socratic Dialogue', status: 'in-progress', active: true },
                   { title: 'Concept Visualization', status: 'locked' },
                   { title: 'Advanced Peer Coaching', status: 'locked' }
                 ].map((step, i) => (
                   <div key={i} className="flex items-start gap-6 relative">
                      <div className={cn(
                        "w-5 h-5 rounded-full z-10 border-2 transition-all shadow-lg",
                        step.status === 'completed' ? "bg-green-500 border-green-400" : 
                        step.status === 'in-progress' ? "bg-indigo-500 border-indigo-400 animate-pulse" : "bg-zinc-900 border-white/5"
                      )}></div>
                      <div className="min-w-0">
                         <h4 className={cn(
                          "text-sm font-bold transition-colors uppercase tracking-widest",
                          step.status === 'locked' ? "text-gray-600" : "text-white"
                         )}>{step.title}</h4>
                         <p className="text-[10px] text-gray-500 mt-1 font-bold uppercase">{step.date || (step.status === 'locked' ? 'Locked' : 'In Progress')}</p>
                      </div>
                      {step.status === 'locked' && <Lock className="w-3.5 h-3.5 text-gray-700 absolute right-0 top-1" />}
                   </div>
                 ))}
              </div>
           </GlassCard>

           <GlassCard className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <BookMarked className="w-5 h-5 text-lumina-primary" />
                <h4 className="font-bold text-white text-sm uppercase tracking-widest">Resources</h4>
              </div>
              <ul className="space-y-4">
                 {[
                   'Explainer Field Guide',
                   'Peer Empathy Framework',
                   'Interactive Demo Library'
                 ].map(res => (
                   <li key={res}>
                      <button className="flex items-center justify-between w-full group text-left">
                         <span className="text-xs font-medium text-gray-500 group-hover:text-white transition-colors">{res}</span>
                         <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-lumina-primary" />
                      </button>
                   </li>
                 ))}
              </ul>
           </GlassCard>
        </div>
      </div>
    </div>
  );
}

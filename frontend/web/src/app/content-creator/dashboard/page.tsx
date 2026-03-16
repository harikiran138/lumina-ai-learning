"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  SquarePen, 
  Layers, 
  BookOpen, 
  Database, 
  BarChart3, 
  Plus, 
  ChevronRight, 
  Search, 
  MoreVertical, 
  Zap, 
  Trophy,
  History,
  Target,
  Sparkles,
  Rocket
} from 'lucide-react';
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

export default function ContentCreatorDashboard() {
  const [blueprints, setBlueprints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlueprints = async () => {
      try {
        const b = await api.getContentCreatorBlueprints();
        setBlueprints(b);
      } catch (err) {
        console.error("Error fetching blueprints:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlueprints();
  }, []);

  const stats = [
    { label: 'Active Blueprints', value: '12', icon: Layers, color: 'text-yellow-400' },
    { label: 'Question Bank', value: '1.4k', icon: Database, color: 'text-gold-400' },
    { label: 'Avg Quality Score', value: '94%', icon: Sparkles, color: 'text-amber-400' }
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            Content <span className="gradient-text">Studio</span>
          </h1>
          <p className="text-gray-400 mt-1 font-medium italic">Architecting the next generation of learning experiences</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all font-bold text-sm uppercase tracking-widest">
            <History className="w-4 h-4" /> Version Control
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-lumina-primary text-black font-bold text-sm hover:scale-105 transition-all shadow-gold-glow">
            <Plus className="w-4 h-4" /> New Blueprint
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {stats.map((stat, i) => (
           <GlassCard key={i} className="p-6">
              <div className="flex items-center justify-between">
                 <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-3xl font-display font-bold text-white">{stat.value}</p>
                 </div>
                 <div className={cn("p-4 rounded-2xl bg-white/5 border border-white/5", stat.color)}>
                    <stat.icon className="w-6 h-6" />
                 </div>
              </div>
           </GlassCard>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h2 className="text-2xl font-bold text-white lowercase tracking-tighter">Your Blueprints</h2>
              <div className="flex items-center gap-4">
                 <Search className="w-4 h-4 text-gray-600" />
                 <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">View All</span>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loading ? (
                 [1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-white/5 rounded-3xl animate-pulse"></div>)
              ) : blueprints.length > 0 ? (
                blueprints.map((bp) => (
                  <GlassCard key={bp.id} className="p-8 group hover:border-yellow-500/20 transition-all cursor-pointer relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-5 h-5 text-gray-500" />
                     </div>
                     <div className="mb-6 flex items-center justify-between">
                        <div className="p-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                           <BookOpen className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                           <Target className="w-3.5 h-3.5 text-amber-400" /> V1.2.0
                        </div>
                     </div>
                     
                     <h3 className="text-xl font-bold text-white mb-2 leading-snug group-hover:gradient-text transition-all lowercase tracking-tighter">{bp.title || "Course Blueprint"}</h3>
                     <p className="text-xs text-gray-500 font-medium line-clamp-2 italic mb-6 leading-relaxed">
                        Organizing 24 knowledge nodes into an adaptive learning sequence with AI-verified assessments.
                     </p>
                     
                     <div className="flex items-center justify-between pt-6 border-t border-white/5">
                        <div className="flex -space-x-2">
                           {[1, 2, 3].map(i => (
                              <div key={i} className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-gray-500">A</div>
                           ))}
                        </div>
                        <button className="flex items-center gap-1.5 text-xs font-bold text-yellow-400 group-hover:gap-2.5 transition-all uppercase tracking-widest">
                           Edit Builder <ChevronRight className="w-4 h-4" />
                        </button>
                     </div>
                  </GlassCard>
                ))
              ) : (
                <div className="col-span-full py-12 text-center opacity-30 italic font-display text-gray-500">No active blueprints currently.</div>
              )}
           </div>
        </div>

        <div className="space-y-8">
           <GlassCard className="p-8 bg-gradient-to-br from-yellow-500/10 to-transparent">
              <div className="flex items-center gap-3 mb-6">
                 <Rocket className="w-6 h-6 text-yellow-400" />
                 <h2 className="text-2xl font-bold text-white lowercase tracking-tighter">Content Reach</h2>
              </div>
              <p className="text-[11px] text-gray-400 font-medium leading-relaxed italic mb-8">
                 Your "Advanced Micro-economics" module has been adopted by 1,200+ students this week.
              </p>
              <div className="space-y-6">
                 <div>
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Student Rating</span>
                       <span className="text-[10px] text-white font-bold">4.9 / 5.0</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-yellow-500 w-[98%] shadow-premium"></div>
                    </div>
                 </div>
                 <div>
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Completion Rate</span>
                       <span className="text-[10px] text-white font-bold">82%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-gold-500 w-[82%] shadow-premium"></div>
                    </div>
                 </div>
              </div>
           </GlassCard>

           <GlassCard className="p-8">
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6 border-b border-white/5 pb-2">Creator Quests</h4>
              <div className="space-y-4">
                 {[
                   { title: 'AI Question Generation', bonus: '+200 XP', active: true },
                   { title: 'Accessibility Audit', bonus: '+150 XP', active: false },
                   { title: 'Concept Mapping', bonus: '+300 XP', active: true }
                 ].map((quest, i) => (
                   <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-all group">
                      <div>
                         <p className="text-xs font-bold text-white uppercase tracking-tighter">{quest.title}</p>
                         <p className="text-[9px] text-yellow-400 font-bold mt-1">{quest.bonus}</p>
                      </div>
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                        quest.active ? "border-yellow-500 text-yellow-400" : "border-gray-700 text-gray-700"
                      )}>
                         {quest.active && <Zap className="w-3 h-3 fill-current" />}
                      </div>
                   </div>
                 ))}
              </div>
           </GlassCard>
        </div>
      </div>
    </div>
  );
}

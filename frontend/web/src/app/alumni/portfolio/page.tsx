"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  ExternalLink, 
  Plus, 
  Share2, 
  Settings, 
  Layout, 
  Sparkles, 
  ChevronRight, 
  History, 
  Award, 
  Globe, 
  Lock, 
  Search,
  CheckCircle2,
  Trash2,
  Edit3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

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

export default function AlumniPortfolio() {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const p = await api.getAlumniPortfolio();
        setPortfolio(p);
      } catch (err) {
        console.error("Error fetching portfolio:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            Alumni <span className="gradient-text">Portfolio</span>
          </h1>
          <p className="text-gray-400 mt-1 font-medium italic">Your verified academic and mentorship achievements, ready for the world</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all font-bold text-sm uppercase tracking-widest">
            <Share2 className="w-4 h-4" /> Share Link
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-lumina-primary text-black font-bold text-sm hover:scale-105 transition-all shadow-gold-glow">
            <Plus className="w-4 h-4" /> Add Project
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-8">
           <GlassCard className="p-8 flex flex-col items-center">
              <div className="w-32 h-32 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 overflow-hidden">
                 <img src="https://ui-avatars.com/api/?name=Alumni+User&background=random" alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <h2 className="text-2xl font-bold text-white lowercase tracking-tighter">Alumni Identity</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Class of 2025</p>
              
              <div className="w-full mt-10 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest px-1">Professional Headline</label>
                    <p className="text-sm font-medium text-white italic">"Data Scientist & Mentorship Advocate"</p>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest px-1">Social Links</label>
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-gray-500 hover:text-white cursor-pointer"><Globe className="w-4 h-4" /></div>
                       <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-gray-500 hover:text-white cursor-pointer hover:bg-white/10 transition-colors"><Edit3 className="w-4 h-4" /></div>
                    </div>
                 </div>
              </div>
           </GlassCard>

           <GlassCard className="p-8 bg-gradient-to-br from-yellow-500/10 to-transparent">
              <div className="flex items-center gap-3 mb-6">
                 <Award className="w-5 h-5 text-yellow-400" />
                 <h4 className="font-bold text-white text-xs uppercase tracking-widest">Verified Badges</h4>
              </div>
              <div className="flex flex-wrap gap-3">
                 {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-500 hover:text-yellow-400 transition-colors">
                       <Sparkles className="w-5 h-5" />
                    </div>
                 ))}
                 <div className="w-10 h-10 rounded-xl border-2 border-dashed border-white/5 flex items-center justify-center text-gray-800"><Plus className="w-4 h-4" /></div>
              </div>
           </GlassCard>
        </div>

        <div className="lg:col-span-3 space-y-8">
           <div className="flex items-center gap-4 border-b border-white/5 pb-2 mb-6">
              <button className="text-sm font-bold text-lumina-primary relative after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-0.5 after:bg-lumina-primary uppercase tracking-widest">Showcased Work</button>
              <button className="text-sm font-bold text-gray-600 hover:text-gray-400 uppercase tracking-widest">Activity Feed</button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {loading ? (
                 [1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-white/5 rounded-3xl animate-pulse"></div>)
              ) : (
                [
                  { title: 'AI-First Education Bot', desc: 'A custom transformer model trained on Lumina open datasets.', tags: ['NLP', 'React', 'FastAPI'] },
                  { title: 'Campus Engagement Portal', desc: 'Real-time dashboard for student wellness monitoring.', tags: ['WebSockets', 'Go', 'Redis'] }
                ].map((project, idx) => (
                  <GlassCard key={idx} className="p-8 group hover:border-yellow-500/20 transition-all flex flex-col h-full">
                     <div className="flex items-center justify-between mb-8">
                        <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
                           <Layout className="w-6 h-6" />
                        </div>
                        <div className="flex gap-2">
                           <button className="p-2 rounded-xl hover:bg-white/5 text-gray-700 hover:text-white transition-colors"><Settings className="w-4 h-4" /></button>
                           <button className="p-2 rounded-xl hover:bg-white/5 text-gray-700 hover:text-amber-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                     </div>
                     <h3 className="text-2xl font-bold text-white lowercase tracking-tighter mb-3 leading-tight group-hover:gradient-text transition-all">{project.title}</h3>
                     <p className="text-xs text-gray-500 font-medium italic mb-8 leading-relaxed flex-1">
                        {project.desc}
                     </p>
                     <div className="flex flex-wrap gap-2 pt-6 border-t border-white/5">
                        {project.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 rounded-lg bg-white/5 text-[9px] font-bold text-gray-500 uppercase tracking-widest">{tag}</span>
                        ))}
                     </div>
                  </GlassCard>
                ))
              )}
           </div>

           <button className="w-full py-8 rounded-3xl border-2 border-dashed border-white/5 text-gray-600 hover:text-yellow-400 hover:border-yellow-500/20 transition-all font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3">
              <Plus className="w-6 h-6" /> Architect New Showcase Item
           </button>
        </div>
      </div>
    </div>
  );
}

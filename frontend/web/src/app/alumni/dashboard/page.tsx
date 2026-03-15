"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Briefcase, 
  Users, 
  Heart, 
  Award, 
  ChevronRight, 
  ExternalLink, 
  Plus, 
  MessageCircle, 
  Calendar, 
  Star, 
  Zap, 
  Sparkles,
  History,
  TrendingUp,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import Link from 'next/link';

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

export default function AlumniDashboard() {
  const [mentees, setMentees] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [m, p] = await Promise.all([
          api.getAlumniMentorshipMentees(),
          api.getAlumniPortfolio()
        ]);
        setMentees(m);
        setPortfolio(p);
      } catch (err) {
        console.error("Error fetching alumni data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    { label: 'Mentorship Hours', value: '48h', icon: Heart, color: 'text-rose-400' },
    { label: 'Portfolio Views', value: '2.4k', icon: Eye, color: 'text-indigo-400' },
    { label: 'Success Badges', value: '12', icon: Trophy, color: 'text-amber-400' }
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            Alumni <span className="gradient-text">Network</span>
          </h1>
          <p className="text-gray-400 mt-1 font-medium italic">Your legacy continues—mentoring the next wave of Lumina learners</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/alumni/portfolio">
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all font-bold text-sm uppercase tracking-widest">
              <Briefcase className="w-4 h-4 text-indigo-400" /> My Portfolio
            </button>
          </Link>
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-lumina-primary text-black font-bold text-sm hover:scale-105 transition-all shadow-gold-glow">
            <Plus className="w-4 h-4" /> Open Availability
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
              <h2 className="text-2xl font-bold text-white lowercase tracking-tighter">Current Mentees</h2>
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Active Links: {loading ? '...' : mentees.length}</span>
           </div>

           <div className="space-y-4">
              {loading ? (
                 [1, 2].map(i => <div key={i} className="h-24 bg-white/5 rounded-3xl animate-pulse"></div>)
              ) : mentees.length > 0 ? (
                mentees.map((mentee) => (
                  <GlassCard key={mentee.id} className="p-6 group hover:border-rose-500/20 transition-all flex items-center justify-between gap-6">
                     <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center font-bold text-white text-xl uppercase shadow-inner overflow-hidden">
                           <img src={mentee.avatar || `https://ui-avatars.com/api/?name=${mentee.name || 'M'}&background=random`} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                           <h4 className="font-bold text-white text-lg lowercase tracking-tighter truncate">{mentee.name || "Mentee"}</h4>
                           <div className="flex items-center gap-4">
                              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{mentee.major || "Computer Science"}</span>
                              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-400 text-[9px] font-bold uppercase tracking-widest">
                                 Impact +12
                              </div>
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-600 hover:text-white transition-all">
                           <MessageCircle className="w-5 h-5" />
                        </button>
                        <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-all uppercase tracking-widest">
                           Schedule
                        </button>
                     </div>
                  </GlassCard>
                ))
              ) : (
                <div className="py-12 text-center glass-v2 rounded-3xl opacity-30 italic font-display text-gray-500">No active mentees assigned.</div>
              )}
           </div>

           <div className="flex items-center justify-between border-b border-white/5 pb-4 pt-4">
              <h2 className="text-2xl font-bold text-white lowercase tracking-tighter">Portfolio Snapshot</h2>
              <Link href="/alumni/portfolio" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest">Manage All Projects</Link>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: 'Neural Network Visualizer', role: 'Lead Architect', year: '2024' },
                { title: 'Lumina Engagement Study', role: 'Data Researcher', year: '2025' }
              ].map((project, i) => (
                <GlassCard key={i} className="p-8 group hover:border-indigo-500/20 transition-all cursor-pointer relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="w-5 h-5 text-gray-500" />
                   </div>
                   <div className="mb-6 h-32 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                      <Sparkles className="w-10 h-10 text-gray-700" />
                   </div>
                   <h3 className="text-xl font-bold text-white mb-1 group-hover:gradient-text transition-all lowercase tracking-tighter">{project.title}</h3>
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-6">{project.role} • {project.year}</p>
                </GlassCard>
              ))}
           </div>
        </div>

        <div className="space-y-8">
           <GlassCard className="p-8 bg-gradient-to-br from-rose-500/10 to-transparent">
              <div className="flex items-center gap-3 mb-8">
                 <Star className="w-6 h-6 text-rose-400" />
                 <h2 className="text-2xl font-bold text-white lowercase tracking-tighter">Impact Ranking</h2>
              </div>
              <div className="flex items-center justify-between mb-8">
                 <div className="text-center flex-1">
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Global Percentile</p>
                    <p className="text-3xl font-display font-bold text-white">Top 2%</p>
                 </div>
                 <div className="w-px h-12 bg-white/5"></div>
                 <div className="text-center flex-1">
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Legacy Points</p>
                    <p className="text-3xl font-display font-bold text-white">12.4k</p>
                 </div>
              </div>
              <div className="space-y-4">
                 <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 w-4/5 shadow-premium"></div>
                 </div>
                 <p className="text-[10px] text-gray-500 font-medium italic leading-relaxed text-center">
                   "You are 2 sessions away from the 'Foundational Pillar' medal!"
                 </p>
              </div>
           </GlassCard>

           <GlassCard className="p-8">
              <div className="flex items-center gap-3 mb-6">
                 <TrendingUp className="w-5 h-5 text-teal-400" />
                 <h4 className="font-bold text-white text-xs uppercase tracking-widest">Network Insights</h4>
              </div>
              <ul className="space-y-6">
                 {[
                   { label: 'Mentee Growth', value: '+24%', color: 'text-teal-400' },
                   { label: 'System Adoption', value: 'High', color: 'text-indigo-400' },
                   { label: 'Skill Endorsements', value: '86', color: 'text-rose-400' }
                 ].map((insight, i) => (
                    <li key={i} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
                       <span className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">{insight.label}</span>
                       <span className={cn("text-xs font-bold", insight.color)}>{insight.value}</span>
                    </li>
                 ))}
              </ul>
           </GlassCard>

           <GlassCard className="p-8 border-l-4 border-indigo-500/30">
              <div className="flex items-center gap-2 mb-3">
                 <Globe className="w-4 h-4 text-indigo-400" />
                 <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Alumni Perk</h4>
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                 Your alumni status grants you lifelong access to the 'Researcher Lab' with standard k-anonymity privileges.
              </p>
           </GlassCard>
        </div>
      </div>
    </div>
  );
}

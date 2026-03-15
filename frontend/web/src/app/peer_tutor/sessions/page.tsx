"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Video, 
  Clock, 
  Users, 
  MessageSquare, 
  Star, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  Calendar,
  History,
  MoreVertical,
  Zap,
  Award
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

export default function PeerTutorSessions() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const s = await api.getPeerTutorSessions();
        setSessions(s);
      } catch (err) {
        console.error("Error fetching sessions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            Tutoring <span className="gradient-text">Sessions</span>
          </h1>
          <p className="text-gray-400 mt-1 font-medium italic">Manage your 1-on-1 peer learning connections</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all font-bold text-sm uppercase tracking-widest">
            <History className="w-4 h-4" /> View History
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-4 border-b border-white/5 pb-2">
            <button className="text-sm font-bold text-lumina-primary relative after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-0.5 after:bg-lumina-primary uppercase tracking-widest">Upcoming</button>
            <button className="text-sm font-bold text-gray-600 hover:text-gray-400 uppercase tracking-widest">Completed</button>
          </div>

          <div className="space-y-4">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-32 bg-white/5 rounded-3xl animate-pulse"></div>)
            ) : sessions.length > 0 ? (
              sessions.map((session) => (
                <GlassCard key={session.id} className="p-6 hover:border-indigo-500/20 transition-all group">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-5">
                         <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center font-bold text-indigo-400 text-xl shadow-inner border border-indigo-500/10">
                            {session.peerName?.[0] || 'P'}
                         </div>
                         <div className="min-w-0">
                            <h4 className="font-bold text-white text-lg truncate group-hover:gradient-text transition-all lowercase tracking-tighter">{session.topic || 'Subject Support'}</h4>
                            <div className="flex items-center gap-4 mt-1">
                               <p className="text-xs text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                 <Users className="w-3.5 h-3.5 text-indigo-400" /> {session.peerName || 'Peer'}
                               </p>
                               <p className="text-xs text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                 <Clock className="w-3.5 h-3.5 text-indigo-400" /> {session.duration || '30m'}
                               </p>
                            </div>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                         <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-lumina-primary text-black font-bold text-xs hover:scale-105 transition-all shadow-gold-glow">
                            <Video className="w-4 h-4" /> Enter Session
                         </button>
                         <button className="p-2.5 rounded-xl bg-white/5 text-gray-500 hover:text-white transition-all border border-white/5">
                            <MoreVertical className="w-5 h-5" />
                         </button>
                      </div>
                   </div>
                </GlassCard>
              ))
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center glass-v2 rounded-3xl border-dashed border-white/10 opacity-50">
                 <Calendar className="w-12 h-12 text-gray-700 mb-4" />
                 <h3 className="text-lg font-bold text-gray-500">No scheduled sessions</h3>
                 <p className="text-xs text-gray-600 font-medium italic">Join the live queue to start helping peers!</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
           <GlassCard className="p-8 bg-gradient-to-br from-lumina-primary/10 to-transparent">
              <div className="flex items-center gap-3 mb-6">
                <Star className="w-6 h-6 text-lumina-primary" />
                <h3 className="font-bold text-white">Top Tutor Bonus</h3>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed font-display font-medium mb-6">
                Maintain a <span className="text-white font-bold">4.8+ rating</span> this week to unlock <span className="text-lumina-primary font-bold">2x Credits</span> for every session!
              </p>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-2 shadow-inner">
                 <div className="h-full bg-lumina-primary w-[85%] shadow-gold-glow"></div>
              </div>
              <p className="text-[10px] text-gray-500 font-bold text-right uppercase tracking-widest italic">Progress: 4.6 / 4.8</p>
           </GlassCard>

           <GlassCard className="p-8">
              <h3 className="font-bold text-white mb-6 uppercase tracking-widest text-xs border-b border-white/5 pb-2">Session Safety</h3>
              <div className="space-y-4">
                 {[
                   { title: 'Privacy Protocols', active: true },
                   { title: 'Response Ethics', active: true },
                   { title: 'Conflict Handling', active: false }
                 ].map((rule) => (
                   <div key={rule.title} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-xs font-bold text-gray-400">{rule.title}</span>
                      {rule.active ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-700" />}
                   </div>
                 ))}
              </div>
              <button className="w-full mt-6 py-2.5 rounded-xl border border-white/10 text-[10px] font-bold text-gray-500 hover:text-white hover:bg-white/5 transition-all uppercase tracking-widest font-display">
                Review Guidelines
              </button>
           </GlassCard>
        </div>
      </div>
    </div>
  );
}

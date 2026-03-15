"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  Video, 
  MapPin, 
  ChevronLeft, 
  ChevronRight,
  MoreVertical,
  Plus,
  VideoOff,
  Briefcase,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

const GlassCard: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4 }}
    className={cn(
      'rounded-3xl border border-white/5 bg-white/[0.03] backdrop-blur-2xl shadow-premium overflow-hidden',
      className
    )}
  >
    {children}
  </motion.div>
);

export default function MentorSessions() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const s = await api.getMentorSessions();
        setSessions(s);
      } catch (err) {
        console.error("Error fetching sessions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            Mentor <span className="gradient-text">Sessions</span>
          </h1>
          <p className="text-gray-400 mt-1 font-medium italic">Schedule and manage your personal mentorship meetings</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-lumina-primary text-black font-bold text-sm hover:scale-105 transition-all shadow-gold-glow">
            <Plus className="w-4 h-4" /> Create Availability
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Simple Calendar Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
               <h3 className="font-bold text-white uppercase tracking-tighter text-xs">January 2024</h3>
               <div className="flex items-center gap-2">
                 <button className="p-1 rounded-md hover:bg-white/5 text-gray-500 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                 <button className="p-1 rounded-md hover:bg-white/5 text-gray-500 transition-colors"><ChevronRight className="w-4 h-4" /></button>
               </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S','M','T','W','T','F','S'].map(d => (
                <span key={d} className="text-[10px] font-bold text-gray-600 text-center">{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 31 }).map((_, i) => {
                const day = i + 1;
                const isToday = day === 15;
                const hasSession = [15, 16, 17, 22].includes(day);
                return (
                  <button 
                    key={i} 
                    className={cn(
                      "aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all relative",
                      isToday ? "bg-lumina-primary text-black" : "text-gray-400 hover:bg-white/5",
                      hasSession && !isToday && "text-white"
                    )}
                  >
                    {day}
                    {hasSession && !isToday && (
                      <div className="absolute bottom-1 w-1 h-1 rounded-full bg-lumina-primary"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard className="p-6 bg-gradient-to-br from-indigo-500/10 to-transparent">
             <h4 className="font-bold text-white text-sm mb-3">Sync Calendar</h4>
             <p className="text-[11px] text-gray-400 mb-4 leading-relaxed font-medium">Link your Google or Outlook calendar to automatically avoid conflicts.</p>
             <button className="w-full py-2 rounded-xl glass-v2 border-white/10 text-xs font-bold text-white hover:bg-white/5 transition-colors">
               Connect Calendar
             </button>
          </GlassCard>
        </div>

        {/* Sessions List */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center gap-4 border-b border-white/5 pb-2">
            <button className="text-sm font-bold text-lumina-primary relative after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-0.5 after:bg-lumina-primary uppercase tracking-widest">Upcoming</button>
            <button className="text-sm font-bold text-gray-600 hover:text-gray-400 uppercase tracking-widest">Past</button>
            <button className="text-sm font-bold text-gray-600 hover:text-gray-400 uppercase tracking-widest">Requests</button>
          </div>

          <div className="space-y-4">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-24 bg-white/5 rounded-3xl animate-pulse"></div>)
            ) : sessions.length > 0 ? (
              sessions.map((session) => (
                <GlassCard key={session.id} className="p-6 group hover:border-indigo-500/10 transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                       <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-white/5 border border-white/5 group-hover:border-indigo-500/20 transition-all">
                          <span className="text-[10px] font-bold text-indigo-400 uppercase">{session.date?.split(' ')[0] || 'JAN'}</span>
                          <span className="text-xl font-bold text-white leading-none">{session.date?.split(' ')[1] || '15'}</span>
                       </div>
                       <div className="min-w-0">
                          <h4 className="font-bold text-white text-lg truncate group-hover:gradient-text transition-all">{session.topic || 'Advanced Architecture Review'}</h4>
                          <div className="flex items-center gap-4 mt-1">
                             <p className="text-xs text-gray-500 flex items-center gap-1.5 font-bold uppercase tracking-tight">
                               <Users className="w-3.5 h-3.5 text-indigo-400" /> {session.menteeName || 'Sarah Chen'}
                             </p>
                             <p className="text-xs text-gray-500 flex items-center gap-1.5 font-bold uppercase tracking-tight">
                               <Clock className="w-3.5 h-3.5 text-indigo-400" /> {session.time || '2:30 PM'}
                             </p>
                          </div>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                       <button className="flex items-center gap-2 px-4 py-2 rounded-xl glass-v2 border-white/10 text-xs font-bold text-white hover:bg-white/5 transition-all">
                         <Video className="w-4 h-4 text-indigo-400" /> Join Meeting
                       </button>
                       <button className="p-2 rounded-xl glass-v2 border-white/10 text-gray-500 hover:text-white hover:bg-white/5 transition-all">
                         <MoreVertical className="w-5 h-5" />
                       </button>
                    </div>
                  </div>
                </GlassCard>
              ))
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center glass-v2 rounded-3xl border-dashed border-white/10">
                <CalendarIcon className="w-12 h-12 text-gray-700 mb-4 opacity-20" />
                <h3 className="text-lg font-bold text-gray-500">No scheduled sessions</h3>
                <p className="text-gray-600 text-xs mt-1 font-medium italic">Share your availability to get started!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Clock, 
  Users, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  Zap, 
  Target, 
  Star, 
  MessageSquare, 
  Video, 
  ChevronRight, 
  MoreVertical,
  Plus,
  PlayCircle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import Link from 'next/link';

const GlassCard: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className={cn(
      'rounded-3xl border border-white/5 bg-white/[0.03] backdrop-blur-2xl shadow-premium overflow-hidden',
      className
    )}
  >
    {children}
  </motion.div>
);

const earningsData = [
  { day: 'Mon', credits: 45 },
  { day: 'Tue', credits: 52 },
  { day: 'Wed', credits: 38 },
  { day: 'Thu', credits: 65 },
  { day: 'Fri', credits: 48 },
  { day: 'Sat', credits: 72 },
  { day: 'Sun', credits: 58 }
];

export default function PeerTutorDashboard() {
  const [training, setTraining] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [t, s] = await Promise.all([
          api.getPeerTutorTraining(),
          api.getPeerTutorSessions()
        ]);
        setTraining(t);
        setSessions(s);
      } catch (err) {
        console.error("Error fetching peer tutor data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            Peer Tutor <span className="gradient-text">Studio</span>
          </h1>
          <p className="text-gray-400 mt-1 font-medium italic">Learn, Teach, and Grow with your peers</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsOnline(!isOnline)}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg",
              isOnline 
                ? "bg-green-500/20 text-green-400 border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]" 
                : "bg-white/5 text-gray-400 border border-white/10"
            )}
          >
            <div className={cn("w-2 h-2 rounded-full", isOnline ? "bg-green-400 animate-pulse" : "bg-gray-600")} />
            {isOnline ? "Go Offline" : "Go Online"}
          </button>
          <Link href="/peer-tutor/training">
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-lumina-primary text-black font-bold text-sm hover:scale-105 transition-all shadow-gold-glow">
              <PlayCircle className="w-4 h-4" /> Resume Training
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Certification & Training */}
        <div className="lg:col-span-2 space-y-8">
           <GlassCard className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-lumina-primary/10">
                    <Award className="w-6 h-6 text-lumina-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Certification Progress</h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">Level 2: Advanced Explainer</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-white">72%</span>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Total Completion</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: 'Socratic Method', progress: 90, status: 'certified', icon: MessageSquare },
                  { title: 'Conflict Resolution', progress: 45, status: 'in-progress', icon: Users },
                  { title: 'Visual Analogies', progress: 60, status: 'in-progress', icon: PlayCircle },
                  { title: 'Ethics in Tutoring', progress: 100, status: 'certified', icon: CheckCircle2 }
                ].map((mod) => (
                  <div key={mod.title} className="p-5 rounded-2xl glass-v2 border-white/5 hover:border-white/10 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2.5 rounded-xl bg-white/5 group-hover:bg-lumina-primary/10 transition-colors">
                        <mod.icon className="w-4 h-4 text-gray-400 group-hover:text-lumina-primary transition-colors" />
                      </div>
                      <span className={cn(
                        "px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider",
                        mod.status === 'certified' ? "bg-green-500/10 text-green-400" : "bg-lumina-primary/10 text-lumina-primary"
                      )}>
                        {mod.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-white text-sm mb-3">{mod.title}</h4>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                       <div 
                        className={cn("h-full transition-all duration-1000", mod.status === 'certified' ? "bg-green-500" : "bg-lumina-primary")}
                        style={{ width: `${mod.progress}%` }}
                       />
                    </div>
                  </div>
                ))}
              </div>
           </GlassCard>

           {/* Live Tutoring Queue */}
           <GlassCard className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-green-500/10">
                    <Zap className="w-6 h-6 text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Live Queue</h2>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-bold text-gray-400 border border-white/5 flex items-center gap-1.5">
                    <Users className="w-3 h-3" /> 4 WAITING
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { name: 'Leo Messi', subject: 'Linear Algebra', waitTime: '2m', priority: 'high' },
                  { name: 'Kylian M.', subject: 'JavaScript Async', waitTime: '5m', priority: 'medium' },
                  { name: 'Erling H.', subject: 'Physics: Forces', waitTime: '8m', priority: 'medium' }
                ].map((peer, idx) => (
                  <div key={idx} className="flex items-center gap-5 p-5 rounded-2xl glass-v2 border-white/5 hover:bg-white/[0.05] transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center font-bold text-white text-lg">
                      {peer.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white text-base truncate mb-0.5">{peer.name}</h4>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{peer.subject}</span>
                        <span className="w-1 h-1 rounded-full bg-white/10"></span>
                        <span className="text-[10px] text-gray-500 font-medium">Waiting {peer.waitTime}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {peer.priority === 'high' && (
                        <div className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 text-[8px] font-bold uppercase tracking-wider border border-red-500/20">High Priority</div>
                      )}
                      <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-lumina-primary text-black font-bold text-xs hover:scale-105 transition-all shadow-gold-glow">
                        Accept Session
                      </button>
                    </div>
                  </div>
                ))}
              </div>
           </GlassCard>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-8">
           <GlassCard className="p-8">
              <div className="flex items-center justify-between mb-8">
                 <h2 className="text-xl font-bold text-white">Peer Credits</h2>
                 <TrendingUp className="w-5 h-5 text-lumina-primary" />
              </div>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-4xl font-bold text-white tracking-tighter">1,240</span>
                <span className="text-xs font-bold text-lumina-primary uppercase tracking-widest">Available</span>
              </div>

              <div className="h-48">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={earningsData}>
                       <defs>
                          <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#bf9304" stopOpacity={0.3} />
                             <stop offset="95%" stopColor="#bf9304" stopOpacity={0} />
                          </linearGradient>
                       </defs>
                       <XAxis dataKey="day" hide />
                       <YAxis hide />
                       <Tooltip 
                          content={({ active, payload }) => {
                             if (active && payload && payload.length) {
                                return (
                                   <div className="p-2 rounded-lg bg-black/80 border border-white/10 text-[10px] font-bold text-white">
                                      {payload[0].value} Credits
                                   </div>
                                );
                             }
                             return null;
                          }}
                       />
                       <Area type="monotone" dataKey="credits" stroke="#bf9304" fillOpacity={1} fill="url(#colorCredits)" strokeWidth={3} />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>

              <div className="mt-8 pt-8 border-t border-white/5">
                 <button className="w-full py-3 rounded-2xl glass-v2 border-white/10 text-xs font-bold text-white hover:bg-white/5 transition-colors uppercase tracking-widest">
                    Redeem for Learning Packs
                 </button>
              </div>
           </GlassCard>

           <GlassCard className="p-8 bg-gradient-to-br from-indigo-500/10 to-transparent">
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-6 h-6 text-indigo-400" />
                <h3 className="font-bold text-white">Subject Badges</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                 {[
                   { label: 'Math Wizard', color: 'indigo' },
                   { label: 'Code Ninja', color: 'lumina' },
                   { label: 'History Buff', color: 'amber' },
                   { label: 'Science Pro', color: 'green' }
                 ].map((badge) => (
                   <div key={badge.label} className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center gap-2 group cursor-pointer hover:border-white/20 transition-all">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                         <Star className="w-5 h-5 text-gray-500 group-hover:text-amber-400 transition-colors" />
                      </div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter text-center">{badge.label}</span>
                   </div>
                 ))}
              </div>
           </GlassCard>

           <GlassCard className="p-8">
              <h3 className="font-bold text-white mb-6 uppercase tracking-widest text-xs">Recent Feedback</h3>
              <div className="space-y-6">
                 {[
                   { user: 'Sarah', msg: 'Explained pointers so clearly!', rating: 5 },
                   { user: 'John', msg: 'Patient and thorough.', rating: 5 }
                 ].map((rev, i) => (
                   <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-bold text-white">{rev.user}</span>
                         <div className="flex gap-0.5">
                            {Array.from({ length: rev.rating }).map((_, j) => (
                               <Star key={j} className="w-2.5 h-2.5 text-amber-500 fill-current" />
                            ))}
                         </div>
                      </div>
                      <p className="text-xs text-gray-500 italic font-medium leading-relaxed">"{rev.msg}"</p>
                   </div>
                 ))}
              </div>
           </GlassCard>
        </div>
      </div>
    </div>
  );
}

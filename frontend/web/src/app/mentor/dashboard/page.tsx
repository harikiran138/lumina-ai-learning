"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Users, 
  TrendingUp, 
  Clock, 
  Star, 
  FileText, 
  MoreVertical, 
  ChevronRight, 
  Award, 
  Target, 
  Zap,
  CheckCircle2,
  Briefcase
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import Link from 'next/link';

// Mock data to supplement API if needed
const sessionData = [
  { month: 'Jul', sessions: 12 },
  { month: 'Aug', sessions: 15 },
  { month: 'Sep', sessions: 18 },
  { month: 'Oct', sessions: 14 },
  { month: 'Nov', sessions: 20 },
  { month: 'Dec', sessions: 18 }
];

const impactMetrics = [
  { label: 'Total Mentees', value: '24', change: '+12%', trend: 'up' },
  { label: 'Sessions This Month', value: '18', change: '+8%', trend: 'up' },
  { label: 'Avg. Satisfaction', value: '4.8', change: '+0.3', trend: 'up' },
  { label: 'Portfolio Reviews', value: '32', change: '+15%', trend: 'up' }
];

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

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/80 backdrop-blur-md p-4 shadow-2xl">
        <p className="text-xs text-gray-400 font-medium">Monthly Activity</p>
        <p className="text-lg font-bold text-lumina-highlight">{payload[0].value} Sessions</p>
      </div>
    );
  }
  return null;
};

export default function MentorDashboard() {
  const [matches, setMatches] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [m, s] = await Promise.all([
          api.getMentorMatches(),
          api.getMentorSessions()
        ]);
        setMatches(m);
        setSessions(s);
      } catch (err) {
        console.error("Error fetching mentor data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            Mentor <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-gray-400 mt-1 font-medium italic">Empowering the next generation of innovators</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/mentor/sessions">
            <button className="px-6 py-2.5 rounded-xl bg-lumina-highlight text-black font-bold text-sm hover:scale-105 transition-transform shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              Schedule Session
            </button>
          </Link>
          <button className="p-2.5 rounded-xl glass-v2 border-white/10 text-gray-400 hover:text-white transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Impact Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {impactMetrics.map((metric, idx) => (
          <GlassCard key={metric.label} className="p-6 group hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{metric.label}</span>
              <div className={cn(
                "p-1.5 rounded-lg",
                metric.trend === 'up' ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
              )}>
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white group-hover:text-lumina-highlight transition-all">{metric.value}</span>
              <span className={cn(
                "text-xs font-bold",
                metric.trend === 'up' ? "text-green-500" : "text-red-500"
              )}>{metric.change}</span>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Mentee Matches */}
        <GlassCard className="lg:col-span-2 p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-lumina-highlight/10">
                <Users className="w-6 h-6 text-lumina-highlight" />
              </div>
              <h2 className="text-2xl font-bold text-white">Mentee Matches</h2>
            </div>
            <Link href="/mentor/matches" className="text-xs font-bold text-lumina-highlight hover:underline uppercase tracking-tighter">View All Potential</Link>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lumina-highlight"></div>
              </div>
            ) : matches.length > 0 ? (
              matches.slice(0, 4).map((mentee) => (
                <div key={mentee.id} className="flex items-center gap-5 p-5 rounded-2xl glass-v2 border-white/5 hover:bg-white/[0.05] transition-all group">
                  <div className="relative">
                    <img 
                      src={mentee.avatar || `https://ui-avatars.com/api/?name=${mentee.name}&background=random`} 
                      className="w-14 h-14 rounded-full object-cover border-2 border-white/10 group-hover:border-lumina-highlight/30 transition-colors" 
                      alt={mentee.name} 
                    />
                    <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-black border border-white/10">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-lg truncate mb-1">{mentee.name}</h4>
                    <div className="flex flex-wrap gap-2">
                       {(mentee.skills || ['AI', 'Python']).map((s: string) => (
                         <span key={s} className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-gray-400 font-bold border border-white/5">{s}</span>
                       ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 justify-end mb-1">
                      <Target className="w-4 h-4 text-lumina-highlight" />
                      <span className="text-lg font-bold text-white">{mentee.alignmentScore || '94'}%</span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Alignment Score</p>
                  </div>
                  <button className="p-2 rounded-xl bg-white/5 hover:bg-lumina-highlight/20 hover:text-lumina-highlight transition-all ml-2">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="h-32 flex flex-col items-center justify-center text-gray-500 glass-v2 rounded-2xl border-dashed border-white/10">
                <Users className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm font-medium">No matches found at the moment</p>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Sessions Sidebar */}
        <div className="space-y-8">
          <GlassCard className="p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-2xl bg-yellow-500/10">
                <Calendar className="w-6 h-6 text-yellow-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Sessions</h2>
            </div>
            
            <div className="space-y-4">
              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl"></div>)}
                </div>
              ) : sessions.length > 0 ? (
                sessions.slice(0, 3).map((session) => (
                  <div key={session.id} className="p-5 rounded-2xl glass-v2 border-white/5 hover:border-yellow-500/20 transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-1 rounded-lg bg-yellow-500/10 text-yellow-400 text-[10px] font-bold uppercase tracking-wider">
                        {session.time || '2:00 PM'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold">{session.date || 'Today'}</span>
                    </div>
                    <h4 className="font-bold text-white mb-1 truncate">{session.topic || 'Portfolio Review'}</h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5 font-medium">
                      <Users className="w-3 h-3" /> {session.menteeName || 'Sarah Chen'}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-10 flex flex-col items-center justify-center text-center">
                  <Clock className="w-10 h-10 text-gray-600 mb-4 opacity-50" />
                  <p className="text-gray-500 text-sm font-medium mb-4">No upcoming sessions</p>
                  <button className="text-xs font-bold text-yellow-400 hover:underline">Pick a slot</button>
                </div>
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-8 bg-gradient-to-br from-lumina-highlight/10 to-transparent">
             <div className="flex items-center gap-3 mb-6">
               <Award className="w-6 h-6 text-lumina-highlight" />
               <h3 className="font-bold text-white">Mentor Pro</h3>
             </div>
             <p className="text-sm text-gray-400 leading-relaxed mb-6">
               You are in the top <span className="text-white font-bold">5%</span> of mentors this month. Your mentees show a <span className="text-lumina-highlight font-bold">42%</span> faster skill acquisition rate.
             </p>
             <button className="w-full py-2.5 rounded-xl border border-white/10 text-xs font-bold text-white hover:bg-white/5 transition-colors uppercase tracking-widest">
               View Performance Insights
             </button>
          </GlassCard>
        </div>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <GlassCard className="p-8">
           <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-3">
               <div className="p-3 rounded-2xl bg-yellow-500/10">
                 <FileText className="w-6 h-6 text-yellow-400" />
               </div>
               <h2 className="text-xl font-bold text-white">Review Queue</h2>
             </div>
             <span className="px-2 py-1 rounded-lg bg-yellow-500/10 text-yellow-400 text-[10px] font-bold">3 PENDING</span>
           </div>
           
           <div className="space-y-4">
             {[
               { id: 1, name: 'Sarah Chen', title: 'AI Ethics Paper', time: '2h ago' },
               { id: 2, name: 'Marcus J.', title: 'Neural Net Viz', time: '5h ago' }
             ].map((item) => (
               <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl glass-v2 border-white/5 hover:bg-white/5 transition-all group cursor-pointer">
                 <div className="w-10 h-10 rounded-xl bg-lumina-highlight/20 flex items-center justify-center font-bold text-lumina-highlight text-xs">
                    {item.name[0]}
                 </div>
                 <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-bold text-white truncate">{item.title}</h5>
                    <p className="text-[10px] text-gray-500 font-medium">{item.name} • {item.time}</p>
                 </div>
                  <button className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-lumina-highlight text-black transition-all">
                   <ChevronRight className="w-4 h-4" />
                 </button>
               </div>
             ))}
           </div>
        </GlassCard>

        <GlassCard className="lg:col-span-2 p-8">
           <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-lumina-highlight/10">
                  <Zap className="w-6 h-6 text-lumina-highlight" />
               </div>
               <h2 className="text-2xl font-bold text-white">Mentorship Impact</h2>
             </div>
             <div className="flex items-center gap-2">
               {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(m => (
                 <span key={m} className="w-1.5 h-1.5 rounded-full bg-white/5"></span>
               ))}
             </div>
           </div>

           <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sessionData}>
                  <defs>
                    <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 600 }}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="sessions"
                    stroke="#F59E0B"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorSessions)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
        </GlassCard>
      </div>
    </div>
  );
}

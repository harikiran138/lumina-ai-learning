"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  AlertCircle, 
  Users, 
  Heart, 
  Activity, 
  MessageCircle, 
  ChevronRight, 
  Search, 
  Filter, 
  Eye, 
  Lock, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  MoreVertical,
  Zap,
  Info
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
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

const riskDistributionData = [
  { name: 'Low', value: 65, color: '#2dd4bf' },
  { name: 'Moderate', value: 25, color: '#f59e0b' },
  { name: 'High', value: 10, color: '#f43f5e' }
];

const sentimentTrend = [
  { day: 'Mon', sentiment: 72 },
  { day: 'Tue', sentiment: 68 },
  { day: 'Wed', sentiment: 75 },
  { day: 'Thu', sentiment: 64 },
  { day: 'Fri', sentiment: 80 },
  { day: 'Sat', sentiment: 78 },
  { day: 'Sun', sentiment: 82 }
];

export default function CounselorDashboard() {
  const [cases, setCases] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [c, a] = await Promise.all([
          api.getCounselorCases(),
          api.getRiskAlerts()
        ]);
        setCases(c);
        setAlerts(a);
      } catch (err) {
        console.error("Error fetching counselor data:", err);
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
            Counselor <span className="gradient-text">Guardian</span>
          </h1>
          <p className="text-gray-400 mt-1 font-medium italic">Empathetic safeguarding and student support management</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/counselor/safeguarding">
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all font-bold text-sm uppercase tracking-widest">
              <Shield className="w-4 h-4 text-teal-400" /> Safeguarding Logs
            </button>
          </Link>
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-lumina-primary text-black font-bold text-sm hover:scale-105 transition-all shadow-gold-glow">
             New Session Request
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Risk Alerts & Cases */}
        <div className="lg:col-span-2 space-y-8">
           {/* High-Risk Alerts */}
           <GlassCard className="p-8 border-l-4 border-l-rose-500/50">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-rose-500/10">
                    <AlertCircle className="w-6 h-6 text-rose-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white lowercase tracking-tighter">Critical Alerts</h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Immediate attention required</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold border border-rose-500/20 uppercase tracking-widest">
                  {loading ? '...' : alerts.length} Active
                </span>
              </div>

              <div className="space-y-4">
                {loading ? (
                    <div className="h-32 bg-white/5 rounded-3xl animate-pulse"></div>
                ) : alerts.length > 0 ? (
                  alerts.map((alert, idx) => (
                    <div key={idx} className="flex items-start gap-5 p-5 rounded-2xl glass-v2 border-white/5 hover:bg-rose-500/[0.03] transition-all group border-l-2 border-l-rose-500/20">
                      <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center font-bold text-rose-400 text-lg uppercase">
                         {alert.student_initials || 'S'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-white text-base truncate lowercase tracking-tighter">Event Detected: {alert.type || 'Sentiment Dip'}</h4>
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{alert.timestamp || '2m ago'}</span>
                        </div>
                        <p className="text-xs text-gray-400 font-medium line-clamp-2 italic leading-relaxed">
                          AI flagged unusual activity patterns in peer communications. Potential burnout indicators detected.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                         <button className="p-2.5 rounded-xl bg-rose-500 text-white font-bold text-[10px] hover:scale-105 transition-all uppercase tracking-widest">
                            Reveal
                         </button>
                         <button className="p-2.5 rounded-xl bg-white/5 text-gray-500 hover:text-white transition-all border border-white/5">
                            <MoreVertical className="w-4 h-4" />
                         </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center text-center opacity-40 italic font-display text-gray-500">
                    No critical risk alerts at this time.
                  </div>
                )}
              </div>
           </GlassCard>

           {/* Active Caseload */}
           <GlassCard className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-teal-500/10">
                    <Users className="w-6 h-6 text-teal-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white lowercase tracking-tighter">Active Caseload</h2>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                  <input 
                    type="text" 
                    placeholder="Search cases..." 
                    className="pl-9 pr-4 py-2 rounded-xl glass-v2 border-white/10 text-[10px] text-white focus:outline-none w-48 shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-24 bg-white/5 rounded-3xl animate-pulse"></div>)
                ) : cases.length > 0 ? (
                  cases.map((scase, idx) => (
                    <div key={idx} className="flex items-center gap-5 p-5 rounded-3xl glass-v2 border-white/5 hover:border-teal-500/20 transition-all group">
                       <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center font-bold text-white text-xl uppercase shadow-inner border border-white/5">
                          {scase.student_initials || 'J'}
                       </div>
                       <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white text-lg lowercase tracking-tighter mb-0.5">Assigned ID: {scase.case_id || 'C-1204'}</h4>
                          <div className="flex items-center gap-4">
                             <div className="flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5 text-teal-400" />
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Active Monitoring</span>
                             </div>
                             <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-teal-400" />
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Next 2D</span>
                             </div>
                          </div>
                       </div>
                       <Link href="/counselor/notes">
                         <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-all group-hover:border-teal-500/30">
                            <Lock className="w-3.5 h-3.5 text-teal-400" /> Open Secure Notes
                         </button>
                       </Link>
                    </div>
                  ))
                ) : (
                  <div className="h-32 flex flex-col items-center justify-center text-center opacity-40 font-display text-gray-600">
                    No active counseling cases assigned.
                  </div>
                )}
              </div>
           </GlassCard>
        </div>

        {/* Analytics Sidebar */}
        <div className="space-y-8">
           <GlassCard className="p-8">
              <h2 className="text-xl font-bold text-white mb-8 lowercase tracking-tighter">Sentiment Flux</h2>
              <div className="h-48">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sentimentTrend}>
                       <defs>
                          <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3} />
                             <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                          </linearGradient>
                       </defs>
                       <XAxis dataKey="day" hide />
                       <YAxis hide />
                       <Tooltip 
                          content={({ active, payload }) => {
                             if (active && payload && payload.length) {
                                return (
                                   <div className="p-2 rounded-lg bg-black/80 border border-white/10 text-[10px] font-bold text-white">
                                      {payload[0].value}% Positivity
                                   </div>
                                );
                             }
                             return null;
                          }}
                       />
                       <Area type="monotone" dataKey="sentiment" stroke="#2dd4bf" fillOpacity={1} fill="url(#colorSentiment)" strokeWidth={3} />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
              <div className="mt-6 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-teal-400" />
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">+12% vs LW</span>
                 </div>
                 <span className="text-[10px] text-gray-500 font-medium italic">Avg Sentiment: 74.0</span>
              </div>
           </GlassCard>

           <GlassCard className="p-8">
              <h2 className="text-xl font-bold text-white mb-8 lowercase tracking-tighter">Cohort Wellness</h2>
              <div className="h-56 flex items-center justify-center">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie
                          data={riskDistributionData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                       >
                          {riskDistributionData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                          ))}
                       </Pie>
                       <Tooltip />
                    </PieChart>
                 </ResponsiveContainer>
              </div>
              <div className="space-y-3 mt-4">
                 {riskDistributionData.map((risk) => (
                    <div key={risk.name} className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: risk.color }}></div>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{risk.name}</span>
                       </div>
                       <span className="text-[10px] text-white font-bold">{risk.value}%</span>
                    </div>
                 ))}
              </div>
           </GlassCard>

           <GlassCard className="p-8 bg-gradient-to-br from-teal-500/10 to-transparent">
              <div className="flex items-center gap-3 mb-4">
                 <Info className="w-5 h-5 text-teal-400" />
                 <h3 className="font-bold text-white text-sm lowercase tracking-tighter">Proactive Message</h3>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed font-medium italic mb-6">
                 "Consider a mindfulness workshop for the Year 3 CS cohort—early indicators suggest mounting stress levels."
              </p>
              <button className="w-full py-2.5 rounded-xl border border-white/10 text-[10px] font-bold text-white hover:bg-white/5 transition-all uppercase tracking-widest">
                 Draft Suggestion
              </button>
           </GlassCard>
        </div>
      </div>
    </div>
  );
}

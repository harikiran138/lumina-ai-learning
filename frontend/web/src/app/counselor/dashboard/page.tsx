"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  AlertCircle,
  Users,
  Activity,
  Search,
  Lock,
  Clock,
  TrendingUp,
  Info,
  AlertTriangle,
  Calendar,
  MessageSquare,
  Share2,
  Zap,
  UserCheck,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { ClientOnlyChart } from '@/components/charts/ClientOnlyChart';
import Link from 'next/link';

const GlassCard: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className={cn(
      'rounded-3xl border border-white/5 bg-white/[0.03] backdrop-blur-2xl shadow-premium overflow-hidden',
      className
    )}
  >
    {children}
  </motion.div>
);

const riskDistributionData = [
  { name: 'Low',      value: 65, color: '#14B8A6' },
  { name: 'Moderate', value: 25, color: '#F59E0B' },
  { name: 'High',     value: 10, color: '#ef4444' },
];

const sentimentTrend = [
  { day: 'Mon', sentiment: 72 },
  { day: 'Tue', sentiment: 68 },
  { day: 'Wed', sentiment: 75 },
  { day: 'Thu', sentiment: 64 },
  { day: 'Fri', sentiment: 80 },
  { day: 'Sat', sentiment: 78 },
  { day: 'Sun', sentiment: 82 },
];

const behaviorTrendData = [
  { week: 'W1', logins: 5, studyTime: 12, activity: 8 },
  { week: 'W2', logins: 4, studyTime: 10, activity: 6 },
  { week: 'W3', logins: 2, studyTime: 5,  activity: 3 },
  { week: 'W4', logins: 1, studyTime: 2,  activity: 1 },
];

const riskFeed = [
  { name: 'Rahul M.',  score: 82, dept: 'CS',    year: '3rd', color: '#ef4444', badge: '🔴' },
  { name: 'Sneha P.',  score: 67, dept: 'ECE',   year: '2nd', color: '#F59E0B', badge: '🟠' },
  { name: 'Arjun K.',  score: 45, dept: 'Mech',  year: '1st', color: '#eab308', badge: '🟡' },
  { name: 'Priya S.',  score: 38, dept: 'CS',    year: '4th', color: '#eab308', badge: '🟡' },
  { name: 'Vikram T.', score: 29, dept: 'Civil', year: '2nd', color: '#14B8A6', badge: '🟢' },
];

const staticAlerts = [
  { id: 1, type: 'No activity for 3+ days',       student: 'Rahul M.',  severity: 'high',   time: '2h ago' },
  { id: 2, type: 'Assignment missing (3 tasks)',   student: 'Sneha P.',  severity: 'high',   time: '4h ago' },
  { id: 3, type: 'Sudden engagement drop (−62%)',  student: 'Arjun K.',  severity: 'medium', time: '6h ago' },
  { id: 4, type: 'Login streak broken (7 days)',   student: 'Priya S.',  severity: 'medium', time: '1d ago' },
];

const summaryCards = [
  { label: 'Total At-Risk',     value: 18, icon: Users,         color: 'text-white',       bg: 'bg-white/5' },
  { label: 'High Risk',         value: 5,  icon: AlertCircle,   color: 'text-red-400',     bg: 'bg-red-500/10' },
  { label: 'Moderate Risk',     value: 8,  icon: AlertTriangle, color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  { label: 'Recently Improved', value: 4,  icon: UserCheck,     color: 'text-teal-400',    bg: 'bg-teal-500/10' },
];

export default function CounselorDashboard() {
  const [cases, setCases]   = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [c, a] = await Promise.all([
          api.getCounselorCases(),
          api.getRiskAlerts(),
        ]);
        setCases(c);
        setAlerts(a);
      } catch (err) {
        console.error('Error fetching counselor data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            Counselor <span className="gradient-text">Guardian</span>
          </h1>
          <p className="text-gray-400 mt-1 font-medium italic">
            Empathetic safeguarding and student wellbeing management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/counselor/safeguarding">
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all font-bold text-sm uppercase tracking-widest">
              <Shield className="w-4 h-4 text-lumina-highlight" /> Safeguarding Logs
            </button>
          </Link>
          <Link href="/counselor/interventions">
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-lumina-highlight text-black font-bold text-sm hover:scale-105 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              <Zap className="w-4 h-4" /> New Session
            </button>
          </Link>
        </div>
      </div>

      {/* ── At-Risk Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <GlassCard key={card.label} className="p-6">
            <div className="flex items-center gap-4">
              <div className={cn('p-3 rounded-2xl', card.bg)}>
                <card.icon className={cn('w-5 h-5', card.color)} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{card.label}</p>
                <p className="text-3xl font-black text-white mt-0.5">{card.value}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Main panel ── */}
        <div className="lg:col-span-2 space-y-8">

          {/* Risk Feed */}
          <GlassCard className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-red-500/10">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white lowercase tracking-tighter">Risk Feed</h2>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Sorted by risk score</p>
                </div>
              </div>
              <Link href="/counselor/at-risk">
                <button className="text-[10px] font-bold text-lumina-highlight uppercase tracking-widest hover:underline">
                  View All →
                </button>
              </Link>
            </div>
            <div className="space-y-3">
              {riskFeed.map((student, idx) => (
                <div
                  key={student.name}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group"
                >
                  <span className="text-sm font-bold text-gray-600 w-5 shrink-0">{idx + 1}.</span>
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-white text-xs uppercase shrink-0">
                    {student.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm">{student.name}</p>
                    <p className="text-[10px] text-gray-500 font-medium">{student.dept} · {student.year} Year</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${student.score}%`, backgroundColor: student.color }}
                      />
                    </div>
                    <span className="text-sm font-black" style={{ color: student.color }}>
                      {student.badge} {student.score}%
                    </span>
                  </div>
                  <Link href="/counselor/interventions">
                    <button className="opacity-0 group-hover:opacity-100 px-3 py-1.5 rounded-xl bg-lumina-highlight/10 text-lumina-highlight text-[10px] font-bold uppercase tracking-widest transition-all border border-lumina-highlight/20">
                      Intervene
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Behavior Trend Graphs */}
          <GlassCard className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-lumina-highlight/10">
                <Activity className="w-5 h-5 text-lumina-highlight" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white lowercase tracking-tighter">Behavior Trends</h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                  Login frequency · Study time · Activity drop
                </p>
              </div>
            </div>
            <div className="h-48">
              <ClientOnlyChart>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={behaviorTrendData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="week" tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 11 }}
                      labelStyle={{ color: '#fff', fontWeight: 700 }}
                    />
                    <Bar dataKey="logins"    fill="#F59E0B" radius={[4, 4, 0, 0]} name="Logins" />
                    <Bar dataKey="studyTime" fill="#14B8A6" radius={[4, 4, 0, 0]} name="Study hrs" />
                    <Bar dataKey="activity"  fill="#6366f1" radius={[4, 4, 0, 0]} name="Activity" />
                  </BarChart>
                </ResponsiveContainer>
              </ClientOnlyChart>
            </div>
            <div className="flex items-center gap-6 mt-4">
              {([['#F59E0B', 'Logins'], ['#14B8A6', 'Study Time'], ['#6366f1', 'Activity']] as const).map(([color, label]) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{label}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Alerts Panel */}
          <GlassCard className="p-8 border-l-4 border-l-red-500/40">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-red-500/10">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white lowercase tracking-tighter">Alerts Panel</h2>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Real-time risk signals</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold border border-red-500/20 uppercase tracking-widest">
                {loading ? '...' : staticAlerts.length + alerts.length} Signals
              </span>
            </div>
            <div className="space-y-3">
              {staticAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                  <span className={cn(
                    'w-2 h-2 rounded-full shrink-0',
                    alert.severity === 'high'
                      ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                      : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
                  )} />
                  <p className="flex-1 text-sm font-medium text-gray-300">
                    <span className="font-bold text-white">{alert.student}</span> — {alert.type}
                  </p>
                  <span className="text-[10px] text-gray-600 font-medium shrink-0">{alert.time}</span>
                </div>
              ))}
              {!loading && alerts.map((alert, idx) => (
                <div key={`api-${idx}`} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  <p className="flex-1 text-sm font-medium text-gray-300">{alert.type || 'Risk Alert'}</p>
                  <span className="text-[10px] text-gray-600 font-medium">{alert.timestamp || 'Just now'}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard className="p-8">
            <h2 className="text-xl font-bold text-white lowercase tracking-tighter mb-6">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {([
                { label: 'Schedule Session', icon: Calendar,     href: '/counselor/interventions', color: 'bg-lumina-highlight/10 text-lumina-highlight border-lumina-highlight/20' },
                { label: 'Add Note',         icon: Lock,          href: '/counselor/notes',         color: 'bg-white/5 text-gray-300 border-white/10' },
                { label: 'Refer Case',       icon: Share2,        href: '/counselor/referrals',     color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
                { label: 'Contact Faculty',  icon: MessageSquare, href: '/counselor/communication', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
              ] as const).map((action) => (
                <Link key={action.label} href={action.href}>
                  <button className={cn(
                    'w-full flex flex-col items-center gap-3 p-5 rounded-2xl border font-bold text-[10px] uppercase tracking-widest hover:scale-[1.03] transition-all',
                    action.color,
                  )}>
                    <action.icon className="w-5 h-5" />
                    {action.label}
                  </button>
                </Link>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* ── Right sidebar analytics ── */}
        <div className="space-y-8">
          {/* Sentiment Flux */}
          <GlassCard className="p-8">
            <h2 className="text-xl font-bold text-white mb-6 lowercase tracking-tighter">Sentiment Flux</h2>
            <div className="h-44">
              <ClientOnlyChart>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sentimentTrend}>
                    <defs>
                      <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" hide />
                    <YAxis hide />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload?.length) {
                          return (
                            <div className="p-2 rounded-lg bg-black/80 border border-white/10 text-[10px] font-bold text-white">
                              {payload[0].value}% Positivity
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="sentiment" stroke="#F59E0B" fillOpacity={1} fill="url(#colorSentiment)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </ClientOnlyChart>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-lumina-highlight" />
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">+12% vs LW</span>
              </div>
              <span className="text-[10px] text-gray-500 font-medium italic">Avg: 74.0</span>
            </div>
          </GlassCard>

          {/* Cohort Wellness */}
          <GlassCard className="p-8">
            <h2 className="text-xl font-bold text-white mb-6 lowercase tracking-tighter">Cohort Wellness</h2>
            <div className="h-48 flex items-center justify-center">
              <ClientOnlyChart>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskDistributionData}
                      innerRadius={55}
                      outerRadius={75}
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
              </ClientOnlyChart>
            </div>
            <div className="space-y-2 mt-2">
              {riskDistributionData.map((risk) => (
                <div key={risk.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: risk.color }} />
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{risk.name}</span>
                  </div>
                  <span className="text-[10px] text-white font-bold">{risk.value}%</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Active Caseload */}
          <GlassCard className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white lowercase tracking-tighter">Active Caseload</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-8 pr-3 py-1.5 rounded-xl glass-v2 border-white/10 text-[10px] text-white focus:outline-none w-28 shadow-inner"
                />
              </div>
            </div>
            <div className="space-y-3">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />
                ))
              ) : cases.length > 0 ? (
                cases.map((scase, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-lumina-highlight/20 transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-white text-xs uppercase border border-white/5">
                      {scase.student_initials || 'J'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-xs lowercase tracking-tighter truncate">Case {scase.case_id || 'C-120'}</p>
                      <p className="text-[9px] text-gray-600 font-medium">Active Monitoring</p>
                    </div>
                    <Link href="/counselor/notes">
                      <button className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                        <Lock className="w-3.5 h-3.5 text-lumina-highlight" />
                      </button>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center opacity-30 italic text-xs text-gray-500">
                  No active cases assigned.
                </div>
              )}
            </div>
          </GlassCard>

          {/* Proactive Suggestion */}
          <GlassCard className="p-8 bg-gradient-to-br from-lumina-highlight/10 to-transparent">
            <div className="flex items-center gap-3 mb-4">
              <Info className="w-5 h-5 text-lumina-highlight" />
              <h3 className="font-bold text-white text-sm lowercase tracking-tighter">Proactive Message</h3>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed font-medium italic mb-6">
              "Consider a mindfulness workshop for the Year 3 CS cohort — early indicators suggest mounting stress levels."
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

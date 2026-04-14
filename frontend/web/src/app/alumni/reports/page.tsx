"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, Calendar, Star, Award, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

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

const SESSION_DATA = [
  { month: 'Jan', sessions: 3 },
  { month: 'Feb', sessions: 5 },
  { month: 'Mar', sessions: 4 },
  { month: 'Apr', sessions: 7 },
  { month: 'May', sessions: 6 },
  { month: 'Jun', sessions: 9 },
];

const IMPACT_DATA = [
  { month: 'Jan', score: 55 },
  { month: 'Feb', score: 62 },
  { month: 'Mar', score: 70 },
  { month: 'Apr', score: 74 },
  { month: 'May', score: 80 },
  { month: 'Jun', score: 88 },
];

const CONTRIBUTION_ITEMS = [
  { label: 'Mentorship Sessions',     value: '24',    icon: Calendar,  color: 'text-amber-400' },
  { label: 'Mock Interviews',         value: '18',    icon: Users,     color: 'text-purple-400' },
  { label: 'Job Posts',               value: '7',     icon: BarChart3, color: 'text-blue-400' },
  { label: 'Curriculum Feedbacks',    value: '12',    icon: Star,      color: 'text-green-400' },
  { label: 'Avg Feedback Score',      value: '4.8',   icon: Award,     color: 'text-amber-400' },
  { label: 'Impact Score',            value: '88/100',icon: TrendingUp,color: 'text-green-400' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-black/80 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white">
        {label}: {payload[0].value}
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            My <span className="gradient-text">Reports</span>
          </h1>
          <p className="text-gray-400 mt-1 font-medium italic">Track your sessions, impact, and contribution to the Lumina ecosystem</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white text-sm font-bold uppercase tracking-widest transition-all w-fit">
          <Download className="w-4 h-4 text-amber-400" /> Export Report
        </button>
      </div>

      {/* Contribution Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {CONTRIBUTION_ITEMS.map((item, i) => (
          <GlassCard key={i} className="p-5">
            <item.icon className={cn("w-5 h-5 mb-3", item.color)} />
            <p className="text-2xl font-display font-bold text-white">{item.value}</p>
            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">{item.label}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sessions Chart */}
        <GlassCard className="p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Sessions Conducted</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={SESSION_DATA} barSize={24}>
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="sessions" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Impact Score Chart */}
        <GlassCard className="p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Impact Score Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={IMPACT_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} domain={[40, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="score" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Contribution Level */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">Contribution Level</h3>
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-widest">
            Level 4 — Industry Ambassador
          </span>
        </div>
        <div className="space-y-4">
          {[
            { label: 'Mentoring',   pct: 82, color: 'bg-amber-500' },
            { label: 'Interviewing', pct: 72, color: 'bg-purple-500' },
            { label: 'Job Posting', pct: 55, color: 'bg-blue-500' },
            { label: 'Feedback',    pct: 90, color: 'bg-green-500' },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                <span>{item.label}</span>
                <span>{item.pct}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full', item.color)} style={{ width: `${item.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

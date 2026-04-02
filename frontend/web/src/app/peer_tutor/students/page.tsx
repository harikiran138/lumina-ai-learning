"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, TrendingUp, AlertTriangle, Search, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const GlassCard: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
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

const students = [
  { id: 1, name: 'Arjun S.',   year: '1st year', subject: 'Data Structures', progress: 42, status: 'weak',   sessions: 3,  lastSeen: '1h ago' },
  { id: 2, name: 'Priya K.',   year: '2nd year', subject: 'JavaScript',      progress: 71, status: 'average', sessions: 6, lastSeen: '3h ago' },
  { id: 3, name: 'Rohan T.',   year: '3rd year', subject: 'Machine Learning', progress: 88, status: 'strong', sessions: 8, lastSeen: 'Yesterday' },
  { id: 4, name: 'Neha R.',    year: '1st year', subject: 'Algorithms',       progress: 55, status: 'average', sessions: 4, lastSeen: '2h ago' },
  { id: 5, name: 'Karan M.',   year: '2nd year', subject: 'Physics',          progress: 30, status: 'weak',   sessions: 2, lastSeen: '5h ago' },
  { id: 6, name: 'Ananya B.',  year: '3rd year', subject: 'Networks',         progress: 92, status: 'strong', sessions: 10, lastSeen: '30m ago' },
];

const statusColor: Record<string, string> = {
  weak:    'bg-red-500/10 text-red-400 border-red-500/20',
  average: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  strong:  'bg-green-500/10 text-green-400 border-green-500/20',
};

const progressColor: Record<string, string> = {
  weak:    'bg-red-500',
  average: 'bg-amber-500',
  strong:  'bg-green-500',
};

export default function MyStudentsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'weak' | 'average' | 'strong'>('all');

  const filtered = students.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.subject.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || s.status === filter;
    return matchSearch && matchFilter;
  });

  const weakCount = students.filter((s) => s.status === 'weak').length;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            My <span className="gradient-text">Students</span>
          </h1>
          <p className="text-gray-400 mt-1 font-medium italic">Track mentee progress · identify weak students · offer targeted help</p>
        </div>
        {weakCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
            <AlertTriangle className="w-4 h-4" /> {weakCount} students need attention
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5">
        {[
          { label: 'Total Mentees',    value: String(students.length), icon: GraduationCap, color: 'text-lumina-primary' },
          { label: 'Improving',        value: String(students.filter(s => s.status !== 'weak').length), icon: TrendingUp, color: 'text-green-400' },
          { label: 'Need Attention',   value: String(weakCount),       icon: AlertTriangle, color: 'text-red-400' },
        ].map((s) => (
          <GlassCard key={s.label} className="p-6">
            <s.icon className={cn('w-5 h-5 mb-3', s.color)} />
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">{s.label}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/5">
            {(['all', 'weak', 'average', 'strong'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all',
                  filter === f ? 'bg-lumina-primary text-black' : 'text-gray-500 hover:text-white'
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/5 text-sm text-white placeholder-gray-600 outline-none focus:border-white/20 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filtered.map((s) => (
            <div key={s.id} className="flex items-center gap-5 p-5 rounded-2xl glass-v2 border border-white/5 hover:border-white/10 transition-all">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center font-bold text-white text-base shrink-0">
                {s.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-bold text-white text-sm">{s.name}</span>
                  <span className="text-[10px] text-gray-600">{s.year}</span>
                  <span className={cn('px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider border', statusColor[s.status])}>
                    {s.status}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">{s.subject}</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden max-w-[200px]">
                    <div className={cn('h-full rounded-full transition-all duration-700', progressColor[s.status])} style={{ width: `${s.progress}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-500 font-bold">{s.progress}%</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[11px] text-gray-500">{s.sessions} sessions</p>
                <p className="text-[10px] text-gray-600 mt-0.5">Last: {s.lastSeen}</p>
              </div>
              <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-colors flex items-center gap-1.5 shrink-0">
                View <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

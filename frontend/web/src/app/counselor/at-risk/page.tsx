"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  Search,
  Zap,
  Share2,
  Clock,
  TrendingDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const GlassCard: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className={cn('rounded-3xl border border-white/5 bg-white/[0.03] backdrop-blur-2xl shadow-premium overflow-hidden', className)}
  >
    {children}
  </motion.div>
);

const students = [
  { id: 'STU-001', name: 'Rahul Mehta',   dept: 'CS',    year: '3rd', score: 82, trend: -18, lastActive: '3 days ago', severity: 'high' },
  { id: 'STU-002', name: 'Sneha Patel',   dept: 'ECE',   year: '2nd', score: 67, trend: -12, lastActive: '1 day ago',  severity: 'high' },
  { id: 'STU-003', name: 'Arjun Kumar',   dept: 'Mech',  year: '1st', score: 45, trend:  -8, lastActive: '5 hrs ago',  severity: 'moderate' },
  { id: 'STU-004', name: 'Priya Sharma',  dept: 'CS',    year: '4th', score: 38, trend:  -5, lastActive: '2 hrs ago',  severity: 'moderate' },
  { id: 'STU-005', name: 'Kiran Desai',   dept: 'MBA',   year: '1st', score: 34, trend:  -3, lastActive: '30 min ago', severity: 'moderate' },
  { id: 'STU-006', name: 'Amit Singh',    dept: 'Civil', year: '3rd', score: 28, trend:  +4, lastActive: '1 hr ago',   severity: 'low' },
  { id: 'STU-007', name: 'Vikram Tiwari', dept: 'Civil', year: '2nd', score: 22, trend:  +9, lastActive: 'Just now',   severity: 'low' },
];

const severityConfig: Record<string, { label: string; color: string; dot: string; hex: string }> = {
  high:     { label: 'High',     color: 'bg-red-500/10 text-red-400 border-red-500/20',       dot: 'bg-red-500',    hex: '#ef4444' },
  moderate: { label: 'Moderate', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-500',  hex: '#F59E0B' },
  low:      { label: 'Low',      color: 'bg-teal-500/10 text-teal-400 border-teal-500/20',     dot: 'bg-teal-500',   hex: '#14B8A6' },
};

export default function AtRiskStudents() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'high' | 'moderate' | 'low'>('all');

  const filtered = students.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.dept.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || s.severity === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            At-Risk <span className="gradient-text">Students</span>
          </h1>
          <p className="text-gray-400 mt-1 font-medium italic">Priority list sorted by risk score — act early, act often</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {(['high', 'moderate', 'low'] as const).map((sev) => {
          const count = students.filter((s) => s.severity === sev).length;
          const cfg   = severityConfig[sev];
          return (
            <div key={sev} className="cursor-pointer" onClick={() => setFilter(sev)}>
            <GlassCard className="p-6">
              <div className="flex items-center gap-3">
                <span className={cn('w-3 h-3 rounded-full shrink-0', cfg.dot)} />
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{cfg.label} Risk</p>
                  <p className="text-3xl font-black text-white">{count}</p>
                </div>
              </div>
            </GlassCard>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input
            type="text"
            placeholder="Search by name or department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl glass-v2 border-white/10 text-sm text-white focus:outline-none focus:border-lumina-highlight/40 transition-all font-medium shadow-inner"
          />
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'high', 'moderate', 'low'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all',
                filter === f
                  ? 'bg-lumina-highlight/10 text-lumina-highlight border-lumina-highlight/30'
                  : 'bg-white/5 text-gray-500 border-white/10 hover:text-white',
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Student List */}
      <div className="space-y-4">
        {filtered.map((student, idx) => {
          const cfg = severityConfig[student.severity];
          return (
            <GlassCard key={student.id} className="p-6 hover:border-white/10 transition-all">
              <div className="flex flex-col md:flex-row md:items-center gap-5">
                <span className="text-lg font-bold text-gray-700 w-6 shrink-0 hidden md:block">{idx + 1}.</span>
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center font-bold text-white text-base uppercase shrink-0">
                  {student.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-bold text-white text-lg">{student.name}</h3>
                    <span className={cn('px-2 py-0.5 rounded-lg text-[10px] font-bold border uppercase tracking-widest', cfg.color)}>
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 flex-wrap">
                    <span className="text-[10px] text-gray-500 font-medium">{student.dept} · {student.year} Year</span>
                    <span className="text-[10px] text-gray-600 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Last active {student.lastActive}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-1">Risk Score</p>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${student.score}%`, backgroundColor: cfg.hex }} />
                      </div>
                      <span className="text-sm font-black text-white">{student.score}%</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-1">Trend</p>
                    <span className={cn('text-sm font-black flex items-center gap-1', student.trend < 0 ? 'text-red-400' : 'text-teal-400')}>
                      <TrendingDown className="w-3.5 h-3.5" />
                      {student.trend > 0 ? '+' : ''}{student.trend}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/counselor/interventions">
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-lumina-highlight/10 text-lumina-highlight text-[10px] font-bold border border-lumina-highlight/20 uppercase tracking-widest hover:bg-lumina-highlight/20 transition-all">
                      <Zap className="w-3.5 h-3.5" /> Act
                    </button>
                  </Link>
                  <Link href="/counselor/referrals">
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 text-gray-400 text-[10px] font-bold border border-white/10 uppercase tracking-widest hover:text-white transition-all">
                      <Share2 className="w-3.5 h-3.5" /> Refer
                    </button>
                  </Link>
                </div>
              </div>
            </GlassCard>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-16 text-center opacity-30 italic text-gray-500">No students match the current filters.</div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  Search,
  Zap,
  Share2,
  Clock,
  TrendingDown,
  RefreshCw,
  Loader2,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const GlassCard: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className={cn('rounded-3xl border border-border bg-surface-elevated shadow-premium overflow-hidden', className)}
  >
    {children}
  </motion.div>
);

interface AtRiskStudent {
  id: string;
  name: string;
  dept: string;
  year: string;
  score: number;
  trend: number;
  lastActive: string;
  severity: 'high' | 'moderate' | 'low';
}

const DEMO_STUDENTS: AtRiskStudent[] = [
  { id: 'STU-001', name: 'Rahul Mehta',   dept: 'CS',    year: '3rd', score: 82, trend: -18, lastActive: '3 days ago', severity: 'high' },
  { id: 'STU-002', name: 'Sneha Patel',   dept: 'ECE',   year: '2nd', score: 67, trend: -12, lastActive: '1 day ago',  severity: 'high' },
  { id: 'STU-003', name: 'Arjun Kumar',   dept: 'Mech',  year: '1st', score: 45, trend:  -8, lastActive: '5 hrs ago',  severity: 'moderate' },
  { id: 'STU-004', name: 'Priya Sharma',  dept: 'CS',    year: '4th', score: 38, trend:  -5, lastActive: '2 hrs ago',  severity: 'moderate' },
  { id: 'STU-005', name: 'Kiran Desai',   dept: 'MBA',   year: '1st', score: 34, trend:  -3, lastActive: '30 min ago', severity: 'moderate' },
  { id: 'STU-006', name: 'Amit Singh',    dept: 'Civil', year: '3rd', score: 28, trend:  +4, lastActive: '1 hr ago',   severity: 'low' },
  { id: 'STU-007', name: 'Vikram Tiwari', dept: 'Civil', year: '2nd', score: 22, trend:  +9, lastActive: 'Just now',   severity: 'low' },
];

const severityConfig: Record<string, { label: string; color: string; dot: string; hex: string }> = {
  high:     { label: 'High',     color: 'bg-danger/10 text-danger border-danger/20',       dot: 'bg-danger',    hex: 'var(--color-danger)' },
  moderate: { label: 'Moderate', color: 'bg-warning/10 text-warning border-warning/20', dot: 'bg-warning',  hex: 'var(--color-warning)' },
  low:      { label: 'Low',      color: 'bg-success/10 text-success border-success/20',     dot: 'bg-success',   hex: 'var(--color-success)' },
};

function riskLevelToSeverity(level: string): AtRiskStudent['severity'] {
  if (level === 'critical' || level === 'high') return 'high';
  if (level === 'medium' || level === 'moderate') return 'moderate';
  return 'low';
}

async function fetchAtRiskStudents(): Promise<{ students: AtRiskStudent[]; isLive: boolean }> {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "/api";
    const res = await fetch(`${base}/counselor/students`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error(`${res.status}`);
    const data = await res.json();

    // Backend returns array of { student_id, risk_score?, risk_level?, name?, ... }
    const students: AtRiskStudent[] = (Array.isArray(data) ? data : []).map((item: any, idx: number) => ({
      id: item.student_id || item.id || `STU-${idx + 1}`,
      name: item.name || item.student_name || `Student ${idx + 1}`,
      dept: item.department || item.dept || '—',
      year: item.year || '—',
      score: typeof item.risk_score === 'number' ? Math.round(item.risk_score * 100) : 50,
      trend: item.trend || 0,
      lastActive: item.last_active || item.lastActive || 'Unknown',
      severity: riskLevelToSeverity(item.risk_level || item.severity || 'low'),
    }));

    return { students: students.length > 0 ? students : DEMO_STUDENTS, isLive: students.length > 0 };
  } catch {
    return { students: DEMO_STUDENTS, isLive: false };
  }
}

export default function AtRiskStudents() {
  const [students, setStudents] = useState<AtRiskStudent[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'high' | 'moderate' | 'low'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchAtRiskStudents();
    setStudents(result.students);
    setIsLive(result.isLive);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = students.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.dept.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || s.severity === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
            At-Risk <span className="gradient-text">Students</span>
          </h1>
          <p className="text-text-muted mt-1 font-medium italic">Priority list sorted by risk score — act early, act often</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-xs text-text-muted hover:text-foreground transition-all disabled:opacity-50"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Data source banner */}
      <div className={cn(
        "rounded-2xl border px-5 py-3 flex items-center gap-3 text-sm",
        isLive
          ? "border-success/20 bg-success/10 text-success"
          : "border-warning/20 bg-warning/10 text-warning",
      )}>
        <Info className="w-4 h-4 shrink-0" />
        {isLive
          ? "Live data — showing students assigned to your counseling queue."
          : "Demo mode — connect the risk assessment service to see live student data."}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-3 text-text-muted">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading at-risk students...</span>
        </div>
      )}

      {!loading && (
        <>
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
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{cfg.label} Risk</p>
                        <p className="text-3xl font-black text-foreground">{count}</p>
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
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              
              <input
                type="text"
                placeholder="Search by name or department…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl glass-v2 border-border text-sm text-foreground focus:outline-none focus:border-primary transition-all font-medium shadow-inner"
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
                      : 'bg-surface text-text-muted border-border hover:text-foreground',
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
                <GlassCard key={student.id} className="p-6 hover:border-border transition-all">
                  <div className="flex flex-col md:flex-row md:items-center gap-5">
                    <span className="text-lg font-bold text-text-secondary w-6 shrink-0 hidden md:block">{idx + 1}.</span>
                    <div className="w-12 h-12 rounded-2xl bg-surface border border-border flex items-center justify-center font-bold text-foreground text-base uppercase shrink-0">
                      {student.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-bold text-foreground text-lg">{student.name}</h3>
                        <span className={cn('px-2 py-0.5 rounded-lg text-[10px] font-bold border uppercase tracking-widest', cfg.color)}>
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 flex-wrap">
                        <span className="text-[10px] text-text-muted font-medium">{student.dept} · {student.year} Year</span>
                        <span className="text-[10px] text-text-muted font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Last active {student.lastActive}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest mb-1">Risk Score</p>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 rounded-full bg-border overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${student.score}%`, backgroundColor: cfg.hex }} />
                          </div>
                          <span className="text-sm font-black text-foreground">{student.score}%</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest mb-1">Trend</p>
                        <span className={cn('text-sm font-black flex items-center gap-1', student.trend < 0 ? 'text-danger' : 'text-success')}>
                          <TrendingDown className="w-3.5 h-3.5" />
                          {student.trend > 0 ? '+' : ''}{student.trend}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href="/counselor/interventions">
                        <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-bold border border-primary/20 uppercase tracking-widest hover:bg-primary/20 transition-all">
                          <Zap className="w-3.5 h-3.5" /> Act
                        </button>
                      </Link>
                      <Link href="/counselor/referrals">
                        <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface text-text-muted text-[10px] font-bold border border-border uppercase tracking-widest hover:text-foreground transition-all">
                          <Share2 className="w-3.5 h-3.5" /> Refer
                        </button>
                      </Link>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
            {filtered.length === 0 && (
              <div className="py-16 text-center opacity-30 italic text-text-muted">No students match the current filters.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

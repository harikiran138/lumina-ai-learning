"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart2,
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle2,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { cn } from '@/lib/utils';
import { ClientOnlyChart } from '@/components/charts/ClientOnlyChart';

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

const riskSummaryData = [
  { month: 'Jan', high: 6, moderate: 12, low: 28 },
  { month: 'Feb', high: 8, moderate: 14, low: 25 },
  { month: 'Mar', high: 5, moderate:  8, low: 32 },
  { month: 'Apr', high: 4, moderate:  6, low: 35 },
];

const interventionSuccessData = [
  { month: 'Jan', success: 60 },
  { month: 'Feb', success: 72 },
  { month: 'Mar', success: 78 },
  { month: 'Apr', success: 85 },
];

const summaryMetrics = [
  { label: 'Total At-Risk',          value: 18, icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', trend: -12 },
  { label: 'Interventions This Month',value: 24, icon: CheckCircle2, color: 'text-success',  bg: 'bg-success/10',  trend: +8  },
  { label: 'Success Rate',           value: '85%', icon: TrendingUp, color: 'text-success', bg: 'bg-success/10', trend: +7  },
  { label: 'Active Referrals',       value: 3,  icon: Users,       color: 'text-info', bg: 'bg-info/10',trend: 0  },
];

export default function Reports() {
  const [period, setPeriod] = useState<'week' | 'month' | 'term'>('month');

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
            Counselor <span className="gradient-text">Reports</span>
          </h1>
          <p className="text-text-muted mt-1 font-medium italic">Risk summaries · Intervention success rates · Trend reports</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-surface border border-border rounded-xl p-1">
            {(['week', 'month', 'term'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all',
                  period === p ? 'bg-primary text-primary-foreground' : 'text-text-muted hover:text-foreground',
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface border border-border text-text-muted hover:text-foreground transition-all font-bold text-sm uppercase tracking-widest">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryMetrics.map((m) => (
          <GlassCard key={m.label} className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn('p-2.5 rounded-xl', m.bg)}>
                <m.icon className={cn('w-4 h-4', m.color)} />
              </div>
            </div>
            <p className="text-3xl font-black text-foreground">{m.value}</p>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">{m.label}</p>
            <div className="flex items-center gap-1 mt-2">
              {m.trend > 0 ? <TrendingUp className="w-3 h-3 text-success" /> : m.trend < 0 ? <TrendingDown className="w-3 h-3 text-danger" /> : null}
              {m.trend !== 0 && (
                <span className={cn('text-[10px] font-bold', m.trend > 0 ? 'text-success' : 'text-danger')}>
                  {m.trend > 0 ? '+' : ''}{m.trend}% vs last {period}
                </span>
              )}
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Risk Summary */}
        <GlassCard className="p-8">
          <h3 className="text-lg font-bold text-foreground mb-1 lowercase tracking-tighter">Risk Summary</h3>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-6">Monthly risk distribution</p>
          <div className="h-52">
            <ClientOnlyChart>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskSummaryData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--color-text-muted)', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)', borderRadius: 12, fontSize: 11, color: 'var(--color-text)' }} />
                  <Bar dataKey="high"     fill="var(--color-danger)" radius={[4, 4, 0, 0]} name="High" />
                  <Bar dataKey="moderate" fill="var(--color-warning)" radius={[4, 4, 0, 0]} name="Moderate" />
                  <Bar dataKey="low"      fill="var(--color-success)" radius={[4, 4, 0, 0]} name="Low" />
                </BarChart>
              </ResponsiveContainer>
            </ClientOnlyChart>
          </div>
          <div className="flex items-center gap-5 mt-4">
            {([['var(--color-danger)', 'High'], ['var(--color-warning)', 'Moderate'], ['var(--color-success)', 'Low']] as const).map(([color, label]) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{label}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Intervention Success Rate */}
        <GlassCard className="p-8">
          <h3 className="text-lg font-bold text-foreground mb-1 lowercase tracking-tighter">Intervention Success Rate</h3>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-6">Monthly improvement trend (%)</p>
          <div className="h-52">
            <ClientOnlyChart>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={interventionSuccessData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--color-text-muted)', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)', borderRadius: 12, fontSize: 11, color: 'var(--color-text)' }} formatter={(v) => [`${v}%`, 'Success Rate']} />
                  <Line type="monotone" dataKey="success" stroke="var(--color-success)" strokeWidth={3} dot={{ fill: 'var(--color-success)', r: 4 }} name="Success %" />
                </LineChart>
              </ResponsiveContainer>
            </ClientOnlyChart>
          </div>
        </GlassCard>
      </div>

      {/* Downloadable report cards */}
      <GlassCard className="p-8">
        <h3 className="text-lg font-bold text-foreground mb-6 lowercase tracking-tighter">Available Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Risk Summary Report',          desc: 'Full breakdown of at-risk students by severity and department.',    date: 'Generated: 2026-04-01' },
            { title: 'Intervention Success Report',   desc: 'Outcome tracking for all counseling and support interventions.',    date: 'Generated: 2026-04-01' },
            { title: 'Trend Report (Last 3 Months)', desc: 'Behavioral and engagement trend analysis across the cohort.',       date: 'Generated: 2026-04-01' },
          ].map((report) => (
            <div key={report.title} className="p-6 rounded-2xl bg-surface border border-border hover:border-primary/20 transition-all">
              <BarChart2 className="w-5 h-5 text-primary mb-3" />
              <h4 className="font-bold text-foreground text-sm mb-1">{report.title}</h4>
              <p className="text-[10px] text-text-muted font-medium leading-relaxed mb-4">{report.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-text-muted font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {report.date}
                </span>
                <button className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">
                  <Download className="w-3 h-3" /> PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

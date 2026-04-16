"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  TrendingDown,
  TrendingUp,
  Clock,
  LogIn,
  BookOpen,
  MessageSquare,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
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

const loginFrequency = [
  { week: 'W1', logins: 6 },
  { week: 'W2', logins: 5 },
  { week: 'W3', logins: 3 },
  { week: 'W4', logins: 1 },
];

const studyTimeData = [
  { day: 'Mon', hours: 3.5 },
  { day: 'Tue', hours: 2.8 },
  { day: 'Wed', hours: 4.0 },
  { day: 'Thu', hours: 1.2 },
  { day: 'Fri', hours: 0.5 },
  { day: 'Sat', hours: 2.0 },
  { day: 'Sun', hours: 1.5 },
];

const activityDrop = [
  { week: 'W1', questions: 14, submissions: 8, peer: 5 },
  { week: 'W2', questions: 10, submissions: 6, peer: 4 },
  { week: 'W3', questions:  4, submissions: 2, peer: 1 },
  { week: 'W4', questions:  1, submissions: 0, peer: 0 },
];

const metrics = [
  { label: 'Avg Login / Week', value: '3.75', trend: -38, icon: LogIn,        color: 'text-warning',  bg: 'bg-warning/10' },
  { label: 'Avg Study Hours',  value: '2.2h', trend: -42, icon: Clock,        color: 'text-danger',    bg: 'bg-danger/10' },
  { label: 'Activity Score',   value: '34%',  trend: -28, icon: Activity,     color: 'text-info', bg: 'bg-info/10' },
  { label: 'Q&A Engagement',   value: '7.25', trend: -55, icon: MessageSquare,color: 'text-success',   bg: 'bg-success/10' },
];

export default function BehaviorAnalytics() {
  const [activeStudent, setActiveStudent] = useState('Rahul Mehta');

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
          Behavior <span className="gradient-text">Analytics</span>
        </h1>
        <p className="text-text-muted mt-1 font-medium italic">
          Pattern change detection — normal → deviation → risk
        </p>
      </div>

      {/* Student selector */}
      <div className="flex items-center gap-3 flex-wrap">
        {['Rahul Mehta', 'Sneha Patel', 'Arjun Kumar'].map((name) => (
          <button
            key={name}
            onClick={() => setActiveStudent(name)}
            className={cn(
              'px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all',
              activeStudent === name
                ? 'bg-lumina-highlight/10 text-lumina-highlight border-lumina-highlight/30'
                : 'bg-surface text-text-muted border-border hover:text-foreground',
            )}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <GlassCard key={m.label} className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn('p-2.5 rounded-xl', m.bg)}>
                <m.icon className={cn('w-4 h-4', m.color)} />
              </div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{m.label}</p>
            </div>
            <p className="text-3xl font-black text-foreground">{m.value}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <TrendingDown className="w-3.5 h-3.5 text-danger" />
              <span className="text-[10px] font-bold text-danger">{m.trend}% vs baseline</span>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Login Frequency */}
        <GlassCard className="p-8">
          <h3 className="text-lg font-bold text-foreground mb-1 lowercase tracking-tighter">Login Frequency</h3>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-6">Weekly logins over last 4 weeks</p>
          <div className="h-48">
            <ClientOnlyChart>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={loginFrequency}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="week" tick={{ fill: 'var(--color-text-muted)', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)', borderRadius: 12, fontSize: 11, color: 'var(--color-text)' }} />
                  <Bar dataKey="logins" fill="var(--color-warning)" radius={[6, 6, 0, 0]} name="Logins" />
                </BarChart>
              </ResponsiveContainer>
            </ClientOnlyChart>
          </div>
        </GlassCard>

        {/* Study Time */}
        <GlassCard className="p-8">
          <h3 className="text-lg font-bold text-foreground mb-1 lowercase tracking-tighter">Study Time</h3>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-6">Daily study hours this week</p>
          <div className="h-48">
            <ClientOnlyChart>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={studyTimeData}>
                  <defs>
                    <linearGradient id="studyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="var(--color-success)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="day" tick={{ fill: 'var(--color-text-muted)', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)', borderRadius: 12, fontSize: 11, color: 'var(--color-text)' }} />
                  <Area type="monotone" dataKey="hours" stroke="var(--color-success)" fill="url(#studyGrad)" strokeWidth={2} name="Hours" />
                </AreaChart>
              </ResponsiveContainer>
            </ClientOnlyChart>
          </div>
        </GlassCard>

        {/* Activity Drop */}
        <GlassCard className="p-8 lg:col-span-2">
          <h3 className="text-lg font-bold text-foreground mb-1 lowercase tracking-tighter">Activity Drop Analysis</h3>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-6">Questions, submissions & peer interactions over 4 weeks</p>
          <div className="h-48">
            <ClientOnlyChart>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityDrop}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="week" tick={{ fill: 'var(--color-text-muted)', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)', borderRadius: 12, fontSize: 11, color: 'var(--color-text)' }} />
                  <Line type="monotone" dataKey="questions"   stroke="var(--color-warning)" strokeWidth={2} dot={false} name="Questions" />
                  <Line type="monotone" dataKey="submissions" stroke="var(--color-danger)" strokeWidth={2} dot={false} name="Submissions" />
                  <Line type="monotone" dataKey="peer"        stroke="var(--color-info)" strokeWidth={2} dot={false} name="Peer Activity" />
                </LineChart>
              </ResponsiveContainer>
            </ClientOnlyChart>
          </div>
          <div className="flex items-center gap-6 mt-4">
            {([['var(--color-warning)', 'Questions'], ['var(--color-danger)', 'Submissions'], ['var(--color-info)', 'Peer Activity']] as const).map(([color, label]) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{label}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

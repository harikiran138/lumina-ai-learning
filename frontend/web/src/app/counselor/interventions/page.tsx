"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  BookOpen,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

const interventions = [
  { id: 'INT-001', student: 'Rahul Mehta',  type: 'Counseling Session', date: '2026-03-28', time: '10:00', outcome: 'improved',  notes: 'Engaged positively, set 2-week check-in plan.' },
  { id: 'INT-002', student: 'Sneha Patel',  type: 'Support Resources',  date: '2026-03-26', time: '14:30', outcome: 'same',      notes: 'Provided mental health toolkit; follow-up scheduled.' },
  { id: 'INT-003', student: 'Arjun Kumar',  type: 'Faculty Notification',date: '2026-03-25', time: '09:15', outcome: 'worse',    notes: 'Faculty informed; escalation to admin pending.' },
  { id: 'INT-004', student: 'Priya Sharma', type: 'Counseling Session', date: '2026-03-22', time: '11:00', outcome: 'improved',  notes: 'Student showed significant improvement in engagement.' },
];

const outcomeConfig: Record<string, { label: string; color: string; icon: React.FC<any> }> = {
  improved: { label: 'Improved', color: 'bg-success/10 text-success border-success/20',     icon: TrendingUp },
  same:     { label: 'Same',     color: 'bg-warning/10 text-warning border-warning/20',   icon: Minus },
  worse:    { label: 'Worse',    color: 'bg-danger/10 text-danger border-danger/20',         icon: TrendingDown },
};

const actionTypes = [
  { label: 'Schedule Counseling Session', icon: Calendar,     color: 'text-lumina-highlight', bg: 'bg-lumina-highlight/10 border-lumina-highlight/20' },
  { label: 'Assign Support Resources',    icon: BookOpen,     color: 'text-success',         bg: 'bg-success/10 border-success/20' },
  { label: 'Notify Faculty',              icon: Users,        color: 'text-info',        bg: 'bg-info/10 border-info/20' },
  { label: 'Send Message to Student',     icon: MessageSquare,color: 'text-warning',         bg: 'bg-warning/10 border-warning/20' },
];

export default function Interventions() {
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState('');

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
            Intervention <span className="gradient-text">Hub</span>
          </h1>
          <p className="text-text-muted mt-1 font-medium italic">Schedule, track, and measure counseling outcomes</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:scale-105 transition-all shadow-lg"
        >
          <Zap className="w-4 h-4" /> New Intervention
        </button>
      </div>

      {/* New Intervention Form */}
      {showForm && (
        <GlassCard className="p-8">
          <h2 className="text-xl font-bold text-foreground mb-6 lowercase tracking-tighter">Create Intervention</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Student</label>
              <select className="w-full px-4 py-3 rounded-2xl bg-surface border border-border text-foreground text-sm focus:outline-none focus:border-primary transition-all">
                <option value="">Select student…</option>
                <option>Rahul Mehta</option>
                <option>Sneha Patel</option>
                <option>Arjun Kumar</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Date & Time</label>
              <input type="datetime-local" className="w-full px-4 py-3 rounded-2xl bg-surface border border-border text-foreground text-sm focus:outline-none focus:border-primary transition-all" />
            </div>
          </div>
          <div className="space-y-3 mb-6">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Intervention Type</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {actionTypes.map((a) => (
                <button
                  key={a.label}
                  onClick={() => setSelectedType(a.label)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all',
                    selectedType === a.label ? a.bg : 'bg-surface border-border text-text-muted hover:text-foreground',
                    selectedType === a.label ? a.color : '',
                  )}
                >
                  <a.icon className="w-5 h-5" />
                  {a.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2 mb-6">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Notes</label>
            <textarea className="w-full h-28 p-4 rounded-2xl bg-surface border border-border text-foreground text-sm placeholder:text-text-muted focus:outline-none focus:border-primary transition-all resize-none" placeholder="Add intervention notes…" />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowForm(false)} className="px-6 py-3 rounded-2xl bg-surface border border-border text-xs font-bold text-text-muted hover:text-foreground transition-all uppercase tracking-widest">Cancel</button>
            <button className="px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-xs hover:scale-105 transition-all uppercase tracking-widest">Schedule Intervention</button>
          </div>
        </GlassCard>
      )}

      {/* Outcome summary */}
      <div className="grid grid-cols-3 gap-4">
        {(['improved', 'same', 'worse'] as const).map((outcome) => {
          const count = interventions.filter((i) => i.outcome === outcome).length;
          const cfg   = outcomeConfig[outcome];
          const Icon  = cfg.icon;
          return (
            <GlassCard key={outcome} className="p-6">
              <div className="flex items-center gap-3">
                <div className={cn('p-2.5 rounded-xl border', cfg.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{cfg.label}</p>
                  <p className="text-3xl font-black text-foreground">{count}</p>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Intervention history */}
      <GlassCard className="p-8">
        <h2 className="text-xl font-bold text-foreground mb-6 lowercase tracking-tighter">Intervention History</h2>
        <div className="space-y-4">
          {interventions.map((item) => {
            const cfg  = outcomeConfig[item.outcome];
            const Icon = cfg.icon;
            return (
              <div key={item.id} className="flex flex-col md:flex-row md:items-center gap-5 p-5 rounded-2xl bg-surface border border-border hover:bg-surface-elevated transition-all">
                <div className="w-12 h-12 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center font-bold text-foreground text-sm uppercase shrink-0">
                  {item.student.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-bold text-foreground text-base">{item.student}</h3>
                    <span className="text-[10px] text-text-muted font-medium">{item.type}</span>
                  </div>
                  <p className="text-xs text-text-muted mt-1 italic leading-relaxed">"{item.notes}"</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    {item.date} {item.time}
                  </div>
                  <span className={cn('flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-widest', cfg.color)}>
                    <Icon className="w-3 h-3" /> {cfg.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}

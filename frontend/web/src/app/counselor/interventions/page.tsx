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
    className={cn('rounded-3xl border border-white/5 bg-white/[0.03] backdrop-blur-2xl shadow-premium overflow-hidden', className)}
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
  improved: { label: 'Improved', color: 'bg-teal-500/10 text-teal-400 border-teal-500/20',     icon: TrendingUp },
  same:     { label: 'Same',     color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',   icon: Minus },
  worse:    { label: 'Worse',    color: 'bg-red-500/10 text-red-400 border-red-500/20',         icon: TrendingDown },
};

const actionTypes = [
  { label: 'Schedule Counseling Session', icon: Calendar,     color: 'text-lumina-highlight', bg: 'bg-lumina-highlight/10 border-lumina-highlight/20' },
  { label: 'Assign Support Resources',    icon: BookOpen,     color: 'text-teal-400',         bg: 'bg-teal-500/10 border-teal-500/20' },
  { label: 'Notify Faculty',              icon: Users,        color: 'text-indigo-400',        bg: 'bg-indigo-500/10 border-indigo-500/20' },
  { label: 'Send Message to Student',     icon: MessageSquare,color: 'text-amber-400',         bg: 'bg-amber-500/10 border-amber-500/20' },
];

export default function Interventions() {
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState('');

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            Intervention <span className="gradient-text">Hub</span>
          </h1>
          <p className="text-gray-400 mt-1 font-medium italic">Schedule, track, and measure counseling outcomes</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-lumina-highlight text-black font-bold text-sm hover:scale-105 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]"
        >
          <Zap className="w-4 h-4" /> New Intervention
        </button>
      </div>

      {/* New Intervention Form */}
      {showForm && (
        <GlassCard className="p-8">
          <h2 className="text-xl font-bold text-white mb-6 lowercase tracking-tighter">Create Intervention</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Student</label>
              <select className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-lumina-highlight/40 transition-all">
                <option value="">Select student…</option>
                <option>Rahul Mehta</option>
                <option>Sneha Patel</option>
                <option>Arjun Kumar</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Date & Time</label>
              <input type="datetime-local" className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-lumina-highlight/40 transition-all" />
            </div>
          </div>
          <div className="space-y-3 mb-6">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Intervention Type</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {actionTypes.map((a) => (
                <button
                  key={a.label}
                  onClick={() => setSelectedType(a.label)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all',
                    selectedType === a.label ? a.bg : 'bg-white/5 border-white/10 text-gray-500 hover:text-white',
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
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Notes</label>
            <textarea className="w-full h-28 p-4 rounded-2xl bg-black/40 border border-white/10 text-white text-sm placeholder:text-gray-700 focus:outline-none focus:border-lumina-highlight/40 transition-all resize-none" placeholder="Add intervention notes…" />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowForm(false)} className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold text-gray-400 hover:text-white transition-all uppercase tracking-widest">Cancel</button>
            <button className="px-8 py-3 rounded-2xl bg-lumina-highlight text-black font-bold text-xs hover:scale-105 transition-all uppercase tracking-widest">Schedule Intervention</button>
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
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{cfg.label}</p>
                  <p className="text-3xl font-black text-white">{count}</p>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Intervention history */}
      <GlassCard className="p-8">
        <h2 className="text-xl font-bold text-white mb-6 lowercase tracking-tighter">Intervention History</h2>
        <div className="space-y-4">
          {interventions.map((item) => {
            const cfg  = outcomeConfig[item.outcome];
            const Icon = cfg.icon;
            return (
              <div key={item.id} className="flex flex-col md:flex-row md:items-center gap-5 p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center font-bold text-white text-sm uppercase shrink-0">
                  {item.student.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-bold text-white text-base">{item.student}</h3>
                    <span className="text-[10px] text-gray-500 font-medium">{item.type}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 italic leading-relaxed">"{item.notes}"</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                    <Calendar className="w-3.5 h-3.5 text-lumina-highlight" />
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

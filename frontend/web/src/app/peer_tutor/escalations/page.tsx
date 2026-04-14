"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowUpRight, Clock, CheckCircle2, User } from 'lucide-react';
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

const escalations = [
  { id: 1, question: 'How does the Fourier Transform relate to signal processing?', askedBy: 'Vikram N. · 2nd year', subject: 'Mathematics', escalatedAt: '1h ago', status: 'pending',  faculty: 'Prof. Sharma' },
  { id: 2, question: 'Explain the difference between L1 and L2 regularization',      askedBy: 'Divya M. · 3rd year', subject: 'Machine Learning', escalatedAt: '3h ago', status: 'resolved', faculty: 'Dr. Iyer'   },
  { id: 3, question: 'Why does TCP use a three-way handshake?',                       askedBy: 'Sanjay P. · 2nd year', subject: 'Networks',        escalatedAt: '5h ago', status: 'pending',  faculty: 'Prof. Kumar' },
];

export default function EscalationsPage() {
  const [tab, setTab] = useState<'pending' | 'resolved'>('pending');
  const filtered = escalations.filter((e) => e.status === tab);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            <span className="gradient-text">Escalations</span>
          </h1>
          <p className="text-gray-400 mt-1 font-medium italic">Questions beyond your scope → forwarded to faculty</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
          <AlertTriangle className="w-4 h-4" />
          {escalations.filter(e => e.status === 'pending').length} pending
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5">
        {[
          { label: 'Total Escalated', value: String(escalations.length), icon: ArrowUpRight, color: 'text-amber-400' },
          { label: 'Pending',         value: String(escalations.filter(e => e.status === 'pending').length),  icon: Clock,          color: 'text-red-400' },
          { label: 'Resolved',        value: String(escalations.filter(e => e.status === 'resolved').length), icon: CheckCircle2,   color: 'text-green-400' },
        ].map((s) => (
          <GlassCard key={s.label} className="p-6">
            <s.icon className={cn('w-5 h-5 mb-3', s.color)} />
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">{s.label}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-8">
        <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/5 w-fit mb-8">
          {(['pending', 'resolved'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all',
                tab === t ? 'bg-lumina-primary text-black' : 'text-gray-500 hover:text-white'
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.length === 0 && (
            <p className="text-center text-gray-600 py-12 text-sm">No {tab} escalations.</p>
          )}
          {filtered.map((e) => (
            <div key={e.id} className="flex items-start gap-4 p-6 rounded-2xl glass-v2 border border-white/5 hover:border-white/10 transition-all">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white leading-snug mb-1">{e.question}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1"><User className="w-3 h-3" /> {e.askedBy}</span>
                  <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">{e.subject}</span>
                  <span className="text-[10px] text-gray-600 flex items-center gap-1"><Clock className="w-3 h-3" /> {e.escalatedAt}</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1.5">Assigned to: <span className="text-white font-bold">{e.faculty}</span></p>
              </div>
              <span className={cn(
                'px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider border shrink-0',
                e.status === 'resolved' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
              )}>
                {e.status}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-6 bg-gradient-to-r from-red-500/5 via-transparent to-transparent border border-red-500/10">
        <div className="flex items-center gap-4">
          <AlertTriangle className="w-7 h-7 text-red-400 shrink-0" />
          <div>
            <p className="text-sm font-bold text-white">Escalation prevents wrong teaching</p>
            <p className="text-xs text-gray-500 mt-0.5">
              When you don't know the answer, escalate to faculty. This protects students from incorrect information and maintains quality.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

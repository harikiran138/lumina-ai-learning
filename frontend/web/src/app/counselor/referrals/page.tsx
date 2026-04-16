"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Share2,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Heart,
  BookOpen,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const GlassCard: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className={cn('rounded-3xl border border-border bg-surface-elevated backdrop-blur-2xl shadow-sm overflow-hidden', className)}
  >
    {children}
  </motion.div>
);

const referrals = [
  { id: 'REF-001', student: 'Rahul Mehta',  destination: 'Mental Health Expert', status: 'pending',   date: '2026-03-28', reason: 'Severe burnout indicators and social withdrawal.' },
  { id: 'REF-002', student: 'Sneha Patel',  destination: 'Academic Support',     status: 'accepted',  date: '2026-03-25', reason: 'Persistent academic disengagement and missed deadlines.' },
  { id: 'REF-003', student: 'Arjun Kumar',  destination: 'External Services',    status: 'completed', date: '2026-03-20', reason: 'Family crisis requiring external social services.' },
];

const destinationConfig: Record<string, { icon: React.FC<any>; color: string; bg: string }> = {
  'Mental Health Expert': { icon: Heart,       color: 'text-danger',     bg: 'bg-danger/10' },
  'Academic Support':     { icon: BookOpen,    color: 'text-secondary',  bg: 'bg-secondary/10' },
  'External Services':    { icon: ExternalLink,color: 'text-accent',     bg: 'bg-accent/10' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Pending',   color: 'bg-primary/10 text-primary border-primary/20' },
  accepted:  { label: 'Accepted',  color: 'bg-secondary/10 text-secondary border-secondary/20' },
  completed: { label: 'Completed', color: 'bg-surface text-text-secondary border-border' },
};

export default function Referrals() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-8 pb-12 text-foreground">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
            Referral <span className="gradient-text">System</span>
          </h1>
          <p className="text-text-secondary mt-1 font-medium italic">
            Escalate cases to mental health experts, academic support, or external services
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:scale-105 transition-all shadow-lg"
        >
          <Share2 className="w-4 h-4" /> New Referral
        </button>
      </div>

      {/* New Referral Form */}
      {showForm && (
        <GlassCard className="p-8">
          <h2 className="text-xl font-bold text-foreground mb-6 lowercase tracking-tighter">Create Referral</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Student</label>
              <select className="w-full px-4 py-3 rounded-2xl bg-surface border border-border text-foreground text-sm focus:outline-none focus:border-primary/40 transition-all">
                <option value="">Select student…</option>
                <option>Rahul Mehta</option>
                <option>Sneha Patel</option>
                <option>Arjun Kumar</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Destination</label>
              <select className="w-full px-4 py-3 rounded-2xl bg-surface border border-border text-foreground text-sm focus:outline-none focus:border-primary/40 transition-all">
                <option value="">Select destination…</option>
                <option>Mental Health Expert</option>
                <option>Academic Support</option>
                <option>External Services</option>
              </select>
            </div>
          </div>
          <div className="space-y-2 mb-6">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Referral Reason (aggregated only — no sensitive details)</label>
            <textarea
              className="w-full h-28 p-4 rounded-2xl bg-surface border border-border text-foreground text-sm placeholder:text-text-muted focus:outline-none focus:border-primary/40 transition-all resize-none"
              placeholder="Brief aggregated reason — no personally identifying or sensitive information…"
            />
          </div>
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-[11px] text-text-secondary font-medium leading-relaxed">
                Referrals are logged without exposing sensitive session details. Ensure your reason statement is aggregated and anonymised per Lumina safeguarding policy.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowForm(false)} className="px-6 py-3 rounded-2xl bg-surface border border-border text-xs font-bold text-text-secondary hover:text-foreground transition-all uppercase tracking-widest">Cancel</button>
            <button className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-xs hover:scale-105 transition-all uppercase tracking-widest">
              <Send className="w-3.5 h-3.5" /> Submit Referral
            </button>
          </div>
        </GlassCard>
      )}

      {/* Referral list */}
      <div className="space-y-4">
        {referrals.map((ref) => {
          const destCfg   = destinationConfig[ref.destination] ?? destinationConfig['External Services'];
          const statusCfg = statusConfig[ref.status];
          const Icon      = destCfg.icon;
          return (
            <GlassCard key={ref.id} className="p-6 hover:border-primary/20 transition-all">
              <div className="flex flex-col md:flex-row md:items-center gap-5">
                <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0', destCfg.bg)}>
                  <Icon className={cn('w-6 h-6', destCfg.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-bold text-foreground text-base">{ref.student}</h3>
                    <span className="text-[10px] text-text-muted font-medium">→ {ref.destination}</span>
                    <span className={cn('px-2 py-0.5 rounded-lg text-[10px] font-bold border uppercase tracking-widest', statusCfg.color)}>
                      {statusCfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-1 italic leading-relaxed">"{ref.reason}"</p>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-medium shrink-0">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  {ref.date}
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

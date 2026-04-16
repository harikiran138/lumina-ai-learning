"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Send,
  Users,
  User,
  Shield,
  ChevronRight,
  Clock,
  Lock,
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

const threads = [
  {
    id: 1, with: 'Student (Rahul M.)', role: 'student', lastMsg: 'I have been feeling overwhelmed lately…', time: '5 min ago', unread: 2,
    avatar: 'RM', note: 'Direct 1:1 — full context visible',
  },
  {
    id: 2, with: 'Faculty (Dr. Joshi)', role: 'faculty', lastMsg: 'Flagged student showed no improvement.', time: '1h ago',   unread: 0,
    avatar: 'DJ', note: 'Limited info shared — aggregated only',
  },
  {
    id: 3, with: 'Admin (Aggregated)', role: 'admin',   lastMsg: 'Weekly risk summary submitted.',           time: '3h ago',   unread: 0,
    avatar: 'AD', note: 'Aggregated cohort data only — no individual details',
  },
];

const roleConfig: Record<string, { color: string; icon: React.FC<any>; label: string }> = {
  student: { color: 'text-primary',   icon: User,   label: 'Student' },
  faculty: { color: 'text-accent',    icon: Users,  label: 'Faculty' },
  admin:   { color: 'text-secondary', icon: Shield, label: 'Admin' },
};

export default function Communication() {
  const [activeThread, setActiveThread] = useState(threads[0]);
  const [message, setMessage] = useState('');

  return (
    <div className="space-y-8 pb-12 text-foreground">
      <div>
        <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
          Communication <span className="gradient-text">Hub</span>
        </h1>
        <p className="text-text-secondary mt-1 font-medium italic">
          Controlled visibility — student (full), faculty (limited), admin (aggregated)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Thread list */}
        <div className="space-y-3">
          {threads.map((thread) => {
            const cfg  = roleConfig[thread.role];
            const Icon = cfg.icon;
            return (
              <div
                key={thread.id}
                onClick={() => setActiveThread(thread)}
                className={cn(
                  'p-5 rounded-3xl border cursor-pointer transition-all',
                  activeThread.id === thread.id
                    ? 'bg-primary/10 border-primary/30'
                    : 'bg-surface border-border hover:bg-surface-elevated',
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-border flex items-center justify-center font-bold text-foreground text-xs uppercase shrink-0">
                    {thread.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-foreground text-sm truncate">{thread.with}</p>
                      {thread.unread > 0 && (
                        <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-[9px] font-black text-primary-foreground shrink-0">
                          {thread.unread}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-text-muted truncate mt-0.5">{thread.lastMsg}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Icon className={cn('w-3 h-3', cfg.color)} />
                      <span className={cn('text-[9px] font-bold uppercase tracking-widest', cfg.color)}>{cfg.label}</span>
                      <span className="text-[9px] text-text-muted ml-auto">{thread.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chat workspace */}
        <div className="lg:col-span-2">
          <GlassCard className="p-8 flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between pb-6 border-b border-border mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-surface border border-border flex items-center justify-center font-bold text-foreground text-sm uppercase">
                  {activeThread.avatar}
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">{activeThread.with}</h3>
                  <p className="text-[10px] text-text-muted font-medium italic mt-0.5">{activeThread.note}</p>
                </div>
              </div>
              {activeThread.role !== 'student' && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20">
                  <Lock className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Restricted View</span>
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-4 mb-6">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-surface-elevated flex items-center justify-center text-[10px] font-bold text-foreground uppercase shrink-0 border border-border">
                  {activeThread.avatar}
                </div>
                <div className="bg-surface border border-border rounded-2xl rounded-tl-sm p-4 max-w-sm">
                  <p className="text-sm text-text-secondary">{activeThread.lastMsg}</p>
                  <p className="text-[9px] text-text-muted mt-2">{activeThread.time}</p>
                </div>
              </div>
            </div>

            {/* Message input */}
            <div className="flex items-end gap-3 pt-6 border-t border-border">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message…"
                className="flex-1 h-16 p-4 rounded-2xl bg-surface border border-border text-foreground text-sm placeholder:text-text-muted focus:outline-none focus:border-primary/40 transition-all resize-none shadow-inner"
              />
              <button
                onClick={() => setMessage('')}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs hover:scale-105 transition-all uppercase tracking-widest"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

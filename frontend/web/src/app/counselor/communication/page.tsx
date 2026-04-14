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
    className={cn('rounded-3xl border border-white/5 bg-white/[0.03] backdrop-blur-2xl shadow-premium overflow-hidden', className)}
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
  student: { color: 'text-lumina-highlight', icon: User,    label: 'Student' },
  faculty: { color: 'text-indigo-400',       icon: Users,   label: 'Faculty' },
  admin:   { color: 'text-teal-400',         icon: Shield,  label: 'Admin' },
};

export default function Communication() {
  const [activeThread, setActiveThread] = useState(threads[0]);
  const [message, setMessage] = useState('');

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-4xl font-display font-bold text-white tracking-tight">
          Communication <span className="gradient-text">Hub</span>
        </h1>
        <p className="text-gray-400 mt-1 font-medium italic">
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
                    ? 'bg-lumina-highlight/10 border-lumina-highlight/30'
                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]',
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center font-bold text-white text-xs uppercase shrink-0">
                    {thread.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-white text-sm truncate">{thread.with}</p>
                      {thread.unread > 0 && (
                        <span className="w-4 h-4 rounded-full bg-lumina-highlight flex items-center justify-center text-[9px] font-black text-black shrink-0">
                          {thread.unread}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-600 truncate mt-0.5">{thread.lastMsg}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Icon className={cn('w-3 h-3', cfg.color)} />
                      <span className={cn('text-[9px] font-bold uppercase tracking-widest', cfg.color)}>{cfg.label}</span>
                      <span className="text-[9px] text-gray-600 ml-auto">{thread.time}</span>
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
            <div className="flex items-center justify-between pb-6 border-b border-white/5 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center font-bold text-white text-sm uppercase">
                  {activeThread.avatar}
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{activeThread.with}</h3>
                  <p className="text-[10px] text-gray-500 font-medium italic mt-0.5">{activeThread.note}</p>
                </div>
              </div>
              {activeThread.role !== 'student' && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Restricted View</span>
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-4 mb-6">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[10px] font-bold text-white uppercase shrink-0">
                  {activeThread.avatar}
                </div>
                <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-sm p-4 max-w-sm">
                  <p className="text-sm text-gray-300">{activeThread.lastMsg}</p>
                  <p className="text-[9px] text-gray-600 mt-2">{activeThread.time}</p>
                </div>
              </div>
            </div>

            {/* Message input */}
            <div className="flex items-end gap-3 pt-6 border-t border-white/5">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message…"
                className="flex-1 h-16 p-4 rounded-2xl bg-black/40 border border-white/10 text-white text-sm placeholder:text-gray-700 focus:outline-none focus:border-lumina-highlight/40 transition-all resize-none shadow-inner"
              />
              <button
                onClick={() => setMessage('')}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-lumina-highlight text-black font-bold text-xs hover:scale-105 transition-all uppercase tracking-widest"
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

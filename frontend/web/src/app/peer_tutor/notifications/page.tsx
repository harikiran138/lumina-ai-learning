"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCircle2, MessageSquare, Award, Users, AlertTriangle, X } from 'lucide-react';
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

type NotifType = 'question' | 'credit' | 'group' | 'escalation' | 'system';

const notifIcon: Record<NotifType, React.ElementType> = {
  question:   MessageSquare,
  credit:     Award,
  group:      Users,
  escalation: AlertTriangle,
  system:     Bell,
};

const notifColor: Record<NotifType, string> = {
  question:   'text-lumina-primary bg-lumina-primary/10',
  credit:     'text-amber-400 bg-amber-500/10',
  group:      'text-blue-400 bg-blue-500/10',
  escalation: 'text-red-400 bg-red-500/10',
  system:     'text-gray-400 bg-white/5',
};

interface Notification {
  id: number;
  type: NotifType;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const initialNotifications: Notification[] = [
  { id: 1, type: 'question',   title: 'New Question',          message: 'Arjun S. asked: "Explain recursion with a real-world example"',           time: '2m ago',    read: false },
  { id: 2, type: 'credit',     title: 'Credits Earned',        message: 'You earned +5 credits for hosting the DSA Mastery Squad session.',          time: '1h ago',    read: false },
  { id: 3, type: 'group',      title: 'Session Reminder',      message: 'Your JS Deep Dive session starts in 30 minutes.',                           time: '30m ago',   read: false },
  { id: 4, type: 'escalation', title: 'Escalation Resolved',   message: 'Prof. Sharma answered the Fourier Transform question you escalated.',        time: '2h ago',    read: true  },
  { id: 5, type: 'credit',     title: 'Faculty Recognition',   message: 'Dr. Iyer recognized your outstanding answer on ML regularization. +10 credits.', time: '1 day ago', read: true },
  { id: 6, type: 'system',     title: 'Certificate Available', message: 'You have crossed 1,000 credits! Your Gold Mentor certificate is ready.',    time: '2 days ago',read: true  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAll = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const dismiss = (id: number) => setNotifications((prev) => prev.filter((n) => n.id !== id));

  const displayed = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            <span className="gradient-text">Notifications</span>
          </h1>
          <p className="text-gray-400 mt-1 font-medium italic">Stay up to date with questions, credits, and group activity</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-lumina-primary/10 border border-lumina-primary/20 text-lumina-primary text-xs font-bold">
              <Bell className="w-4 h-4" /> {unreadCount} unread
            </div>
          )}
          <button
            onClick={markAll}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> Mark all read
          </button>
        </div>
      </div>

      <GlassCard className="p-8">
        <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/5 w-fit mb-8">
          {(['all', 'unread'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all',
                filter === f ? 'bg-lumina-primary text-black' : 'text-gray-500 hover:text-white'
              )}
            >
              {f === 'all' ? `All (${notifications.length})` : `Unread (${unreadCount})`}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {displayed.length === 0 && (
            <p className="text-center text-gray-600 py-12 text-sm">No notifications.</p>
          )}
          {displayed.map((n) => {
            const Icon = notifIcon[n.type];
            return (
              <div
                key={n.id}
                className={cn(
                  'flex items-start gap-4 p-5 rounded-2xl border transition-all',
                  n.read ? 'glass-v2 border-white/5' : 'bg-white/[0.04] border-lumina-primary/15'
                )}
              >
                <div className={cn('p-2.5 rounded-xl shrink-0 mt-0.5', notifColor[n.type])}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold text-white">{n.title}</span>
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-lumina-primary shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-gray-600 mt-1">{n.time}</p>
                </div>
                <button
                  onClick={() => dismiss(n.id)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-600 hover:text-white shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}

"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock,
  X,
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

const notifications = [
  { id: 1, type: 'high',    title: 'High-risk alert: Rahul Mehta',     body: 'No activity detected for 3 consecutive days. Immediate intervention recommended.',          time: '2 min ago',  read: false },
  { id: 2, type: 'high',    title: 'Assignment streak broken: Sneha P.', body: '3 consecutive assignments missed. Risk score elevated to 67%.',                           time: '15 min ago', read: false },
  { id: 3, type: 'medium',  title: 'Engagement drop detected',          body: 'Arjun Kumar\'s platform activity dropped 62% compared to 2-week baseline.',               time: '1h ago',     read: false },
  { id: 4, type: 'success', title: 'Intervention outcome updated',      body: 'Priya Sharma\'s risk score improved by 14 points following counseling session.',           time: '3h ago',     read: true  },
  { id: 5, type: 'info',    title: 'Referral accepted',                  body: 'Sneha Patel\'s academic support referral has been accepted by the support team.',          time: '5h ago',     read: true  },
  { id: 6, type: 'info',    title: 'Weekly risk summary ready',          body: 'Your April Week 1 cohort wellness report is ready for review and download.',               time: '1d ago',     read: true  },
  { id: 7, type: 'medium',  title: 'Follow-up reminder: Kiran Desai',   body: 'Scheduled 2-week follow-up is due today. Please review and update intervention status.',   time: '1d ago',     read: true  },
];

const typeConfig: Record<string, { icon: React.FC<any>; color: string; bg: string; dot: string }> = {
  high:    { icon: AlertCircle,  color: 'text-danger',     bg: 'bg-danger/10',     dot: 'bg-danger' },
  medium:  { icon: AlertTriangle,color: 'text-warning',   bg: 'bg-warning/10',   dot: 'bg-warning' },
  success: { icon: CheckCircle2, color: 'text-success',    bg: 'bg-success/10',    dot: 'bg-success' },
  info:    { icon: Info,         color: 'text-info',  bg: 'bg-info/10',  dot: 'bg-info' },
};

export default function Notifications() {
  const [items, setItems]   = useState(notifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const markAllRead = () => setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  const dismiss     = (id: number) => setItems((prev) => prev.filter((n) => n.id !== id));

  const displayed = filter === 'unread' ? items.filter((n) => !n.read) : items;
  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground tracking-tight flex items-center gap-3">
            Notifications
            {unreadCount > 0 && (
              <span className="px-3 py-1 rounded-full bg-danger/10 text-danger text-sm font-bold border border-danger/20">
                {unreadCount} New
              </span>
            )}
          </h1>
          <p className="text-text-muted mt-1 font-medium italic">Real-time risk signals, intervention updates, and system alerts</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-surface border border-border rounded-xl p-1">
            {(['all', 'unread'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all',
                  filter === f ? 'bg-primary text-primary-foreground' : 'text-text-muted hover:text-foreground',
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={markAllRead}
            className="px-5 py-2.5 rounded-xl bg-surface border border-border text-text-muted hover:text-foreground transition-all font-bold text-[10px] uppercase tracking-widest"
          >
            Mark All Read
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {displayed.map((n) => {
          const cfg  = typeConfig[n.type];
          const Icon = cfg.icon;
          return (
            <GlassCard
              key={n.id}
              className={cn('p-5 transition-all', !n.read && 'border-l-2 border-l-lumina-highlight/40')}
            >
              <div className="flex items-start gap-4">
                <div className={cn('p-2.5 rounded-xl shrink-0 mt-0.5', cfg.bg)}>
                  <Icon className={cn('w-4 h-4', cfg.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className={cn('font-bold text-sm', n.read ? 'text-text-secondary' : 'text-foreground')}>{n.title}</p>
                      <p className="text-xs text-text-muted mt-1 leading-relaxed">{n.body}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-text-muted font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {n.time}
                      </span>
                      {!n.read && <span className={cn('w-2 h-2 rounded-full shrink-0', cfg.dot)} />}
                      <button
                        onClick={() => dismiss(n.id)}
                        className="p-1 rounded-lg hover:bg-surface text-text-muted hover:text-foreground transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          );
        })}
        {displayed.length === 0 && (
          <div className="py-16 text-center opacity-30 italic text-text-muted">
            {filter === 'unread' ? 'No unread notifications.' : 'No notifications.'}
          </div>
        )}
      </div>
    </div>
  );
}

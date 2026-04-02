"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, Users, Calendar, Briefcase, Star, MessageCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const GlassCard: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn(
      'rounded-3xl border border-white/5 bg-white/[0.03] backdrop-blur-2xl shadow-premium overflow-hidden',
      className
    )}
  >
    {children}
  </motion.div>
);

const TYPE_META: Record<string, { icon: React.FC<any>; color: string }> = {
  request:  { icon: Users,         color: 'text-amber-400'  },
  session:  { icon: Calendar,      color: 'text-purple-400' },
  job:      { icon: Briefcase,     color: 'text-blue-400'   },
  feedback: { icon: Star,          color: 'text-green-400'  },
  message:  { icon: MessageCircle, color: 'text-pink-400'   },
  system:   { icon: Info,          color: 'text-gray-400'   },
};

interface Notification {
  id: number;
  type: keyof typeof TYPE_META;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 1, type: 'request',  title: 'New Mentee Request',       body: 'Arjun Sharma (Final Year CSE) requested a Mock Interview session.',           time: '2 min ago',   read: false },
  { id: 2, type: 'session',  title: 'Session Reminder',         body: 'You have a session with Rahul Kumar today at 4:00 PM — System Design Prep.',   time: '1 hr ago',    read: false },
  { id: 3, type: 'job',      title: 'Job Post Approved',        body: 'Your post "Software Engineer — Backend" at Acme Corp has been approved.',      time: '3 hr ago',    read: false },
  { id: 4, type: 'feedback', title: 'Feedback Score Updated',   body: 'Your curriculum feedback for Data Structures has been reviewed by the HOD.',   time: 'Yesterday',   read: true  },
  { id: 5, type: 'message',  title: 'Message from Sneha Iyer',  body: 'Thanks for the resume review session! It was really helpful.',                 time: 'Yesterday',   read: true  },
  { id: 6, type: 'system',   title: 'Alumni Network Update',    body: 'Kavya Reddy from your batch just joined the Alumni Network.',                  time: '2 days ago',  read: true  },
  { id: 7, type: 'request',  title: 'New Mentee Request',       body: 'Priya Nair (Pre-Final ECE) requested Career Guidance.',                        time: '2 days ago',  read: true  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const markRead = (id: number) =>
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));

  const unreadCount = notifications.filter((n) => !n.read).length;
  const displayed   = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            <span className="gradient-text">Notifications</span>
          </h1>
          <p className="text-gray-400 mt-1 font-medium italic">Stay updated on mentee requests, sessions, and platform events</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <span className="px-3 py-1.5 rounded-xl bg-red-500/15 border border-red-500/20 text-red-300 text-xs font-bold uppercase tracking-widest">
              {unreadCount} unread
            </span>
          )}
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-all"
          >
            <CheckCheck className="w-4 h-4 text-green-400" /> Mark All Read
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['all', 'unread'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={cn(
              'px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all',
              filter === t
                ? 'bg-lumina-highlight/15 text-lumina-highlight border border-lumina-highlight/30'
                : 'bg-white/5 text-gray-500 border border-white/5 hover:text-gray-300',
            )}
          >
            {t === 'all' ? `All (${notifications.length})` : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {displayed.length === 0 ? (
          <div className="py-16 text-center rounded-3xl border border-white/5 bg-white/[0.02] text-gray-600 italic font-display">
            You're all caught up! 🎉
          </div>
        ) : (
          displayed.map((notif) => {
            const meta = TYPE_META[notif.type];
            return (
              <GlassCard
                key={notif.id}
                className={cn('p-5 cursor-pointer hover:border-amber-500/15 transition-all', !notif.read && 'border-amber-500/10 bg-amber-500/[0.02]')}
              >
                <div className="flex items-start gap-4" onClick={() => markRead(notif.id)}>
                  <div className={cn('p-2.5 rounded-xl bg-white/5 border border-white/5 shrink-0', meta.color)}>
                    <meta.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-bold text-white text-sm">{notif.title}</h4>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{notif.body}</p>
                    <p className="mt-1.5 text-[10px] text-gray-600 font-bold uppercase tracking-widest">{notif.time}</p>
                  </div>
                </div>
              </GlassCard>
            );
          })
        )}
      </div>
    </div>
  );
}
